"""Real UI, saved clocks, lifecycle, independent slots and mobile idle hunting."""
import threading
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
from playwright.sync_api import sync_playwright
class QuietHandler(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(Path(__file__).resolve().parents[1])))
threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script('window.testNow=1700000000000;Date.now=()=>testNow;Math.random=()=>.9')
  page.goto(f'http://127.0.0.1:{server.server_port}')
  def state():return page.evaluate('structuredClone(player())')
  def seed(**values):
   o={'introSeen':True,'eventDay':1,'event':None,'weather':'sun','happiness':50};o.update(values)
   page.evaluate('(o)=>{if(modal.open)modal.close();cleanupView();selectedSlot=0;slots[0]=E.normalize(o);renderHome();}',o)
  def home():page.evaluate('renderHome()')
  def close():page.locator('dialog .btn').click()
  seed(energy=0)
  keys=page.locator('[data-menu]').evaluate_all('(els)=>els.map(e=>e.dataset.menu)');assert keys==['dungeon','romance','idle','walk','work','influencer','gambling','bank'],keys
  assert page.locator('[data-menu="mart"]').count()==0;assert page.locator('.screen-tools button').count()==5;page.locator('[data-utility="mart"]').click();assert page.locator('h1').inner_text()=='펫마트';assert page.locator('.screen-tools').count()==0;home()
  page.locator('[data-menu="idle"]').click();assert page.locator('#idleCanvas').is_visible();assert page.locator('.screen-tools').count()==0;assert page.locator('[data-idle-zone]:disabled').count()==2;assert page.locator('#idleStart').is_enabled();page.locator('#idleStart').click();assert state()['idleHunt']['running'];assert state()['energy']==0;assert state()['day']==1
  base=state()['gold'];page.evaluate('testNow+=60000');page.wait_for_function('player().idleHunt.totalKills>0');assert state()['gold']>base;assert state()['level']>=1;assert '자동 획득' in page.locator('#idlePay').inner_text();assert page.locator('#idleStart').is_disabled()
  # Engine and canvas are using one kill cycle, not a second render-only reward stream.
  page.wait_for_function('spriteImages.monsters.naturalWidth>0&&spriteImages.walk.naturalWidth>0');page.screenshot(path='/tmp/petopia-idle-desktop.png',full_page=True)
  cycle=state()['idleHunt']['rates']['cycleMs'];page.evaluate('testNow+=2500');page.wait_for_timeout(1100);page.locator('#idleStop').click();assert not state()['idleHunt']['running'];stoppedGold=state()['gold'];page.evaluate('testNow+=3600000');page.wait_for_timeout(1100);assert state()['gold']==stoppedGold;assert page.locator('#idleStart').is_enabled()
  # Resume and leave for another menu; time continues and manual dungeon flags stay untouched.
  page.locator('#idleStart').click();home();page.locator('[data-menu="bank"]').click();page.evaluate('testNow+=3600000;flushIdle()');assert state()['idleHunt']['pending']['kills']>0;assert state()['daily']['dungeon']==0;assert state()['day']==1;assert state()['energy']==0
  # Reload stored state after a simulated long absence: one capped payout on slot entry.
  page.evaluate('player().idleHunt.lastAt=testNow-24*3600000;player().idleHunt.pending={gold:0,xp:0,kills:0,ms:0,capped:false};save()');saved=state();page.reload();page.evaluate('(time)=>testNow=time',saved['idleHunt']['lastAt']+24*3600000);page.locator('#start').click();page.locator('[data-slot="0"]').click();page.locator('.idle-return').wait_for(state='visible');assert '8시간' in page.locator('dialog').inner_text();after=state();assert after['gold']>saved['gold'];assert after['day']==saved['day'];assert after['energy']==saved['energy'];assert after['idleHunt']['pending']['gold']==0;assert after['idleHunt']['lastAt']>saved['idleHunt']['lastAt'];close()
  page.evaluate('room()');assert not page.locator('dialog').is_visible();assert state()['gold']==after['gold']
  # Growth unlocks zones. Refresh settles old stats first; UI shows the new gear on demand.
  page.locator('[data-menu="idle"]').click();page.evaluate('()=>{const s=player();s.level=10;s.weapon=9;s.gearUp.weapon[9]=20;s.weaponUp=20}');page.locator('#idleRefresh').click();assert state()['idleHunt']['rates']['level']==10;assert state()['idleHunt']['rates']['attack']==page.evaluate('E.stats(player()).attack');page.locator('[data-idle-zone="2"]').click();assert state()['idleHunt']['area']==2;assert '별사탕 광산' in page.locator('#idleZoneName').inner_text()
  # Explicitly switching slots never pays the other slot's balance to the selected one.
  home();page.evaluate('slots[1]=E.normalize({introSeen:true,eventDay:1,gold:12,happiness:50});selectedSlot=1;room()');assert state()['gold']==12;assert not page.locator('dialog').is_visible();assert state()['idleHunt']['running']==False
  # Shock explanation, before/after quote, persisted single application, no action button.
  for id in range(12,16):
   seed();page.evaluate('(id)=>{let n=0;E.rollDay(player(),()=>n++===0?.9:(53.5+id-12)/100);save();renderHome()}',id);assert '발생 확률 1%' in page.locator('.event-banner').inner_text();assert 'undefined' not in page.locator('.event-banner').inner_text();assert '즉시 적용' in page.locator('.event-banner').inner_text();quotes=state()['market'];home();assert state()['market']==quotes
  seed(level=10,energy=0);page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.locator('[data-menu="idle"]').click();page.locator('#idleStart').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert page.locator('.game-shell>.activity-journal:last-child').count()==1;page.screenshot(path='/tmp/petopia-idle-mobile.png',full_page=True);page.locator('#gameBack').click();page.locator('[data-utility="mart"]').click();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not errors,errors;print('PASS idle browser: menu relocation, zero-energy auto hunt, cycle payouts, stop/resume, other-menu accumulation, capped offline modal/reload-once, gear/zone unlocks, slot isolation, shock events and responsive layout; no JS errors');b.close()
finally:server.shutdown();server.server_close()
