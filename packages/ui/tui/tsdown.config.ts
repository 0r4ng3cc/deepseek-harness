import { defineConfig } from 'tsdown'

/**
 * Runtime entries inline `@dsh-std/*`. Those protocol packages are not npm
 * dependencies: tsdown bundles them so `pnpm pack` works under this repo's
 * isolated linker (`bundledDependencies` requires a hoisted layout).
 */
const BUNDLED_DEPS = [/^@dsh-std\//]

const shared = {
  format: ['esm'] as const,
  platform: 'node' as const,
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
  deps: { alwaysBundle: BUNDLED_DEPS },
}

/**
 * Subpath plugins the profile patch mounts. They keep the tsc emit path
 * (`lib/types/*.js`) so existing package exports stay valid.
 */
const SUBPATH_RUNTIME_ENTRIES = [
  'src/api.ts',
  'src/workspaces.ts',
  'src/command-trees.ts',
  'src/settings-sections.ts',
  'src/scenes.ts',
  'src/plugin-host.ts',
  'src/extensions.ts',
  'src/test-utils.ts',
  'src/working-activity.ts',
  'src/jsx-runtime.ts',
]

export default defineConfig([
  {
    // Workspace main is lib/index.js. Build from src so tsdown does not
    // rewrite tsc emit and then get picked up as the next incremental entry.
    entry: ['src/index.ts'],
    outDir: 'lib',
    ...shared,
  },
  {
    entry: SUBPATH_RUNTIME_ENTRIES,
    outDir: 'lib/types',
    ...shared,
  },
])
