(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.Jockeys = [
    {
      id: "take-yutaka",
      name: "武豊",
      periods: [
        { from: 1987, to: 1994, ability: 70 },
        { from: 1995, to: 2010, ability: 80 },
        { from: 2011, to: 2026, ability: 70 }
      ]
    },
    {
      id: "christophe-lemaire",
      name: "C. Lemaire",
      periods: [
        { from: 2002, to: 2014, ability: 70 },
        { from: 2015, to: 2026, ability: 80 }
      ]
    },
    {
      id: "mirco-demuro",
      name: "M. Demuro",
      periods: [
        { from: 2003, to: 2014, ability: 70 },
        { from: 2015, to: 2018, ability: 80 },
        { from: 2019, to: 2026, ability: 70 }
      ]
    },
    {
      id: "kenichi-ikezoe",
      name: "池添謙一",
      periods: [
        { from: 1998, to: 2008, ability: 50 },
        { from: 2009, to: 2026, ability: 60 }
      ]
    },
    {
      id: "yuichi-fukunaga",
      name: "福永祐一",
      periods: [
        { from: 1996, to: 2012, ability: 60 },
        { from: 2013, to: 2023, ability: 70 }
      ]
    },
    {
      id: "keita-tosaki",
      name: "戸崎圭太",
      periods: [
        { from: 2005, to: 2012, ability: 50 },
        { from: 2013, to: 2026, ability: 70 }
      ]
    },
    {
      id: "yuga-kawada",
      name: "川田将雅",
      periods: [
        { from: 2004, to: 2013, ability: 60 },
        { from: 2014, to: 2026, ability: 70 }
      ]
    },
    {
      id: "norihiro-yokoyama",
      name: "横山典弘",
      periods: [
        { from: 1986, to: 2008, ability: 70 },
        { from: 2009, to: 2026, ability: 60 }
      ]
    },
    {
      id: "kazuo-yokoyama",
      name: "横山和生",
      periods: [
        { from: 2011, to: 2021, ability: 50 },
        { from: 2022, to: 2026, ability: 60 }
      ]
    },
    {
      id: "tetsuzo-wada",
      name: "和田竜二",
      periods: [
        { from: 1996, to: 2010, ability: 50 },
        { from: 2011, to: 2026, ability: 50 }
      ]
    },
    {
      id: "tetsuzo-sato",
      name: "佐藤哲三",
      periods: [
        { from: 1989, to: 1998, ability: 50 },
        { from: 1999, to: 2014, ability: 60 }
      ]
    },
    {
      id: "olivier-peslier",
      name: "O. Peslier",
      periods: [
        { from: 1993, to: 2012, ability: 88 }
      ]
    },
    {
      id: "ryan-moore",
      name: "R. Moore",
      periods: [
        { from: 2004, to: 2012, ability: 84 },
        { from: 2013, to: 2026, ability: 89 }
      ]
    },
    {
      id: "damian-lane",
      name: "D. Lane",
      periods: [
        { from: 2017, to: 2026, ability: 84 }
      ]
    },
    {
      id: "takeshi-yokoyama",
      name: "横山武史",
      periods: [
        { from: 2017, to: 2026, ability: 60 }
      ]
    },
    {
      id: "ryusei-sakai",
      name: "坂井瑠星",
      periods: [
        { from: 2016, to: 2020, ability: 50 },
        { from: 2021, to: 2026, ability: 60 }
      ]
    },
    {
      id: "kohei-matsuyama",
      name: "松山弘平",
      periods: [
        { from: 2009, to: 2019, ability: 50 },
        { from: 2020, to: 2026, ability: 60 }
      ]
    },
    {
      id: "taisei-danno",
      name: "団野大成",
      periods: [
        { from: 2019, to: 2022, ability: 50 },
        { from: 2023, to: 2026, ability: 60 }
      ]
    },
    {
      id: "yasunari-iwata",
      name: "岩田康誠",
      periods: [
        { from: 1991, to: 2005, ability: 60 },
        { from: 2006, to: 2015, ability: 70 },
        { from: 2016, to: 2020, ability: 60 },
        { from: 2021, to: 2026, ability: 50 }
      ]
    },
    {
      id: "hideaki-miyuki",
      name: "幸英明",
      periods: [
        { from: 1994, to: 1999, ability: 50 },
        { from: 2000, to: 2026, ability: 60 }
      ]
    },
    {
      id: "hitoshi-matoba",
      name: "的場均",
      periods: [
        { from: 1975, to: 1983, ability: 60 },
        { from: 1984, to: 1999, ability: 70 },
        { from: 2000, to: 2001, ability: 50 }
      ]
    },
    {
      id: "hiroyuki-uchida",
      name: "内田博幸",
      periods: [
        { from: 1989, to: 2007, ability: 60 },
        { from: 2008, to: 2013, ability: 70 },
        { from: 2014, to: 2018, ability: 60 },
        { from: 2019, to: 2026, ability: 50 }
      ]
    },
    {
      id: "sueo-masuzawa",
      name: "増沢末夫",
      periods: [
        { from: 1975, to: 1991, ability: 70 }
      ]
    },
    {
      id: "suguru-hamanaka",
      name: "浜中俊",
      periods: [
        { from: 2008, to: 2010, ability: 60 },
        { from: 2011, to: 2015, ability: 70 },
        { from: 2016, to: 2018, ability: 60 },
        { from: 2019, to: 2026, ability: 50 }
      ]
    },
    {
      id: "mirai-iwata",
      name: "岩田望来",
      periods: [
        { from: 2019, to: 2026, ability: 60 }
      ]
    },
    {
      id: "mikio-matsunaga",
      name: "松永幹夫",
      periods: [
        { from: 1986, to: 1987, ability: 50 },
        { from: 1988, to: 2001, ability: 70 },
        { from: 2002, to: 2005, ability: 60 }
      ]
    },
    {
      id: "hiroki-goto",
      name: "後藤浩輝",
      periods: [
        { from: 1995, to: 1999, ability: 50 },
        { from: 2000, to: 2010, ability: 60 },
        { from: 2011, to: 2014, ability: 50 }
      ]
    },
    {
      id: "akihiro-iida",
      name: "飯田明弘",
      periods: [
        { from: 1975, to: 1978, ability: 60 },
        { from: 1979, to: 1986, ability: 50 }
      ]
    },
    {
      id: "hiroshi-nakajima",
      name: "中島啓之",
      periods: [
        { from: 1975, to: 1980, ability: 60 },
        { from: 1981, to: 1985, ability: 50 }
      ]
    },
    {
      id: "eiji-nakadate",
      name: "中舘英二",
      periods: [
        { from: 1985, to: 1992, ability: 50 },
        { from: 1993, to: 2009, ability: 60 },
        { from: 2010, to: 2012, ability: 50 }
      ]
    },
    {
      id: "masami-matsuoka",
      name: "松岡正海",
      periods: [
        { from: 2004, to: 2007, ability: 50 },
        { from: 2008, to: 2012, ability: 60 },
        { from: 2013, to: 2026, ability: 50 }
      ]
    },
    {
      id: "katsuharu-tanaka",
      name: "田中勝春",
      periods: [
        { from: 1990, to: 1990, ability: 50 },
        { from: 1991, to: 2007, ability: 60 },
        { from: 2008, to: 2018, ability: 50 }
      ]
    },
    {
      id: "hiroshi-kitamura",
      name: "北村宏司",
      periods: [
        { from: 1999, to: 2002, ability: 50 },
        { from: 2003, to: 2015, ability: 60 },
        { from: 2016, to: 2023, ability: 50 }
      ]
    },
    {
      id: "hironobu-tanabe",
      name: "田辺裕信",
      periods: [
        { from: 2002, to: 2010, ability: 50 },
        { from: 2011, to: 2023, ability: 60 },
        { from: 2024, to: 2026, ability: 50 }
      ]
    },
    {
      id: "shoichi-osaki",
      name: "大崎昭一",
      periods: [
        { from: 1975, to: 1977, ability: 60 },
        { from: 1978, to: 1994, ability: 50 }
      ]
    },
    {
      id: "isao-shimada",
      name: "嶋田功",
      periods: [
        { from: 1975, to: 1982, ability: 60 },
        { from: 1983, to: 1987, ability: 50 }
      ]
    },
    {
      id: "ichizo-iwamoto",
      name: "岩元市三",
      periods: [
        { from: 1976, to: 1982, ability: 50 },
        { from: 1983, to: 1987, ability: 60 },
        { from: 1988, to: 1988, ability: 50 }
      ]
    },
    {
      id: "kunihiko-take",
      name: "武邦彦",
      periods: [
        { from: 1975, to: 1980, ability: 60 },
        { from: 1981, to: 1983, ability: 50 }
      ]
    },
    {
      id: "takayuki-yasuda",
      name: "安田隆行",
      periods: [
        { from: 1972, to: 1987, ability: 50 },
        { from: 1988, to: 1993, ability: 60 }
      ]
    },
    {
      id: "koichi-tsunoda",
      name: "角田晃一",
      periods: [
        { from: 1989, to: 1996, ability: 60 },
        { from: 1997, to: 2010, ability: 50 }
      ]
    },
    {
      id: "koichi-uchida",
      name: "内田浩一",
      periods: [
        { from: 1988, to: 1991, ability: 50 },
        { from: 1992, to: 2004, ability: 40 }
      ]
    },
    {
      id: "masaru-kurita",
      name: "栗田勝",
      periods: [
        { from: 1955, to: 1965, ability: 70 }
      ]
    },
    {
      id: "yoshito-matsumoto",
      name: "松本善登",
      periods: [
        { from: 1960, to: 1964, ability: 50 },
        { from: 1965, to: 1979, ability: 60 }
      ]
    },
    {
      id: "akira-shikato",
      name: "鹿戸明",
      periods: [
        { from: 1968, to: 1974, ability: 50 },
        { from: 1975, to: 1978, ability: 60 },
        { from: 1979, to: 1986, ability: 50 }
      ]
    },
    {
      id: "sadahiro-kojima",
      name: "小島貞博",
      periods: [
        { from: 1982, to: 1990, ability: 50 },
        { from: 1991, to: 1995, ability: 60 },
        { from: 1996, to: 2001, ability: 50 }
      ]
    },
    {
      id: "masahiro-ikegami",
      name: "池上昌弘",
      periods: [
        { from: 1966, to: 1974, ability: 50 }
      ]
    },
    {
      id: "seiichi-nakanowatari",
      name: "中野渡清一",
      periods: [
        { from: 1970, to: 1975, ability: 50 },
        { from: 1976, to: 1978, ability: 60 },
        { from: 1979, to: 1985, ability: 50 }
      ]
    },
    {
      id: "ryoji-furuyama",
      name: "古山良司",
      periods: [
        { from: 1955, to: 1969, ability: 60 }
      ]
    },
    {
      id: "masato-yoshinaga",
      name: "吉永正人",
      periods: [
        { from: 1970, to: 1982, ability: 60 },
        { from: 1983, to: 1984, ability: 70 },
        { from: 1985, to: 1992, ability: 60 }
      ]
    },
    {
      id: "kizo-konishi",
      name: "小西喜蔵",
      periods: [
        { from: 1939, to: 1942, ability: 70 }
      ]
    },
    {
      id: "hayato-yoshida",
      name: "吉田隼人",
      periods: [
        { from: 2004, to: 2014, ability: 50 },
        { from: 2015, to: 2023, ability: 60 },
        { from: 2024, to: 2026, ability: 50 }
      ]
    },
    {
      id: "yutaka-yoshida",
      name: "吉田豊",
      periods: [
        { from: 1994, to: 1995, ability: 50 },
        { from: 1996, to: 2002, ability: 60 },
        { from: 2003, to: 2020, ability: 50 },
        { from: 2021, to: 2023, ability: 60 },
        { from: 2024, to: 2026, ability: 50 }
      ]
    },
    {
      id: "joao-moreira",
      name: "J. Moreira",
      periods: [
        { from: 2010, to: 2026, ability: 87 }
      ]
    },
    {
      id: "umberto-rispoli",
      name: "U. Rispoli",
      periods: [
        { from: 2005, to: 2008, ability: 80 },
        { from: 2009, to: 2026, ability: 90 }
      ]
    },
    {
      id: "okabe-yukio",
      name: "岡部幸雄",
      periods: [
        { from: 1967, to: 1983, ability: 70 },
        { from: 1984, to: 1998, ability: 70 },
        { from: 1999, to: 2005, ability: 60 }
      ]
    },
    {
      id: "shibata-masato",
      name: "柴田政人",
      periods: [
        { from: 1967, to: 1979, ability: 60 },
        { from: 1980, to: 1995, ability: 70 }
      ]
    },
    {
      id: "kawachi-hiroshi",
      name: "河内洋",
      periods: [
        { from: 1974, to: 1990, ability: 70 },
        { from: 1991, to: 2003, ability: 60 }
      ]
    },
    {
      id: "masaru-honda",
      name: "本田優",
      periods: [
        { from: 1976, to: 1992, ability: 50 },
        { from: 1993, to: 2007, ability: 60 }
      ]
    },
    {
      id: "shigehiko-kishi",
      name: "岸滋彦",
      periods: [
        { from: 1986, to: 1997, ability: 50 },
        { from: 1998, to: 2004, ability: 40 }
      ]
    },
    {
      id: "masayuki-miyaura",
      name: "宮浦正行",
      periods: [
        { from: 1978, to: 1992, ability: 50 },
        { from: 1993, to: 2000, ability: 40 }
      ]
    },
    {
      id: "yasuhiko-yasuda",
      name: "安田康彦",
      periods: [
        { from: 1991, to: 1999, ability: 50 },
        { from: 2000, to: 2001, ability: 60 },
        { from: 2002, to: 2006, ability: 50 }
      ]
    },
    {
      id: "taisei-yamada",
      name: "山田泰誠",
      periods: [
        { from: 1990, to: 1995, ability: 50 },
        { from: 1996, to: 2000, ability: 40 }
      ]
    },
    {
      id: "katsuichi-nishiura",
      name: "西浦勝一",
      periods: [
        { from: 1975, to: 1988, ability: 60 },
        { from: 1989, to: 1996, ability: 50 }
      ]
    },
    {
      id: "kunihiko-watanabe",
      name: "渡辺薫彦",
      periods: [
        { from: 1994, to: 2002, ability: 50 },
        { from: 2003, to: 2012, ability: 40 }
      ]
    },
    {
      id: "gohara-hiroyuki",
      name: "郷原洋行",
      periods: [
        { from: 1962, to: 1979, ability: 70 },
        { from: 1980, to: 1993, ability: 50 }
      ]
    },
    {
      id: "nohira-yuji",
      name: "野平祐二",
      periods: [
        { from: 1944, to: 1960, ability: 70 },
        { from: 1961, to: 1975, ability: 60 }
      ]
    },
    {
      id: "yasuda-takayoshi",
      name: "保田隆芳",
      periods: [
        { from: 1936, to: 1956, ability: 50 },
        { from: 1957, to: 1970, ability: 70 }
      ]
    },
    {
      id: "fukunaga-yoichi",
      name: "福永洋一",
      periods: [
        { from: 1968, to: 1979, ability: 70 }
      ]
    },
    {
      id: "kaga-takemi",
      name: "加賀武見",
      periods: [
        { from: 1960, to: 1979, ability: 70 },
        { from: 1980, to: 1988, ability: 50 }
      ]
    },
    {
      id: "tabara-seiki",
      name: "田原成貴",
      periods: [
        { from: 1978, to: 1992, ability: 70 },
        { from: 1993, to: 1998, ability: 50 }
      ]
    },
    {
      id: "minai-katsumi",
      name: "南井克巳",
      periods: [
        { from: 1979, to: 1990, ability: 60 },
        { from: 1991, to: 1999, ability: 70 }
      ]
    },
    {
      id: "ron-turcotte",
      name: "R. Turcotte",
      periods: [
        { from: 1961, to: 1978, ability: 88 }
      ]
    },
    {
      id: "jean-cruguet",
      name: "J. Cruguet",
      periods: [
        { from: 1965, to: 1980, ability: 84 }
      ]
    },
    {
      id: "steve-cauthen",
      name: "S. Cauthen",
      periods: [
        { from: 1976, to: 1987, ability: 88 },
        { from: 1988, to: 1992, ability: 86 }
      ]
    },
    {
      id: "laffit-pincay-jr",
      name: "L. Pincay Jr.",
      periods: [
        { from: 1966, to: 2003, ability: 89 }
      ]
    },
    {
      id: "victor-espinoza",
      name: "V. Espinoza",
      periods: [
        { from: 1993, to: 2014, ability: 82 },
        { from: 2015, to: 2026, ability: 86 }
      ]
    },
    {
      id: "mike-smith",
      name: "M. Smith",
      periods: [
        { from: 1982, to: 2009, ability: 87 },
        { from: 2010, to: 2026, ability: 89 }
      ]
    },
    {
      id: "eddie-arcaro",
      name: "E. Arcaro",
      periods: [
        { from: 1931, to: 1961, ability: 90 }
      ]
    },
    {
      id: "charley-kurtsinger",
      name: "C. Kurtsinger",
      periods: [
        { from: 1924, to: 1946, ability: 84 }
      ]
    },
    {
      id: "ron-franklin",
      name: "R. Franklin",
      periods: [
        { from: 1978, to: 1980, ability: 78 }
      ]
    },
    {
      id: "bill-shoemaker",
      name: "B. Shoemaker",
      periods: [
        { from: 1949, to: 1989, ability: 90 }
      ]
    },
    {
      id: "jerry-bailey",
      name: "J. Bailey",
      periods: [
        { from: 1974, to: 2006, ability: 89 }
      ]
    },
    {
      id: "chris-mccarron",
      name: "C. McCarron",
      periods: [
        { from: 1974, to: 2002, ability: 88 }
      ]
    },
    {
      id: "calvin-borel",
      name: "C. Borel",
      periods: [
        { from: 1983, to: 2026, ability: 84 }
      ]
    },
    {
      id: "tom-queally",
      name: "T. Queally",
      periods: [
        { from: 2004, to: 2014, ability: 85 },
        { from: 2015, to: 2026, ability: 80 }
      ]
    },
    {
      id: "mick-kinane",
      name: "M. Kinane",
      periods: [
        { from: 1975, to: 1996, ability: 87 },
        { from: 1997, to: 2009, ability: 89 }
      ]
    },
    {
      id: "frankie-dettori",
      name: "L. Dettori",
      periods: [
        { from: 1989, to: 2014, ability: 88 },
        { from: 2015, to: 2026, ability: 90 }
      ]
    },
    {
      id: "greville-starkey",
      name: "G. Starkey",
      periods: [
        { from: 1954, to: 1989, ability: 84 }
      ]
    },
    {
      id: "pat-eddery",
      name: "P. Eddery",
      periods: [
        { from: 1967, to: 2003, ability: 89 }
      ]
    },
    {
      id: "lester-piggott",
      name: "L. Piggott",
      periods: [
        { from: 1948, to: 1985, ability: 90 },
        { from: 1990, to: 1995, ability: 84 }
      ]
    },
    {
      id: "walter-swinburn",
      name: "W. Swinburn",
      periods: [
        { from: 1978, to: 2000, ability: 86 }
      ]
    },
    {
      id: "cash-asmussen",
      name: "C. Asmussen",
      periods: [
        { from: 1979, to: 2001, ability: 86 }
      ]
    },
    {
      id: "christophe-soumillon",
      name: "C. Soumillon",
      periods: [
        { from: 2000, to: 2010, ability: 87 },
        { from: 2011, to: 2026, ability: 89 }
      ]
    },
    {
      id: "jim-crowley",
      name: "J. Crowley",
      periods: [
        { from: 2006, to: 2015, ability: 82 },
        { from: 2016, to: 2026, ability: 86 }
      ]
    },
    {
      id: "kieren-fallon",
      name: "K. Fallon",
      periods: [
        { from: 1984, to: 1996, ability: 84 },
        { from: 1997, to: 2006, ability: 88 },
        { from: 2007, to: 2016, ability: 82 }
      ]
    },
    {
      id: "thierry-jarnet",
      name: "T. Jarnet",
      periods: [
        { from: 1984, to: 2002, ability: 86 },
        { from: 2003, to: 2016, ability: 87 }
      ]
    },
    {
      id: "james-mcdonald",
      name: "J. McDonald",
      periods: [
        { from: 2007, to: 2010, ability: 82 },
        { from: 2011, to: 2016, ability: 86 },
        { from: 2017, to: 2026, ability: 90 }
      ]
    },
    {
      id: "craig-williams",
      name: "C. Williams",
      periods: [
        { from: 1993, to: 2005, ability: 82 },
        { from: 2006, to: 2026, ability: 87 }
      ]
    },
    {
      id: "hugh-bowman",
      name: "H. Bowman",
      periods: [
        { from: 1999, to: 2013, ability: 84 },
        { from: 2014, to: 2019, ability: 90 },
        { from: 2020, to: 2026, ability: 86 }
      ]
    },
    {
      id: "damien-oliver",
      name: "D. Oliver",
      periods: [
        { from: 1988, to: 1995, ability: 84 },
        { from: 1996, to: 2023, ability: 89 }
      ]
    },
    {
      id: "kerrin-mcevoy",
      name: "K. McEvoy",
      periods: [
        { from: 1997, to: 2010, ability: 84 },
        { from: 2011, to: 2026, ability: 87 }
      ]
    },
    {
      id: "zac-purton",
      name: "Z. Purton",
      periods: [
        { from: 2003, to: 2006, ability: 82 },
        { from: 2007, to: 2013, ability: 86 },
        { from: 2014, to: 2026, ability: 90 }
      ]
    },
    {
      id: "karis-teetan",
      name: "K. Teetan",
      periods: [
        { from: 2007, to: 2012, ability: 80 },
        { from: 2013, to: 2026, ability: 85 }
      ]
    },
    {
      id: "vincent-ho",
      name: "V. Ho",
      periods: [
        { from: 2009, to: 2015, ability: 80 },
        { from: 2016, to: 2019, ability: 84 },
        { from: 2020, to: 2026, ability: 87 }
      ]
    },
    {
      id: "matthew-chadwick",
      name: "M. Chadwick",
      periods: [
        { from: 2008, to: 2013, ability: 84 },
        { from: 2014, to: 2026, ability: 82 }
      ]
    },
    {
      id: "derek-leung",
      name: "D. Leung",
      periods: [
        { from: 2008, to: 2016, ability: 80 },
        { from: 2017, to: 2026, ability: 83 }
      ]
    },
    {
      id: "felix-coetzee",
      name: "F. Coetzee",
      periods: [
        { from: 1982, to: 2003, ability: 84 },
        { from: 2004, to: 2014, ability: 87 }
      ]
    },
    {
      id: "olivier-doleuze",
      name: "O. Doleuze",
      periods: [
        { from: 1988, to: 2006, ability: 84 },
        { from: 2007, to: 2017, ability: 86 }
      ]
    },
    {
      id: "gerald-mosse",
      name: "G. Mosse",
      periods: [
        { from: 1983, to: 2006, ability: 87 },
        { from: 2007, to: 2020, ability: 84 }
      ]
    },
    {
      id: "brett-prebble",
      name: "B. Prebble",
      periods: [
        { from: 1996, to: 2005, ability: 82 },
        { from: 2006, to: 2018, ability: 86 },
        { from: 2019, to: 2021, ability: 80 }
      ]
    },
    {
      id: "douglas-whyte",
      name: "D. Whyte",
      periods: [
        { from: 1988, to: 1999, ability: 84 },
        { from: 2000, to: 2013, ability: 88 },
        { from: 2014, to: 2019, ability: 84 }
      ]
    },
    {
      id: "anthony-delpech",
      name: "A. Delpech",
      periods: [
        { from: 1991, to: 2004, ability: 84 },
        { from: 2005, to: 2018, ability: 86 }
      ]
    },
    {
      id: "william-buick",
      name: "W. Buick",
      periods: [
        { from: 2007, to: 2014, ability: 84 },
        { from: 2015, to: 2026, ability: 89 }
      ]
    },
    {
      id: "james-doyle",
      name: "J. Doyle",
      periods: [
        { from: 2005, to: 2013, ability: 82 },
        { from: 2014, to: 2026, ability: 87 }
      ]
    },
    {
      id: "johnny-murtagh",
      name: "J. Murtagh",
      periods: [
        { from: 1987, to: 2000, ability: 84 },
        { from: 2001, to: 2014, ability: 88 }
      ]
    },
    {
      id: "joseph-obrien",
      name: "J. O'Brien",
      periods: [
        { from: 2011, to: 2016, ability: 84 }
      ]
    },
    {
      id: "richard-hughes",
      name: "R. Hughes",
      periods: [
        { from: 1988, to: 2000, ability: 82 },
        { from: 2001, to: 2015, ability: 87 }
      ]
    },
    {
      id: "freddy-head",
      name: "F. Head",
      periods: [
        { from: 1966, to: 1984, ability: 86 },
        { from: 1985, to: 1997, ability: 89 }
      ]
    },
    {
      id: "paul-hanagan",
      name: "P. Hanagan",
      periods: [
        { from: 1998, to: 2010, ability: 82 },
        { from: 2011, to: 2021, ability: 86 }
      ]
    },
    {
      id: "stephane-pasquier",
      name: "S. Pasquier",
      periods: [
        { from: 1995, to: 2007, ability: 82 },
        { from: 2008, to: 2026, ability: 85 }
      ]
    },
    {
      id: "jamie-spencer",
      name: "J. Spencer",
      periods: [
        { from: 1996, to: 2005, ability: 84 },
        { from: 2006, to: 2026, ability: 86 }
      ]
    },
    {
      id: "kevin-darley",
      name: "K. Darley",
      periods: [
        { from: 1978, to: 1992, ability: 80 },
        { from: 1993, to: 2006, ability: 90 },
        { from: 2007, to: 2007, ability: 80 }
      ]
    },
    {
      id: "seamie-heffernan",
      name: "S. Heffernan",
      periods: [
        { from: 1988, to: 1999, ability: 80 },
        { from: 2000, to: 2021, ability: 90 },
        { from: 2022, to: 2026, ability: 80 }
      ]
    },
    {
      id: "jimmy-fortune",
      name: "J. Fortune",
      periods: [
        { from: 1988, to: 1997, ability: 80 },
        { from: 1998, to: 2009, ability: 90 },
        { from: 2010, to: 2017, ability: 80 }
      ]
    },
    {
      id: "joe-mercer",
      name: "J. Mercer",
      periods: [
        { from: 1947, to: 1952, ability: 80 },
        { from: 1953, to: 1981, ability: 90 },
        { from: 1982, to: 1985, ability: 80 }
      ]
    },
    {
      id: "geoff-lewis",
      name: "G. Lewis",
      periods: [
        { from: 1953, to: 1962, ability: 80 },
        { from: 1963, to: 1973, ability: 90 },
        { from: 1974, to: 1979, ability: 80 }
      ]
    },
    {
      id: "eduardo-pedroza",
      name: "E. Pedroza",
      periods: [
        { from: 1995, to: 2002, ability: 80 },
        { from: 2003, to: 2019, ability: 90 },
        { from: 2020, to: 2026, ability: 80 }
      ]
    },
    {
      id: "lukas-delozier",
      name: "L. Delozier",
      periods: [
        { from: 2018, to: 2026, ability: 80 }
      ]
    },
    {
      id: "rene-piechulek",
      name: "R. Piechulek",
      periods: [
        { from: 2004, to: 2020, ability: 80 },
        { from: 2021, to: 2024, ability: 90 },
        { from: 2025, to: 2026, ability: 80 }
      ]
    },
    {
      id: "gary-w-moore",
      name: "G. Moore",
      periods: [
        { from: 1970, to: 1988, ability: 90 }
      ]
    },
    {
      id: "hollie-doyle",
      name: "H. Doyle",
      periods: [
        { from: 2013, to: 2019, ability: 80 },
        { from: 2020, to: 2026, ability: 90 }
      ]
    },
    {
      id: "oisin-orr",
      name: "O. Orr",
      periods: [
        { from: 2017, to: 2026, ability: 80 }
      ]
    },
    {
      id: "david-egan",
      name: "D. Egan",
      periods: [
        { from: 2016, to: 2020, ability: 80 },
        { from: 2021, to: 2026, ability: 90 }
      ]
    },
    {
      id: "silvestre-de-sousa",
      name: "S. de Sousa",
      periods: [
        { from: 2006, to: 2011, ability: 80 },
        { from: 2012, to: 2019, ability: 90 },
        { from: 2020, to: 2026, ability: 80 }
      ]
    },
    {
      id: "kevin-shea",
      name: "K. Shea",
      periods: [
        { from: 1979, to: 1999, ability: 80 },
        { from: 2000, to: 2012, ability: 90 },
        { from: 2013, to: 2015, ability: 80 }
      ]
    },
    {
      id: "oscar-urbina",
      name: "O. Urbina",
      periods: [
        { from: 1992, to: 2006, ability: 80 }
      ]
    },
    {
      id: "willie-lane",
      name: "W. Lane",
      periods: [
        { from: 1898, to: 1901, ability: 80 },
        { from: 1902, to: 1904, ability: 90 },
        { from: 1905, to: 1912, ability: 80 }
      ]
    },
    {
      id: "brett-doyle",
      name: "B. Doyle",
      periods: [
        { from: 1993, to: 2011, ability: 80 }
      ]
    },
    {
      id: "rob-hornby",
      name: "R. Hornby",
      periods: [
        { from: 2014, to: 2026, ability: 80 }
      ]
    },
    {
      id: "thierry-gillet",
      name: "T. Gillet",
      periods: [
        { from: 1993, to: 2000, ability: 80 },
        { from: 2001, to: 2007, ability: 90 },
        { from: 2008, to: 2009, ability: 80 }
      ]
    },
    {
      id: "yves-saint-martin",
      name: "Y. Saint-Martin",
      periods: [
        { from: 1958, to: 1959, ability: 80 },
        { from: 1960, to: 1983, ability: 90 },
        { from: 1984, to: 1987, ability: 80 }
      ]
    },
    {
      id: "alexis-pouchin",
      name: "A. Pouchin",
      periods: [
        { from: 2017, to: 2026, ability: 80 }
      ]
    },
    {
      id: "daniel-tudhope",
      name: "D. Tudhope",
      periods: [
        { from: 2003, to: 2026, ability: 80 }
      ]
    },
    {
      id: "davy-bonilla",
      name: "D. Bonilla",
      periods: [
        { from: 1993, to: 1999, ability: 80 },
        { from: 2000, to: 2008, ability: 90 },
        { from: 2009, to: 2013, ability: 80 }
      ]
    },
    {
      id: "filip-minarik",
      name: "F. Minarik",
      periods: [
        { from: 1993, to: 2004, ability: 80 },
        { from: 2005, to: 2017, ability: 90 },
        { from: 2018, to: 2020, ability: 80 }
      ]
    },
    {
      id: "pj-mcdonald",
      name: "P. J. McDonald",
      periods: [
        { from: 2007, to: 2026, ability: 80 }
      ]
    },
    {
      id: "ted-durcan",
      name: "T. Durcan",
      periods: [
        { from: 1992, to: 2002, ability: 80 },
        { from: 2003, to: 2009, ability: 90 },
        { from: 2010, to: 2017, ability: 80 }
      ]
    },
    {
      id: "george-duffield",
      name: "G. Duffield",
      periods: [
        { from: 1967, to: 2003, ability: 84 }
      ]
    },
    {
      id: "colm-odonoghue",
      name: "C. O'Donoghue",
      periods: [
        { from: 1999, to: 2012, ability: 82 },
        { from: 2013, to: 2021, ability: 85 }
      ]
    },
    {
      id: "chris-hayes",
      name: "C. Hayes",
      periods: [
        { from: 2004, to: 2015, ability: 81 },
        { from: 2016, to: 2026, ability: 85 }
      ]
    },
    {
      id: "maxime-guyon",
      name: "M. Guyon",
      periods: [
        { from: 2005, to: 2012, ability: 82 },
        { from: 2013, to: 2026, ability: 87 }
      ]
    },
    {
      id: "oisin-murphy",
      name: "O. Murphy",
      periods: [
        { from: 2013, to: 2017, ability: 82 },
        { from: 2018, to: 2026, ability: 88 }
      ]
    },
    {
      id: "ioritz-mendizabal",
      name: "I. Mendizabal",
      periods: [
        { from: 1994, to: 2010, ability: 84 },
        { from: 2011, to: 2026, ability: 82 }
      ]
    },
    {
      id: "cristian-demuro",
      name: "C. Demuro",
      periods: [
        { from: 2009, to: 2016, ability: 82 },
        { from: 2017, to: 2026, ability: 87 }
      ]
    },
    {
      id: "pierre-charles-boudot",
      name: "P. Boudot",
      periods: [
        { from: 2009, to: 2014, ability: 82 },
        { from: 2015, to: 2021, ability: 88 }
      ]
    },
    {
      id: "aurelien-lemaitre",
      name: "A. Lemaitre",
      periods: [
        { from: 2010, to: 2018, ability: 80 },
        { from: 2019, to: 2026, ability: 84 }
      ]
    },
    {
      id: "andrasch-starke",
      name: "A. Starke",
      periods: [
        { from: 1989, to: 2005, ability: 84 },
        { from: 2006, to: 2026, ability: 86 }
      ]
    },
    {
      id: "colin-keane",
      name: "C. Keane",
      periods: [
        { from: 2014, to: 2018, ability: 82 },
        { from: 2019, to: 2026, ability: 87 }
      ]
    },
    {
      id: "rossa-ryan",
      name: "R. Ryan",
      periods: [
        { from: 2016, to: 2021, ability: 80 },
        { from: 2022, to: 2026, ability: 85 }
      ]
    },
    {
      id: "luke-morris",
      name: "L. Morris",
      periods: [
        { from: 2005, to: 2014, ability: 81 },
        { from: 2015, to: 2026, ability: 84 }
      ]
    },
    {
      id: "john-velazquez",
      name: "J. Velazquez",
      periods: [
        { from: 1990, to: 2009, ability: 87 },
        { from: 2010, to: 2026, ability: 89 }
      ]
    },
    {
      id: "kent-desormeaux",
      name: "K. Desormeaux",
      periods: [
        { from: 1986, to: 1988, ability: 80 },
        { from: 1989, to: 2016, ability: 90 },
        { from: 2017, to: 2026, ability: 80 }
      ]
    },
    {
      id: "pat-day",
      name: "P. Day",
      periods: [
        { from: 1973, to: 1981, ability: 80 },
        { from: 1982, to: 2002, ability: 90 },
        { from: 2003, to: 2005, ability: 80 }
      ]
    },
    {
      id: "randy-romero",
      name: "R. Romero",
      periods: [
        { from: 1975, to: 1984, ability: 80 },
        { from: 1985, to: 1995, ability: 90 },
        { from: 1996, to: 1999, ability: 80 }
      ]
    },
    {
      id: "jeffrey-fell",
      name: "J. Fell",
      periods: [
        { from: 1974, to: 1977, ability: 80 },
        { from: 1978, to: 1982, ability: 90 },
        { from: 1983, to: 1989, ability: 80 }
      ]
    },
    {
      id: "eddie-delahoussaye",
      name: "E. Delahoussaye",
      periods: [
        { from: 1968, to: 1977, ability: 80 },
        { from: 1978, to: 1998, ability: 90 },
        { from: 1999, to: 2003, ability: 80 }
      ]
    },
    {
      id: "ricardo-santana-jr",
      name: "R. Santana Jr.",
      periods: [
        { from: 2009, to: 2026, ability: 80 }
      ]
    },
    {
      id: "mario-gutierrez",
      name: "M. Gutierrez",
      periods: [
        { from: 2006, to: 2011, ability: 80 },
        { from: 2012, to: 2016, ability: 90 },
        { from: 2017, to: 2026, ability: 80 }
      ]
    },
    {
      id: "martin-garcia",
      name: "M. Garcia",
      periods: [
        { from: 2005, to: 2009, ability: 80 },
        { from: 2010, to: 2015, ability: 90 },
        { from: 2016, to: 2026, ability: 80 }
      ]
    },
    {
      id: "albin-jimenez",
      name: "A. Jimenez",
      periods: [
        { from: 2010, to: 2026, ability: 80 }
      ]
    },
    {
      id: "alex-solis",
      name: "A. Solis",
      periods: [
        { from: 1982, to: 1985, ability: 80 },
        { from: 1986, to: 2006, ability: 90 },
        { from: 2007, to: 2017, ability: 80 }
      ]
    },
    {
      id: "bill-hartack",
      name: "B. Hartack",
      periods: [
        { from: 1953, to: 1954, ability: 80 },
        { from: 1955, to: 1974, ability: 90 },
        { from: 1975, to: 1981, ability: 80 }
      ]
    },
    {
      id: "brian-hernandez-jr",
      name: "B. Hernandez Jr.",
      periods: [
        { from: 2003, to: 2011, ability: 80 },
        { from: 2012, to: 2012, ability: 90 },
        { from: 2013, to: 2023, ability: 80 },
        { from: 2024, to: 2026, ability: 90 }
      ]
    },
    {
      id: "edgar-prado",
      name: "E. Prado",
      periods: [
        { from: 1986, to: 1996, ability: 80 },
        { from: 1997, to: 2008, ability: 90 },
        { from: 2009, to: 2023, ability: 80 }
      ]
    },
    {
      id: "ismael-valenzuela",
      name: "I. Valenzuela",
      periods: [
        { from: 1950, to: 1957, ability: 80 },
        { from: 1958, to: 1968, ability: 90 },
        { from: 1969, to: 1980, ability: 80 }
      ]
    },
    {
      id: "jeremy-rose",
      name: "J. Rose",
      periods: [
        { from: 2001, to: 2004, ability: 80 },
        { from: 2005, to: 2005, ability: 90 },
        { from: 2006, to: 2026, ability: 80 }
      ]
    },
    {
      id: "johnny-loftus",
      name: "J. Loftus",
      periods: [
        { from: 1909, to: 1915, ability: 80 },
        { from: 1916, to: 1919, ability: 90 }
      ]
    },
    {
      id: "jose-ortiz",
      name: "J. Ortiz",
      periods: [
        { from: 2012, to: 2015, ability: 80 },
        { from: 2016, to: 2026, ability: 90 }
      ]
    },
    {
      id: "jose-santos",
      name: "J. Santos",
      periods: [
        { from: 1984, to: 1985, ability: 80 },
        { from: 1986, to: 2003, ability: 90 },
        { from: 2004, to: 2007, ability: 80 }
      ]
    },
    {
      id: "julie-krone",
      name: "J. Krone",
      periods: [
        { from: 1981, to: 1986, ability: 80 },
        { from: 1987, to: 2004, ability: 90 }
      ]
    },
    {
      id: "patrick-valenzuela",
      name: "P. Valenzuela",
      periods: [
        { from: 1978, to: 1982, ability: 80 },
        { from: 1983, to: 1993, ability: 90 },
        { from: 1994, to: 2012, ability: 80 }
      ]
    },
    {
      id: "ramon-dominguez",
      name: "R. Dominguez",
      periods: [
        { from: 1996, to: 2004, ability: 80 },
        { from: 2005, to: 2013, ability: 90 }
      ]
    },
    {
      id: "robby-albarado",
      name: "R. Albarado",
      periods: [
        { from: 1990, to: 2006, ability: 80 },
        { from: 2007, to: 2012, ability: 90 },
        { from: 2013, to: 2021, ability: 80 }
      ]
    },
    {
      id: "stewart-elliott",
      name: "S. Elliott",
      periods: [
        { from: 1981, to: 2003, ability: 80 },
        { from: 2004, to: 2004, ability: 90 },
        { from: 2005, to: 2026, ability: 80 }
      ]
    },
    {
      id: "tyler-gaffalione",
      name: "T. Gaffalione",
      periods: [
        { from: 2015, to: 2018, ability: 80 },
        { from: 2019, to: 2026, ability: 90 }
      ]
    },
    {
      id: "wayne-d-wright",
      name: "W. Wright",
      periods: [
        { from: 1931, to: 1933, ability: 80 },
        { from: 1934, to: 1946, ability: 90 },
        { from: 1947, to: 1950, ability: 80 }
      ]
    },
    {
      id: "armando-c-glades",
      name: "A. Glades",
      periods: [
        { from: 2002, to: 2003, ability: 80 }
      ]
    },
    {
      id: "jay-ford",
      name: "J. Ford",
      periods: [
        { from: 2003, to: 2026, ability: 83 }
      ]
    },
    {
      id: "luke-nolen",
      name: "L. Nolen",
      periods: [
        { from: 1998, to: 2008, ability: 82 },
        { from: 2009, to: 2026, ability: 86 }
      ]
    },
    {
      id: "adam-kirby",
      name: "A. Kirby",
      periods: [
        { from: 2004, to: 2012, ability: 80 },
        { from: 2013, to: 2022, ability: 85 }
      ]
    },
    {
      id: "cieren-fallon",
      name: "C. Fallon",
      periods: [
        { from: 2019, to: 2026, ability: 83 }
      ]
    },
    {
      id: "jason-hart",
      name: "J. Hart",
      periods: [
        { from: 2011, to: 2018, ability: 80 },
        { from: 2019, to: 2026, ability: 84 }
      ]
    },
    {
      id: "willie-carson",
      name: "W. Carson",
      periods: [
        { from: 1962, to: 1985, ability: 88 },
        { from: 1986, to: 1996, ability: 85 }
      ]
    },
    {
      id: "paul-mulrennan",
      name: "P. Mulrennan",
      periods: [
        { from: 2002, to: 2014, ability: 80 },
        { from: 2015, to: 2026, ability: 84 }
      ]
    },
    {
      id: "kevin-stott",
      name: "K. Stott",
      periods: [
        { from: 2012, to: 2018, ability: 80 },
        { from: 2019, to: 2026, ability: 84 }
      ]
    },
    {
      id: "callum-rodriguez",
      name: "C. Rodriguez",
      periods: [
        { from: 2016, to: 2026, ability: 82 }
      ]
    },
    {
      id: "tom-eaves",
      name: "T. Eaves",
      periods: [
        { from: 1999, to: 2016, ability: 80 },
        { from: 2017, to: 2026, ability: 83 }
      ]
    },
    {
      id: "martin-harley",
      name: "M. Harley",
      periods: [
        { from: 2004, to: 2014, ability: 80 },
        { from: 2015, to: 2022, ability: 83 }
      ]
    },
    {
      id: "david-allan",
      name: "D. Allan",
      periods: [
        { from: 1996, to: 2014, ability: 80 },
        { from: 2015, to: 2026, ability: 83 }
      ]
    },
    {
      id: "glen-boss",
      name: "G. Boss",
      periods: [
        { from: 1991, to: 2005, ability: 84 },
        { from: 2006, to: 2021, ability: 87 }
      ]
    },
    {
      id: "steven-arnold",
      name: "S. Arnold",
      periods: [
        { from: 1990, to: 2005, ability: 82 },
        { from: 2006, to: 2018, ability: 85 }
      ]
    },
    {
      id: "wayne-lordan",
      name: "W. Lordan",
      periods: [
        { from: 2001, to: 2011, ability: 82 },
        { from: 2012, to: 2026, ability: 85 }
      ]
    },
    {
      id: "katsumi-ando",
      name: "安藤勝己",
      periods: [
        { from: 1976, to: 1994, ability: 60 },
        { from: 1995, to: 2013, ability: 70 }
      ]
    },
    {
      id: "hirofumi-shii",
      name: "四位洋文",
      periods: [
        { from: 1991, to: 2000, ability: 60 },
        { from: 2001, to: 2020, ability: 60 }
      ]
    },
    {
      id: "masayoshi-ebina",
      name: "蛯名正義",
      periods: [
        { from: 1987, to: 1997, ability: 60 },
        { from: 1998, to: 2015, ability: 70 },
        { from: 2016, to: 2021, ability: 50 }
      ]
    },
    {
      id: "yoshitomi-shibata",
      name: "柴田善臣",
      periods: [
        { from: 1985, to: 1998, ability: 60 },
        { from: 1999, to: 2010, ability: 70 },
        { from: 2011, to: 2026, ability: 50 }
      ]
    },
    {
      id: "masao-sato",
      name: "佐藤正雄",
      periods: [
        { from: 1976, to: 1992, ability: 50 },
        { from: 1993, to: 1996, ability: 40 }
      ]
    },
    {
      id: "mamoru-ishibashi",
      name: "石橋守",
      periods: [
        { from: 1985, to: 2005, ability: 50 },
        { from: 2006, to: 2007, ability: 60 },
        { from: 2008, to: 2012, ability: 50 }
      ]
    },
    {
      id: "shu-ishibashi",
      name: "石橋脩",
      periods: [
        { from: 2003, to: 2016, ability: 50 },
        { from: 2017, to: 2026, ability: 50 }
      ]
    },
    {
      id: "yusuke-fujioka",
      name: "藤岡佑介",
      periods: [
        { from: 2004, to: 2015, ability: 50 },
        { from: 2016, to: 2026, ability: 50 }
      ]
    },
    {
      id: "yuichi-kitamura",
      name: "北村友一",
      periods: [
        { from: 2006, to: 2018, ability: 50 },
        { from: 2019, to: 2026, ability: 60 }
      ]
    },
    {
      id: "futoshi-kojima",
      name: "小島太",
      periods: [
        { from: 1970, to: 1988, ability: 60 },
        { from: 1989, to: 1996, ability: 50 }
      ]
    },
    {
      id: "koshiro-take",
      name: "武幸四郎",
      periods: [
        { from: 1997, to: 2017, ability: 50 }
      ]
    },
    {
      id: "shinji-fujita",
      name: "藤田伸二",
      periods: [
        { from: 1991, to: 2001, ability: 60 },
        { from: 2002, to: 2015, ability: 60 }
      ]
    },
    {
      id: "bauyrzhan-murzabayev",
      name: "B. Murzabayev",
      periods: [
        { from: 2018, to: 2026, ability: 84 }
      ]
    },
    {
      id: "clarence-kummer",
      name: "C. Kummer",
      periods: [
        { from: 1916, to: 1928, ability: 86 }
      ]
    },
    {
      id: "eric-guerin",
      name: "E. Guerin",
      periods: [
        { from: 1942, to: 1975, ability: 86 }
      ]
    },
    {
      id: "braulio-baeza",
      name: "B. Baeza",
      periods: [
        { from: 1955, to: 1976, ability: 88 }
      ]
    },
    {
      id: "heliodoro-gustines",
      name: "H. Gustines",
      periods: [
        { from: 1957, to: 1980, ability: 85 }
      ]
    },
    {
      id: "jorge-velasquez",
      name: "J. Velasquez",
      periods: [
        { from: 1963, to: 1996, ability: 87 }
      ]
    },
    {
      id: "red-pollard",
      name: "R. Pollard",
      periods: [
        { from: 1928, to: 1955, ability: 82 }
      ]
    },
    {
      id: "flavien-prat",
      name: "F. Prat",
      periods: [
        { from: 2009, to: 2014, ability: 83 },
        { from: 2015, to: 2026, ability: 89 }
      ]
    },
    {
      id: "florent-geroux",
      name: "F. Geroux",
      periods: [
        { from: 2004, to: 2013, ability: 82 },
        { from: 2014, to: 2026, ability: 87 }
      ]
    },
    {
      id: "jose-lezcano",
      name: "J. Lezcano",
      periods: [
        { from: 2004, to: 2026, ability: 84 }
      ]
    },
    {
      id: "irad-ortiz-jr",
      name: "I. Ortiz Jr.",
      periods: [
        { from: 2011, to: 2017, ability: 86 },
        { from: 2018, to: 2026, ability: 90 }
      ]
    },
    {
      id: "joel-rosario",
      name: "J. Rosario",
      periods: [
        { from: 2006, to: 2014, ability: 86 },
        { from: 2015, to: 2026, ability: 89 }
      ]
    },
    {
      id: "julien-leparoux",
      name: "J. Leparoux",
      periods: [
        { from: 2005, to: 2012, ability: 86 },
        { from: 2013, to: 2026, ability: 84 }
      ]
    },
    {
      id: "junior-alvarado",
      name: "J. Alvarado",
      periods: [
        { from: 2007, to: 2021, ability: 82 },
        { from: 2022, to: 2026, ability: 85 }
      ]
    },
    {
      id: "luis-saez",
      name: "L. Saez",
      periods: [
        { from: 2009, to: 2016, ability: 82 },
        { from: 2017, to: 2026, ability: 87 }
      ]
    },
    {
      id: "gary-stevens",
      name: "G. Stevens",
      periods: [
        { from: 1979, to: 2005, ability: 88 },
        { from: 2013, to: 2018, ability: 86 }
      ]
    },
    {
      id: "garrett-gomez",
      name: "G. Gomez",
      periods: [
        { from: 1988, to: 2013, ability: 88 }
      ]
    },
    {
      id: "jacinto-vasquez",
      name: "J. Vasquez",
      periods: [
        { from: 1960, to: 1996, ability: 88 }
      ]
    },
    {
      id: "generic-local",
      name: "默认骑手",
      mainSelectable: false,
      periods: [
        { from: 1980, to: 2035, ability: 40 }
      ]
    }
  ];

  ns.JockeyAffiliations = {
    japan: "日本所属",
    usa: "美国所属",
    europe: "欧洲所属",
    hongkong: "香港所属",
    australia: "澳洲所属",
    local: "地方所属"
  };

  const affiliationMeta = {
    "take-yutaka": ["japan"],
    "christophe-lemaire": ["japan", "europe"],
    "mirco-demuro": ["japan", "europe"],
    "kenichi-ikezoe": ["japan"],
    "yuichi-fukunaga": ["japan"],
    "keita-tosaki": ["japan"],
    "yuga-kawada": ["japan"],
    "norihiro-yokoyama": ["japan"],
    "kazuo-yokoyama": ["japan"],
    "tetsuzo-wada": ["japan"],
    "tetsuzo-sato": ["japan"],
    "olivier-peslier": ["europe"],
    "ryan-moore": ["europe"],
    "damian-lane": ["australia"],
    "takeshi-yokoyama": ["japan"],
    "ryusei-sakai": ["japan"],
    "kohei-matsuyama": ["japan"],
    "taisei-danno": ["japan"],
    "yasunari-iwata": ["japan"],
    "hideaki-miyuki": ["japan"],
    "hitoshi-matoba": ["japan"],
    "hiroyuki-uchida": ["japan"],
    "sueo-masuzawa": ["japan"],
    "suguru-hamanaka": ["japan"],
    "mirai-iwata": ["japan"],
    "mikio-matsunaga": ["japan"],
    "hiroki-goto": ["japan"],
    "akihiro-iida": ["japan"],
    "hiroshi-nakajima": ["japan"],
    "eiji-nakadate": ["japan"],
    "masami-matsuoka": ["japan"],
    "katsuharu-tanaka": ["japan"],
    "hiroshi-kitamura": ["japan"],
    "hironobu-tanabe": ["japan"],
    "shoichi-osaki": ["japan"],
    "isao-shimada": ["japan"],
    "ichizo-iwamoto": ["japan"],
    "kunihiko-take": ["japan"],
    "takayuki-yasuda": ["japan"],
    "koichi-tsunoda": ["japan"],
    "koichi-uchida": ["japan"],
    "masaru-kurita": ["japan"],
    "yoshito-matsumoto": ["japan"],
    "akira-shikato": ["japan"],
    "sadahiro-kojima": ["japan"],
    "masahiro-ikegami": ["japan"],
    "seiichi-nakanowatari": ["japan"],
    "ryoji-furuyama": ["japan"],
    "masato-yoshinaga": ["japan"],
    "kizo-konishi": ["japan"],
    "hayato-yoshida": ["japan"],
    "yutaka-yoshida": ["japan"],
    "joao-moreira": ["hongkong"],
    "umberto-rispoli": ["europe", "usa"],
    "okabe-yukio": ["japan"],
    "shibata-masato": ["japan"],
    "kawachi-hiroshi": ["japan"],
    "masaru-honda": ["japan"],
    "shigehiko-kishi": ["japan"],
    "masayuki-miyaura": ["japan"],
    "yasuhiko-yasuda": ["japan"],
    "taisei-yamada": ["japan"],
    "katsuichi-nishiura": ["japan"],
    "kunihiko-watanabe": ["japan"],
    "gohara-hiroyuki": ["japan"],
    "nohira-yuji": ["japan"],
    "yasuda-takayoshi": ["japan"],
    "fukunaga-yoichi": ["japan"],
    "kaga-takemi": ["japan"],
    "tabara-seiki": ["japan"],
    "minai-katsumi": ["japan"],
    "ron-turcotte": ["usa"],
    "jean-cruguet": ["usa", "europe"],
    "steve-cauthen": ["usa", "europe"],
    "laffit-pincay-jr": ["usa"],
    "victor-espinoza": ["usa"],
    "mike-smith": ["usa"],
    "eddie-arcaro": ["usa"],
    "charley-kurtsinger": ["usa"],
    "ron-franklin": ["usa"],
    "bill-shoemaker": ["usa"],
    "jerry-bailey": ["usa"],
    "chris-mccarron": ["usa"],
    "calvin-borel": ["usa"],
    "tom-queally": ["europe"],
    "mick-kinane": ["europe"],
    "frankie-dettori": ["europe"],
    "greville-starkey": ["europe"],
    "pat-eddery": ["europe"],
    "lester-piggott": ["europe"],
    "walter-swinburn": ["europe"],
    "cash-asmussen": ["usa", "europe"],
    "christophe-soumillon": ["europe"],
    "jim-crowley": ["europe"],
    "kieren-fallon": ["europe"],
    "thierry-jarnet": ["europe"],
    "james-mcdonald": ["australia"],
    "craig-williams": ["australia"],
    "hugh-bowman": ["australia"],
    "damien-oliver": ["australia"],
    "kerrin-mcevoy": ["australia"],
    "zac-purton": ["hongkong"],
    "karis-teetan": ["hongkong"],
    "vincent-ho": ["hongkong"],
    "matthew-chadwick": ["hongkong"],
    "derek-leung": ["hongkong"],
    "felix-coetzee": ["hongkong"],
    "olivier-doleuze": ["hongkong", "europe"],
    "gerald-mosse": ["hongkong", "europe"],
    "brett-prebble": ["hongkong", "australia"],
    "douglas-whyte": ["hongkong"],
    "anthony-delpech": ["hongkong"],
    "william-buick": ["europe"],
    "james-doyle": ["europe"],
    "johnny-murtagh": ["europe"],
    "joseph-obrien": ["europe"],
    "richard-hughes": ["europe"],
    "freddy-head": ["europe"],
    "paul-hanagan": ["europe"],
    "stephane-pasquier": ["europe"],
    "jamie-spencer": ["europe"],
    "kevin-darley": ["europe"],
    "seamie-heffernan": ["europe"],
    "jimmy-fortune": ["europe"],
    "joe-mercer": ["europe"],
    "geoff-lewis": ["europe"],
    "eduardo-pedroza": ["europe"],
    "lukas-delozier": ["europe"],
    "rene-piechulek": ["europe"],
    "gary-w-moore": ["australia", "hongkong", "europe"],
    "hollie-doyle": ["europe"],
    "oisin-orr": ["europe"],
    "david-egan": ["europe"],
    "silvestre-de-sousa": ["europe", "hongkong"],
    "kevin-shea": ["europe"],
    "oscar-urbina": ["europe"],
    "willie-lane": ["europe"],
    "brett-doyle": ["europe", "hongkong"],
    "rob-hornby": ["europe"],
    "thierry-gillet": ["europe"],
    "yves-saint-martin": ["europe"],
    "alexis-pouchin": ["europe"],
    "daniel-tudhope": ["europe"],
    "davy-bonilla": ["europe"],
    "filip-minarik": ["europe"],
    "pj-mcdonald": ["europe"],
    "ted-durcan": ["europe"],
    "george-duffield": ["europe"],
    "colm-odonoghue": ["europe"],
    "chris-hayes": ["europe"],
    "maxime-guyon": ["europe"],
    "oisin-murphy": ["europe"],
    "ioritz-mendizabal": ["europe"],
    "cristian-demuro": ["europe"],
    "pierre-charles-boudot": ["europe"],
    "aurelien-lemaitre": ["europe"],
    "andrasch-starke": ["europe"],
    "colin-keane": ["europe"],
    "rossa-ryan": ["europe"],
    "luke-morris": ["europe"],
    "john-velazquez": ["usa"],
    "kent-desormeaux": ["usa"],
    "pat-day": ["usa"],
    "randy-romero": ["usa"],
    "jeffrey-fell": ["usa"],
    "eddie-delahoussaye": ["usa"],
    "ricardo-santana-jr": ["usa"],
    "mario-gutierrez": ["usa"],
    "martin-garcia": ["usa"],
    "albin-jimenez": ["usa"],
    "alex-solis": ["usa"],
    "bill-hartack": ["usa", "hongkong"],
    "brian-hernandez-jr": ["usa"],
    "edgar-prado": ["usa"],
    "ismael-valenzuela": ["usa"],
    "jeremy-rose": ["usa"],
    "johnny-loftus": ["usa"],
    "jose-ortiz": ["usa"],
    "jose-santos": ["usa"],
    "julie-krone": ["usa"],
    "patrick-valenzuela": ["usa"],
    "ramon-dominguez": ["usa"],
    "robby-albarado": ["usa"],
    "stewart-elliott": ["usa"],
    "tyler-gaffalione": ["usa"],
    "wayne-d-wright": ["usa"],
    "armando-c-glades": ["usa"],
    "jay-ford": ["australia"],
    "luke-nolen": ["australia"],
    "adam-kirby": ["europe"],
    "cieren-fallon": ["europe"],
    "jason-hart": ["europe"],
    "willie-carson": ["europe"],
    "paul-mulrennan": ["europe"],
    "kevin-stott": ["europe"],
    "callum-rodriguez": ["europe"],
    "tom-eaves": ["europe"],
    "martin-harley": ["europe"],
    "david-allan": ["europe"],
    "glen-boss": ["australia"],
    "steven-arnold": ["australia"],
    "wayne-lordan": ["europe"],
    "katsumi-ando": ["japan"],
    "hirofumi-shii": ["japan"],
    "masayoshi-ebina": ["japan"],
    "yoshitomi-shibata": ["japan"],
    "masao-sato": ["japan"],
    "mamoru-ishibashi": ["japan"],
    "shu-ishibashi": ["japan"],
    "yusuke-fujioka": ["japan"],
    "yuichi-kitamura": ["japan"],
    "futoshi-kojima": ["japan"],
    "koshiro-take": ["japan"],
    "shinji-fujita": ["japan"],
    "bauyrzhan-murzabayev": ["europe"],
    "clarence-kummer": ["usa"],
    "eric-guerin": ["usa"],
    "braulio-baeza": ["usa"],
    "heliodoro-gustines": ["usa"],
    "jorge-velasquez": ["usa"],
    "red-pollard": ["usa"],
    "flavien-prat": ["usa", "europe"],
    "florent-geroux": ["usa", "europe"],
    "jose-lezcano": ["usa"],
    "irad-ortiz-jr": ["usa"],
    "joel-rosario": ["usa"],
    "julien-leparoux": ["usa", "europe"],
    "junior-alvarado": ["usa"],
    "luis-saez": ["usa"],
    "gary-stevens": ["usa"],
    "garrett-gomez": ["usa"],
    "jacinto-vasquez": ["usa"],
    "generic-local": ["local", "japan"]
  };

  ns.Jockeys.forEach((jockey) => {
    jockey.affiliations = affiliationMeta[jockey.id] || ["local"];
    if (jockey.defaultAbility == null) {
      jockey.defaultAbility = Math.max(...jockey.periods.map((period) => period.ability));
    }
  });
})();
