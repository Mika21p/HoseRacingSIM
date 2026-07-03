(function () {
  const ns = (window.Keiba = window.Keiba || {});

  const horses = [
    {
      "id": "camelot",
      "name": "Camelot",
      "displayName": "Camelot",
      "profile": {
        "baseAbility": 84,
        "peakAbility": 86,
        "note": "英爱双德比与二千坚尼冠军，2012年欧洲经典赛代表。"
      },
      "races": [
        {
          "raceId": "two-thousand-guineas",
          "year": 2012,
          "ability": 85,
          "jockeyId": "joseph-obrien",
          "finish": 1
        },
        {
          "raceId": "epsom-derby",
          "year": 2012,
          "ability": 86,
          "jockeyId": "joseph-obrien",
          "finish": 1
        },
        {
          "raceId": "irish-derby",
          "year": 2012,
          "ability": 86,
          "jockeyId": "joseph-obrien",
          "finish": 1
        }
      ]
    },
    {
      "id": "miesque",
      "name": "Miesque",
      "displayName": "Miesque",
      "profile": {
        "baseAbility": 88,
        "peakAbility": 90,
        "note": "历史级雌马一哩王，英一千坚尼、杰克莫华与育马者杯一哩双胜。"
      },
      "races": [
        {
          "raceId": "one-thousand-guineas",
          "year": 1987,
          "ability": 88,
          "jockeyId": "freddy-head",
          "finish": 1
        },
        {
          "raceId": "prix-jacques-le-marois",
          "year": 1987,
          "ability": 89,
          "jockeyId": "freddy-head",
          "finish": 1
        },
        {
          "raceId": "breeders-cup-mile",
          "year": 1987,
          "ability": 90,
          "jockeyId": "freddy-head",
          "finish": 1
        },
        {
          "raceId": "prix-jacques-le-marois",
          "year": 1988,
          "ability": 90,
          "jockeyId": "freddy-head",
          "finish": 1
        },
        {
          "raceId": "breeders-cup-mile",
          "year": 1988,
          "ability": 90,
          "jockeyId": "freddy-head",
          "finish": 1
        }
      ]
    },
    {
      "id": "oh-so-sharp",
      "name": "Oh So Sharp",
      "displayName": "Oh So Sharp",
      "profile": {
        "baseAbility": 87,
        "peakAbility": 89,
        "note": "1985年英国雌马三冠，经典距离适性完整。"
      },
      "races": [
        {
          "raceId": "one-thousand-guineas",
          "year": 1985,
          "ability": 87,
          "jockeyId": "steve-cauthen",
          "finish": 1
        },
        {
          "raceId": "epsom-oaks",
          "year": 1985,
          "ability": 88,
          "jockeyId": "steve-cauthen",
          "finish": 1
        },
        {
          "raceId": "st-leger-stakes",
          "year": 1985,
          "ability": 89,
          "jockeyId": "steve-cauthen",
          "finish": 1
        }
      ]
    },
    {
      "id": "bosra-sham",
      "name": "Bosra Sham",
      "displayName": "Bosra Sham",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "九十年代英国顶级雌马，三岁时夺取一千坚尼。"
      },
      "races": [
        {
          "raceId": "one-thousand-guineas",
          "year": 1996,
          "ability": 84,
          "jockeyId": "pat-eddery",
          "finish": 1
        }
      ]
    },
    {
      "id": "special-duty",
      "name": "Special Duty",
      "displayName": "Special Duty",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2010年经典赛雌马冠军，一千坚尼胜鞍计入当前赛事表。"
      },
      "races": [
        {
          "raceId": "one-thousand-guineas",
          "year": 2010,
          "ability": 83,
          "jockeyId": "stephane-pasquier",
          "finish": 1
        }
      ]
    },
    {
      "id": "love",
      "name": "Love",
      "displayName": "Love",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "2020年欧洲三岁雌马代表，经典赛大胜并延续至古马G1。"
      },
      "races": [
        {
          "raceId": "one-thousand-guineas",
          "year": 2020,
          "ability": 83,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "epsom-oaks",
          "year": 2020,
          "ability": 85,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "prince-of-wales-stakes",
          "year": 2021,
          "ability": 84,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "golden-horn",
      "name": "Golden Horn",
      "displayName": "Golden Horn",
      "profile": {
        "baseAbility": 88,
        "peakAbility": 90,
        "note": "2015年欧洲马王，德比、日蚀、爱尔兰冠军与凯旋门连线。"
      },
      "races": [
        {
          "raceId": "epsom-derby",
          "year": 2015,
          "ability": 87,
          "jockeyId": "frankie-dettori",
          "finish": 1
        },
        {
          "raceId": "eclipse-stakes",
          "year": 2015,
          "ability": 89,
          "jockeyId": "frankie-dettori",
          "finish": 1
        },
        {
          "raceId": "irish-champion-stakes",
          "year": 2015,
          "ability": 89,
          "jockeyId": "frankie-dettori",
          "finish": 1
        },
        {
          "raceId": "prix-de-larc",
          "year": 2015,
          "ability": 90,
          "jockeyId": "frankie-dettori",
          "finish": 1
        }
      ]
    },
    {
      "id": "snowfall",
      "name": "Snowfall",
      "displayName": "Snowfall",
      "profile": {
        "baseAbility": 84,
        "peakAbility": 86,
        "note": "2021年叶森橡树大胜冠军，三岁夏季表现突出。"
      },
      "races": [
        {
          "raceId": "epsom-oaks",
          "year": 2021,
          "ability": 86,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "taghrooda",
      "name": "Taghrooda",
      "displayName": "Taghrooda",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "2014年叶森橡树与英皇锦标冠军，雌马中距离代表。"
      },
      "races": [
        {
          "raceId": "epsom-oaks",
          "year": 2014,
          "ability": 84,
          "jockeyId": "paul-hanagan",
          "finish": 1
        },
        {
          "raceId": "king-george-vi-and-queen-elizabeth-stakes",
          "year": 2014,
          "ability": 85,
          "jockeyId": "paul-hanagan",
          "finish": 1
        }
      ]
    },
    {
      "id": "st-nicholas-abbey",
      "name": "St Nicholas Abbey",
      "displayName": "St Nicholas Abbey",
      "profile": {
        "baseAbility": 85,
        "peakAbility": 87,
        "note": "加冕杯三连霸，并在育马者杯草地与迪拜司马经典赛取胜。"
      },
      "races": [
        {
          "raceId": "coronation-cup",
          "year": 2011,
          "ability": 85,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "breeders-cup-turf",
          "year": 2011,
          "ability": 86,
          "jockeyId": "joseph-obrien",
          "finish": 1
        },
        {
          "raceId": "coronation-cup",
          "year": 2012,
          "ability": 86,
          "jockeyId": "joseph-obrien",
          "finish": 1
        },
        {
          "raceId": "coronation-cup",
          "year": 2013,
          "ability": 87,
          "jockeyId": "joseph-obrien",
          "finish": 1
        },
        {
          "raceId": "dubai-sheema-classic",
          "year": 2013,
          "ability": 87,
          "jockeyId": "joseph-obrien",
          "finish": 1
        }
      ]
    },
    {
      "id": "yeats",
      "name": "Yeats",
      "displayName": "Yeats",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 84,
        "note": "雅士谷金杯四连霸，欧洲长途历史级代表。"
      },
      "races": [
        {
          "raceId": "ascot-gold-cup",
          "year": 2006,
          "ability": 82,
          "jockeyId": "kieren-fallon",
          "finish": 1
        },
        {
          "raceId": "ascot-gold-cup",
          "year": 2007,
          "ability": 83,
          "jockeyId": "mick-kinane",
          "finish": 1
        },
        {
          "raceId": "ascot-gold-cup",
          "year": 2008,
          "ability": 84,
          "jockeyId": "johnny-murtagh",
          "finish": 1
        },
        {
          "raceId": "ascot-gold-cup",
          "year": 2009,
          "ability": 84,
          "jockeyId": "johnny-murtagh",
          "finish": 1
        }
      ]
    },
    {
      "id": "highland-reel",
      "name": "Highland Reel",
      "displayName": "Highland Reel",
      "profile": {
        "baseAbility": 85,
        "peakAbility": 87,
        "note": "全球远征型中长距离G1马，英美港多地取胜。"
      },
      "races": [
        {
          "raceId": "hong-kong-vase",
          "year": 2015,
          "ability": 85,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "king-george-vi-and-queen-elizabeth-stakes",
          "year": 2016,
          "ability": 86,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "breeders-cup-turf",
          "year": 2016,
          "ability": 87,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "coronation-cup",
          "year": 2017,
          "ability": 86,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "prince-of-wales-stakes",
          "year": 2017,
          "ability": 87,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "hong-kong-vase",
          "year": 2017,
          "ability": 86,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "cracksman",
      "name": "Cracksman",
      "displayName": "Cracksman",
      "profile": {
        "baseAbility": 90,
        "peakAbility": 92,
        "note": "Frankel子嗣的欧洲中距离强豪，加冕杯胜鞍计入。"
      },
      "races": [
        {
          "raceId": "coronation-cup",
          "year": 2018,
          "ability": 91,
          "jockeyId": "frankie-dettori",
          "finish": 1
        }
      ]
    },
    {
      "id": "ghaiyyath",
      "name": "Ghaiyyath",
      "displayName": "Ghaiyyath",
      "profile": {
        "baseAbility": 89,
        "peakAbility": 91,
        "note": "2020年欧洲马王，古马中距离连胜压制力突出。"
      },
      "races": [
        {
          "raceId": "grand-prix-de-saint-cloud",
          "year": 2019,
          "ability": 88,
          "jockeyId": "william-buick",
          "finish": 1
        },
        {
          "raceId": "coronation-cup",
          "year": 2020,
          "ability": 90,
          "jockeyId": "william-buick",
          "finish": 1
        },
        {
          "raceId": "eclipse-stakes",
          "year": 2020,
          "ability": 90,
          "jockeyId": "william-buick",
          "finish": 1
        },
        {
          "raceId": "international-stakes",
          "year": 2020,
          "ability": 91,
          "jockeyId": "william-buick",
          "finish": 1
        }
      ]
    },
    {
      "id": "conduit",
      "name": "Conduit",
      "displayName": "Conduit",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "圣烈治、英皇锦标与育马者杯草地双胜的耐力型名马。"
      },
      "races": [
        {
          "raceId": "st-leger-stakes",
          "year": 2008,
          "ability": 83,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "breeders-cup-turf",
          "year": 2008,
          "ability": 84,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "king-george-vi-and-queen-elizabeth-stakes",
          "year": 2009,
          "ability": 85,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "breeders-cup-turf",
          "year": 2009,
          "ability": 85,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "capri",
      "name": "Capri",
      "displayName": "Capri",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "2017年爱尔兰德比与圣烈治冠军，长距离经典赛代表。"
      },
      "races": [
        {
          "raceId": "irish-derby",
          "year": 2017,
          "ability": 83,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "st-leger-stakes",
          "year": 2017,
          "ability": 84,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "kew-gardens",
      "name": "Kew Gardens",
      "displayName": "Kew Gardens",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "2018年圣烈治冠军，长途能力扎实。"
      },
      "races": [
        {
          "raceId": "st-leger-stakes",
          "year": 2018,
          "ability": 84,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "palace-pier",
      "name": "Palace Pier",
      "displayName": "Palace Pier",
      "profile": {
        "baseAbility": 88,
        "peakAbility": 90,
        "note": "2020至2021年欧洲一哩顶级马，杰克莫华双胜。"
      },
      "races": [
        {
          "raceId": "st-jamess-palace-stakes",
          "year": 2020,
          "ability": 89,
          "jockeyId": "frankie-dettori",
          "finish": 1
        },
        {
          "raceId": "prix-jacques-le-marois",
          "year": 2020,
          "ability": 90,
          "jockeyId": "frankie-dettori",
          "finish": 1
        },
        {
          "raceId": "lockinge-stakes",
          "year": 2021,
          "ability": 90,
          "jockeyId": "frankie-dettori",
          "finish": 1
        },
        {
          "raceId": "queen-anne-stakes",
          "year": 2021,
          "ability": 90,
          "jockeyId": "frankie-dettori",
          "finish": 1
        },
        {
          "raceId": "prix-jacques-le-marois",
          "year": 2021,
          "ability": 90,
          "jockeyId": "frankie-dettori",
          "finish": 1
        }
      ]
    },
    {
      "id": "canford-cliffs",
      "name": "Canford Cliffs",
      "displayName": "Canford Cliffs",
      "profile": {
        "baseAbility": 85,
        "peakAbility": 87,
        "note": "欧洲一哩G1多胜马，三四岁持续高水平。"
      },
      "races": [
        {
          "raceId": "st-jamess-palace-stakes",
          "year": 2010,
          "ability": 85,
          "jockeyId": "richard-hughes",
          "finish": 1
        },
        {
          "raceId": "sussex-stakes",
          "year": 2010,
          "ability": 86,
          "jockeyId": "richard-hughes",
          "finish": 1
        },
        {
          "raceId": "lockinge-stakes",
          "year": 2011,
          "ability": 87,
          "jockeyId": "richard-hughes",
          "finish": 1
        },
        {
          "raceId": "queen-anne-stakes",
          "year": 2011,
          "ability": 87,
          "jockeyId": "richard-hughes",
          "finish": 1
        }
      ]
    },
    {
      "id": "night-of-thunder",
      "name": "Night of Thunder",
      "displayName": "Night of Thunder",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "二千坚尼与洛金锦标冠军，一哩线稳定上位。"
      },
      "races": [
        {
          "raceId": "two-thousand-guineas",
          "year": 2014,
          "ability": 84,
          "jockeyId": "kieren-fallon",
          "finish": 1
        },
        {
          "raceId": "lockinge-stakes",
          "year": 2015,
          "ability": 84,
          "jockeyId": "james-doyle",
          "finish": 1
        }
      ]
    },
    {
      "id": "dubai-millennium",
      "name": "Dubai Millennium",
      "displayName": "Dubai Millennium",
      "profile": {
        "baseAbility": 96,
        "peakAbility": 98,
        "note": "迪拜世界杯与威尔士亲王锦标冠军，短暂生涯展示历史级统治力。"
      },
      "races": [
        {
          "raceId": "dubai-world-cup",
          "year": 2000,
          "ability": 98,
          "jockeyId": "frankie-dettori",
          "finish": 1
        },
        {
          "raceId": "prince-of-wales-stakes",
          "year": 2000,
          "ability": 98,
          "jockeyId": "frankie-dettori",
          "finish": 1
        }
      ]
    },
    {
      "id": "so-you-think",
      "name": "So You Think",
      "displayName": "So You Think",
      "profile": {
        "baseAbility": 89,
        "peakAbility": 91,
        "note": "澳欧双线G1名马，觉士盾连霸后转战欧洲中距离。"
      },
      "races": [
        {
          "raceId": "cox-plate",
          "year": 2009,
          "ability": 90,
          "jockeyId": "glen-boss",
          "finish": 1
        },
        {
          "raceId": "cox-plate",
          "year": 2010,
          "ability": 91,
          "jockeyId": "steven-arnold",
          "finish": 1
        },
        {
          "raceId": "eclipse-stakes",
          "year": 2011,
          "ability": 90,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "prince-of-wales-stakes",
          "year": 2012,
          "ability": 90,
          "jockeyId": "joseph-obrien",
          "finish": 1
        }
      ]
    },
    {
      "id": "ribchester",
      "name": "Ribchester",
      "displayName": "Ribchester",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "Godolphin一哩G1冠军，洛金与女王安妮胜出。"
      },
      "races": [
        {
          "raceId": "prix-jacques-le-marois",
          "year": 2016,
          "ability": 84,
          "jockeyId": "william-buick",
          "finish": 1
        },
        {
          "raceId": "lockinge-stakes",
          "year": 2017,
          "ability": 85,
          "jockeyId": "william-buick",
          "finish": 1
        },
        {
          "raceId": "queen-anne-stakes",
          "year": 2017,
          "ability": 85,
          "jockeyId": "william-buick",
          "finish": 1
        }
      ]
    },
    {
      "id": "kingman",
      "name": "Kingman",
      "displayName": "Kingman",
      "profile": {
        "baseAbility": 90,
        "peakAbility": 92,
        "note": "2014年欧洲一哩明星，圣詹姆斯皇宫、萨塞克斯与杰克莫华连胜。"
      },
      "races": [
        {
          "raceId": "st-jamess-palace-stakes",
          "year": 2014,
          "ability": 91,
          "jockeyId": "james-doyle",
          "finish": 1
        },
        {
          "raceId": "sussex-stakes",
          "year": 2014,
          "ability": 92,
          "jockeyId": "james-doyle",
          "finish": 1
        },
        {
          "raceId": "prix-jacques-le-marois",
          "year": 2014,
          "ability": 92,
          "jockeyId": "james-doyle",
          "finish": 1
        }
      ]
    },
    {
      "id": "rock-of-gibraltar",
      "name": "Rock of Gibraltar",
      "displayName": "Rock of Gibraltar",
      "profile": {
        "baseAbility": 89,
        "peakAbility": 91,
        "note": "欧洲一哩经典强豪，二千坚尼、圣詹姆斯皇宫与萨塞克斯胜出。"
      },
      "races": [
        {
          "raceId": "two-thousand-guineas",
          "year": 2002,
          "ability": 90,
          "jockeyId": "mick-kinane",
          "finish": 1
        },
        {
          "raceId": "st-jamess-palace-stakes",
          "year": 2002,
          "ability": 91,
          "jockeyId": "mick-kinane",
          "finish": 1
        },
        {
          "raceId": "sussex-stakes",
          "year": 2002,
          "ability": 91,
          "jockeyId": "mick-kinane",
          "finish": 1
        }
      ]
    },
    {
      "id": "giants-causeway",
      "name": "Giant's Causeway",
      "displayName": "Giant's Causeway",
      "profile": {
        "baseAbility": 90,
        "peakAbility": 92,
        "note": "铁马型欧洲中距离巨星，2000年夏秋多场G1连胜。"
      },
      "races": [
        {
          "raceId": "st-jamess-palace-stakes",
          "year": 2000,
          "ability": 89,
          "jockeyId": "george-duffield",
          "finish": 1
        },
        {
          "raceId": "eclipse-stakes",
          "year": 2000,
          "ability": 91,
          "jockeyId": "george-duffield",
          "finish": 1
        },
        {
          "raceId": "sussex-stakes",
          "year": 2000,
          "ability": 91,
          "jockeyId": "george-duffield",
          "finish": 1
        },
        {
          "raceId": "international-stakes",
          "year": 2000,
          "ability": 92,
          "jockeyId": "george-duffield",
          "finish": 1
        },
        {
          "raceId": "irish-champion-stakes",
          "year": 2000,
          "ability": 92,
          "jockeyId": "george-duffield",
          "finish": 1
        }
      ]
    },
    {
      "id": "stradivarius",
      "name": "Stradivarius",
      "displayName": "Stradivarius",
      "profile": {
        "baseAbility": 86,
        "peakAbility": 89,
        "note": "现代欧洲长途代表，雅士谷金杯三连霸。"
      },
      "races": [
        {
          "raceId": "ascot-gold-cup",
          "year": 2018,
          "ability": 88,
          "jockeyId": "frankie-dettori",
          "finish": 1
        },
        {
          "raceId": "ascot-gold-cup",
          "year": 2019,
          "ability": 89,
          "jockeyId": "frankie-dettori",
          "finish": 1
        },
        {
          "raceId": "ascot-gold-cup",
          "year": 2020,
          "ability": 89,
          "jockeyId": "frankie-dettori",
          "finish": 1
        }
      ]
    },
    {
      "id": "kyprios",
      "name": "Kyprios",
      "displayName": "Kyprios",
      "profile": {
        "baseAbility": 86,
        "peakAbility": 88,
        "note": "近年欧洲长途顶级马，雅士谷金杯多胜。"
      },
      "races": [
        {
          "raceId": "ascot-gold-cup",
          "year": 2022,
          "ability": 88,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "ascot-gold-cup",
          "year": 2024,
          "ability": 88,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "estimate",
      "name": "Estimate",
      "displayName": "Estimate",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2013年雅士谷金杯冠军雌马，长途代表胜鞍明确。"
      },
      "races": [
        {
          "raceId": "ascot-gold-cup",
          "year": 2013,
          "ability": 83,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "fame-and-glory",
      "name": "Fame And Glory",
      "displayName": "Fame And Glory",
      "profile": {
        "baseAbility": 84,
        "peakAbility": 86,
        "note": "由中长距离转向长途仍能夺G1，加冕杯与雅士谷金杯胜出。"
      },
      "races": [
        {
          "raceId": "coronation-cup",
          "year": 2010,
          "ability": 85,
          "jockeyId": "johnny-murtagh",
          "finish": 1
        },
        {
          "raceId": "ascot-gold-cup",
          "year": 2011,
          "ability": 86,
          "jockeyId": "jamie-spencer",
          "finish": 1
        }
      ]
    },
    {
      "id": "alpha-centauri",
      "name": "Alpha Centauri",
      "displayName": "Alpha Centauri",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "2018年欧洲三岁雌马一哩明星，加冕锦标与杰克莫华胜出。"
      },
      "races": [
        {
          "raceId": "coronation-stakes",
          "year": 2018,
          "ability": 85,
          "jockeyId": "colm-odonoghue",
          "finish": 1
        },
        {
          "raceId": "prix-jacques-le-marois",
          "year": 2018,
          "ability": 85,
          "jockeyId": "colm-odonoghue",
          "finish": 1
        }
      ]
    },
    {
      "id": "winter",
      "name": "Winter",
      "displayName": "Winter",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "2017年欧洲雌马一哩代表，一千坚尼与加冕锦标冠军。"
      },
      "races": [
        {
          "raceId": "one-thousand-guineas",
          "year": 2017,
          "ability": 84,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "coronation-stakes",
          "year": 2017,
          "ability": 85,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "tahiyra",
      "name": "Tahiyra",
      "displayName": "Tahiyra",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "2023年加冕锦标冠军，三岁雌马一哩线强者。"
      },
      "races": [
        {
          "raceId": "coronation-stakes",
          "year": 2023,
          "ability": 84,
          "jockeyId": "chris-hayes",
          "finish": 1
        }
      ]
    },
    {
      "id": "russian-rhythm",
      "name": "Russian Rhythm",
      "displayName": "Russian Rhythm",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "一千坚尼、加冕锦标与洛金锦标冠军，雌马一哩表现稳定。"
      },
      "races": [
        {
          "raceId": "one-thousand-guineas",
          "year": 2003,
          "ability": 84,
          "jockeyId": "kieren-fallon",
          "finish": 1
        },
        {
          "raceId": "coronation-stakes",
          "year": 2003,
          "ability": 85,
          "jockeyId": "kieren-fallon",
          "finish": 1
        },
        {
          "raceId": "lockinge-stakes",
          "year": 2004,
          "ability": 85,
          "jockeyId": "kieren-fallon",
          "finish": 1
        }
      ]
    },
    {
      "id": "paddington",
      "name": "Paddington",
      "displayName": "Paddington",
      "profile": {
        "baseAbility": 84,
        "peakAbility": 86,
        "note": "2023年夏季欧洲一哩至中距离连胜马。"
      },
      "races": [
        {
          "raceId": "st-jamess-palace-stakes",
          "year": 2023,
          "ability": 85,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "eclipse-stakes",
          "year": 2023,
          "ability": 86,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "sussex-stakes",
          "year": 2023,
          "ability": 86,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "solow",
      "name": "Solow",
      "displayName": "Solow",
      "profile": {
        "baseAbility": 85,
        "peakAbility": 87,
        "note": "2015年欧洲一哩与迪拜草地赛冠军，连胜期压制力强。"
      },
      "races": [
        {
          "raceId": "dubai-turf",
          "year": 2015,
          "ability": 86,
          "jockeyId": "maxime-guyon",
          "finish": 1
        },
        {
          "raceId": "queen-anne-stakes",
          "year": 2015,
          "ability": 87,
          "jockeyId": "maxime-guyon",
          "finish": 1
        },
        {
          "raceId": "sussex-stakes",
          "year": 2015,
          "ability": 87,
          "jockeyId": "maxime-guyon",
          "finish": 1
        }
      ]
    },
    {
      "id": "too-darn-hot",
      "name": "Too Darn Hot",
      "displayName": "Too Darn Hot",
      "profile": {
        "baseAbility": 85,
        "peakAbility": 87,
        "note": "2019年萨塞克斯锦标冠军，三岁一哩能力突出。"
      },
      "races": [
        {
          "raceId": "sussex-stakes",
          "year": 2019,
          "ability": 87,
          "jockeyId": "frankie-dettori",
          "finish": 1
        }
      ]
    },
    {
      "id": "hurricane-lane",
      "name": "Hurricane Lane",
      "displayName": "Hurricane Lane",
      "profile": {
        "baseAbility": 84,
        "peakAbility": 86,
        "note": "2021年爱尔兰德比与圣烈治冠军，三岁长距离能力强。"
      },
      "races": [
        {
          "raceId": "irish-derby",
          "year": 2021,
          "ability": 85,
          "jockeyId": "william-buick",
          "finish": 1
        },
        {
          "raceId": "st-leger-stakes",
          "year": 2021,
          "ability": 86,
          "jockeyId": "william-buick",
          "finish": 1
        }
      ]
    },
    {
      "id": "auguste-rodin",
      "name": "Auguste Rodin",
      "displayName": "Auguste Rodin",
      "profile": {
        "baseAbility": 86,
        "peakAbility": 88,
        "note": "德比、爱尔兰冠军、育马者杯草地与威尔士亲王锦标冠军。"
      },
      "races": [
        {
          "raceId": "epsom-derby",
          "year": 2023,
          "ability": 87,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "irish-derby",
          "year": 2023,
          "ability": 87,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "irish-champion-stakes",
          "year": 2023,
          "ability": 88,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "breeders-cup-turf",
          "year": 2023,
          "ability": 88,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "prince-of-wales-stakes",
          "year": 2024,
          "ability": 88,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "magical",
      "name": "Magical",
      "displayName": "Magical",
      "profile": {
        "baseAbility": 84,
        "peakAbility": 86,
        "note": "稳定耐战的欧洲中距离雌马，爱尔兰冠军锦标连胜。"
      },
      "races": [
        {
          "raceId": "irish-champion-stakes",
          "year": 2019,
          "ability": 85,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "irish-champion-stakes",
          "year": 2020,
          "ability": 86,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "luxembourg",
      "name": "Luxembourg",
      "displayName": "Luxembourg",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "爱尔兰冠军锦标与加冕杯冠军，古马期维持G1水准。"
      },
      "races": [
        {
          "raceId": "irish-champion-stakes",
          "year": 2022,
          "ability": 85,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "coronation-cup",
          "year": 2024,
          "ability": 84,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "dylan-thomas",
      "name": "Dylan Thomas",
      "displayName": "Dylan Thomas",
      "profile": {
        "baseAbility": 85,
        "peakAbility": 87,
        "note": "爱尔兰冠军、英皇锦标与凯旋门冠军，欧洲中长距离名马。"
      },
      "races": [
        {
          "raceId": "irish-derby",
          "year": 2006,
          "ability": 85,
          "jockeyId": "kieren-fallon",
          "finish": 1
        },
        {
          "raceId": "irish-champion-stakes",
          "year": 2006,
          "ability": 86,
          "jockeyId": "kieren-fallon",
          "finish": 1
        },
        {
          "raceId": "king-george-vi-and-queen-elizabeth-stakes",
          "year": 2007,
          "ability": 87,
          "jockeyId": "johnny-murtagh",
          "finish": 1
        },
        {
          "raceId": "irish-champion-stakes",
          "year": 2007,
          "ability": 87,
          "jockeyId": "johnny-murtagh",
          "finish": 1
        },
        {
          "raceId": "prix-de-larc",
          "year": 2007,
          "ability": 87,
          "jockeyId": "johnny-murtagh",
          "finish": 1
        }
      ]
    },
    {
      "id": "shamardal",
      "name": "Shamardal",
      "displayName": "Shamardal",
      "profile": {
        "baseAbility": 85,
        "peakAbility": 87,
        "note": "法国德比与圣詹姆斯皇宫锦标冠军，三岁上半年表现强势。"
      },
      "races": [
        {
          "raceId": "prix-du-jockey-club",
          "year": 2005,
          "ability": 87,
          "jockeyId": "christophe-soumillon",
          "finish": 1
        },
        {
          "raceId": "st-jamess-palace-stakes",
          "year": 2005,
          "ability": 87,
          "jockeyId": "frankie-dettori",
          "finish": 1
        }
      ]
    },
    {
      "id": "lope-de-vega",
      "name": "Lope de Vega",
      "displayName": "Lope de Vega",
      "profile": {
        "baseAbility": 84,
        "peakAbility": 86,
        "note": "2010年法国德比冠军，法国经典赛代表。"
      },
      "races": [
        {
          "raceId": "prix-du-jockey-club",
          "year": 2010,
          "ability": 86,
          "jockeyId": "maxime-guyon",
          "finish": 1
        }
      ]
    },
    {
      "id": "st-marks-basilica",
      "name": "St Mark's Basilica",
      "displayName": "St Mark's Basilica",
      "profile": {
        "baseAbility": 88,
        "peakAbility": 90,
        "note": "2021年欧洲三岁中距离核心，法国德比、日蚀与爱尔兰冠军连胜。"
      },
      "races": [
        {
          "raceId": "prix-du-jockey-club",
          "year": 2021,
          "ability": 89,
          "jockeyId": "ioritz-mendizabal",
          "finish": 1
        },
        {
          "raceId": "eclipse-stakes",
          "year": 2021,
          "ability": 90,
          "jockeyId": "ryan-moore",
          "finish": 1
        },
        {
          "raceId": "irish-champion-stakes",
          "year": 2021,
          "ability": 90,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "ace-impact",
      "name": "Ace Impact",
      "displayName": "Ace Impact",
      "profile": {
        "baseAbility": 87,
        "peakAbility": 89,
        "note": "2023年法国德比与凯旋门冠军，不败退役。"
      },
      "races": [
        {
          "raceId": "prix-du-jockey-club",
          "year": 2023,
          "ability": 88,
          "jockeyId": "cristian-demuro",
          "finish": 1
        },
        {
          "raceId": "prix-de-larc",
          "year": 2023,
          "ability": 89,
          "jockeyId": "cristian-demuro",
          "finish": 1
        }
      ]
    },
    {
      "id": "divine-proportions",
      "name": "Divine Proportions",
      "displayName": "Divine Proportions",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "法国经典赛雌马名将，法国橡树冠军。"
      },
      "races": [
        {
          "raceId": "prix-de-diane",
          "year": 2005,
          "ability": 85,
          "jockeyId": "christophe-soumillon",
          "finish": 1
        }
      ]
    },
    {
      "id": "fancy-blue",
      "name": "Fancy Blue",
      "displayName": "Fancy Blue",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2020年法国橡树冠军，当前赛事表收录其核心G1胜鞍。"
      },
      "races": [
        {
          "raceId": "prix-de-diane",
          "year": 2020,
          "ability": 83,
          "jockeyId": "pierre-charles-boudot",
          "finish": 1
        }
      ]
    },
    {
      "id": "blue-rose-cen",
      "name": "Blue Rose Cen",
      "displayName": "Blue Rose Cen",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "2023年法国橡树冠军，三岁雌马路线代表。"
      },
      "races": [
        {
          "raceId": "prix-de-diane",
          "year": 2023,
          "ability": 84,
          "jockeyId": "aurelien-lemaitre",
          "finish": 1
        }
      ]
    },
    {
      "id": "danedream",
      "name": "Danedream",
      "displayName": "Danedream",
      "profile": {
        "baseAbility": 84,
        "peakAbility": 86,
        "note": "德国名雌马，凯旋门与英皇锦标冠军。"
      },
      "races": [
        {
          "raceId": "prix-de-larc",
          "year": 2011,
          "ability": 86,
          "jockeyId": "andrasch-starke",
          "finish": 1
        },
        {
          "raceId": "king-george-vi-and-queen-elizabeth-stakes",
          "year": 2012,
          "ability": 86,
          "jockeyId": "andrasch-starke",
          "finish": 1
        }
      ]
    },
    {
      "id": "tarnawa",
      "name": "Tarnawa",
      "displayName": "Tarnawa",
      "profile": {
        "baseAbility": 84,
        "peakAbility": 86,
        "note": "红宝锦标与育马者杯草地冠军，古马雌马中距离代表。"
      },
      "races": [
        {
          "raceId": "prix-vermeille",
          "year": 2020,
          "ability": 85,
          "jockeyId": "christophe-soumillon",
          "finish": 1
        },
        {
          "raceId": "breeders-cup-turf",
          "year": 2020,
          "ability": 86,
          "jockeyId": "colin-keane",
          "finish": 1
        }
      ]
    },
    {
      "id": "bluestocking",
      "name": "Bluestocking",
      "displayName": "Bluestocking",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "2024年红宝锦标与凯旋门冠军，晚成中距离雌马。"
      },
      "races": [
        {
          "raceId": "prix-vermeille",
          "year": 2024,
          "ability": 84,
          "jockeyId": "rossa-ryan",
          "finish": 1
        },
        {
          "raceId": "prix-de-larc",
          "year": 2024,
          "ability": 85,
          "jockeyId": "rossa-ryan",
          "finish": 1
        }
      ]
    },
    {
      "id": "harbinger",
      "name": "Harbinger",
      "displayName": "Harbinger",
      "profile": {
        "baseAbility": 93,
        "peakAbility": 95,
        "note": "2010年英皇锦标大胜，单场峰值极高。"
      },
      "races": [
        {
          "raceId": "king-george-vi-and-queen-elizabeth-stakes",
          "year": 2010,
          "ability": 95,
          "jockeyId": "olivier-peslier",
          "finish": 1
        }
      ]
    },
    {
      "id": "alpinista",
      "name": "Alpinista",
      "displayName": "Alpinista",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "2022年圣格卢大赛与凯旋门冠军，连胜期稳定。"
      },
      "races": [
        {
          "raceId": "grand-prix-de-saint-cloud",
          "year": 2022,
          "ability": 84,
          "jockeyId": "luke-morris",
          "finish": 1
        },
        {
          "raceId": "prix-de-larc",
          "year": 2022,
          "ability": 85,
          "jockeyId": "luke-morris",
          "finish": 1
        }
      ]
    },
    {
      "id": "roaring-lion",
      "name": "Roaring Lion",
      "displayName": "Roaring Lion",
      "profile": {
        "baseAbility": 88,
        "peakAbility": 90,
        "note": "2018年欧洲中距离明星，国际锦标与爱尔兰冠军锦标冠军。"
      },
      "races": [
        {
          "raceId": "international-stakes",
          "year": 2018,
          "ability": 89,
          "jockeyId": "oisin-murphy",
          "finish": 1
        },
        {
          "raceId": "irish-champion-stakes",
          "year": 2018,
          "ability": 90,
          "jockeyId": "oisin-murphy",
          "finish": 1
        }
      ]
    },
    {
      "id": "nature-strip",
      "name": "Nature Strip",
      "displayName": "Nature Strip",
      "profile": {
        "baseAbility": 87,
        "peakAbility": 89,
        "note": "澳洲短途冠军，皇家雅士谷胜出后确立国际短途地位。"
      },
      "races": [
        {
          "raceId": "tj-smith-stakes",
          "year": 2020,
          "ability": 87,
          "jockeyId": "james-mcdonald",
          "finish": 1
        },
        {
          "raceId": "tj-smith-stakes",
          "year": 2021,
          "ability": 88,
          "jockeyId": "james-mcdonald",
          "finish": 1
        },
        {
          "raceId": "the-everest",
          "year": 2021,
          "ability": 89,
          "jockeyId": "james-mcdonald",
          "finish": 1
        },
        {
          "raceId": "tj-smith-stakes",
          "year": 2022,
          "ability": 89,
          "jockeyId": "james-mcdonald",
          "finish": 1
        },
        {
          "raceId": "king-charles-iii-stakes",
          "year": 2022,
          "ability": 89,
          "jockeyId": "james-mcdonald",
          "finish": 1
        }
      ]
    },
    {
      "id": "blue-point",
      "name": "Blue Point",
      "displayName": "Blue Point",
      "profile": {
        "baseAbility": 86,
        "peakAbility": 88,
        "note": "短途G1多胜马，皇家雅士谷同届双胜并夺阿乔斯短途。"
      },
      "races": [
        {
          "raceId": "king-charles-iii-stakes",
          "year": 2018,
          "ability": 87,
          "jockeyId": "william-buick",
          "finish": 1
        },
        {
          "raceId": "al-quoz-sprint",
          "year": 2019,
          "ability": 88,
          "jockeyId": "william-buick",
          "finish": 1
        },
        {
          "raceId": "king-charles-iii-stakes",
          "year": 2019,
          "ability": 88,
          "jockeyId": "james-doyle",
          "finish": 1
        },
        {
          "raceId": "queen-elizabeth-ii-jubilee-stakes",
          "year": 2019,
          "ability": 88,
          "jockeyId": "james-doyle",
          "finish": 1
        }
      ]
    },
    {
      "id": "lady-aurelia",
      "name": "Lady Aurelia",
      "displayName": "Lady Aurelia",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "美国训练的欧洲短途G1雌马，皇家雅士谷速度突出。"
      },
      "races": [
        {
          "raceId": "king-charles-iii-stakes",
          "year": 2017,
          "ability": 84,
          "jockeyId": "john-velazquez",
          "finish": 1
        }
      ]
    },
    {
      "id": "sole-power",
      "name": "Sole Power",
      "displayName": "Sole Power",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "五化郎短途专家，英法1000米线G1多胜。"
      },
      "races": [
        {
          "raceId": "nunthorpe-stakes",
          "year": 2010,
          "ability": 84,
          "jockeyId": "wayne-lordan",
          "finish": 1
        },
        {
          "raceId": "king-charles-iii-stakes",
          "year": 2013,
          "ability": 84,
          "jockeyId": "johnny-murtagh",
          "finish": 1
        },
        {
          "raceId": "king-charles-iii-stakes",
          "year": 2014,
          "ability": 85,
          "jockeyId": "richard-hughes",
          "finish": 1
        },
        {
          "raceId": "nunthorpe-stakes",
          "year": 2014,
          "ability": 85,
          "jockeyId": "richard-hughes",
          "finish": 1
        }
      ]
    },
    {
      "id": "takeover-target",
      "name": "Takeover Target",
      "displayName": "Takeover Target",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "澳洲短途远征马，皇家雅士谷短途G1冠军。"
      },
      "races": [
        {
          "raceId": "king-charles-iii-stakes",
          "year": 2006,
          "ability": 83,
          "jockeyId": "jay-ford",
          "finish": 1
        }
      ]
    },
    {
      "id": "black-caviar",
      "name": "Black Caviar",
      "displayName": "Black Caviar",
      "profile": {
        "baseAbility": 93,
        "peakAbility": 95,
        "note": "25战全胜的历史级澳洲短途女王，国际短途评分顶点之一。"
      },
      "races": [
        {
          "raceId": "tj-smith-stakes",
          "year": 2011,
          "ability": 93,
          "jockeyId": "luke-nolen",
          "finish": 1
        },
        {
          "raceId": "black-caviar-lightning",
          "year": 2011,
          "ability": 93,
          "jockeyId": "luke-nolen",
          "finish": 1
        },
        {
          "raceId": "newmarket-handicap",
          "year": 2011,
          "ability": 94,
          "jockeyId": "luke-nolen",
          "finish": 1
        },
        {
          "raceId": "william-reid-stakes",
          "year": 2011,
          "ability": 94,
          "jockeyId": "luke-nolen",
          "finish": 1
        },
        {
          "raceId": "black-caviar-lightning",
          "year": 2012,
          "ability": 95,
          "jockeyId": "luke-nolen",
          "finish": 1
        },
        {
          "raceId": "queen-elizabeth-ii-jubilee-stakes",
          "year": 2012,
          "ability": 95,
          "jockeyId": "luke-nolen",
          "finish": 1
        },
        {
          "raceId": "black-caviar-lightning",
          "year": 2013,
          "ability": 95,
          "jockeyId": "luke-nolen",
          "finish": 1
        },
        {
          "raceId": "william-reid-stakes",
          "year": 2013,
          "ability": 95,
          "jockeyId": "luke-nolen",
          "finish": 1
        },
        {
          "raceId": "tj-smith-stakes",
          "year": 2013,
          "ability": 95,
          "jockeyId": "luke-nolen",
          "finish": 1
        }
      ]
    },
    {
      "id": "dream-of-dreams",
      "name": "Dream of Dreams",
      "displayName": "Dream of Dreams",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2021年女王伊丽莎白二世禧年锦标冠军。"
      },
      "races": [
        {
          "raceId": "queen-elizabeth-ii-jubilee-stakes",
          "year": 2021,
          "ability": 83,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "khaadem",
      "name": "Khaadem",
      "displayName": "Khaadem",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "皇家雅士谷短途老将，禧年锦标两度取胜。"
      },
      "races": [
        {
          "raceId": "queen-elizabeth-ii-jubilee-stakes",
          "year": 2023,
          "ability": 83,
          "jockeyId": "jamie-spencer",
          "finish": 1
        },
        {
          "raceId": "queen-elizabeth-ii-jubilee-stakes",
          "year": 2024,
          "ability": 84,
          "jockeyId": "oisin-murphy",
          "finish": 1
        }
      ]
    },
    {
      "id": "naval-crown",
      "name": "Naval Crown",
      "displayName": "Naval Crown",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2022年女王伊丽莎白二世禧年锦标冠军。"
      },
      "races": [
        {
          "raceId": "queen-elizabeth-ii-jubilee-stakes",
          "year": 2022,
          "ability": 83,
          "jockeyId": "james-doyle",
          "finish": 1
        }
      ]
    },
    {
      "id": "muhaarar",
      "name": "Muhaarar",
      "displayName": "Muhaarar",
      "profile": {
        "baseAbility": 86,
        "peakAbility": 88,
        "note": "2015年欧洲冠军短途马，英联邦杯、七月杯与冠军短途锦标连胜。"
      },
      "races": [
        {
          "raceId": "commonwealth-cup",
          "year": 2015,
          "ability": 87,
          "jockeyId": "paul-hanagan",
          "finish": 1
        },
        {
          "raceId": "july-cup",
          "year": 2015,
          "ability": 88,
          "jockeyId": "paul-hanagan",
          "finish": 1
        },
        {
          "raceId": "british-champions-sprint-stakes",
          "year": 2015,
          "ability": 88,
          "jockeyId": "paul-hanagan",
          "finish": 1
        }
      ]
    },
    {
      "id": "caravaggio",
      "name": "Caravaggio",
      "displayName": "Caravaggio",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "2017年英联邦杯冠军，三岁短途天赋突出。"
      },
      "races": [
        {
          "raceId": "commonwealth-cup",
          "year": 2017,
          "ability": 84,
          "jockeyId": "ryan-moore",
          "finish": 1
        }
      ]
    },
    {
      "id": "advertise",
      "name": "Advertise",
      "displayName": "Advertise",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2019年英联邦杯冠军，三岁短途G1代表。"
      },
      "races": [
        {
          "raceId": "commonwealth-cup",
          "year": 2019,
          "ability": 83,
          "jockeyId": "frankie-dettori",
          "finish": 1
        }
      ]
    },
    {
      "id": "campanelle",
      "name": "Campanelle",
      "displayName": "Campanelle",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "美国训练的皇家雅士谷短途雌马，英联邦杯胜鞍计入。"
      },
      "races": [
        {
          "raceId": "commonwealth-cup",
          "year": 2021,
          "ability": 83,
          "jockeyId": "frankie-dettori",
          "finish": 1
        }
      ]
    },
    {
      "id": "shaquille",
      "name": "Shaquille",
      "displayName": "Shaquille",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "2023年三岁短途双G1冠军，英联邦杯与七月杯胜出。"
      },
      "races": [
        {
          "raceId": "commonwealth-cup",
          "year": 2023,
          "ability": 83,
          "jockeyId": "rossa-ryan",
          "finish": 1
        },
        {
          "raceId": "july-cup",
          "year": 2023,
          "ability": 84,
          "jockeyId": "oisin-murphy",
          "finish": 1
        }
      ]
    },
    {
      "id": "stravinsky",
      "name": "Stravinsky",
      "displayName": "Stravinsky",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "1999年欧洲顶级短途三岁马，七月杯与南索普锦标冠军。"
      },
      "races": [
        {
          "raceId": "july-cup",
          "year": 1999,
          "ability": 85,
          "jockeyId": "mick-kinane",
          "finish": 1
        },
        {
          "raceId": "nunthorpe-stakes",
          "year": 1999,
          "ability": 85,
          "jockeyId": "mick-kinane",
          "finish": 1
        }
      ]
    },
    {
      "id": "oasis-dream",
      "name": "Oasis Dream",
      "displayName": "Oasis Dream",
      "profile": {
        "baseAbility": 86,
        "peakAbility": 88,
        "note": "2003年七月杯与南索普锦标冠军，短途速度出众。"
      },
      "races": [
        {
          "raceId": "july-cup",
          "year": 2003,
          "ability": 88,
          "jockeyId": "richard-hughes",
          "finish": 1
        },
        {
          "raceId": "nunthorpe-stakes",
          "year": 2003,
          "ability": 88,
          "jockeyId": "richard-hughes",
          "finish": 1
        }
      ]
    },
    {
      "id": "dream-ahead",
      "name": "Dream Ahead",
      "displayName": "Dream Ahead",
      "profile": {
        "baseAbility": 86,
        "peakAbility": 88,
        "note": "2011年七月杯与海多克短途杯冠军，短途爆发力强。"
      },
      "races": [
        {
          "raceId": "july-cup",
          "year": 2011,
          "ability": 88,
          "jockeyId": "william-buick",
          "finish": 1
        },
        {
          "raceId": "haydock-sprint-cup",
          "year": 2011,
          "ability": 88,
          "jockeyId": "william-buick",
          "finish": 1
        }
      ]
    },
    {
      "id": "harry-angel",
      "name": "Harry Angel",
      "displayName": "Harry Angel",
      "profile": {
        "baseAbility": 85,
        "peakAbility": 87,
        "note": "2017年七月杯与海多克短途杯冠军，短途速度上限高。"
      },
      "races": [
        {
          "raceId": "july-cup",
          "year": 2017,
          "ability": 87,
          "jockeyId": "adam-kirby",
          "finish": 1
        },
        {
          "raceId": "haydock-sprint-cup",
          "year": 2017,
          "ability": 87,
          "jockeyId": "adam-kirby",
          "finish": 1
        }
      ]
    },
    {
      "id": "oxted",
      "name": "Oxted",
      "displayName": "Oxted",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "七月杯与皇家雅士谷短途冠军，成熟期短途表现稳定。"
      },
      "races": [
        {
          "raceId": "july-cup",
          "year": 2020,
          "ability": 83,
          "jockeyId": "cieren-fallon",
          "finish": 1
        },
        {
          "raceId": "king-charles-iii-stakes",
          "year": 2021,
          "ability": 83,
          "jockeyId": "cieren-fallon",
          "finish": 1
        }
      ]
    },
    {
      "id": "battaash",
      "name": "Battaash",
      "displayName": "Battaash",
      "profile": {
        "baseAbility": 88,
        "peakAbility": 90,
        "note": "欧洲1000米短途王，南索普、阿贝耶与皇家雅士谷短途多胜。"
      },
      "races": [
        {
          "raceId": "prix-de-labbaye",
          "year": 2017,
          "ability": 87,
          "jockeyId": "jim-crowley",
          "finish": 1
        },
        {
          "raceId": "nunthorpe-stakes",
          "year": 2019,
          "ability": 88,
          "jockeyId": "jim-crowley",
          "finish": 1
        },
        {
          "raceId": "king-charles-iii-stakes",
          "year": 2020,
          "ability": 90,
          "jockeyId": "jim-crowley",
          "finish": 1
        },
        {
          "raceId": "nunthorpe-stakes",
          "year": 2020,
          "ability": 90,
          "jockeyId": "jim-crowley",
          "finish": 1
        }
      ]
    },
    {
      "id": "highfield-princess",
      "name": "Highfield Princess",
      "displayName": "Highfield Princess",
      "profile": {
        "baseAbility": 83,
        "peakAbility": 85,
        "note": "2022年短途爆发，南索普与阿贝耶大奖赛冠军。"
      },
      "races": [
        {
          "raceId": "nunthorpe-stakes",
          "year": 2022,
          "ability": 85,
          "jockeyId": "jason-hart",
          "finish": 1
        },
        {
          "raceId": "prix-de-labbaye",
          "year": 2022,
          "ability": 85,
          "jockeyId": "jason-hart",
          "finish": 1
        }
      ]
    },
    {
      "id": "dayjur",
      "name": "Dayjur",
      "displayName": "Dayjur",
      "profile": {
        "baseAbility": 92,
        "peakAbility": 94,
        "note": "1990年欧洲短途名马，南索普、海多克短途与阿贝耶冠军。"
      },
      "races": [
        {
          "raceId": "nunthorpe-stakes",
          "year": 1990,
          "ability": 94,
          "jockeyId": "willie-carson",
          "finish": 1
        },
        {
          "raceId": "haydock-sprint-cup",
          "year": 1990,
          "ability": 94,
          "jockeyId": "willie-carson",
          "finish": 1
        },
        {
          "raceId": "prix-de-labbaye",
          "year": 1990,
          "ability": 94,
          "jockeyId": "willie-carson",
          "finish": 1
        }
      ]
    },
    {
      "id": "meccas-angel",
      "name": "Mecca's Angel",
      "displayName": "Mecca's Angel",
      "profile": {
        "baseAbility": 84,
        "peakAbility": 86,
        "note": "南索普锦标双胜雌马，1000米专家。"
      },
      "races": [
        {
          "raceId": "nunthorpe-stakes",
          "year": 2015,
          "ability": 86,
          "jockeyId": "paul-mulrennan",
          "finish": 1
        },
        {
          "raceId": "nunthorpe-stakes",
          "year": 2016,
          "ability": 86,
          "jockeyId": "paul-mulrennan",
          "finish": 1
        }
      ]
    },
    {
      "id": "hello-youmzain",
      "name": "Hello Youmzain",
      "displayName": "Hello Youmzain",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "海多克短途杯与禧年锦标冠军，1200米线强者。"
      },
      "races": [
        {
          "raceId": "haydock-sprint-cup",
          "year": 2019,
          "ability": 84,
          "jockeyId": "kevin-stott",
          "finish": 1
        },
        {
          "raceId": "queen-elizabeth-ii-jubilee-stakes",
          "year": 2020,
          "ability": 84,
          "jockeyId": "kevin-stott",
          "finish": 1
        }
      ]
    },
    {
      "id": "minzaal",
      "name": "Minzaal",
      "displayName": "Minzaal",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2022年海多克短途杯冠军，成熟期短途能力明确。"
      },
      "races": [
        {
          "raceId": "haydock-sprint-cup",
          "year": 2022,
          "ability": 83,
          "jockeyId": "jim-crowley",
          "finish": 1
        }
      ]
    },
    {
      "id": "regional",
      "name": "Regional",
      "displayName": "Regional",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2023年海多克短途杯冠军，欧洲短途G1水准。"
      },
      "races": [
        {
          "raceId": "haydock-sprint-cup",
          "year": 2023,
          "ability": 83,
          "jockeyId": "callum-rodriguez",
          "finish": 1
        }
      ]
    },
    {
      "id": "glass-slippers",
      "name": "Glass Slippers",
      "displayName": "Glass Slippers",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "阿贝耶与育马者杯草地短途冠军，雌马短途代表。"
      },
      "races": [
        {
          "raceId": "prix-de-labbaye",
          "year": 2019,
          "ability": 83,
          "jockeyId": "tom-eaves",
          "finish": 1
        },
        {
          "raceId": "breeders-cup-turf-sprint",
          "year": 2020,
          "ability": 84,
          "jockeyId": "tom-eaves",
          "finish": 1
        }
      ]
    },
    {
      "id": "mabs-cross",
      "name": "Mabs Cross",
      "displayName": "Mabs Cross",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2018年阿贝耶大奖赛冠军，1000米雌马短途代表。"
      },
      "races": [
        {
          "raceId": "prix-de-labbaye",
          "year": 2018,
          "ability": 83,
          "jockeyId": "gerald-mosse",
          "finish": 1
        }
      ]
    },
    {
      "id": "marsha",
      "name": "Marsha",
      "displayName": "Marsha",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "阿贝耶与南索普锦标冠军，欧洲雌马短途名将。"
      },
      "races": [
        {
          "raceId": "prix-de-labbaye",
          "year": 2016,
          "ability": 83,
          "jockeyId": "luke-morris",
          "finish": 1
        },
        {
          "raceId": "nunthorpe-stakes",
          "year": 2017,
          "ability": 84,
          "jockeyId": "luke-morris",
          "finish": 1
        }
      ]
    },
    {
      "id": "goldream",
      "name": "Goldream",
      "displayName": "Goldream",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2015年皇家雅士谷短途与阿贝耶大奖赛冠军。"
      },
      "races": [
        {
          "raceId": "king-charles-iii-stakes",
          "year": 2015,
          "ability": 83,
          "jockeyId": "martin-harley",
          "finish": 1
        },
        {
          "raceId": "prix-de-labbaye",
          "year": 2015,
          "ability": 83,
          "jockeyId": "martin-harley",
          "finish": 1
        }
      ]
    },
    {
      "id": "creative-force",
      "name": "Creative Force",
      "displayName": "Creative Force",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2021年英国冠军短途锦标冠军。"
      },
      "races": [
        {
          "raceId": "british-champions-sprint-stakes",
          "year": 2021,
          "ability": 83,
          "jockeyId": "william-buick",
          "finish": 1
        }
      ]
    },
    {
      "id": "kinross",
      "name": "Kinross",
      "displayName": "Kinross",
      "profile": {
        "baseAbility": 82,
        "peakAbility": 84,
        "note": "2022年英国冠军短途锦标冠军，短途至1400米表现稳定。"
      },
      "races": [
        {
          "raceId": "british-champions-sprint-stakes",
          "year": 2022,
          "ability": 84,
          "jockeyId": "frankie-dettori",
          "finish": 1
        }
      ]
    },
    {
      "id": "art-power",
      "name": "Art Power",
      "displayName": "Art Power",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2023年英国冠军短途锦标冠军，短途G1水准。"
      },
      "races": [
        {
          "raceId": "british-champions-sprint-stakes",
          "year": 2023,
          "ability": 83,
          "jockeyId": "david-allan",
          "finish": 1
        }
      ]
    },
    {
      "id": "kind-of-blue",
      "name": "Kind Of Blue",
      "displayName": "Kind Of Blue",
      "profile": {
        "baseAbility": 81,
        "peakAbility": 83,
        "note": "2024年英国冠军短途锦标冠军，现有赛事表计入其核心G1。"
      },
      "races": [
        {
          "raceId": "british-champions-sprint-stakes",
          "year": 2024,
          "ability": 83,
          "jockeyId": "james-doyle",
          "finish": 1
        }
      ]
    }
  ];

  horses.forEach((horse) => {
    ns.HistoricalHorseRegistry.register(horse);
  });
})();
