# GitHub Pages 部署说明

## 方案一：网页上传，最简单

1. 打开 GitHub，创建新仓库：`xingqiong-hub`
2. 选择 Public 或 Private 都可以
3. 点击 `Add file` → `Upload files`
4. 把本目录里的所有文件拖进去
5. Commit
6. 打开 `Settings` → `Pages`
7. Build and deployment 的 Source 选择 `GitHub Actions`
8. 等待 `.github/workflows/pages.yml` 自动运行完成

## 方案二：命令行上传

把下面命令里的用户名和仓库地址换成你的：

```powershell
Set-Location 'E:\Codex\github-pages\xingqiong-hub'
git init
git add .
git commit -m "Deploy Xingqiong Hub"
git branch -M main
git remote add origin https://github.com/你的用户名/xingqiong-hub.git
git push -u origin main
```

然后到 GitHub 仓库页面：

```text
Settings → Pages → Source: GitHub Actions
```

## 更新网页

以后修改 `E:\GeminiSanctuary` 后，可以重新生成静态包，再同步到这个仓库目录，然后执行：

```powershell
git add .
git commit -m "Update Xingqiong Hub"
git push
```
