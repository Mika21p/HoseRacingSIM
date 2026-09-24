# 当前项目结构与核对说明

本说明根据 2026-09-23 工作区整理；每次使用仍以实际文件为准，尤其是比赛列表、计数与测试入口。

## 资料入口

| 路径 | 用途 |
| --- | --- |
| `docs/historical-horse-maintenance.md` | 维护与构建约定；其中静态比赛列表可能落后于源文件 |
| `js/data/historical-horses/<地区>/<id>.js` | 单马资料，地区目录沿用当前归类 |
| `js/data/historical-horses/index.js` | 浏览器加载与构建索引；新增路径追加末尾 |
| `js/data/historical-horses/registry.js` | 同 ID 会覆盖，必须另外检查原始注册重复 |
| `js/data/races/` | 比赛源数据，包含动态生成赛事 |
| `js/data/jockeys.js` | 骑手、年份分段、地区映射 |
| `js/data/changelog.js` | `contentStats` 中内容计数；不为数据维护随意升级版本 |
| `tests/helpers/project-loader.js` | `loadProjectData()` 返回 races、horses、jockeys、horseFiles、context；horses 保留原始注册以便查重 |
| `tests/helpers/validate-data.js` | `validateProjectData(project)` 返回结构问题列表 |
| `tests/data-integrity.test.js` | 完整性检查及固定数量断言 |
| `docs/historical-horse-roster.csv` | 中文名、英文名、基础分、最高分、所属地域；核实文件编码与校对版本后使用 |
| `js/rules/historical-opponents.js` | 胜鞍如何进入历史对手索引以及运行时告警 |
| `scripts/audit-historical-horse-wins.js` | 联网 Wikipedia 比对；名称匹配、数据覆盖均有限 |
| `scripts/audit-legend-opponent-pools.js` | 传奇模式候选池审计 |

`js/` 是源数据，`dist/` 是构建生成物，不手工修改或提交。当前维护要求数据修改后完整测试并构建，不能沿用早期对话中“仅做 node --check 即完成”的做法。

## 单马字段

```js
(function () {
  const ns = (window.Keiba = window.Keiba || {});
  ns.HistoricalHorseRegistry.register({
    id: "sakura-star-o",
    name: "サクラスターオー",
    displayName: "樱花星王",
    displayNameZh: "樱花星王",
    displayNameEn: "Sakura Star O",
    profile: {
      baseAbility: 80,
      peakAbility: 82,
      note: "1987 年皋月赏与菊花赏双冠马。"
    },
    races: [
      { raceId: "yayoi-sho", year: 1987, ability: 80, jockeyId: "azuma-shinji", finish: 1 }
    ]
  });
})();
```

示例是字段说明，不是新马默认评分。复制模板时必须替换身份与数据。保留无关的已有字段。

`legendEligibilityWins` 是当前项目额外支持的传奇资格资料，字段含 `raceName`、`year`、`surfaceRegion`、`surface`、`distance`、`jockeyId`，用途不同于正常 `races`。只有用户要求维护传奇资格且已读相关消费逻辑时才使用；不得借此绕过用户“比赛不存在就跳过”的要求。检查既有记录，不把它计为正常赛事胜鞍。

## 事实核实表

每条候选胜鞍保留：马匹 ID、年份/日期、当时赛事名、国家/场地/距离、名次、实际骑手、证据 URL、当前 raceId/jockeyId、拟表现分、录入状态及原因。资料表可在工作中维护；任务较大或有跳过项时写入用户可查的报告，避免只在聊天中丢失依据。

不能混淆香港女皇杯与日本女皇杯、同名各国比赛、TCK 女王杯与兵库女王杯等。即使有沿革关系，也需验证项目是否具有历史版本支持；当前 ID 合法不代表历史映射正确。旧对话中的阪神三岁锦标、高松宫杯等映射需要结合当时限制与当前使用逻辑重新判断。

## 读取最新实际列表

在项目根目录用 Node 加载 `require('./tests/helpers/project-loader').loadProjectData()`，对返回的 `races` 按目标 ID 或名称筛选并查看字段。不要复制过时的依赖顺序手写浏览器模拟环境；加载器目前还加载赛场目录和赛程属性。

现有验证器没有完整覆盖分数上下限、骑手有效年份、普通胜鞍重复等规则，使用技能补充脚本检查。脚本只读取项目，既有错误也会报告，不应擅自修正任务外马匹。

## 阶段验收例

- 用户要求“拟中文名与分数”：输出审阅表，源数据无改动。
- 已确认分数且要求录入：核实逐场实际骑手，缺项列出，计数和索引一起更新。
- 只改中文名：显示名一致，原名/ID/分数保留，检查相关 CSV 是否属于同步范围。
- 基础分提高导致部分比赛越界：修订这些表现分并复核巅峰约束，列出差异。
- 测试通过但赛事历史资格不符：仍算资料问题，不能据此报告史实核对通过。
