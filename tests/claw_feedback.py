"""Exercise actual landing judgement and settlement with deterministic contact fixtures."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def instrument(route):
  response=route.fetch();body=response.text();needle='  function drop() {'
  fixture='''  window.clawFixture={contact(offset){x=200;y=235;phase="down";prizes.forEach((p,i)=>{p.x=i?450:200+offset;p.dir=0;});},positions(){return prizes.map(p=>p.x)}};
'''
  route.fulfill(response=response,body=body.replace(needle,fixture+needle,1))
 page.route('**/arcade.js',instrument);page.goto('http://127.0.0.1:8000')
 page.evaluate('''()=>{selectedSlot=0;slots[0]=E.normalize({introSeen:true,gold:1000,diamonds:10,eventDay:1,event:null});renderHome();}''');assert '주인 노동시키기' in page.locator('[data-menu="work"]').inner_text()
 page.locator('[data-menu="work"]').click();assert page.locator('h1').inner_text()=='주인 노동시키기'
 for offset,ok in [(6,True),(6.01,False)]:
  page.evaluate('renderArcade()');page.locator('[data-arcade="claw"]').click();page.wait_for_function('window.clawFixture');page.evaluate('(n)=>clawFixture.contact(n)',offset);page.locator('#clawFeedback:not([hidden])').wait_for()
  feedback=page.locator('#clawFeedback');assert ('CATCH!' if ok else 'fail..') in feedback.inner_text();assert page.locator('.claw-machine').evaluate('(e)=>e.classList.contains("is-failed")') is (not ok)
  page.wait_for_function('player().arcadeSession===null',timeout=12000);assert page.evaluate('player().diamonds')==11
  page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');page.locator('#clawExit').click();assert page.locator('[data-arcade="claw"]').is_visible()
 assert not errors,errors;print('PASS: renamed menu, exact +6 success / +6.01 fail boundary, big outcome effects, win-only reward once, mobile and return; no JS errors');b.close()
