"""Real audio-ended sequencing, duplicate/cancel safety, and mute/error fallbacks."""
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
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.add_init_script('''window.sounds=[];const oldPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){sounds.push({src:this.src,time:performance.now()});if(this.src.endsWith('enhance-charge.mp3'))this.addEventListener('ended',()=>window.chargeEnded=performance.now(),{once:true});return oldPlay.call(this)};''')
  page.goto(f'http://127.0.0.1:{server.server_port}')
  def seed(roll=0,muted=False):
   page.evaluate('''({roll,muted})=>{if(modal.open)modal.close();cleanupView();selectedSlot=0;slots[0]=E.normalize({introSeen:true,eventDay:1,gold:10000,weapon:1,weapons:[0,1]});sound=!muted;syncSound();renderEnhance();Math.random=()=>roll;sounds.length=0;window.chargeEnded=null;}''',{'roll':roll,'muted':muted})
  def state():return page.evaluate('structuredClone(player())')
  for roll,outcome,sample in [(0,'success','enhance-success'),(.95,'hold',None),(.99,'destroy','enhance-break')]:
   seed(roll);page.locator('#tryEnhance').click();assert page.locator('.enhance-charging').is_visible();assert page.locator('#tryEnhance').is_disabled();assert page.locator('#enhanceGear').is_disabled();assert not page.locator('dialog').is_visible();assert state()['gold']==9982
   page.evaluate('document.querySelector("#tryEnhance").onclick()');assert state()['gold']==9982
   assert not page.evaluate('sounds.some(s=>/enhance-success|enhance-break/.test(s.src))')
   page.locator(f'.enhance-result.{outcome}').wait_for(state='visible');assert page.evaluate('chargeEnded!==null');assert not page.evaluate('activeActivity')
   if sample:assert page.evaluate('(sample)=>sounds.some(s=>s.src.endsWith(sample+".mp3")&&s.time>=chargeEnded)',sample)
   else:assert not page.evaluate('sounds.some(s=>/enhance-success|enhance-break/.test(s.src))')
  seed(muted=True);page.locator('#tryEnhance').click();page.wait_for_timeout(250);assert not page.locator('dialog').is_visible();page.locator('.enhance-result.success').wait_for(state='visible');assert page.evaluate('sounds.length')==0
  seed();page.locator('#tryEnhance').click();page.locator('#sound').click();page.locator('.enhance-result.success').wait_for(state='visible');assert not page.evaluate('activeActivity')
  seed();page.locator('#tryEnhance').click();page.evaluate('renderHome()');page.wait_for_timeout(1500);assert not page.locator('dialog').is_visible();assert state()['weaponUp']==1;assert state()['gold']==9982;assert page.evaluate('[...mediaShots].every(e=>!e.audio.src.endsWith("enhance-charge.mp3"))')
  page.route('**/enhance-charge.mp3',lambda route:route.abort());seed();page.locator('#tryEnhance').click();page.locator('.enhance-result.success').wait_for(state='visible');assert not page.evaluate('activeActivity')
  assert not errors,errors;print('PASS: charge ends before result/window/audio, all outcomes, one roll/payment, mute and failed-audio fallback, leaving stops charge/no late dialog');b.close()
finally:server.shutdown();server.server_close()
