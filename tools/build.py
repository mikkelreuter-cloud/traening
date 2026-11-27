"""Build index.html from src/app.html.
src/app.html is the whole app in one file (the published artifact uses it as is).
For the installed app, the inline training engine is replaced by sw.js, which is both the
service worker and the engine, so the engine and its offline cache always match."""
import os,re,sys
root=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
s=open(os.path.join(root,'src/app.html')).read()
ver=re.search(r"CACHE='traening-v(\d+)'",open(os.path.join(root,'sw.js')).read()).group(1)
s=s.replace('<meta name="claude:viewport-fit-sides" content="cover">\n','',1)
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
s=s[:a]+f'<script src="sw.js?v={ver}"></script>'+s[b:]
open(os.path.join(root,'index.html'),'w').write(s)
print(f'index.html bygget (motor v{ver}, {len(s)//1024} kB)')
