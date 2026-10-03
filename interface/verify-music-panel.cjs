const fs=require('fs');
const {chromium}=require('C:/Users/hp/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
fs.mkdirSync('.impeccable/review/music-panel',{recursive:true});
for(const [name,width,height] of [['desktop',1440,900],['compact',797,645],['phone',375,812]]){
 const p=await b.newPage({viewport:{width,height}});
 await p.addInitScript(()=>localStorage.setItem('lumara.demo.v1',JSON.stringify({players:[{userId:'jay',nickname:'Jay',introSeen:true,owned:{wren:1},pulls:[]}],sessions:[],attendance:[]})));
 await p.goto('http://127.0.0.1:5177/#sanctuary');
 await p.getByRole('button',{name:'Sanctuary music controls'}).click();
 const panel=p.getByRole('group',{name:'Sanctuary music settings'});
 const geometry=await panel.evaluate(el=>{const r=el.getBoundingClientRect();const button=el.querySelector('button');const br=button.getBoundingClientRect();const label=el.querySelector('label').getBoundingClientRect();const output=el.querySelector('output').getBoundingClientRect();return {inside:el.contains(document.elementFromPoint(br.x+br.width/2,br.y+br.height/2)),fits:r.x>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,sameLine:Math.abs(label.y-output.y)<8}});
 if(!geometry.inside||!geometry.fits||!geometry.sameLine)throw Error(name+JSON.stringify(geometry));
 await p.getByRole('slider',{name:'Music volume'}).fill('60');
 await p.screenshot({path:'.impeccable/review/music-panel/'+name+'.png'});
 await p.keyboard.press('Escape');if(await panel.count())throw Error('Escape failed');
 console.log(name,'panel stacking, label layout, volume and Escape passed');await p.close();
}
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
