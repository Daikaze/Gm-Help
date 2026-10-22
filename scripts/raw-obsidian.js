import { listZipEntries,readZipEntry } from "./zip-reader.js";
const dec=new TextDecoder("utf-8"),enc=new TextEncoder();
const pic=/\.(png|jpe?g|webp)$/i;
const base=p=>p.split("/").pop();
const stem=p=>base(p).replace(/\.[^.]+$/,"");
function hash(t){let n=2166136261;for(const b of enc.encode(t)){n^=b;n=Math.imul(n,16777619)}return (n>>>0).toString(16).padStart(8,"0");}
function classify(p){
 const g=p.split("/")[0].toLowerCase();
 if(g.includes("sessions"))return "session";
 if(g.includes("backstories"))return /\/(?:!!!\s*)?characters\//i.test(p)?"npc":"character";
 if(g.includes("players"))return "character";
 if(["story npc","ravda","guardians","elite 10","chosen heroes","averis yonko"].some(t=>g.includes(t)))return "npc";
 if(g.includes("families"))return /house krat/i.test(p)?"faction":"npc";
 if(["dark guilds","anbu","black hounds"].some(t=>g.includes(t)))return /hercules|barbarossa|- npc/i.test(p)?"npc":"faction";
 if(g.includes("feywild"))return /clans/i.test(p)?"faction":"location";
 if(g.includes("ancient dragons"))return "creature";
 if(g.includes("affinity"))return "mechanic";
 if(g.includes("player items")||g==="items")return "item";
 if(/material.s checks|world learning mechanic/i.test(stem(p)))return "mechanic";
 if(/averis weapons|books|world sprites/i.test(stem(p)))return "item";
 return "lore";
}
function title(p){
 let s=stem(p).replace(/^[🎮!\s]+/gu,"").trim();
 if(/Heinrich.s Backstory/i.test(p)&&/^(Continuation|Final|Misc Details)$/i.test(s))s="Heinrich · "+p.split("/").at(-2)+" · "+s;
 return s||"Untitled";
}
function summary(body){
 const m=body.match(/^>\s*\*\*(?:Main Goal|Main Event|Main Theme|Main Hook|Goal):\*\*\s*(.+)$/im);
 const line=m?.[1]||body.split("\n").find(l=>/^[^#>|*\s\-\[]/.test(l)&&l.length>35&&l.length<250)||"";
 return line.replace(/\[\[([^|\]#]+)(?:\|([^\]]+))?\]\]/g,(_,a,b)=>b||a).replace(/[\x60*_#]/g,"").replace(/\s+/g," ").trim().slice(0,260);
}
// Pure JS SHA-1 for consistent import keys even over a LAN http:// Foundry session.
function sha1(text){
 const bytes=enc.encode(text),total=Math.ceil((bytes.length+9)/64)*64;
 const input=new Uint8Array(total);input.set(bytes);input[bytes.length]=128;
 const dv=new DataView(input.buffer);
 dv.setUint32(total-8,Math.floor(bytes.length*8/4294967296),false);
 dv.setUint32(total-4,(bytes.length*8)>>>0,false);
 const h=[0x67452301,0xefcdab89,0x98badcfe,0x10325476,0xc3d2e1f0];
 const w=new Uint32Array(80);
 const rol=(v,n)=>(v<<n)|(v>>>(32-n));
 for(let pos=0;pos<total;pos+=64){
  for(let i=0;i<16;i++)w[i]=dv.getUint32(pos+i*4,false);
  for(let i=16;i<80;i++)w[i]=rol(w[i-3]^w[i-8]^w[i-14]^w[i-16],1);
  let [a,b,c,d,e]=h;
  for(let i=0;i<80;i++){
   const f=i<20?(b&c)|(~b&d):i<40?(b^c^d):i<60?(b&c)|(b&d)|(c&d):(b^c^d);
   const k=i<20?0x5a827999:i<40?0x6ed9eba1:i<60?0x8f1bbcdc:0xca62c1d6;
   const t=(rol(a,5)+f+e+k+w[i])>>>0;e=d;d=c;c=rol(b,30);b=a;a=t;
  }
  for(let i=0;i<5;i++)h[i]=(h[i]+[a,b,c,d,e][i])>>>0;
 }
 return h.map(n=>n.toString(16).padStart(8,"0")).join("");
}
async function key(path){
 return "obsidian:"+sha1(path).slice(0,24);
}
function assetFor(label,path,assets){
 const name=base(label.replace(/\\\|/g,"|").split("|")[0].trim()).toLocaleLowerCase();
 const matches=assets.filter(a=>a.original.toLocaleLowerCase()===name||stem(a.original).toLocaleLowerCase()===stem(name).toLocaleLowerCase());
 const parent=path.slice(0,path.lastIndexOf("/")+1);
 matches.sort((a,b)=>Number(!a.source.startsWith(parent))-Number(!b.source.startsWith(parent))||a.source.length-b.source.length);
 return matches[0]||null;
}
export async function readRawObsidianVault(file,dir=null){
 const directory=dir||await listZipEntries(file);
 const selected=[...directory.values()].filter(e=>!e.path.split("/").some(t=>t===".obsidian"||t==="__MACOSX")&&!base(e.path).startsWith("._"));
 const notes=selected.filter(e=>/\.md$/i.test(e.path)),pictures=selected.filter(e=>pic.test(e.path));
 if(!notes.length)throw Error("No .md notes in the selected Obsidian ZIP.");
 if(notes.length>1200||pictures.length>400)throw Error("Too many notes or pictures in this archive.");
 let expanded=0;
 for(const e of [...notes,...pictures]){
  if(e.unpacked>(/\.md$/i.test(e.path)?1_200_000:35_000_000))throw Error("Vault file too large: "+e.path);
  expanded+=e.unpacked;
 }
 if(expanded>500_000_000)throw Error("Expanded campaign files exceed 500 MB.");
 const root=selected.length&&selected.every(e=>e.path.includes("/")&&e.path.split("/")[0]===selected[0].path.split("/")[0])
   ?selected[0].path.split("/")[0]+"/":"";
 const relative=p=>p.startsWith(root)?p.slice(root.length):p;
 const assets=pictures.map(e=>{
  const src=relative(e.path);
  return {source:src,original:base(src),file:"vault-"+hash(src)+"-"+hash("img:"+src)+".webp",zipPath:e.path};
 });
 const entries=[];
 for(const entry of notes){
  const path=relative(entry.path),body=dec.decode(await readZipEntry(file,entry,1_200_000)).replace(/^\uFEFF/,"").replace(/\x00/g,"");
  const links=[...new Set(Array.from(body.matchAll(/(?<!!)\[\[([^\]]+)\]\]/g),m=>
   m[1].replace(/\\\|/g,"|").split("|")[0].split("#")[0].trim()).filter(s=>s&&!pic.test(s)))].slice(0,300);
  const refs=[
   ...Array.from(body.matchAll(/!\[\[([^\]]+)\]\]/g),m=>m[1]),
   ...Array.from(body.matchAll(/(?<!!)\[\[([^\]]+\.(?:png|jpe?g|webp)(?:\|[^\]]+)?)\]\]/gi),m=>m[1]),
   ...Array.from(body.matchAll(/!\[[^\]]*\]\(([^)]+\.(?:png|jpe?g|webp))\)/gi),m=>m[1])
  ];
  const media={};
  for(const ref of refs){
   const imageName=ref.replace(/\\\|/g,"|").split("|")[0].trim(),asset=assetFor(imageName,path,assets);
   if(asset)media[imageName]="gm-help/obsidian-assets/"+asset.file;
  }
  if(!Object.keys(media).length){
   const asset=assetFor(stem(path),path,assets);
   if(asset&&stem(asset.original).toLocaleLowerCase()===stem(path).toLocaleLowerCase())
    media[asset.original]="gm-help/obsidian-assets/"+asset.file;
  }
  const record={type:classify(path),key:await key(path),sourcePath:path,sourceTitle:stem(path),
   summary:summary(body),body,description:"",secrets:"",image:Object.values(media)[0]||"",media,links,
   tags:"Obsidian, Averis, "+path.split("/")[0],related:[]};
  if(record.type==="session"){
   const m=stem(path).match(/Session\s*(\d+(?:\.\d+)?)\s*(?:[-–]\s*(\d+(?:\.\d+)?))?/i);
   if(m){record.sessionNumber=m[1];record.sessionEnd=m[2]||m[1];}
   record.sessionStatus="Notes";
   const loc=body.match(/^>\s*\*\*Location:\*\*\s*(.+)$/im);
   if(loc)record.location=loc[1].slice(0,300);
  }
  entries.push({name:title(path),record});
 }
 return {mode:"raw-vault",zipFile:file,zipDirectory:directory,payload:{
  format:"gm-help-obsidian",version:1,campaign:"Averis",source:"Original Obsidian Vault",entries,assets
 }};
}
export async function imageAsWebp(bytes,filename){
 const mime=/\.png$/i.test(filename)?"image/png":/\.webp$/i.test(filename)?"image/webp":"image/jpeg";
 const bitmap=await createImageBitmap(new Blob([bytes],{type:mime}));
 const scale=Math.min(1,1280/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement("canvas");
 canvas.width=Math.max(1,Math.round(bitmap.width*scale));
 canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 const ctx=canvas.getContext("2d");
 if(!ctx){bitmap.close();throw Error("Image canvas unavailable.");}
 ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
 bitmap.close();
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",0.82));
 canvas.width=0;canvas.height=0;
 if(!blob||blob.type!=="image/webp")throw Error("WebP conversion failed in browser.");
 return blob;
}
