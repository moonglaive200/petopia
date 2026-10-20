from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:8000')
 page.evaluate('''()=>{selectedSlot=0;slots[0]=E.normalize({introSeen:true,gold:100000,eventDay:1,event:null});const s=player();E.trade(s,'stock',0,'buy',2);E.trade(s,'coin',0,'buy',3);s.market.stock[0]=1;s.market.coin[0]=0;renderInvest('stock');}''')
 assert page.locator('[data-trade="0:buy"]').is_disabled();assert page.locator('[data-trade="0:sell"]').is_disabled();assert 'SPRING 4' in page.locator('.listing-status').first.inner_text();assert page.evaluate('player().stocks[0]')==2
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.reload();page.locator('#start').click();page.locator('[data-slot="0"]').click();assert page.evaluate('player().marketStatus.stock[0].relistDay')==4
 for expected in [2,3,4]:
  page.evaluate('player().energy=25;renderHome()')
  page.locator('#dayButton').click();page.locator('dialog .btn').click();page.wait_for_function('(day)=>player().day===day',arg=expected);assert page.evaluate('player().day')==expected
  if expected==2:assert '상장폐지' in page.locator('.day-ledger').inner_text()
  if expected==4:assert '재상장' in page.locator('.day-ledger').inner_text()
  page.locator('#startNewDay').click()
 assert page.evaluate('player().stocks[0]===0&&player().coinHoldings[0]===0&&E.listing(player(),"stock",0)===null&&player().market.stock[0]===E.companies[0].stock&&player().market.coin[0]===E.coins[0].base')
 page.locator('[data-menu="bank"]').click();page.locator('[data-bank="spend"]').click();page.locator('[data-invest="stock"]').click();assert page.locator('[data-trade="0:buy"]').is_enabled();page.locator('[data-trade="0:buy"]').click();assert page.evaluate('player().stocks[0]')==1
 assert not errors,errors;print('PASS: stock1G/coin0G halt visible, persisted crash deadline on reload, next-day deletion, day-three base-price relisting, no holdings restored, new purchase and mobile; no JS errors');b.close()
