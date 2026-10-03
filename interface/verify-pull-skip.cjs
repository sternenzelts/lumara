const {chromium}=require('C:/Users/hp/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const p=await b.newPage({reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('lumara.demo.v1',JSON.stringify({players:[{userId:'jay',nickname:'Jay',introSeen:true,owned:{wren:1},pulls:[],currencyGrants:[{id:'gift',currency:'starlight',amount:3000,byUserId:'jay',at:1}]}],sessions:[],attendance:[]}));Math.random=()=>.9});
 await p.goto('http://127.0.0.1:5177/#banner');await p.locator('.wish-pull-10').click();
 await p.getByRole('button',{name:'Skip A reveals',exact:true}).click();
 await p.locator('.batch-cards>div').first().waitFor();if(await p.locator('.batch-cards>div').count()!==10)throw Error('All-A results missing');
 const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('lumara.demo.v1')).players.find(x=>x.userId==='jay').pulls);
 if(saved.length!==10)throw Error('Pulls changed');
 if(!(await p.locator('.game-wallet').innerText()).includes('2,200'))throw Error('Wrong x10 cost');
 await p.getByRole('button',{name:'Done',exact:true}).click();
 const send=async(ids)=>p.evaluate(async ids=>{const {getBackend}=await import('/src/backend/index.ts');getBackend().emit('pull_reveal',{cueId:crypto.randomUUID(),name:'Jay',records:ids.map(characterId=>({characterId,grade:['seren','azrenth'].includes(characterId)?'S+':['ayaka','keira','mahesvara'].includes(characterId)?'S++':'A',source:'banner',at:1,duplicate:false}))})},ids);
 await send(['wren','dax','seren','azrenth','dax','ayaka','wren','keira','wren','dax']);
 await p.getByRole('button',{name:'Skip A reveals',exact:true}).click();
 for(const [index,id] of [[3,'seren'],[4,'azrenth'],[6,'ayaka'],[8,'keira']]){
 await p.getByRole('status',{name:'Wish '+index+' of 10',exact:true}).waitFor();
 await p.locator('.reveal-awaiting-click').waitFor();
 await p.waitForTimeout(3400);
 if(await p.getByRole('status',{name:'Wish '+index+' of 10',exact:true}).count()!==1)throw Error('Premium advanced without input: '+id);
 if(await p.getByRole('button',{name:'Continue',exact:true}).filter({visible:true}).count())throw Error('Continue still visible');
 await p.keyboard.press('Enter');
 }
 await p.locator('.batch-cards>div').first().waitFor();if(await p.locator('.batch-cards>div').count()!==10)throw Error('Premium sequence summary missing');
 await p.getByRole('button',{name:'Done',exact:true}).click();
 await p.emulateMedia({reducedMotion:'no-preference'});
 await p.evaluate(()=>{window.audios=[];const A=Audio;window.Audio=function(...args){const a=new A(...args);window.audios.push(a);return a};window.Audio.prototype=A.prototype});
 await send(Array(10).fill('ayaka'));await p.locator('.approved-reveal[data-character="ayaka"]').waitFor();
 await p.waitForFunction(()=>window.audios.some(a=>!a.paused));
 await p.mouse.dblclick(500,350);
 await p.locator('.batch-cards>div').first().waitFor();
 if(await p.evaluate(()=>window.audios.some(a=>!a.paused)))throw Error('Double-click left reveal audio playing');
 if(await p.locator('.batch-cards>div').count()!==10)throw Error('Double-click results missing');
 if(errors.length)throw Error(errors.join(';'));
 console.log('All-A Skip, S+/S++ hold until input, no repeated Continue, x10 cost/rewards and double-click audio cleanup passed');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
