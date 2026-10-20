"""New-save owner naming and compatibility with existing slots."""
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844})
    page.set_default_timeout(7000)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:8000',wait_until='networkidle')
    page.locator('#start').click();page.locator('[data-slot="0"]').click()
    assert page.get_by_role('heading',name='집사 이름은?').is_visible()
    assert page.locator('#chunbae').count()==0
    page.locator('#ownerNext').click();assert page.locator('#ownerError').inner_text()
    page.locator('#ownerName').fill('   ');page.keyboard.press('Enter');assert page.locator('#ownerName').is_visible()
    assert page.evaluate('localStorage.getItem("petopia.slots")') is None
    page.locator('#ownerName').fill('  승식  ');page.keyboard.press('Enter')
    assert '승식' in page.locator('#chosenOwner').inner_text()
    page.locator('#back').click();assert page.locator('#ownerName').input_value()=='승식'
    page.locator('#back').click();page.locator('[data-slot="1"]').click()
    assert page.locator('#ownerName').input_value()==''
    page.locator('#ownerName').fill('<b>냥</b>');page.locator('#ownerNext').click()
    assert page.locator('#chosenOwner').inner_text()=='<b>냥</b> 집사와 함께할 친구'
    assert page.locator('#chosenOwner b').count()==0
    page.locator('#chunbae').click()
    page.locator('#skipIntro').click()
    saved=page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))')
    assert saved[0] is None and saved[1]['ownerName']=='<b>냥</b>'
    page.reload(wait_until='domcontentloaded');page.locator('#start').click()
    assert page.locator('[data-owner-slot="1"]').inner_text()=='집사 · <b>냥</b>'
    page.locator('[data-slot="1"]').click();assert page.locator('[data-menu]').count()==6
    assert page.locator('#ownerName').count()==0
    # Older saves without a name continue without losing progress.
    page.evaluate('()=>{let s=JSON.parse(localStorage.getItem("petopia.slots"));delete s[1].ownerName;s[1].gold=321;localStorage.setItem("petopia.slots",JSON.stringify(s))}')
    page.reload(wait_until='domcontentloaded');page.locator('#start').click();page.locator('[data-slot="1"]').click()
    assert page.locator('[data-menu]').count()==6
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[1].gold')==321
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert not errors,errors
    print('PASS: name gate, blank/whitespace validation, Enter submit, trimmed name, back-navigation, draft isolation, literal-safe display, saved reload, legacy save compatibility, mobile')
    browser.close()
