// Code check: finds names that don't exist (typos, removed functions), duplicate keys and unreachable code.
// The app is one HTML file, so the scripts are pulled out first and checked as one program.
const fs=require('fs'),path=require('path'),{ESLint}=require('eslint'),globals=require('globals');
const root=path.join(__dirname,'..'),tmp=path.join(root,'.tmp');fs.mkdirSync(tmp,{recursive:true});
const html=fs.readFileSync(path.join(root,'src/app.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const app=scripts.filter(s=>!s.startsWith('\n/* Passemotoren')).join('\n;\n');
fs.writeFileSync(path.join(tmp,'app.js'),app);
const rules={'no-undef':'error','no-dupe-keys':'error','no-unreachable':'error','no-dupe-else-if':'error','no-self-assign':'error',
  'no-unsafe-finally':'error','no-func-assign':'error','no-const-assign':'error','no-redeclare':'error','use-isnan':'error','valid-typeof':'error','no-duplicate-case':'error'};
(async()=>{const eslint=new ESLint({cwd:root,overrideConfigFile:true,overrideConfig:[
    {files:['.tmp/app.js'],languageOptions:{ecmaVersion:2022,sourceType:'script',globals:{...globals.browser,CF:'readonly'}},rules},
    {files:['sw.js'],languageOptions:{ecmaVersion:2022,sourceType:'script',globals:{...globals.browser,...globals.serviceworker,module:'readonly'}},rules}]});
  const res=await eslint.lintFiles(['.tmp/app.js','sw.js']);let n=0;
  for(const r of res)for(const m of r.messages){n++;const line=(fs.readFileSync(r.filePath,'utf8').split('\n')[m.line-1]||'').trim().slice(0,110);
    console.log(`${path.relative(root,r.filePath)}:${m.line}  ${m.message}\n    ${line}`)}
  if(n){console.log(`\n✗ Kodetjek: ${n} fund`);process.exit(1)}console.log('✓ Kodetjek: ingen fund')})();
