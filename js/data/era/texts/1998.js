(function () {
  const ns = (window.Keiba = window.Keiba || {});
  // 1998 年的全部正文。状态一律 draft，用户审核后由 texts.js 的注册逻辑改为 final。
  // 赛前片段只能提走出走表（赛前公开信息），不得透露史实赛果。
  ns.EraTextIndex.register([
    { id: "jp.era.1998.scene.entry", title: "相遇在经典赛季之前", body: "1998年，你以{{PLAYER_REFERENCE}}的身份，接手了一匹三岁王道型牡马。它还没有胜鞍，也还没有名字。先替它取个名字吧——往后的赛程，从这次相遇开始。" },
    { id: "jp.era.1998.scene.opening", title: "不是旁观者的一年", body: "1998年的经典赛场不等人。特别周、青云天空与帝王光环——这三个名字会先一步写进出走表，也会先一步被人念出来。而{{PLAYER_HORSE_NAME}}的那一行，得由你自己填。赛历摊在你面前，报名表也是；这一次，没有谁替你决定它往哪条道跑。" },
    { id: "jp.era.1998.scene.time", title: "赛历继续翻页", body: "赛历又翻过一页。翻开赛程手册，替它挑一场比赛；也可以暂不报名，再等等。下一次上场，还得由你决定。" },
    { id: "jp.era.1998.scene.debut", title: "第一次站上跑道", body: "{{DATE}}，{{PLAYER_HORSE_NAME}}第一次站上正式赛场。此前的安排，终于有了一次出赛来检验。无论这一场留下什么结果，它的生涯都已不再是空白。" },
    { id: "jp.era.1998.scene.first-win", title: "第一次占据版面", body: "第一次赢。{{PLAYER_HORSE_NAME}}有了自己的胜鞍，也有了迎接下一场的底气。姿态可以放低，期待也可以说出口；但眼前这场胜利，已经不需要用话来证明。" },
    { id: "jp.era.1998.scene.satsuki-eve", title: "三岁马的第一个关口", body: "{{DATE}}，中山的皋月赏。{{PLAYER_HORSE_NAME}}已经报上名，出走表上还有青云天空、帝王光环与特别周。皋月赏、日本德比、菊花赏这条三冠路线，从这一关起步。三个响亮的名字摆在眼前，你的马也要在这里争一次。" },
    { id: "jp.era.1998.scene.satsuki-after", title: "第一场古典赛之后", body: "{{DATE}}，皋月赏落幕，{{PLAYER_HORSE_NAME}}本场结果：{{FINISH}}。第一道关口已过，日本德比还在前面，菊花赏则要等过夏天。接下来往哪儿走，先看眼前这匹马，再由你决定。" },
    { id: "jp.era.1998.scene.derby-eve", title: "黄金世代的德比", body: "东京。日本德比，一整年的中心。{{DATE}}，{{PLAYER_HORSE_NAME}}与特别周、勇者帝王、青云天空同列出走表。三岁马的顶点就在眼前——同一场胜负，这一次也有你的马来争。" },
    { id: "jp.era.1998.scene.derby-after", title: "德比之后", body: "{{DATE}}，德比结束，{{PLAYER_HORSE_NAME}}本场结果：{{FINISH}}。第二道关口已过，菊花赏要等到十一月。中间横着一整个夏天，长得足够调整状态，也长得足够推翻计划。继续找比赛，还是留出休整的时间？下一步，要看它眼下的处境。" },
    { id: "jp.era.1998.scene.kikka-eve", title: "三冠的最后一关", body: "十一月的京都，菊花赏。{{DATE}}，{{PLAYER_HORSE_NAME}}已经报上名，眼前是3000米的考验，也是这条三冠路线的最后一关。前两场留下的成绩不会改变，这一关的结果却还没有写下。" },
    { id: "jp.era.1998.scene.kikka-after", title: "三冠的答案", body: "{{DATE}}，菊花赏落幕，{{PLAYER_HORSE_NAME}}本场结果：{{FINISH}}。三冠路线的最后一关，已经有了答案。账先记到这里：这一年{{PLAYER_HORSE_NAME}}拿下{{WINS}}胜，其中G1 {{G1_WINS}}场。可秋季还没结束——接下来出不出赛、选哪一场，仍由你决定。" },
    { id: "jp.era.1998.scene.two-crowns", title: "最后一冠之前", body: "皋月赏、日本德比——{{PLAYER_HORSE_NAME}}连下两冠。京都的3000米还没开跑，第三冠却已经成了绕不开的话题。史实中的1998年没有三冠马；在你这一局，最后一冠仍有可能。两场已经赢下，最后那场，谁也不能提前替它赢。" },
    { id: "jp.era.1998.scene.triple-crown", title: "1998年不该有的三冠", body: "{{DATE}}，京都的菊花赏，{{PLAYER_HORSE_NAME}}夺冠。皋月赏、日本德比、菊花赏——三场古典赛，同一个名字。1998年的史实里没有三冠马：皋月赏与菊花赏属于青云天空，日本德比属于特别周。现在，本局世界线改写出来的三冠，属于你的马。这一次，可以先不急着翻到下一场。" },
    { id: "jp.era.1998.scene.crown-lost", title: "三冠之外，赛季仍在继续", body: "三冠，到此为止。{{PLAYER_HORSE_NAME}}的世界线没有塌，只是没能把最陡的那条路走到底。另选一场再出发，或者先休养一阵——接下来的安排，不必全由失去的那一冠决定。" },
    { id: "jp.era.1998.scene.comeback", title: "重新走向跑道", body: "停跑的日子走完了，{{PLAYER_HORSE_NAME}}重新拿回了报名资格。下一场的闸门还没有打开，等待却已经够久了。停顿的那段日子也老老实实写进了生涯纪事，一个字都没抹。" },
    { id: "jp.era.1998.scene.arima-eve", title: "年末的最后一场", body: "十二月末，中山，有马纪念。{{DATE}}，{{PLAYER_HORSE_NAME}}已经报上名，准备与这一年的强手同场。此前的胜负不会被这一场抹去，但年末这一笔，还没有写下结果。" },
    { id: "jp.era.1998.scene.arima-after", title: "一年结束的时候", body: "{{DATE}}，有马纪念散场，{{PLAYER_HORSE_NAME}}本场结果：{{FINISH}}。到此为止，这就是全部：1998年，{{PLAYER_HORSE_NAME}}拿下{{WINS}}胜，其中G1 {{G1_WINS}}场。赢的、输的、退赛的，全都摊在这儿了——这是你留给这一年的东西。" },
    { id: "jp.era.1998.scene.year-end", title: "属于你的1998年", body: "翻到最后一页：{{PLAYER_HORSE_NAME}}，1998年，{{WINS}}胜，G1 {{G1_WINS}}场。史实那一本还摊在架子上，一个字没动；你这一本也合上了——冠军归谁或许没改，但这一年跑过的每一步，都记在这里了。" }
  ]);
})();
