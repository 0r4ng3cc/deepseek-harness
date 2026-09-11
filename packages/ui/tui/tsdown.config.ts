import { defineConfig } from 'tsdown'

/**
 * TUI 的运行时入口独立打包；其它 exports 保留 tsc 模块边界。
 *
 * 内置协议包（`@dsh-std/*`）不进 npm 依赖图：它们由 tsdown
 * 内联进各入口产物。这样包可以正常 `pnpm pack`——原先靠
 * `bundledDependencies` 携带它们，而 bundledDependencies 要求工作区用
 * `node-linker=hoisted`，本仓是 isolated 链接，pnpm 直接拒绝打包。
 */
const BUNDLED_DEPS = [/^@dsh-std\//]

/** profile patch 会挂载的运行时入口（其余 exports 保持 tsc 输出）。 */
const RUNTIME_ENTRIES = [
  'src/index.ts',
  'src/api.ts',
  'src/workspaces.ts',
  'src/command-trees.ts',
  'src/settings-sections.ts',
  'src/scenes.ts',
  'src/plugin-host.ts',
  'src/extensions.ts',
  'src/test-utils.ts',
]

export default defineConfig([
  {
    // 直接从 src 构建，避免 tsdown 改写 lib 后被下一轮增量编译当成入口。
    entry: RUNTIME_ENTRIES,
    outDir: 'lib/types',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
    deps: { alwaysBundle: BUNDLED_DEPS },
  },
  {
    entry: ['src/dsh-adapter/invariant.ts'],
    outDir: 'lib/types/dsh-adapter',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
  },
])
