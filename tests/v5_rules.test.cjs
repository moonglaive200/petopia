const assert=require('node:assert/strict');require('../engine.js');require('../social.js');require('../action.js');const E=PetopiaEngine;let count=0;function test(name,fn){fn();count++;console.log('✓',name)}const fresh=(o={})=>E.normalize({eventDay:1,event:null,weather:'sun',...o});
test('gear migration, item-bound levels, exact 2x/5x gear-only stats',()=>{
 const s=fresh({weapon:1,weapons:[0,1,2],weaponUp:10,armor:1,armors:[0,1],armorUp:20});assert.equal(s.gearUp.weapon[1],10);assert.equal(E.gearMultiplier(10),2);assert.equal(E.gearMultiplier(20),5);assert.equal(E.stats(s).attack,8+6*2);assert.equal(E.stats(s).defense,1+3*5);assert.equal(E.stats(s).hp,80+16*5);E.purchase(s,'weapon',2);assert.equal(s.weaponUp,0);E.purchase(s,'weapon',1);assert.equal(s.weaponUp,10);for(let i=1;i<=20;i++)assert.ok(E.gearMultiplier(i)>E.gearMultiplier(i-1));
});
test('upgrade costs and probability boundaries, holds and destruction are atomic',()=>{
 for(const [level,cost,success,hold]of [[0,18,.9,.08],[5,36,.7,.2],[10,54,.5,.35]]){
  for(const [r,outcome]of [[success-.001,'success'],[success,'hold'],[success+hold-.001,'hold'],[success+hold+.001,'destroy']]){
   const s=fresh({gold:1000,weapon:1,weapons:[0,1,2],weaponUp:level,gearVersion:1,gearUp:{weapon:{1:level,2:4},armor:{}}});const result=E.enhance(s,'weapon',r);assert.equal(result.outcome,outcome);assert.equal(s.gold,1000-cost);assert.equal(s.gearUp.weapon[2],4);if(outcome==='destroy'){assert.equal(s.weapon,0);assert.equal(s.weapons.includes(1),false);assert.equal(s.weaponUp,0);}else assert.equal(s.weaponUp,level+(outcome==='success'?1:0));
  }
 }
 const s=fresh({gold:17,weapon:1,weapons:[0,1]});assert.equal(E.enhance(s,'weapon',0),null);assert.equal(s.gold,17);s.gold=100;s.weaponUp=20;s.gearUp.weapon[1]=20;assert.equal(E.enhance(s,'weapon',0),null);assert.equal(E.enhance(fresh(),'weapon',0),null);
});
test('romance entry is free, gifts cost zero and other actions cost25, failed preconditions cost nothing',()=>{
 const s=fresh({gold:10000,diamonds:10,romance:{kind:0,stage:0,affection:0},toys:[0],toyBag:{0:1}});E.normalize(s);assert.equal(s.energy,100);assert.ok(E.talk(s));assert.equal(s.energy,75);assert.equal(E.talk(s),false);assert.equal(s.energy,75);assert.ok(E.date(s,0));assert.equal(s.energy,50);assert.ok(E.feedTreat(s,0,true));assert.equal(s.energy,50);assert.ok(E.feedTreat(s,0));assert.equal(s.energy,50);s.daily.gift=0;assert.ok(E.giftToy(s,0));assert.equal(s.energy,50);s.energy=0;s.daily.talk=0;assert.equal(E.talk(s),false);assert.equal(s.energy,0);
 const c=fresh({diamonds:5,romance:{kind:0,stage:0,affection:3}});assert.equal(E.confess(c,false,.9),false);assert.equal(c.energy,75);assert.equal(c.diamonds,4);assert.equal(c.romance.affection,3);
});
test('healing weekend nap separate from outing, rain blocks park, drive/park30 and arcade5',()=>{
 const s=fresh({happiness:10,energy:0});assert.ok(E.nap(s));assert.equal(s.happiness,40);assert.equal(s.energy,0);assert.equal(E.nap(s),false);assert.equal(s.daily.walk,0);s.day=2;s.daily.nap=0;assert.equal(E.nap(s),false);s.day=7;assert.ok(E.nap(s));s.energy=100;s.weather='rain';const mood=s.happiness;assert.equal(E.park(s,0),null);assert.equal(s.energy,100);assert.equal(s.daily.walk,0);s.weather='sun';E.park(s,0);assert.equal(s.happiness,Math.min(100,mood+30));
 const d=fresh({happiness:0,vehicles:[0,1],romance:{kind:0,stage:0,affection:0}});assert.ok(E.drive(d));assert.equal(d.happiness,30);assert.equal(d.energy,75);const a=fresh({happiness:50});assert.ok(E.enterArcade(a));assert.equal(a.happiness,55);assert.equal(a.energy,75);assert.equal(E.enterArcade(a),false);
});
test('daily timing reservation, exact tolerance, reward ranges, duplicate settlement blocked',()=>{
 for(const [elapsed,success]of [[9.899,false],[9.9,true],[10,true],[10.1,true],[10.101,false]]){const s=fresh();assert.ok(E.startTiming(s,'x'));assert.equal(E.startTiming(s,'y'),false);assert.equal(E.finishTiming(s,'bad',elapsed),null);const r=E.finishTiming(s,'x',elapsed,()=>.99999);assert.equal(r.success,success);assert.equal(r.diamonds,success?10:0);assert.equal(r.toys.length,success?5:0);if(success)assert.equal(s.toyBag[9],5);assert.equal(E.finishTiming(s,'x',elapsed),null);assert.equal(E.startTiming(s,'next'),false);}
 const s=fresh();E.startTiming(s,'zero');const r=E.finishTiming(s,'zero',10,()=>0);assert.ok(r.success);assert.equal(r.diamonds,0);assert.equal(r.toys.length,0);
});
test('exact event distribution: illness1%, bath2%, grooming5% each, independent weather',()=>{
 const counts={none:0};for(let i=0;i<1000;i++){const s=fresh();let n=0;E.rollDay(s,()=>n++===0?.9:(i+.5)/1000);const id=s.event?.id??'none';counts[id]=(counts[id]||0)+1;assert.equal(s.weather,'sun');}for(let i=0;i<10;i++)assert.equal(counts[i],50);assert.equal(counts[10],10);assert.equal(counts[11],20);assert.equal(counts.none,430);
});
test('illness applies once, clamps energy/mood, ignores negative gold; grooming costs actual energy once',()=>{
 const s=fresh({gold:1000,happiness:100});let n=0;E.rollDay(s,()=>n++===0?.9:.505);assert.equal(s.event.id,10);assert.equal(s.gold,900);assert.equal(s.energy,25);assert.equal(s.happiness,25);E.normalize(s);assert.equal(s.gold,900);assert.equal(s.energy,25);
 const bad=fresh({gold:-100,happiness:50,energy:30});n=0;E.rollDay(bad,()=>n++===0?.9:.505);assert.equal(bad.gold,-100);assert.equal(bad.energy,0);assert.equal(bad.happiness,0);assert.ok(bad.hospital);
 for(const [id,cost,delta]of [[8,25,10],[9,25,10],[11,50,-10]]){const a=fresh({happiness:50,event:{id,resolved:false}});assert.ok(E.resolveEvent(a,'care'));assert.equal(a.energy,100-cost);assert.equal(a.happiness,50+delta);assert.equal(E.resolveEvent(a,'care'),false);}
});
test('star publication and fictional celebrity reward happen once and never cross-propagate bonus fans',()=>{
 const s=fresh({followers:100});const r=E.publishStar(s,0,()=>0);assert.equal(r.celebrity,'유재석');assert.equal(r.gain,58);assert.equal(r.bonus,15);assert.equal(s.followers,173);assert.equal(s.liveFollowers,11);assert.equal(s.happiness,100);assert.equal(s.energy,75);assert.equal(s.daily.star,1);assert.equal(E.publishStar(s,0,()=>0),null);assert.equal(s.followers,173);assert.equal(s.liveFollowers,11);assert.ok(E.useInfluence(s,'live'));assert.equal(s.energy,75);E.addFollowers(s,'live',100);assert.equal(s.followers,193);assert.equal(s.liveFollowers,111);assert.equal(s.feed.length,1);
 const a=fresh({treats:[0,0,0]});assert.equal(E.publishStar(a,1),null);assert.equal(a.energy,100);assert.equal(a.daily.star,0);
});
test('expanded content, channel-specific studio tiers and unique live situations',()=>{
 assert.equal(E.starTopics.length,16);assert.equal(E.celebrities.length,20);assert.equal(E.liveTopics.length,12);assert.equal(E.liveScenes.length,24);assert.ok(E.liveScenes.every(s=>s[1].length===4));for(const topic of E.liveTopics){const playlist=E.livePlaylist(topic,()=>0);assert.equal(playlist.length,4);assert.equal(new Set(playlist).size,4);}assert.equal(E.socialLevel(0).level,0);assert.equal(E.socialLevel(100000).level,5);assert.equal(E.socialLevel(5000).next.at,30000);
});
test('joker is always stage-one final boss and clearing it unlocks casino without healing consumption',()=>{
 for(const day of [1,2,9,28,112]){const a=new CatSurvival({hp:100,attack:8,defense:1},0,day,()=>.5);a.spawn(true,true);assert.equal(a.enemies[0].bossId,0);}
 const s=fresh();assert.equal(E.enterCasino(s),false);s.expedition={id:'boss'};E.settleSurvival(s,{id:'boss',time:190,kills:10,bossKills:[0],won:true});assert.ok(s.bossCleared);assert.ok(E.enterCasino(s));assert.equal(s.daily.walk,0);assert.equal(s.daily.casino,1);assert.equal(s.energy,75);
});
console.log(`PASS ${count} v5 feature groups`);
