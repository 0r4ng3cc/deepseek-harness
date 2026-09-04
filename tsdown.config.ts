import { defineConfig } from 'tsdown'
import { typertPlugin } from './packages/typert/generator/lib/types/tsdown-plugin.js'

function isBuildFaceClient(value: unknown): boolean {
  if (value === undefined || value === 'host') return false
  if (value === 'client') return true
  throw new Error(`tsdown: --env.DSH_BUILD_FACE must be host or client, received ${String(value)}`)
}

/**
 * The ordinary workspace build consumes JavaScript emitted by the Host
 * TypeScript project and runs Typert. The Client pass selects packages that
 * declare a browser bundle and lets their package-local configs emit both
 * their Node loader entry and browser artifact.
 */
export default defineConfig(({ env }) => {
  const client = isBuildFaceClient(env?.DSH_BUILD_FACE)
  return {
    // dsh-std 是内置协议源码仓库，顶层 package 仅作为 source container，不能被
    // tsdown 当成可发布 workspace package 扫描；下面列出真正参与宿主构建的 vendor。
    workspace: [
      'vendor/cordis',
      'vendor/cosmokit',
      'vendor/group',
      'vendor/hmr',
      'vendor/include',
      'vendor/loader',
      'vendor/logger-console',
      'vendor/schemastery',
      'vendor/timer',
      'packages/*/*',
      'apps/cli',
    ],
    entry: client ? '' : ['lib/types/{index,invariant,startup}.js'],
    outDir: 'lib',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
    plugins: client ? [] : [typertPlugin({ mode: 'workspace', faces: ['host'] })],
  }
})
