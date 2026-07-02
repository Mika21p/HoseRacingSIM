(function () {
  const ns = (window.Keiba = window.Keiba || {});

  ns.Jockeys = [
    {
      id: "take-yutaka",
      name: "武豊",
      periods: [
        { from: 1987, to: 1994, ability: 82 },
        { from: 1995, to: 2010, ability: 90 },
        { from: 2011, to: 2026, ability: 84 }
      ]
    },
    {
      id: "christophe-lemaire",
      name: "C. Lemaire",
      periods: [
        { from: 2002, to: 2014, ability: 82 },
        { from: 2015, to: 2026, ability: 90 }
      ]
    },
    {
      id: "mirco-demuro",
      name: "M. Demuro",
      periods: [
        { from: 2003, to: 2014, ability: 80 },
        { from: 2015, to: 2026, ability: 85 }
      ]
    },
    {
      id: "kenichi-ikezoe",
      name: "池添謙一",
      periods: [
        { from: 1998, to: 2008, ability: 76 },
        { from: 2009, to: 2026, ability: 83 }
      ]
    },
    {
      id: "yuichi-fukunaga",
      name: "福永祐一",
      periods: [
        { from: 1996, to: 2012, ability: 78 },
        { from: 2013, to: 2023, ability: 86 }
      ]
    },
    {
      id: "keita-tosaki",
      name: "戸崎圭太",
      periods: [
        { from: 2005, to: 2012, ability: 74 },
        { from: 2013, to: 2026, ability: 82 }
      ]
    },
    {
      id: "yuga-kawada",
      name: "川田将雅",
      periods: [
        { from: 2004, to: 2013, ability: 76 },
        { from: 2014, to: 2026, ability: 88 }
      ]
    },
    {
      id: "kazuo-yokoyama",
      name: "横山典弘",
      periods: [
        { from: 1986, to: 2008, ability: 84 },
        { from: 2009, to: 2026, ability: 80 }
      ]
    },
    {
      id: "tetsuzo-wada",
      name: "和田竜二",
      periods: [
        { from: 1996, to: 2010, ability: 78 },
        { from: 2011, to: 2026, ability: 74 }
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
        { from: 2017, to: 2026, ability: 82 }
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
      id: "okabe-yukio",
      name: "岡部幸雄",
      periods: [
        { from: 1967, to: 1983, ability: 82 },
        { from: 1984, to: 1998, ability: 88 },
        { from: 1999, to: 2005, ability: 82 }
      ]
    },
    {
      id: "shibata-masato",
      name: "柴田政人",
      periods: [
        { from: 1967, to: 1979, ability: 78 },
        { from: 1980, to: 1995, ability: 85 }
      ]
    },
    {
      id: "kawachi-hiroshi",
      name: "河内洋",
      periods: [
        { from: 1974, to: 1990, ability: 80 },
        { from: 1991, to: 2003, ability: 84 }
      ]
    },
    {
      id: "gohara-hiroyuki",
      name: "郷原洋行",
      periods: [
        { from: 1962, to: 1979, ability: 83 },
        { from: 1980, to: 1993, ability: 78 }
      ]
    },
    {
      id: "nohira-yuji",
      name: "野平祐二",
      periods: [
        { from: 1944, to: 1960, ability: 84 },
        { from: 1961, to: 1975, ability: 80 }
      ]
    },
    {
      id: "yasuda-takayoshi",
      name: "保田隆芳",
      periods: [
        { from: 1936, to: 1956, ability: 85 },
        { from: 1957, to: 1970, ability: 80 }
      ]
    },
    {
      id: "fukunaga-yoichi",
      name: "福永洋一",
      periods: [
        { from: 1968, to: 1979, ability: 88 }
      ]
    },
    {
      id: "kaga-takemi",
      name: "加賀武見",
      periods: [
        { from: 1960, to: 1979, ability: 84 },
        { from: 1980, to: 1988, ability: 78 }
      ]
    },
    {
      id: "tabara-seiki",
      name: "田原成貴",
      periods: [
        { from: 1978, to: 1992, ability: 80 },
        { from: 1993, to: 1998, ability: 86 }
      ]
    },
    {
      id: "minai-katsumi",
      name: "南井克巳",
      periods: [
        { from: 1979, to: 1990, ability: 80 },
        { from: 1991, to: 1999, ability: 85 }
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
      id: "generic-local",
      name: "默认骑手",
      mainSelectable: false,
      periods: [
        { from: 1980, to: 2035, ability: 70 }
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
    "kazuo-yokoyama": ["japan"],
    "tetsuzo-wada": ["japan"],
    "olivier-peslier": ["europe"],
    "ryan-moore": ["europe"],
    "damian-lane": ["australia"],
    "takeshi-yokoyama": ["japan"],
    "joao-moreira": ["hongkong"],
    "okabe-yukio": ["japan"],
    "shibata-masato": ["japan"],
    "kawachi-hiroshi": ["japan"],
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
    "generic-local": ["local", "japan"]
  };

  ns.Jockeys.forEach((jockey) => {
    jockey.affiliations = affiliationMeta[jockey.id] || ["local"];
    if (jockey.defaultAbility == null) {
      jockey.defaultAbility = Math.max(...jockey.periods.map((period) => period.ability));
    }
  });
})();
