import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../backend/local';
import { CHARACTERS } from '../data/characters';
import type { Player, PullRecord, Attendance, Vow } from '../backend/types';
import { rollPull, pityProgress, starlightBalance, stardustBalance, voyageStarlight } from './index';
const player = (pulls: PullRecord[] = []): Player => ({ userId:'ana', nickname:'Moon', introSeen:true, displayCharacterId:null, owned:{}, pulls });
const record = (grade: PullRecord['grade']='A', source: PullRecord['source']='banner', duplicate=false): PullRecord => ({at:1, characterId:grade==='A'?'wren':grade==='S+'?'seren':'ayaka',grade,source,duplicate});
const balance = (pulls: PullRecord[] = [], attendance: Attendance[] = [], vows: Vow[] = []) => starlightBalance({userId:'ana',player:player(pulls),attendance,vows,settings:DEFAULT_SETTINGS});
describe('real game economy',()=>{
 it('starts at 1200 and charges 200 for each paid wish',()=>{expect(DEFAULT_SETTINGS.starlight.pullCost).toBe(200);expect(balance()).toBe(1200);expect(balance([record()])).toBe(1000);expect(balance(Array.from({length:6},()=>record()))).toBe(0)});
 it('adds gifted currency to the matching wallet and still charges normal spending',()=>{
  const p={...player([record(),record('A','exchange')]),currencyGrants:[{id:'g1',currency:'starlight' as const,amount:500,byUserId:'jay',at:1},{id:'g2',currency:'stardust' as const,amount:100,byUserId:'jay',at:1}]};
  expect(starlightBalance({userId:'ana',player:p,attendance:[],vows:[],settings:DEFAULT_SETTINGS})).toBe(1500);
  expect(stardustBalance({player:p,settings:DEFAULT_SETTINGS})).toBe(40);
 });
 it('keeps voyage pulls free',()=>expect(balance([record('A','opening')])).toBe(1200));
 it('keeps five welcome rolls free and counts them toward pity',()=>{const rolls=Array.from({length:5},()=>record('A','welcome'));expect(balance(rolls)).toBe(1200);expect(pityProgress(rolls,DEFAULT_SETTINGS)).toEqual({sPlus:5,sPlusPlus:5});expect(balance([...rolls,record()])).toBe(1000)});
 it('earns for attendance, votes, and fulfilled shared vows',()=>{const a={userId:'ana',sessionId:'s',joinedAt:1,votesCast:2,characterId:null,checkinDone:true,peerGiven:0};const v={id:'v',sessionId:'s',text:'Promise',ownerId:null,status:'fulfilled' as const,createdAt:1};expect(balance([], [a,{...a,userId:'someone'}],[v])).toBe(1800)});
 it('uses fixed RNG draws to reach every grade',()=>{for(const [draw,grade] of [[.001,'S++'],[.02,'S+'],[.5,'A']] as const){expect(rollPull({settings:DEFAULT_SETTINGS,history:[],roster:CHARACTERS,owned:{},rng:()=>draw}).grade).toBe(grade)}});
 it('guarantees S+ on wish 30 and S++ on 100',()=>{expect(rollPull({settings:DEFAULT_SETTINGS,history:Array.from({length:29},()=>record()),roster:CHARACTERS,owned:{},rng:()=>.9}).grade).toBe('S+');expect(rollPull({settings:DEFAULT_SETTINGS,history:Array.from({length:99},()=>record()),roster:CHARACTERS,owned:{},rng:()=>.9}).grade).toBe('S++')});
 it('shares opening/banner pity and excludes exchanges',()=>{expect(pityProgress([record('S++'),record(),record('S+'),record('A','exchange'),record()],DEFAULT_SETTINGS)).toEqual({sPlus:1,sPlusPlus:3})});
 it('can disable pity',()=>expect(rollPull({settings:{...DEFAULT_SETTINGS,pity:{...DEFAULT_SETTINGS.pity,enabled:false}},history:Array.from({length:100},()=>record()),roster:CHARACTERS,owned:{},rng:()=>.9}).grade).toBe('A'));
 it('detects duplicates and awards Stardust',()=>{const pull=rollPull({settings:DEFAULT_SETTINGS,history:[],roster:CHARACTERS,owned:{ayaka:1,mahesvara:1,keira:1},rng:()=>.001});expect(pull.duplicate).toBe(true);expect(stardustBalance({player:player([record('S++','banner',true)]),settings:DEFAULT_SETTINGS})).toBe(DEFAULT_SETTINGS.stardust.dupeSPlusPlus)});
 it('starts Stardust at zero and charges exchanges without duplicate rewards',()=>{expect(stardustBalance({player:player(),settings:DEFAULT_SETTINGS})).toBe(0);const p=player([...Array.from({length:7},()=>record('A','banner',true)),record('A','exchange',true)]);expect(stardustBalance({player:p,settings:DEFAULT_SETTINGS})).toBe(10)});
});
describe('voyageStarlight', () => {
  it('pays attending, own votes and the team’s promises kept at this gate', () => {
    const a = { userId: 'ana', sessionId: 's', joinedAt: 1, votesCast: 3, characterId: null, checkinDone: false, peerGiven: 0 };
    expect(voyageStarlight({ settings: DEFAULT_SETTINGS, attendance: a, promisesKept: 2 })).toBe(300 + 3 * 50 + 2 * 200);
    expect(voyageStarlight({ settings: DEFAULT_SETTINGS, attendance: undefined, promisesKept: 2 })).toBe(0);
  });
});
