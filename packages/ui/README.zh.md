---
description: "交互式终端包组：基于 dsh-base 的 TUI profile 组合包。"
kind: "package-group"
---

# ui/ — 交互式终端表层

[English](README.md) | 中文

## 概述

ui 组提供一个包：DeepSeek Harness agent（智能体）的交互式终端入口。它是 `tui` profile 叠在 [`dsh-base`](../bundle/base/README.zh.md) 之上的模式组合包，而不是 `bundle/` 里的薄粘合包。用户运行 `dsh --profile tui` 即可在终端与 agent 对话。本页是组的映射；包 README 负责各自的包级约定。

## 目录

- [包](#packages)
- [相关文档](#related-documentation)
- [开发备注](#dev-note)

-----

<a id="packages"></a>
## 包

| 包 | 职责 |
|---|---|
| [`tui/`](tui/README.zh.md) | 基于 dsh-base 的交互式终端 profile 组合包：Ink 渲染器、plugin-host 扩展点，以及 tui patch |

-----

<a id="related-documentation"></a>
## 相关文档

- [TUI 子系统](../../docs/subsystems/tui.zh.md)——决策点事件与生成的 Cordis API。
- [dsh-base](../bundle/base/README.zh.md)——TUI 运行所基于的共享核心。
- [Profile 组合包设计笔记](../../.agents/notes/implemented/architecture/2026-08-05-profile-plugin-bundles.zh.md)——已发布 profile 如何叠放 base 与一个模式组合包。
- [TUI 留在 packages/ui/tui](../../.agents/notes/implemented/architecture/2026-09-11-tui-profile-bundle-in-ui-group.zh.md)——为何厚终端表层不是 `bundle/` 粘合包。

<a id="dev-note"></a>
## 开发备注

无。
