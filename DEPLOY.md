# GitHub Pages 部署说明

当前仓库使用 GitHub Actions 发布到 GitHub Pages。

网页地址：

```text
https://stardustlc666.github.io/xingqiong-hub/
```

## 更新网页

以后修改 `E:\GeminiSanctuary` 后，可以重新生成静态包，再同步到这个仓库目录，然后执行：

```powershell
Set-Location 'E:\Codex\github-pages\xingqiong-hub'
git add .
git commit -m "Update Xingqiong Hub"
git push
```

推送后 `.github/workflows/pages.yml` 会自动发布 `_site` artifact 到 GitHub Pages。
