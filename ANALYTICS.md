# 星穹枢庭访问统计

本站使用 [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/about/)。
网站仍由 GitHub Pages 托管，无需改域名、DNS 或发布方式。

## 查看数据

登录 [Cloudflare 控制台](https://dash.cloudflare.com/?to=/:account/web-analytics)，
进入 **Web Analytics**，选择 `stardustlc666.github.io`。
如同一主机以后接入其他项目，可用页面路径筛选 `/xingqiong-hub/`。

- **Page views**：网页浏览次数。
- **Visits**：从外部网站或直接链接进入的访问次数；一次访问可以浏览多个页面。
  该指标不是按自然人去重的 UV，不能称为“独立访客人数”。
- 按页面、来源、国家或设备查看访问情况及加载性能。
- 只记录接入后的访问，无法补回之前未记录的历史流量。
- JavaScript 被禁用、统计请求被拦截或未能送达的访问可能漏计。

指标定义见 [Cloudflare 官方说明](https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/)。

## 接入范围与隐私

`assets/sanctuary.js` 是全部 18 个 HTML 页面的共享入口，覆盖首页、各工具页和 404 页。
统计脚本仅在 `stardustlc666.github.io/xingqiong-hub/` 下加载，本地预览、下载副本和其他项目不会上报。

唯一新增的第三方脚本来自 `https://static.cloudflareinsights.com/beacon.min.js`，
通过 HTTPS 异步加载；统计请求发送给 Cloudflare，失败不会阻塞站点功能。
不添加表单内容、提示词草稿、图片、点击录屏或自定义用户标识的采集。
Cloudflare 的统计脚本不读写 Cookie、localStorage 或 sessionStorage，
详见 [RUM 数据与隐私说明](https://developers.cloudflare.com/speed/observatory/rum-beacon/)。
网站原有的路线、草稿与访问进度仍使用浏览器本地存储。

## 站点标识与维护

在 Cloudflare **Web Analytics → Add a site** 添加主机名 `stardustlc666.github.io`，
使用手动安装方式。将生成片段中的 `token` 填入
`assets/sanctuary.js` 的 `CLOUDFLARE_ANALYTICS_TOKEN`。
这是可以放在前端的公开站点标识，不能使用账号 API 密钥代替。
留空或格式不正确时，统计保持关闭。

站点为多页应用，使用 `spa: false`，避免页面内部的锚点或状态变化额外记为浏览。
无需在每个 HTML 页面重复粘贴第三方脚本。

发布前执行：

```bash
node scripts/check-static-site.mjs
node scripts/check-site-conventions.mjs
```

推送到 `main` 后等待 GitHub Pages 部署完成，打开正式站点并浏览一个工具页，
确认浏览器产生成功的 Cloudflare RUM 请求，再在后台确认数据出现。
数据可能需要几分钟处理；验证时产生的访问属于维护测试，应与后续外部流量区分。
