# WD Tagger 修复交接单（给 a栖栖）

## 任务目标

修复 `E:\GeminiSanctuary\wd-tagger` 的 WD Tagger 网页，让用户可以在浏览器中完成：

1. 打开页面
2. 拖入/选择图片
3. 点击「反推标签」
4. 页面展示 WD14 标签、置信度、可选标签、复制结果

最终验收标准：**用户无需看控制台、无需手动调 API，只要启动入口后，网页端反推流程稳定可用。**

---

## 当前项目路径

| 用途 | 路径 |
|---|---|
| WD Tagger 前端页 | `E:\GeminiSanctuary\wd-tagger\index.html` |
| 静态网页服务器 | `E:\GeminiSanctuary\wd-tagger\serve.js` |
| WD14 ONNX 推理服务 | `E:\GeminiSanctuary\wd-tagger\wd14_server.py` |
| ComfyUI 启停控制器 | `E:\GeminiSanctuary\wd-tagger\comfy-launcher.js` |
| 共享样式 | `E:\GeminiSanctuary\assets\gemini.css` |
| 共享 JS 工具 | `E:\GeminiSanctuary\assets\gemini.js` |
| WD14 模型目录 | `E:\Codex\ComfyUI\models\wd14_tagger` |

---

## 已验证事实

### 1. WD14 模型本身没有坏

模型文件：

```text
E:\Codex\ComfyUI\models\wd14_tagger\wd-v1-4-moat-tagger-v2.onnx
E:\Codex\ComfyUI\models\wd14_tagger\wd-v1-4-moat-tagger-v2.csv
```

Python/Node 直接调用 `wd14_server.py` 的 HTTP 接口已经成功：

```text
POST http://127.0.0.1:18434
Content-Type: image/png
X-Threshold: 0.3
Body: 图片二进制
```

实测返回：

```text
9 tags in 451ms
```

说明：ONNX 推理、CSV 标签映射、模型路径都没有根本问题。

### 2. ComfyUI WD14 节点路线不可靠

曾尝试通过 ComfyUI 的 `WD14Tagger|pysssss` 节点跑反推，但反复超时 60s/120s。后来确认直接 ONNX CPU 推理只需要约 0.4–0.6s，因此不要继续把网页反推绑定到 ComfyUI 节点。

当前推荐架构：

```text
网页 → WD14 本地微服务 :18434 → ONNX Runtime CPU → 返回标签
```

ComfyUI 开关可以保留，但不应成为 WD14 反推的必要依赖。

### 3. 当前失败点在网页链路

服务端直接测试可用，但用户在网页点击「反推标签」仍失败。最可能原因：

- 页面从 `file://` 打开，浏览器拦截请求本地 HTTP 服务
- 页面从 `http://127.0.0.1:18435` 打开，但跨端口请求 `http://127.0.0.1:18434` 触发 CORS/preflight 问题
- `serve.js` 作为后台进程被 OpenClaw 执行环境 SIGKILL，用户打开的入口不稳定
- `index.html` 的 `runTagger()` 错误提示太粗，无法判断具体失败阶段

---

## 建议修复方案

请按优先级处理。

### 方案 A：推荐，做一个单入口 Node 服务器

把 `serve.js` 升级为统一入口，提供：

| 路径 | 方法 | 作用 |
|---|---|---|
| `/` | GET | 返回 `index.html` |
| `/assets/...` | GET | 返回共享 CSS/JS |
| `/api/tagger/status` | GET | 代理检查 `http://127.0.0.1:18434` |
| `/api/tag` | POST | 接收图片二进制，转发给 `http://127.0.0.1:18434` |
| `/api/comfy/status` | GET | 代理 `http://127.0.0.1:18433/status` |
| `/api/comfy/start` | POST/GET | 代理启动 ComfyUI |
| `/api/comfy/stop` | POST/GET | 代理停止 ComfyUI |

然后把 `index.html` 里的前端请求全部改为同源相对路径：

```javascript
fetch('/api/tagger/status')
fetch('/api/tag', { method: 'POST', body: blob })
fetch('/api/comfy/status')
fetch('/api/comfy/start')
fetch('/api/comfy/stop')
```

这样页面不再跨端口，不再依赖浏览器 CORS 行为。

### 方案 B：补一个一键启动脚本

新增：

```text
E:\GeminiSanctuary\wd-tagger\启动WD标签反推器.cmd
```

职责：

1. 启动 `wd14_server.py`
2. 启动 `comfy-launcher.js`（可选）
3. 启动 `serve.js`
4. 打开 `http://127.0.0.1:18435`

注意：不要依赖 OpenClaw 的后台 `exec` 长期保活。用户双击 `.cmd` 启动更稳定。

### 方案 C：改善前端错误提示

`runTagger()` 失败时不要只 toast “反推失败”。建议显示：

- 当前请求 URL
- HTTP 状态码
- 是否拿到 JSON
- 服务是否在线
- 建议启动命令

例如：

```javascript
catch (e) {
  gsToast('反推失败：' + e.message + '。请确认页面从 http://127.0.0.1:18435 打开，且 WD14 服务在线。');
}
```

---

## 需要避免的坑

1. 不要再纠结 ComfyUI WD14 节点。它已证实超时，不是当前最短路径。
2. 不要只说“服务是好的”。用户失败发生在浏览器端，必须修网页链路。
3. 不要让用户手动运行三条命令。最终需要一键入口。
4. 不要从 `file://` 打开页面作为正式入口。
5. 不要依赖 OpenClaw 后台进程长期保活，之前 `serve.js`/Python 服务都出现过 SIGKILL 日志。

---

## 推荐验证流程

### 1. 启动服务

优先用你新增的一键 `.cmd`。如果还没写脚本，手动启动：

```powershell
python E:\GeminiSanctuary\wd-tagger\wd14_server.py
node E:\GeminiSanctuary\wd-tagger\serve.js
```

如需 ComfyUI 开关：

```powershell
node E:\GeminiSanctuary\wd-tagger\comfy-launcher.js
```

### 2. 浏览器打开

```text
http://127.0.0.1:18435
```

不要用：

```text
file:///E:/GeminiSanctuary/wd-tagger/index.html
```

### 3. 页面测试

- 拖入任意 PNG/JPG/WebP
- 点击「反推标签」
- 预期：1 秒内返回标签列表
- 标签应包含：tag name、confidence、category
- 复制标签功能可用

### 4. API 测试

如果页面仍失败，用 Node 直接测：

```javascript
const http=require('http');
const fs=require('fs');
const img=fs.readFileSync('测试图片路径');
const req=http.request({
  hostname:'127.0.0.1',
  port:18434,
  method:'POST',
  headers:{
    'Content-Type':'image/png',
    'Content-Length':img.length,
    'X-Threshold':'0.3'
  }
}, res=>{
  let d='';
  res.on('data', c=>d+=c);
  res.on('end', ()=>console.log(d));
});
req.write(img);
req.end();
```

---

## 最终交付要求

请完成后明确告诉用户：

1. 修改了哪些文件
2. 现在应该从哪个地址打开网页
3. 一键启动脚本在哪里
4. 是否验证过反推成功
5. 如果仍失败，用户应该复制哪一段错误给你

建议最终交付形态：

| 交付项 | 要求 |
|---|---|
| 页面入口 | `http://127.0.0.1:18435` |
| 启动脚本 | `E:\GeminiSanctuary\wd-tagger\启动WD标签反推器.cmd` |
| 前端请求 | 全部改为同源 `/api/...` |
| 验证结果 | 至少一次 API 或页面级反推成功 |

---

## 一句话判断

这个问题不是模型问题，也不是 WD14 算法问题；是**网页端入口和本地服务之间的工程链路没有封装好**。把跨端口请求收敛到同源代理，再给用户一个稳定的一键启动入口，就能收尾。