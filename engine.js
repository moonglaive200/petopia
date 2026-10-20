/* All rewards and combat rules live here so the numbers stay consistent. */
(function(root){
const weapons=[{name:'효자손',attack:0,cost:0},{name:'등짝 스매셔',attack:6,cost:180},{name:'전설의 뚫어뻥',attack:15,cost:650}];
const armors=[{name:'집에서 입던 티',defense:0,hp:0,cost:0},{name:'택배 상자 갑옷',defense:3,hp:16,cost:150},{name:'방탄 앞치마',defense:7,hp:36,cost:550}];
const names=['먼지의 반란','양말 실종 사건','택배 상자 지하실','냉장고 뒤편','소파 아래 왕국','빨래산 원정','야근의 늪','고지서의 탑','월요일의 문','집주인의 최종 통보'];
const monsters=['먼지 뭉치','양말 도둑','상자 미믹','상한 푸딩','리모컨 군주','빨래 골렘','야근 유령','고지서 기사','월요일 마왕','월세 드래곤'];
const hp=[40,65,90,120,155,195,245,300,365,440],attack=[7,9,11,13,16,19,22,25,28,32];
const dungeons=names.map((name,i)=>({name,monster:monsters[i],hp:hp[i],attack:attack[i],defense:Math.floor(i*.8),gold:22+i*12,xp:24+i*14,recommended:[1,2,3,4,5,7,9,11,13,15][i]}));
function normalize(s,now=Date.now()){
 const defaults={version:1,level:1,xp:0,gold:80,energy:100,energyAt:now,cleared:0,weapon:0,armor:0,weaponUp:0,armorUp:0,weapons:[0],armors:[0],followers:0,debt:0,cooldowns:{},walks:0};
 for(const [key,value] of Object.entries(defaults))if(s[key]===undefined)s[key]=structuredClone(value);
 const ticks=Math.floor(Math.max(0,now-s.energyAt)/60000);
 if(ticks){s.energy=Math.min(100,s.energy+ticks*5);s.energyAt+=ticks*60000}
 return s;
}
function xpNeeded(level){return 35+level*15}
function gainXP(s,amount){s.xp+=amount;let levels=0;while(s.xp>=xpNeeded(s.level)){s.xp-=xpNeeded(s.level);s.level++;levels++}return levels}
function stats(s){return {hp:80+(s.level-1)*8+armors[s.armor].hp,attack:8+(s.level-1)*2+weapons[s.weapon].attack+s.weaponUp*2,defense:1+Math.floor((s.level-1)/3)+armors[s.armor].defense+s.armorUp}}
function bonus(s){return s.followers>=10000?.15:s.followers>=1000?.1:s.followers>=100?.05:0}
function reward(s,base){const total=Math.floor(base*(1+bonus(s))+1e-8);s.gold+=total;return total}
function upgradeCost(s,type){return [60,120,220][s[type+'Up']]||0}
function begin(s,index){normalize(s);if(!Number.isInteger(index)||index<0||index>=10||index>s.cleared||s.energy<10)return null;s.energy-=10;return {index,hp:stats(s).hp,enemyHP:dungeons[index].hp,turn:0,skill:0,done:false,result:null}}
function act(s,b,action){
 if(b.done||!['attack','heavy','heal'].includes(action))return null;
 if(action==='heavy'&&b.skill>0)return null;
 if(action==='heal'&&(s.gold<18||b.hp>=stats(s).hp))return null;
 const st=stats(s),enemy=dungeons[b.index];let dealt=0,healed=0;
 if(action==='heal'){s.gold-=18;healed=Math.min(45,st.hp-b.hp);b.hp+=healed}
 else{dealt=Math.max(1,Math.floor(st.attack*(action==='heavy'?2:1))-enemy.defense);b.enemyHP=Math.max(0,b.enemyHP-dealt)}
 b.turn++;if(action==='heavy')b.skill=3;else b.skill=Math.max(0,b.skill-1);
 if(b.enemyHP===0){b.done=true;const first=b.index===s.cleared;if(first)s.cleared=Math.min(10,s.cleared+1);const gold=reward(s,enemy.gold+(first?enemy.gold:0));const xp=enemy.xp+(first?enemy.xp:0);const levels=gainXP(s,xp);b.result={won:true,gold,xp,levels,first};return {dealt,healed,taken:0,...b.result}}
 const taken=Math.max(1,enemy.attack-st.defense);b.hp=Math.max(0,b.hp-taken);
 if(!b.hp){b.done=true;b.result={won:false}}
 return {dealt,healed,taken,won:false};
}
root.PetopiaEngine={weapons,armors,dungeons,normalize,xpNeeded,gainXP,stats,bonus,reward,upgradeCost,begin,act};
})(globalThis);
