# AIBlog — Agent 项目博客

简约风格个人站点：展示 Agent 实验项目、学习笔记，支持在线预览与本地草稿编辑。可打包为 Windows 桌面版，数据保存在本机。

## 目录

- [技术栈](#技术栈)
- [功能概览](#功能概览)
- [多窗口编辑](#多窗口编辑)
- [Markdown 编辑器](#markdown-编辑器)
- [主题与背景图](#主题与背景图)
- [详情页与编辑页](#详情页与编辑页)
- [AI 整理正文](#ai-整理正文)
- [路由](#路由)
- [开发与构建](#开发与构建)
- [桌面版（Windows）](#桌面版windows)
- [本地存储](#本地存储)
- [种子数据](#种子数据)
- [项目结构](#项目结构)
- [开发约定](#开发约定)

## 技术栈

| 类别 | 说明 |
|------|------|
| 前端 | React 19、TypeScript、Vite 6、React Router 7 |
| 正文编辑 | Cherry Markdown（分栏编辑，资源来自 `public/vendor/cherry-markdown`） |
| 正文展示 | react-markdown |
| 桌面 | Electron 35（可选） |
| 数据 | 浏览器 `npm run dev` → **localStorage**；桌面版 → **`userData/data/*.json`** |
| 种子 | 首次为空时从 `src/config/*.data.ts` 写入示例数据 |

## 功能概览

| 模块 | 能力 |
|------|------|
| **首页** | 精选 Agent、最近学习（磨砂卡片；有背景图时 hero 透明叠字） |
| **Agent 项目** | 列表、标签/关键词筛选、详情、预览、增删改、草稿箱 |
| **学习记录** | Markdown 笔记、列表筛选、详情、增删改、草稿箱 |
| **多窗口编辑** | 顶栏标签页，可同时打开多篇草稿/笔记 |
| **主题** | 顶栏「主题」：预设配色、自定义背景图、浅色/深色字、玻璃/透明编辑区 |

### 列表与首页

| 场景 | 规则 |
|------|------|
| 列表页排序 | 按 **`updatedAt`** 更新时间降序 |
| 首页「精选 Agent」 | `featured === true`，按 **`lastReadAt`** 降序 |
| 首页「最近学习」 | `toBeContinued === true`，按 **`lastReadAt`** 降序 |
| 打开详情页 | 写入 **`lastReadAt`**，展示如「3 分钟前阅读」 |

### 字段说明

| 字段 | 适用 | 作用 |
|------|------|------|
| `featured` | Agent | 出现在首页「精选 Agent」 |
| `toBeContinued` | 学习笔记 | 出现在首页「最近学习」 |
| `lastReadAt` | 两者 | 上次打开详情的时间（自动） |
| `updatedAt` | 两者 | 最后修改时间（保存时更新） |

## 多窗口编辑

学习笔记与 Agent 项目均支持**顶栏多标签**编辑（`LearningEditorWorkspace` / `AgentEditorWorkspace`）。

| 操作 | 说明 |
|------|------|
| **+ 新建笔记 / 项目** | 新建草稿并打开新标签 |
| **历史笔记与草稿** | 右侧抽屉，点击条目打开单个标签 |
| **多选** | 抽屉右上角「多选」→ 勾选多条 → 底部「打开所选」一次性打开多个标签 |
| **关闭标签** | 标签上的 ×；关闭后内容仍保留在草稿存储中 |

标签状态会持久化到本地（见 [本地存储](#本地存储)）。

## Markdown 编辑器

学习笔记正文使用 **Cherry Markdown** 分栏编辑器（`MarkdownSplitEditor`）。

| 功能 | 说明 |
|------|------|
| **默认** | 仅编辑区；**预览默认关闭** |
| **眼睛按钮** | 工具栏预览开关：控制**预览窗显隐**与预览内容（输入时不会在关闭状态下弹出空白预览栏） |
| **关联** | 工具栏「关联」：插入指向其他笔记或 Agent 项目的 Markdown 链接 |
| **检索** | 顶栏搜索框：正文关键词跳转（Enter / ↑↓） |
| **滚动同步** | 预览打开时，编辑区与预览区滚动联动 |
| **有背景图** | 编辑区为白底深字「孤岛」，与全站背景图字色设置解耦 |

内部链接在应用内跳转；外部链接在 Electron 下经 `openExternal` 用系统浏览器打开。

## 主题与背景图

顶栏 **主题** 打开设置弹窗：

| 分类 | 选项 |
|------|------|
| **主题** | 预设背景色、光晕色 |
| **自定义** | 上传背景图（≤2MB）、铺满/包含、透明度、编辑区玻璃/透明、背景图文字（自动 / 浅色字 / 深色字） |

- 无背景图时：跟随站点深色/浅色主题，`--text` 与背景对比自动计算。
- 有背景图时：按「浅色字 / 深色字」调整顶栏、卡片、首页 hero 描边等；编辑区见上文「白底孤岛」。

配置键：`myblog_theme_settings`。

## 详情页与编辑页

功能分工：**开关在详情页**，**正文编辑与 AI 整理在编辑页**。

### 详情页顶栏

```
← 返回列表                    [ 未完待续 ○━━ ] [ 编辑 ] [ 删除 ]   ← 学习笔记
← 返回列表                    [ 精选   ○━━ ] [ 编辑 ] [ 删除 ]   ← Agent 项目
```

| 操作 | 说明 |
|------|------|
| **未完待续 / 精选** | `FormFlagToggle` 开关，**切换后立即保存**，无需进编辑页 |
| **编辑** | 进入草稿多窗口工作区或已发布编辑流程 |
| **删除** | 二次确认后删除 |

### 编辑页

| 内容 | 说明 |
|------|------|
| 标题、摘要、标签、正文等 | 常规表单字段 |
| **AI 整理** | 仅学习笔记正文旁，见 [AI 整理正文](#ai-整理正文) |
| 多标签 + 历史抽屉 | 见 [多窗口编辑](#多窗口编辑) |
| **不含** 未完待续/精选开关 | 这两项请在**详情页**调整 |

### 新建笔记/项目时

- 保存后 `featured` / `toBeContinued` 默认为 **关闭**。
- 需要上首页：打开**详情页**，打开对应开关即可。

## AI 整理正文

位置：**学习笔记编辑页** → 正文（Markdown）标签旁 → **AI 整理**（不在详情页顶栏）。

### 使用步骤

1. 点击 **AI 整理**（首次会提示配置 **API Key**）。
2. 在弹窗填写**整理要求**（可选），或直接 **开始整理**。
3. 将当前正文整理为结构化 **Markdown** 并写回编辑框（较长、多章节时会自动判断是否生成目录）。
4. 不满意可点 **恢复原文**（仅保留最近一次整理前的备份）。
5. 最后点 **保存笔记** 才会写入正式数据。

### API 配置

| 项 | 默认 |
|----|------|
| API 地址 | `https://api.openai.com/v1`（OpenAI 兼容：DeepSeek、通义等） |
| 模型 | `gpt-4o-mini` |
| 配置存储键 | `myblog_ai_settings`（仅存本机） |

### 网络说明

- **推荐** `npm run desktop`：由 Electron 主进程代发请求，无浏览器 CORS 问题。
- 纯 `npm run dev` 时，部分 API 可能因跨域失败，需使用支持浏览器调用的网关。

## 路由

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/agents` | Agent 列表 |
| `/agents/new` | 新建项目（进入草稿工作区） |
| `/agents/draft/:draftId` | Agent 多标签草稿编辑 |
| `/agents/:id` | 项目详情（**精选**开关） |
| `/agents/:id/edit` | 编辑已发布项目 |
| `/learning` | 学习列表 |
| `/learning/new` | 新建笔记（进入草稿工作区） |
| `/learning/draft/:draftId` | 学习笔记多标签草稿编辑 |
| `/learning/:id` | 笔记详情（**未完待续**开关） |
| `/learning/:id/edit` | 编辑已发布笔记（生成/进入草稿） |

## 开发与构建

```bash
npm install
npm run dev      # 浏览器开发，一般 http://localhost:5173
npm run build    # 生产构建 → dist/
npm run preview  # 预览 dist/
```

### 验证脚本（可选）

```bash
npm run verify:tabs              # 多标签草稿切换（学习 + Agent）
npm run verify:markdown-helpers  # Markdown 辅助逻辑
npm run verify:draft-batch       # 草稿批量删除等
```

## 桌面版（Windows）

无需后端；数据写入本机 JSON，不随浏览器清缓存丢失。

```bash
npm run build
npm run desktop   # Electron 窗口，需先 build
```

- 内置静态服务加载 `dist/`，**固定端口 `1688`**（`127.0.0.1:1688`）。端口变化会导致 `localStorage` 按 origin 隔离，故桌面版必须固定端口。
- AI 请求经主进程 `ai:fetch` IPC 转发（见 `electron/main.cjs`、`preload.cjs`）。
- 外部链接经 `openExternal` 在系统浏览器打开。

### 数据目录（Windows）

| 运行方式 | 目录 |
|----------|------|
| `npm run desktop` | `%APPDATA%\my-blog\data\` |
| 打包 exe | `%APPDATA%\Studio Blog\data\`（以 `package.json` / electron-builder 配置为准） |

示例文件：`myblog_learnings.json`、`myblog_agents.json`、`myblog_theme_settings.json` 等。

### 打包

```bash
npm install               # 首次打包前
npm run build             # 打包前需先构建前端（脚本会自动执行）

# 便携版：单文件 exe，免安装
npm run pack:win
npm run pack:desktop      # 打包并复制到桌面

# 安装版：NSIS Setup，可选安装目录、开始菜单、桌面快捷方式
npm run pack:win:setup
npm run pack:desktop:setup   # 打包 Setup 并复制到桌面
```

| 产物 | 命令 | 说明 |
|------|------|------|
| `Studio-Blog-1.0.0-portable.exe` | `pack:win` | 便携版，双击即用 |
| `Studio-Blog-1.0.0-Setup.exe` | `pack:win:setup` | 安装向导，可在「设置 → 应用」中卸载 |

产物目录：`release/`。仅复制到 `release/` 不复制到桌面时：`powershell -File scripts/pack-desktop.ps1 -Setup -NoCopy`

### Electron 下载失败

项目已配置 `.npmrc` 使用 npmmirror。可重试：

```powershell
Remove-Item -Recurse -Force node_modules\electron -ErrorAction SilentlyContinue
npm install
```

## 本地存储

| 键名 | 用途 |
|------|------|
| `myblog_agents` | 已发布 Agent |
| `myblog_learnings` | 已发布学习笔记 |
| `myblog_agent_drafts` | Agent 草稿列表 |
| `myblog_learning_drafts` | 学习笔记草稿列表（多篇） |
| `myblog_agent_editor_tabs` | Agent 编辑区已打开标签 |
| `myblog_learning_editor_tabs` | 学习笔记编辑区已打开标签 |
| `myblog_theme_settings` | 主题与背景图 |
| `myblog_ai_settings` | AI 接口配置 |
| `myblog_ops_learning_*` | 学习表单操作记录 |
| `myblog_draft_learning_*` | 单篇学习草稿正文快照 |

桌面版：每个键对应 `data/<键名>.json`。

## 种子数据

**Agent**：`src/config/agents.data.ts`  
**学习笔记**：`src/config/learning.data.ts`（`content` 为 Markdown）

本地预览：静态页放在 `public/previews/<项目 id>/`，表单中 `previewUrl` 指向该路径。

## 项目结构

```
myBlog/
├── electron/              # 主进程、JSON 存储、preload、openExternal
├── public/
│   ├── vendor/cherry-markdown/   # Cherry 编辑器静态资源
│   └── previews/                 # Agent 本地预览页
├── scripts/               # 验证脚本、打包、sync-cherry
├── src/
│   ├── api/               # CRUD、草稿
│   ├── components/
│   │   ├── agent/
│   │   ├── common/        # 按钮、主题设置、弹窗
│   │   ├── form/          # 表单、Cherry 编辑、历史抽屉、AI 整理
│   │   └── learning/
│   ├── contexts/          # 多标签 EditorTabs Context
│   ├── pages/             # 含 *EditorWorkspace 多窗口页
│   ├── styles/            # 全局、背景图、玻璃 UI
│   └── utils/             # themeSettings、cherry*、editorReturnTo 等
├── dist/
└── release/
```

### 关键文件速查

| 文件 | 作用 |
|------|------|
| `pages/LearningEditorWorkspace.tsx` | 学习笔记多标签 + 历史抽屉 |
| `pages/AgentEditorWorkspace.tsx` | Agent 多标签 + 历史抽屉 |
| `components/form/EditorDraftHistoryModal.tsx` | 历史列表、单选打开、**多选批量打开** |
| `components/form/MarkdownSplitEditor.tsx` | Cherry 编辑、预览开关、检索、关联 |
| `utils/cherryPreviewPane.ts` | 预览窗与眼睛按钮状态同步 |
| `utils/themeSettings.ts` | 主题/背景图 CSS 变量 |
| `utils/editorReturnTo.ts` | 编辑页「返回」回到来源路由 |
| `constants/site.ts` | 站点名 AIBlog、导航 |

## 开发约定

- 路径别名：`@/` → `src/`
- 多标签表单：每标签独立 `*DraftPanel`，避免单实例 `initial` 覆盖；见 `npm run verify:tabs`
- 修复 UI/路由类问题后：`npm run build`，相关场景跑对应 verify 脚本
- Hook 回调用 ref 持有，避免 `useEffect` 依赖不稳定函数

更多约定见 `.cursor/rules/`。
