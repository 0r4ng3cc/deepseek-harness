/**
 * Ambient typings for Ink vendor packages that ship without types.
 * Keep this file a script (no import/export) so the declarations are
 * ambient modules rather than augmentations of missing packages.
 */

declare module 'stack-utils' {
  interface StackUtilsOptions {
    cwd?: string
    internals?: RegExp[]
  }
  interface CallSite {
    file?: string
    line?: number
    column?: number
    function?: string
  }
  class StackUtils {
    constructor(options?: StackUtilsOptions)
    parseLine(line: string): CallSite | null
    static nodeInternals(): RegExp[]
  }
  export default StackUtils
}

declare module 'bidi-js' {
  interface BidiEngine {
    getEmbeddingLevels: (text: string, implicit?: string) => { levels: number[] }
  }
  export default function bidiFactory(): BidiEngine
}
