import { defineConfig } from 'tsdown'

/** TUI 的插件入口与 invariant companion 独立输出；其它 exports 保留 tsc 模块边界。 */
export default defineConfig([
  {
    entry: ['lib/types/index.js'],
    outDir: 'lib/types',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
  },
  {
    entry: ['lib/types/dsh-adapter/invariant.js'],
    outDir: 'lib/types/dsh-adapter',
    format: ['esm'],
    platform: 'node',
    target: 'es2024',
    fixedExtension: false,
    dts: false,
    clean: false,
  },
])
