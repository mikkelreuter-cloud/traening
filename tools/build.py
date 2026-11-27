"""Builds the app from src/.

src/shell.html       page markup with {{STYLE}}, {{ENGINE}} and {{APP}}
src/style.css        all styles
src/engine.js        Passemotoren (CrossFit engine)
src/js/NN-*.js       the app, in order. They share one scope: the files are joined into one script.
src/sw-cache.js      offline cache for the service worker

Output:
dist/app.html  one self-contained file (used for the published preview, the code check and as a reference)
index.html     the installed app. The engine is loaded from sw.js instead of inline.
sw.js          service worker + engine in one file (same file, two jobs), so they always match.
The cache version is a hash of the content, so every change reaches phones without bumping a number by hand."""
import os,glob,hashlib,re
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
R=lambda p:open(os.path.join(root,p),encoding='utf-8').read()
def W(p,s):
    p=os.path.join(root,p);os.makedirs(os.path.dirname(p),exist_ok=True);open(p,'w',encoding='utf-8').write(s)
mods=sorted(glob.glob(os.path.join(root,'src/js/*.js')))
app=''.join(open(m,encoding='utf-8').read() for m in mods)
engine=R('src/engine.js')
single=R('src/shell.html').replace('{{STYLE}}\n',R('src/style.css'),1).replace('{{ENGINE}}\n',engine,1).replace('{{APP}}\n',app,1)
W('dist/app.html',single)
ver=hashlib.sha1((single+R('src/sw-cache.js')).encode()).hexdigest()[:8]

# Installed app page
s=single.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','',1)
head='''<!doctype html>
<html lang="da">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ECEDEF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0F1012" media="(prefers-color-scheme: dark)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<style>:root{padding-top:env(safe-area-inset-top,0px)}body{margin:0;font-size:14px}img{max-width:100%}</style>
'''
i=s.index('</style>')+len('</style>')
s=head+s[:i]+'\n</head>\n<body>\n'+s[i:].rstrip()+'''
<script>if('serviceWorker' in navigator){addEventListener('load',()=>{navigator.serviceWorker.register('sw.js').catch(()=>{})})}</script>
</body>
</html>
'''
a=s.index('<script>\n/* Passemotoren');b=s.index('</script>',a)+len('</script>')
W('index.html',s[:a]+f'<script src="sw.js?v={ver}"></script>'+s[b:])

# Service worker + engine. Non-ASCII is written as \\u escapes, so the file works whatever charset it is served with.
esc=lambda t:''.join(c if ord(c)<128 else ''.join('\\u%04x'%u for u in (lambda b:[int.from_bytes(b[k:k+2],'big') for k in range(0,len(b),2)])(c.encode('utf-16-be'))) for c in t)
sw=('/* Built from src/engine.js and src/sw-cache.js by tools/build.py. Do not edit by hand.\n'
    '   This file has two jobs. In the app page (window exists) it loads the CrossFit engine (Passemotoren) as window.CF.\n'
    '   As the service worker (no window) it runs the offline cache. */\n'
    "if(typeof window!=='undefined'&&typeof document!=='undefined'){\n"+esc(engine)+'}else{\n'+esc(R('src/sw-cache.js').replace('__CACHE__','traening-'+ver))+'}\n')
W('sw.js',sw)
print(f'Bygget: dist/app.html, index.html, sw.js (version {ver}, {len(mods)} moduler)')
