from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox']);page=b.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.goto('http://127.0.0.1:8000')
 page.evaluate('''()=>{selectedSlot=0;slots[0]=E.normalize({introSeen:true,eventDay:1,event:null,happiness:19});renderHome();}''')
 assert 'SPRING 1 (일)' in page.locator('.day-label').inner_text()
 assert '+20%' in page.locator('.happiness-bonus-note').inner_text()
 box=page.locator('.stats-six').evaluate('(e)=>{const s=getComputedStyle(e);return [s.borderTopWidth,s.backgroundColor,s.paddingTop]}');assert box==['0px','rgba(0, 0, 0, 0)','0px'],box
 assert page.locator('.stats-six>div').evaluate_all('(els)=>els.every(e=>getComputedStyle(e).borderTopWidth==="2px")')
 page.locator('#calendarButton').click();assert page.locator('.calendar-weekdays span').all_text_contents()==['일','월','화','수','목','금','토'];assert page.locator('.calendar-grid .sunday').count()==4;assert page.locator('.calendar-grid .saturday').count()==4;page.locator('dialog .btn').click()
 page.locator('[data-menu="dungeon"]').click();assert page.locator('#enterSurvival').is_disabled();assert '행복도 20 이상' in page.locator('#enterSurvival').inner_text()
 page.evaluate('startSurvival(0)');assert page.evaluate('player().energy===100 && player().daily.dungeon===0 && player().expedition===null')
 page.evaluate('player().happiness=20;renderDungeons()');assert page.locator('#enterSurvival').is_enabled();page.locator('#enterSurvival').click();assert page.locator('#survivalCanvas').is_visible();assert page.evaluate('player().energy===50 && player().daily.dungeon===1')
 assert not errors,errors;print('PASS: weekday calendar, clean single card borders, bonus note, happiness 19 rejected without charge (including direct call), happiness 20 entry accepted')
 b.close()
