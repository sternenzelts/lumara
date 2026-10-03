const fs=require('fs');const {chromium}=require('C:/Users/hp/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
fs.mkdirSync('.impeccable/review/reveal-landscapes',{recursive:true});
for(const [device,width,height] of [['desktop',1440,900],['phone',375,812]]){
await Promise.all(['ayaka','keira','mahesvara'].map(async id=>{
 const p=await b.newPage({viewport:{width,height}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('lumara.demo.v1',JSON.stringify({players:[{userId:'jay',nickname:'Jay',introSeen:true,owned:{wren:1},pulls:[]}],sessions:[],attendance:[]})));
 await p.goto('http://127.0.0.1:5177/#banner/'+id);
 await p.getByRole('button',{name:'Preview '+({ayaka:'Ayaka',keira:'Keira',mahesvara:'Mahesvara'}[id])+' reveal',exact:true}).click();
 const selector='.approved-reveal[data-character="'+id+'"] '+(id==='mahesvara'?'#splashBase':'#splash');
 await p.waitForFunction(s=>{const e=document.querySelector(s);return e&&parseFloat(getComputedStyle(e).opacity)>.85},selector,{timeout:45000});
 const art=await p.locator(selector).evaluate(e=>({src:e.src,width:e.naturalWidth,height:e.naturalHeight,fit:getComputedStyle(e).objectFit}));
 if(!art.src.endsWith('/reveal-landscapes/'+id+'.png')||art.width!==1672||art.height!==941||art.fit!=='cover')throw Error(JSON.stringify(art));
 await p.screenshot({path:'.impeccable/review/reveal-landscapes/'+device+'-'+id+'.png'});
 await p.keyboard.press('Escape');if(await p.locator('.approved-reveal').count())throw Error('Close failed');if(errors.length)throw Error(errors.join(';'));
 console.log(device,id,'original landscape decoded, edge-to-edge framing and close passed');await p.close();
}));}
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
