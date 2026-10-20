"""V6: real controls, uploaded media routing/lifecycle, saved-day rules and responsive screens."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1050});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.add_init_script('''window.played=[];const realPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){played.push({src:this.src,volume:this.volume,loop:this.loop});return realPlay.call(this)};''')
 page.goto('http://127.0.0.1:8000');page.evaluate('window.realRandom=Math.random;Math.random=()=>.9')
 def state():return page.evaluate('structuredClone(player())')
 def seed(**o):
  values={'introSeen':True,'eventDay':1,'event':None,'weather':'sun','logs':[{'day':1,'text':'공통 기록'}]};values.update(o)
  page.evaluate('(o)=>{if(modal.open)modal.close();cleanupView();selectedSlot=0;slots[0]=E.normalize(o);Math.random=()=>.9;renderHome();}',values)
 def home():page.evaluate('renderHome()')
 def menu(k):page.locator(f'[data-menu="{k}"]').click()
 def close():page.locator('dialog .btn').click();page.wait_for_timeout(100)
 def played(name):return page.evaluate('(name)=>played.some(a=>a.src.endsWith("/"+name+".mp3"))',name)
 # Real new-game onboarding and all fourteen story beats, in order.
 page.locator('#start').click();page.locator('[data-slot="0"]').click();page.locator('#ownerName').fill('승식');page.locator('#ownerNext').click();page.locator('#chunbae').click()
 assert page.locator('.story-battle').is_visible();assert '치즈냥이' in page.locator('#introLine').inner_text()
 for i in range(14):
  if i==1:assert page.locator('.story-demon').is_visible();assert played('demon')
  if i==4:assert page.locator('.story-curse').is_visible();assert played('memory')
  if i==6:assert page.locator('.story-flight').is_visible();assert played('flight')
  if i==7:
   assert page.locator('.story-rain').is_visible();assert played('rain');assert page.locator('.story-rain .rain-layer').is_visible();assert page.evaluate('[...mediaLoops].some(e=>e.audio.src.endsWith("rain.mp3")&&e.audio.loop)');page.screenshot(path='/tmp/petopia-v6-intro.png',full_page=True)
  page.locator('#nextIntro').click()
 assert state()['introSeen'];assert page.evaluate('mediaLoops.size')==0
 # Home-only controls, adjacent brown romance, persistent daily random guide.
 seed();assert page.locator('.screen-tools button').count()==4;assert page.locator('[data-menu]').evaluate_all('(els)=>els.slice(0,2).map(e=>e.dataset.menu)')==['dungeon','romance'];assert page.locator('[data-menu="romance"].adventure').count()==1;assert page.locator('#nextGuide').count()==0
 tip=page.locator('#guideText').inner_text();day=state()['guideDay']
 for k in ['romance','walk','work','dungeon','influencer','gambling','mart','bank']:
  menu(k);assert page.locator('.screen-tools').count()==0;assert page.locator('.game-shell>.activity-journal:last-child').count()==1;home();assert page.locator('#guideText').inner_text()==tip
 page.reload();page.locator('#start').click();page.locator('[data-slot="0"]').click();assert page.locator('#guideText').inner_text()==tip;assert state()['guideDay']==day
 page.evaluate('player().energy=0;Math.random=()=>.1;renderHome()');page.locator('#dayButton').click();close();page.locator('#startNewDay').click();assert state()['guideDay']==2;assert page.locator('#guideText').inner_text()!=tip
 # Four healing actions can all complete today with independent counters.
 seed(happiness=0,romance={'kind':0,'name':'치즈','stage':0,'affection':0},vehicles=[0]);menu('walk');page.locator('[data-dest="nap"]').click();close();assert state()['energy']==100;assert state()['happiness']==30
 page.locator('[data-dest="park"]').click();close();assert state()['energy']==75;assert page.locator('[data-dest="drive"]').is_enabled();page.locator('[data-dest="drive"]').click();close();assert state()['energy']==50
 page.locator('[data-dest="arcade"]').click();assert state()['energy']==25;assert state()['happiness']==95;page.locator('#gameBack').click();assert page.locator('[data-dest]:disabled').count()==4
 seed(weather='rain');menu('walk');assert page.locator('[data-dest="park"]').is_disabled();assert page.locator('[data-dest="arcade"]').is_enabled()
 # Meet => dialogue => name input; persist custom name and escape markup safely.
 seed();page.evaluate('E.meet(player(),"work",0);save();showModal("활동 완료","만남 보상")');page.wait_for_timeout(100);assert page.locator('dialog h2').inner_text()=='활동 완료';close()
 page.wait_for_function('document.querySelector("dialog[open] .meeting-cats")!==null')
 for _ in range(3):page.locator('dialog .btn').click()
 assert '너는 이름이 뭐니' in page.locator('dialog').inner_text();page.locator('dialog .btn').click();assert '이름을' in page.locator('#partnerNameError').inner_text();page.locator('#partnerName').fill('햇살<냥>');page.locator('dialog .btn').click();assert not state()['romance']['namePending'];assert state()['romance']['name']=='햇살<냥>';assert '햇살<냥>' in page.locator('.desc').inner_text();assert page.locator('.desc 냥').count()==0
 page.reload();page.locator('#start').click();page.locator('[data-slot="0"]').click();menu('romance');assert '햇살<냥>' in page.locator('.desc').inner_text();assert page.locator('#switchPartner').count()==0
 # Purchase audio only after actual paid purchase, and fractional market controls/fee hints.
 seed(gold=1000000);menu('mart');page.locator('[data-buy="weapon:1"]').click();assert played('purchase');home();menu('bank');page.evaluate('renderInvest("stock")');assert '각각 2%' in page.locator('.desc').inner_text();assert page.locator('#tradeQty').get_attribute('step')=='0.01';page.locator('#tradeQty').fill('0.33');old=state()['gold'];quote=page.evaluate('E.price(player(),"stock",0)');page.locator('[data-trade="0:buy"]').click();assert state()['stocks']['0']==.33;assert old-state()['gold']==__import__('math').ceil(quote*.33*1.02-1e-8);assert '0.33주' in page.locator('.market-row').first.inner_text();page.locator('#tradeQty').fill('0.33');page.locator('[data-trade="0:sell"]').click();assert state()['stocks']['0']==0
 page.evaluate('renderInvest("company")');assert '1% 상당 주식' in page.locator('.desc').inner_text()
 # Work UI shows fixed thresholds and only owner pay changed.
 seed(gold=1e8,workDays=[5,5,5],promotionVersion=1,promotionDays=[1,2,3],workLevels=[10,10,1]);menu('work');assert '3/3일' in page.locator('[data-promote="owner:2"]').inner_text();page.locator('[data-promote="owner:2"]').click();assert state()['workLevels'][2]==2;assert state()['promotionDays'][2]==0;assert page.locator('[data-promote="owner:2"]').is_disabled()
 # Exact uploaded enhancement samples, no success/break sample on hold.
 seed(gold=100000,weapon=1,weapons=[0,1]);menu('gambling');page.locator('#openEnhance').click()
 for roll,result,sample in [(0,'success','enhance-success'),(.95,'hold',None),(.99,'destroy','enhance-break')]:
  page.wait_for_timeout(150);page.evaluate('(r)=>{Math.random=()=>r;played.length=0}',roll);page.locator('#tryEnhance').click();assert page.locator(f'.enhance-result.{result}').is_visible()
  if sample:assert played(sample)
  else:assert not played('enhance-success') and not played('enhance-break')
  close()
 # Casino accepts >500 without confirmation, exact jackpot and 777 render their symbols.
 seed(gold=100000,bossCleared=True);page.evaluate('renderSlot()');assert page.locator('#betAmount').get_attribute('max') is None;assert '90%' in page.locator('.slot-odds').inner_text();page.locator('#betAmount').fill('100000');page.evaluate('Math.random=()=>0');page.locator('#spinSlot').click();page.wait_for_timeout(1200);assert state()['gold']==10000000;assert page.locator('.slot-reels .jackpot-icon').count()==3;assert '100배' in page.locator('#slotResult').inner_text()
 page.evaluate('renderSlot();Math.random=()=>.0002');page.locator('#betAmount').fill('1000');page.locator('#spinSlot').click();page.wait_for_timeout(1200);assert page.locator('.slot-reels .slot-seven').count()==3;assert '20배' in page.locator('#slotResult').inner_text()
 page.evaluate('renderRoulette();Math.random=()=>.99');page.locator('#betAmount').fill('1000');page.locator('[data-color="green"]').click();page.locator('#spinRoulette').click();page.wait_for_function('document.querySelector("#rouletteResult").textContent.includes("30000")');assert '30000' in page.locator('#rouletteResult').inner_text().replace(',','')
 # Actual survival stage soundtrack/swing and pause, mute, exit lifecycle.
 seed();page.evaluate('()=>{const update=CatSurvival.prototype.update;CatSurvival.prototype.update=function(dt,input){window.arena=this;return update.call(this,dt,input)}}');menu('dungeon');page.locator('#enterSurvival').click();page.wait_for_function('window.arena&&spriteImages.walk.naturalWidth>0');assert played('stage-one');page.keyboard.down('KeyA');page.wait_for_timeout(250);page.keyboard.up('KeyA');assert page.evaluate('arena.player.facing')==1;page.wait_for_function('played.some(e=>e.src.endsWith("weapon-swing.mp3"))');assert page.evaluate('played.find(e=>e.src.endsWith("weapon-swing.mp3")).volume')==.8
 page.locator('#pauseSurvival').click();page.wait_for_timeout(100);assert page.evaluate('[...mediaLoops][0].audio.paused');page.locator('#resumeSurvival').click();page.wait_for_timeout(100);assert page.evaluate('[...mediaLoops][0].wanted');page.locator('#sound').click();assert page.evaluate('[...mediaLoops][0].audio.paused');page.locator('#sound').click();page.wait_for_timeout(100);assert page.evaluate('sound&&[...mediaLoops][0].wanted');page.locator('#gameBack').click();assert page.evaluate('mediaLoops.size')==0
 # Real directional drawing: source rectangles include whole cats, no equal-grid leakage.
 page.evaluate('''() => { const sheet=document.createElement('div');sheet.id='walkProof';sheet.style='display:grid;grid-template-columns:repeat(4,160px);background:#8a7357;width:640px';document.body.append(sheet);for(let row=0;row<4;row++)for(let col=0;col<4;col++){const c=document.createElement('canvas');c.width=160;c.height=160;sheet.append(c);drawWalkingCat(c.getContext('2d'),80,80,140,{facing:row,walking:true,walkDistance:18*col},0)}}''');page.locator('#walkProof').screenshot(path='/tmp/petopia-v6-walk.png');page.evaluate('document.querySelector("#walkProof").remove()')
 # Mobile screens and story remain within viewport.
 seed(romance={'kind':0,'name':'치즈','affection':0,'stage':0});page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/tmp/petopia-v6-home-mobile.png',full_page=True)
 for k in ['romance','walk','work','dungeon','influencer','gambling','mart','bank']:
  menu(k);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),k;assert page.locator('.screen-tools').count()==0;home()
 page.evaluate('renderSlot()');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.evaluate('playIntro()');assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.locator('#skipIntro').click();assert page.evaluate('mediaLoops.size')==0
 assert not errors,errors;print('PASS v6 browser: story/audio order, daily guide, home-only tools, independent healing, cheese naming/save, fractional fees, promotions, paid purchase/enhancement audio, unlimited casino/777/jackpot, survival audio lifecycle and walk frames, mobile; no JS errors');b.close()
