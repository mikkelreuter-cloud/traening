// Code check: names that don't exist (typos, removed functions), duplicate keys, unreachable code and similar.
// The modules in src/js share one scope, so they are joined and checked as one program; findings point back to file and line.
const fs=require('fs'),path=require('path'),{ESLint}=require('eslint'),globals=require('globals');
const root=path.join(__dirname,'..'),tmp=path.join(root,'.tmp');fs.mkdirSync(tmp,{recursive:true});
const mods=fs.readdirSync(path.join(root,'src/js')).filter(f=>f.endsWith('.js')).sort();
const map=[];let app='';
for(const m of mods){const t=fs.readFileSync(path.join(root,'src/js',m),'utf8'),n=t.split('\n').length-1;map.push({file:'src/js/'+m,from:app.split('\n').length,n});app+=t}
fs.writeFileSync(path.join(tmp,'app.js'),app);
const where=(file,line)=>{if(!file.endsWith(path.join('.tmp','app.js')))return [path.relative(root,file),line];const m=map.find(x=>line>=x.from&&line<x.from+x.n)||map[map.length-1];return [m.file,line-m.from+1]};
const rules={'no-undef':'error','no-dupe-keys':'error','no-unreachable':'error','no-dupe-else-if':'error','no-self-assign':'error',
  'no-unsafe-finally':'error','no-func-assign':'error','no-const-assign':'error','no-redeclare':'error','use-isnan':'error','valid-typeof':'error','no-duplicate-case':'error'};
(async()=>{const eslint=new ESLint({cwd:root,overrideConfigFile:true,overrideConfig:[
    {files:['.tmp/app.js'],languageOptions:{ecmaVersion:2022,sourceType:'script',globals:{...globals.browser,CF:'readonly'}},rules},
    {files:['src/engine.js'],languageOptions:{ecmaVersion:2022,sourceType:'script',globals:{...globals.browser,module:'readonly'}},rules},
    {files:['src/sw-cache.js'],languageOptions:{ecmaVersion:2022,sourceType:'script',globals:{...globals.serviceworker}},rules}]});
  const res=await eslint.lintFiles(['.tmp/app.js','src/engine.js','src/sw-cache.js']);let n=0;
  for(const r of res)for(const m of r.messages){n++;const [f,l]=where(r.filePath,m.line),src=(fs.readFileSync(path.join(root,f),'utf8').split('\n')[l-1]||'').trim().slice(0,110);
    console.log(`${f}:${l}  ${m.message}\n    ${src}`)}
  if(n){console.log(`\n✗ Kodetjek: ${n} fund`);process.exit(1)}console.log(`✓ Kodetjek: ingen fund (${mods.length} moduler, motor, service worker)`)})();
