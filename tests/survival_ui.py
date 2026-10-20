from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:8000')
 page.evaluate('''()=>{selectedSlot=0;slots[0]=E.normalize({introSeen:true,eventDay:1,event:null});const original=CatSurvival.prototype.update;CatSurvival.prototype.update=function(dt,input){window.arena=this;return original.call(this,dt,input)};startSurvival(0);}''');page.wait_for_function('window.arena')
 for w,h in [(1100,850),(390,844),(900,450)]:
  page.set_viewport_size({'width':w,'height':h});page.evaluate('''()=>{arena.choice=[{kind:'passive',id:'vamp',name:'흡혈 송곳니',level:1,desc:'준 피해의 10% 체력 흡수 · 최대 30%'},{kind:'passive',id:'speed',name:'냥발 스텝',level:1,desc:'이동·공격 속도 +10%'},{kind:'passive',id:'magnet',name:'집사의 부름',level:1,desc:'경험치 회수 범위 +40'}];}''');page.locator('[data-run-upgrade="2"]').wait_for()
  for i in range(3):
   button=page.locator(f'[data-run-upgrade="{i}"]');button.scroll_into_view_if_needed();assert button.evaluate('(e)=>{const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===e||e.contains(hit)}'),(w,h,i)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/tmp/petopia-fixed-augment.png',full_page=True);page.locator('[data-run-upgrade="2"]').click()
 page.set_viewport_size({'width':1100,'height':850});page.evaluate('''()=>{arena.choice=null;arena.pendingLevels=0;arena.weapons=[0,0,0,0,0,0];arena.enemies=[];arena.spawn(false);arena.enemies[0].x=arena.player.x+100;arena.enemies[0].y=arena.player.y;arena.loot=[{x:arena.player.x,y:arena.player.y,kind:'bomb'}];}''');page.wait_for_function('arena.numbers.some(n=>n.text==="치즈폭탄!")');assert page.evaluate('arena.kills>=1');page.screenshot(path='/tmp/petopia-cheese-explosion.png',full_page=True)
 assert not errors,errors;print('PASS: all 3 augment choices reachable on desktop/mobile/short screen, cheese pickup triggers text/explosion/nearby kill, no overflow or JS errors');b.close()
