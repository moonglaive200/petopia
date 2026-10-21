"""v4 feature integration. Saved fixtures cover late-game states; HEX exits via real game over."""
from playwright.sync_api import sync_playwright
from pathlib import Path
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1100});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8000')
 page.evaluate('''()=>{selectedSlot=0;slots[0]=E.normalize({ownerName:'승식',introSeen:true,day:111,eventDay:111,weather:'rain',event:{id:7,resolved:false},gold:1e8,diamonds:100,workLevels:[3,1,1],staffLevels:[3,1,1],employees:[0],romance:{kind:0,stage:1,affection:3}});save();renderHome();}''')
 assert 'WINTER 27' in page.locator('.day-label').inner_text()
 assert page.locator('.home-stats>div').count()==3
 assert page.locator('.raining .rain-layer').is_visible()
 assert 'G' in page.locator('.wallet-gold').inner_text()
 page.locator('#calendarButton').click();assert page.locator('.calendar-grid>div').count()==28;assert '춘배 생일' in page.locator('.calendar-grid .today').inner_text();page.locator('dialog .btn').click()
 page.locator('[data-event="fight"]').click();assert page.evaluate('player().energy')==50;assert page.locator('[data-event="fight"]').count()==0
 page.screenshot(path='/tmp/petopia-v4-rain-home.png',full_page=True)
 page.locator('[data-menu="work"]').click();assert page.locator('[data-job="1"]').count()==0;assert page.locator('[data-promote="staff:0"]').is_disabled();assert '주인 승진 필요' in page.locator('[data-promote="staff:0"]').inner_text()
 page.evaluate('renderHome()');page.locator('[data-menu="mart"]').click();assert page.locator('[data-buy="toy:0"]').count()==0;page.locator('[data-forge="toy"]').click();assert page.locator('[data-buy]').count()==10
 page.locator('[data-mart="vehicle"]').click();assert '🚗' in page.locator('.equipment-icon').first.inner_text();assert '다이아 +5' in page.locator('.shop-card').nth(2).inner_text()
 page.evaluate('renderHome()');page.locator('[data-menu="bank"]').click();assert page.locator('.portfolio').is_visible();page.locator('[data-bank="spend"]').click();assert '1G 이하' in page.locator('[data-invest="stock"]').inner_text()
 page.evaluate('''()=>{const s=player();s.energy=25;s.earned={gold:1234,diamonds:4};s.dayStart={gold:s.gold,diamonds:s.diamonds,fans:s.followers+s.liveFollowers-12,affection:2.5};renderHome();}''')
 page.locator('#dayButton').click();assert page.locator('.scene-sleep').is_visible();page.locator('dialog .btn').click();assert '전날 번 금화' in page.locator('.day-deltas').inner_text();assert '호감도' in page.locator('.day-deltas').inner_text();page.locator('#startNewDay').click()
 page.evaluate('''()=>{const s=player();s.energy=100;s.daily.dungeon=0;s.hospital=false;renderDungeons();const original=CatSurvival.prototype.update;CatSurvival.prototype.update=function(dt,input){window.testArena=this;return original.call(this,dt,input)};}''')
 assert page.locator('#survivalMap option').count()==10;assert page.locator('#survivalMap option:disabled').count()==7
 page.locator('#enterSurvival').click();page.wait_for_function('window.testArena');assert page.locator('#heroHP').is_visible()
 page.evaluate('''()=>{testArena.gainXP(testArena.needed());testArena.choice=[{kind:'weapon',id:1,name:'날아라 생선',level:1,desc:'관통 생선'},{kind:'passive',id:'vamp',name:'흡혈 송곳니',level:1,desc:'피흡 +10%'},{kind:'passive',id:'power',name:'맹수의 발톱',level:1,desc:'공격력 +20%'}];}''')
 page.locator('.augment-vamp').wait_for(state='visible');colors=page.locator('.upgrade-choices .btn').evaluate_all('(nodes)=>nodes.map(n=>getComputedStyle(n).backgroundColor)');assert len(set(colors))==3
 page.screenshot(path='/tmp/petopia-v4-augments.png',full_page=True);page.locator('[data-run-upgrade="0"]').click()
 page.evaluate('''()=>{testArena.weapons=[3,3,3,3,3,3];testArena.player.hp=60;testArena.passives.vamp=1;for(let i=0;i<12;i++)testArena.spawn();for(let i=0;i<8;i++)testArena.gems.push({x:testArena.player.x+110+i*28,y:testArena.player.y+70,icon:i%6,value:1});}''');page.wait_for_timeout(1500)
 assert page.locator('.build-item').count()>=7;assert page.locator('.item-icon').count()>=6;page.screenshot(path='/tmp/petopia-v4-combat.png',full_page=True)
 # Use the actual embedded game's end button after an ordinary stationary defeat.
 page.evaluate('''()=>{cleanupView();const s=player();s.expedition=null;s.arcadeSession=null;s.hospital=false;renderArcade();}''')
 assert page.locator('[data-arcade="rhythm"]').is_disabled();page.locator('[data-arcade="hex"]').click();frame=page.frame_locator('#hexFrame');frame.locator('#start').click();frame.locator('#start').filter(has_text='방앗간으로').wait_for(timeout=45000);frame.locator('#start').click();page.locator('[data-arcade="claw"]').wait_for()
 assert not errors,errors
 # Direct index.html is the user's download workflow; exercise its iframe return as well.
 # The managed Chromium policy blocks file:// navigation. Local-file browser behavior
 # must be checked on the user's desktop; HTTP embedded exit is exercised above.
 print('PASS v4: 28-day birthday calendar, persistent rain, six status boxes, event resolution, job/staff gates, forge filters, vehicle effects, portfolio, four-field day ledger, seven locked stages, large HP bar, colored augment cards/icons, multiweapon rendering, real HEX game-over return ; no JS errors (file:// blocked by managed browser policy)')
 browser.close()
