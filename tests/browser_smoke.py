from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1100})
    page.set_default_timeout(7000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:8000',wait_until='domcontentloaded')
    page.locator('#start').click()
    assert page.locator('.slot').count()==3
    page.locator('.slot').first.click()
    assert page.get_by_role('button',name='오레오 개발 중').is_disabled()
    page.locator('#chunbae').click()
    assert page.locator('#homeArt').is_visible()
    assert page.locator('[data-menu]').count()==7
    page.screenshot(path='/tmp/petopia-home.png',full_page=True)
    page.locator('[data-menu="dungeon"]').click()
    assert page.locator('[data-dungeon]').count()==10
    assert page.locator('[data-dungeon="1"]').is_disabled()
    page.locator('[data-dungeon="0"]').click()
    initial=page.locator('.enemy .health-label').inner_text()
    page.wait_for_timeout(200)
    assert page.locator('.enemy .health-label').inner_text()==initial
    page.locator('[data-action="heavy"]').click()
    assert page.locator('[data-action="heavy"]').is_disabled()
    assert '24 / 40' in page.locator('.enemy .health-label').inner_text()
    while not page.locator('.battle-result').count():
        page.locator('[data-action="attack"]').click()
    assert page.get_by_text('정복 성공!',exact=True).is_visible()
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0].gold')==124
    page.locator('#retreat').click()
    assert not page.locator('[data-dungeon="1"]').is_disabled()
    page.locator('#gameBack').click()
    page.locator('[data-menu="equipment"]').click()
    page.locator('[data-upgrade="weapon"]').click()
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0].weaponUp')==1
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0].gold')==64
    page.locator('#gameBack').click()
    page.locator('[data-menu="walk"]').click()
    page.locator('#takeWalk').click()
    first=page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0]')
    page.locator('#takeWalk').click()
    again=page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0]')
    assert first['gold']==again['gold'] and first['walks']==again['walks']==1
    for menu,action in [('work','#doActivity'),('broadcast','#doActivity'),('petstar','#doActivity')]:
        page.locator('#gameBack').click()
        page.locator(f'[data-menu="{menu}"]').click()
        page.locator(action).click()
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0].followers')>=25
    page.locator('#gameBack').click();page.locator('[data-menu="bank"]').click()
    for _ in range(4):page.locator('#borrow').click()
    assert page.locator('#borrow').is_disabled()
    page.locator('#repay').click()
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0].debt')==150
    page.locator('#gameBack').click();page.locator('[data-menu="equipment"]').click()
    before=page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0].gold')
    page.locator('[data-buy="weapon"][data-index="1"]').click()
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0].gold')==before-180
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0].weapon')==1
    page.locator('[data-buy="weapon"][data-index="0"]').click()
    page.locator('[data-buy="weapon"][data-index="1"]').click()
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0].gold')==before-180
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0].weaponUp')==1
    page.reload(wait_until='domcontentloaded');page.locator('#start').click();page.locator('.slot').first.click()
    assert page.locator('.status-strip').inner_text().find('1 / 10')>=0
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0].debt')==150
    # A separate save keeps progress and currency isolated.
    page.locator('#gameBack').click();page.locator('.slot').nth(1).click();page.locator('#chunbae').click()
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[1].gold')==80
    page.set_viewport_size({'width':390,'height':844})
    for menu in ['dungeon','equipment','walk','petstar','bank']:
        page.locator(f'[data-menu="{menu}"]').click()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),menu
        page.locator('#gameBack').click()
    page.screenshot(path='/tmp/petopia-mobile.png',full_page=True)
    # Import a late-game state to exercise final-boss victory UI.
    page.evaluate('''() => {let saves=JSON.parse(localStorage.getItem('petopia.slots'));Object.assign(saves[1],{level:15,cleared:9,weapon:2,armor:2,weaponUp:3,armorUp:3,energy:100,gold:1000,weapons:[0,1,2],armors:[0,1,2]});localStorage.setItem('petopia.slots',JSON.stringify(saves))}''')
    page.reload(wait_until='domcontentloaded');page.locator('#start').click();page.locator('.slot').nth(1).click()
    page.locator('[data-menu="dungeon"]').click();page.locator('[data-dungeon="9"]').click()
    page.screenshot(path='/tmp/petopia-combat.png',full_page=True)
    while not page.locator('.battle-result').count():
        page.locator('[data-action="heavy"]' if page.locator('[data-action="heavy"]').is_enabled() else '[data-action="attack"]').click()
    assert page.get_by_text('월세까지 정복!',exact=True).is_visible()
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[1].cleared')==10
    assert not errors,errors
    print('PASS: home, 3 slots, locked character, 10 dungeons, manual combat, first victory/unlocks, shop, cooldown, money activities, fame, bank cap, persistence, isolated saves, mobile layouts, final boss; no JS errors')
    browser.close()
