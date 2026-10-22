/* Lazy ZIP reader for unmodified Obsidian vaults (STORE + DEFLATE). */
const LIMIT_ZIP=500_000_000;
const utf8=new TextDecoder("utf-8");
const dataView=b=>new DataView(b.buffer,b.byteOffset,b.byteLength);
const CRCTABLE=new Uint32Array(256);
for(let i=0;i<256;i++){let c=i;for(let j=0;j<8;j++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;CRCTABLE[i]=c>>>0;}

export async function listZipEntries(file){
 if(!file||!file.name?.toLowerCase().endsWith(".zip"))throw Error("Select a .zip file.");
 if(file.size>LIMIT_ZIP)throw Error("Archive larger than 500 MB; split the vault.");
 if(file.size<22)throw Error("Invalid ZIP: too small.");
 const n=Math.min(file.size,65557),tail=new Uint8Array(await file.slice(file.size-n).arrayBuffer()),v=dataView(tail);
 let e=-1;
 for(let i=tail.length-22;i>=0;i--)if(v.getUint32(i,true)===0x06054b50&&i+22+v.getUint16(i+20,true)===tail.length){e=i;break;}
 if(e<0)throw Error("ZIP central directory missing.");
 const count=v.getUint16(e+10,true),length=v.getUint32(e+12,true),offset=v.getUint32(e+16,true);
 if(v.getUint16(e+4,true)||v.getUint16(e+6,true)||count!==v.getUint16(e+8,true))throw Error("Multi-disk ZIP unsupported.");
 if(count===65535||length===0xffffffff||offset===0xffffffff)throw Error("ZIP64 unsupported.");
 if(count>5000||offset+length>file.size)throw Error("ZIP directory exceeds safety limits.");
 const bytes=new Uint8Array(await file.slice(offset,offset+length).arrayBuffer()),dv=dataView(bytes),files=new Map();
 let p=0;
 for(let i=0;i<count;i++){
  if(p+46>bytes.length||dv.getUint32(p,true)!==0x02014b50)throw Error("Corrupt ZIP directory.");
  const flags=dv.getUint16(p+8,true),method=dv.getUint16(p+10,true),crc=dv.getUint32(p+16,true);
  const packed=dv.getUint32(p+20,true),unpacked=dv.getUint32(p+24,true);
  const nameLen=dv.getUint16(p+28,true),extra=dv.getUint16(p+30,true),comment=dv.getUint16(p+32,true),local=dv.getUint32(p+42,true);
  const end=p+46+nameLen+extra+comment;
  if(end>bytes.length)throw Error("ZIP entry bounds invalid.");
  const path=utf8.decode(bytes.subarray(p+46,p+46+nameLen));
  p=end;
  if(!path||path.startsWith("/")||path.includes("\\")||path.split("/").some(s=>s===".."||s===".")||/[\x00-\x1f]/.test(path)||path.length>700)throw Error("Unsafe ZIP filename.");
  if(path.endsWith("/"))continue;
  if(files.has(path))throw Error("Duplicate ZIP entry: "+path);
  if(flags&1)throw Error("Encrypted ZIP not supported.");
  if(method!==0&&method!==8)throw Error("ZIP compression method unsupported.");
  if(local===0xffffffff||packed===0xffffffff||unpacked===0xffffffff)throw Error("ZIP64 entry unsupported.");
  files.set(path,{path,method,packed,unpacked,crc,local});
 }
 return files;
}

export async function readZipEntry(file,entry,limit=35_000_000){
 if(!entry||entry.unpacked>limit)throw Error("Individual file exceeds the allowed size.");
 const head=new Uint8Array(await file.slice(entry.local,entry.local+30).arrayBuffer());
 if(head.length!==30||dataView(head).getUint32(0,true)!==0x04034b50)throw Error("Invalid ZIP local header.");
 const h=dataView(head),start=entry.local+30+h.getUint16(26,true)+h.getUint16(28,true);
 if(start+entry.packed>file.size)throw Error("ZIP file data out of bounds.");
 let stream=file.slice(start,start+entry.packed).stream();
 if(entry.method===8){
  if(typeof DecompressionStream!=="function")throw Error("Please update Firefox or Chrome to read compressed ZIPs.");
  stream=stream.pipeThrough(new DecompressionStream("deflate-raw"));
 }
 const out=new Uint8Array(entry.unpacked),reader=stream.getReader();
 let pos=0,crc=0xffffffff;
 try{
  while(true){
   const {done,value}=await reader.read();if(done)break;
   if(pos+value.length>entry.unpacked||pos+value.length>limit)throw Error("ZIP decompression exceeded declared size.");
   out.set(value,pos);pos+=value.length;
   for(const byte of value)crc=CRCTABLE[(crc^byte)&255]^(crc>>>8);
  }
 }finally{reader.releaseLock();}
 if(pos!==entry.unpacked)throw Error("ZIP decompressed length mismatch.");
 if(((crc^0xffffffff)>>>0)!==entry.crc)throw Error("ZIP CRC mismatch.");
 return out;
}
