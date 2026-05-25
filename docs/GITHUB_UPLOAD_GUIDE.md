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

## 不要提交的内容

`.gitignore` 已忽略 `node_modules`、`dist` 等。切勿提交 `.env`、API Key、密码等敏感信息。
