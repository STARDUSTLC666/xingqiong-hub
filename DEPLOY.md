# GitHub Pages 部署说明

当前公网地址：

```text
https://stardustlc666.github.io/xingqiong-hub/
```

## 发布配置

本仓库使用 GitHub Pages 的分支发布模式，不使用仓库内的自定义 GitHub Actions 工作流：

1. 打开仓库的 `Settings` → `Pages`。
2. 在 `Build and deployment` 中将 `Source` 设为 `Deploy from a branch`。
3. 将分支设为 `main`，目录设为 `/ (root)`，然后保存。

此配置下，GitHub Pages 会在 `main` 根目录收到新提交后自动触发平台内建的 `pages build and deployment`，并更新公网网页。

## 更新网页

在仓库目录检查并提交需要发布的静态文件：

```powershell
Set-Location 'E:\Codex\github-pages\xingqiong-hub'
git status --short
git add -A
git commit -m "Update Xingqiong Hub"
git push origin main
```

推送完成后通常需要等待几分钟。无需生成 `_site` artifact，也无需维护 `.github/workflows/pages.yml`。

## 验证发布

先查看 GitHub Pages 平台构建记录：

```powershell
gh run list --repo STARDUSTLC666/xingqiong-hub --workflow pages-build-deployment --limit 5
```

找到名称为 `pages build and deployment` 的最新记录，确认状态为 `completed`、结论为 `success`。

再从公网请求站点，确认返回 `HTTP 200`：

```powershell
curl.exe -L --fail --silent --show-error --output NUL --write-out "HTTP %{http_code}\n" https://stardustlc666.github.io/xingqiong-hub/
```

需要检查响应头时可运行：

```powershell
curl.exe -I https://stardustlc666.github.io/xingqiong-hub/
```

## 本地预览

发布前可直接预览仓库根目录：

```powershell
Set-Location 'E:\Codex\github-pages\xingqiong-hub'
py -3 -m http.server 18446 --bind 127.0.0.1
```

然后访问 `http://127.0.0.1:18446/`。这只是发布前检查方式，不参与公网部署。

## 可选：绑定自定义域名

以下步骤仅在以后准备好自己的域名时执行；当前文档不表示已经绑定任何自定义域名。

1. 在仓库 `Settings` → `Pages` 的 `Custom domain` 中填写域名，例如 `www.example.com`，然后保存。
2. 确认仓库根目录存在 `CNAME` 文件，且文件内容只有该域名：

```text
www.example.com
```

3. 在域名 DNS 控制台为 `www` 添加 `CNAME` 记录，目标设为：

```text
stardustlc666.github.io
```

4. 等待 DNS 和 GitHub Pages 证书生效，回到 Pages 设置勾选 `Enforce HTTPS`。
5. 验证 DNS 与 HTTPS：

```powershell
Resolve-DnsName www.example.com
curl.exe -I https://www.example.com/
```

如果使用根域名（例如 `example.com`），应按 GitHub Pages 官方说明配置根域名的 `A`、`AAAA` 或 DNS 服务商提供的 `ALIAS` / `ANAME` 记录；不要把根域名直接配置为普通 `CNAME`。
