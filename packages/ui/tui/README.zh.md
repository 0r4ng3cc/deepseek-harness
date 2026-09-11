---
description: "DeepSeek Harness agent 的交互式终端入口：基于 dsh-base 的 tui profile 组合包。"
kind: "package-bundle"
---

# @x1a0f3n9/dsh-tui

[English](README.md) | 中文

## 概述

运行 `dsh --profile tui`，在终端中与 DeepSeek Harness agent（智能体）交互式聊天。它使用与其他 dsh 表层相同的模型访问、工具与安全默认值，并由随附的 agent preset（默认 `standard`）按会话组装。需要在终端中交互式工作时选择本包；一次性的命令行任务应使用 `dsh-headless`，浏览器 GUI 应使用 `dsh-web-app`。

## 目录

- [使用本包](#use-this-package)
- [理解实现](#understand-the-implementation)
- [进一步探索](#further-exploration)
- [模型体验](#model-experience)
- [已知限制与延期工作](#known-limitations-and-deferred-work)
- [开发备注](#dev-note)

-----

<a id="use-this-package"></a>
## 使用本包

在真实终端中启动 TUI，然后与 agent 对话。用 `--resume` 或 `DSH_TUI_RESUME_SESSION` 恢复先前的会话。

### 启动 TUI

```sh
dsh --profile tui
dsh --profile tui --resume
```

全屏聊天界面出现且可以输入，就说明成功了。两种可预期的失败：stdout 不是 TTY 时无法承载 Ink 渲染器；缺少 `DEEPSEEK_API_KEY` 会在第一次模型请求时失败，而不是在启动时失败。

### 配置

大多数用户不需要设置这些；命令行与环境会提供给下面的配置项。[`src/dsh-adapter/index.ts`](src/dsh-adapter/index.ts) 中的插件 `Config` schema 是每个受支持字段的真源。

| 字段 | 默认值 | 含义 |
|---|---|---|
| `provider` | `deepseek-official` | 新会话的 LLM 提供方路由 |
| `fullscreen` | `true` | 使用 alt-screen 全屏，并支持应用内鼠标选择 |
| `effort` | `max` | 推理力度，对照当前适配器档位校验 |
| `preset` | roster 默认值（`standard`） | 静态 preset；`DSH_TUI_PRESET` 覆盖持久化的 `/preset` 选择 |
| `sessionId` | 未设置 | 要挂上的已有会话；由 `DSH_TUI_RESUME_SESSION` 提供 |

### 按会话组装 agent

每个终端会话从随附 preset 组装自己的 agent，而不是共享一套进程级工具集。你可以更改默认 preset，或在 `$DSH_HOME/.agent-presets` 下添加自己的 preset。

-----

<a id="understand-the-implementation"></a>
## 理解实现

<details>
<summary>实现内部——点击展开</summary>

本包是一份 patch 加上终端运行时。存储栈与投影缓存来自 `dsh-base`；TUI 覆盖层的 workspace 与 plugin-host 配置项消费这些共享服务。patch 重述 base 故意省略的表层取值、插入仅 TUI 使用的 host 配置项，再把 agent 平面交给 preset。运行时插件负责会话创建／恢复、Ink 树，以及 TUI 卸载时退出进程。

### Patch 语义

一份 patch 会整段替换目标配置项的 `config`，因此每个 TUI 配置项都会重述它所拥有的全部键。base 按进程挂载的按 agent 工具配置项在此禁用，改由 preset roster 接管；host 平面与 preset 平面的每一项取舍理由都写在 patch 行内。

### 源码映射

| 文件 | 职责 |
|---|---|
| [`src/index.ts`](src/index.ts) | 插件工厂（`name` / `inject` / `Config` / `apply`）的再导出 |
| [`src/dsh-adapter/index.ts`](src/dsh-adapter/index.ts) | `dsh-tui` 插件表层；`apply` 加载 JSX 渲染路径 |
| [`cordis.patch.yml`](cordis.patch.yml) | tui patch：重述的 base 取值、TUI host 配置项、交给 preset 的 agent 平面 |
| [`vendor/dsh-std/`](vendor/dsh-std/) | 嵌入的 `dsh-std` 协议快照；tsdown 把 `@dsh-std/*` 内联进已发布入口 |
| [`tests/tui.spec.ts`](tests/tui.spec.ts) | 组合包 patch 声明与 profile 配置项约定 |
| [`scripts/generate-pet-frames.mjs`](scripts/generate-pet-frames.mjs) | 从打包的鲸 GIF 重生 `src/components/petFrames.ts` |

### 不变式归属

不发布不变式伴生入口，因为 Ink UI、resume 标记和 plugin-host grant 随 fiber dispose（资源释放），会话记录位于 `dsh-session-persistence-jsonl`，各关系的不变式由拥有该关系的 registry 包承担。

### 嵌入的 dsh-std 快照

`vendor/dsh-std` 是 DSH Standard 协议工作区的包内快照，不是根目录 [`vendor/`](../../../vendor/README.md) 清单中的条目。本树未记录上游 git SHA。仓库 `pnpm-workspace.yaml` 链接了七个协议包，供 TypeScript 与 tsdown 解析；它们不会作为 harness 包发布。更新该快照只发生在本包内。

包级 TypeScript 配置为本移植终端表层（`src`）保留更宽松的开关。oxlint 对该树关闭 `typescript/no-unnecessary-condition`，因为这些开关使该规则的前提不成立。覆盖率出于同一原因排除 `packages/ui/tui/src/**/*`。

</details>

-----

<a id="further-exploration"></a>
## 进一步探索

想深入了解共享核心、profile 组合，或本包为何不在 `bundle/` 下时，阅读这些页面。

- [ui 组映射](../README.zh.md)——本包所属的组。
- [dsh-base](../../bundle/base/README.zh.md)——TUI 运行所基于的共享核心。
- [Profile 组合包设计笔记](../../../.agents/notes/implemented/architecture/2026-08-05-profile-plugin-bundles.zh.md)——已发布 profile 如何叠放 base 与一个模式组合包。
- [TUI 留在 packages/ui/tui](../../../.agents/notes/implemented/architecture/2026-09-11-tui-profile-bundle-in-ui-group.zh.md)——为何厚终端表层不是 `bundle/` 粘合包。

-----

<a id="model-experience"></a>
## 模型体验

### TUI coding-agent persona

#### 模型看到什么

该 profile 在第一方指引之前提供系统提示词 persona `You are a coding agent.`（可用 `DSH_TUI_PERSONA` 覆盖）。每个会话随后从所选 agent preset 组装工具与提示词段落。TUI 不注册 Web 那种表层定位段落。

#### Token 影响

一段简短且稳定的 persona，外加随数据变化的 base 提示词段落以及所选 preset 的工具 schema。

#### KV Cache 影响

在固定的 profile、提供方、模型与 preset 下保持稳定。因为随附的 TUI profile 使用仅启动时加载的 patch，profile 变更在下一次进程中生效。

## 已知限制与延期工作

<a id="known-limitations-and-deferred-work"></a>

这些限制告诉你在终端、Windows 或额外组合插件时会遇到什么。它们是当前包约束，不是终端模拟器对比或任务积压。

- **需要真实 TTY**——stdout 不是终端时无法承载 Ink 渲染器；没有无头渲染回退。
- **配置变更需要重启**——随附的 `tui` profile 使用 `patchReload: startup`，因此一棵 Ink 树不会观察到被替换的插件图。
- **Windows 尚无沙箱隔离后端**——patch 在 `win32` 上选择 `danger-full-access` 与 `approval: never`，以便 bash 能够运行。
- **覆盖率不门禁本树**——`packages/ui/tui/src/**/*` 被排除在逐文件 100% 门禁之外，因为移植的 Ink 核心是第三方代码，使用更宽松的 TypeScript 开关。
- **`dsh-std` 是嵌入快照**——本树没有上游 SHA；协议更新只发生在本包内，并在打包时内联。
- **包脚本只是本地助手**——`clean`、`build:dsh-std` 与 `generate-pet-frames`。类型检查、lint、打包与发布从仓库根目录运行。
- **便携包 `/update` 会被拒绝**——本包不发布 `dsh-tui-standalone-*` GitHub 资源。请使用 `dsh --profile tui` 与 `dsh plugin --profile <name> update @x1a0f3n9/dsh-tui`。

<a id="dev-note"></a>
### 开发备注

<details>
<summary>维护者的工作上下文——点击展开</summary>

无。

</details>
