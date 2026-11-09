const fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
const post=html.slice(html.indexOf('const POST='),html.indexOf('// Refresh shadows'));
assert.match(post,/uniform highp sampler2D tDepth\b/,'Depth texture samples must retain high precision on mobile GPUs.');
assert.equal((post.match(/varying highp vec2 vUv/g)||[]).length,2,'Vertex and fragment UV precision must match.');
assert.match(post,/qEps:\{value:low\?1\/65535:0\}/,'16-bit depth still needs its quantization noise floor.');
for(const script of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(script[1].trim())new Function(script[1]);
console.log('PASS: explicit high-precision depth sampling, matching UV precision, depth16 noise floor, and JavaScript syntax.');
