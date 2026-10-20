"""V4 integration, real controls + isolated rich-save fixtures for late-game branches."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1100});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 def state():return page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0]')
 def home():
  page.reload(wait_until='domcontentloaded');page.locator('#start').click();page.locator('[data-slot="0"]').click()
 def seed(**values):
  s=state();s.update({'event':None,'eventDay':s['day'],'weather':'sun'});s.update(values);page.evaluate('(s)=>localStorage.setItem("petopia.slots",JSON.stringify([s]))',s);home()
 def menu(key):page.locator(f'[data-menu="{key}"]').click()
 def utility(key):page.locator(f'[data-utility="{key}"]').click()
 def back():page.locator('#gameBack').click()
 def close_modal():
  page.locator('dialog .btn').click();page.wait_for_timeout(100)
 page.goto('http://127.0.0.1:8000',wait_until='networkidle');page.locator('#start').click();assert page.locator('.slot').count()==3
 page.locator('[data-slot="0"]').click();page.locator('#ownerName').fill('승식');page.locator('#ownerNext').click();assert page.locator('.character:disabled').count()==1;page.locator('#chunbae').click()
 assert page.locator('.intro-panel .shivering').is_visible()
 for _ in range(6):page.locator('#nextIntro').click()
 assert state()['introSeen'];assert page.locator('[data-menu]').count()==6;assert page.locator('.game-top #dayButton').count()==0
 menu('influencer');assert state()['energy']==100;page.locator('[data-social="star"]').click();assert state()['energy']==100
 page.locator('#postStar').click();assert state()['energy']==75;assert state()['daily']['star']==1;assert page.locator('#postStar').is_disabled()
 back();page.locator('[data-social="live"]').click();page.locator('#startLive').click();assert state()['energy']==75
 page.locator('[data-choice="0"]').click();page.wait_for_timeout(1700)
 page.locator('[data-choice="0"]').click();assert page.locator('.dance-scene .owner-actor').is_visible();page.wait_for_timeout(1700)
 page.locator('[data-choice="0"]').click();page.wait_for_timeout(1700);close_modal();assert state()['lastLive']['gold']>0
 home();menu('work');page.locator('[data-job="0"]').click();assert page.locator('.scene-construction').is_visible();close_modal();assert state()['energy']==25;assert state()['working']==0
 back();assert page.locator('[data-menu="walk"]').is_enabled();menu('walk');page.locator('[data-dest="park"]').click();close_modal();assert state()['energy']==0;assert state()['daily']['walk']==1;assert page.locator('[data-dest="park"]').is_disabled()
 back();page.locator('#dayButton').click();assert page.locator('.scene-sleep').is_visible();close_modal();page.get_by_role('heading',name='SPRING 2 (월)',exact=True).wait_for(state='visible');assert page.locator('.day-deltas>div').count()==4;assert state()['energy']==100;assert state()['working'] is None;assert state()['workDays'][0]==1
 page.locator('#startNewDay').click()
 # Price changes, finite stock and repeatable toy inventory.
 seed(gold=1000000,diamonds=100,treatStock=[1,1,1],stockDay=2,hospital=False,happiness=80)
 utility('mart');page.locator('[data-forge="toy"]').click();assert page.locator('[data-buy="toy:0"]').count()==1
 page.locator('[data-buy="toy:0"]').click();page.locator('[data-buy="toy:0"]').click();assert state()['toyBag']['0']==2
 page.locator('[data-mart="treat"]').click();assert '400 G' in page.locator('[data-buy="treat:0"]').inner_text();page.locator('[data-buy="treat:0"]').click();assert page.locator('[data-buy="treat:0"]').is_disabled();assert state()['treatStock'][0]==0
 page.locator('[data-mart="vehicle"]').click();page.locator('[data-buy="vehicle:0"]').click();assert 0 in state()['vehicles'];assert '5,000' not in page.locator('[data-buy="vehicle:0"]').inner_text()
 home();menu('inventory');page.locator('[data-feed="0"]').click();assert state()['daily']['feed']==1;assert page.locator('[data-feed="1"]').is_disabled()
 # Romance: separate gift cap, success/failure gates, marriage and permanent stage.
 seed(romance={'kind':0,'affection':2.9,'stage':0,'since':1},candidate=2,daily={'feed':1,'gift':0,'talk':0,'date':0,'work':0,'walk':0,'dungeon':0,'star':0,'influence':0})
 menu('romance');page.locator('#talkPartner').click();assert state()['romance']['affection']==3
 page.evaluate('()=>{window.originalRandom=Math.random;Math.random=()=>0;}');page.locator('#confess').click();close_modal();assert state()['romance']['stage']==1
 page.locator('[data-give-toy="0"]').click();assert state()['daily']['gift']==1;assert state()['daily']['feed']==1;assert state()['toyBag']['0']==1
 seed(romance={'kind':1,'affection':6,'stage':1,'since':1},diamonds=30)
 menu('romance');page.evaluate('()=>{Math.random=()=>0;}');page.locator('#propose').click();close_modal();assert state()['romance']['stage']==2;assert state()['diamonds']==25
 home();assert page.locator('.home-cats .cat-sprite').count()==2
 seed(romance={'kind':2,'affection':10,'stage':3,'since':1});menu('romance');assert page.locator('#breakUp').count()==0;assert page.locator('#switchPartner').count()==0
 seed(romance={'kind':0,'affection':2,'stage':0,'since':1},candidate=2);menu('romance');page.locator('#switchPartner').click();assert state()['romance']['affection']==0;assert state()['romance']['kind']==2;page.locator('#breakUp').click();assert state()['romance'] is None
 # Finance, company daily share and medical energy invariance.
 seed(house=0,companies=[],buildings=[],romance=None,gold=1000000,energy=50,workDays=[2,0,0],employees=[],workLevels=[1,1,1],staffLevels=[1,1,1])
 utility('bank');page.locator('[data-bank="spend"]').click();page.locator('[data-invest="coin"]').click();assert '200%' in page.locator('.desc').inner_text();back();page.locator('[data-invest="stock"]').click();assert '30%' in page.locator('.desc').inner_text();page.locator('[data-trade="0:buy"]').click();assert state()['stocks']['0']==1
 back();page.locator('[data-invest="company"]').click();page.locator('[data-buy="company:0"]').click();assert 0 in state()['companies']
 home();menu('work');page.locator('[data-promote="owner:0"]').click();assert state()['workLevels'][0]==2;page.locator('[data-hire="0"]').click();assert 0 in state()['employees'];page.locator('[data-promote="staff:0"]').click();assert state()['staffLevels'][0]==2
 home();page.locator('#dayButton').click();close_modal();assert state()['stocks']['0']==2;assert state()['lastDayDelta']['gold']>0;page.locator('#startNewDay').click()
 seed(hospital=True,gold=0,energy=7,happiness=0);utility('hospital');page.locator('#healPet').click();assert not state()['hospital'];assert state()['energy']==7;assert state()['loans']
 # Arcade consumes the outing's 25 only; all prior games still load.
 seed(hospital=False,energy=100,gold=10000,happiness=80,bossCleared=True,daily={'walk':0,'dungeon':0,'star':0,'influence':0,'work':0,'feed':0,'gift':0,'talk':0,'date':0})
 menu('walk');page.locator('[data-dest="arcade"]').click();assert state()['energy']==75;page.locator('[data-arcade="claw"]').click();assert state()['energy']==75;page.locator('#clawDrop').click();page.wait_for_function('JSON.parse(localStorage.getItem("petopia.slots"))[0].arcadeSession===null',timeout=10000);page.locator('#clawExit').click()
 assert page.locator('[data-arcade="rhythm"]').is_disabled();page.locator('[data-arcade="hex"]').click();page.frame_locator('#hexFrame').locator('#start').wait_for(state='visible');page.locator('#hexExit').click();assert page.locator('[data-arcade="claw"]').is_visible();back();assert page.locator('[data-dest="casino"]').is_disabled()
 # Actual survival rendering, movement/pause and one-time partial settlement.
 seed(energy=100,hospital=False,happiness=80,daily={'walk':0,'dungeon':0,'star':0,'influence':0,'work':0,'feed':0,'gift':0,'talk':0,'date':0})
 page.evaluate('()=>{const original=CatSurvival.prototype.update;CatSurvival.prototype.update=function(dt,input){window.testArena=this;return original.call(this,dt,input)}}')
 menu('dungeon');assert '01:00' in page.locator('.boss-timeline').inner_text();assert '03:00' in page.locator('.boss-timeline').inner_text();page.locator('#enterSurvival').click();assert state()['energy']==50
 page.wait_for_function('document.querySelector("#runTime").textContent!=="00:00"');page.keyboard.down('KeyD');page.wait_for_timeout(1200);page.keyboard.up('KeyD');page.evaluate('testArena.gainXP(testArena.needed())');page.locator('[data-run-upgrade="0"]').wait_for(state='visible');page.locator('[data-run-upgrade="0"]').click();assert page.evaluate('testArena.choice===null');page.evaluate('testArena.time=59.99');page.wait_for_function('document.querySelectorAll("#bossBars>div").length>=1');page.evaluate('testArena.time=179.99');page.wait_for_function('document.querySelectorAll("#bossBars>div").length>=2');page.locator('#pauseSurvival').click();assert page.locator('#resumeSurvival').is_visible();page.locator('#resumeSurvival').click();page.screenshot(path='/tmp/petopia-v4-gameplay.png',full_page=True);back();assert state()['expedition'] is None;assert len(state()['survivalRecords'])==1;assert page.locator('#enterSurvival').is_disabled()
 # Mobile layouts for all six main activities and each utility.
 home();page.set_viewport_size({'width':390,'height':844});page.screenshot(path='/tmp/petopia-v4-mobile.png',full_page=True)
 for key in ['dungeon','walk','work','romance','influencer','inventory']:
  menu(key);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),key;back()
 for key in ['mart','bank','hospital']:
  utility(key);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),key;back()
 assert not errors,errors
 print('PASS: real new-game intro, six menus, shared influencer cost, animated Live choices, work freedom/cutscene, day report, finite stock/toys/vehicles, romance gifts/confession/marriage/switch/permanence, prices/income, hospital energy, arcade/HEX, survival/pause/rewards, mobile; no JS errors')
 b.close()
