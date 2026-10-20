"""Run against python -m http.server 8000 in the repository. Uses an isolated browser profile."""
from playwright.sync_api import sync_playwright
import json
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=b.new_page(viewport={'width':1440,'height':1100})
    page.set_default_timeout(7000)
    errors=[]
    page.on('pageerror',lambda e: errors.append(str(e)))
    page.on('dialog',lambda d:d.accept())
    def goto_home():
        page.reload(wait_until='domcontentloaded');page.locator('#start').click();page.locator('.slot').first.click()
    def state():return page.evaluate('JSON.parse(localStorage.getItem("petopia.slots"))[0]')
    def seed(**kw):
        data=state();data.update(kw);page.evaluate('(s)=>localStorage.setItem("petopia.slots",JSON.stringify([s]))',data);goto_home()
    def menu(name):page.locator(f'[data-menu="{name}"]').click()
    def back():page.locator('#gameBack').click()
    page.goto('http://127.0.0.1:8000',wait_until='domcontentloaded')
    assert page.locator('.logo').inner_text()=='PETOPIA'
    assert page.evaluate('document.fonts.check("16px Neo")')
    page.locator('#start').click();assert page.locator('.slot').count()==3
    page.locator('.slot').first.click()
    page.locator('#ownerName').fill('승식');page.locator('#ownerNext').click();assert page.locator('.character:disabled').count()==1
    page.locator('#chunbae').click();assert page.locator('[data-menu]').count()==9
    page.screenshot(path='/tmp/petopia-v2-home.png',full_page=True)
    menu('star');page.locator('#postStar').click();assert state()['daily']['star']==1;assert page.locator('#postStar').is_disabled();assert state()['liveFollowers']>0
    back();menu('live');page.locator('#startLive').click()
    for _ in range(3):page.locator('[data-choice="0"]').click()
    page.locator('dialog .btn').click();assert state()['lastLive']['gold']>0;assert page.locator('#startLive').is_disabled()
    back();menu('walk');page.locator('[data-dest="park"]').click();page.locator('dialog .btn').click();assert state()['daily']['walk']==1
    page.locator('[data-dest="park"]').click();page.locator('dialog .btn').click();assert state()['daily']['walk']==2;assert page.locator('[data-dest="park"]').is_disabled()
    back();menu('work');page.locator('[data-job="0"]').click();assert state()['working']==0
    back();assert page.locator('[data-menu="dungeon"]').is_disabled()
    page.locator('#dayButton').click();page.locator('dialog .btn').click();assert state()['working'] is None;assert state()['day']==2;assert state()['daily']['walk']==0
    seed(gold=50000,diamonds=200,happiness=90,hospital=False,working=None,energy=100)
    menu('mart');assert page.locator('[data-mart]').count()==3
    page.locator('[data-buy="weapon:1"]').click();assert state()['weapon']==1
    page.locator('[data-upgrade="weapon"]').click();assert state()['weaponUp']==1
    page.locator('[data-mart="treat"]').click();page.locator('[data-buy="treat:1"]').click();assert state()['treats'][1]==1
    page.locator('[data-mart="vehicle"]').click();page.locator('[data-buy="vehicle:0"]').click();assert 0 in state()['vehicles']
    back();menu('walk');assert page.locator('[data-dest="drive"]').is_enabled();assert page.locator('[data-dest="casino"]').is_disabled()
    page.locator('[data-dest="drive"]').click();page.locator('dialog .btn').click()
    back();menu('bank');page.locator('[data-bank="house"]').click();page.locator('[data-buy="house:3"]').click();assert state()['house']==3
    back();back();assert page.locator('.house-3').count()==1
    menu('bank');page.locator('[data-bank="spend"]').click();page.locator('[data-invest="stock"]').click();assert page.locator('.market-row').count()==10
    page.locator('[data-trade="0:buy"]').click();assert state()['stocks']['0']==1
    page.locator('[data-trade="0:sell"]').click();assert state()['stocks']['0']==0
    back();page.locator('[data-invest="company"]').click();assert page.locator('.shop-card').count()==10
    page.locator('[data-buy="company:0"]').click();assert 0 in state()['companies']
    back();back();page.locator('[data-bank="loan"]').click();page.locator('#borrow').click();assert len(state()['loans'])==1
    page.locator('[data-repay="0"]').click();assert len(state()['loans'])==0
    seed(hospital=True,happiness=0,gold=0)
    menu('hospital');page.locator('#healPet').click();assert not state()['hospital'];assert len(state()['loans'])==1;assert state()['gold']==0
    seed(gold=5000,diamonds=50,level=15,weapon=2,armor=2,energy=100,happiness=90,cleared=9,bossCleared=True,daily={'walk':0,'dungeon':0,'star':0,'toy':0})
    menu('walk');page.locator('[data-dest="arcade"]').click();assert page.locator('[data-arcade]').count()==3
    page.locator('[data-arcade="claw"]').click();assert page.locator('#clawCanvas').is_visible()
    page.locator('#clawDrop').click();page.wait_for_function('JSON.parse(localStorage.getItem("petopia.slots"))[0].arcadeSession === null',timeout=10000);assert state()['arcadeSession'] is None
    page.locator('#clawExit').click();page.locator('[data-arcade="rhythm"]').click();page.locator('#rhythmStart').click();page.keyboard.press('KeyD');assert page.locator('#rhythmCanvas').is_visible();back()
    page.locator('[data-arcade="hex"]').click();frame=page.frame_locator('#hexFrame');assert frame.locator('#start').is_visible()
    assert page.locator('#hexFrame').get_attribute('src').startswith('games/hex.html?session=')
    frame.locator('#start').click();page.wait_for_timeout(300);assert frame.locator('#overlay').is_hidden();back();back()
    page.locator('[data-dest="casino"]').click();page.locator('[data-casino="roulette"]').click();page.locator('[data-color="green"]').click();page.locator('#spinRoulette').click();assert page.locator('#spinRoulette').is_disabled();page.wait_for_timeout(2500);assert page.locator('#spinRoulette').is_enabled();assert '이번 판' in page.locator('#rouletteResult').inner_text() or '지급' in page.locator('#rouletteResult').inner_text();back()
    page.locator('[data-casino="slot"]').click();page.locator('#spinSlot').click();page.wait_for_timeout(1200);assert page.locator('#spinSlot').is_enabled()
    seed(energy=100,daily={'walk':0,'dungeon':0,'star':0,'toy':0})
    menu('dungeon');page.locator('[data-dungeon="0"]').click();assert page.locator('#actionCanvas').is_visible()
    before=page.screenshot(path='/tmp/petopia-v2-dungeon.png')
    page.keyboard.down('KeyD');page.keyboard.down('KeyJ');page.wait_for_timeout(2100);page.keyboard.up('KeyD');page.wait_for_timeout(4000);page.keyboard.up('KeyJ')
    if page.locator('#afterBattle').count():page.locator('#afterBattle').click()
    else:back()
    # Reload recovery marks interrupted expeditions as hospital visits.
    seed(expedition={'index':0,'boss':False},hospital=False)
    assert state()['hospital'] and state()['expedition'] is None
    seed(expedition=None,hospital=False,gold=50000,happiness=90,energy=100,daily={'walk':0,'dungeon':0,'star':0,'toy':0})
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path='/tmp/petopia-v2-mobile.png',full_page=True)
    for name in ['mart','toys','work','star','live','bank','hospital','dungeon','walk']:
        menu(name);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),name;back()
    menu('dungeon');page.locator('[data-dtab="boss"]').click();page.locator('#enterBoss').click();page.wait_for_timeout(150)
    assert page.locator('#bossHP').get_attribute('max')=='650';assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.locator('#pauseArena').click();assert page.locator('#resumeArena').is_visible();page.locator('#resumeArena').click();back()
    assert not errors,errors
    print('PASS: lobby/slots, daily caps, cross-followers, Live choices, work lock/payday, equipment/churu/car, housing, market/companies, loans/hospital, claw/rhythm/HEX, roulette/slots, WASD combat/recovery, nine mobile menus, boss/pause; no JS errors')
    b.close()
