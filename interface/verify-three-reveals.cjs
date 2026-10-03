const {chromium}=require('C:/Users/hp/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 await Promise.all(['ayaka','mahesvara','keira'].map(async id=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log(id,'PAGE ERROR',e.message)});const probe=setInterval(async()=>{try{console.log(id,'beat',await page.locator('.approved-reveal #caption').textContent())}catch{}},8000);
 await page.addInitScript(()=>{
 localStorage.setItem('lumara.demo.v1',JSON.stringify({players:[{userId:'jay',nickname:'Jay',introSeen:true,owned:{wren:1},pulls:[],displayCharacterId:'wren'}],sessions:[],attendance:[]}));
 window.revealAudio=[];window.revealEvents=[];
 const NativeAudio=window.Audio;window.Audio=function(...args){const a=new NativeAudio(...args);window.revealAudio.push(a);return a};window.Audio.prototype=NativeAudio.prototype;
 const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.revealEvents.push({type:'play',src:this.src,at:performance.now(),volume:this.volume});return play.call(this)};
 const pause=HTMLMediaElement.prototype.pause;HTMLMediaElement.prototype.pause=function(){window.revealEvents.push({type:'pause',src:this.src,at:performance.now(),time:this.currentTime});return pause.call(this)};
 });
 await page.goto('http://127.0.0.1:5177/#banner',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:`Preview ${id[0].toUpperCase()+id.slice(1)} reveal`,exact:true}).click();
 const scene=page.locator('.approved-reveal');await scene.waitFor();await scene.locator('#caption').filter({hasText:'Starlight'}).waitFor();
 await scene.locator('#replay').click();await scene.locator('#caption').filter({hasText:'Starlight'}).waitFor();
 await scene.locator('#sound').click();if(await scene.locator('#sound').getAttribute('data-level')!=='low')throw Error(id+' low sound');await scene.locator('#sound').click();await scene.locator('#sound').click();
 console.log(id,'Replay and sound cycle passed');
 if(id==='ayaka'){
 await scene.locator('#caption').filter({hasText:'Niflheim'}).waitFor({timeout:60000});await page.waitForTimeout(900);await page.screenshot({path:'reveal-ayaka-niflheim.png'});
 await page.waitForFunction(()=>document.querySelector('.approved-reveal #stage')?.style.filter.includes('saturate(0.35)'),{},{timeout:30000});
 const frozen=await page.evaluate(()=>window.revealAudio.findLast(a=>a.src.includes('reveal-theme.mp3'))?.paused);if(!frozen)throw Error('Ayaka theme not paused');console.log('Ayaka freeze theme paused');
 } else if(id==='mahesvara') {await scene.locator('#caption').filter({hasText:'magic like'}).waitFor({timeout:60000});await page.waitForTimeout(1400);await page.screenshot({path:'reveal-mahesvara-nullify.png'});}
 else {await scene.locator('#caption').filter({hasText:'H-hiii'}).waitFor({timeout:60000});await page.waitForTimeout(600);const v=await page.evaluate(()=>window.revealAudio.findLast(a=>a.src.includes('reveal-theme.mp3'))?.volume);if(Math.abs(v-.07)>.001)throw Error('Keira duck '+v);console.log('Keira theme ducked to 7%');await page.screenshot({path:'reveal-keira-greeting.png'});}
 await scene.locator('#continue').waitFor({state:'visible',timeout:80000});await page.screenshot({path:`reveal-${id}-card-desktop.png`});
 const data=await page.evaluate(()=>({events:window.revealEvents,playing:window.revealAudio.filter(a=>!a.paused).map(a=>a.src)}));console.log(id,'complete',JSON.stringify(data.events.filter(e=>e.type==='play').map(e=>e.src.split('/').pop())));
 if(errors.length)throw Error(id+' '+errors.join(';'));
 await scene.locator('#replay').click();await scene.locator('#caption').filter({hasText:'Starlight'}).waitFor();await scene.locator('#skip').click();await scene.locator('#continue').waitFor({state:'visible'});await page.waitForTimeout(300);if(await page.evaluate(()=>window.revealAudio.some(a=>!a.paused)))throw Error(id+' skip audio leaked');
 await page.setViewportSize({width:375,height:812});await page.screenshot({path:`reveal-${id}-card-phone.png`});await scene.locator('#continue').click();await page.waitForTimeout(300);if(await page.evaluate(()=>window.revealAudio.some(a=>!a.paused)))throw Error(id+' close audio leaked');console.log(id,'desktop/phone card, Skip and close cleanup passed');clearInterval(probe);await context.close();
 }));
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});

