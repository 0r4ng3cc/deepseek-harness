/**
 * 清空本包的编译产物，让 compile 从空树开始。
 *
 * 只删 lib/（tsc 与 tsdown 的 outDir）。`.dsh-std-types/` 由
 * tsconfig.dsh-std.json 的增量构建自己管理，删掉会迫使协议层重编。
 */
import { rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const lib = fileURLToPath(new URL('../lib', import.meta.url))
await rm(lib, { recursive: true, force: true })
console.log('clean-lib: removed lib/')
