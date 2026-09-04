import { defineConfig } from 'tsdown'

/** TUI 的插件入口与 invariant companion 独立输出；其它 exports 保留 tsc 模块边界。 */
export default defineConfig([
  {
    // 直接从 src 构建，避免 tsdown 改写 lib 后被下一轮增量编译当成入口。
    entry: ['src/index.ts'],
    outDir: 'lib/types',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
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
