(function () {
  'use strict';
  const ns=window.Keiba;
  const regionSpecs=[
    {key:'japan',name:'日本',country:'日本',area:'亚洲',baseRegion:'日本',trafficGroup:'日本',competitionSystem:'japan'},
    {key:'usa',name:'美国',country:'美国',area:'北美',baseRegion:'美国',trafficGroup:'北美'},
    ...[['britain','英国'],['france','法国'],['ireland','爱尔兰'],['germany','德国'],['italy','意大利']].map(([key,name])=>({key,name,country:name,area:'欧洲',baseRegion:'欧洲',trafficGroup:'欧洲'}))
  ];
  const table=[
    ['tokyo','东京','japan','府中','东京都'],['nakayama','中山','japan','船桥','千叶县'],['kyoto','京都','japan','京都','京都府'],['hanshin','阪神','japan','宝塚','兵库县'],['chukyo','中京','japan','丰明','爱知县'],['niigata','新潟','japan','新潟','新潟县'],['fukushima','福岛','japan','福岛','福岛县'],['kokura','小仓','japan','北九州','福冈县'],['sapporo','札幌','japan','札幌','北海道'],['hakodate','函馆','japan','函馆','北海道'],
    ['oi','大井','japan','品川','东京都'],['funabashi','船桥','japan','船桥','千叶县'],['kawasaki','川崎','japan','川崎','神奈川县'],['morioka','盛冈','japan','盛冈','岩手县'],['nagoya','名古屋','japan','弥富','爱知县'],['saga','佐贺','japan','鸟栖','佐贺县'],['kanazawa','金泽','japan','金泽','石川县'],
    ['santa-anita','Santa Anita Park','usa','Arcadia','California'],['del-mar','Del Mar','usa','Del Mar','California'],['keeneland','Keeneland','usa','Lexington','Kentucky'],['churchill-downs','Churchill Downs','usa','Louisville','Kentucky'],['belmont','Belmont Park','usa','Elmont','New York'],['aqueduct','Aqueduct','usa','New York City','New York'],['saratoga','Saratoga','usa','Saratoga Springs','New York'],['gulfstream','Gulfstream Park','usa','Hallandale Beach','Florida'],['oaklawn','Oaklawn Park','usa','Hot Springs','Arkansas'],['fair-grounds','Fair Grounds','usa','New Orleans','Louisiana'],['laurel','Laurel Park','usa','Laurel','Maryland'],['pimlico','Pimlico','usa','Baltimore','Maryland'],['monmouth','Monmouth Park','usa','Oceanport','New Jersey'],['parx','Parx Racing','usa','Bensalem','Pennsylvania'],['penn-national','Penn National','usa','Grantville','Pennsylvania'],['remington','Remington Park','usa','Oklahoma City','Oklahoma'],['sunland','Sunland Park','usa','Sunland Park','New Mexico'],['los-alamitos','Los Alamitos','usa','Cypress','California'],['indianapolis','Horseshoe Indianapolis','usa','Shelbyville','Indiana'],['colonial','Colonial Downs','usa','New Kent','Virginia'],['kentucky-downs','Kentucky Downs','usa','Franklin','Kentucky'],
    ['epsom','Epsom','britain','Epsom','Surrey'],['ascot','Ascot','britain','Ascot','Berkshire'],['newmarket','Newmarket','britain','Newmarket','Suffolk'],['york','York','britain','York','Yorkshire'],['goodwood','Goodwood','britain','Chichester','West Sussex'],['doncaster','Doncaster','britain','Doncaster','South Yorkshire'],['newbury','Newbury','britain','Newbury','Berkshire'],['sandown','Sandown','britain','Esher','Surrey'],['haydock','Haydock','britain','Haydock','Merseyside'],
    ['musselburgh','Musselburgh','britain','Musselburgh','East Lothian'],
    ['bordeaux-le-bouscat','Bordeaux-Le Bouscat','france','Le Bouscat','Gironde'],
    ['longchamp','ParisLongchamp','france','Paris','Île-de-France'],['chantilly','Chantilly','france','Chantilly','Hauts-de-France'],['deauville','Deauville','france','Deauville','Normandie'],['saint-cloud','Saint-Cloud','france','Saint-Cloud','Île-de-France'],
    ['curragh','Curragh','ireland','Newbridge','Kildare'],['leopardstown','Leopardstown','ireland','Dublin','Dublin'],['cork','Cork','ireland','Mallow','Cork'],['naas','Naas','ireland','Naas','Kildare'],['navan','Navan','ireland','Navan','Meath'],['tipperary','Tipperary','ireland','Tipperary','Tipperary'],['roscommon','Roscommon','ireland','Roscommon','Roscommon'],['gowran','Gowran Park','ireland','Gowran','Kilkenny'],
    ['hamburg','Hamburg','germany','Hamburg','Hamburg'],['baden','Baden-Baden','germany','Iffezheim','Baden-Württemberg'],['hoppegarten','Hoppegarten','germany','Hoppegarten','Brandenburg'],['cologne','Köln','germany','Köln','Nordrhein-Westfalen'],['munich','München','germany','München','Bayern'],['dusseldorf','Düsseldorf','germany','Düsseldorf','Nordrhein-Westfalen'],
    ['san-siro','Milano','italy','Milano','Lombardia'],['capannelle','Roma','italy','Roma','Lazio']
  ];
  const chineseNames={musselburgh:'穆塞尔堡','bordeaux-le-bouscat':'波尔多勒布斯卡','santa-anita':'圣塔安妮塔','del-mar':'德尔马',keeneland:'基恩兰','churchill-downs':'丘吉尔唐斯',belmont:'贝尔蒙特公园',aqueduct:'水道',saratoga:'萨拉托加',gulfstream:'湾流公园',oaklawn:'橡树园','fair-grounds':'公平场',laurel:'月桂园',pimlico:'皮姆利科',monmouth:'蒙茅斯公园',parx:'帕克斯','penn-national':'宾州国家',remington:'雷明顿公园',sunland:'日地公园','los-alamitos':'洛斯阿拉米托斯',indianapolis:'马蹄铁印第安纳波利斯',colonial:'殖民地唐斯','kentucky-downs':'肯塔基唐斯',epsom:'叶森唐斯',ascot:'雅士谷',newmarket:'纽马克特',york:'约克',goodwood:'古活',doncaster:'唐卡斯特',newbury:'纽伯里',sandown:'沙丘园',haydock:'海多克',longchamp:'巴黎隆尚',chantilly:'尚蒂伊',deauville:'多维尔','saint-cloud':'圣克卢',curragh:'柯拉',leopardstown:'豹镇',cork:'科克',naas:'纳斯',navan:'纳文',tipperary:'蒂珀雷里',roscommon:'罗斯康芒',gowran:'高兰公园',hamburg:'汉堡',baden:'巴登巴登',hoppegarten:'霍佩加滕',cologne:'科隆',munich:'慕尼黑',dusseldorf:'杜塞尔多夫','san-siro':'圣西罗',capannelle:'卡帕内莱'};
  const jbcTrackKeys=new Set(['oi','funabashi','kawasaki','morioka','nagoya','saga','kanazawa']);
  const jbcRaceIds=new Set(['jbc-classic','jbc-sprint','jbc-ladies-classic']);
  const localTrackSourceUrls={oi:'https://www.tokyocitykeiba.com/guide/',funabashi:'https://www.f-keiba.com/racecourse/',kawasaki:'https://www.kawasaki-keiba.jp/guide/',morioka:'https://www.iwatekeiba.or.jp/racecourse',nagoya:'https://www.nagoyakeiba.com/racecourse/',saga:'https://www.sagakeiba.net/racecourse/',kanazawa:'https://www.kanazawakeiba.com/racecourse/'};
  const tracks=table.map(([key,sourceVenueName,regionKey,city,state])=>{
    const originalName=({'san-siro':'San Siro',capannelle:'Capannelle',epsom:'Epsom Downs'})[key]||sourceVenueName,localJbcTrack=jbcTrackKeys.has(key);
    const jp=regionKey==='japan',courseType=jp&&!localJbcTrack&&['东京','中山','京都','阪神'].includes(originalName)?originalName:'其他地方';
    const surfaces=jp?(localJbcTrack?['泥地']:['草地','泥地']):regionKey==='usa'&&key!=='kentucky-downs'?['los-alamitos','oaklawn','sunland'].includes(key)?['泥地']:['草地','泥地']:['草地'];
    const sources=[...new Set(Object.values(ns.ChairmanVenueRecords||{}).filter(r=>r.venue===sourceVenueName).map(r=>r.sourceUrl))];
    if(jp)sources.push(localJbcTrack?localTrackSourceUrls[key]:'https://japanracing.jp/en/racing/go_racing/jra_racecourses/');
    return {key,regionKey,originalName,sourceVenueName,name:jp?`${originalName}赛马场`:originalName,aliases:[...new Set([...(sourceVenueName===originalName?[]:[sourceVenueName]),...(chineseNames[key]?[chineseNames[key],`${chineseNames[key]}赛马场`]:[])])],city,state,surfaces,courseType,sourceCourse:jp&&!localJbcTrack?originalName:undefined,sourceUrl:sources[0]||'',sourceUrls:sources,checkedAt:'2026-09-22',
      ...(key==='newmarket'?{configurations:[{id:'newmarket:rowley',name:'Rowley Mile',surface:'草地',courseType},{id:'newmarket:july',name:'July Course',surface:'草地',courseType}]}:{})};
  });
  function catalogue(){
    return ns.RaceRegistry.all().filter(r=>(['op','g1','g2','g3'].includes(r.raceClass)||jbcRaceIds.has(r.id))&&(['美国','欧洲'].includes(r.surfaceRegion)||r.surfaceRegion==='日本'&&(tracks.some(t=>t.regionKey==='japan'&&t.sourceCourse===r.course)||jbcRaceIds.has(r.id)))).map(r=>{
      const regionKey=r.surfaceRegion==='日本'?'japan':r.surfaceRegion==='美国'?'usa':regionSpecs.find(a=>a.name===r.course)?.key;
      const entry={sourceId:r.id,name:r.nameZh||r.name,regionKey,sourceVersion:'project-20260922',status:'pending',reason:'尚未在官方目录中确认举办地；暂不启用。'};
      if(regionKey==='japan'){
        if(jbcRaceIds.has(r.id))return {...entry,status:'confirmed',reason:'JBC 同届三赛事采用主席模式年度举办组轮换；基准马场只用于建立初始赛事定义。',venueKey:'oi',sourceUrl:'https://www.keiba.go.jp/jbc2026/detail/',checkedAt:'2026-09-22',hostGroup:'jbc'};
        const t=tracks.find(t=>t.sourceCourse===r.course);return {...entry,status:'confirmed',reason:'采用普通模式现有中央马场资料。',venueKey:t.key,sourceUrl:'project:js/data/races/Japan',checkedAt:'2026-09-21'};
      }
      const record=ns.ChairmanVenueRecords?.[r.id];if(!record)return entry;
      const t=tracks.find(t=>t.sourceVenueName===record.venue&&t.regionKey===regionKey);if(!t)return {...entry,reason:`官方举办地${record.venue}的马场档案尚待补齐。`};
      return {...entry,status:'confirmed',reason:record.note||'按官方目录确认举办地；格付、赛期与距离沿用项目资料。',venueKey:t.key,sourceUrl:record.sourceUrl,sourcePage:record.page,checkedAt:record.checkedAt,hostGroup:record.hostGroup,
        ...(t.key==='newmarket'?{courseName:['july-cup','falmouth-stakes'].includes(r.id)?'July Course':'Rowley Mile'}:{})};
    });
  }
  ns.ChairmanVenues={version:'20260922.3',regionSpecs,tracks,catalogue};
})();
