# 史实赛马数据维护参考

本文档用于维护 `js/data/historical-horses/` 下的史实赛马文件。

## 源文件、构建文件与发布

- `js/` 和 `css/` 下的文件是需要人工维护的源文件。
- `dist/` 是通过 `npm run build:web` 自动生成的发布目录，不提交到 Git，也不得手工修改。
- 史实马继续采用“一匹马一个文件”的形式维护。构建时会按照 `js/data/historical-horses/index.js` 的清单顺序，将全部史实马合并成一个带内容哈希的发布文件。
- 本地源码版仍按逐文件方式加载；腾讯 COS 上的生产版本只加载一个史实马合并文件。
- 合并到 `main` 后，GitHub Actions 会依次运行测试、构建 `dist/`，再把 `dist/` 同步到腾讯 COS。

提交前执行：

```powershell
npm test
npm run build:web
```

测试或构建失败时不要提交 `dist/`，应修正对应源文件后重新执行命令。

## 日常更新流程

### 修改已有赛马

1. 只修改对应地区目录下的单马源文件。
2. 保持赛马 `id` 和文件路径不变；名称、显示名、能力和比赛记录可以直接调整。
3. 不要编辑 `dist/` 或 `historical-horses.<hash>.js`。
4. 运行 `npm test` 和 `npm run build:web`。
5. 推送后由部署流程重新生成合并包并发布。

### 新增赛马

1. 复制同地区的现有文件作为模板，并保持一匹马一个文件。
2. 为赛马设置唯一的小写英文连字符 `id`。
3. 在 `js/data/historical-horses/index.js` 的 `files` 数组末尾登记相对路径，不调整既有条目的顺序。
4. 将 `js/data/changelog.js` 的 `contentStats.historicalHorses` 加一。
5. 将 `tests/data-integrity.test.js` 中的史实马预期数量加一。
6. 运行 `npm test` 和 `npm run build:web`。构建会拒绝遗漏登记、重复登记、路径不存在或目录中存在未登记文件的情况。
7. 不需要手动合并文件，也不需要提交 `dist/`。

### 删除或重命名赛马

- 删除赛马：删除单马源文件和清单条目，将内容统计和测试预期数量减一，并全局检查该 `id` 是否被时代模式或其他规则引用。
- 只重命名文件：同步修改清单中的路径，保留赛马 `id`。
- 修改赛马 `id`：视为高风险数据变更，默认不执行。确有必要时，先检查全部规则引用和历史存档兼容性，并使用独立提交。

### 修改赛事或骑手

- 修改显示名称或能力时保持原有 `id` 不变，并运行完整测试。
- 新增赛事或骑手时使用唯一 `id`，更新 `js/data/changelog.js` 中的对应内容统计，并同步更新数据完整性测试中的预期数量。
- 删除或修改 `id` 前，先全局检查所有 `raceId`、`jockeyId` 和时代模式引用；不得留下未知引用。

### 修改规则、界面或样式

- 继续编辑 `js/rules/`、`js/ui/` 和 `css/` 下的源文件，不编辑 `dist/`。
- 规则变更必须运行完整测试。
- 界面或样式变更除运行测试外，还应检查桌面和手机宽度下的首页、生涯界面和时代模式。

### 发布检查与故障处理

1. 合并到 `main` 后确认 GitHub Actions 的测试、构建和 COS 部署均成功。
2. 使用冷缓存打开线上页面，确认首页可显示、史实马数量正确且控制台没有加载错误。
3. 若构建提示文件未登记，在史实马清单中补充路径。
4. 若构建提示清单文件不存在，修正路径或恢复对应文件。
5. 若测试提示赛事或骑手引用无效，修正 `raceId` 或 `jockeyId`。
6. 若线上合并包异常，回退部署工作流到上一版本即可；源数据和浏览器存档不需要迁移。

## 史实赛马文件范例

新增史实马时，建议一个马一个文件，例如：

```js
(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.HistoricalHorseRegistry.register({
    id: "sample-horse",
    name: "サンプルホース",
    displayName: "Sample Horse",
    profile: {
      baseAbility: 82,
      peakAbility: 86,
      note: "这里写维护备注。"
    },
    races: [
      { raceId: "satsuki-sho", year: 2020, ability: 84, jockeyId: "christophe-lemaire", finish: 1, trackCondition: "良" },
      { raceId: "tokyo-yushun", year: 2020, ability: 86, jockeyId: "christophe-lemaire", finish: 2, trackCondition: "稍重" }
    ],
    legendEligibilityWins: [
      { raceName: "现实中未实装的条件赛", year: 2020, surfaceRegion: "日本", surface: "泥地", distance: 2400, jockeyId: "christophe-lemaire" }
    ]
  });
})();
```

新增文件后，还需要在 `js/data/historical-horses/index.js` 的 `files` 数组里追加文件名：

```js
const files = [
  "deep-impact.js",
  "sample-horse.js"
];
```

### 字段说明

- `id`: 史实马唯一 ID，建议小写英文加连字符。
- `name`: 原名或日文名。
- `displayName`: UI 或备注用显示名。
- `profile.baseAbility`: 基础能力参考值。
- `profile.peakAbility`: 巅峰能力参考值。
- `profile.note`: 维护备注，不直接影响比赛。
- `races[].raceId`: 比赛 ID，必须使用下方赛事清单中的 ID。不存在的比赛会被校验逻辑忽略并警告。
- `races[].year`: 对应年份。
- `races[].ability`: 该年该场比赛的对手能力值。
- `races[].jockeyId`: 骑手 ID，必须使用下方骑手清单中的 ID。
- `races[].finish`: 史实名次。默认比赛对手池只抽取 `finish: 1` 的史实冠军；其他名次会作为资料保留，不会默认成为对手。
- `races[].featured`: 重要参赛标记，可选。当前默认规则不使用，预留给以后扩展“重要参赛马池”。
- `races[].trackCondition`: 场地状态，可选，支持 `良`、`稍重`、`重`、`不良`。
- `legendEligibilityWins`: 传奇模式专用的真实胜鞍列表，用于尚未实装或没有固定游戏赛事 ID 的比赛；普通模式对手索引不会读取。
- `legendEligibilityWins[].raceName/year/surfaceRegion/surface/distance/jockeyId`: 分别记录胜鞍名称、年份、赛区、场地、距离和骑手。该数组只能登记冠军，因此不填写 `finish` 或 `ability`。
- 不得为了登记现实条件赛胜鞍而伪造或借用游戏内条件赛 ID；应使用 `legendEligibilityWins`，以免普通模式条件赛误抽史实马。

## 日本公开赛与重赏赛事 ID

以下仅列出当前数据库中日本赛事的公开赛及重赏级别，不包含新马、未胜利、一胜、二胜、三胜等条件赛。

### 公开赛 / Listed / OP

- クロッカスS - `crocuss-stakes` (1月 / 草地1400m / 东京 / 3岁)
- ジャニュアリーS - `january-stakes` (1月 / 泥地1200m / 中山 / 4岁以上)
- ジュニアC - `junior-cup` (1月 / 草地1600m / 中山 / 3岁)
- すばるS - `subaru-stakes` (1月 / 泥地1400m / 京都 / 4岁以上)
- ニューイヤーS - `new-year-stakes` (1月 / 草地1600m / 中山 / 4岁以上)
- 紅梅S - `kobai-stakes` (1月 / 草地1400m / 京都 / 3岁 / 牝马限定)
- 若駒S - `wakagoma-stakes` (1月 / 草地2000m / 京都 / 3岁)
- 白富士S - `shirafuji-stakes` (1月 / 草地2000m / 东京 / 4岁以上)
- 万葉S - `manyo-stakes` (1月 / 草地3000m / 京都 / 4岁以上)
- 淀短距離S - `yodo-tankyori-stakes` (1月 / 草地1200m / 京都 / 4岁以上)
- アルデバランS - `aldebaran-stakes` (2月 / 泥地1900m / 京都 / 4岁以上)
- エルフィンS - `elfin-stakes` (2月 / 草地1600m / 京都 / 3岁 / 牝马限定)
- すみれS - `sumire-stakes` (2月 / 草地2200m / 阪神 / 3岁)
- ヒヤシンスS - `hyacinth-stakes` (2月 / 泥地1600m / 东京 / 3岁)
- マーガレットS - `marguerite-stakes` (2月 / 草地1200m / 阪神 / 3岁)
- 仁川S - `nigawa-stakes` (2月 / 泥地2000m / 阪神 / 4岁以上)
- 洛陽S - `rakuyo-stakes` (2月 / 草地1600m / 京都 / 4岁以上)
- アネモネS - `anemone-stakes` (3月 / 草地1600m / 中山 / 3岁 / 牝马限定)
- コーラルS - `coral-stakes` (3月 / 泥地1400m / 阪神 / 4岁以上)
- 若葉S - `wakaba-stakes` (3月 / 草地2000m / 阪神 / 3岁)
- 昇竜S - `shoryu-stakes` (3月 / 泥地1400m / 中京 / 3岁)
- 大阪城S - `osaka-jo-stakes` (3月 / 草地1800m / 阪神 / 4岁以上)
- 伏竜S - `fukuryu-stakes` (3月 / 泥地1800m / 中山 / 3岁)
- 六甲S - `rokko-stakes` (3月 / 草地1600m / 阪神 / 4岁以上)
- オアシスS - `oasis-stakes` (4月 / 泥地1600m / 东京 / 4岁以上)
- バイオレットS - `violet-stakes` (4月 / 泥地1400m / 阪神 / 3岁)
- 京葉S - `keiyo-stakes` (4月 / 泥地1200m / 中山 / 4岁以上)
- 春雷S - `shunrai-stakes` (4月 / 草地1200m / 中山 / 4岁以上)
- 福島民報杯 - `fukushima-minpo-cup` (4月 / 草地2000m / 福岛 / 4岁以上)
- 忘れな草賞 - `wasurenagusa-sho` (4月 / 草地2000m / 阪神 / 3岁 / 牝马限定)
- ブリリアントS - `brilliant-stakes` (5月 / 泥地2100m / 东京 / 4岁以上)
- プリンシパルS - `principal-stakes` (5月 / 草地2000m / 东京 / 3岁)
- メトロポリタンS - `metropolitan-stakes` (5月 / 草地2400m / 东京 / 4岁以上)
- 橘S - `tachibana-stakes` (5月 / 草地1400m / 京都 / 3岁)
- 栗東S - `ritto-stakes` (5月 / 泥地1400m / 京都 / 4岁以上)
- 青竜S - `seiryu-stakes` (5月 / 泥地1600m / 东京 / 3岁)
- 都大路S - `miyakooji-stakes` (5月 / 草地1800m / 京都 / 4岁以上)
- 白百合S - `shirayuri-stakes` (5月 / 草地1800m / 京都 / 3岁)
- 鳳雛S - `hosu-stakes` (5月 / 泥地1800m / 京都 / 3岁)
- スレイプニルS - `sleipnir-stakes` (6月 / 泥地2100m / 东京 / 3岁以上)
- パラダイスS - `paradise-stakes` (6月 / 草地1400m / 东京 / 3岁以上)
- 三宮S - `sannomiya-stakes` (6月 / 泥地1800m / 阪神 / 3岁以上)
- 札幌日経OP - `sapporo-nikkei-open` (7月 / 草地2600m / 札幌 / 3岁以上)
- ひまわり賞 - `himawari-sho` (8月 / 草地1200m / 小仓 / 2岁)
- アイビーS - `ivy-stakes` (10月 / 草地1800m / 东京 / 2岁)
- オクトーバーS - `october-stakes` (10月 / 草地2000m / 东京 / 3岁以上)
- オパールS - `opal-stakes` (10月 / 草地1200m / 京都 / 3岁以上)
- グリーンチャンネルC - `green-channel-cup` (10月 / 泥地1400m / 东京 / 3岁以上)
- ブラジルC - `brazil-cup` (10月 / 泥地2100m / 东京 / 3岁以上)
- ポートアイランドS - `port-island-stakes` (10月 / 草地1600m / 阪神 / 3岁以上)
- ルミエールAD - `lumiere-autumn-dash` (10月 / 草地1000m / 新潟 / 3岁以上)
- 信越S - `shinetsu-stakes` (10月 / 草地1400m / 新潟 / 3岁以上)
- 萩S - `hagi-stakes` (10月 / 草地1800m / 京都 / 2岁)
- カトレアS - `cattleya-stakes` (11月 / 泥地1600m / 东京 / 2岁)
- キャピタルS - `capital-stakes` (11月 / 草地1600m / 东京 / 3岁以上)
- ディセンバーS - `december-stakes` (12月 / 草地1800m / 中山 / 3岁以上)

### G3

- Fairy S - `fairy-stakes` (1月 / 草地1600m / 中山 / 3岁 / 牝马限定)
- 京成杯 - `keisei-hai` (1月 / 草地2000m / 中山 / 3岁)
- 京都金杯 - `kyoto-kimpai` (1月 / 草地1600m / 京都 / 4岁以上)
- 小仓牝马S - `kokura-himba-stakes` (1月 / 草地2000m / 小仓 / 4岁以上 / 牝马限定)
- 新山记念 - `shinzan-kinen` (1月 / 草地1600m / 京都 / 3岁)
- 中山金杯 - `nakayama-kimpai` (1月 / 草地2000m / 中山 / 4岁以上)
- 共同通信杯 - `tokinominoru-kinen` (2月 / 草地1800m / 东京 / 3岁)
- 皇后杯 - `queen-cup` (2月 / 草地1600m / 东京 / 3岁 / 牝马限定)
- 根岸S - `negishi-stakes` (2月 / 泥地1400m / 东京 / 4岁以上)
- 阪急杯 - `hankyu-hai` (2月 / 草地1400m / 阪神 / 4岁以上)
- 小仓大赏典 - `kokura-daishoten` (2月 / 草地1800m / 小仓 / 4岁以上)
- 如月赏 - `kisaragi-sho` (2月 / 草地1800m / 京都 / 3岁)
- 东京新闻杯 - `tokyo-shimbun-hai` (2月 / 草地1600m / 东京 / 4岁以上)
- 丝路S - `silk-road-stakes` (2月 / 草地1200m / 京都 / 4岁以上)
- 钻石S - `diamond-stakes` (2月 / 草地3400m / 东京 / 4岁以上)
- Derby卿CT - `lord-derby-challenge-trophy` (3月 / 草地1600m / 中山 / 4岁以上)
- Falcon S - `falcon-stakes` (3月 / 草地1400m / 中京 / 3岁)
- March S - `march-stakes` (3月 / 泥地1800m / 中山 / 4岁以上)
- 花杯 - `flower-cup` (3月 / 草地1800m / 中山 / 3岁 / 牝马限定)
- 海洋S - `ocean-stakes` (3月 / 草地1200m / 中山 / 4岁以上)
- 中山牝马S - `nakayama-himba-stakes` (3月 / 草地1800m / 中山 / 4岁以上 / 牝马限定)
- 每日杯 - `mainichi-hai` (3月 / 草地1800m / 阪神 / 3岁)
- 爱知杯 - `aichi-hai` (3月 / 草地1400m / 中京 / 4岁以上 / 牝马限定)
- Antares S - `antares-stakes` (4月 / 泥地1800m / 阪神 / 4岁以上)
- Churchill Downs C - `churchill-downs-cup` (4月 / 草地1600m / 阪神 / 3岁)
- Unicorn S - `unicorn-stakes` (4月 / 泥地1900m / 京都 / 3岁)
- 新潟大赏典 - `niigata-daishoten` (4月 / 草地2000m / 新潟 / 4岁以上)
- 福岛牝马S - `fukushima-himba-stakes` (4月 / 草地1800m / 福岛 / 4岁以上 / 牝马限定)
- 葵S - `aoi-stakes` (5月 / 草地1200m / 京都 / 3岁)
- 平安S - `heian-stakes` (5月 / 泥地1900m / 京都 / 4岁以上)
- Epsom C - `epsom-cup` (6月 / 草地1800m / 东京 / 3岁以上)
- Radio NIKKEI赏 - `radio-nikkei-sho` (6月 / 草地1800m / 福岛 / 3岁)
- しらさぎS - `shirasagi-stakes` (6月 / 草地1600m / 阪神 / 3岁以上)
- 函馆短途S - `hakodate-sprint-stakes` (6月 / 草地1200m / 函馆 / 3岁以上)
- 府中牝马S - `fuchu-himba-stakes` (6月 / 草地1800m / 东京 / 3岁以上 / 牝马限定)
- 北九州记念 - `kitakyushu-kinen` (6月 / 草地1200m / 小仓 / 3岁以上)
- Ibis Summer Dash - `ibis-summer-dash` (7月 / 草地1000m / 新潟 / 3岁以上)
- 皇后S - `queen-stakes` (7月 / 草地1800m / 札幌 / 3岁以上 / 牝马限定)
- 七夕赏 - `tanabata-sho` (7月 / 草地2000m / 福岛 / 3岁以上)
- 中京记念 - `chukyo-kinen` (7月 / 草地1600m / 中京 / 3岁以上)
- 函馆2岁S - `hakodate-nisai-stakes` (7月 / 草地1200m / 函馆 / 2岁)
- 函馆记念 - `hakodate-kinen` (7月 / 草地2000m / 函馆 / 3岁以上)
- 东海S - `tokai-stakes` (7月 / 泥地1400m / 中京 / 3岁以上)
- CBC赏 - `cbc-sho` (8月 / 草地1200m / 中京 / 3岁以上)
- Elm S - `elm-stakes` (8月 / 泥地1700m / 札幌 / 3岁以上)
- Keeneland C - `keeneland-cup` (8月 / 草地1200m / 札幌 / 3岁以上)
- Leopard S - `leopard-stakes` (8月 / 泥地1800m / 新潟 / 3岁)
- 札幌2岁S - `sapporo-nisai-stakes` (8月 / 草地1800m / 札幌 / 2岁)
- 小仓记念 - `kokura-kinen` (8月 / 草地2000m / 小仓 / 3岁以上)
- 新潟2岁S - `niigata-nisai-stakes` (8月 / 草地1600m / 新潟 / 2岁)
- 中京2岁S - `chukyo-nisai-stakes` (8月 / 草地1400m / 中京 / 2岁)
- 关屋记念 - `sekiya-kinen` (8月 / 草地1600m / 新潟 / 3岁以上)
- Challenge C - `challenge-cup` (9月 / 草地2000m / 阪神 / 3岁以上)
- Sirius S - `sirius-stakes` (9月 / 泥地2000m / 阪神 / 3岁以上)
- 京成杯AH - `keisei-hai-autumn-handicap` (9月 / 草地1600m / 中山 / 3岁以上)
- 新潟记念 - `niigata-kinen` (9月 / 草地2000m / 新潟 / 3岁以上)
- Artemis S - `artemis-stakes` (10月 / 草地1600m / 东京 / 2岁 / 牝马限定)
- Saudi Arabia RC - `saudi-arabia-royal-cup` (10月 / 草地1600m / 东京 / 2岁)
- Fantasy S - `fantasy-stakes` (11月 / 草地1400m / 京都 / 2岁 / 牝马限定)
- Miyako S - `miyako-stakes` (11月 / 泥地1800m / 京都 / 3岁以上)
- 京阪杯 - `keihan-hai` (11月 / 草地1200m / 京都 / 3岁以上)
- 京都2岁S - `kyoto-nisai-stakes` (11月 / 草地2000m / 京都 / 2岁)
- 武藏野S - `musashino-stakes` (11月 / 泥地1600m / 东京 / 3岁以上)
- 福岛记念 - `fukushima-kinen` (11月 / 草地2000m / 福岛 / 3岁以上)
- Capella S - `capella-stakes` (12月 / 泥地1200m / 中山 / 3岁以上)
- Turquoise S - `turquoise-stakes` (12月 / 草地1600m / 中山 / 3岁以上 / 牝马限定)
- 中日新闻杯 - `chunichi-shimbun-hai` (12月 / 草地2000m / 中京 / 3岁以上)
- 鸣尾记念 - `naruo-kinen` (12月 / 草地1800m / 阪神 / 3岁以上)

### JpnIII

- 蓝鸟杯 - `bluebird-cup` (1月 / 泥地1800m / 船桥 / 3岁)
- 云取赏 - `kumotori-sho` (2月 / 泥地1800m / 大井 / 3岁)
- 皇后赏 - `queen-sho` (2月 / 泥地1800m / 船桥 / 4岁以上 / 牝马限定)
- 佐贺记念 - `saga-kinen` (2月 / 泥地2000m / 佐贺 / 4岁以上)
- 鸢尾花记念 - `iris-kinen` (2月 / 泥地1500m / 名古屋 / 4岁以上)
- 黑船赏 - `kurofune-sho` (3月 / 泥地1400m / 高知 / 4岁以上)
- 兵库女王杯 - `hyogo-queen-cup` (4月 / 泥地1870m / 园田 / 4岁以上 / 牝马限定)
- 东京短途赛 - `tokyo-sprint` (4月 / 泥地1200m / 大井 / 4岁以上)
- 水星杯 - `mercury-cup` (7月 / 泥地2000m / 盛冈 / 3岁以上)
- 闪耀雌马杯 - `sparking-lady-cup` (7月 / 泥地1600m / 川崎 / 3岁以上 / 牝马限定)
- 育马者金杯 - `breeders-gold-cup` (8月 / 泥地2000m / 门别 / 3岁以上 / 牝马限定)
- 夏季冠军赛 - `summer-champion` (8月 / 泥地1400m / 佐贺 / 3岁以上)
- 星团杯 - `cluster-cup` (8月 / 泥地1200m / 盛冈 / 3岁以上)
- 北海道短途杯 - `hokkaido-sprint-cup` (8月 / 泥地1200m / 门别 / 3岁)
- 海洋杯 - `marine-cup` (9月 / 泥地1800m / 船桥 / 3岁 / 牝马限定)
- 白山大赏典 - `hakusan-daishoten` (9月 / 泥地2100m / 金泽 / 3岁以上)
- 椭圆短途赛 - `oval-sprint` (9月 / 泥地1400m / 浦和 / 3岁以上)
- 雪绒花赏 - `edelweiss-sho` (10月 / 泥地1200m / 门别 / 2岁 / 牝马限定)
- JBC两岁优骏 - `jbc-nisai-yushun` (11月 / 泥地1800m / 门别 / 2岁)
- 兵库金杯 - `hyogo-gold-trophy` (12月 / 泥地1400m / 园田 / 3岁以上)
- 名古屋大赏典 - `nagoya-daishoten` (12月 / 泥地2000m / 名古屋 / 3岁以上)

### G2

- プロキオンS - `procyon-stakes` (1月 / 泥地1800m / 中京 / 4岁以上)
- 日经新春杯 - `nikkei-shinshun-hai` (1月 / 草地2400m / 京都 / 4岁以上)
- 美国JCC - `american-jockey-club-cup` (1月 / 草地2200m / 中山 / 4岁以上)
- 京都记念 - `kyoto-kinen` (2月 / 草地2200m / 京都 / 4岁以上)
- 中山记念 - `nakayama-kinen` (2月 / 草地1800m / 中山 / 4岁以上)
- 郁金香赏 - `tulip-sho` (3月 / 草地1600m / 阪神 / 3岁 / 牝马限定)
- 金鯱赏 - `kinko-sho` (3月 / 草地2000m / 中京 / 4岁以上)
- 阪神大赏典 - `hanshin-daishoten` (3月 / 草地3000m / 阪神 / 4岁以上)
- 春季锦标 - `spring-stakes` (3月 / 草地1800m / 中山 / 3岁)
- 日经赏 - `nikkei-sho` (3月 / 草地2500m / 中山 / 4岁以上)
- 弥生赏 - `yayoi-sho` (3月 / 草地2000m / 中山 / 3岁)
- 报知杯雌马赛 - `fillies-revue` (3月 / 草地1400m / 阪神 / 3岁 / 牝马限定)
- 花仙子S - `flora-stakes` (4月 / 草地2000m / 东京 / 3岁 / 牝马限定)
- 阪神牝马S - `hanshin-himba-stakes` (4月 / 草地1600m / 阪神 / 4岁以上 / 牝马限定)
- 新西兰T - `new-zealand-trophy` (4月 / 草地1600m / 中山 / 3岁)
- 青叶赏 - `aoba-sho` (4月 / 草地2400m / 东京 / 3岁)
- 读卖杯 - `yomiuri-milers-cup` (4月 / 草地1600m / 京都 / 4岁以上)
- 京王杯春季C - `keio-hai-spring-cup` (5月 / 草地1400m / 东京 / 4岁以上)
- 京都新闻杯 - `kyoto-shimbun-hai` (5月 / 草地2200m / 京都 / 3岁)
- 目黑记念 - `meguro-kinen` (5月 / 草地2500m / 东京 / 4岁以上)
- 札幌记念 - `sapporo-kinen` (8月 / 草地2000m / 札幌 / 3岁以上)
- 紫苑S - `shion-stakes` (9月 / 草地2000m / 中山 / 3岁 / 牝马限定)
- 神户新闻杯 - `kobe-shimbun-hai` (9月 / 草地2400m / 阪神 / 3岁)
- 人马S - `centaur-stakes` (9月 / 草地1200m / 阪神 / 3岁以上)
- 产经赏All Comers - `sankei-sho-all-comers` (9月 / 草地2200m / 中山 / 3岁以上)
- 圣烈特记念 - `st-lite-kinen` (9月 / 草地2200m / 中山 / 3岁)
- 玫瑰S - `rose-stakes` (9月 / 草地1800m / 阪神 / 3岁 / 牝马限定)
- 京都大赏典 - `kyoto-daishoten` (10月 / 草地2400m / 京都 / 3岁以上)
- 天鹅S - `swan-stakes` (10月 / 草地1400m / 京都 / 3岁以上)
- 富士S - `fuji-stakes` (10月 / 草地1600m / 东京 / 3岁以上)
- 每日王冠 - `mainichi-okan` (10月 / 草地1800m / 东京 / 3岁以上)
- 爱尔兰T - `ireland-trophy` (10月 / 草地1800m / 东京 / 3岁以上 / 牝马限定)
- 阿根廷共和国杯 - `copa-republica-argentina` (11月 / 草地2500m / 东京 / 3岁以上)
- 京王杯2岁S - `keio-hai-nisai-stakes` (11月 / 草地1400m / 东京 / 2岁)
- 东京体育杯两岁S - `tokyo-sports-hai` (11月 / 草地1800m / 东京 / 2岁)
- 每日杯2岁S - `daily-hai-nisai-stakes` (11月 / 草地1600m / 京都 / 2岁)
- 长途马S - `stayers-stakes` (11月 / 草地3600m / 中山 / 3岁以上)
- 阪神C - `hanshin-cup` (12月 / 草地1400m / 阪神 / 3岁以上)

### JpnII

- ダイオライト记念 - `diolite-kinen` (3月 / 泥地2400m / 船桥 / 4岁以上)
- 京滨杯 - `keihin-hai` (3月 / 泥地1700m / 大井 / 3岁)
- 雌马杯 - `empress-hai` (5月 / 泥地2100m / 川崎 / 4岁以上 / 牝马限定)
- 兵库冠军锦标 - `hyogo-championship` (5月 / 泥地1400m / 园田 / 3岁)
- 名古屋大奖赛 - `nagoya-grand-prix` (5月 / 泥地2100m / 名古屋 / 4岁以上)
- 关东橡树大赛 - `kanto-oaks` (6月 / 泥地2100m / 川崎 / 3岁 / 牝马限定)
- 不来方赏 - `furukata-award` (9月 / 泥地2000m / 盛冈 / 3岁)
- 雌马预赛 - `ladies-prelude` (10月 / 泥地1800m / 大井 / 3岁以上 / 牝马限定)
- 日本电视杯 - `nippon-tv-hai` (10月 / 泥地1800m / 船桥 / 3岁以上)
- 东京杯 - `tokyo-hai` (10月 / 泥地1200m / 大井 / 3岁以上)
- 浦和记念 - `urawa-kinen` (11月 / 泥地2000m / 浦和 / 3岁以上)
- 兵库青年大奖赛 - `hyogo-junior-grand-prix` (11月 / 泥地1400m / 园田 / 2岁)

### G1

- 二月锦标 - `february-stakes` (2月 / 泥地1600m / 东京 / 4岁以上)
- 高松宫纪念 - `takamatsunomiya-kinen` (3月 / 草地1200m / 中京 / 4岁以上)
- 大阪杯 - `osaka-hai` (3月 / 草地2000m / 阪神 / 4岁以上)
- 天皇赏春 - `tenno-sho-haru` (4月 / 草地3200m / 京都 / 4岁以上)
- 皋月赏 - `satsuki-sho` (4月 / 草地2000m / 中山 / 3岁)
- 樱花赏 - `oka-sho` (4月 / 草地1600m / 阪神 / 3岁 / 牝马限定)
- NHK一哩杯 - `nhk-mile-cup` (5月 / 草地1600m / 东京 / 3岁)
- 日本德比 - `tokyo-yushun` (5月 / 草地2400m / 东京 / 3岁)
- 优骏牝马 - `yushun-himba` (5月 / 草地2400m / 东京 / 3岁 / 牝马限定)
- 维多利亚一哩赛 - `victoria-mile` (5月 / 草地1600m / 东京 / 4岁以上 / 牝马限定)
- 安田纪念 - `yasuda-kinen` (6月 / 草地1600m / 东京 / 3岁以上)
- 宝塚纪念 - `takarazuka-kinen` (6月 / 草地2200m / 阪神 / 3岁以上)
- 短途马锦标 - `sprinters-stakes` (9月 / 草地1200m / 中山 / 3岁以上)
- 菊花赏 - `kikka-sho` (10月 / 草地3000m / 京都 / 3岁)
- 秋华赏 - `shuka-sho` (10月 / 草地2000m / 京都 / 3岁 / 牝马限定)
- 天皇赏秋 - `tenno-sho-aki` (10月 / 草地2000m / 东京 / 3岁以上)
- 一哩冠军赛 - `mile-championship` (11月 / 草地1600m / 京都 / 3岁以上)
- 女王伊丽莎白二世杯 - `queen-elizabeth-ii-cup` (11月 / 草地2200m / 京都 / 3岁以上 / 牝马限定)
- 日本杯 - `japan-cup` (11月 / 草地2400m / 东京 / 3岁以上)
- 冠军杯 - `champions-cup` (12月 / 泥地1800m / 中京 / 3岁以上)
- 希望锦标 - `hopeful-stakes` (12月 / 草地2000m / 中山 / 2岁)
- 阪神两岁牝马S - `hanshin-juvenile-fillies` (12月 / 草地1600m / 阪神 / 2岁 / 牝马限定)
- 朝日杯FS - `asahi-hai-fs` (12月 / 草地1600m / 阪神 / 2岁)
- 有马纪念 - `arima-kinen` (12月 / 草地2500m / 中山 / 3岁以上)
- 东京大赏典 - `tokyo-daishoten` (12月 / 泥地2000m / 其他地方 / 3岁以上)

### JpnI

- 羽田杯 - `haneda-hai` (4月 / 泥地1800m / 大井 / 3岁)
- 川崎记念 - `kawasaki-kinen` (4月 / 泥地2100m / 川崎 / 4岁以上)
- 柏记念 - `kashiwa-kinen` (5月 / 泥地1600m / 船桥 / 4岁以上)
- 埼玉杯 - `sakitama-hai` (6月 / 泥地1400m / 浦和 / 3岁以上)
- 帝王赏 - `teio-sho` (6月 / 泥地2000m / 大井 / 4岁以上)
- 东京德比 - `tokyo-derby` (6月 / 泥地2000m / 大井 / 3岁)
- 一哩冠军南部杯 - `mile-championship-nambu-hai` (10月 / 泥地1600m / 盛冈 / 3岁以上)
- 日本泥地经典赛 - `japan-dirt-classic` (10月 / 泥地2000m / 大井 / 3岁)
- JBC雌马经典赛 - `jbc-ladies-classic` (11月 / 泥地1800m / 其他地方 / 3岁以上 / 牝马限定)
- JBC短途赛 - `jbc-sprint` (11月 / 泥地1200m / 其他地方 / 3岁以上)
- JBC经典赛 - `jbc-classic` (11月 / 泥地2000m / 其他地方 / 3岁以上)
- 全日本两岁优骏 - `zen-nippon-nisai-yushun` (12月 / 泥地1600m / 川崎 / 2岁)

## 国际 G1 赛事 ID

- 觉士盾 - `cox-plate` (10月 / 澳洲草地2040m / 3岁以上)
- 考菲尔德杯 - `caulfield-cup` (10月 / 澳洲草地2400m / 3岁以上)
- 墨尔本杯 - `melbourne-cup` (11月 / 澳洲草地3200m / 3岁以上)
- 必利是锦标 - `preakness-stakes` (5月 / 美国泥地1900m / 3岁)
- 肯塔基德比 - `kentucky-derby` (5月 / 美国泥地2000m / 3岁)
- 贝蒙锦标 - `belmont-stakes` (6月 / 美国泥地2400m / 3岁)
- 育马者杯草地大赛 - `breeders-cup-turf` (11月 / 美国草地2400m / 3岁以上)
- 育马者杯草地短途 - `breeders-cup-turf-sprint` (11月 / 美国草地1000m / 3岁以上)
- 育马者杯雌马草地大赛 - `breeders-cup-filly-mare-turf` (11月 / 美国草地2000m / 3岁以上 / 牝马限定)
- 育马者杯雌马大赛 - `breeders-cup-distaff` (11月 / 美国泥地1800m / 3岁以上 / 牝马限定)
- 育马者杯雌马短途大赛 - `breeders-cup-filly-mare-sprint` (11月 / 美国泥地1400m / 3岁以上 / 牝马限定)
- 育马者杯短途大赛 - `breeders-cup-sprint` (11月 / 美国泥地1200m / 3岁以上)
- 育马者杯经典赛 - `breeders-cup-classic` (11月 / 美国泥地2000m / 3岁以上)
- 育马者杯两岁草地大赛 - `breeders-cup-juvenile-turf` (11月 / 美国草地1600m / 2岁)
- 育马者杯两岁草地短途 - `breeders-cup-juvenile-turf-sprint` (11月 / 美国草地1000m / 2岁)
- 育马者杯两岁雌马草地大赛 - `breeders-cup-juvenile-fillies-turf` (11月 / 美国草地1600m / 2岁 / 牝马限定)
- 育马者杯两岁雌马大赛 - `breeders-cup-juvenile-fillies` (11月 / 美国泥地1700m / 2岁 / 牝马限定)
- 育马者杯两岁大赛 - `breeders-cup-juvenile` (11月 / 美国泥地1700m / 2岁)
- 育马者杯泥地一哩 - `breeders-cup-dirt-mile` (11月 / 美国泥地1600m / 3岁以上)
- 育马者杯一哩大赛 - `breeders-cup-mile` (11月 / 美国草地1600m / 3岁以上)
- 二千坚尼 - `two-thousand-guineas` (5月 / 欧洲草地1600m / 3岁)
- 女王安妮锦标 - `queen-anne-stakes` (6月 / 欧洲草地1600m / 4岁以上)
- 威尔士亲王锦标 - `prince-of-wales-stakes` (6月 / 欧洲草地2000m / 4岁以上)
- 叶森德比 - `epsom-derby` (6月 / 欧洲草地2400m / 3岁)
- 圣格卢大赛 - `grand-prix-de-saint-cloud` (7月 / 欧洲草地2400m / 4岁以上)
- 英皇锦标 - `king-george-vi-and-queen-elizabeth-stakes` (7月 / 欧洲草地2400m / 3岁以上)
- 国际锦标 - `international-stakes` (8月 / 欧洲草地2050m / 3岁以上)
- 杰克莫华大赛 - `prix-jacques-le-marois` (8月 / 欧洲草地1600m / 3岁以上)
- 圣烈治锦标 - `st-leger-stakes` (9月 / 欧洲草地2900m / 3岁)
- 凯旋门赏 - `prix-de-larc` (10月 / 欧洲草地2400m / 3岁以上)
- 香港杯 - `hong-kong-cup` (12月 / 香港草地2000m / 3岁以上)
- 香港短途锦标 - `hong-kong-sprint` (12月 / 香港草地1200m / 3岁以上)
- 香港瓶 - `hong-kong-vase` (12月 / 香港草地2400m / 3岁以上)
- 香港一哩锦标 - `hong-kong-mile` (12月 / 香港草地1600m / 3岁以上)
- 迪拜草地大赛 - `dubai-turf` (3月 / 中东草地1800m / 4岁以上)
- 迪拜世界杯 - `dubai-world-cup` (3月 / 中东泥地2000m / 4岁以上)
- 迪拜司马经典赛 - `dubai-sheema-classic` (3月 / 中东草地2400m / 4岁以上)

## 骑手 ID

- 武豊 - `take-yutaka` (1987-1994: 82；1995-2010: 90；2011-2026: 84)
- C.ルメール - `christophe-lemaire` (2002-2014: 82；2015-2026: 90)
- M.デムーロ - `mirco-demuro` (2003-2014: 80；2015-2026: 85)
- 池添謙一 - `kenichi-ikezoe` (1998-2008: 76；2009-2026: 83)
- 福永祐一 - `yuichi-fukunaga` (1996-2012: 78；2013-2023: 86)
- 戸崎圭太 - `keita-tosaki` (2005-2012: 74；2013-2026: 82)
- 川田将雅 - `yuga-kawada` (2004-2013: 76；2014-2026: 88)
- 横山典弘 - `kazuo-yokoyama` (1986-2008: 84；2009-2026: 80)
- 和田竜二 - `tetsuzo-wada` (1996-2010: 78；2011-2026: 74)
- O.ペリエ - `olivier-peslier` (1993-2012: 88)
- R.ムーア - `ryan-moore` (2004-2012: 84；2013-2026: 89)
- D.レーン - `damian-lane` (2017-2026: 84)
- 横山武史 - `takeshi-yokoyama` (2017-2026: 82)
- J.モレイラ - `joao-moreira` (2010-2026: 87)
- 地方所属騎手 - `generic-local` (1980-2035: 70)
