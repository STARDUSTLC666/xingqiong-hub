# 星穹枢庭 · Gemini Sanctuary

这是「星穹枢庭」的 GitHub Pages 静态网页版本。

它适合部署为公开或私有的网页备份，用来保存：

- 星门首页
- 星门说明
- Prompt / ComfyUI / Nova Anima / 标签资料
- 本地工具入口说明

## 在线部署

推荐用 GitHub Pages：

1. 新建一个 GitHub 仓库，例如 `xingqiong-hub`
2. 把本文件夹内容上传到仓库根目录
3. 进入仓库 `Settings` → `Pages`
4. Source 选择 `GitHub Actions`
5. 推送后等待 Actions 自动部署

部署成功后，网址通常是：

```text
https://你的GitHub用户名.github.io/xingqiong-hub/
```

## 本地预览

在本目录打开 PowerShell：

```powershell
py -3 -m http.server 18446 --bind 127.0.0.1
```

然后访问：

```text
http://127.0.0.1:18446/
```


## 公网网页调用本地工具

可以，但有前提：网页只是控制台，真正的工具仍然运行在你的电脑上。

- 你自己电脑打开 GitHub Pages 网页时，页面可以尝试连接 `http://127.0.0.1:*` 的本地服务。
- 桥接启动按钮通过本机已注册的协议工作，例如 `qiqi-bridge://start`、`qiqi-wd://start`。
- 如果本地服务没启动、协议没注册、浏览器拦截本地网络请求，对应工具就不会生效。
- 别人打开这个网页时，只会连接他们自己的 `127.0.0.1`，不会连到你的电脑。
## 注意

这是静态网页版本。页面本身可以公网访问，但这些能力仍然只在你自己的电脑上有效：

- `127.0.0.1` 本地服务
- WD Tagger 后端
- ComfyUI 本地后端
- 自定义协议桥接按钮，例如 `qiqi-bridge://start`

如果别人打开公网网页，这些本地工具按钮不会连接到你的电脑。
