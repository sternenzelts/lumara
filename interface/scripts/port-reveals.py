"""Port the approved local demos without redesigning their character choreography."""
from pathlib import Path
import re, hashlib, json, subprocess
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'src/components/reveal'
PUBLIC = ROOT / 'public'
hashes = {hashlib.sha256(p.read_bytes()).hexdigest(): p for p in PUBLIC.rglob('*') if p.is_file()}
styles = []

for character in ['ayaka', 'mahesvara', 'keira']:
    demo = ROOT.parent / 'reveal-demos' / character
    source = (demo / 'index.html').read_text(encoding='utf-8')
    body = re.search(r'<body>(.*?)<script>', source, re.S)[1]
    body = re.sub(r'  <div id="start">.*?</div>', '', body)
    body = re.sub(r' onerror="[^"]*"', '', body)
    body = re.sub(r'(<img[^>]*id="(?:fist|splashAwakened)"[^>]*?) src="[^"]*"', r'\1', body)
    body = body.replace('<div id="caption">', '<div id="caption" aria-live="polite">')
    body = body.replace('</div>\n</div>\n', '</div>\n</div>\n')
    body = body.replace('<button id="skip">Skip</button>', '<button id="skip">Skip</button><button id="continue" hidden>Continue</button>')
    script = re.search(r'<script>(.*?)</script>', source, re.S)[1]
    # Unused, superseded sword art must not enter the artifact.
    script = script.replace("swordImg.src = 'giant_sword.webp';", '')
    filenames = set(re.findall(r'src="([^"]+)"', body))
    filenames.update(re.findall(r"(?:src\s*=\s*|new Audio\(|track\()'([^']+\.(?:mp3|webp))'", script))
    filenames.update('sfx_'+n+'.mp3' for n in re.search(r"\['pull_fall_whoosh'([^\]]*)\]", script)[0].replace('[','').replace(']','').replace("'",'').replace(' ','').split(','))
    vo = re.search(r"const VO = \{\}; \[(.*?)\]", script)
    if vo: filenames.update('vo_'+n+'.mp3' for n in vo[1].replace("'",'').replace(' ','').split(','))
    previous = OUT / (character+'-markup.js')
    previous_assets = json.loads(re.search(r'export const assets = (.*);', previous.read_text(encoding='utf-8'))[1]) if previous.exists() else {}
    assets = {}
    for filename in filenames:
        src = demo / filename
        digest = hashlib.sha256(src.read_bytes()).hexdigest()
        if filename == 'theme.mp3':
            dest = PUBLIC / 'art' / character / 'reveal-theme.mp3'
            subprocess.run(['ffmpeg','-y','-loglevel','error','-i',str(src),'-b:a','128k',str(dest)], check=True)
        elif filename in previous_assets and (PUBLIC / previous_assets[filename]).exists():
            dest = PUBLIC / previous_assets[filename]
        elif digest in hashes:
            dest = hashes[digest]
        else:
            dest = PUBLIC / ('audio/reveal-shared' if filename.startswith('sfx_pull_') or filename in ['crystal.webp','pull_music.mp3','sfx_tell_splusplus.mp3'] else 'art/'+character) / filename
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(src.read_bytes())
            hashes[digest] = dest
        if filename.endswith('.webp') and dest.suffix.lower() == '.webp':
            im = Image.open(dest)
            im.thumbnail((1280,1280) if filename in ['scene.webp','ice_cathedral.webp','bg.webp'] else (1536,1536), Image.Resampling.LANCZOS)
            im.save(dest, 'WEBP', quality=80, method=6)
        assets[filename] = dest.relative_to(PUBLIC).as_posix()
    landscape_keys = ['splash_base.webp', 'splash_mirror.webp'] if character == 'mahesvara' else ['splash.webp']
    for key in landscape_keys:
        assets[key] = 'art/reveal-landscapes/'+character+'.png'
    body = re.sub(r'src="([^"]+)"', lambda m: 'src="__BASE__'+assets[m[1]]+'"', body)
    (OUT / (character+'-markup.js')).write_text('export const markup = '+json.dumps(body)+';\nexport const assets = '+json.dumps(assets)+';\n', encoding='utf-8')
    css = re.search(r'<style>(.*?)</style>', source, re.S)[1]
    prefix = '.approved-reveal[data-character="'+character+'"]'
    # Scope every rule; retain the demo media queries and keyframe geometry.
    css = re.sub(r'([^{}]+)\{', lambda m: m[0] if m[1].strip().startswith('@') or m[1].strip() in ['from','to','50%'] else ', '.join(prefix if s.strip() in [':root','html','body'] else prefix+' '+s.strip() for s in m[1].split(','))+' {', css)
    css = css.replace('icerise', 'reveal-icerise').replace('animation:bob', 'animation:reveal-bob').replace('@keyframes bob', '@keyframes reveal-bob')
    styles.append(css)
    script = script.replace("document.getElementById(id)", "host.querySelector('#'+id)").replace('document.querySelectorAll', 'host.querySelectorAll')
    script = script.replace('addEventListener(\'resize\',size)', "window.addEventListener('resize',size)").replace("addEventListener('resize', size)", "window.addEventListener('resize', size)")
    script = script.replace('ayakaDemoSound','lumara.revealSound').replace('revealDemoSound','lumara.revealSound')
    script = script.replace('window.__snowIv','locals.snow').replace('window.__boost','locals.boost')
    script = re.sub(r"new Audio\(([^)]*)\)", r'new Audio(asset(\1))', script)
    script = re.sub(r"(\w+Img.src\s*=\s*)'([^']+)'", r"\1asset('\2')", script)
    script = script.replace('const $', 'const $', 1)
    # Use a common, cancelable playback lifetime in all three ports.
    script = re.sub(r'const CANCEL = Symbol\(\'cancel\'\);\s*let runId = 0;\s*function guard\(id\)\{[^}]*\}', '', script)
    script = re.sub(r'const sleep = .*?;\nconst tween = .*?;\nfunction voice\(a\)\{.*?\nfunction anim\(el, frames, o = \{\}\)\{.*?\n', '', script, flags=re.S) if character != 'ayaka' else script
    if character == 'ayaka':
        script = script.replace('const wait=ms=>new Promise(r=>setTimeout(r,ms*SPEED));', 'const wait=sleep;')
        script = re.sub(r'function anim\(el,frames,opts\)\{.*?\n', '', script)
        script = re.sub(r'function voice\(id\)\{.*?\n', '', script)
        script = script.replace('voice(', 'voiceId(')
        script = script.replace('async function play(){ if(running) return; running=true; reset();', 'async function run(){ const id=runId; running=true; reset();')
        script = re.sub(r'  const tween=.*?\n', '', script)
        script = script[:script.index("$('sound').onclick=cycleSound;")] + "$('sound').onclick=cycleSound; renderSound();\n"
        script = script.replace("['voReveal','voChrono','voAfter','voNifl'].forEach(id=>track($(id),1));", "['voReveal','voChrono','voAfter','voNifl'].forEach(id=>track($(id),1));\nconst voiceId=id=>voice($(id));")
    else:
        script = script.replace('const id = ++runId; reset();', 'const id = runId; reset();')
        script = script[:script.index('function start(){')]
    # Shared crystal flight/tells/shatter; unique silhouettes remain in character parts.
    begin = script.index("  $('bg').animate" if character == 'ayaka' else "  $('scene').animate", script.index('async function run'))
    end = script.index('  // 5 · silhouette', begin) if character == 'ayaka' else script.index('  const sil =', begin)
    adapter = """  await standardPull({state:{get cz(){return cz},set cz(v){cz=v},get shake(){return shake},set shake(v){shake=v},set cracks(v){cracks=v}}, $, tween, anim, animateRaw:(e,f,o)=>e.animate(f,o), wait:sleep, caption, sfx:n=>{const a=SFX[n];a.currentTime=0;a.play().catch(()=>{})},playPull:()=>{PULL.currentTime=0;setV(PULL,.6);PULL.play().catch(()=>{})},stopSfx:()=>{},spawn,makeCracks,W,H,DPR,check:()=>guard(id),background:'SCENE',stopBeforeSilhouette:true},'S++');
""".replace('SCENE', 'bg' if character == 'ayaka' else 'scene')
    script = script[:begin]+adapter+script[end:]
    script = script.replace('return voice(a).then(() => ramp(THEME, .32, .02, 80));', 'const line=voice(a).then(() => ramp(THEME, .32, .02, 80)); line.catch(()=>{}); return line;')
    # Discard pull particles when the authored character scene starts.
    scene = script.index('  // 6 ·')
    script = script[:scene]+'  cracks=[]; parts.length=0;\n'+script[scene:]
    footer = """
function finalPose(){ reset(); host.querySelectorAll('canvas').forEach(c=>c.getContext('2d').clearRect(0,0,c.width,c.height)); $('stage').style.filter=''; $('stage').style.transform=''; const p=$('FINAL');p.style.opacity=1;p.style.transform='TRANSFORM';$('card').style.opacity=1;$('card').style.transform='none'; }
return { replay:()=>life.replay(run), skip:()=>{life.cancel();finalPose();onFinished()}, dispose:()=>{life.dispose();window.removeEventListener('resize',size)}, getLevel:()=>level };
}
""".replace('FINAL', {'ayaka':'timestop','mahesvara':'splashMirror','keira':'splash'}[character]).replace('TRANSFORM', 'translateX(-30%)' if character=='ayaka' else 'none')
    header = """// Character choreography ported from reveal-demos/CHARACTER/index.html (approved 2026-09-27).
import {standardPull} from './standard-pull.js';
import {createPlayback} from './playback.js';
import {assets} from './CHARACTER-markup.js';
export function createRuntime(host,onFinished,base){
const asset=name=>base+assets[name];
const locals={};
const life=createPlayback(host,onFinished);
const {sleep,tween,anim,voice,guard,setTimeout,clearTimeout,setInterval,clearInterval,requestAnimationFrame}=life;
let runId=0;
life.onCancel=()=>{runId++;ALL.forEach(a=>{a.pause();a.currentTime=0});};
""".replace('CHARACTER',character)
    # Guard uses the runtime's generation via this accessor, independent of demo numbering.
    header = header.replace('voice,guard,', 'voice,').replace('let runId=0;', 'let runId=0; function guard(id){if(id!==runId)throw life.CANCEL;}')
    runtime = header+script+footer
    runtime = re.sub(r'THEME\.play\(\)\.catch\(\(\)\s*=>\s*\{\}\)', 'life.playMusic(THEME)', runtime)
    runtime = runtime.replace('THEME.pause()', 'life.pauseMusic(THEME)')
    lines = []
    for line in runtime.splitlines():
        if "anim($('splash" in line:
            for old in ['1.25', '1.2', '1.04', '1.12', '1.08']:
                line = line.replace('scale('+old+')', 'scale(1.02)')
            line = line.replace('scale(1.05)', 'scale(1)')
        lines.append(line)
    runtime = '\n'.join(lines)+'\n'
    runtime = runtime.replace('return { replay:()=>life.replay(run)', 'life.primeMusic(THEME);\nreturn { replay:()=>life.replay(run)')
    (OUT / (character+'-approved.js')).write_text(runtime, encoding='utf-8')

(ROOT / 'src/components/approved-reveals.css').write_text('\n'.join(styles)+'''\n.approved-reveal{position:fixed;inset:0;z-index:100;background:#03060f;color:white;font-family:Manrope,sans-serif;overflow:hidden}
.approved-reveal [hidden]{display:none!important}
.approved-reveal img{max-width:none}
.approved-reveal #caption{max-width:calc(100vw - 120px);text-align:center}
@media(max-width:760px){.approved-reveal #card{max-width:88vw;padding:18px 22px}.approved-reveal #card h1{font-size:clamp(32px,8vw,60px)}.approved-reveal #card .sub{font-size:11px;letter-spacing:.12em}.approved-reveal #ui{right:12px;bottom:12px;gap:6px}.approved-reveal #ui button{padding:10px 12px}}
''', encoding='utf-8')
