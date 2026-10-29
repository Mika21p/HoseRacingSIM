(function () {
  const ns = (window.Keiba = window.Keiba || {});
  // 1999 年的全部正文。2026-10-27经用户确认定稿，状态为 final。
  // 赛前片段只能提走出走表（赛前公开信息），不得透露本局赛果；
  // 赛后片段只写玩家的名次，不复述当年冠军是谁。
  ns.EraTextIndex.register([
    { id: "jp.era.1999.scene.season-open", status: "final", title: "四岁这一档", body: "1999年，赛历翻到新的一页。{{PLAYER_HORSE_NAME}}四岁了。在1998年的史实里，青云天空赢下皋月赏与菊花赏，特别周拿走日本德比，草上飞则在年末的中山夺得有马纪念。它们也都四岁了；那是史实留下的版面，你的世界线另有自己的记录。新一季的第一道题，是{{PLAYER_HORSE_NAME}}要往哪里走。" },
    { id: "jp.era.1999.scene.tenno-spring-eve", status: "final", title: "三千二百米的那一场", body: "五月的京都，3200米。天皇赏春的出走表上，特别周、目白光明、青云天空、丝绸正义、黄金旅程都在——这是今年这条可报名路线中最长的一场，每一个名字都得接受长距离的考验。{{DATE}}，你为{{PLAYER_HORSE_NAME}}报上了名。" },
    { id: "jp.era.1999.scene.tenno-spring-after", status: "final", title: "春天最长的账", body: "{{DATE}}，天皇赏春结束，{{PLAYER_HORSE_NAME}}本场结果：{{FINISH}}。3200米的考验已经过去；春天剩下的比赛还多，这场长距离的账却已经记下。" },
    { id: "jp.era.1999.scene.takarazuka-eve", status: "final", title: "夏天的第一道关口", body: "七月的阪神，2200米。宝塚纪念的出走表上有草上飞、特别周，黄金旅程也在其中——1998年的史实里，黄金旅程曾在天皇赏春、宝塚纪念、天皇赏秋三场G1取得第二，冠军却始终没能拿到。{{DATE}}，你为{{PLAYER_HORSE_NAME}}报上了名。" },
    { id: "jp.era.1999.scene.takarazuka-after", status: "final", title: "夏天的次序", body: "{{DATE}}，宝塚纪念结束，{{PLAYER_HORSE_NAME}}本场结果：{{FINISH}}。2200米上的这一仗，名次已经落定。天皇赏秋、日本杯、年末的有马纪念还在后面；这一场的胜负，不是这一年的最后一句。" },
    { id: "jp.era.1999.scene.tenno-autumn-eve", status: "final", title: "秋天的重心", body: "十月底的东京，天皇赏秋，2000米。特别周与黄金旅程都在出走表上。名字已经写下，胜负还没有——这一次，你也要争一个答案。{{DATE}}，你为{{PLAYER_HORSE_NAME}}报上了名。" },
    { id: "jp.era.1999.scene.tenno-autumn-after", status: "final", title: "秋天的后半程", body: "{{DATE}}，天皇赏秋结束，{{PLAYER_HORSE_NAME}}本场结果：{{FINISH}}。这条路线接下来还有日本杯与有马纪念；走到这里，这一年的账已经写掉了大半。" },
    { id: "jp.era.1999.scene.japan-cup-after", status: "final", title: "国际赛日", body: "{{DATE}}，日本杯结束，{{PLAYER_HORSE_NAME}}本场结果：{{FINISH}}。2400米上挤满了异国名字，这是日本赛马一年里最国际化的一场；四周之后是有马纪念，也是这条路线接下来最后一场可报名的比赛。是否走向中山，仍由你决定。" },
    { id: "jp.era.1999.scene.arima-eve", status: "final", title: "两年之后的最后一场", body: "十二月末的中山，2500米。有马纪念的出走表上，草上飞、特别周、好歌剧、鹤丸刚志、目白光明都在——史实中赢下当年宝塚纪念的草上飞，又一次站到了年末的位置上。本局此前的胜负另有记录，眼前这一场则还没有答案。{{DATE}}，你为{{PLAYER_HORSE_NAME}}报上了名。" },
    { id: "jp.era.1999.scene.arima-after", status: "final", title: "两年走完", body: "{{DATE}}，有马纪念结束，{{PLAYER_HORSE_NAME}}本场结果：{{FINISH}}。{{PLAYER_HORSE_NAME}}在这两年里取得{{WINS}}胜，其中G1 {{G1_WINS}}场。史实记录和你的世界线分别保存——无论是否改变冠军归属，这段经历都已留下。" },
    { id: "jp.era.1999.scene.year-end", status: "final", title: "属于你的两年", body: "{{PLAYER_HORSE_NAME}}的这段生涯，到这里合上最后一页。1998—1999这段记录中，它出赛{{STARTS}}次，取得{{WINS}}胜，其中G1胜利{{G1_WINS}}场。不必跑满赛历，已经留下的胜负也不会消失；两年的史实年鉴分别保存，你的世界线也留在其中。" }
  ]);
})();
