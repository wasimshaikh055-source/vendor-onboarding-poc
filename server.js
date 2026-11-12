"use strict";
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const PORT = Number(process.env.PORT || 8787);
const FLOW_URL = process.env.POWER_AUTOMATE_URL;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:8787,http://127.0.0.1:8787").split(",").map(x=>x.trim()).filter(Boolean);
const MAX_BODY = 30 * 1024 * 1024;
const ROOT = __dirname;
const MIME = {".html":"text/html; charset=utf-8",".css":"text/css; charset=utf-8",".js":"text/javascript; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",".ico":"image/x-icon"};
function send(res,status,body,headers={}) { res.writeHead(status,{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store",...headers});res.end(JSON.stringify(body)); }
function originAllowed(origin) { return !origin || ALLOWED_ORIGINS.includes(origin); }
async function proxySubmission(req,res) {
  if(!FLOW_URL) return send(res,503,{success:false,message:"Submission service is not configured on the server."});
  let raw="";
  try {
    for await (const chunk of req) { raw+=chunk; if(Buffer.byteLength(raw)>MAX_BODY) return send(res,413,{success:false,message:"Submission is too large. Please reduce document sizes and try again."}); }
    const payload=JSON.parse(raw);
    if(!payload || typeof payload!=="object" || Array.isArray(payload) || !Array.isArray(payload.attachments)) return send(res,400,{success:false,message:"Invalid registration payload."});
    // Forward the existing Power Automate JSON contract unchanged. Never log the body or secret URL.
    const upstream=await fetch(FLOW_URL,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),signal:AbortSignal.timeout(120000)});
    const text=await upstream.text();
    res.writeHead(upstream.status,{"Content-Type":upstream.headers.get("content-type")||"application/json; charset=utf-8","Cache-Control":"no-store"});
    res.end(text || JSON.stringify({success:upstream.ok}));
  } catch(error) {
    if(error instanceof SyntaxError) return send(res,400,{success:false,message:"The registration data could not be read."});
    if(error.name==="TimeoutError") return send(res,504,{success:false,message:"The submission service timed out. Please try again or contact support."});
    console.error("Power Automate proxy error:",error.message);
    return send(res,502,{success:false,message:"We could not reach the submission service. Your registration has not been confirmed."});
  }
}
const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin;
  if(!originAllowed(origin)) return send(res,403,{success:false,message:"Origin not allowed."});
  if(origin) { res.setHeader("Access-Control-Allow-Origin",origin);res.setHeader("Vary","Origin");res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type"); }
  if(req.method==="OPTIONS"){res.writeHead(204);return res.end();}
  const url=new URL(req.url,"http://localhost");
  if(url.pathname==="/api/vendor-registration") { if(req.method!=="POST") return send(res,405,{success:false,message:"Method not allowed."},{Allow:"POST, OPTIONS"});return proxySubmission(req,res); }
  if(req.method!=="GET"&&req.method!=="HEAD") return send(res,404,{success:false,message:"Not found."});
  let pathname=decodeURIComponent(url.pathname);if(pathname==="/")pathname="/index.html";
  const target=path.resolve(ROOT,"."+pathname);if(!target.startsWith(ROOT+path.sep)&&target!==ROOT)return send(res,403,{success:false,message:"Forbidden."});
  fs.stat(target,(err,stat)=>{if(err||!stat.isFile()) {res.writeHead(404);return res.end("Not found");}const ext=path.extname(target).toLowerCase();res.writeHead(200,{"Content-Type":MIME[ext]||"application/octet-stream","X-Content-Type-Options":"nosniff","Referrer-Policy":"strict-origin-when-cross-origin"});if(req.method==="HEAD")return res.end();fs.createReadStream(target).pipe(res);});
});
server.listen(PORT,()=>console.log(`Vendor portal listening on port ${PORT}`));
