"""V5 integrations use real clicks, saved fixtures for late-game states and a deterministic timer clock."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1050});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto('http://127.0.0.1:8000')
 def seed(**o):
  values={'introSeen':True,'eventDay':1,'event':None,'weather':'sun','logs':[{'day':1,'text':'테스트 기록'}]};values.update(o)
  if values.get('romance'):values['romance']['name']='치즈'
  page.evaluate('(o)=>{cleanupView();selectedSlot=0;slots[0]=E.normalize(o);renderHome();}',values)
 def state():return page.evaluate('structuredClone(player())')
 def menu(key):page.locator(f'[data-menu="{key}"]').click()
 def home():page.evaluate('renderHome()')
 def close():page.locator('dialog .btn').click();page.wait_for_timeout(100)
 seed();assert page.locator('[data-menu]').count()==8;assert page.locator('[data-menu="inventory"]').count()==0;assert page.locator('.screen-tools button').count()==4
 for key in ['dungeon','walk','work','romance','influencer','gambling','mart','bank']:
  menu(key);assert page.locator('.game-shell>.activity-journal:last-child').count()==1;assert '테스트 기록' in page.locator('#activityLog').inner_text();home()
 page.locator('[data-utility="inventory"]').click();assert '인벤토리' in page.locator('h1').inner_text();home()
 # Weekend nap, independent outing allowance, weather block and arcade happiness.
 seed(happiness=40,energy=0);menu('walk');page.locator('[data-dest="nap"]').click();close();assert state()['happiness']==70;assert state()['energy']==0;assert state()['daily']['walk']==0;assert page.locator('[data-dest="nap"]').is_disabled()
 seed(day=2,eventDay=2,weather='rain');menu('walk');assert page.locator('[data-dest="nap"]').is_disabled();assert page.locator('[data-dest="park"]').is_disabled()
 seed(happiness=50);menu('walk');page.locator('[data-dest="park"]').click();close();assert state()['happiness']==80;assert state()['energy']==75
 # Chance upgrade, hold, destruction and removal of old guaranteed button.
 seed(gold=10000,weapon=1,weapons=[0,1],armor=1,armors=[0,1]);menu('mart');assert page.locator('[data-upgrade]').count()==0;home();menu('gambling');page.locator('#openEnhance').click();assert '18 G' in page.locator('#tryEnhance').inner_text()
 for roll,outcome in [(0,'success'),(.95,'hold'),(.99,'destroy')]:
  page.evaluate('(r)=>Math.random=()=>r',roll);page.locator('#tryEnhance').click();assert page.locator(f'.enhance-result.{outcome}').is_visible();close()
 assert state()['weapon']==0;assert 1 not in state()['weapons'];assert state()['armors']==[0,1];assert page.locator('#tryEnhance').is_disabled()
 # Romance action cost is real, menu free; feeding own pet still free.
 seed(gold=10000,diamonds=10,romance={'kind':0,'stage':0,'affection':3},toys=[0],toyBag={'0':1});menu('romance');assert state()['energy']==100;page.locator('#talkPartner').click();assert state()['energy']==75;page.evaluate('Math.random=()=>0');page.locator('#confess').click();close();assert state()['energy']==50;page.locator('[data-date="0"]').click();close();assert state()['energy']==25;page.locator('[data-give-toy="0"]').click();assert state()['energy']==0;assert page.locator('#breakUp').is_disabled();home();page.locator('[data-utility="inventory"]').click();page.locator('[data-feed="0"]').click();assert state()['energy']==0
 # Star's celebrity bonus is single-use and does not cross to Live. Uploaded shutter loaded.
 seed(followers=100,romance={'kind':0,'name':'치즈','stage':0,'affection':0});menu('influencer');page.locator('[data-social="star"]').click();assert page.locator('#starTopic option').count()==16;page.evaluate('Math.random=()=>0');page.locator('#postStar').click();assert '유재석' in page.locator('dialog').inner_text();assert state()['followers']==173;assert state()['liveFollowers']==11;assert state()['happiness']==100;assert state()['energy']==75;assert page.evaluate('shutterAudio.src.endsWith("assets/shutter.mp3")');close();assert page.locator('#postStar').is_disabled();home();assert '남음 0/1' in page.locator('.daily-strip').inner_text()
 # Four live scenes, four meaningful choices each, animated owner and shared energy fee.
 menu('influencer');assert '남음 0/1' in page.locator('[data-social="star"]').inner_text();page.locator('[data-social="live"]').click();assert page.locator('#liveTopic option').count()==12;page.evaluate('Math.random=()=>.9');page.locator('#startLive').click();assert state()['energy']==75
 for i in range(4):
  assert page.locator('[data-choice]').count()==4;page.locator(f'[data-choice="{i}"]').click();page.wait_for_timeout(1400)
 close();assert state()['lastLive']['gold']>0;assert page.locator('#startLive').is_disabled()
 seed(followers=0,liveFollowers=100000);page.evaluate('renderStar()');assert page.locator('.social-photo.studio-0').count()==1;page.evaluate('renderLive()');assert page.locator('.live-stage.studio-5').count()==1;page.screenshot(path='/tmp/petopia-v5-studio.png',full_page=True)
 # Timer clock fixture drives the real stop button at exactly ten seconds.
 seed(happiness=50);menu('walk');page.locator('[data-dest="arcade"]').click();assert state()['happiness']==55;assert state()['energy']==75;assert page.locator('[data-arcade="rhythm"]').count()==0;page.locator('[data-arcade="timing"]').click();assert state()['daily']['timing']==0
 page.evaluate('window.realNow=performance.now.bind(performance);window.testNow=1000;performance.now=()=>testNow;Math.random=()=>.9999');page.locator('#timingStart').click();assert state()['daily']['timing']==1;assert not page.evaluate('E.canSleep(player())');page.evaluate('testNow=11000');page.locator('#timingStop').click();assert 'PERFECT!' in page.locator('#timingResult').inner_text();assert state()['diamonds']==10;assert state()['toyBag']['9']==5;page.evaluate('performance.now=realNow');page.locator('#gameBack').click();assert page.locator('[data-arcade="timing"]').is_disabled();assert state()['energy']==75
 # New care events and sickness persist without duplicate penalties on reopen.
 for event,cost,mood in [(8,25,60),(9,25,60),(11,50,40)]:
  seed(happiness=50,event={'id':event,'resolved':False});assert f'{5 if event!=11 else 2}%' in page.locator('.event-banner').inner_text();page.locator('[data-event="care"]').click();assert state()['energy']==100-cost;assert state()['happiness']==mood;assert page.locator('[data-event="care"]').count()==0
 seed(gold=1000,happiness=100);page.evaluate('(()=>{let n=0;E.rollDay(player(),()=>n++===0?.9:.505);renderHome();})()');assert '발생 확률 1%' in page.locator('.event-banner').inner_text();assert state()['gold']==900;assert state()['energy']==25;assert state()['happiness']==25;home();assert state()['gold']==900
 # Walk frames, visible direction changes and day-independent stage-one Joker.
 seed(day=8,eventDay=8);page.evaluate('()=>{const oldUpdate=CatSurvival.prototype.update;CatSurvival.prototype.update=function(dt,input){window.testArena=this;return oldUpdate.call(this,dt,input)}}');menu('dungeon');page.locator('#enterSurvival').click();page.wait_for_function('window.testArena && spriteImages.walk.complete && spriteImages.walk.naturalWidth>0');page.keyboard.down('KeyD');page.wait_for_timeout(350);assert page.evaluate('testArena.player.facing===2&&testArena.player.walking&&testArena.player.walkDistance>0');page.keyboard.up('KeyD');page.keyboard.down('KeyW');page.wait_for_timeout(250);page.keyboard.up('KeyW');assert page.evaluate('testArena.player.facing===3');page.evaluate('testArena.weapons=[3,3,3,3,3,3];for(let i=0;i<8;i++)testArena.spawn();');page.wait_for_timeout(300);page.screenshot(path='/tmp/petopia-v5-combat.png',full_page=True);page.evaluate('testArena.time=179.99');page.wait_for_function('testArena.finalSpawned');assert '조커의남자' in page.locator('#bossBars').inner_text();page.evaluate('const boss=testArena.enemies.find(e=>e.final);testArena.damage(boss,Math.ceil(boss.hp)+1)');page.locator('#runExit').wait_for();page.locator('#runExit').click();assert state()['bossCleared'];menu('gambling');page.locator('#openCasino').click();assert page.locator('[data-casino="slot"]').is_visible();assert state()['daily']['walk']==0
 # Every destination keeps the bottom journal and fits narrow screens.
 seed(gold=100000,followers=100000,liveFollowers=100000,romance={'kind':2,'stage':1,'affection':4});page.set_viewport_size({'width':390,'height':844})
 for key in ['dungeon','walk','work','romance','influencer','gambling','mart','bank']:
  menu(key);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),key;assert page.locator('.game-shell>.activity-journal:last-child').count()==1;home()
 menu('influencer');page.locator('[data-social="star"]').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path='/tmp/petopia-v5-mobile.png',full_page=True)
 assert not errors,errors;print('PASS v5: common journal, weekend/rain healing, chance upgrades, romance energy, uploaded shutter, celebrity anti-loop, 4x4 Live, channel studio stages, exact timer/once-only prizes, care/illness, directional walk sprites/Joker/casino and mobile; no JS errors');b.close()
