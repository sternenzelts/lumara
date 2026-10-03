const {chromium}=require('C:/Users/hp/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
await Promise.all(['ayaka','mahesvara','keira'].map(async id=>{
 const context=await b.newContext();const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{
 localStorage.setItem('lumara.demo.v1',JSON.stringify({players:[{userId:'jay',nickname:'Jay',introSeen:true,owned:{wren:1},pulls:[]}],sessions:[],attendance:[]}));
 window.audios=[];const Original=Audio;window.Audio=function(...args){const a=new Original(...args);window.audios.push(a);return a};window.Audio.prototype=Original.prototype;
 const play=HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.play=function(){if(this.src.includes('theme.mp3')){this.attempts=(this.attempts||0)+1;if(this.attempts===2)return Promise.reject(new DOMException('Simulated cold start interruption','AbortError'));}return play.call(this)};
 });
 await p.goto('http://127.0.0.1:5177/#banner/'+id);
 await p.getByRole('button',{name:'Preview '+({ayaka:'Ayaka',mahesvara:'Mahesvara',keira:'Keira'}[id])+' reveal',exact:true}).click();
 const scene=p.locator('.approved-reveal[data-character="'+id+'"]');await scene.waitFor();
 await p.waitForFunction(()=>window.audios.some(a=>a.src.includes('theme.mp3')&&!a.paused&&a.volume>0&&a.currentTime>.15&&a.attempts>=3),{},{timeout:45000});
 const first=await p.evaluate(()=>{const a=window.audios.findLast(a=>a.src.includes('theme.mp3')&&!a.paused&&a.volume>0);return{attempts:a.attempts,volume:a.volume,time:a.currentTime,duration:a.duration}});
 await scene.locator('#replay').click();
 await p.waitForFunction(n=>window.audios.some(a=>a.src.includes('theme.mp3')&&!a.paused&&a.volume>0&&a.currentTime>.15&&a.attempts>n),first.attempts,{timeout:45000});
 await scene.locator('#sound').click();await scene.locator('#sound').click();
 if(!await p.evaluate(()=>window.audios.every(a=>a.paused||a.volume===0)))throw Error(id+' mute not honored');
 await scene.locator('#sound').click();
 await p.waitForFunction(()=>window.audios.some(a=>a.src.includes('theme.mp3')&&!a.paused&&a.volume>0));
 await p.keyboard.press('Escape');
 if(await p.evaluate(()=>window.audios.some(a=>!a.paused)))throw Error(id+' audio leaked on close');
 if(errors.length)throw Error(errors.join(';'));
 console.log(id,'cold-start recovery, decoded theme, Replay, mute/unmute and cancellation passed',first);
 await context.close();
}));
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
