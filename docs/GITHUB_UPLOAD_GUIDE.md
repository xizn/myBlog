# 上传到 GitHub（简明流程）

仓库：[https://github.com/xizn/myBlog](https://github.com/xizn/myBlog)

---

## 本仓库分支说明（先看这个）

| 分支 | 用途 | 谁该往这里推 |
|------|------|----------------|
| **`main`** | 主线：能稳定跑、可发布的整体版本 | 功能做完、自测通过后，**合并进来**再推 |
| **`editor-panel`** | 编辑区专用：Markdown / Cherry 编辑器、图片插入等 | 只改 `src/components/form/`、`src/pages/*EditorWorkspace*`、`src/utils/cherry*` 等编辑相关时 |
| **`AIBlog_add_picture`** | 图片相关功能线（历史分支，可与 editor 并行） | 仅在做图片专题时使用 |

**推送规则（记住三条）**

1. **推的是「当前所在分支」**，不是永远推 `main`。左下角显示 `editor-panel` 时，点同步 → 更新的是 GitHub 上的 `editor-panel`。
2. **第一次推新分支** 要带 `-u`（VS Code 里选「发布分支」会自动做）：  
   `git push -u origin 分支名`
3. **`main` 上的代码** 应来自「合并」，不要长期在 `main` 上直接改编辑区实验性功能；在 `editor-panel` 开发 → 合并到 `main` → 再推 `main`。

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

```powershell
cd D:\study_file\myBlog
git remote set-url origin https://github.com/xizn/myBlog.git
```

访问 GitHub 不稳定时，给 **Git** 配代理（端口改成 Clash 里的 HTTP 端口）：

```powershell
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```

改完后 **完全退出并重启 VS Code / Cursor**，推送按钮才会稳定。

不用代理时：

```powershell
git config --global --unset http.proxy
git config --global --unset https.proxy
```

---

## 3. 日常提交并推送（当前分支）

```powershell
cd D:\study_file\myBlog
git add .
git commit -m "说明本次改了什么"
git push
```

若提示没有上游分支：`git push -u origin 当前分支名`

登录框：**Username** = `xizn`，**Password** = **Token**。

---

## 4. 在 VS Code / Cursor 里：创建分支 → 开发 → 合并到 main

### 4.1 创建并切换到 `editor-panel`（编辑区专用）

**图形界面：**

1. 点左下角分支名（可能显示 `main` 或别的名字）。
2. 选 **创建新分支…**。
3. 输入：`editor-panel`，回车。
4. 若本地还没有该分支，会从当前提交分出去；本仓库已在 GitHub 存在 `editor-panel`，也可选 **切换到…** → 输入 `editor-panel`。

**命令行：**

```powershell
cd D:\study_file\myBlog
git fetch origin
git checkout editor-panel
# 若本地没有：git checkout -b editor-panel origin/editor-panel
```

确认左下角显示 **`editor-panel`** 再改编辑区代码。

### 4.2 在分支上改代码并推送到 GitHub

1. 改文件（编辑区相关）。
2. 左侧 **源代码管理** → 文件旁 **+** 暂存。
3. 输入提交说明 → 点 **✓ 提交**。
4. 点 **同步更改** 或 **发布分支 / 推送**。

成功：GitHub 上 `editor-panel` 分支有新提交，**`main` 暂时不会变**。

### 4.3 合并进主线 `main`

**方式 A：VS Code（推荐）**

1. 左下角切换到 **`main`**（创建分支… 旁选 **main**）。
2. 命令面板 `Ctrl+Shift+P` → 输入 **Git: Merge Branch…**。
3. 选择要合并进来的分支，例如 **`editor-panel`**。
4. 若有冲突，在源代码管理里逐个解决 → 暂存 → 提交合并。
5. 仍在 `main` 上点 **同步更改**，把合并后的 `main` 推到 GitHub。

**方式 B：命令行**

```powershell
git checkout main
git pull origin main
git merge editor-panel
# 有冲突则改文件后：git add . && git commit
git push origin main
```

**方式 C：GitHub 网页 Pull Request**

1. 打开 [Compare & pull request](https://github.com/xizn/myBlog/compare/main...editor-panel)。
2. 创建 PR：`editor-panel` → `main`，审查后 **Merge**。
3. 本地再执行：`git checkout main` → `git pull origin main`。

### 4.4 合并后让编辑分支跟上 main（可选）

在 `editor-panel` 上继续开发前：

```powershell
git checkout editor-panel
git merge main
git push
```

避免两条线差太远、下次难合并。

---

## 5. 分支 vs 主线：推送对照表 

| 你人在哪条分支 | 点「同步/推送」后 GitHub 上谁变 | 会不会动 main |
|----------------|----------------------------------|---------------|
| `editor-panel` | 只更新 `editor-panel` | 否 |
| `main`         | 只更新 `main` | 是 |
| `main` 且刚 merge 完 `editor-panel` | `main` 含编辑区改动 | 是（这是正确发布方式） |

| 场景 | 该怎么做 |
|------|----------|
| 只做了编辑区实验，还不确定 | 待在 `editor-panel`，只 `git push` |
| 编辑区测好了，要给正式版用 | 合并到 `main`，再推 `main` |
| 推送失败 `Connection was reset` | 开 Clash + 配置 `http.proxy`，重启 VS Code 再推 |
| 第一次创建本地新分支 | 推送时选「发布分支」，或 `git push -u origin 分支名` |

---

## 6. 确认成功

- 编辑区分支：[github.com/xizn/myBlog/tree/editor-panel](https://github.com/xizn/myBlog/tree/editor-panel)
- 主线：[github.com/xizn/myBlog/tree/main](https://github.com/xizn/myBlog/tree/main)

```powershell
git status
git branch -vv
```

---

## 7. 常见问题

| 报错 | 处理 |
|------|------|
| `Could not connect` / `Connection was reset` | 代理 + 重启 VS Code（见第 2 节） |
| `Authentication failed` | 用 Token 当密码 |
| `rejected (non-fast-forward)` | 先 `git pull`，解决冲突再 `git push` |
| 推上去了但 main 没变 | 正常：你在 feature 分支上推的，要合并才进 main |
| `both added` 冲突 | 改文件去掉 `<<<<<<<` 标记 → `git add .` → `git commit` |

---

## 8. 右键提交记录菜单（简要）

| 菜单 | 干什么 |
|------|--------|
| **打开更改** | 看这次提交改了什么 |
| **在 GitHub 上打开** | 浏览器看同一次提交 |
| **创建分支…** | 从这次提交新开一条线 |
| **与远程比较** | 本地和 GitHub 差多少 |

日常开发以 **第 4 节** 为主即可。

---

## 不要提交的内容

`.gitignore` 已忽略 `node_modules`、`dist` 等。切勿提交 `.env`、API Key、密码等敏感信息 。
