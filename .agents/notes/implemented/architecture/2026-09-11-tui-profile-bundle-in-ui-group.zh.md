# Agent Note: TUI profile 组合包放在 packages/ui/tui

Status: implemented

[English](2026-09-11-tui-profile-bundle-in-ui-group.md) | 中文

## Problem

已发布的 `tui` profile 是 `dsh-base` 加上一个模式组合包，组合方式与 `web` / `acp` / `sdk` 相同。那些模式组合包放在 `packages/bundle/` 下，内容是一份 patch 外加薄运行时粘合插件。TUI 同时还拥有移植的 Ink 渲染器、plugin-host 协议扩展点、打包的 preset，以及包内的 `dsh-std` 快照——数百个源文件构成的是终端产品，不是粘合层。把这棵树放进 `bundle/` 会把 UI 实现和组合 patch 混在一起；在没有第二个消费方的情况下把粘合层与渲染器拆开，则会重复 patch／运行时约定。

## Decision

`@x1a0f3n9/dsh-tui` 放在 `packages/ui/tui`。它声明 `dsh.bundle.patch`，并且是 [`PROFILE_TEMPLATES`](../../../../packages/boot/app-boot/src/profile.ts) 里 `tui` profile 的模式组合包。`packages/bundle/` 继续只放薄粘合层。新建的 `ui` 组 README 映射该包；[`GROUPS_WITHOUT_SUBSYSTEM_PAGE`](../../../../scripts/verify-subsystem-pages.ts) 豁免 `ui`，因为交互约定由包 README 负责。

覆盖率排除 `packages/ui/tui/src/**/*`：移植的 Ink 核心是第三方代码，使用更宽松的 TypeScript 开关，对该树做逐文件 100% 不是 harness 不变式。oxlint 对该树关闭 `typescript/no-unnecessary-condition`，因为这些开关使该规则的前提不成立。本包省略 `./invariant`，因为 Ink UI、resume 标记和 plugin-host grant 随 fiber dispose（资源释放）；会话记录位于 `dsh-session-persistence-jsonl`，各关系的不变式由拥有该关系的 registry 包承担。

`dsh-std` 是嵌在 `packages/ui/tui/vendor/dsh-std` 的快照，不是根目录 [`vendor/README.md`](../../../../vendor/README.md) 清单中的条目。tsdown 把 `@dsh-std/*` 内联进已发布的运行时入口，以便在本仓 isolated linker 下能够 `pnpm pack`。

## Alternatives considered

- **把包作为 `tui` 模式组合包放到 `bundle/` 下。** 否决：`bundle/` 包是 patch 层加薄粘合。TUI 是完整的终端产品；把它和 `web-app` / `acp-app` 放在一组会掩盖所有权。
- **拆出一个 `bundle/tui-app` 粘合包，渲染器留在 `packages/ui/tui`。** 本次嵌入否决：一个包同时是 profile 组合包和渲染器，并不存在只消费粘合行的第二个消费方。
- **TUI 只作为树外第三方 npm 包存在。** 否决：已发布的 profile 模板从 dsh 安装目录解析内置组合包；TUI 是第一方表层。

## Consequences

- `packages/ui/` 是只有一个包的组；`packages/README.md` 把它列在 `acp/` 与 `interaction/` 旁边。
- 把 TUI 对齐到 0.1.5-alpha.2 包约定（version、repository、`lib/index.js` main、peer `cordis`、无空 invariant）就地完成。不要为了目录对称把树搬到 `bundle/`。
- 根目录 `vendor/` 的同步流程不覆盖 `dsh-std`；更新留在 TUI 包本地。
