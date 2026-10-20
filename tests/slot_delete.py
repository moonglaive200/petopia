"""Slot deletion safety and lobby label checks, in an isolated browser profile."""
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1280,'height':900})
    page.set_default_timeout(7000)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:8000',wait_until='networkidle')
    style=page.locator('.version').evaluate('(e)=>({opacity:getComputedStyle(e).opacity,size:getComputedStyle(e).fontSize,background:getComputedStyle(e).backgroundColor})')
    assert style['opacity']=='1' and style['size']=='14px'
    page.locator('#start').click()
    assert page.locator('[data-delete-slot]').count()==0
    for i in [0,1]:
        page.locator(f'[data-slot="{i}"]').click()
        page.locator("#ownerName").fill(f"집사{i + 1}")
        page.locator("#ownerNext").click()
        page.wait_for_function('document.querySelector("#chunbaeArt").complete && document.querySelector("#chunbaeArt").naturalWidth > 0')
        assert page.locator('#chunbaeArt').get_attribute('src')=='assets/chunbae-base-preview.png'
        page.locator('#chunbae').click()
        page.locator('#gameBack').click()
    before=page.evaluate('localStorage.getItem("petopia.slots")')
    assert page.locator('[data-delete-slot]').count()==2
    page.locator('[data-delete-slot="0"]').click()
    assert page.locator('dialog').is_visible()
    assert page.locator('#cancelSlotDelete').evaluate('(e)=>e===document.activeElement')
    assert page.locator('[data-slot]').count()==3
    page.locator('#cancelSlotDelete').click()
    assert page.evaluate('localStorage.getItem("petopia.slots")')==before
    page.locator('[data-delete-slot="0"]').click()
    page.keyboard.press('Escape')
    assert page.evaluate('localStorage.getItem("petopia.slots")')==before
    page.locator('[data-delete-slot="0"]').click()
    page.evaluate('()=>{window.realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new Error("quota")};}')
    page.locator('#confirmSlotDelete').click()
    assert page.locator('dialog').is_visible()
    assert page.evaluate('slots[0] !== null')
    assert page.evaluate('localStorage.getItem("petopia.slots")')==before
    page.evaluate('()=>{Storage.prototype.setItem=window.realSet;}')
    page.locator('#confirmSlotDelete').click()
    saves=page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))')
    assert saves[0] is None and saves[1] is not None
    assert page.locator('[data-delete-slot="0"]').count()==0
    assert page.locator('[data-delete-slot="1"]').count()==1
    page.reload(wait_until='domcontentloaded');page.locator('#start').click()
    assert '비어 있는 슬롯' in page.locator('[data-slot="0"]').inner_text()
    assert '춘배의 일상' in page.locator('[data-slot="1"]').inner_text()
    page.locator('[data-slot="0"]').click();page.locator("#ownerName").fill("새집사");page.locator("#ownerNext").click();page.locator('#chunbae').click()
    assert page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0]') is not None
    page.locator('#gameBack').click()
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.locator('#back').click();page.wait_for_timeout(600)
    assert page.locator('.version').is_visible()
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path='/tmp/petopia-version-mobile.png',full_page=True)
    assert not errors,errors
    print('PASS: deletion confirmation/cancel/Escape, save-failure rollback, isolated persistent deletion, slot reuse, mobile overflow, readable version label')
    browser.close()
