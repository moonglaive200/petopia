"""Live audience ratio, animated bounded chat, scene continuity and timer cleanup."""
import threading
from functools import partial
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright
class Quiet(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(Path(__file__).resolve().parents[1])));threading.Thread(target=server.serve_forever,daemon=True).start()
try:
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':1000});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());page.goto(f'http://127.0.0.1:{server.server_port}')
  page.evaluate('()=>{const original=mountLiveChat;mountLiveChat=function(state,topic){window.audienceState=state;window.audience=original(state,topic);return audience;};Math.random=()=>.9;}')
  def seed(fans=123):page.evaluate('(fans)=>{if(modal.open)modal.close();cleanupView();selectedSlot=0;slots[0]=E.normalize({introSeen:true,eventDay:1,happiness:50,liveFollowers:fans});renderHome()}',fans)
  def state():return page.evaluate('structuredClone(player())')
  seed();assert page.locator('[data-menu]').evaluate_all('(els)=>els.map(e=>e.dataset.menu)')==['dungeon','romance','idle','influencer','work','walk','gambling','bank'];page.locator('[data-menu="influencer"]').click();page.locator('[data-social="live"]').click();assert page.locator('.live-chat-wait').is_visible();assert '12명' in page.locator('.live-viewers').inner_text();page.locator('#startLive').click();assert page.locator('#liveStreamViewers').inner_text()=='12';assert page.locator('#liveViewerCount').inner_text()=='12';assert page.locator('.live-chat-message').count()==4
  page.evaluate('()=>{window.gameRolls=0;Math.random=()=>{gameRolls++;return .9;}}');page.wait_for_function('document.querySelectorAll(".live-chat-message").length>=5');assert page.evaluate('gameRolls')==0;assert state()['energy']==75;assert state()['gold']==80;assert state()['liveFollowers']==123
  stage=page.locator('#onairStage').bounding_box();chat=page.locator('.live-chat-panel').bounding_box();assert chat['x']>=stage['x']+stage['width'];color=page.locator('.live-viewers').evaluate('(e)=>getComputedStyle(e).color');assert color=='rgb(255, 119, 125)',color
  first=page.locator('.live-chat-message').first.inner_text();page.locator('[data-choice="0"]').click();assert page.locator('.chat-reaction').count()>=2;page.wait_for_timeout(1400);assert page.locator('.live-chat-message').first.inner_text()==first;assert page.locator('#liveStreamViewers').inner_text()=='12'
  # Real append API, bounded memory/DOM and user-controlled scrolling.
  page.evaluate('for(let i=0;i<55;i++)audience.reaction("테스트 반응 "+i)');assert page.locator('.live-chat-message').count()==40;assert page.evaluate('audienceState.messages.length')==40;page.locator('#liveChatMessages').evaluate('(e)=>e.scrollTop=0');page.evaluate('audience.reaction("새 메시지")');assert page.locator('#liveChatJump').is_visible();page.locator('#liveChatJump').click();assert page.locator('#liveChatJump').is_hidden();assert page.locator('#liveChatMessages').evaluate('(e)=>e.scrollHeight-e.scrollTop-e.clientHeight<4')
  # Four scenes still settle once and store the original live audience count.
  for _ in range(3):page.locator('[data-choice="0"]').click();page.wait_for_timeout(1400)
  page.locator('dialog').wait_for(state='visible');assert state()['lastLive']['viewers']==12;assert state()['energy']==75;assert state()['gold']>80;page.locator('dialog .btn').click();assert page.locator('.live-chat-wait').is_visible();old=page.evaluate('audienceState.messages.length');page.wait_for_timeout(1700);assert page.evaluate('audienceState.messages.length')==old;assert page.locator('#startLive').is_disabled()
  # Mobile: chat is below the stage. Fewer than ten followers means zero, not a fake minimum.
  seed(9);page.set_viewport_size({'width':390,'height':844});page.evaluate('renderLive()');page.locator('#startLive').click();assert page.locator('#liveStreamViewers').inner_text()=='0';assert '집사봇' in page.locator('#liveChatMessages').inner_text();stage=page.locator('#onairStage').bounding_box();chat=page.locator('.live-chat-panel').bounding_box();assert chat['y']>=stage['y']+stage['height'];assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.screenshot(path='/tmp/petopia-live-chat-mobile.png',full_page=True)
  # Leaving an unfinished stream stops cosmetic timers and never pays completion rewards.
  held=page.evaluate('audienceState.messages.length');page.locator('#gameBack').click();page.wait_for_timeout(1800);assert page.evaluate('audienceState.messages.length')==held;assert state()['gold']==80;assert state()['lastLive'] is None
  seed(12345);page.set_viewport_size({'width':1440,'height':1000});page.evaluate('renderLive()');page.locator('#startLive').click();assert page.locator('#liveStreamViewers').inner_text()=='1,234';page.wait_for_timeout(350);page.screenshot(path='/tmp/petopia-live-chat-desktop.png',full_page=True)
  assert not errors,errors;print('PASS: menu swap; exact 1/10 red left audience; right/below chat, continuous messages, 40-row cap, scroll control, scene history, no random/game rewards from chat, completion/abort cleanup');b.close()
finally:server.shutdown();server.server_close()
