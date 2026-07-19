# 星穹枢庭 · Gemini Sanctuary

「星穹枢庭」是一个部署在 GitHub Pages 上的个人创作档案站，用于公开整理提示词、视觉实验与生成式创作方法。

公网地址：

https://stardustlc666.github.io/xingqiong-hub/

## 站点内容

- 常规创作路线：起词、结构、光影与系统校准
- 成人向创作路线：查词、分类、权重组合与过程复盘
- 14 份可直接从公网浏览的手册、提示词、标签、工具与协议档案
- Three.js 动态主视觉、真实项目预览和完整响应式布局

## 公网发布

本站通过 GitHub Pages 的分支发布模式上线：

- Source：`Deploy from a branch`
- Branch：`main`
- Folder：`/ (root)`

推送到 `main` 后，GitHub Pages 会自动构建并更新公网网页。仓库不依赖自定义 GitHub Actions 发布工作流。

完整的更新、验证和可选自定义域名步骤见 [DEPLOY.md](DEPLOY.md)。

## 本地预览

发布前可在仓库目录启动一个静态文件服务：

```powershell
Set-Location 'E:\Codex\github-pages\xingqiong-hub'
py -3 -m http.server 18446 --bind 127.0.0.1
```

浏览器访问：

```text
http://127.0.0.1:18446/
```

本地预览只用于开发检查，公网访问不依赖这项服务。
