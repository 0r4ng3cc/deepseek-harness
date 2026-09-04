import { defineConfig } from 'tsdown'

/** dsh-auth 只有一个公共插件入口；其余模块由 tsc 产物按 exports 暴露。 */
export default defineConfig({
  entry: ['lib/types/index.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
})
