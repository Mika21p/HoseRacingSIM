# 首页图片加载优化

日期：2026-09-20

沿用原有原创赛马插画，进行确定性的缩放、裁切与格式压缩，不重新生成画面。PNG 原图保留在 `assets/home/racing-hero.png`，页面不再请求原图。

## 文件与体积

以下文件均位于 `assets/home/`，文件名中的 10 位摘要取自文件内容 SHA-256。

| 文件 | 尺寸 | 字节 | 相比原图减少 |
| --- | --- | ---: | ---: |
| racing-hero.png（原始素材） | 2172 × 724 | 2,331,888 | — |
| racing-hero-1280.1693b82dc7.webp | 1280 × 427 | 88,398 | 96.2% |
| racing-hero-1920.63f61e69c0.webp | 1920 × 640 | 160,182 | 93.1% |
| racing-hero-mobile.32ed156b66.webp | 1020 × 543 | 85,842 | 96.3% |
| racing-hero-fallback.35962b9580.jpg | 960 × 320 | 40,541 | 98.3% |

压缩工具为本地 sharp。桌面 WebP quality=82、effort=6；手机从原图 x=585、y=0 处提取 1360 × 724，再缩至 1020px 宽，quality=78、effort=6；备用 JPEG 宽 960px、quality=70、mozjpeg=true。手机裁切与原页面 72% 的水平焦点对应，保留马匹主体。

## 加载方式

- 639px 及以下使用手机 WebP；其余由浏览器依据显示宽度和像素密度选择 1280 或 1920 WebP。
- HTML 声明与 picture 匹配的预加载条件，不等待游戏数据和页面渲染才开始下载图片。
- 保留高优先级，采用异步解码；实测正常加载时只请求一张底图，预加载与显示复用同一请求。
- 不支持 WebP 的浏览器使用小型 JPEG。WebP 网络失败时，移除 picture 的候选来源并尝试 JPEG 一次；备用图也失败则隐藏图片，显示原有深蓝背景及渐变，标题和按钮保持可用。
- 更新页面样式与渲染脚本版本，并使用带内容摘要的图片文件名。现有构建复制全部资源；部署触发路径补入 `assets/**`，以支持仅更新图片的提交。
- 未新增运行依赖，未修改服务器缓存设置，未发布远端。

## 验证

- `npm run test:quick`：142 项通过，0 失败；`npm run build:web` 通过。
- 在 1440、1024、768、639、390、320px 下检查选图、布局和图片请求，包含 1×、2×、3× 像素密度组合。每次初次加载仅请求一张对应 WebP，且由预加载发起，不请求原始 PNG。
- 分别模拟 WebP 失败、全部图片失败：备用 JPEG 仅请求一次，无重试循环；均可正常进入生涯设置。
- 结果：`artifacts/home/image-optimization-check.json`。
- 桌面与手机截图：`artifacts/home/optimized-home-1440.png`、`artifacts/home/optimized-home-390.png`。
- 失败兜底截图：`artifacts/home/optimized-webp-fails.png`、`artifacts/home/optimized-all-fail.png`。
- 构建页面额外通过 1 Mbps 下行、150ms 延迟、禁用缓存的模拟弱网检查：手机版底图请求 85,842 字节，本次约 3.85 秒完成（与其余页面资源共用限速连接），无脚本错误，生涯入口可用。此为本地网络模拟结果，不代表远端所有网络条件。
- 弱网记录：`artifacts/home/image-slow-network-check.json`。
