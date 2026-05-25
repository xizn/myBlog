# Studio — Agent 项目博客

简约风格个人站点：展示 Agent 实验项目、学习笔记，支持在线预览与本地草稿编辑。可打包为 Windows 桌面版，数据保存在本机。

## 目录

- [技术栈](#技术栈)
- [功能概览](#功能概览)
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
| 正文 | react-markdown |
| 桌面 | Electron 35（可选） |
| 数据 | 浏览器 `npm run dev` → **localStorage**；桌面版 → **`userData/data/*.json`** |
| 种子 | 首次为空时从 `src/config/*.data.ts` 写入示例数据 |

## 功能概览

| 模块 | 能力 |
|------|------|
| **首页** | 精选 Agent、最近学习（见下方开关字段） |
| **Agent 项目** | 列表、标签/关键词筛选、详情、预览、增删改、草稿箱 |
| **学习记录** | Markdown 笔记、列表筛选、详情、增删改、草稿箱 |
| **表单工作区** | 全屏编辑：左侧表单 + 右侧草稿预览与时间线 |

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
| **编辑** | 进入全屏表单（FormWorkspace） |
| **删除** | 二次确认后删除 |

### 编辑页（FormWorkspace）

| 内容 | 说明 |
|------|------|
| 标题、摘要、标签、正文等 | 常规表单字段 |
| **AI 整理** | 仅学习笔记正文旁，见 [AI 整理正文](#ai-整理正文) |
| 草稿箱 | 右侧：自动/手动保存草稿、恢复、操作记录 |
| **不含** 未完待续/精选开关 | 这两项请在**详情页**调整 |

### 新建笔记/项目时

- 保存后 `featured` / `toBeContinued` 默认为 **关闭**。
- 需要上首页：打开**详情页**，打开对应开关即可。

### 编辑页保存时

- 会保存标题、正文等你在表单里改过的内容。
- `featured` / `toBeContinued` 会按**打开编辑页时**从数据库读入的值写回（编辑页没有开关可改）。
- 若刚在详情页改过开关，建议先完成详情页保存，再进编辑；或编辑完保存后到详情页确认开关状态。

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
| `/agents/new` | 新建项目 |
| `/agents/draft/:draftId` | Agent 草稿编辑 |
| `/agents/:id` | 项目详情（**精选**开关） |
| `/agents/:id/edit` | 编辑已发布项目 |
| `/learning` | 学习列表 |
| `/learning/new` | 新建笔记 |
| `/learning/:id` | 笔记详情（**未完待续**开关） |
| `/learning/:id/edit` | 编辑笔记（**AI 整理**） |

## 开发与构建

```bash
npm install
npm run dev      # 浏览器开发，一般 http://localhost:5173
npm run build    # 生产构建 → dist/
npm run preview  # 预览 dist/
```

## 桌面版（Windows）

无需后端；数据写入本机 JSON，不随浏览器清缓存丢失。

```bash
npm run build
npm run desktop   # Electron 窗口，需先 build
```

- 内置静态服务加载 `dist/`，**固定端口 `1688`**（`127.0.0.1:1688`）。端口变化会导致 `localStorage` 按 origin 隔离，故桌面版必须固定端口。
- AI 请求经主进程 `ai:fetch` IPC 转发（见 `electron/main.cjs`、`preload.cjs`）。

### 数据目录（Windows）

| 运行方式 | 目录 |
|----------|------|
| `npm run desktop` | `%APPDATA%\my-blog\data\` |
| 打包 exe（Studio Blog） | `%APPDATA%\Studio Blog\data\` |

示例文件：`myblog_learnings.json`、`myblog_agents.json`、`myblog_ai_settings.json`。

### 打包

```bash
npm install          # 首次打包前
npm run pack:win     # 输出到 release/
npm run pack:desktop # 打包并复制 exe 到桌面
```

自定义目录：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/pack-desktop.ps1 -InstallDir "D:\Apps\StudioBlog"
```

便携版：`Studio-Blog-1.0.0-portable.exe`，双击即用，无需安装向导。

### Electron 下载失败

项目已配置 `.npmrc` 使用 npmmirror。可重试：

```powershell
Remove-Item -Recurse -Force node_modules\electron -ErrorAction SilentlyContinue
npm install
# 或
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
npm install
```

## 本地存储

| 键名 | 用途 |
|------|------|
| `myblog_agents` | 已发布 Agent |
| `myblog_learnings` | 已发布学习笔记 |
| `myblog_agent_drafts` | Agent 草稿 |
| `myblog_learning_drafts` | 学习笔记草稿列表（多篇） |
| `myblog_ops_learning_*` | 学习表单操作记录 |
| `myblog_ai_settings` | AI 接口配置（Key / 地址 / 模型） |

桌面版：每个键对应 `data/<键名>.json`。

## 种子数据

**Agent**：`src/config/agents.data.ts`  
**学习笔记**：`src/config/learning.data.ts`（`content` 为 Markdown）

本地预览：静态页放在 `public/previews/<项目 id>/`，表单中 `previewUrl` 指向该路径。

## 项目结构

### 目录树

```
myBlog/
├── electron/           # 主进程、JSON 存储、preload（含 AI 请求转发）
├── public/             # favicon、previews/
├── scripts/            # pack-desktop.ps1 等
├── src/
│   ├── api/            # CRUD、草稿
│   ├── components/
│   │   ├── agent/      # 卡片、预览、草稿箱
│   │   ├── common/     # 按钮、搜索、弹窗
│   │   ├── form/       # 表单、FormWorkspace、FormFlagToggle、AiFormatButton
│   │   └── learning/   # 卡片、Markdown 渲染、草稿箱
│   ├── config/         # 种子数据
│   ├── hooks/          # useAgents、useLearnings、useFormWorkspace
│   ├── pages/          # 各路由页面（详情页含顶栏开关）
│   ├── router/
│   ├── types/
│   └── utils/          # appStorage、aiSettings、formatMarkdownWithAi 等
├── dist/               # build 输出
└── release/            # 打包 exe
```

### 关键文件速查

| 文件 | 作用 |
|------|------|
| `pages/LearningDetailPage.tsx` | 详情 + 顶栏「未完待续」 |
| `pages/AgentDetailPage.tsx` | 详情 + 顶栏「精选」 |
| `pages/LearningDraftFormPage.tsx` | 草稿编辑（多篇新建草稿） |
| `pages/LearningNewPage.tsx` | 新建笔记入口 |
| `pages/LearningEditPage.tsx` | 已发布笔记 → 草稿编辑 |
| `components/form/LearningForm.tsx` | 笔记表单 + AI 整理入口 |
| `components/form/AiFormatButton.tsx` | AI 整理弹窗、恢复原文 |
| `components/form/FormFlagToggle.tsx` | 详情页胶囊开关 |
| `utils/appStorage.ts` | 统一本地存储 |
| `utils/formatMarkdownWithAi.ts` | 调用 OpenAI 兼容 API 整理正文 |
| `electron/fileStorage.cjs` | JSON 持久化 |

### 数据流

```
页面 → api/*.ts → localStore → appStorage
                              ├─ 浏览器：localStorage
                              └─ Electron：userData/data/*.json

AI 整理 → formatMarkdownWithAi → aiHttp / studioAiFetch（Electron）
```

更细的目录说明见上文各模块；组件级列表可在仓库内按需查阅 `src/components/`。

## 开发约定

- 路径别名：`@/` → `src/`
- 路由用 `Component` + 布局内 `<Outlet key={pathname-locationKey} />`
- 表单标题 label 使用 `.form-field > label`，避免影响 `label.form-switch`
- Hook 回调用 ref 持有，避免 `useEffect` 依赖不稳定函数

更多约定见 `.cursor/rules/`。
