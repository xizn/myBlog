# 上传到 GitHub（简明流程）

仓库：[https://github.com/xizn/myBlog](https://github.com/xizn/myBlog)

---

## 1. 登录 GitHub

1. 浏览器打开 [https://github.com](https://github.com) 并登录账号 `xizn`。
2. 创建访问令牌（推送代码用，**不是**登录密码）：
   - 右上角头像 → **Settings**
   - 左侧最下方 **Developer settings** → **Personal access tokens** → **Tokens (classic)**
   - **Generate new token (classic)**，勾选 **`repo`**
   - 生成后**复制保存**（只显示一次）

---

## 2. 本地配置远程（只需一次）

在 PowerShell 中：

```powershell
cd D:\study_file\myBlog

git remote set-url origin https://github.com/xizn/myBlog.git
```

若访问 GitHub 较慢，可先给 Git 配置代理（端口按你的 Clash 等软件修改）：

```powershell
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```

不用代理时取消：

```powershell
git config --global --unset http.proxy
git config --global --unset https.proxy
```

---

## 3. 提交并推送

```powershell
cd D:\study_file\myBlog

git add .
git commit -m "说明本次改了什么"
git push -u origin main
```

弹出登录框时：

| 项 | 填写 |
|----|------|
| Username | `xizn` |
| Password | 填上一步的 **Token**（不是 GitHub 密码） |

Windows 会记住凭据，之后一般不用再输。

---

## 4. 确认成功

浏览器打开 [https://github.com/xizn/myBlog](https://github.com/xizn/myBlog)，能看到最新文件和提交记录即成功。

本地查看状态：

```powershell
git status
git log -1 --oneline
```

---

## 常见问题

| 报错 | 处理 |
|------|------|
| `Could not connect to github.com port 443` | 开代理/VPN，或配置 `http.proxy`（见第 2 节） |
| `Authentication failed` | 用 Token 当密码；确认 Token 未过期且勾选 `repo` |
| `rejected (non-fast-forward)` | 先 `git pull origin main`，解决冲突后再 `git push` |
| `both added: README.md` 等冲突 | 改好冲突文件 → `git add .` → `git commit` → `git push` |

---

## 5. Cursor / VS Code 里右键提交记录是干什么的？

在左侧 **源代码管理** 或 **时间线 / Git 历史** 里，对某一条提交记录右键，会出现一串菜单。可以把它想成：**对「某一次保存快照」能做什么操作**。

下面按你截图里的顺序说明（日常用得多的会标 ⭐）。

| 菜单项 | 通俗解释 | 什么时候用 |
|--------|----------|------------|
| **打开更改** ⭐ | 看这次提交**具体改了哪些文件、每一行怎么变**（左右对比 diff）。 | 想搞清楚「这次 commit 到底动了什么」。 |
| **在 GitHub 上打开** ⭐ | 用浏览器打开 GitHub 上**同一次提交**的页面。 | 想分享链接，或在网页上看评论、CI 状态。 |
| **签出（已分离）** | 把项目**临时切到**这一次提交时的代码状态（不在任何分支上，叫 detached HEAD）。 | 只想**看看旧版本**，一般不在这里继续开发；看完应切回 `main`。 |
| **创建分支…** | 从这一次提交**新开一条线**（分支），以后在这条线上改代码。 | 想基于某个旧版本做实验，又不想影响 `main`。 |
| **创建标记…** | 给这次提交贴一个**固定名字**（如 `v1.0.0`），方便以后找到「发版那一版」。 | 正式发布、打版本号时用。 |
| **挑拣** | 把**这一次提交里的改动**，单独「摘」到当前分支上（不拉整条历史）。 | 别的分支有一个好 fix，只想挪到 `main`，且你很熟悉 Git 时再用。 |
| **与远程比较** ⭐ | 对比：**你本地的这次提交** 和 **GitHub 上对应位置** 差多少。 | 推送前后检查「本地和网上是不是一致」。 |
| **与合并基础比较** | 对比两个分支**分叉之前共同祖先**和当前提交的差异（合并时用）。 | 处理复杂合并时才有用；平时常是灰色不可用。 |
| **相较于…** | 自己选**另一条提交或分支**，和当前这条做对比。 | 想比「昨天那版」和「今天这版」差别。 |
| **复制提交哈希** | 复制这一笔提交的 **ID**（一长串字母数字，如 `ddf8d35…`）。 | 查 bug、写文档、让别人精确定位某次提交时用。 |
| **复制提交消息** | 只复制提交说明文字（commit message）。 | 写 changelog、汇报工作时复制描述。 |
| **添加到聊天** | 把这次改动的上下文丢进 **Cursor 对话**，让 AI 结合代码聊。 | 想问「这次提交为什么这样改」时用。 |
| **解释更改** | 让 AI **用白话总结**这次提交改了什么。 | 看不懂 diff、想快速了解变更时用。 |

### 几个概念，一句话记住

- **提交（commit）**：一次「存档」，带说明文字；多条提交排成历史时间线。
- **分支（branch）**：开发用的「线路」，例如 `main` 是主线路；`创建分支` 是从某次存档分出去新路。
- **远程（remote / origin）**：GitHub 上的那份仓库；**推送** = 把本地存档同步上去。
- **签出（checkout）**：切换到某一个存档对应的代码状态；**签出（已分离）** 是临时参观，别长期在上面改代码。

### 新手最常用的 3 个

1. **打开更改** — 看这次改了啥。  
2. **在 GitHub 上打开** — 在网页确认已传上去。  
3. **与远程比较** — 确认本地和 GitHub 是否一致。

其余（挑拣、分离签出、合并基础比较等）可以等遇到具体场景再查，不必一次全背。

### 和「上传代码」的关系

日常上传只需要：**改文件 → 源代码管理里点「+」暂存 → 写提交说明 → 同步/推送**。  
右键提交记录里的功能，多半是**查看历史、对比版本**；不是每次推送都必须点。

---

## 不要提交的内容

`.gitignore` 已忽略 `node_modules`、`dist` 等。切勿提交 `.env`、API Key、密码等敏感信息。
