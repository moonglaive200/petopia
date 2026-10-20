"""Real trade buttons update capacity; late housing fixtures verify diamond gating."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:8000');page.evaluate('''()=>{selectedSlot=0;slots[0]=E.normalize({introSeen:true,gold:10000,stocks:{0:2},coinHoldings:{0:3},eventDay:1,event:null});renderInvest('stock');}''')
 def capacity(side):return page.locator(f'[data-capacity="0:{side}"] strong').inner_text()
 assert capacity('buy')=='5주';assert capacity('sell')=='2주';page.locator('[data-trade="0:buy"]').click();assert capacity('buy')=='4주';assert capacity('sell')=='3주';page.locator('[data-trade="0:sell"]').click();assert capacity('sell')=='2주'
 page.evaluate('renderInvest("coin")');assert capacity('buy')=='141개';assert capacity('sell')=='3개';page.locator('[data-trade="0:buy"]').click();assert capacity('sell')=='4개'
 page.set_viewport_size({'width':390,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.evaluate('player().market.coin[0]=1;renderInvest("coin")');assert capacity('buy')=='0개';assert capacity('sell')=='0개';assert page.locator('[data-trade="0:buy"]').is_disabled();assert page.locator('[data-trade="0:sell"]').is_disabled();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.evaluate('''()=>{slots[0]=E.normalize({introSeen:true,gold:1000000,diamonds:79,eventDay:1,event:null});renderBank('house');}''');assert page.locator('.house-grid .shop-card').count()==8;assert page.locator('[data-buy="house:7"]').is_disabled();assert '80' in page.locator('[data-buy="house:7"]').inner_text()
 page.evaluate('player().diamonds=80;renderBank("house")');page.locator('[data-buy="house:7"]').click();assert page.evaluate('player().house===7&&player().gold===0&&player().diamonds===0');page.locator('#gameBack').click();page.locator('#gameBack').click();assert page.locator('.pet-stage.house-7').is_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth');assert not errors,errors
 print('PASS: stock/coin buy and sell capacities refresh after trades, halted counts zero, eight houses and exact diamond gate/charge, new room background, mobile; no JS errors');b.close()
