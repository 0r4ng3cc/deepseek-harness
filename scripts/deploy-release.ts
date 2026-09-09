/**
 * 构建可分发成品并（可选）上传到 GitHub Release——不经过 npm 发布。
 *
 * 流程：`pnpm run build` → 把 `@deepseek-ai/dsh` 及其完整依赖闭包
 * `pnpm deploy` 成自包含目录 → 实体化软链接（部署产物里指向仓库的
 * `vendor/*` 链接解包后必然失效）→ 打 tar.gz + SHA256SUMS。
 *
 * 用法：
 *   pnpm exec tsx scripts/deploy-release.ts                  # 只出成品包
 *   pnpm exec tsx scripts/deploy-release.ts --upload         # 出包并传到 GitHub Release
 *   pnpm exec tsx scripts/deploy-release.ts --skip-build     # 复用已有 lib/ 产物
 */

import { createHash } from 'node:crypto'
import { cp, lstat, mkdir, readFile, readdir, realpath, rm, stat } from 'node:fs/promises'
import { createReadStream, readFileSync } from 'node:fs'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { parseArgs } from 'node:util'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
/** 成品里的启动器包；它的依赖闭包决定成品内容。 */
const LAUNCHER_PACKAGE = '@deepseek-ai/dsh'
/** 部署目录与产物目录。 */
const STAGING_DIR = join(ROOT, 'dist', 'deploy')
const OUTPUT_DIR = join(ROOT, 'dist', 'release')

/** 本机平台标识，用于成品文件名。 */
function platformTag(): string {
  const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
  return `${process.platform}-${arch}`
}

/** 读取根 package.json 的版本号。 */
async function rootVersion(): Promise<string> {
  const manifest = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8')) as { version?: string }
  if (typeof manifest.version !== 'string' || manifest.version === '') {
    throw new Error('deploy-release: 根 package.json 缺少 version')
  }
  return manifest.version
}

/** 跑一条命令，继承 stdio，失败即抛。 */
function run(command: string, args: string[]): void {
  execFileSync(command, args, { cwd: ROOT, stdio: 'inherit' })
}

/**
 * pnpm 的候选调用方式：优先 `npm_execpath`（`pnpm run` 与 CI 的
 * pnpm/action-setup 都会把它指向 pnpm 的 JS 入口，Windows 上直接可执行），
 * 否则用 PATH 上的 pnpm。
 * @returns 命令与前置参数（不含本次要传的 pnpm 参数）。
 */
function pnpmCandidate(): { command: string; prefix: string[] } {
  const entrypoint = process.env.npm_execpath?.trim()
  if (entrypoint !== undefined && entrypoint !== '' && entrypoint.includes('pnpm')) {
    const extension = extname(entrypoint).toLowerCase()
    if (extension === '.js' || extension === '.cjs' || extension === '.mjs') {
      return { command: process.execPath, prefix: [entrypoint] }
    }
    if (extension !== '.cmd') return { command: entrypoint, prefix: [] }
  }
  return { command: 'pnpm', prefix: [] }
}

/** 候选 pnpm 的主版本号；探测失败返回 0。 */
function pnpmMajor(candidate: { command: string; prefix: string[] }): number {
  try {
    const raw = execFileSync(candidate.command, [...candidate.prefix, '--version'], { encoding: 'utf8' }).trim()
    return Number.parseInt(raw.split('.')[0] ?? '0', 10)
  } catch {
    return 0
  }
}

/**
 * `deploy --legacy` 需要 pnpm 11。候选（可能是旧的全局安装）版本不够时，
 * 改用仓库 `packageManager` 钉住的版本（经 npx 取用，不动全局安装）。
 * @param args - pnpm 参数。
 * @returns 实际要执行的命令与参数。
 */
function pnpmCommand(args: string[]): { command: string; args: string[] } {
  const candidate = pnpmCandidate()
  const major = pnpmMajor(candidate)
  const pinned = /^pnpm@(.+)$/.exec(pnpmVersionPin())?.[1]
  if (pinned !== undefined && pinned !== '' && major < 11) {
    console.log(`deploy-release: 检测到 pnpm ${major}.x（不支持 deploy --legacy），改用钉住的 pnpm@${pinned}`)
    return { command: 'npx', args: ['--yes', `pnpm@${pinned}`, ...args] }
  }
  if (major === 0) {
    throw new Error('deploy-release: 找不到可用的 pnpm；请经 `pnpm run deploy:release` 调用，或把 pnpm 放进 PATH。')
  }
  return { command: candidate.command, args: [...candidate.prefix, ...args] }
}

/** 根 package.json 的 `packageManager` 字段。 */
function pnpmVersionPin(): string {
  const raw = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { packageManager?: string }
  return raw.packageManager ?? ''
}

/**
 * `pnpm deploy` 的扁平布局会把部分 vendor 包以软链接留在原地；解包后这些
 * 链接必然指向不存在的仓库路径。这里把每个软链接替换成真实文件。
 * @param directory - 待实体化的目录。
 */
async function materializeSymlinks(directory: string): Promise<number> {
  let replaced = 0
  const walk = async (dir: string): Promise<void> => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      const info = await lstat(path)
      if (info.isSymbolicLink()) {
        const target = await realpath(path)
        const nested = join(target, 'node_modules')
        const targetStat = await stat(target).catch(() => undefined)
        if (targetStat === undefined) {
          throw new Error(`deploy-release: 软链接目标不存在：${path} → ${target}`)
        }
        await rm(path, { recursive: true, force: true })
        await cp(target, path, {
          recursive: true,
          dereference: true,
          filter: source => source !== nested && !source.startsWith(nested + sep),
        })
        replaced += 1
        continue
      }
      if (info.isDirectory()) await walk(path)
    }
  }
  await walk(directory)
  return replaced
}


/** 工作区内 package name → 源码目录的索引。 */
async function workspaceIndex(): Promise<Map<string, string>> {
  const index = new Map<string, string>()
  for (const base of ['vendor', 'packages', 'apps', 'native']) {
    const root = join(ROOT, base)
    if (!(await stat(root).catch(() => undefined))) continue
    await walkManifests(root, async (dir) => {
      const manifest = JSON.parse(await readFile(join(dir, 'package.json'), 'utf8')) as { name?: unknown }
      if (typeof manifest.name === 'string' && !index.has(manifest.name)) index.set(manifest.name, dir)
    })
  }
  return index
}

/** 递归找所有非 node_modules 下的 package.json 目录。 */
async function walkManifests(dir: string, visit: (dir: string) => Promise<void>): Promise<void> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  if (entries.some(entry => entry.isFile() && entry.name === 'package.json')) await visit(dir)
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === 'node_modules' || entry.name === '.git') continue
    await walkManifests(join(dir, entry.name), visit)
  }
}

const IMPORT_SPEC = /(?:from|import)\s*\(?\s*['"](@[a-z0-9-]+\/[a-z0-9._-]+)['"]/gu

/**
 * 部署后的扁平树会丢两类包：pnpm 遗留 hoist 放在仓库侧的、以及消费者没声明
 * 的幽灵依赖（靠工作区 hoist 才解析得到）。两类都只能按**实际 import**
 * 扫出来。这里反复扫描已落地的 JS，把工作区里存在、部署树里缺失的包复制
 * 过去，直到不再有新缺失。
 * @param stage - 部署目录。
 * @returns 补进去的包名（按发现顺序）。
 */
async function repairClosure(stage: string): Promise<string[]> {
  const index = await workspaceIndex()
  const nodeModules = join(stage, 'node_modules')
  const copied: string[] = []
  for (let round = 1; round <= 12; round += 1) {
    const present = new Set<string>()
    const needed = new Set<string>()
    await walkJs(nodeModules, async (file) => {
      const source = await readFile(file, 'utf8').catch(() => '')
      for (const match of source.matchAll(IMPORT_SPEC)) {
        const name = match[1] ?? ''
        if (name === '') continue
        const segments = name.split('/')
        const packageName = name.startsWith('@') ? `${segments[0]}/${segments[1]}` : segments[0]!
        needed.add(packageName)
      }
    })
    for (const entry of await readdir(nodeModules, { withFileTypes: true }).catch(() => [])) {
      if (entry.name.startsWith('@')) {
        for (const nested of await readdir(join(nodeModules, entry.name), { withFileTypes: true }).catch(() => [])) {
          present.add(`${entry.name}/${nested.name}`)
        }
      } else {
        present.add(entry.name)
      }
    }
    const missing = [...needed].filter(name => !present.has(name) && index.has(name))
    if (missing.length === 0) return copied
    for (const name of missing.sort()) {
      const source = index.get(name)!
      const destination = join(nodeModules, name)
      await mkdir(dirname(destination), { recursive: true })
      await cp(source, destination, {
        recursive: true,
        dereference: true,
        filter: path => !path.includes(`${sep}node_modules${sep}`) && !path.endsWith(`${sep}node_modules`),
      })
      copied.push(name)
      console.log(`deploy-release: 补入缺失依赖 ${name}`)
    }
  }
  throw new Error('deploy-release: 依赖闭包补全超过 12 轮仍未收敛')
}

/** 递归遍历目录下的 .js 文件。 */
async function walkJs(dir: string, visit: (file: string) => Promise<void>): Promise<void> {
  for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) await walkJs(path, visit)
    else if (entry.isFile() && path.endsWith('.js')) await visit(path)
  }
}

/** 逐块算文件 sha256。 */
async function sha256(path: string): Promise<string> {
  const hash = createHash('sha256')
  await new Promise<void>((resolveStream, rejectStream) => {
    createReadStream(path)
      .on('data', chunk => hash.update(chunk))
      .on('end', () => resolveStream())
      .on('error', rejectStream)
  })
  return hash.digest('hex')
}

/** 解析命令行。 */
function parseCli(): { upload: boolean; skipBuild: boolean; tag: string | undefined } {
  // `pnpm run deploy:release -- --skip-build` 会把 `--` 原样传进来；它一旦
  // 出现，Node 的 parseArgs 就把后面的选项全当位置参数，所以先剥掉。
  const argv = process.argv.slice(2)
  if (argv[0] === '--') argv.shift()
  const { values } = parseArgs({
    args: argv,
    options: {
      upload: { type: 'boolean', default: false },
      'skip-build': { type: 'boolean', default: false },
      tag: { type: 'string' },
    },
    allowPositionals: true,
  })
  return { upload: values.upload === true, skipBuild: values['skip-build'] === true, tag: values.tag }
}

async function main(): Promise<void> {
  const cli = parseCli()
  const version = await rootVersion()
  const tag = cli.tag ?? `v${version}`
  const platform = platformTag()
  const artifact = `deepseek-harness-${version}-${platform}.tar.gz`
  const artifactPath = join(OUTPUT_DIR, artifact)

  if (cli.skipBuild) {
    console.log('deploy-release: 跳过构建（--skip-build）')
  } else {
    console.log('deploy-release: 构建工作区…')
    const build = pnpmCommand(['run', 'build'])
    run(build.command, build.args)
  }

  console.log(`deploy-release: 部署 ${LAUNCHER_PACKAGE} 的依赖闭包…`)
  await rm(STAGING_DIR, { recursive: true, force: true })
  await mkdir(dirname(STAGING_DIR), { recursive: true })
  const deploy = pnpmCommand([
    '--filter', LAUNCHER_PACKAGE,
    'deploy', STAGING_DIR,
    '--legacy',
    '--prod',
    '--config.node-linker=hoisted',
    '--config.auto-install-peers=false',
    '--config.link-workspace-packages=true',
  ])
  run(deploy.command, deploy.args)

  const replaced = await materializeSymlinks(STAGING_DIR)
  console.log(`deploy-release: 实体化软链接 ${replaced} 个`)

  console.log('deploy-release: 按实际 import 补全依赖闭包…')
  const repaired = await repairClosure(STAGING_DIR)
  console.log(`deploy-release: 闭包补入 ${repaired.length} 个包`)

  console.log('deploy-release: 验证部署树能启动…')
  const help = execFileSync('node', [join(STAGING_DIR, 'lib', 'bin.js'), '--help'], { encoding: 'utf8' })
  if (!help.includes('xfdsh') || !help.includes('tui')) {
    throw new Error('deploy-release: 部署树启动校验失败（--help 输出不含 xfdsh / tui）')
  }
  // 真启动校验：--dump-config 会完整装载 profile 的 loader 树，能暴露
  // 只有启动路径才 import 到的缺失包（--help 不碰 loader）。
  const dump = execFileSync('node', [join(STAGING_DIR, 'lib', 'bin.js'), 'tui', '--dump-config'], {
    encoding: 'utf8',
    env: { ...process.env, DSH_TELEMETRY_DISABLED: '1' },
  })
  if (!dump.includes('dsh-tui')) {
    throw new Error('deploy-release: 部署树 tui profile 装载校验失败（--dump-config 未包含 dsh-tui）')
  }

  await mkdir(OUTPUT_DIR, { recursive: true })
  await rm(artifactPath, { force: true })
  console.log(`deploy-release: 打包 ${artifact}…`)
  run('tar', ['-czf', artifactPath, '-C', STAGING_DIR, '.'])

  const digest = await sha256(artifactPath)
  const sumsPath = join(OUTPUT_DIR, 'SHA256SUMS')
  await rm(sumsPath, { force: true })
  const { writeFile } = await import('node:fs/promises')
  await writeFile(sumsPath, `${digest}  ${artifact}\n`, 'utf8')

  console.log(`deploy-release: 成品 ${artifactPath}`)
  console.log(`deploy-release: 校验 ${sumsPath}`)

  if (!cli.upload) {
    console.log('deploy-release: 未加 --upload，跳过上传')
    return
  }
  console.log(`deploy-release: 上传到 GitHub Release ${tag}…`)
  execFileSync('gh', [
    'release', 'create', tag,
    '--title', tag,
    '--notes', `DeepSeek Harness ${version}（${platform}）`,
    artifactPath, sumsPath,
  ], { cwd: ROOT, stdio: 'inherit' })
  console.log('deploy-release: 上传完成')
}

await main()
