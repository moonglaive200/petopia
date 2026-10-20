const assert=require('node:assert/strict');
require('../engine.js');
const E=PetopiaEngine;
function fresh(overrides={}){return E.normalize({...overrides})}
function win(s,index){const b=E.begin(s,index);assert.ok(b);while(!b.done&&b.turn<100)E.act(s,b,b.skill?'attack':'heavy');assert.equal(b.result.won,true);return b}
{
 const old={character:'chunbae',createdAt:'2026-10-20'};E.normalize(old);assert.equal(old.gold,80);assert.equal(old.character,'chunbae');
 old.energy=50;old.energyAt=1000;E.normalize(old,121000);assert.equal(old.energy,60);E.normalize(old,121000);assert.equal(old.energy,60);
}
{
 const s=fresh();assert.equal(E.begin(s,1),null);assert.equal(E.begin(s,-1),null);s.energy=9;assert.equal(E.begin(s,0),null);assert.equal(s.energy,9);
}
{
 const s=fresh();const b=E.begin(s,0);assert.equal(s.energy,90);assert.equal(b.enemyHP,40);const first=E.act(s,b,'heavy');assert.equal(first.dealt,16);assert.equal(b.skill,3);const turn=b.turn;assert.equal(E.act(s,b,'heavy'),null);assert.equal(b.turn,turn);E.act(s,b,'attack');E.act(s,b,'attack');E.act(s,b,'attack');assert.equal(b.skill,0);
 assert.equal(b.result.won,true);assert.equal(s.cleared,1);assert.equal(s.gold,124);assert.equal(s.xp,48);const gold=s.gold;assert.equal(E.act(s,b,'attack'),null);assert.equal(s.gold,gold);
 const repeat=win(s,0);assert.equal(repeat.result.gold,22);assert.equal(repeat.result.first,false);
}
{
 const s=fresh({gold:18});const b=E.begin(s,0);assert.equal(E.act(s,b,'heal'),null);b.hp=10;E.act(s,b,'heal');assert.equal(s.gold,0);assert.equal(b.hp,49);assert.equal(E.act(s,b,'heal'),null);
}
{
 const s=fresh({level:1,cleared:9});const b=E.begin(s,9),gold=s.gold,xp=s.xp;while(!b.done)E.act(s,b,'attack');assert.equal(b.result.won,false);assert.equal(s.gold,gold);assert.equal(s.xp,xp);assert.equal(s.cleared,9);
}
{
 for(let i=0;i<10;i++){
  const s=fresh({level:E.dungeons[i].recommended,cleared:i,gold:1000});s.weapon=i<2?0:i<6?1:2;s.armor=i<2?0:i<6?1:2;s.weaponUp=i<3?0:i<7?1:3;s.armorUp=s.weaponUp;const b=win(s,i);assert.ok(b.turn<=10);assert.equal(s.cleared,i+1);
 }
 const s=fresh({followers:100});assert.equal(E.reward(s,100),105);s.followers=10000;assert.equal(E.reward(s,100),115);assert.equal(E.upgradeCost(s,'weapon'),60);s.weaponUp=3;assert.equal(E.upgradeCost(s,'weapon'),0);
}
console.log('PASS: migration, energy, unlocks, combat, cooldown, healing, win/repeat rewards, defeat, 10-tier balance, fame, upgrade cap');
