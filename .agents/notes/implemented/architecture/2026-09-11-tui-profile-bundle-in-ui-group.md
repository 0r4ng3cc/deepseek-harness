# Agent Note: TUI profile bundle lives in packages/ui/tui

Status: implemented

English | [中文](2026-09-11-tui-profile-bundle-in-ui-group.zh.md)

## Problem

The shipped `tui` profile is `dsh-base` plus one mode bundle, the same composition as `web` / `acp` / `sdk`. Those mode bundles live under `packages/bundle/` as a patch plus a thin runtime glue plugin. The TUI also owns a ported Ink renderer, plugin-host protocol seams, packaged presets, and an in-package `dsh-std` snapshot — hundreds of source files that are a terminal product, not glue. Putting that tree in `bundle/` would mix a UI implementation with composition patches; splitting glue from renderer without a second consumer would duplicate the patch/runtime contract.

## Decision

`@x1a0f3n9/dsh-tui` lives at `packages/ui/tui`. It declares `dsh.bundle.patch` and is the `tui` profile's mode bundle in [`PROFILE_TEMPLATES`](../../../../packages/boot/app-boot/src/profile.ts). `packages/bundle/` stays thin glue. The new `ui` group README maps the package; [`GROUPS_WITHOUT_SUBSYSTEM_PAGE`](../../../../scripts/verify-subsystem-pages.ts) exempts `ui` because the package README owns the interactive contract.

Coverage excludes `packages/ui/tui/src/**/*`: the ported Ink core is third-party code under looser TypeScript flags, and per-file 100% on that tree is not a harness invariant. The package omits `./invariant` because Ink UI, the resume marker, and plugin-host grants dispose with the fiber; session records live in `dsh-session-persistence-jsonl`, and each owning registry package carries that relation's invariant.

`dsh-std` is an embedded snapshot at `packages/ui/tui/vendor/dsh-std`, not an entry in the root [`vendor/README.md`](../../../../vendor/README.md) manifest. tsdown inlines `@dsh-std/*` into the published runtime entries so the package can pack under the repo's isolated linker.

## Alternatives considered

- **Move the package under `bundle/` as a `tui` mode bundle.** Rejected: `bundle/` packages are patch layers plus thin glue. The TUI is a full terminal product; grouping it with `web-app` / `acp-app` would hide that ownership.
- **Split a `bundle/tui-app` glue package from `packages/ui/tui`.** Rejected for this embed: one package is both the profile bundle and the renderer, and there is no second consumer of a glue-only row.
- **Keep TUI out of tree as a third-party npm package only.** Rejected: shipped profile templates resolve in-box bundles from the dsh installation; the TUI is a first-party surface.

## Consequences

- `packages/ui/` is a group with one package; `packages/README.md` lists it next to `acp/` and `interaction/`.
- Aligning TUI to 0.1.5-alpha.2 package conventions (version, repository, `lib/index.js` main, peer `cordis`, no empty invariant) happens in place. Do not relocate the tree to satisfy bundle-directory symmetry.
- Root `vendor/` sync procedure does not cover `dsh-std`; updates stay local to the TUI package.
