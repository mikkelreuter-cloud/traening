/* Passemotoren: rules and generator for CrossFit workouts (motor.js) */
(function(){
/* ===========================================================================
   PASSEMOTOREN — regelsæt og generator til CrossFit-pas
   ---------------------------------------------------------------------------
   Ren JavaScript, ingen afhængigheder. Kan bruges i browser eller Node.
   Tre dele:  1) BEVAEGELSER   2) REGLER (hårde + bløde)   3) MOTOR
   ======================================================================== */

/* --- 1) BEVÆGELSER --------------------------------------------------------
   mv(id, navn, mod, pat, musk, tal, r, vaegt, enhed, udstyr, niveau, skal)

   mod     M = monostrukturelt (motor), G = gymnastik (kropsvægt), W = vægt
   pat     bevægelsesmønstre. To øvelser med samme mønster må ikke stå
           i samme pas (regel H1). En øvelse kan have flere:
           push_v lodret pres · push_h vandret pres · pull_v lodret træk
           pull_h vandret træk · squat · hinge (hofteled) · core · carry · mono
   musk    belastede muskelgrupper, vigtigste først
   tal     [skill 1-3, load 0-3, greb 0-2, midline 0-2, rate]
           rate = reps (eller meter/kalorier) pr. minut i jævnt metcon-tempo
   r       [min, max] reps pr. runde i et typisk 3-delt pas på 10-20 min.
           Motoren skalerer selv op/ned efter tidsdomæne og rundetid.
-------------------------------------------------------------------------- */

function mv(id, navn, mod, pat, musk, tal, r, vaegt, enhed, udstyr, niveau, skal) {
  return { id, navn, mod, pat, musk, skill: tal[0], load: tal[1], greb: tal[2],
    mid: tal[3], rate: tal[4], rMin: r[0], rMax: r[1],
    vaegt: vaegt || null, enhed: enhed || "reps", udstyr, niveau, skal };
}
var B = "Begynder", O = "Øvet", A = "Avanceret";

var BEVAEGELSER = [
  /* --- Monostrukturelt ------------------------------------------------- */
  mv("loeb","løb","M",["mono"],["lunger","quad","læg"],[1,0,0,0,200],[150,400],null,"meter","Ingen udstyr",B,"halver distancen"),
  mv("sprint","sprint","M",["mono"],["quad","læg","lunger"],[1,0,0,0,260],[100,200],null,"meter","Ingen udstyr",B,"halver distancen"),
  mv("row_m","row","M",["mono"],["lunger","ryg","quad"],[1,0,1,0,230],[200,500],null,"meter","Ro-maskine",B,"halver distancen"),
  mv("row_cal","row","M",["mono"],["lunger","ryg","quad"],[1,0,1,0,15],[10,25],null,"kalorier","Ro-maskine",B,"reducer til to tredjedele"),
  mv("bike_cal","cykel","M",["mono"],["quad","lunger"],[1,0,0,0,18],[10,25],null,"kalorier","Cykel",B,"reducer til to tredjedele"),
  mv("ski_cal","ski","M",["mono"],["lunger","ryg","core"],[1,0,1,0,15],[10,25],null,"kalorier","Ski-maskine",B,"reducer til to tredjedele"),
  mv("du","double unders","M",["mono"],["læg","skulder","lunger"],[2,0,0,0,70],[30,60],null,"reps","Sjippetov",O,"dobbelt så mange single unders"),
  mv("su","single unders","M",["mono"],["læg","lunger"],[1,0,0,0,110],[60,120],null,"reps","Sjippetov",B,"del i to sæt"),
  mv("burpee","burpees","M",["mono","push_h"],["lunger","bryst","quad"],[1,0,0,0,13],[8,15],null,"reps","Ingen udstyr",B,"step-up burpees"),
  mv("shuttle","shuttle runs (10 m frem og tilbage)","M",["mono"],["quad","lunger"],[1,0,0,0,10],[4,8],null,"reps","Ingen udstyr",B,"halver antallet"),

  /* --- Gymnastik: pres ------------------------------------------------- */
  mv("pushup","push-ups","G",["push_h"],["bryst","triceps","skulder","core"],[1,0,0,1,20],[10,20],null,"reps","Ingen udstyr",B,"push-ups fra knæ"),
  mv("hrpushup","hand-release push-ups","G",["push_h"],["bryst","triceps","skulder"],[1,0,0,1,17],[10,18],null,"reps","Ingen udstyr",O,"fra knæ"),
  mv("ringpushup","ring push-ups","G",["push_h"],["bryst","triceps","core"],[2,0,1,1,14],[8,15],null,"reps","Ringe",O,"push-ups i gulvet"),
  mv("hspu","handstand push-ups","G",["push_v"],["skulder","triceps","core"],[3,0,0,1,9],[3,8],null,"reps","Ingen udstyr",A,"pike push-ups fra kasse"),
  mv("strict_hspu","strict handstand push-ups","G",["push_v"],["skulder","triceps","core"],[3,0,0,1,6],[2,5],null,"reps","Ingen udstyr",A,"pike push-ups fra gulv"),
  mv("pike","pike push-ups","G",["push_v"],["skulder","triceps"],[2,0,0,1,15],[8,15],null,"reps","Ingen udstyr",B,"hænderne på gulvet i stedet for kasse"),
  mv("ringdip","ring dips","G",["push_v"],["skulder","triceps","bryst"],[3,0,1,0,12],[6,12],null,"reps","Ringe",A,"box dips"),
  mv("boxdip","box dips","G",["push_v"],["triceps","skulder"],[1,0,0,0,18],[10,20],null,"reps","Kasse",B,"fødderne tættere på kroppen"),
  mv("wallwalk","wall walks","G",["push_v","core"],["skulder","core","triceps"],[2,0,0,2,6],[3,6],null,"reps","Ingen udstyr",O,"inchworms"),
  mv("hs_hold","handstand hold","G",["push_v","core"],["skulder","core"],[2,0,0,2,60],[20,45],null,"sek","Ingen udstyr",O,"plank"),

  /* --- Gymnastik: træk ------------------------------------------------- */
  mv("pullup","pull-ups","G",["pull_v"],["ryg","biceps","greb"],[2,0,1,0,16],[7,15],null,"reps","Pull-up bar",O,"ring rows"),
  mv("c2b","chest-to-bar pull-ups","G",["pull_v"],["ryg","biceps","greb"],[3,0,1,0,13],[6,12],null,"reps","Pull-up bar",A,"almindelige pull-ups"),
  mv("strict_pullup","strict pull-ups","G",["pull_v"],["ryg","biceps","greb"],[2,0,1,0,9],[4,9],null,"reps","Pull-up bar",A,"assisteret med elastik"),
  mv("jump_pullup","jumping pull-ups","G",["pull_v"],["ryg","biceps","quad"],[1,0,1,0,22],[12,20],null,"reps","Pull-up bar",B,"ring rows"),
  mv("ringrow","ring rows","G",["pull_h"],["ryg","biceps","core"],[1,0,1,0,18],[10,18],null,"reps","Ringe",B,"fødderne længere tilbage"),
  mv("mu","muscle-ups","G",["pull_v","push_v"],["ryg","skulder","triceps","greb"],[3,0,2,0,5],[2,6],null,"reps","Ringe",A,"jumping muscle-ups eller pull-up + dip"),
  mv("barmu","bar muscle-ups","G",["pull_v","push_v"],["ryg","skulder","greb"],[3,0,2,0,6],[2,7],null,"reps","Pull-up bar",A,"chest-to-bar pull-ups"),
  mv("rope","rope climbs","G",["pull_v","carry"],["ryg","greb","biceps"],[3,0,2,0,3],[1,4],null,"reps","Reb",A,"3 pull-ups pr. rope climb"),
  mv("t2b","toes-to-bar","G",["core"],["core","greb","ryg"],[3,0,1,2,14],[8,15],null,"reps","Pull-up bar",A,"hanging knee raises"),
  mv("k2e","knees-to-elbows","G",["core"],["core","greb"],[2,0,1,2,16],[8,15],null,"reps","Pull-up bar",O,"hanging knee raises"),
  mv("hkr","hanging knee raises","G",["core"],["core","greb"],[1,0,1,1,20],[10,20],null,"reps","Pull-up bar",B,"liggende knæløft"),

  /* --- Ben / squat ----------------------------------------------------- */
  mv("airsquat","air squats","G",["squat"],["quad","bagkæde"],[1,0,0,0,30],[15,30],null,"reps","Ingen udstyr",B,"hold til en kasse"),
  mv("jumpsquat","jump squats","G",["squat"],["quad","læg"],[1,0,0,0,22],[12,25],null,"reps","Ingen udstyr",O,"air squats"),
  mv("lunge","walking lunge steps","G",["squat"],["quad","bagkæde"],[1,0,0,0,22],[14,30],null,"reps","Ingen udstyr",B,"halver antallet"),
  mv("jumplunge","jumping lunges","G",["squat"],["quad","læg"],[1,0,0,0,20],[12,24],null,"reps","Ingen udstyr",O,"walking lunges"),
  mv("pistol","pistol squats (halvdelen pr. ben)","G",["squat"],["quad","core"],[3,0,0,1,14],[8,16],null,"reps","Ingen udstyr",A,"pistols til kasse"),
  mv("boxjump","box jumps 24/20","G",["squat"],["quad","læg"],[2,0,0,0,16],[10,20],null,"reps","Kasse",O,"step-ups"),
  mv("stepover","box step-overs 24/20","G",["squat"],["quad","bagkæde"],[1,0,0,0,18],[10,20],null,"reps","Kasse",B,"lavere kasse"),
  mv("bbjo","burpee box jump-overs 24/20","M",["squat","mono","push_h"],["quad","lunger","bryst"],[2,0,0,0,10],[6,12],null,"reps","Kasse",A,"burpee step-overs"),
  mv("wallball","wall balls 9/6 kg","W",["squat","push_v"],["quad","skulder","lunger"],[2,1,0,0,15],[10,20],"9/6 kg","reps","Wall ball",O,"6/4 kg"),
  mv("goblet","goblet squats 24/16 kg","W",["squat"],["quad","core"],[1,1,1,0,20],[10,20],"24/16 kg","reps","Kettlebell",B,"16/12 kg"),
  mv("frontsquat","front squats 70/47,5 kg","W",["squat"],["quad","core"],[2,3,0,1,12],[5,9],"70/47,5 kg","reps","Vægtstang",O,"50/35 kg"),
  mv("backsquat","back squats 84/57 kg","W",["squat"],["quad","bagkæde"],[2,3,0,1,12],[5,10],"84/57 kg","reps","Vægtstang",O,"60/40 kg"),
  mv("ohs","overhead squats 43/30 kg","W",["squat","push_v"],["quad","skulder","core"],[3,2,0,1,12],[5,10],"43/30 kg","reps","Vægtstang",A,"30/20 kg eller front squat"),
  mv("thruster","thrusters 43/30 kg","W",["squat","push_v"],["quad","skulder","lunger"],[2,2,0,0,13],[7,15],"43/30 kg","reps","Vægtstang",O,"30/20 kg"),
  mv("db_thruster","dumbbell thrusters 2 x 22,5/15 kg","W",["squat","push_v"],["quad","skulder"],[2,2,1,0,12],[7,14],"2 x 22,5/15 kg","reps","Håndvægte",O,"2 x 15/10 kg"),
  mv("db_lunge","dumbbell lunges 2 x 22,5/15 kg","W",["squat","carry"],["quad","bagkæde","greb"],[1,2,1,0,18],[10,24],"2 x 22,5/15 kg","reps","Håndvægte",O,"2 x 15/10 kg"),
  mv("kb_lunge","kettlebell front rack lunges 2 x 16/12 kg","W",["squat","carry"],["quad","core"],[2,2,1,1,16],[10,20],"2 x 16/12 kg","reps","Kettlebell",O,"2 x 12/8 kg"),
  mv("sb_squat","sandsæk squats 23/16 kg","W",["squat"],["quad","core"],[1,2,0,1,18],[10,20],"23/16 kg","reps","Sandsæk",B,"15/10 kg"),
  mv("ohlunge","overhead walking lunge 20/15 kg plade","W",["squat","push_v","carry"],["skulder","quad","core"],[2,2,1,2,25],[15,30],"20/15 kg","meter","Vægtstang",A,"uden plade"),

  /* --- Hofteled / vægtløftning ----------------------------------------- */
  mv("deadlift","deadlifts 102/70 kg","W",["hinge"],["bagkæde","greb","core"],[2,3,1,2,13],[6,12],"102/70 kg","reps","Vægtstang",O,"70/50 kg"),
  mv("deadlift_t","deadlifts 143/100 kg","W",["hinge"],["bagkæde","greb","core"],[2,3,2,2,8],[3,6],"143/100 kg","reps","Vægtstang",A,"100/70 kg"),
  mv("sdhp","sumo deadlift high pulls 43/30 kg","W",["hinge","pull_h"],["bagkæde","ryg","skulder"],[2,2,1,1,16],[9,18],"43/30 kg","reps","Vægtstang",O,"30/20 kg"),
  mv("kbs","kettlebell swings 24/16 kg","W",["hinge"],["bagkæde","skulder","greb"],[1,1,1,1,22],[15,25],"24/16 kg","reps","Kettlebell",B,"16/12 kg"),
  mv("kbs_t","kettlebell swings 32/24 kg","W",["hinge"],["bagkæde","skulder","greb"],[2,2,1,1,18],[12,21],"32/24 kg","reps","Kettlebell",O,"24/16 kg"),
  mv("powerclean","power cleans 61/43 kg","W",["hinge","pull_v"],["bagkæde","ryg","quad"],[3,2,1,1,11],[5,10],"61/43 kg","reps","Vægtstang",O,"43/30 kg"),
  mv("hpc","hang power cleans 52/35 kg","W",["hinge","pull_v"],["bagkæde","ryg","greb"],[2,2,1,1,13],[6,12],"52/35 kg","reps","Vægtstang",O,"40/27,5 kg"),
  mv("squatclean","squat cleans 61/43 kg","W",["hinge","squat"],["quad","bagkæde","ryg"],[3,3,1,1,9],[4,8],"61/43 kg","reps","Vægtstang",A,"43/30 kg"),
  mv("powersnatch","power snatches 43/30 kg","W",["hinge","push_v"],["bagkæde","skulder","ryg"],[3,2,1,1,11],[5,10],"43/30 kg","reps","Vægtstang",A,"30/20 kg"),
  mv("cj","clean & jerks 61/43 kg","W",["hinge","push_v"],["bagkæde","skulder","quad"],[3,2,1,1,9],[4,9],"61/43 kg","reps","Vægtstang",O,"43/30 kg"),
  mv("db_snatch","dumbbell snatches 22,5/15 kg (skiftevis)","W",["hinge","push_v"],["bagkæde","skulder","greb"],[2,1,1,1,18],[10,20],"22,5/15 kg","reps","Håndvægte",B,"15/10 kg"),
  mv("db_cj","dumbbell hang clean & jerks 2 x 22,5/15 kg","W",["hinge","push_v"],["skulder","bagkæde"],[2,2,1,1,12],[6,12],"2 x 22,5/15 kg","reps","Håndvægte",O,"2 x 15/10 kg"),
  mv("kb_clean","kettlebell cleans (skiftevis) 24/16 kg","W",["hinge"],["bagkæde","greb"],[2,1,1,1,18],[10,20],"24/16 kg","reps","Kettlebell",B,"16/12 kg"),
  mv("kb_snatch","kettlebell snatches (skiftevis) 24/16 kg","W",["hinge","push_v"],["bagkæde","skulder","greb"],[3,1,1,1,16],[10,20],"24/16 kg","reps","Kettlebell",A,"16/12 kg"),
  mv("sb_clean","sandsæk cleans 23/16 kg","W",["hinge"],["bagkæde","ryg","greb"],[2,2,1,1,14],[8,16],"23/16 kg","reps","Sandsæk",O,"15/10 kg"),
  mv("sb_gto","sandsæk ground-to-overhead 23/16 kg","W",["hinge","push_v"],["bagkæde","skulder"],[2,2,1,1,11],[6,12],"23/16 kg","reps","Sandsæk",O,"15/10 kg"),
  mv("mbclean","medicinbold cleans 9/6 kg","W",["hinge","squat"],["bagkæde","quad"],[2,1,0,1,16],[10,20],"9/6 kg","reps","Wall ball",B,"6/4 kg"),
  mv("devil","devil press 2 x 22,5/15 kg","W",["hinge","push_v","push_h"],["skulder","bagkæde","lunger"],[2,2,1,1,8],[4,10],"2 x 22,5/15 kg","reps","Håndvægte",A,"2 x 15/10 kg"),

  /* --- Pres med vægt --------------------------------------------------- */
  mv("press","shoulder press 43/30 kg","W",["push_v"],["skulder","triceps","core"],[1,2,0,1,13],[6,12],"43/30 kg","reps","Vægtstang",O,"30/20 kg"),
  mv("pushpress","push press 52/35 kg","W",["push_v"],["skulder","triceps","quad"],[2,2,0,1,15],[7,14],"52/35 kg","reps","Vægtstang",O,"40/27,5 kg"),
  mv("pushjerk","push jerks 61/43 kg","W",["push_v"],["skulder","quad","triceps"],[2,2,0,1,13],[6,12],"61/43 kg","reps","Vægtstang",O,"43/30 kg"),
  mv("db_press","dumbbell push press 2 x 22,5/15 kg","W",["push_v"],["skulder","triceps"],[1,2,1,0,15],[8,15],"2 x 22,5/15 kg","reps","Håndvægte",B,"2 x 15/10 kg"),
  mv("kb_press","double kettlebell press 2 x 24/16 kg","W",["push_v"],["skulder","core","greb"],[2,2,1,1,12],[6,12],"2 x 24/16 kg","reps","Kettlebell",O,"2 x 16/12 kg"),
  mv("bench","dumbbell bench press 2 x 27,5/18 kg","W",["push_h"],["bryst","triceps"],[1,2,1,0,14],[8,15],"2 x 27,5/18 kg","reps","Håndvægte",O,"2 x 18/12 kg"),
  mv("bbrow","bent-over rows 52/35 kg","W",["pull_h"],["ryg","biceps","greb"],[1,2,1,1,14],[8,15],"52/35 kg","reps","Vægtstang",O,"40/27,5 kg"),
  mv("db_row","dumbbell rows pr. side 22,5/15 kg","W",["pull_h"],["ryg","biceps","greb"],[1,1,1,0,16],[8,15],"22,5/15 kg","reps","Håndvægte",B,"15/10 kg"),

  /* --- Core ------------------------------------------------------------ */
  mv("situp","sit-ups","G",["core"],["core"],[1,0,0,1,25],[15,30],null,"reps","Ingen udstyr",B,"halver antallet"),
  mv("ghd","GHD sit-ups","G",["core"],["core","bagkæde"],[2,0,0,2,18],[10,20],null,"reps","GHD",A,"almindelige sit-ups"),
  mv("hollow","hollow rocks","G",["core"],["core"],[2,0,0,2,22],[12,25],null,"reps","Ingen udstyr",O,"knee tucks"),
  mv("vup","V-ups","G",["core"],["core"],[2,0,0,2,20],[10,20],null,"reps","Ingen udstyr",O,"sit-ups"),
  mv("plank","plank","G",["core"],["core","skulder"],[1,0,0,2,60],[30,60],null,"sek","Ingen udstyr",B,"plank fra knæ"),
  mv("twist","russian twists 16/12 kg","G",["core"],["core"],[1,1,0,1,26],[16,30],"16/12 kg","reps","Kettlebell",B,"uden vægt"),
  mv("backext","back extensions","G",["core","hinge"],["bagkæde","core"],[1,0,0,1,22],[12,25],null,"reps","GHD",B,"supermans på gulvet"),
  mv("superman","supermans","G",["core","hinge"],["bagkæde","core"],[1,0,0,1,25],[15,25],null,"reps","Ingen udstyr",B,"hold kortere tid"),
  mv("lsit","L-sit hold","G",["core"],["core","greb"],[2,0,1,2,45],[15,35],null,"sek","Pull-up bar",O,"tuck sit"),

  /* --- Bæring og slæde ------------------------------------------------- */
  mv("farmer","farmer carry 2 x 24/16 kg","W",["carry"],["greb","core","bagkæde"],[1,2,2,1,60],[50,200],"2 x 24/16 kg","meter","Kettlebell",B,"2 x 16/12 kg"),
  mv("oh_carry","overhead carry 22,5/15 kg","W",["carry","push_v"],["skulder","core"],[2,2,1,2,50],[30,100],"22,5/15 kg","meter","Håndvægte",O,"15/10 kg"),
  mv("fr_carry","front rack carry 52/35 kg","W",["carry"],["core","skulder","quad"],[2,2,1,2,50],[30,100],"52/35 kg","meter","Vægtstang",O,"40/27,5 kg"),
  mv("sb_carry","sandsæk-bæring 23/16 kg","W",["carry"],["core","bagkæde","greb"],[1,2,1,1,55],[50,200],"23/16 kg","meter","Sandsæk",B,"15/10 kg"),
  mv("sled_push","slædeskub","W",["carry","squat"],["quad","bagkæde","lunger"],[1,2,0,0,40],[20,60],null,"meter","Slæde",B,"lettere slæde"),
  mv("sled_pull","slædetræk","W",["carry","pull_h"],["ryg","bagkæde","greb"],[1,2,2,0,35],[20,60],null,"meter","Slæde",B,"lettere slæde"),
  mv("tgu","Turkish get-ups (halvdelen pr. side) 24/16 kg","W",["carry","core"],["skulder","core","greb"],[3,2,1,2,6],[4,10],"24/16 kg","reps","Kettlebell",A,"16/12 kg"),
];

/* --- 2) REGLER -----------------------------------------------------------
   Hårde regler (H) bruges af generatoren og kan ikke brydes.
   Bløde regler (S) er anbefalinger: de tjekkes og vises som advarsler.
-------------------------------------------------------------------------- */

var REGLER = [
  { id:"H1", type:"hård", navn:"Ingen gentagne bevægelsesmønstre",
    tekst:"To øvelser i samme pas må ikke dele bevægelsesmønster. Push-ups og handstand push-ups er begge pres; den anden øvelse dør af den første i stedet for at udfordre noget nyt.",
    undtagelse:"Specialpas der med vilje stresser ét mønster (fx JT: handstand push-ups, ring dips, push-ups). Så skal volumen ned." },
  { id:"H1b", type:"hård", navn:"Højst ét pres og ét træk",
    tekst:"Et pas må indeholde én pressende og én trækkende øvelse — ikke to af hver. Overkroppens små muskelgrupper bliver trætte længe før benene og motoren, så to pres efter hinanden betyder bare at den anden øvelse udføres dårligt.",
    undtagelse:"Et bevidst overkropspas, hvor den samlede volumen sættes tilsvarende ned." },
  { id:"H2", type:"hård", navn:"Højst én tung øvelse",
    tekst:"Kun én øvelse pr. pas må være tung (over cirka 70 % af 1RM). To tunge øvelser gør passet til styrketræning med dårlig teknik — belastningen begrænser pulsen, og pulsen begrænser teknikken." },
  { id:"H3", type:"hård", navn:"Maks to grebsøvelser",
    tekst:"Pull-ups, kettlebell swings, deadlifts, farmer carry og rope climbs trækker alle på grebet. Tre af dem i samme pas betyder at hænderne giver op før motoren, og så træner du ikke det passet var sat op til." },
  { id:"H4", type:"hård", navn:"Højst én teknisk tung øvelse over 12 minutter",
    tekst:"Snatch, squat clean, muscle-ups og overhead squat kræver kvalitet. I pas over 12 minutter må der kun være én af dem, og reps pr. runde skal holdes lavt." },
  { id:"H5", type:"hård", navn:"Tungt hofteled ikke sammen med hård midline",
    tekst:"Tung deadlift eller clean må ikke stå sammen med høj-volumen midline-arbejde som GHD sit-ups eller toes-to-bar. Når maven er træt, runder ryggen — det er den klassiske skadesmekanisme." },
  { id:"H6", type:"hård", navn:"Én motor-øvelse",
    tekst:"Højst én monostrukturel øvelse (løb, ro, cykel, sjip) pr. pas. To gør det til en konditionstest i stedet for et metcon — med mindre det netop er formålet." },
  { id:"H7", type:"hård", navn:"Kun udstyr du har",
    tekst:"Alle øvelser skal kunne laves med det udstyr der er til rådighed. En skalering er ikke en erstatning for udstyr du ikke har." },
  { id:"H8", type:"hård", navn:"Niveau styrer øvelsesvalg",
    tekst:"Øvelser over atletens niveau kommer ikke i passet. Muscle-ups i et begynderpas giver et pas hvor tiden går med at stirre på ringene." },
  { id:"H9", type:"hård", navn:"Højst to øvelser pr. muskelgruppe",
    tekst:"To øvelser må gerne dele primær muskelgruppe, tre må ikke. Thrusters, box jumps og lunges er tre forskellige mønstre, men det er stadig tre gange quadriceps." },

  { id:"S1", type:"blød", navn:"Par pres med træk",
    tekst:"Det mest robuste par er et pres og et træk: mens det ene arbejder, restituerer det andet. Fran (thrusters og pull-ups) og Diane (deadlift og handstand push-ups) er samme idé." },
  { id:"S2", type:"blød", navn:"Tripletten: motor, vægt, kropsvægt",
    tekst:"Det mest pålidelige treklang er én monostrukturel, én med vægt og én gymnastisk øvelse. Helen (løb, kettlebell swings, pull-ups) er skabelonen." },
  { id:"S3", type:"blød", navn:"Hold rundetiden på 60-120 sekunder",
    tekst:"I en AMRAP skal en runde tage mellem ét og to minutter. Under 60 sekunder bliver det en øvelse i at skifte station; over to minutter mister du følelsen af runder og går i stå." },
  { id:"S4", type:"blød", navn:"Reps skal kunne tages i højst to sæt",
    tekst:"Sæt reps pr. runde så atleten kan tage dem unbroken i runde 1 og i højst to sæt i runde 3. Reps der altid skal deles i fem sæt gør passet til en pausetest." },
  { id:"S5", type:"blød", navn:"Teknik før træthed",
    tekst:"Den mest tekniske øvelse står først i runden, hvor du er mindst træt. Undtagelsen er korte pas hvor rækkefølgen ikke får tid til at betyde noget." },
  { id:"S6", type:"blød", navn:"Motoren paces eller afslutter",
    tekst:"I runder for tid står løb eller ro først og sætter rundens tempo. I en AMRAP står den sidst, hvor den både giver vejrtrækning og afgør hvor mange runder du får." },
  { id:"S7", type:"blød", navn:"Vægten følger tidsdomænet",
    tekst:"Korte pas tåler tung vægt, lange gør ikke. Over 20 minutter skal belastningen være let nok til at du kan bevæge dig uafbrudt — ellers bliver det et pas i at hvile." },
  { id:"S8", type:"blød", navn:"To til fire øvelser",
    tekst:"To øvelser giver et skarpt pas, tre et komplet, fire er grænsen. Fem eller flere hører i en chipper, hvor hver øvelse kun mødes én gang." },
  { id:"S9", type:"blød", navn:"Varier tidsdomæne hen over ugen",
    tekst:"Kør ikke samme længde to dage i træk. En uge bør indeholde noget under 8 minutter, noget på 10-20 og noget over 25." },
  { id:"S10", type:"blød", navn:"Skalér stimulus, ikke tal",
    tekst:"Når du skalerer, så bevar den tid passet var tænkt til. Et pas på 8 minutter der tager 20, er et andet pas — ret vægten og reps indtil tiden passer." },
];

/* --- 3) MOTOR ------------------------------------------------------------ */

var NIVEAU_RANG = { "Begynder":0, "Øvet":1, "Avanceret":2 };
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
  { id:"emom",     navn:"EMOM",                    score:"Gennemførte minutter", domaener:["mellem","lang"] },
  { id:"exmom",    navn:"Hvert 2.-3. minut",       score:"Gennemført arbejde", domaener:["mellem","lang"] },
  { id:"interval", navn:"Intervaller",             score:"Langsomste sæt", domaener:["mellem","lang"] },
  { id:"chipper",  navn:"Chipper",                 score:"Samlet tid",     domaener:["lang","ultra"] },
  { id:"tabata",   navn:"Tabata",                  score:"Laveste runde",  domaener:["kort","mellem"] },
  { id:"doedved",  navn:"Død ved (stigende EMOM)", score:"Sidste minut",   domaener:["mellem"] },
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
    // AMRAP og runder for tid: standardvalget følger tidsdomænet, men beder du udtrykkeligt
    // om flere øvelser, får du dem — S8 advarer så i stedet for at nægte.
    default:          return [2, 6];
  }
}
function formatFor(id) { for (var i=0;i<FORMATER.length;i++) if (FORMATER[i].id===id) return FORMATER[i]; return null; }

/* ---- Hårde regler som kontrolfunktioner ---- */
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
  { roller:["pres","traek"],            navn:"Pres + træk",                 regler:["S1"] },
  { roller:["hofte","traek"],           navn:"Hofteled + træk",             regler:["S1"] },
  { roller:["hofte","pres"],            navn:"Hofteled + pres",             regler:["S1"] },
  { roller:["ben","traek"],             navn:"Ben + træk",                  regler:["S1"] },
  { roller:["ben","pres"],              navn:"Ben + pres",                  regler:["S1"] },
  { roller:["mono","vaegt"],            navn:"Motor + vægt",                regler:["S2"] },
  { roller:["mono","gym"],              navn:"Motor + kropsvægt",           regler:["S2"] },
  { roller:["mono","vaegt","gym"],      navn:"Motor + vægt + kropsvægt",    regler:["S2"] },
  { roller:["mono","hofte","pres"],     navn:"Motor + hofteled + pres",     regler:["S1","S2"] },
  { roller:["mono","ben","traek"],      navn:"Motor + ben + træk",          regler:["S1","S2"] },
  { roller:["ben","traek","core"],      navn:"Ben + træk + core",           regler:["S1"] },
  { roller:["hofte","pres","core"],     navn:"Hofteled + pres + core",      regler:["S1"] },
  { roller:["pres","traek","ben"],      navn:"Pres + træk + ben",           regler:["S1"] },
  { roller:["mono","baering","ben"],    navn:"Motor + bæring + ben",        regler:["S2"] },
  { roller:["mono","ben","pres"],       navn:"Motor + ben + pres",           regler:["S2"] },
  { roller:["mono","ben","core"],       navn:"Motor + ben + core",           regler:["S2"] },
  { roller:["ben","pres","core"],       navn:"Ben + pres + core",            regler:["S8"] },
  { roller:["mono","pres","core"],      navn:"Motor + pres + core",          regler:["S2"] },
  { roller:["mono","traek","core"],     navn:"Motor + træk + core",          regler:["S2"] },
  { roller:["mono","ben","pres","core"],navn:"Fire pladser: motor, ben, pres, core", regler:["S2","S8"] },
  { roller:["mono","vaegt","gym","core"], navn:"Fire pladser: motor, vægt, kropsvægt, core", regler:["S2","S8"] },
  { roller:["mono","hofte","pres","ben"], navn:"Fire pladser: motor, hofteled, pres, ben",   regler:["S2","S8"] },
  { roller:["mono","pres","traek","ben","core"],          navn:"Fem pladser: motor, pres, træk, ben, midline",            regler:["S1","S2"] },
  { roller:["mono","hofte","pres","ben","core"],          navn:"Fem pladser: motor, hofteled, pres, ben, midline",        regler:["S1","S2"] },
  { roller:["mono","vaegt","gym","ben","core"],           navn:"Fem pladser: motor, vægt, kropsvægt, ben, midline",       regler:["S2"] },
  { roller:["mono","pres","traek","ben","hofte","core"],  navn:"Seks pladser: motor, pres, træk, ben, hofteled, midline", regler:["S1","S2"] },
  { roller:["mono","pres","traek","ben","core","baering"],navn:"Seks pladser: motor, pres, træk, ben, midline, bæring",   regler:["S1","S2"] },
];

/* ---- Rep-matematik ---- */
function pæntTal(n, rate) {
  if (n <= 6) return Math.max(1, Math.round(n));
  if (n <= 12) return Math.round(n);
  if (rate >= 50) return Math.round(n / 10) * 10;
  return Math.round(n / 5) * 5;
}
function sekFor(m, antal) { return (antal / m.rate) * 60; }

function sætReps(movs, maalRundeSek) {
  // Start midt i hver øvelses interval, skalér så runden rammer måltiden.
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
  return reps.map(function(r, i){ return pæntTal(r, movs[i].rate); });
}
function rundeSek(movs, reps) {
  var s = 0; for (var i = 0; i < movs.length; i++) s += sekFor(movs[i], reps[i]) + 5; return s;
}

/* ---- Udvælgelse ---- */
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

/* ---- Rækkefølge (S5, S6) ---- */
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
  var frø = (opt.seed === undefined || opt.seed === null) ? Math.floor(Math.random() * 4294967295) : opt.seed;
  var rng = opt.rng || prng(frø);
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
    if (!slots) {   // intet ønske: formatets eget standardvalg
      if (fmt.id === "doedved") slots = 1;
      else if (fmt.id === "emom") slots = 0;
      else if (fmt.id === "chipper") slots = (dom.id === "ultra" ? 6 : 5);
      else if (fmt.id === "stige_ned" || fmt.id === "stige_op") slots = 2;
      else if (fmt.id === "tabata") slots = Math.max(1, Math.min(4, Math.round((minutter + 1) / 5)));
      else if (fmt.id === "interval") slots = 2;
    }
    // Over fire pladser og i de frit sammensatte formater vælger vi øvelser direkte
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
      if (forsoeg > 60) {  // giv efter på antallet af pladser før vi giver op
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
    var pas = formater(fmt, dom, minutter, movs, o, prng(frø));
    if (pas) {
      pas.seed = frø; pas.opt = o;
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
  // Fordel pladserne over så mange forskellige roller som muligt (variation uden regelbrud)
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
    if (!kand.length && rolle) {   // rollen kan ikke fyldes — tag hvad der er lovligt
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
    return ["8 x 20 sek arbejde / 10 sek pause pr. øvelse:"]
      .concat(movs.map(function(m){ return m.navn; }))
      .concat(movs.length > 1 ? ["1 min pause mellem øvelser"] : []);
  }
  if (fmt.id === "doedved") {
    return ["Minut 1: 1 " + movs[0].navn, "Minut 2: 2 " + movs[0].navn, "Minut 3: 3 ... og så videre"];
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
    reps = sætReps(movs, maalRunde);
    sorteret = sorterRaekkefoelge(movs, reps, fmt.id); movs = sorteret.movs; reps = sorteret.reps;
    overskrift = "AMRAP " + minutter;
    runder = Math.round(minutter * 60 / rundeSek(movs, reps));
    strategi = "En runde tager cirka " + Math.round(rundeSek(movs, reps)) + " sekunder, så sigt efter omkring " + runder + " runder. Hold reps unbroken de første tre runder.";
  } else if (fmt.id === "rft") {
    var mål = 140 + rng() * 60;
    reps = sætReps(movs, mål);
    sorteret = sorterRaekkefoelge(movs, reps, fmt.id); movs = sorteret.movs; reps = sorteret.reps;
    runder = Math.max(3, Math.min(7, Math.round(minutter * 60 / rundeSek(movs, reps))));
    overskrift = runder + " runder for tid";
    strategi = "Sigt efter ensartede rundetider omkring " + Math.round(rundeSek(movs, reps) / 5) * 5 + " sekunder. Første runde skal føles for let.";
  } else if (fmt.id === "stige_ned") {
    skema = REP_SKEMAER.ned[Math.floor(rng() * REP_SKEMAER.ned.length)];
    sorteret = sorterRaekkefoelge(movs, movs.map(function(){return 0;}), fmt.id); movs = sorteret.movs;
    overskrift = skema + " for tid";
    reps = null;
    strategi = "De faldende reps er til for at du kan øge tempoet. Del det første sæt, og tag det sidste unbroken.";
  } else if (fmt.id === "stige_op") {
    var top = [8, 10, 12][Math.floor(rng() * 3)];
    top_ = top;
    sorteret = sorterRaekkefoelge(movs, movs.map(function(){return 0;}), fmt.id); movs = sorteret.movs;
    overskrift = "1-2-3-...-" + top + " for tid";
    skema = "stigende til " + top;
    reps = null;
    strategi = "Reps stiger med én pr. runde. Runde " + top + " er " + top + " reps af hver — hold hvilen kort tidligt, hvor det er billigt.";
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
    reps = sætReps(movs, hver * 60 * 0.6);
    sorteret = sorterRaekkefoelge(movs, reps, fmt.id); movs = sorteret.movs; reps = sorteret.reps;
    overskrift = "E" + hver + "MOM " + minutter;
    runder = Math.floor(minutter / hver);
    strategi = runder + " runder. Arbejdet skal tage cirka " + Math.round(hver * 60 * 0.6) + " sekunder, så der er tid til at samle sig.";
  } else if (fmt.id === "interval") {
    var rI = rng(), saetK = [3, 4, 5, 6].filter(function(x){ return minutter % x === 0 && minutter / x >= 3; });
    if (!saetK.length) saetK = [3, 4, 5, 6].filter(function(x){ return minutter % x === 0 && minutter / x >= 2; });
    var saet = saetK.length ? saetK[Math.floor(rI * saetK.length)] : [4, 5, 6][Math.floor(rI * 3)];
    var hverMin = saetK.length ? minutter / saet : Math.max(3, Math.round(minutter / saet));
    reps = sætReps(movs, hverMin * 60 * 0.55);
    sorteret = sorterRaekkefoelge(movs, reps, fmt.id); movs = sorteret.movs; reps = sorteret.reps;
    overskrift = "Hver " + hverMin + ". min x " + saet + " sæt";
    intervalSek = hverMin * 60;
    strategi = "Score er det langsomste sæt. Falder du mere end 10 sekunder fra sæt til sæt, gik du for hårdt til i sæt 1.";
  } else if (fmt.id === "chipper") {
    reps = movs.map(function(m, i) {
      var basis = (m.rMin + m.rMax) / 2 * (dom.id === "ultra" ? 4.5 : 3.2);
      if (m.enhed === "meter") {
        var loft = m.pat.indexOf("carry") >= 0 ? 200 : 400;
        return Math.min(loft, Math.max(100, Math.round(basis / 50) * 50));
      }
      if (m.enhed === "kalorier") return Math.min(50, Math.max(20, Math.round(basis / 5) * 5));
      return pæntTal(basis, m.rate);
    });
    overskrift = "For tid (chipper)";
    strategi = "Ét gennemløb. Læg sætplanen før du starter — fx fem sæt af ti — og hold pauserne under 15 sekunder.";
  } else if (fmt.id === "tabata") {
    reps = null;
    overskrift = "Tabata x " + movs.length;
    strategi = "Score er den laveste rep-tælling i hver øvelse. Vælg et tempo du kan ramme i alle otte runder.";
  } else if (fmt.id === "doedved") {
    reps = null;
    overskrift = "Stigende EMOM (død ved)";
    strategi = "Minut 1 er én rep, minut 2 er to, og så videre indtil du ikke kan gennemføre minuttet.";
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

/* ---- Hvilke bløde regler passet rammer ---- */
function opfyldteRegler(movs, fmt, reps) {
  var ud = [];
  var harPres = movs.some(ROLLER.pres), harTraek = movs.some(ROLLER.traek);
  if (harPres && harTraek) ud.push({ id:"S1", tekst:"Passet parrer et pres med et træk." });
  var mods = unik(movs.map(function(m){ return m.mod; }));
  if (mods.length >= 3) ud.push({ id:"S2", tekst:"Alle tre modaliteter er med: motor, vægt og kropsvægt." });
  else if (mods.length === 2) ud.push({ id:"S2", tekst:"To modaliteter er med (" + mods.join(" + ") + ")." });
  if (reps && (fmt.id === "amrap" || fmt.id === "rft")) {
    var s = rundeSek(movs, reps);
    if (s >= 60 && s <= 130) ud.push({ id:"S3", tekst:"Rundetiden er cirka " + Math.round(s) + " sek — inden for det der holder rytmen." });
    else ud.push({ id:"S3", advarsel:true, tekst:"Rundetiden er cirka " + Math.round(s) + " sek. Reglen siger 60-120 — skru på reps hvis du vil ramme den." });
  }
  if (movs.length === 1) ud.push({ id:"S8", tekst:"Én øvelse — passet er en ren test af netop den." });
  else if (movs.length <= 4) ud.push({ id:"S8", tekst:movs.length + " øvelser — passet har en klar form." });
  else if (fmt.id === "chipper") ud.push({ id:"S8", tekst:movs.length + " øvelser i én gennemgang — det er en chipper, og der hører de hjemme." });
  else ud.push({ id:"S8", advarsel:true, tekst:movs.length + " øvelser uden for en chipper. Reglen siger 2-4: over fire bliver skiftene mellem stationer en større del af passet end arbejdet." });
  var tunge = movs.filter(function(m){ return m.load >= 3; }).length;
  ud.push({ id:"S7", tekst: tunge ? "Én tung øvelse, resten let nok til at du kan bevæge dig uafbrudt."
    : "Ingen tung øvelse — belastningen tillader uafbrudt arbejde." });
  var tek = movs.slice().sort(function(a,b){ return b.skill - a.skill; })[0];
  if (movs.length > 1 && movs[0].id === tek.id && tek.skill >= 2)
    ud.push({ id:"S5", tekst:"Den mest tekniske øvelse (" + tek.navn.split(" ")[0] + ") står først, hvor du er mindst træt." });
  var mono = movs.filter(ROLLER.mono)[0];
  if (mono) {
    var pos = movs.indexOf(mono);
    if (pos === 0 && (fmt.id === "rft" || fmt.id === "interval")) ud.push({ id:"S6", tekst:"Motoren står først og sætter rundens tempo." });
    else if (pos === movs.length - 1 && fmt.id === "amrap") ud.push({ id:"S6", tekst:"Motoren står sidst, hvor den giver vejrtrækning og afgør rundetallet." });
  }
  return ud;
}

if (typeof module !== "undefined") {
  module.exports = { BEVAEGELSER:BEVAEGELSER, REGLER:REGLER, FORMATER:FORMATER, DOMAENER:DOMAENER,
    SKABELONER:SKABELONER, ROLLER:ROLLER, byggePas:byggePas, alternativer:alternativer,
    lovligIPas:lovligIPas, tjekAlle:tjekAlle, formatTilladt:formatTilladt, sætReps:sætReps, rundeSek:rundeSek,
    sorterRaekkefoelge:sorterRaekkefoelge, formater:formater, prng:prng, formatFor:formatFor, domaeneFor:domaeneFor, linje:linje, navnVis:navnVis, opfyldteRegler:opfyldteRegler, linjerFor:linjerFor, slotInterval:slotInterval };
}

window.CF={byggePas,alternativer,formater,prng,formatFor,domaeneFor,FORMATER,DOMAENER,BEVAEGELSER,REGLER,slotInterval,navnVis,formatTilladt};
})();
