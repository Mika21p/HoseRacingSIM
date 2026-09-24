# 首页美化交付记录

日期：2026-09-20

## 实现

首页采用深蓝底色、原创日系赛马插画，以及青色、橙金等模式识别色。页面顺序为品牌、主题横幅、五种模式、玩法说明、帮助与反馈。

- 普通生涯、传奇模式、肉鸽挑战、剧情模式、国际主席模式平级展示；桌面五列，中屏两列，手机单列。
- 保留原来的按钮 ID、点击事件、存档判断、剧情未完成标识与主席开发中标识。普通与传奇继续使用既有生涯存档机制。
- 已有存档时，各卡片预留第二行操作区，主要按钮仍对齐；手机只显示实际可用的按钮行。
- 样式集中在 `css/home.css`，限定首页。构建脚本复制 `assets`，首页渲染与主席入口脚本更新缓存版本。
- 主 Logo 同时用作浏览器图标。装饰图片使用空 alt，按钮保留文字、至少 44px 高度及键盘焦点样式。

## 原创素材

项目素材目录：`assets/home/`。

| 文件 | 用途 |
| --- | --- |
| racing-hero.png | 2172 × 724 原创赛马横幅，约 2.3 MB |
| logo.svg | 马首与赛道组成的主 Logo / favicon |
| career.svg | 生涯马蹄 |
| legend.svg | 传奇桂冠 |
| rogue.svg | 肉鸽骰子 |
| era.svg | 剧情书卷 |
| chairman.svg | 主席盾徽 |

底图使用内置 image_gen 生成，未使用 CLI/API fallback；原图已复制到项目资源目录。SVG 图标由代码直接绘制。

### 实际绘图提示词

```text
Use case: illustration-story. Create a polished original anime sports illustration as a wide cinematic website hero background, aspect ratio 3:1, landscape. A thrilling thoroughbred turf race: two anatomically believable real horses with helmeted jockeys, the leading powerful dark bay horse large on the RIGHT HALF of the composition, galloping toward the viewer and slightly left, jockey in ivory and vivid orange racing silks leaning forward; second horse and cyan-clad jockey behind near right edge. Sweeping curved white rails, emerald grass with flying grass particles, flowing bright clouds and subtle speed streaks. Japanese hand-painted animation background with crisp confident ink contours, rich painterly cel shading, dramatic late-afternoon sunshine, youthful athletic energy and premium game key-art finish. Navy blue and teal shadows with warm golden sunlight. Reserve the entire LEFT 40 percent as quiet atmospheric deep navy and teal racetrack scenery with subtle mist and low detail, suitable for white HTML headline overlay. The horses and riders must remain fully readable on the right and away from the far outer edges, correct legs and tack, no human horse hybrids. Background image only, absolutely no lettering, numbers, logos, UI, badges, watermarks or text. This is an original horse-racing game named 赛马生涯模拟 but do not write its name on image.
```

## 文案规范

五个模式的卡片文案统一存放在 `js/data/home-modes.js`（`ns.HomeModes.copy`），`js/ui/render.js` 渲染 01—04 号卡片、`js/chairman-app.js` 渲染 05 号卡片时都从这份数据读取，避免同一句话在两处漂移。修改文案只需改这一个文件。

| 字段 | 约束 |
| --- | --- |
| index | `0N / ENGLISH`，两位序号加英文单词 |
| title | 固定 4 字 |
| badge | 留空或固定 3 字（未完成 / 开发中） |
| tagline | 9—11 字，无标点单句 |
| description | 26—32 字，逗号连缀单句并以句号结尾 |
| tags | 固定两枚，每枚 4 字 |
| status | 「暂无存档」或「A · B」两段式；有存档信息的卡片默认值必须与运行时格式一致 |
| startLabel / resumeLabel | 4—6 字，不含空格、斜杠与括号 |

按钮约定：新开一局用「开始」（01—03），进入既有世界或章节选择用「进入」（04—05）；恢复进度一律用独立的「继续 X」次按钮，不把两种状态合并进同一个按钮。

普通生涯与传奇模式共用一份生涯存档，因此两张卡片都要显示存档状态并提供继续入口：01 号卡片用 `homeSaveStatus` 与 `homeContinueBtn`，02 号卡片用 `homeLegendSaveStatus` 与 `homeLegendContinueBtn`；存档属于另一模式时，状态行显示「本机存档为普通生涯 / 传奇模式」。模式判定由 `js/app.js` 的 `savedCareerMode()` 读取存档 payload 的 `state.career.gameMode` 得出。

上述约束由 `tests/ui-workspace.test.js` 的「home mode copy keeps one data source and a consistent shape」用例校验，改动文案后请一并运行 `npm run test:quick`。

## 验收结果

- `npm run test:quick`：142 项通过，0 失败。
- `npm run build:web`：通过；471 个史实马数据文件正常打包，底图和六个 SVG 在构建目录中与源文件一致。
- Edge 无头浏览器分别检查 1440、1024、768、390、320px：无横向溢出，七张图片均加载完成，所有可见首页按钮高度不少于 44px，桌面同排按钮对齐。
- 交互检查：普通与传奇模式选择、退出设置、剧情进入与返回、主席大厅进入与返回、肉鸽创建及继续候选、生涯生成及继续、刷新后存档继续、新生涯设置取消、帮助及焦点恢复、日志开关、复制群号均通过。
- 主席重复挂载不产生重复入口；拦截底图加载后仍可进入模式；键盘 Enter 激活、焦点边框和减少动画设置通过。
- 上述浏览器检查均在独立测试上下文中进行，不使用用户浏览器存档。
- 构建后的 `/dist/` 页面也完成资源加载及键盘操作检查，未记录脚本错误或失败请求。

截图及机器检查结果保存在 `artifacts/home/`：

- `home-1440.png`、`home-1024.png`、`home-768.png`、`home-390.png`、`home-320.png`：完整页面。
- `home-desktop-preview.png`、`home-mobile-preview.png`：首屏效果。
- `home-saved-1440.png`、`home-saved-390.png`：同时存在生涯与肉鸽存档的页面。
- `layout-check.json`、`interaction-check.json`、`production-check.json`：布局、交互及构建页面检查记录。

仅完成本地修改和验证，未发布上线。
