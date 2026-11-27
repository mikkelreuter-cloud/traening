/* Grundlag: datoer, programmer, sessionsbibliotek (SESS) og vaner. */
const KEY='styrke-vo2-log.v1';
const DAYS=['søndag','mandag','tirsdag','onsdag','torsdag','fredag','lørdag'];
const MONTHS=['januar','februar','marts','april','maj','juni','juli','august','september','oktober','november','december'];
const KIND_LABEL={styrke:'Styrke',interval:'Intervaller',zone2:'Zone 2 (rolig)',hvile:'Hvile',mobilitet:'Mobilitet',crossfit:'CrossFit'};
const LOGTYPE={styrke:'Styrke',kondition:'Kondition',vaegt:'Vægt',test:'Test'};
const TESTS=['3 km løb','5 km løb','Cooper 12 min','1RM squat','1RM bænkpres','1RM dødløft','Max pull-ups','VO₂max (ur)'];

const SESS={
  A:{name:'Styrke A',kind:'styrke',dur:'ca. 60 min',ex:[['Squat',4,5,2],['Bænkpres',4,5,2],['Rotræk med stang',3,8,1],['Bulgarsk splitsquat',3,8,2],['Farmer\'s walk (meter)',3,40,1]],
     note:'4×5 betyder 4 sæt med 5 gentagelser. "2 i tanken" betyder: stop sættet, når du kunne have taget 2 gentagelser mere. Log hvordan det gik, så foreslår appen vægten til næste gang.'},
  B:{name:'Styrke B',kind:'styrke',dur:'ca. 60 min',ex:[['Dødløft',3,5,3],['Militærpres',4,5,2],['Pull-ups',4,6,1],['Hip thrust',3,8,1],['Ab wheel',3,8,2]],
     note:'Dødløft med 3 tilbage, så teknikken holder. Pull-ups får ekstra vægt, når appen foreslår det.'},
  C:{name:'Styrke C',kind:'styrke',dur:'ca. 50 min',ex:[['Frontsquat',3,6,2],['Skrå håndvægtpres',4,8,1],['Chin-ups',3,8,1],['Rumænsk dødløft',3,8,2],['Pallof press (pr. side)',3,10,2]],
     note:'Moderat tungt. Fokus på teknik og fart op i løftet.'},
  I4:{name:'Intervaller 4×4',kind:'interval',dur:'ca. 40 min',
     steps:['10 min roligt for at varme op','4 × 4 min hårdt. Det hårdeste tempo, du kan holde jævnt hele vejen. Ikke en sprint.','3 min roligt jog eller gang mellem hvert interval','5 min roligt til sidst','Tjek: Du kan sige 2–3 ord ad gangen. Interval 4 skal være lige så hurtigt som interval 1.'],
     note:'Lange intervaller (2 min eller mere) med mindst 15 min arbejde gav de største VO₂max-fremskridt. Cykel eller romaskine skåner benene til styrke.'},
  I30:{name:'Korte intervaller 30/15',kind:'interval',dur:'ca. 35 min',
     steps:['10 min roligt for at varme op','3 serier. Hver serie er 10 runder: 30 sek hurtigt + 15 sek langsomt','3 min roligt mellem serierne','5 min roligt til sidst','De 30 sek er hurtige, men ikke en sprint. Du skal kunne holde samme fart i alle runder.'],
     note:'Korte, meget hårde intervaller med kort pause rangerer højt for trænede.'},
  Z2:{name:'Zone 2',kind:'zone2',dur:'45–60 min',
     steps:['45–60 min roligt løb, cykel eller ro','60–70 % af maks puls','Du skal kunne tale i hele sætninger'],
     note:'Bygger den aerobe base og hjælper restitutionen. Den kan springes over, hvis tiden er knap.'},
  I5:{name:'Intervaller 5×4',kind:'interval',dur:'ca. 47 min',
     steps:['10 min roligt for at varme op','5 × 4 min hårdt. Det hårdeste tempo, du kan holde jævnt hele vejen. Ikke en sprint.','3 min roligt jog eller gang mellem hvert interval','5 min roligt til sidst','Tjek: Du kan sige 2–3 ord ad gangen. Interval 5 skal være lige så hurtigt som interval 1.'],
     note:'Et ekstra interval i forhold til 4×4. Løb er fint, hvis dagen før var let for benene.'},
  I30B:{name:'Korte intervaller 30/15 · 4 serier',kind:'interval',dur:'ca. 50 min',
     steps:['10 min roligt for at varme op','4 serier. Hver serie er 10 runder: 30 sek hurtigt + 15 sek langsomt','3 min roligt mellem serierne','5 min roligt til sidst','De 30 sek er hurtige, men ikke en sprint. Du skal kunne holde samme fart i alle runder.'],
     note:'Tag det på cykel eller romaskine. Så slipper benene for 40 hårde løbestød, og styrken lider mindre. Fjerde serie giver flere hårde minutter.'},
  Z2L:{name:'Zone 2 · 60 min',kind:'zone2',dur:'60 min',
     steps:['60 min march med oppakning, cykel, ro eller roligt løb','60–70 % af maks puls','Du skal kunne tale i hele sætninger'],
     note:'Bygger den aerobe base, som gør intervallerne bedre. Hold det roligt hele vejen.'},
  MOB:{name:'Mobilitet',kind:'mobilitet',dur:'10 min',min:10,
     steps:['90/90 hofteskift · 1 min','Verdens bedste stræk · 5 pr. side','Åben bog (brystryg-rotation) · 8 pr. side','Dyb squat-hold · 1 min','Couch stretch · 45 sek pr. side','Dead hang · 2 × 30 sek'],
     note:'Lige efter styrkepasset, mens du er varm.'},
  BAL:{name:'Balance og mobilitet',kind:'mobilitet',dur:'15 min',min:15,
     steps:['Etbensstand med lukkede øjne · 3 × 30 sek pr. ben','Etbens rumænsk dødløft · 2 × 8 pr. ben','Kosakker-squat · 2 × 6 pr. side','Tå-gang og hæl-gang · 2 × 20 m','Hoftebøjer- og baglårsstræk · 1 min pr. side','Rolig vejrtrækning på ryggen · 2 min'],
     note:'Balance holder ankler, knæ og hofter skadefri.'},
  GA:{name:'Gåtur',kind:'mobilitet',label:'Aktiv restitution',dur:'40 min',min:40,
     steps:['40 min rask gang','Så du bliver lidt forpustet, men kan tale','Del den gerne op: 2–3 ture i løbet af dagen tæller også'],
     note:'Daglig gang er den nemmeste måde at få flere aktive minutter på. Det skåner leddene og giver ikke træthed til næste pas.'},
  AR1:{name:'Restitutionstur',kind:'mobilitet',label:'Aktiv restitution',dur:'25 min',min:25,
     steps:['25 min gang, cykel eller svømning i meget roligt tempo','Under 60 % af maks puls · hårdhed 2–3 af 10','Du skal kunne synge eller føre en samtale uden pause'],
     note:'Let bevægelse øger blodgennemstrømningen uden at give ny træthed. Bedst dagen efter et hårdt pas.'},
  AR2:{name:'Cykel-flush',kind:'mobilitet',label:'Aktiv restitution',dur:'20 min',min:20,
     steps:['5 min meget roligt','3 × (3 min let modstand og høj kadence, 90–100 omdr./min + 1 min helt roligt)','3 min roligt til sidst','Hold pulsen under 65 % af maks'],
     note:'Høj kadence med lav modstand får blodet rundt i benene uden at belaste musklerne. Godt efter tunge ben-dage.'},
  AR3:{name:'Rul og stræk',kind:'mobilitet',label:'Aktiv restitution',dur:'20 min',min:20,
     steps:['Foam roller · 60–90 sek pr. område: lægge, lår forside, baglår, baller, øvre ryg','Rul langsomt og stop 10 sek på ømme punkter. Det må gerne ømme, ikke gøre ondt','Hoftebøjerstræk · 2 × 30 sek pr. side','Baglårsstræk · 2 × 30 sek pr. side','Bryststræk i dørkarm · 2 × 30 sek'],
     note:'Foam rolling kan mindske ømhed og give bedre bevægelighed i timerne efter. Drik vand bagefter.'},
  AR4:{name:'Let kropsvægtcirkel',kind:'mobilitet',label:'Aktiv restitution',dur:'20 min',min:20,
     steps:['3 runder i roligt tempo:','10 air squats','10 glute bridges','8 bird dogs pr. side','10 vægarmstræk (armene op ad væggen)','20 sek dead bug','1 min march på stedet','Hårdhed 3–4 af 10. Du skal ikke blive forpustet'],
     note:'Holder bevægemønstrene i gang og løsner stive led uden at belaste. Ingen vægte.'},
  AR5:{name:'Rolig yoga og vejrtrækning',kind:'mobilitet',label:'Aktiv restitution',dur:'15 min',min:15,
     steps:['Kat-ko · 1 min','Nedadgående hund · 5 rolige vejrtrækninger','Lav lunge · 5 vejrtrækninger pr. side','Barnets stilling · 1 min','Liggende rotation · 1 min pr. side','Vejrtrækning på ryggen · 2 min: 4 sek ind, 6 sek ud'],
     note:'Lang udånding sænker pulsen og hjælper kroppen ned i gear. Godt om aftenen.'},
  S:{name:'Styrke',kind:'styrke',dur:'ca. 60 min',steps:['Appen vælger dagens styrkepas.'],note:''},
  CF:{name:'CrossFit',kind:'crossfit',dur:'',steps:['Vælg format og tid, og byg dagens pas.'],note:''},
  R:{name:'Hvile',kind:'hvile',dur:'',steps:['Gåtur eller let mobilitet','Søvn og mad er dagens træning'],note:''}
};
const DEFAULT_PLAN={0:'R',1:'A',2:'I4',3:'B',4:'Z2',5:'C',6:'I30'};
/* Bryan Johnson Blueprint: 6 h/week, 3 strength + 3 cardio, 150 min zone 2, 75 min vigorous, mobility and balance */
const BP_PLAN={0:'Z2L',1:'A',2:'I5',3:'B',4:'Z2L',5:'I30B',6:'C'};
const BP_ADDONS={1:'MOB',3:'MOB',6:'MOB',0:'BAL'};
const DELOAD_EVERY=5;
const IC={
  kulde:'<svg viewBox="0 0 24 24"><path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11M9 4l3 2 3-2M9 20l3-2 3 2"/></svg>',
  meditation:'<svg viewBox="0 0 24 24"><circle cx="12" cy="6" r="2.5"/><path d="M4 18c3-1 5-2 8-2s5 1 8 2M7 14l5-3 5 3"/></svg>',
  tak:'<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/></svg>'};
/* Habits progress weekly from the week you started: cold +15 s/week to 10 min, meditation +2 min/week to 30 min */
const HABITS=[
  {id:'kulde',name:'Koldt bad',unit:'sek',target:w=>Math.min(600,15*(w+1)),
   tips:['Start med et varmt bad, så længe du har lyst. Sæt den varme opstart til det, du har brug for.','Mens vandet er varmt, så slap af i kroppen og træk vejret langsomt.','Når timeren bipper, så skift til koldt vand.','Start kort og øg tiden gradvist. Appen lægger 15 sek på hver uge.','Gør det til en daglig vane. Det er gentagelsen, der bygger tolerancen.','Tag det ikke lige efter styrketræning. Kulde kan dæmpe muskelvæksten, så vent mindst 4–6 timer.','Stop med det samme, hvis du bliver svimmel eller følelsesløs.']},
  {id:'meditation',name:'Meditation',unit:'min',target:w=>Math.min(30,10+2*w)*60,
   tips:['Sid oprejst, luk øjnene og følg vejret ind og ud.','Når tankerne vandrer, så læg mærke til det og vend roligt tilbage til vejret.','Samme tid hver dag gør det lettere at holde fast i.']},
  {id:'tak',name:'Taknemmelighed',unit:'',target:()=>0,
   tips:['Skriv i nutid, som om det allerede er sket: "Jeg er taknemmelig for, at jeg ..."','Skriv det fysisk ned på papir. Tryk så "Skrevet i dag".']}];
const HCOLORS=['#E5484D','#30A46C','#0091FF','#F5A524','#8E4EC6','#12A594','#E93D82'];
function habits(){return HABITS.concat((state.customHabits||[]).map(c=>({id:c.id,name:c.name,custom:true,check:c.kind==='check',color:c.color,since:c.since,unit:'min',
  target:w=>c.kind==='check'?0:Math.round(Math.min(c.maxMin,c.startMin+c.stepMin*w)*60),
  tips:c.note?c.note.split('\n').filter(Boolean):(c.kind==='check'?['Markér vanen, når du har gjort den.']:['Start timeren, og lad alarmen fortælle dig, når du er færdig.'])})))}
const findHabit=id=>habits().find(x=>x.id===id);
const hw=(h,d)=>h&&h.since?Math.max(0,Math.floor((pd(weekDates(d)[0])-pd(h.since))/(7*864e5))):habitWeek(d);
const habitWeek=d=>state.habitStart?Math.max(0,Math.floor((pd(weekDates(d)[0])-pd(state.habitStart))/(7*864e5))):0;
const habitDone=(id,d)=>logsOn(d).some(l=>l.type===id);
function habitStreak(id){let n=0,d=pd(TODAY);if(!habitDone(id,TODAY))d.setDate(d.getDate()-1);for(;;){if(habitDone(id,ds(d))){n++;d.setDate(d.getDate()-1)}else break}return n}
function habitTargetText(h,d){if(h.id==='tak')return 'Skriv 3 ting som om de er sket';if(h.check)return 'Afkryds når den er gjort';const t=h.target(hw(h,d||TODAY));return h.id==='kulde'||t<60||t%60?fmtTime(t):Math.round(t/60)+' min'}
const BP_GOALS={total:360,z2:150,vig:75,str:3,mob:45};

