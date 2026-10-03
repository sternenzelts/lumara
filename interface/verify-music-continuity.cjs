const {chromium}=require('C:/Users/hp/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try {
 const p=await b.newPage(); const errors=[]; p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>localStorage.setItem('lumara.demo.v1',JSON.stringify({players:[{userId:'jay',nickname:'Jay',introSeen:true,owned:{wren:1},pulls:[]}],sessions:[],attendance:[]})));
 await p.goto('http://127.0.0.1:5177/#sanctuary');
 await p.getByRole('button',{name:'Sanctuary music controls'}).click();
 await p.waitForFunction(()=>{const a=document.querySelector('audio[src*="dark-aria"]');return a&&!a.paused&&a.currentTime>0});
 await p.evaluate(()=>{window.track=document.querySelector('audio[src*="dark-aria"]');window.track.currentTime=20});
 for(const route of ['collection','banner/ayaka','map','sanctuary']){
 await p.evaluate(r=>location.hash=r,route);
 await p.waitForTimeout(350);
 if(!await p.evaluate(()=>window.track===document.querySelector('audio[src*="dark-aria"]')&&!window.track.paused&&window.track.currentTime>=20))throw Error('Continuity failed: '+route);
 }
 await p.evaluate(()=>location.hash='banner/ayaka');
 await p.getByRole('button',{name:'View Ayaka details',exact:true}).click();
 await p.getByRole('button',{name:'Preview Seren reveal',exact:true}).click();
 await p.waitForFunction(()=>window.track.paused);
 const stopped=await p.evaluate(()=>window.track.currentTime);
 await p.waitForTimeout(400);
 if(await p.evaluate(()=>window.track.currentTime)!==stopped)throw Error('Reveal did not pause playhead');
 await p.keyboard.press('Escape');
 await p.waitForFunction(()=>!window.track.paused&&window.track.currentTime>=20);
 await p.evaluate(()=>location.hash='retro'); await p.waitForFunction(()=>window.track.paused);
 await p.evaluate(()=>location.hash='sanctuary'); await p.waitForFunction(()=>!window.track.paused);
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 await p.waitForFunction(()=>window.track.paused);
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'))});
 await p.waitForFunction(()=>!window.track.paused);
 await p.evaluate(()=>location.hash='title');await p.waitForFunction(()=>window.track.paused);
 if(errors.length)throw Error(errors.join(';'));
 console.log('Music continuity, reveal pause/resume, Voyage, hidden tab and title isolation passed');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exit(1)});
