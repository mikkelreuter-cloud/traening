/* Built from src/engine.js and src/sw-cache.js by tools/build.py. Do not edit by hand.
   This file has two jobs. In the app page (window exists) it loads the CrossFit engine (Passemotoren) as window.CF.
   As the service worker (no window) it runs the offline cache. */
if(typeof window!=='undefined'&&typeof document!=='undefined'){
/* Passemotoren: rules and generator for CrossFit workouts (motor.js) */
(function(){
/* ===========================================================================
   PASSEMOTOREN \u2014 regels\u00e6t og generator til CrossFit-pas
   ---------------------------------------------------------------------------
   Ren JavaScript, ingen afh\u00e6ngigheder. Kan bruges i browser eller Node.
   Tre dele:  1) BEVAEGELSER   2) REGLER (h\u00e5rde + bl\u00f8de)   3) MOTOR
   ======================================================================== */

/* --- 1) BEV\u00c6GELSER --------------------------------------------------------
   mv(id, navn, mod, pat, musk, tal, r, vaegt, enhed, udstyr, niveau, skal)

   mod     M = monostrukturelt (motor), G = gymnastik (kropsv\u00e6gt), W = v\u00e6gt
   pat     bev\u00e6gelsesm\u00f8nstre. To \u00f8velser med samme m\u00f8nster m\u00e5 ikke st\u00e5
           i samme pas (regel H1). En \u00f8velse kan have flere:
           push_v lodret pres \u00b7 push_h vandret pres \u00b7 pull_v lodret tr\u00e6k
           pull_h vandret tr\u00e6k \u00b7 squat \u00b7 hinge (hofteled) \u00b7 core \u00b7 carry \u00b7 mono
   musk    belastede muskelgrupper, vigtigste f\u00f8rst
   tal     [skill 1-3, load 0-3, greb 0-2, midline 0-2, rate]
           rate = reps (eller meter/kalorier) pr. minut i j\u00e6vnt metcon-tempo
   r       [min, max] reps pr. runde i et typisk 3-delt pas p\u00e5 10-20 min.
           Motoren skalerer selv op/ned efter tidsdom\u00e6ne og rundetid.
-------------------------------------------------------------------------- */

function mv(id, navn, mod, pat, musk, tal, r, vaegt, enhed, udstyr, niveau, skal) {
  return { id, navn, mod, pat, musk, skill: tal[0], load: tal[1], greb: tal[2],
    mid: tal[3], rate: tal[4], rMin: r[0], rMax: r[1],
    vaegt: vaegt || null, enhed: enhed || "reps", udstyr, niveau, skal };
}
var B = "Begynder", O = "\u00d8vet", A = "Avanceret";

var BEVAEGELSER = [
  /* --- Monostrukturelt ------------------------------------------------- */
  mv("loeb","l\u00f8b","M",["mono"],["lunger","quad","l\u00e6g"],[1,0,0,0,200],[150,400],null,"meter","Ingen udstyr",B,"halver distancen"),
  mv("sprint","sprint","M",["mono"],["quad","l\u00e6g","lunger"],[1,0,0,0,260],[100,200],null,"meter","Ingen udstyr",B,"halver distancen"),
  mv("row_m","row","M",["mono"],["lunger","ryg","quad"],[1,0,1,0,230],[200,500],null,"meter","Ro-maskine",B,"halver distancen"),
  mv("row_cal","row","M",["mono"],["lunger","ryg","quad"],[1,0,1,0,15],[10,25],null,"kalorier","Ro-maskine",B,"reducer til to tredjedele"),
  mv("bike_cal","cykel","M",["mono"],["quad","lunger"],[1,0,0,0,18],[10,25],null,"kalorier","Cykel",B,"reducer til to tredjedele"),
  mv("ski_cal","ski","M",["mono"],["lunger","ryg","core"],[1,0,1,0,15],[10,25],null,"kalorier","Ski-maskine",B,"reducer til to tredjedele"),
  mv("du","double unders","M",["mono"],["l\u00e6g","skulder","lunger"],[2,0,0,0,70],[30,60],null,"reps","Sjippetov",O,"dobbelt s\u00e5 mange single unders"),
  mv("su","single unders","M",["mono"],["l\u00e6g","lunger"],[1,0,0,0,110],[60,120],null,"reps","Sjippetov",B,"del i to s\u00e6t"),
  mv("burpee","burpees","M",["mono","push_h"],["lunger","bryst","quad"],[1,0,0,0,13],[8,15],null,"reps","Ingen udstyr",B,"step-up burpees"),
  mv("shuttle","shuttle runs (10 m frem og tilbage)","M",["mono"],["quad","lunger"],[1,0,0,0,10],[4,8],null,"reps","Ingen udstyr",B,"halver antallet"),

  /* --- Gymnastik: pres ------------------------------------------------- */
  mv("pushup","push-ups","G",["push_h"],["bryst","triceps","skulder","core"],[1,0,0,1,20],[10,20],null,"reps","Ingen udstyr",B,"push-ups fra kn\u00e6"),
  mv("hrpushup","hand-release push-ups","G",["push_h"],["bryst","triceps","skulder"],[1,0,0,1,17],[10,18],null,"reps","Ingen udstyr",O,"fra kn\u00e6"),
  mv("ringpushup","ring push-ups","G",["push_h"],["bryst","triceps","core"],[2,0,1,1,14],[8,15],null,"reps","Ringe",O,"push-ups i gulvet"),
  mv("hspu","handstand push-ups","G",["push_v"],["skulder","triceps","core"],[3,0,0,1,9],[3,8],null,"reps","Ingen udstyr",A,"pike push-ups fra kasse"),
  mv("strict_hspu","strict handstand push-ups","G",["push_v"],["skulder","triceps","core"],[3,0,0,1,6],[2,5],null,"reps","Ingen udstyr",A,"pike push-ups fra gulv"),
  mv("pike","pike push-ups","G",["push_v"],["skulder","triceps"],[2,0,0,1,15],[8,15],null,"reps","Ingen udstyr",B,"h\u00e6nderne p\u00e5 gulvet i stedet for kasse"),
  mv("ringdip","ring dips","G",["push_v"],["skulder","triceps","bryst"],[3,0,1,0,12],[6,12],null,"reps","Ringe",A,"box dips"),
  mv("boxdip","box dips","G",["push_v"],["triceps","skulder"],[1,0,0,0,18],[10,20],null,"reps","Kasse",B,"f\u00f8dderne t\u00e6ttere p\u00e5 kroppen"),
  mv("wallwalk","wall walks","G",["push_v","core"],["skulder","core","triceps"],[2,0,0,2,6],[3,6],null,"reps","Ingen udstyr",O,"inchworms"),
  mv("hs_hold","handstand hold","G",["push_v","core"],["skulder","core"],[2,0,0,2,60],[20,45],null,"sek","Ingen udstyr",O,"plank"),

  /* --- Gymnastik: tr\u00e6k ------------------------------------------------- */
  mv("pullup","pull-ups","G",["pull_v"],["ryg","biceps","greb"],[2,0,1,0,16],[7,15],null,"reps","Pull-up bar",O,"ring rows"),
  mv("c2b","chest-to-bar pull-ups","G",["pull_v"],["ryg","biceps","greb"],[3,0,1,0,13],[6,12],null,"reps","Pull-up bar",A,"almindelige pull-ups"),
  mv("strict_pullup","strict pull-ups","G",["pull_v"],["ryg","biceps","greb"],[2,0,1,0,9],[4,9],null,"reps","Pull-up bar",A,"assisteret med elastik"),
  mv("jump_pullup","jumping pull-ups","G",["pull_v"],["ryg","biceps","quad"],[1,0,1,0,22],[12,20],null,"reps","Pull-up bar",B,"ring rows"),
  mv("ringrow","ring rows","G",["pull_h"],["ryg","biceps","core"],[1,0,1,0,18],[10,18],null,"reps","Ringe",B,"f\u00f8dderne l\u00e6ngere tilbage"),
  mv("mu","muscle-ups","G",["pull_v","push_v"],["ryg","skulder","triceps","greb"],[3,0,2,0,5],[2,6],null,"reps","Ringe",A,"jumping muscle-ups eller pull-up + dip"),
  mv("barmu","bar muscle-ups","G",["pull_v","push_v"],["ryg","skulder","greb"],[3,0,2,0,6],[2,7],null,"reps","Pull-up bar",A,"chest-to-bar pull-ups"),
  mv("rope","rope climbs","G",["pull_v","carry"],["ryg","greb","biceps"],[3,0,2,0,3],[1,4],null,"reps","Reb",A,"3 pull-ups pr. rope climb"),
  mv("t2b","toes-to-bar","G",["core"],["core","greb","ryg"],[3,0,1,2,14],[8,15],null,"reps","Pull-up bar",A,"hanging knee raises"),
  mv("k2e","knees-to-elbows","G",["core"],["core","greb"],[2,0,1,2,16],[8,15],null,"reps","Pull-up bar",O,"hanging knee raises"),
  mv("hkr","hanging knee raises","G",["core"],["core","greb"],[1,0,1,1,20],[10,20],null,"reps","Pull-up bar",B,"liggende kn\u00e6l\u00f8ft"),

  /* --- Ben / squat ----------------------------------------------------- */
  mv("airsquat","air squats","G",["squat"],["quad","bagk\u00e6de"],[1,0,0,0,30],[15,30],null,"reps","Ingen udstyr",B,"hold til en kasse"),
  mv("jumpsquat","jump squats","G",["squat"],["quad","l\u00e6g"],[1,0,0,0,22],[12,25],null,"reps","Ingen udstyr",O,"air squats"),
  mv("lunge","walking lunge steps","G",["squat"],["quad","bagk\u00e6de"],[1,0,0,0,22],[14,30],null,"reps","Ingen udstyr",B,"halver antallet"),
  mv("jumplunge","jumping lunges","G",["squat"],["quad","l\u00e6g"],[1,0,0,0,20],[12,24],null,"reps","Ingen udstyr",O,"walking lunges"),
  mv("pistol","pistol squats (halvdelen pr. ben)","G",["squat"],["quad","core"],[3,0,0,1,14],[8,16],null,"reps","Ingen udstyr",A,"pistols til kasse"),
  mv("boxjump","box jumps 24/20","G",["squat"],["quad","l\u00e6g"],[2,0,0,0,16],[10,20],null,"reps","Kasse",O,"step-ups"),
  mv("stepover","box step-overs 24/20","G",["squat"],["quad","bagk\u00e6de"],[1,0,0,0,18],[10,20],null,"reps","Kasse",B,"lavere kasse"),
  mv("bbjo","burpee box jump-overs 24/20","M",["squat","mono","push_h"],["quad","lunger","bryst"],[2,0,0,0,10],[6,12],null,"reps","Kasse",A,"burpee step-overs"),
  mv("wallball","wall balls 9/6 kg","W",["squat","push_v"],["quad","skulder","lunger"],[2,1,0,0,15],[10,20],"9/6 kg","reps","Wall ball",O,"6/4 kg"),
  mv("goblet","goblet squats 24/16 kg","W",["squat"],["quad","core"],[1,1,1,0,20],[10,20],"24/16 kg","reps","Kettlebell",B,"16/12 kg"),
  mv("frontsquat","front squats 70/47,5 kg","W",["squat"],["quad","core"],[2,3,0,1,12],[5,9],"70/47,5 kg","reps","V\u00e6gtstang",O,"50/35 kg"),
  mv("backsquat","back squats 84/57 kg","W",["squat"],["quad","bagk\u00e6de"],[2,3,0,1,12],[5,10],"84/57 kg","reps","V\u00e6gtstang",O,"60/40 kg"),
  mv("ohs","overhead squats 43/30 kg","W",["squat","push_v"],["quad","skulder","core"],[3,2,0,1,12],[5,10],"43/30 kg","reps","V\u00e6gtstang",A,"30/20 kg eller front squat"),
  mv("thruster","thrusters 43/30 kg","W",["squat","push_v"],["quad","skulder","lunger"],[2,2,0,0,13],[7,15],"43/30 kg","reps","V\u00e6gtstang",O,"30/20 kg"),
  mv("db_thruster","dumbbell thrusters 2 x 22,5/15 kg","W",["squat","push_v"],["quad","skulder"],[2,2,1,0,12],[7,14],"2 x 22,5/15 kg","reps","H\u00e5ndv\u00e6gte",O,"2 x 15/10 kg"),
  mv("db_lunge","dumbbell lunges 2 x 22,5/15 kg","W",["squat","carry"],["quad","bagk\u00e6de","greb"],[1,2,1,0,18],[10,24],"2 x 22,5/15 kg","reps","H\u00e5ndv\u00e6gte",O,"2 x 15/10 kg"),
  mv("kb_lunge","kettlebell front rack lunges 2 x 16/12 kg","W",["squat","carry"],["quad","core"],[2,2,1,1,16],[10,20],"2 x 16/12 kg","reps","Kettlebell",O,"2 x 12/8 kg"),
  mv("sb_squat","sands\u00e6k squats 23/16 kg","W",["squat"],["quad","core"],[1,2,0,1,18],[10,20],"23/16 kg","reps","Sands\u00e6k",B,"15/10 kg"),
  mv("ohlunge","overhead walking lunge 20/15 kg plade","W",["squat","push_v","carry"],["skulder","quad","core"],[2,2,1,2,25],[15,30],"20/15 kg","meter","V\u00e6gtstang",A,"uden plade"),

  /* --- Hofteled / v\u00e6gtl\u00f8ftning ----------------------------------------- */
  mv("deadlift","deadlifts 102/70 kg","W",["hinge"],["bagk\u00e6de","greb","core"],[2,3,1,2,13],[6,12],"102/70 kg","reps","V\u00e6gtstang",O,"70/50 kg"),
  mv("deadlift_t","deadlifts 143/100 kg","W",["hinge"],["bagk\u00e6de","greb","core"],[2,3,2,2,8],[3,6],"143/100 kg","reps","V\u00e6gtstang",A,"100/70 kg"),
  mv("sdhp","sumo deadlift high pulls 43/30 kg","W",["hinge","pull_h"],["bagk\u00e6de","ryg","skulder"],[2,2,1,1,16],[9,18],"43/30 kg","reps","V\u00e6gtstang",O,"30/20 kg"),
  mv("kbs","kettlebell swings 24/16 kg","W",["hinge"],["bagk\u00e6de","skulder","greb"],[1,1,1,1,22],[15,25],"24/16 kg","reps","Kettlebell",B,"16/12 kg"),
  mv("kbs_t","kettlebell swings 32/24 kg","W",["hinge"],["bagk\u00e6de","skulder","greb"],[2,2,1,1,18],[12,21],"32/24 kg","reps","Kettlebell",O,"24/16 kg"),
  mv("powerclean","power cleans 61/43 kg","W",["hinge","pull_v"],["bagk\u00e6de","ryg","quad"],[3,2,1,1,11],[5,10],"61/43 kg","reps","V\u00e6gtstang",O,"43/30 kg"),
  mv("hpc","hang power cleans 52/35 kg","W",["hinge","pull_v"],["bagk\u00e6de","ryg","greb"],[2,2,1,1,13],[6,12],"52/35 kg","reps","V\u00e6gtstang",O,"40/27,5 kg"),
  mv("squatclean","squat cleans 61/43 kg","W",["hinge","squat"],["quad","bagk\u00e6de","ryg"],[3,3,1,1,9],[4,8],"61/43 kg","reps","V\u00e6gtstang",A,"43/30 kg"),
  mv("powersnatch","power snatches 43/30 kg","W",["hinge","push_v"],["bagk\u00e6de","skulder","ryg"],[3,2,1,1,11],[5,10],"43/30 kg","reps","V\u00e6gtstang",A,"30/20 kg"),
  mv("cj","clean & jerks 61/43 kg","W",["hinge","push_v"],["bagk\u00e6de","skulder","quad"],[3,2,1,1,9],[4,9],"61/43 kg","reps","V\u00e6gtstang",O,"43/30 kg"),
  mv("db_snatch","dumbbell snatches 22,5/15 kg (skiftevis)","W",["hinge","push_v"],["bagk\u00e6de","skulder","greb"],[2,1,1,1,18],[10,20],"22,5/15 kg","reps","H\u00e5ndv\u00e6gte",B,"15/10 kg"),
  mv("db_cj","dumbbell hang clean & jerks 2 x 22,5/15 kg","W",["hinge","push_v"],["skulder","bagk\u00e6de"],[2,2,1,1,12],[6,12],"2 x 22,5/15 kg","reps","H\u00e5ndv\u00e6gte",O,"2 x 15/10 kg"),
  mv("kb_clean","kettlebell cleans (skiftevis) 24/16 kg","W",["hinge"],["bagk\u00e6de","greb"],[2,1,1,1,18],[10,20],"24/16 kg","reps","Kettlebell",B,"16/12 kg"),
  mv("kb_snatch","kettlebell snatches (skiftevis) 24/16 kg","W",["hinge","push_v"],["bagk\u00e6de","skulder","greb"],[3,1,1,1,16],[10,20],"24/16 kg","reps","Kettlebell",A,"16/12 kg"),
  mv("sb_clean","sands\u00e6k cleans 23/16 kg","W",["hinge"],["bagk\u00e6de","ryg","greb"],[2,2,1,1,14],[8,16],"23/16 kg","reps","Sands\u00e6k",O,"15/10 kg"),
  mv("sb_gto","sands\u00e6k ground-to-overhead 23/16 kg","W",["hinge","push_v"],["bagk\u00e6de","skulder"],[2,2,1,1,11],[6,12],"23/16 kg","reps","Sands\u00e6k",O,"15/10 kg"),
  mv("mbclean","medicinbold cleans 9/6 kg","W",["hinge","squat"],["bagk\u00e6de","quad"],[2,1,0,1,16],[10,20],"9/6 kg","reps","Wall ball",B,"6/4 kg"),
  mv("devil","devil press 2 x 22,5/15 kg","W",["hinge","push_v","push_h"],["skulder","bagk\u00e6de","lunger"],[2,2,1,1,8],[4,10],"2 x 22,5/15 kg","reps","H\u00e5ndv\u00e6gte",A,"2 x 15/10 kg"),

  /* --- Pres med v\u00e6gt --------------------------------------------------- */
  mv("press","shoulder press 43/30 kg","W",["push_v"],["skulder","triceps","core"],[1,2,0,1,13],[6,12],"43/30 kg","reps","V\u00e6gtstang",O,"30/20 kg"),
  mv("pushpress","push press 52/35 kg","W",["push_v"],["skulder","triceps","quad"],[2,2,0,1,15],[7,14],"52/35 kg","reps","V\u00e6gtstang",O,"40/27,5 kg"),
  mv("pushjerk","push jerks 61/43 kg","W",["push_v"],["skulder","quad","triceps"],[2,2,0,1,13],[6,12],"61/43 kg","reps","V\u00e6gtstang",O,"43/30 kg"),
  mv("db_press","dumbbell push press 2 x 22,5/15 kg","W",["push_v"],["skulder","triceps"],[1,2,1,0,15],[8,15],"2 x 22,5/15 kg","reps","H\u00e5ndv\u00e6gte",B,"2 x 15/10 kg"),
  mv("kb_press","double kettlebell press 2 x 24/16 kg","W",["push_v"],["skulder","core","greb"],[2,2,1,1,12],[6,12],"2 x 24/16 kg","reps","Kettlebell",O,"2 x 16/12 kg"),
  mv("bench","dumbbell bench press 2 x 27,5/18 kg","W",["push_h"],["bryst","triceps"],[1,2,1,0,14],[8,15],"2 x 27,5/18 kg","reps","H\u00e5ndv\u00e6gte",O,"2 x 18/12 kg"),
  mv("bbrow","bent-over rows 52/35 kg","W",["pull_h"],["ryg","biceps","greb"],[1,2,1,1,14],[8,15],"52/35 kg","reps","V\u00e6gtstang",O,"40/27,5 kg"),
  mv("db_row","dumbbell rows pr. side 22,5/15 kg","W",["pull_h"],["ryg","biceps","greb"],[1,1,1,0,16],[8,15],"22,5/15 kg","reps","H\u00e5ndv\u00e6gte",B,"15/10 kg"),

  /* --- Core ------------------------------------------------------------ */
  mv("situp","sit-ups","G",["core"],["core"],[1,0,0,1,25],[15,30],null,"reps","Ingen udstyr",B,"halver antallet"),
  mv("ghd","GHD sit-ups","G",["core"],["core","bagk\u00e6de"],[2,0,0,2,18],[10,20],null,"reps","GHD",A,"almindelige sit-ups"),
  mv("hollow","hollow rocks","G",["core"],["core"],[2,0,0,2,22],[12,25],null,"reps","Ingen udstyr",O,"knee tucks"),
  mv("vup","V-ups","G",["core"],["core"],[2,0,0,2,20],[10,20],null,"reps","Ingen udstyr",O,"sit-ups"),
  mv("plank","plank","G",["core"],["core","skulder"],[1,0,0,2,60],[30,60],null,"sek","Ingen udstyr",B,"plank fra kn\u00e6"),
  mv("twist","russian twists 16/12 kg","G",["core"],["core"],[1,1,0,1,26],[16,30],"16/12 kg","reps","Kettlebell",B,"uden v\u00e6gt"),
  mv("backext","back extensions","G",["core","hinge"],["bagk\u00e6de","core"],[1,0,0,1,22],[12,25],null,"reps","GHD",B,"supermans p\u00e5 gulvet"),
  mv("superman","supermans","G",["core","hinge"],["bagk\u00e6de","core"],[1,0,0,1,25],[15,25],null,"reps","Ingen udstyr",B,"hold kortere tid"),
  mv("lsit","L-sit hold","G",["core"],["core","greb"],[2,0,1,2,45],[15,35],null,"sek","Pull-up bar",O,"tuck sit"),

  /* --- B\u00e6ring og sl\u00e6de ------------------------------------------------- */
  mv("farmer","farmer carry 2 x 24/16 kg","W",["carry"],["greb","core","bagk\u00e6de"],[1,2,2,1,60],[50,200],"2 x 24/16 kg","meter","Kettlebell",B,"2 x 16/12 kg"),
  mv("oh_carry","overhead carry 22,5/15 kg","W",["carry","push_v"],["skulder","core"],[2,2,1,2,50],[30,100],"22,5/15 kg","meter","H\u00e5ndv\u00e6gte",O,"15/10 kg"),
  mv("fr_carry","front rack carry 52/35 kg","W",["carry"],["core","skulder","quad"],[2,2,1,2,50],[30,100],"52/35 kg","meter","V\u00e6gtstang",O,"40/27,5 kg"),
  mv("sb_carry","sands\u00e6k-b\u00e6ring 23/16 kg","W",["carry"],["core","bagk\u00e6de","greb"],[1,2,1,1,55],[50,200],"23/16 kg","meter","Sands\u00e6k",B,"15/10 kg"),
  mv("sled_push","sl\u00e6deskub","W",["carry","squat"],["quad","bagk\u00e6de","lunger"],[1,2,0,0,40],[20,60],null,"meter","Sl\u00e6de",B,"lettere sl\u00e6de"),
  mv("sled_pull","sl\u00e6detr\u00e6k","W",["carry","pull_h"],["ryg","bagk\u00e6de","greb"],[1,2,2,0,35],[20,60],null,"meter","Sl\u00e6de",B,"lettere sl\u00e6de"),
  mv("tgu","Turkish get-ups (halvdelen pr. side) 24/16 kg","W",["carry","core"],["skulder","core","greb"],[3,2,1,2,6],[4,10],"24/16 kg","reps","Kettlebell",A,"16/12 kg"),
];

/* --- 2) REGLER -----------------------------------------------------------
   H\u00e5rde regler (H) bruges af generatoren og kan ikke brydes.
   Bl\u00f8de regler (S) er anbefalinger: de tjekkes og vises som advarsler.
-------------------------------------------------------------------------- */

var REGLER = [
  { id:"H1", type:"h\u00e5rd", navn:"Ingen gentagne bev\u00e6gelsesm\u00f8nstre",
    tekst:"To \u00f8velser i samme pas m\u00e5 ikke dele bev\u00e6gelsesm\u00f8nster. Push-ups og handstand push-ups er begge pres; den anden \u00f8velse d\u00f8r af den f\u00f8rste i stedet for at udfordre noget nyt.",
    undtagelse:"Specialpas der med vilje stresser \u00e9t m\u00f8nster (fx JT: handstand push-ups, ring dips, push-ups). S\u00e5 skal volumen ned." },
  { id:"H1b", type:"h\u00e5rd", navn:"H\u00f8jst \u00e9t pres og \u00e9t tr\u00e6k",
    tekst:"Et pas m\u00e5 indeholde \u00e9n pressende og \u00e9n tr\u00e6kkende \u00f8velse \u2014 ikke to af hver. Overkroppens sm\u00e5 muskelgrupper bliver tr\u00e6tte l\u00e6nge f\u00f8r benene og motoren, s\u00e5 to pres efter hinanden betyder bare at den anden \u00f8velse udf\u00f8res d\u00e5rligt.",
    undtagelse:"Et bevidst overkropspas, hvor den samlede volumen s\u00e6ttes tilsvarende ned." },
  { id:"H2", type:"h\u00e5rd", navn:"H\u00f8jst \u00e9n tung \u00f8velse",
    tekst:"Kun \u00e9n \u00f8velse pr. pas m\u00e5 v\u00e6re tung (over cirka 70 % af 1RM). To tunge \u00f8velser g\u00f8r passet til styrketr\u00e6ning med d\u00e5rlig teknik \u2014 belastningen begr\u00e6nser pulsen, og pulsen begr\u00e6nser teknikken." },
  { id:"H3", type:"h\u00e5rd", navn:"Maks to grebs\u00f8velser",
    tekst:"Pull-ups, kettlebell swings, deadlifts, farmer carry og rope climbs tr\u00e6kker alle p\u00e5 grebet. Tre af dem i samme pas betyder at h\u00e6nderne giver op f\u00f8r motoren, og s\u00e5 tr\u00e6ner du ikke det passet var sat op til." },
  { id:"H4", type:"h\u00e5rd", navn:"H\u00f8jst \u00e9n teknisk tung \u00f8velse over 12 minutter",
    tekst:"Snatch, squat clean, muscle-ups og overhead squat kr\u00e6ver kvalitet. I pas over 12 minutter m\u00e5 der kun v\u00e6re \u00e9n af dem, og reps pr. runde skal holdes lavt." },
  { id:"H5", type:"h\u00e5rd", navn:"Tungt hofteled ikke sammen med h\u00e5rd midline",
    tekst:"Tung deadlift eller clean m\u00e5 ikke st\u00e5 sammen med h\u00f8j-volumen midline-arbejde som GHD sit-ups eller toes-to-bar. N\u00e5r maven er tr\u00e6t, runder ryggen \u2014 det er den klassiske skadesmekanisme." },
  { id:"H6", type:"h\u00e5rd", navn:"\u00c9n motor-\u00f8velse",
    tekst:"H\u00f8jst \u00e9n monostrukturel \u00f8velse (l\u00f8b, ro, cykel, sjip) pr. pas. To g\u00f8r det til en konditionstest i stedet for et metcon \u2014 med mindre det netop er form\u00e5let." },
  { id:"H7", type:"h\u00e5rd", navn:"Kun udstyr du har",
    tekst:"Alle \u00f8velser skal kunne laves med det udstyr der er til r\u00e5dighed. En skalering er ikke en erstatning for udstyr du ikke har." },
  { id:"H8", type:"h\u00e5rd", navn:"Niveau styrer \u00f8velsesvalg",
    tekst:"\u00d8velser over atletens niveau kommer ikke i passet. Muscle-ups i et begynderpas giver et pas hvor tiden g\u00e5r med at stirre p\u00e5 ringene." },
  { id:"H9", type:"h\u00e5rd", navn:"H\u00f8jst to \u00f8velser pr. muskelgruppe",
    tekst:"To \u00f8velser m\u00e5 gerne dele prim\u00e6r muskelgruppe, tre m\u00e5 ikke. Thrusters, box jumps og lunges er tre forskellige m\u00f8nstre, men det er stadig tre gange quadriceps." },

  { id:"S1", type:"bl\u00f8d", navn:"Par pres med tr\u00e6k",
    tekst:"Det mest robuste par er et pres og et tr\u00e6k: mens det ene arbejder, restituerer det andet. Fran (thrusters og pull-ups) og Diane (deadlift og handstand push-ups) er samme id\u00e9." },
  { id:"S2", type:"bl\u00f8d", navn:"Tripletten: motor, v\u00e6gt, kropsv\u00e6gt",
    tekst:"Det mest p\u00e5lidelige treklang er \u00e9n monostrukturel, \u00e9n med v\u00e6gt og \u00e9n gymnastisk \u00f8velse. Helen (l\u00f8b, kettlebell swings, pull-ups) er skabelonen." },
  { id:"S3", type:"bl\u00f8d", navn:"Hold rundetiden p\u00e5 60-120 sekunder",
    tekst:"I en AMRAP skal en runde tage mellem \u00e9t og to minutter. Under 60 sekunder bliver det en \u00f8velse i at skifte station; over to minutter mister du f\u00f8lelsen af runder og g\u00e5r i st\u00e5." },
  { id:"S4", type:"bl\u00f8d", navn:"Reps skal kunne tages i h\u00f8jst to s\u00e6t",
    tekst:"S\u00e6t reps pr. runde s\u00e5 atleten kan tage dem unbroken i runde 1 og i h\u00f8jst to s\u00e6t i runde 3. Reps der altid skal deles i fem s\u00e6t g\u00f8r passet til en pausetest." },
  { id:"S5", type:"bl\u00f8d", navn:"Teknik f\u00f8r tr\u00e6thed",
    tekst:"Den mest tekniske \u00f8velse st\u00e5r f\u00f8rst i runden, hvor du er mindst tr\u00e6t. Undtagelsen er korte pas hvor r\u00e6kkef\u00f8lgen ikke f\u00e5r tid til at betyde noget." },
  { id:"S6", type:"bl\u00f8d", navn:"Motoren paces eller afslutter",
    tekst:"I runder for tid st\u00e5r l\u00f8b eller ro f\u00f8rst og s\u00e6tter rundens tempo. I en AMRAP st\u00e5r den sidst, hvor den b\u00e5de giver vejrtr\u00e6kning og afg\u00f8r hvor mange runder du f\u00e5r." },
  { id:"S7", type:"bl\u00f8d", navn:"V\u00e6gten f\u00f8lger tidsdom\u00e6net",
    tekst:"Korte pas t\u00e5ler tung v\u00e6gt, lange g\u00f8r ikke. Over 20 minutter skal belastningen v\u00e6re let nok til at du kan bev\u00e6ge dig uafbrudt \u2014 ellers bliver det et pas i at hvile." },
  { id:"S8", type:"bl\u00f8d", navn:"To til fire \u00f8velser",
    tekst:"To \u00f8velser giver et skarpt pas, tre et komplet, fire er gr\u00e6nsen. Fem eller flere h\u00f8rer i en chipper, hvor hver \u00f8velse kun m\u00f8des \u00e9n gang." },
  { id:"S9", type:"bl\u00f8d", navn:"Varier tidsdom\u00e6ne hen over ugen",
    tekst:"K\u00f8r ikke samme l\u00e6ngde to dage i tr\u00e6k. En uge b\u00f8r indeholde noget under 8 minutter, noget p\u00e5 10-20 og noget over 25." },
  { id:"S10", type:"bl\u00f8d", navn:"Skal\u00e9r stimulus, ikke tal",
    tekst:"N\u00e5r du skalerer, s\u00e5 bevar den tid passet var t\u00e6nkt til. Et pas p\u00e5 8 minutter der tager 20, er et andet pas \u2014 ret v\u00e6gten og reps indtil tiden passer." },
];

/* --- 3) MOTOR ------------------------------------------------------------ */

var NIVEAU_RANG = { "Begynder":0, "\u00d8vet":1, "Avanceret":2 };
var DOMAENER = [
  { id:"kort",   navn:"Under 8 min",  min:4,  max:8,  rundeSek:[50,80],   slots:[2,3] },
  { id:"mellem", navn:"8-20 min",     min:8,  max:20, rundeSek:[80,115],  slots:[2,3] },
  { id:"lang",   navn:"20-35 min",    min:20, max:35, rundeSek:[100,150], slots:[3,4] },
  { id:"ultra",  navn:"Over 35 min",  min:35, max:60, rundeSek:[120,200], slots:[3,5] },
];
function domaeneFor(min) {
  for (var i = 0; i < DOMAENER.length; i++) if (min <= DOMAENER[i].max) return DOMAENER[i];
  return DOMAENER[DOMAENER.length - 1];
}

var FORMATER = [
  { id:"amrap",    navn:"AMRAP",                  score:"Runder + reps",  domaener:["kort","mellem","lang","ultra"] },
  { id:"rft",      navn:"Runder for tid",          score:"Samlet tid",     domaener:["kort","mellem","lang"] },
  { id:"stige_ned",navn:"Faldende rep-skema",      score:"Samlet tid",     domaener:["kort","mellem"] },
  { id:"stige_op", navn:"Stigende stige",          score:"Samlet tid",     domaener:["mellem","lang"] },
  { id:"emom",     navn:"EMOM",                    score:"Gennemf\u00f8rte minutter", domaener:["mellem","lang"] },
  { id:"exmom",    navn:"Hvert 2.-3. minut",       score:"Gennemf\u00f8rt arbejde", domaener:["mellem","lang"] },
  { id:"interval", navn:"Intervaller",             score:"Langsomste s\u00e6t", domaener:["mellem","lang"] },
  { id:"chipper",  navn:"Chipper",                 score:"Samlet tid",     domaener:["lang","ultra"] },
  { id:"tabata",   navn:"Tabata",                  score:"Laveste runde",  domaener:["kort","mellem"] },
  { id:"doedved",  navn:"D\u00f8d ved (stigende EMOM)", score:"Sidste minut",   domaener:["mellem"] },
];
function slotInterval(fmtId, dom) {
  var d = dom || DOMAENER[1];
  switch (fmtId) {
    case "doedved":   return [1, 1];
    case "emom":      return [1, 5];
    case "interval":  return [1, 3];
    case "tabata":    return [1, 4];
    case "stige_ned": return [2, 3];
    case "stige_op":  return [2, 3];
    case "chipper":   return [4, 8];
    case "exmom":     return [2, 4];
    // AMRAP og runder for tid: standardvalget f\u00f8lger tidsdom\u00e6net, men beder du udtrykkeligt
    // om flere \u00f8velser, f\u00e5r du dem \u2014 S8 advarer s\u00e5 i stedet for at n\u00e6gte.
    default:          return [2, 6];
  }
}
function formatFor(id) { for (var i=0;i<FORMATER.length;i++) if (FORMATER[i].id===id) return FORMATER[i]; return null; }

/* ---- H\u00e5rde regler som kontrolfunktioner ---- */
function delerMoenster(a, b) {
  for (var i = 0; i < a.pat.length; i++) if (b.pat.indexOf(a.pat[i]) >= 0) return a.pat[i];
  return null;
}
function lovligIPas(kand, valgte, opt) {
  opt = opt || {};
  if (opt.udstyr && opt.udstyr.length && kand.udstyr !== "Ingen udstyr" && opt.udstyr.indexOf(kand.udstyr) < 0) return "H7";
  if (opt.niveau && NIVEAU_RANG[kand.niveau] > NIVEAU_RANG[opt.niveau]) return "H8";
  for (var i = 0; i < valgte.length; i++) {
    if (valgte[i].id === kand.id) return "dublet";
    if (!opt.tilladSammeMoenster && delerMoenster(kand, valgte[i])) return "H1";
  }
  var alle = valgte.concat([kand]);
  if (!opt.tilladFlerePres) {
    if (alle.filter(ROLLER.pres).length > 1) return "H1b";
    if (alle.filter(ROLLER.traek).length > 1) return "H1b";
  }
  if (alle.filter(function(m){return m.load >= 3;}).length > 1) return "H2";
  if (alle.filter(function(m){return m.greb >= 1;}).length > 2) return "H3";
  if (alle.filter(function(m){return m.greb >= 2;}).length > 1) return "H3";
  if ((opt.minutter || 12) > 12 && alle.filter(function(m){return m.skill >= 3;}).length > 1) return "H4";
  var tungHinge = alle.some(function(m){return m.load >= 3 && m.pat.indexOf("hinge") >= 0;});
  if (tungHinge && alle.some(function(m){return m.mid >= 2;})) return "H5";
  if (!opt.tilladFlereMono && alle.filter(function(m){return m.pat.indexOf("mono") >= 0;}).length > 1) return "H6";
  var tael = {};
  for (var j = 0; j < alle.length; j++) {
    var g = alle[j].musk[0]; tael[g] = (tael[g] || 0) + 1;
    if (tael[g] > 2) return "H9";
  }
  return null;
}
function formatTilladt(m, fmtId) {
  if (!fmtId) return true;
  if (fmtId === "stige_op" || fmtId === "stige_ned") return m.enhed === "reps" && m.rate <= 30;
  if (fmtId === "tabata")  return m.enhed === "reps" && m.load < 2 && m.skill < 3;
  if (fmtId === "doedved") return m.enhed === "reps" && m.skill < 3 && m.rate >= 8;
  if (fmtId === "chipper") return m.enhed !== "sek";
  if (fmtId === "emom")    return m.rate >= 6;
  return true;
}
function alternativer(valgte, iSlot, rolle, opt) {
  var andre = valgte.filter(function(_, i) { return i !== iSlot; });
  return BEVAEGELSER.filter(function(m) {
    if (rolle && !passerRolle(m, rolle)) return false;
    if (opt && !formatTilladt(m, opt.fmtId)) return false;
    return lovligIPas(m, andre, opt) === null;
  });
}

/* ---- Roller: hvad en plads i passet skal udfylde ---- */
var ROLLER = {
  mono:      function(m){ return m.pat.indexOf("mono") >= 0; },
  vaegt:     function(m){ return m.mod === "W" && m.pat.indexOf("carry") < 0; },
  gym:       function(m){ return m.mod === "G"; },
  pres:      function(m){ return m.pat.indexOf("push_v") >= 0 || m.pat.indexOf("push_h") >= 0; },
  traek:     function(m){ return m.pat.indexOf("pull_v") >= 0 || m.pat.indexOf("pull_h") >= 0; },
  ben:       function(m){ return m.pat.indexOf("squat") >= 0; },
  hofte:     function(m){ return m.pat.indexOf("hinge") >= 0 && m.pat.indexOf("core") < 0; },
  core:      function(m){ return m.pat.indexOf("core") >= 0; },
  baering:   function(m){ return m.pat.indexOf("carry") >= 0; },
  letgym:    function(m){ return m.mod === "G" && m.skill <= 2 && m.load === 0; },
  hvadsomhelst: function(){ return true; },
};
function passerRolle(m, rolle) { var f = ROLLER[rolle]; return f ? f(m) : true; }

/* ---- Skabeloner: rollekombinationer der virker ---- */
var SKABELONER = [
  { roller:["pres","traek"],            navn:"Pres + tr\u00e6k",                 regler:["S1"] },
  { roller:["hofte","traek"],           navn:"Hofteled + tr\u00e6k",             regler:["S1"] },
  { roller:["hofte","pres"],            navn:"Hofteled + pres",             regler:["S1"] },
  { roller:["ben","traek"],             navn:"Ben + tr\u00e6k",                  regler:["S1"] },
  { roller:["ben","pres"],              navn:"Ben + pres",                  regler:["S1"] },
  { roller:["mono","vaegt"],            navn:"Motor + v\u00e6gt",                regler:["S2"] },
  { roller:["mono","gym"],              navn:"Motor + kropsv\u00e6gt",           regler:["S2"] },
  { roller:["mono","vaegt","gym"],      navn:"Motor + v\u00e6gt + kropsv\u00e6gt",    regler:["S2"] },
  { roller:["mono","hofte","pres"],     navn:"Motor + hofteled + pres",     regler:["S1","S2"] },
  { roller:["mono","ben","traek"],      navn:"Motor + ben + tr\u00e6k",          regler:["S1","S2"] },
  { roller:["ben","traek","core"],      navn:"Ben + tr\u00e6k + core",           regler:["S1"] },
  { roller:["hofte","pres","core"],     navn:"Hofteled + pres + core",      regler:["S1"] },
  { roller:["pres","traek","ben"],      navn:"Pres + tr\u00e6k + ben",           regler:["S1"] },
  { roller:["mono","baering","ben"],    navn:"Motor + b\u00e6ring + ben",        regler:["S2"] },
  { roller:["mono","ben","pres"],       navn:"Motor + ben + pres",           regler:["S2"] },
  { roller:["mono","ben","core"],       navn:"Motor + ben + core",           regler:["S2"] },
  { roller:["ben","pres","core"],       navn:"Ben + pres + core",            regler:["S8"] },
  { roller:["mono","pres","core"],      navn:"Motor + pres + core",          regler:["S2"] },
  { roller:["mono","traek","core"],     navn:"Motor + tr\u00e6k + core",          regler:["S2"] },
  { roller:["mono","ben","pres","core"],navn:"Fire pladser: motor, ben, pres, core", regler:["S2","S8"] },
  { roller:["mono","vaegt","gym","core"], navn:"Fire pladser: motor, v\u00e6gt, kropsv\u00e6gt, core", regler:["S2","S8"] },
  { roller:["mono","hofte","pres","ben"], navn:"Fire pladser: motor, hofteled, pres, ben",   regler:["S2","S8"] },
  { roller:["mono","pres","traek","ben","core"],          navn:"Fem pladser: motor, pres, tr\u00e6k, ben, midline",            regler:["S1","S2"] },
  { roller:["mono","hofte","pres","ben","core"],          navn:"Fem pladser: motor, hofteled, pres, ben, midline",        regler:["S1","S2"] },
  { roller:["mono","vaegt","gym","ben","core"],           navn:"Fem pladser: motor, v\u00e6gt, kropsv\u00e6gt, ben, midline",       regler:["S2"] },
  { roller:["mono","pres","traek","ben","hofte","core"],  navn:"Seks pladser: motor, pres, tr\u00e6k, ben, hofteled, midline", regler:["S1","S2"] },
  { roller:["mono","pres","traek","ben","core","baering"],navn:"Seks pladser: motor, pres, tr\u00e6k, ben, midline, b\u00e6ring",   regler:["S1","S2"] },
];

/* ---- Rep-matematik ---- */
function p\u00e6ntTal(n, rate) {
  if (n <= 6) return Math.max(1, Math.round(n));
  if (n <= 12) return Math.round(n);
  if (rate >= 50) return Math.round(n / 10) * 10;
  return Math.round(n / 5) * 5;
}
function sekFor(m, antal) { return (antal / m.rate) * 60; }

function s\u00e6tReps(movs, maalRundeSek) {
  // Start midt i hver \u00f8velses interval, skal\u00e9r s\u00e5 runden rammer m\u00e5ltiden.
  var reps = movs.map(function(m){ return (m.rMin + m.rMax) / 2; });
  for (var runde = 0; runde < 14; runde++) {
    var sek = 0;
    for (var i = 0; i < movs.length; i++) sek += sekFor(movs[i], reps[i]) + 5;
    var f = maalRundeSek / sek;
    if (Math.abs(1 - f) < 0.04) break;
    for (var j = 0; j < movs.length; j++) {
      reps[j] = Math.min(movs[j].rMax * 1.3, Math.max(movs[j].rMin, reps[j] * f));
    }
  }
  return reps.map(function(r, i){ return p\u00e6ntTal(r, movs[i].rate); });
}
function rundeSek(movs, reps) {
  var s = 0; for (var i = 0; i < movs.length; i++) s += sekFor(movs[i], reps[i]) + 5; return s;
}

/* ---- Udv\u00e6lgelse ---- */
function vaelgSkabelon(rng, dom, fmt, antalSlots) {
  var kand = SKABELONER.filter(function(s) {
    if (antalSlots) { if (s.roller.length !== antalSlots) return false; }
    else if (s.roller.length < dom.slots[0] || s.roller.length > dom.slots[1]) return false;
    if (fmt.id === "tabata" && s.roller.indexOf("vaegt") >= 0) return false;
    if (fmt.id === "doedved") return false;
    return true;
  });
  if (!kand.length && antalSlots) kand = SKABELONER.filter(function(s){ return s.roller.length === antalSlots; });
  if (!kand.length) kand = SKABELONER.filter(function(s){ return s.roller.length === 2; });
  return kand[Math.floor(rng() * kand.length)];
}
function fyldSkabelon(rng, skab, opt) {
  var valgte = [];
  for (var i = 0; i < skab.roller.length; i++) {
    var kand = BEVAEGELSER.filter(function(m) {
      if (!passerRolle(m, skab.roller[i])) return false;
      if (opt.fokus === "Styrke" && m.mod === "G" && m.load === 0 && skab.roller[i] !== "core") return rng() < 0.3;
      if (opt.fokus === "Gymnastik" && m.mod === "W" && m.load >= 2) return false;
      if (opt.fokus === "Udholdenhed" && m.load >= 3) return false;
      return lovligIPas(m, valgte, opt) === null;
    });
    if (!kand.length) return null;
    valgte.push(kand[Math.floor(rng() * kand.length)]);
  }
  return valgte;
}

/* ---- R\u00e6kkef\u00f8lge (S5, S6) ---- */
function sorterRaekkefoelge(movs, reps, fmtId) {
  var par = movs.map(function(m, i){ return { m:m, r:reps[i] }; });
  var monoFoerst = (fmtId === "rft" || fmtId === "interval" || fmtId === "stige_op");
  par.sort(function(a, b) {
    var am = a.m.pat.indexOf("mono") >= 0, bm = b.m.pat.indexOf("mono") >= 0;
    if (am !== bm) return monoFoerst ? (am ? -1 : 1) : (am ? 1 : -1);
    if (a.m.skill !== b.m.skill) return b.m.skill - a.m.skill;
    return b.m.load - a.m.load;
  });
  return { movs: par.map(function(p){return p.m;}), reps: par.map(function(p){return p.r;}) };
}

/* ---- Formatspecifik opbygning ---- */
var REP_SKEMAER = { ned:["21-15-9","15-12-9","27-21-15-9","21-18-15-12-9","12-9-6-3","30-20-10"] };

function prng(seed) {
  var s = seed >>> 0;
  return function() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
/* Minute-based formats: the time must divide evenly into the work. EMOM: minutes = movements x rounds. */
function emomAntal(min, rng) {
  var d = [2, 3, 4, 5].filter(function(n){ return min % n === 0 && min / n >= 2; });
  if (!d.length) return 1;
  var pref = d.filter(function(n){ return n <= 4; }), a = pref.length ? pref : d;
  return a[Math.floor(rng() * a.length)];
}
/* EMOM rotation: every minute is one slot, and a rest minute counts as a slot.
   So the rotation length (work minutes + rest minute) always divides the time. With rest, the work minutes are harder. */
function emomPlan(min, antal, rng, valg) {
  var rots = [1, 2, 3, 4, 5].filter(function(r){ return min % r === 0 && min / r >= 2 && (!antal || r === antal); });
  if (!antal) {
    var pref = rots.filter(function(r){ return valg === "ja" ? r >= 3 : (r >= 2 && r <= 4); });
    if (pref.length) rots = pref;
  }
  if (!rots.length) rots = [antal || 1];
  var rot = rots[Math.floor(rng() * rots.length)];
  var hvile = rot >= 2 && (valg === "ja" || (valg !== "nej" && rng() < 0.4));
  return { n: rot - (hvile ? 1 : 0), hvile: hvile };
}
function tidPasser(fmtId, min, antal, valg) {
  if (fmtId === "emom")     return antal ? min % antal === 0 : true;
  if (fmtId === "exmom")    return min % 2 === 0 || min % 3 === 0;
  if (fmtId === "tabata")   return (min + 1) % 5 === 0;
  if (fmtId === "interval") return [3, 4, 5, 6].some(function(s){ return min % s === 0 && min / s >= 2; });
  return true;
}
function byggePas(opt) {
  opt = opt || {};
  var fr\u00f8 = (opt.seed === undefined || opt.seed === null) ? Math.floor(Math.random() * 4294967295) : opt.seed;
  var rng = opt.rng || prng(fr\u00f8);
  var minutter = opt.minutter || 15;
  var dom = domaeneFor(minutter);
  var fmt = formatFor(opt.format) || (function(){
    var mulige = FORMATER.filter(function(f){ return f.domaener.indexOf(dom.id) >= 0 && tidPasser(f.id, minutter, opt.antal, opt.hvile); });
    return mulige[Math.floor(rng() * mulige.length)];
  })();
  if (fmt.domaener.indexOf(dom.id) < 0) { minutter = Math.min(Math.max(minutter, domaeneFor(minutter).min), 20); dom = domaeneFor(minutter); }
  var o = { udstyr: opt.udstyr || [], niveau: opt.niveau || "Avanceret", minutter: minutter,
            fokus: opt.fokus || "", fmtId: fmt.id };
  var graense = slotInterval(fmt.id, dom);
  var oensket = opt.antal ? Math.min(graense[1], Math.max(graense[0], opt.antal)) : 0;
  if (fmt.id === "tabata") oensket = 0;
  if (fmt.id === "emom" && oensket && minutter % oensket) oensket = 0;

  for (var forsoeg = 0; forsoeg < 160; forsoeg++) {
    var slots = oensket;
    if (!slots) {   // intet \u00f8nske: formatets eget standardvalg
      if (fmt.id === "doedved") slots = 1;
      else if (fmt.id === "emom") slots = 0;
      else if (fmt.id === "chipper") slots = (dom.id === "ultra" ? 6 : 5);
      else if (fmt.id === "stige_ned" || fmt.id === "stige_op") slots = 2;
      else if (fmt.id === "tabata") slots = Math.max(1, Math.min(4, Math.round((minutter + 1) / 5)));
      else if (fmt.id === "interval") slots = 2;
    }
    // Over fire pladser og i de frit sammensatte formater v\u00e6lger vi \u00f8velser direkte
    if (fmt.id === "emom") { var pl = emomPlan(minutter, oensket, rng, opt.hvile); slots = pl.n; o.emomHvile = pl.hvile; }
    var frit = (fmt.id === "chipper" || fmt.id === "doedved" || fmt.id === "tabata" ||
                fmt.id === "emom" || fmt.id === "interval" || (slots && slots > 6));
    var movs;
    if (slots === 1) {
      movs = frieSlots(rng, 1, o, fmt);
      if (!movs || !movs.length) continue;
    } else if (frit) {
      movs = frieSlots(rng, slots, o, fmt);
      if (!movs || movs.length < Math.max(1, slots - 1)) continue;
      if (fmt.id === "emom" && movs.length !== slots && forsoeg < 150) continue;
    } else {
      var kunReps = (fmt.id === "stige_op" || fmt.id === "stige_ned");
      var domBrug = dom;
      if (forsoeg > 60) {  // giv efter p\u00e5 antallet af pladser f\u00f8r vi giver op
        domBrug = { id:dom.id, navn:dom.navn, min:dom.min, max:dom.max, rundeSek:dom.rundeSek,
                    slots:[Math.max(2, dom.slots[0] - 1), dom.slots[1]] };
      }
      var skab = vaelgSkabelon(rng, domBrug, fmt, slots || null);
      if (!skab) continue;
      movs = fyldSkabelon(rng, skab, o);
      if (!movs) continue;
      if (movs.some(function(m){ return !formatTilladt(m, fmt.id); })) continue;
      var brud = tjekAlle(movs, o);
      if (brud.length) continue;
    }
    var pas = formater(fmt, dom, minutter, movs, o, prng(fr\u00f8));
    if (pas) {
      pas.seed = fr\u00f8; pas.opt = o;
      pas.oensketAntal = oensket || null;
      pas.antalGraense = graense;
      pas.naaedeIkkeAntal = !!(oensket && pas.movs.length + (o.emomHvile ? 1 : 0) !== oensket);
      return pas;
    }
  }
  return null;
}

var ROLLE_PRIORITET = ["mono","pres","traek","ben","hofte","core","baering"];
function frieSlots(rng, n, o, fmt) {
  var valgte = [];
  // Fordel pladserne over s\u00e5 mange forskellige roller som muligt (variation uden regelbrud)
  var roller = [];
  for (var k = 0; k < n; k++) roller.push(ROLLE_PRIORITET[k % ROLLE_PRIORITET.length]);
  if (n <= 2) roller = null;
  for (var i = 0; i < n; i++) {
    var rolle = roller ? roller[i] : null;
    var kand = BEVAEGELSER.filter(function(m) {
      if (!formatTilladt(m, fmt.id)) return false;
      if (rolle && !passerRolle(m, rolle)) return false;
      if (o.fokus === "Gymnastik" && m.mod === "W" && m.load >= 2) return false;
      if (o.fokus === "Udholdenhed" && m.load >= 3) return false;
      return lovligIPas(m, valgte, o) === null;
    });
    if (!kand.length && rolle) {   // rollen kan ikke fyldes \u2014 tag hvad der er lovligt
      kand = BEVAEGELSER.filter(function(m) {
        if (!formatTilladt(m, fmt.id)) return false;
        return lovligIPas(m, valgte, o) === null;
      });
    }
    if (!kand.length) return valgte;
    valgte.push(kand[Math.floor(rng() * kand.length)]);
  }
  return valgte;
}

function tjekAlle(movs, o) {
  var brud = [];
  for (var i = 0; i < movs.length; i++) {
    var andre = movs.filter(function(_, j){ return j !== i; });
    var r = lovligIPas(movs[i], andre, o);
    if (r && brud.indexOf(r) < 0) brud.push(r);
  }
  return brud;
}

function linje(m, antal) {
  if (m.enhed === "meter")    return antal + " m " + m.navn;
  if (m.enhed === "kalorier") return antal + " kalorier " + m.navn;
  if (m.enhed === "sek")      return antal + " sek " + m.navn;
  return antal + " " + m.navn;
}

function linjerFor(fmt, movs, reps, ekstra) {
  ekstra = ekstra || {};
  if (fmt.id === "stige_ned" || fmt.id === "stige_op") {
    return movs.map(function(m){ return m.navn; });
  }
  if (fmt.id === "tabata") {
    return ["8 x 20 sek arbejde / 10 sek pause pr. \u00f8velse:"]
      .concat(movs.map(function(m){ return m.navn; }))
      .concat(movs.length > 1 ? ["1 min pause mellem \u00f8velser"] : []);
  }
  if (fmt.id === "doedved") {
    return ["Minut 1: 1 " + movs[0].navn, "Minut 2: 2 " + movs[0].navn, "Minut 3: 3 ... og s\u00e5 videre"];
  }
  if (fmt.id === "emom" && ekstra.hvile) {
    if (movs.length === 1) return ["Ulige minut: " + linje(movs[0], reps[0]), "Lige minut: hvile"];
    var udH = movs.map(function(m, i){ return "Minut " + (i + 1) + ": " + linje(m, reps[i]); });
    udH.push("Minut " + (movs.length + 1) + ": hvile");
    udH.push("Gentag " + Math.floor((ekstra.minutter || 0) / (movs.length + 1)) + " runder (" + (ekstra.minutter || "") + " minutter i alt)");
    return udH;
  }
  if (fmt.id === "emom") {
    if (movs.length === 1) return ["Hvert minut: " + linje(movs[0], reps[0])];
    if (movs.length === 2) return ["Ulige minut: " + linje(movs[0], reps[0]),
                                   "Lige minut: " + linje(movs[1], reps[1])];
    var ud = movs.map(function(m, i){ return "Minut " + (i + 1) + ": " + linje(m, reps[i]); });
    ud.push("Gentag " + Math.floor((ekstra.minutter || 0) / movs.length) + " runder (" + (ekstra.minutter || "") + " minutter i alt)");
    return ud;
  }
  return movs.map(function(m, i){ return linje(m, reps[i]); });
}

function formater(fmt, dom, minutter, movs, o, rng) {
  var top_ = null;
  var maalRunde = dom.rundeSek[0] + rng() * (dom.rundeSek[1] - dom.rundeSek[0]);
  var reps, sorteret, skema = null, runder = null, intervalSek = null, overskrift = "", strategi = "", linjer = [];

  if (fmt.id === "amrap") {
    reps = s\u00e6tReps(movs, maalRunde);
    sorteret = sorterRaekkefoelge(movs, reps, fmt.id); movs = sorteret.movs; reps = sorteret.reps;
    overskrift = "AMRAP " + minutter;
    runder = Math.round(minutter * 60 / rundeSek(movs, reps));
    strategi = "En runde tager cirka " + Math.round(rundeSek(movs, reps)) + " sekunder, s\u00e5 sigt efter omkring " + runder + " runder. Hold reps unbroken de f\u00f8rste tre runder.";
  } else if (fmt.id === "rft") {
    var m\u00e5l = 140 + rng() * 60;
    reps = s\u00e6tReps(movs, m\u00e5l);
    sorteret = sorterRaekkefoelge(movs, reps, fmt.id); movs = sorteret.movs; reps = sorteret.reps;
    runder = Math.max(3, Math.min(7, Math.round(minutter * 60 / rundeSek(movs, reps))));
    overskrift = runder + " runder for tid";
    strategi = "Sigt efter ensartede rundetider omkring " + Math.round(rundeSek(movs, reps) / 5) * 5 + " sekunder. F\u00f8rste runde skal f\u00f8les for let.";
  } else if (fmt.id === "stige_ned") {
    skema = REP_SKEMAER.ned[Math.floor(rng() * REP_SKEMAER.ned.length)];
    sorteret = sorterRaekkefoelge(movs, movs.map(function(){return 0;}), fmt.id); movs = sorteret.movs;
    overskrift = skema + " for tid";
    reps = null;
    strategi = "De faldende reps er til for at du kan \u00f8ge tempoet. Del det f\u00f8rste s\u00e6t, og tag det sidste unbroken.";
  } else if (fmt.id === "stige_op") {
    var top = [8, 10, 12][Math.floor(rng() * 3)];
    top_ = top;
    sorteret = sorterRaekkefoelge(movs, movs.map(function(){return 0;}), fmt.id); movs = sorteret.movs;
    overskrift = "1-2-3-...-" + top + " for tid";
    skema = "stigende til " + top;
    reps = null;
    strategi = "Reps stiger med \u00e9n pr. runde. Runde " + top + " er " + top + " reps af hver \u2014 hold hvilen kort tidligt, hvor det er billigt.";
  } else if (fmt.id === "emom") {
    var hv = !!o.emomHvile, nE = movs.length, rot = nE + (hv ? 1 : 0), rE = Math.floor(minutter / rot);
    reps = movs.map(function(m){ return p\u00e6ntTal(m.rate * (hv ? 0.75 : 0.6), m.rate); });
    overskrift = "EMOM " + minutter + (rot >= 2 ? " \u00b7 " + rE + " runder" : "") + (hv ? " \u00b7 med hvileminut" : "");
    strategi = hv
      ? "Hvert " + rot + ". minut er hvile, s\u00e5 arbejdsminutterne er h\u00e5rdere: 45-50 sekunder arbejde. Brug hvileminuttet til at f\u00e5 pulsen ned, ikke til at g\u00e5 rundt."
      : "Arbejdet skal tage 35-45 sekunder, s\u00e5 du f\u00e5r reel hvile. Tager det over 50 sekunder, er reps sat for h\u00f8jt."
        + (nE === 1 ? " Samme \u00f8velse hele vejen \u2014 godt til at bygge volumen uden at miste teknik." : "");
  } else if (fmt.id === "exmom") {
    var rH = rng(), hver = (minutter % 2 === 0 && minutter % 3 === 0) ? (rH < 0.5 ? 2 : 3) : (minutter % 3 === 0 ? 3 : 2);
    reps = s\u00e6tReps(movs, hver * 60 * 0.6);
    sorteret = sorterRaekkefoelge(movs, reps, fmt.id); movs = sorteret.movs; reps = sorteret.reps;
    overskrift = "E" + hver + "MOM " + minutter;
    runder = Math.floor(minutter / hver);
    strategi = runder + " runder. Arbejdet skal tage cirka " + Math.round(hver * 60 * 0.6) + " sekunder, s\u00e5 der er tid til at samle sig.";
  } else if (fmt.id === "interval") {
    var rI = rng(), saetK = [3, 4, 5, 6].filter(function(x){ return minutter % x === 0 && minutter / x >= 3; });
    if (!saetK.length) saetK = [3, 4, 5, 6].filter(function(x){ return minutter % x === 0 && minutter / x >= 2; });
    var saet = saetK.length ? saetK[Math.floor(rI * saetK.length)] : [4, 5, 6][Math.floor(rI * 3)];
    var hverMin = saetK.length ? minutter / saet : Math.max(3, Math.round(minutter / saet));
    reps = s\u00e6tReps(movs, hverMin * 60 * 0.55);
    sorteret = sorterRaekkefoelge(movs, reps, fmt.id); movs = sorteret.movs; reps = sorteret.reps;
    overskrift = "Hver " + hverMin + ". min x " + saet + " s\u00e6t";
    intervalSek = hverMin * 60;
    strategi = "Score er det langsomste s\u00e6t. Falder du mere end 10 sekunder fra s\u00e6t til s\u00e6t, gik du for h\u00e5rdt til i s\u00e6t 1.";
  } else if (fmt.id === "chipper") {
    reps = movs.map(function(m, i) {
      var basis = (m.rMin + m.rMax) / 2 * (dom.id === "ultra" ? 4.5 : 3.2);
      if (m.enhed === "meter") {
        var loft = m.pat.indexOf("carry") >= 0 ? 200 : 400;
        return Math.min(loft, Math.max(100, Math.round(basis / 50) * 50));
      }
      if (m.enhed === "kalorier") return Math.min(50, Math.max(20, Math.round(basis / 5) * 5));
      return p\u00e6ntTal(basis, m.rate);
    });
    overskrift = "For tid (chipper)";
    strategi = "\u00c9t genneml\u00f8b. L\u00e6g s\u00e6tplanen f\u00f8r du starter \u2014 fx fem s\u00e6t af ti \u2014 og hold pauserne under 15 sekunder.";
  } else if (fmt.id === "tabata") {
    reps = null;
    overskrift = "Tabata x " + movs.length;
    strategi = "Score er den laveste rep-t\u00e6lling i hver \u00f8velse. V\u00e6lg et tempo du kan ramme i alle otte runder.";
  } else if (fmt.id === "doedved") {
    reps = null;
    overskrift = "Stigende EMOM (d\u00f8d ved)";
    strategi = "Minut 1 er \u00e9n rep, minut 2 er to, og s\u00e5 videre indtil du ikke kan gennemf\u00f8re minuttet.";
  }

  var ekstra = { skema: skema, top: top_, minutter: minutter, hvile: fmt.id === "emom" && !!o.emomHvile };
  linjer = linjerFor(fmt, movs, reps, ekstra);

  return {
    format: fmt, overskrift: overskrift, skema: skema, minutter: minutter, domaene: dom,
    movs: movs, reps: reps, runder: runder, linjer: linjer, score: fmt.score, top: top_,
    strategi: strategi, niveau: o.niveau,
    udstyr: unik(movs.map(function(m){ return m.udstyr; })),
    skalering: unik(movs.map(function(m){ return m.skal; })).slice(0, 3).join("; "),
    brud: tjekAlle(movs, o),
    opfyldte: opfyldteRegler(movs, fmt, reps),
  };
}
function navnVis(m) {
  if (m.enhed === "meter")    return m.navn + " (meter)";
  if (m.enhed === "kalorier") return m.navn + " (kalorier)";
  if (m.enhed === "sek")      return m.navn + " (sekunder)";
  return m.navn;
}
function unik(a) { return a.filter(function(v, i){ return a.indexOf(v) === i; }); }

/* ---- Hvilke bl\u00f8de regler passet rammer ---- */
function opfyldteRegler(movs, fmt, reps) {
  var ud = [];
  var harPres = movs.some(ROLLER.pres), harTraek = movs.some(ROLLER.traek);
  if (harPres && harTraek) ud.push({ id:"S1", tekst:"Passet parrer et pres med et tr\u00e6k." });
  var mods = unik(movs.map(function(m){ return m.mod; }));
  if (mods.length >= 3) ud.push({ id:"S2", tekst:"Alle tre modaliteter er med: motor, v\u00e6gt og kropsv\u00e6gt." });
  else if (mods.length === 2) ud.push({ id:"S2", tekst:"To modaliteter er med (" + mods.join(" + ") + ")." });
  if (reps && (fmt.id === "amrap" || fmt.id === "rft")) {
    var s = rundeSek(movs, reps);
    if (s >= 60 && s <= 130) ud.push({ id:"S3", tekst:"Rundetiden er cirka " + Math.round(s) + " sek \u2014 inden for det der holder rytmen." });
    else ud.push({ id:"S3", advarsel:true, tekst:"Rundetiden er cirka " + Math.round(s) + " sek. Reglen siger 60-120 \u2014 skru p\u00e5 reps hvis du vil ramme den." });
  }
  if (movs.length === 1) ud.push({ id:"S8", tekst:"\u00c9n \u00f8velse \u2014 passet er en ren test af netop den." });
  else if (movs.length <= 4) ud.push({ id:"S8", tekst:movs.length + " \u00f8velser \u2014 passet har en klar form." });
  else if (fmt.id === "chipper") ud.push({ id:"S8", tekst:movs.length + " \u00f8velser i \u00e9n gennemgang \u2014 det er en chipper, og der h\u00f8rer de hjemme." });
  else ud.push({ id:"S8", advarsel:true, tekst:movs.length + " \u00f8velser uden for en chipper. Reglen siger 2-4: over fire bliver skiftene mellem stationer en st\u00f8rre del af passet end arbejdet." });
  var tunge = movs.filter(function(m){ return m.load >= 3; }).length;
  ud.push({ id:"S7", tekst: tunge ? "\u00c9n tung \u00f8velse, resten let nok til at du kan bev\u00e6ge dig uafbrudt."
    : "Ingen tung \u00f8velse \u2014 belastningen tillader uafbrudt arbejde." });
  var tek = movs.slice().sort(function(a,b){ return b.skill - a.skill; })[0];
  if (movs.length > 1 && movs[0].id === tek.id && tek.skill >= 2)
    ud.push({ id:"S5", tekst:"Den mest tekniske \u00f8velse (" + tek.navn.split(" ")[0] + ") st\u00e5r f\u00f8rst, hvor du er mindst tr\u00e6t." });
  var mono = movs.filter(ROLLER.mono)[0];
  if (mono) {
    var pos = movs.indexOf(mono);
    if (pos === 0 && (fmt.id === "rft" || fmt.id === "interval")) ud.push({ id:"S6", tekst:"Motoren st\u00e5r f\u00f8rst og s\u00e6tter rundens tempo." });
    else if (pos === movs.length - 1 && fmt.id === "amrap") ud.push({ id:"S6", tekst:"Motoren st\u00e5r sidst, hvor den giver vejrtr\u00e6kning og afg\u00f8r rundetallet." });
  }
  return ud;
}

if (typeof module !== "undefined") {
  module.exports = { BEVAEGELSER:BEVAEGELSER, REGLER:REGLER, FORMATER:FORMATER, DOMAENER:DOMAENER,
    SKABELONER:SKABELONER, ROLLER:ROLLER, byggePas:byggePas, alternativer:alternativer,
    lovligIPas:lovligIPas, tjekAlle:tjekAlle, formatTilladt:formatTilladt, s\u00e6tReps:s\u00e6tReps, rundeSek:rundeSek,
    sorterRaekkefoelge:sorterRaekkefoelge, formater:formater, prng:prng, formatFor:formatFor, domaeneFor:domaeneFor, linje:linje, navnVis:navnVis, opfyldteRegler:opfyldteRegler, linjerFor:linjerFor, slotInterval:slotInterval };
}

window.CF={byggePas,alternativer,formater,prng,formatFor,domaeneFor,FORMATER,DOMAENER,BEVAEGELSER,REGLER,slotInterval,navnVis,formatTilladt};
})();
}else{
// Offline cache: the app shell is cached on install; pages are network-first so updates arrive, fonts are cache-first.
const CACHE='traening-38b7611c';
const SHELL=['./','./index.html','./sw.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res})));
  }
});
}
