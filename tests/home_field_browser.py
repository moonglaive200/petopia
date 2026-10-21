"""Landscape home controls, persistence, menus and real existing-game transitions."""
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
  b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page(viewport={'width':1440,'height':900});page.set_default_timeout(8000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept());url=f'http://127.0.0.1:{server.server_port}';page.add_init_script('Math.random=()=>.9');page.goto(url)
  def state():return page.evaluate('structuredClone(player())')
  def seed(**values):
   o={'introSeen':True,'ownerName':'승식','eventDay':1,'event':None,'weather':'sun','logs':[{'day':1,'text':'저장한 기록'}]};o.update(values)
   page.evaluate('(o)=>{if(modal.open)modal.close();cleanupView();selectedSlot=0;slots[0]=E.normalize(o);renderHome()}',o);page.wait_for_function('player().homeField!==null')
  def home():page.evaluate('renderHome()')
  def drawer():
   if page.locator('#fieldMenuToggle').get_attribute('aria-expanded')=='false':page.locator('#fieldMenuToggle').click()
  def menu(key):drawer();page.locator(f'[data-menu="{key}"]').click()
  def utility(key):drawer();page.locator(f'[data-utility="{key}"]').click()
  def close():page.locator('dialog .btn').click();page.wait_for_timeout(100)
  seed();assert page.evaluate('document.body.dataset.view')=='field';assert not page.locator('#fieldDrawer').is_visible();assert page.locator('#homeFieldCanvas').bounding_box()=={'x':0,'y':0,'width':1440,'height':900};start=state();tip=page.locator('#guideText').text_content()
  # Real movement and animation input do not consume game resources.
  page.keyboard.down('KeyD');page.wait_for_timeout(450);page.keyboard.up('KeyD');moved=state();assert moved['homeField']['x']>start['homeField']['x']+40;assert moved['homeField']['facing']==2
  page.keyboard.down('KeyW');page.wait_for_timeout(300);page.keyboard.up('KeyW');assert state()['homeField']['y']<moved['homeField']['y'];assert state()['homeField']['facing']==3
  for k in ['gold','diamonds','energy','happiness','day','daily']:assert state()[k]==start[k],k
  # Drawer opens/closes, blocks movement while browsing, and the guide/record remain accessible.
  drawer();pos=state()['homeField'];page.keyboard.down('KeyD');page.wait_for_timeout(250);page.keyboard.up('KeyD');assert state()['homeField']==pos;assert '저장한 기록' in page.locator('#activityLog').text_content();assert page.locator('#guideText').text_content()==tip;page.keyboard.press('Escape');page.wait_for_timeout(260);assert not page.locator('#fieldDrawer').is_visible();page.keyboard.press('KeyM');assert page.locator('#fieldMenuToggle').get_attribute('aria-expanded')=='true';page.locator('#fieldMenuClose').click();page.wait_for_timeout(260)
  # Click-to-walk and mouse-operated touch pad use the same model.
  seed();before=state()['homeField']['x'];page.locator('#homeFieldCanvas').click(position={'x':920,'y':477});page.wait_for_timeout(450);assert state()['homeField']['x']>before;page.keyboard.down('ArrowLeft');page.wait_for_timeout(100);page.keyboard.up('ArrowLeft');page.wait_for_timeout(50)
  button=page.locator('[data-field-move="down"]');box=button.bounding_box();page.mouse.move(box['x']+box['width']/2,box['y']+box['height']/2);before=state()['homeField']['y'];page.mouse.down();page.wait_for_timeout(250);page.mouse.up();assert state()['homeField']['y']>before,(before,state()['homeField'],page.evaluate('document.elementFromPoint(70,800)?.outerHTML'));before=state()['homeField'];page.wait_for_timeout(250);assert state()['homeField']==before
  # Save the actual position through menu transitions and reload; only this slot is affected.
  menu('bank');assert page.locator('h1').inner_text()=='펫은행';assert page.evaluate('document.body.dataset.view') is None;page.locator('#gameBack').click();assert state()['homeField']==before;page.reload();page.locator('#start').click();page.locator('[data-slot="0"]').click();assert state()['homeField']==before
  page.evaluate('slots[1]=E.normalize({introSeen:true,eventDay:1,gold:12});selectedSlot=1;room()');assert state()['homeField']['x']==960;assert state()['gold']==12;page.evaluate('selectedSlot=0;room()');assert state()['homeField']==before
  # All eight house fields and marriage render, and switching houses starts at a safe location.
  signatures=[]
  for house in range(8):
   seed(house=house,houses=list(range(8)),weather='rain' if house%2==0 else 'sun',romance={'kind':0,'name':'햇살냥','stage':2,'affection':7});page.wait_for_timeout(120);assert page.locator('#fieldHouseName').inner_text()==page.evaluate('E.houses[player().house].name');signatures.append(page.locator('#homeFieldCanvas').evaluate('(c)=>c.toDataURL().length'));assert page.evaluate('new HomeFieldModel(player().house,player().homeField,true).partner!==null')
  assert len(set(signatures))>=6,signatures
  page.screenshot(path='/tmp/petopia-field-palace.png',full_page=True)
  # Each old main/utility route is still usable from the panel, with a working return to the field.
  seed(gold=100000,diamonds=10,romance={'kind':0,'name':'치즈','stage':1,'affection':3})
  for key in ['dungeon','romance','idle','influencer','work','walk','gambling','bank']:
   menu(key);assert page.locator('h1').is_visible(),key;assert page.evaluate('document.body.dataset.view') is None;page.locator('#gameBack').click();assert page.locator('#homeFieldCanvas').is_visible();assert not page.locator('#fieldDrawer').is_visible()
  for key in ['mart','inventory','hospital']:
   utility(key);assert page.locator('h1').is_visible();page.locator('#gameBack').click();assert page.locator('#homeFieldCanvas').is_visible()
  utility('settings');assert page.locator('dialog').is_visible();page.locator('#closeSettings').click();assert page.locator('#homeFieldCanvas').is_visible()
  # Happiness once/day, calendar, modal input freeze, sounds and daily event controls.
  seed(happiness=69,energy=0);page.locator('#petChunbae').click();assert state()['happiness']==74;assert page.locator('#petChunbae').is_disabled();assert state()['energy']==0
  page.locator('#calendarButton').click();pos=state()['homeField'];page.keyboard.down('KeyD');page.wait_for_timeout(200);page.keyboard.up('KeyD');assert state()['homeField']==pos;close();page.locator('#fieldSound').click();assert page.evaluate('sound')==False;page.locator('#fieldSound').click();assert page.evaluate('sound')==True
  drawer();page.locator('#dayButton').click();assert page.locator('.scene-sleep').is_visible();close();page.locator('#startNewDay').click();assert state()['day']==2;assert page.locator('#petChunbae').is_enabled()
  seed(event={'id':8,'resolved':False},energy=100,happiness=50);drawer();page.locator('[data-event="care"]').click();assert state()['energy']==75;assert state()['happiness']==60;assert page.locator('#fieldMenuToggle').get_attribute('aria-expanded')=='true';assert page.locator('[data-event="care"]').count()==0
  # An actual Live and survival still settle and clean up before returning home.
  seed(romance={'kind':0,'name':'치즈','stage':0,'affection':0});menu('influencer');page.locator('[data-social="live"]').click();page.locator('#startLive').click()
  for _ in range(4):page.locator('[data-choice="0"]').click();page.wait_for_timeout(1400)
  close();assert state()['lastLive']['gold']>0;home();menu('dungeon');page.locator('#enterSurvival').click();page.keyboard.down('KeyD');page.wait_for_timeout(250);page.keyboard.up('KeyD');page.locator('#gameBack').click();assert state()['expedition'] is None;page.locator('#gameBack').click();assert page.locator('#homeFieldCanvas').is_visible()
  # Full viewport and drawer scrolling in desktop, phone landscape and usable portrait.
  for width,height in [(1440,900),(1024,768),(844,390),(667,375),(390,844),(320,568)]:
   page.set_viewport_size({'width':width,'height':height});home();page.wait_for_timeout(120);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,height);assert page.evaluate('document.documentElement.scrollHeight<=innerHeight'),(width,height);rect=page.locator('#homeFieldCanvas').bounding_box();assert round(rect['width'])==width and round(rect['height'])==height;drawer();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.locator('#fieldMenuClose').click();page.wait_for_timeout(260)
   if width==844:page.screenshot(path='/tmp/petopia-field-phone.png',full_page=True)
  # Real touch capture on a phone: no page scrolling and no stuck movement after release.
  touch=b.new_page(viewport={'width':844,'height':390},has_touch=True);touch.goto(url);touch.evaluate('selectedSlot=0;slots[0]=E.normalize({introSeen:true,eventDay:1});renderHome()');touch.wait_for_function('player().homeField!==null');box=touch.locator('[data-field-move="right"]').bounding_box();session=touch.context.new_cdp_session(touch);session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':box['x']+15,'y':box['y']+15}]});touch.wait_for_timeout(300);session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});p1=touch.evaluate('structuredClone(player().homeField)');assert p1['x']>960;touch.wait_for_timeout(250);assert touch.evaluate('player().homeField.x')==p1['x'];touch.close()
  assert not errors,errors;print('PASS: fullscreen field, keyboard/click/touch movement and saves, drawer/keys/modal isolation, 8 homes/marriage, all main/utility menus, pet/calendar/day/event, Live/survival cleanup, 6 viewport sizes, zero economy changes from movement; no JS errors');b.close()
finally:server.shutdown();server.server_close()
