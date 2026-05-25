# myBlog 提交到 GitHub 操作手册

> 仓库地址：[https://github.com/xizn/myBlog](https://github.com/xizn/myBlog.git)  
> 本地路径：`D:\study_file\myBlog`

---

## 一、你遇到的报错是什么意思？

### 报错 A（你用的 HTTPS）

```text
fatal: unable to access 'https://github.com/xizn/myBlog.git/':
Failed to connect to github.com port 443 after 21083 ms: Could not connect to server
```

**含义**：电脑在约 21 秒内**连不上** `github.com` 的 **443 端口**（HTTPS）。  
这是**网络层**问题，不是：

- 仓库 URL 写错（URL 一般没问题）
- 用户名密码错（那种会提示 `Authentication failed`）
- 分支名错（那种会提示 `rejected` 等）

**常见原因**：

| 原因 | 说明 |
|------|------|
| 网络不稳定 / 被墙 | 国内访问 GitHub 经常超时，需稳定代理或换网络 |
| 系统/浏览器代理未给 Git 用 | 浏览器能上 GitHub，但 Git 命令行没走代理 |
| Git 配了错误代理 | `http.proxy` 指向失效地址，导致永远连不上 |
| 公司/校园网拦截 | 防火墙禁止访问 GitHub |
| DNS 污染 | 解析到错误 IP，连接失败 |

### 报错 B（你当前仓库的远程是 SSH）

若远程是 `git@github.com:xizn/myBlog.git`，推送失败可能是：

```text
Permission denied (publickey).
```

**含义**：能连上 GitHub，但**没有配置 SSH 公钥**，或公钥未添加到 GitHub 账号。

---

## 二、先做一次「环境自检」（PowerShell）

在项目目录执行：

```powershell
cd D:\study_file\myBlog

# 1. 看远程地址是 HTTPS 还是 SSH
git remote -v

# 2. 看当前分支与提交
git status
git log -1 --oneline

# 3. 测试能否连上 GitHub 443（HTTPS）
Test-NetConnection github.com -Port 443

# 4. 测试能否连上 GitHub 22（SSH）
Test-NetConnection github.com -Port 22

# 5. 看 Git 是否配置了代理（有输出才需要处理）
git config --global --get http.proxy
git config --global --get https.proxy
```

**如何判断**：

- `TcpTestSucceeded : False` → 先解决网络/代理，再 push。
- `TcpTestSucceeded : True` 但 push 仍失败 → 看是认证问题（Token / SSH 密钥）。

---

## 三、推荐方案：HTTPS + Personal Access Token（PAT）

适合：不想折腾 SSH、或 SSH 22 端口被拦。

### 3.1 解决网络（443 连不上时必做）

任选其一（按你实际环境）：

**方式 1：开系统代理 / VPN**  
确保终端也能访问 GitHub（在浏览器打开 https://github.com 能稳定加载）。

**方式 2：给 Git 单独设代理**（本机代理例如 `127.0.0.1:7890`，端口按你的软件改）

```powershell
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```

取消代理（代理关掉后记得执行，否则 Git 会一直连错）：

```powershell
git config --global --unset http.proxy
git config --global --unset https.proxy
```

**方式 3：改用 SSH 远程**（见第四节，需 22 端口可用 + 配置密钥）

### 3.2 在 GitHub 创建访问令牌（PAT）

1. 登录 GitHub → **Settings** → **Developer settings** → **Personal access tokens**
2. 选 **Tokens (classic)** 或 **Fine-grained token**
3. 勾选至少：`repo`（私有/推送仓库需要）
4. 生成后**复制保存**（只显示一次）

### 3.3 把远程改成 HTTPS

```powershell
cd D:\study_file\myBlog

git remote set-url origin https://github.com/xizn/myBlog.git
git remote -v
```

### 3.4 首次推送

```powershell
git push -u origin main
```

弹出登录时：

- **Username**：你的 GitHub 用户名（如 `xizn`）
- **Password**：填 **PAT**（不是 GitHub 登录密码）

Windows 可用凭据管理器记住 Token，避免每次输入。

### 3.5 关于 `--force`（慎用）

```powershell
# 仅在「你确认要用本地覆盖远程」时使用
git push -u origin main --force
```

远程 [xizn/myBlog](https://github.com/xizn/myBlog) 目前只有 README 等少量提交；本地已有完整项目历史时，**第一次**可能需要普通 push；若远程有你不想要的提交且确定要覆盖，再用 `--force`。

**不要随便 force**，会删掉远程上别人或你之前的提交。

---

## 四、备选方案：SSH 密钥

适合：长期开发、已能访问 `github.com:22`。

### 4.1 生成密钥（本机当前无 SSH 公钥时需做）

```powershell
ssh-keygen -t ed25519 -C "你的邮箱@example.com" -f "$env:USERPROFILE\.ssh\id_ed25519"
```

一路回车即可（可选设 passphrase）。

### 4.2 复制公钥到 GitHub

```powershell
Get-Content "$env:USERPROFILE\.ssh\id_ed25519.pub" | Set-Clipboard
```

GitHub → **Settings** → **SSH and GPG keys** → **New SSH key** → 粘贴保存。

### 4.3 测试并设置远程

```powershell
ssh -T git@github.com
# 成功会看到：Hi xizn! You've successfully authenticated...

cd D:\study_file\myBlog
git remote set-url origin git@github.com:xizn/myBlog.git
git push -u origin main
```

---

## 五、完整上传流程（从零到成功）

假设本地代码已提交（`git status` 显示 clean）：

```powershell
cd D:\study_file\myBlog

# 1. 确认 .gitignore 已忽略敏感/大文件（本项目已有 node_modules、dist 等）
# 如有 .env、密钥文件，务必加入 .gitignore，不要提交

# 2. 若有未提交改动
git add .
git commit -m "描述本次改动的说明"

# 3. 设置远程（二选一，与第三节或第四节一致）
git remote set-url origin https://github.com/xizn/myBlog.git
# 或
# git remote set-url origin git@github.com:xizn/myBlog.git

# 4. 推送
git push -u origin main
```

成功后打开：https://github.com/xizn/myBlog 应能看到完整项目文件。

---

## 六、常见问题速查

| 现象 | 处理 |
|------|------|
| 443 连接超时 | 开代理/VPN；或 `git config` 设/清 `http.proxy` |
| `Permission denied (publickey)` | 配置 SSH 公钥，或改用 HTTPS + PAT |
| `Authentication failed` | PAT 过期/权限不足；重新生成并勾选 `repo` |
| `rejected (fetch first)` | 远程有新提交：`git pull origin main --rebase` 后再 push |
| `Repository not found` | 仓库名/权限不对；确认已登录正确 GitHub 账号 |
| 浏览器能上，Git 不能 | Git 未走代理 → 第三节 3.1 方式 2 |
| 只想上传、远程可覆盖 | 确认后使用 `git push --force`（见 3.5） |

---

## 七、你当前项目状态（检查清单）

根据本地环境整理，推送前请核对：

- [ ] 远程 URL 与你想用的方式一致（HTTPS **或** SSH，不要混用却不配密钥）
- [ ] `Test-NetConnection github.com -Port 443` 为 `True`（用 HTTPS 时）
- [ ] 已配置 PAT（HTTPS）或 SSH 公钥（SSH）
- [ ] 未把 `.env`、API Key、密码提交进仓库
- [ ] `git push -u origin main` 成功后在 GitHub 网页能看到代码

---

## 八、与本项目相关的安全提醒

- 不要提交：`.env`、`*.local` 中的密钥、数据库密码、第三方 API Secret
- 已在 `.gitignore` 中的：`node_modules`、`dist`、`release` 等无需上传
- Token / 密码只放在本机凭据管理器或环境变量，**不要写进代码再 push**

---

## 九、推荐你下一步执行的命令（HTTPS 路线）

```powershell
cd D:\study_file\myBlog

# 若你使用 Clash 等代理，把端口改成你的（没有代理就跳过这两行）
# git config --global http.proxy http://127.0.0.1:7890
# git config --global https.proxy http://127.0.0.1:7890

git remote set-url origin https://github.com/xizn/myBlog.git
git push -u origin main
```

若仍报 **443 连接失败** → 先解决网络/代理，不要反复 `--force`。  
若报 **认证失败** → 在 GitHub 创建 PAT，用 PAT 当密码。  
若网络通且想用 SSH → 按第四节生成密钥后再 `git push`。

---

*文档版本：2026-05-25 · 适用于 Windows PowerShell + GitHub 仓库 xizn/myBlog*
