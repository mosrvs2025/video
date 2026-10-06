import sys
d='/home/user/video/'
js=''.join(open(d+'src/'+f).read()+'\n' for f in ['engine.js','props.js','figure.js','main.js'])
open(d+'dist.html','w').write('<!doctype html><meta charset=utf-8><body style="margin:0;background:#000"><canvas id=c></canvas><script>\n'+js+'\n</script></body>')
