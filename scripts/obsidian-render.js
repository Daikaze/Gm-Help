/* Obsidian markdown: source is kept verbatim, never run as HTML or JS. */
const h = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm = (v) => String(v || "").toLocaleLowerCase().trim().split("/").pop().replace(/\.md$/i,"");
function linked(target, docs) {
  const key = norm(target);
  return docs.find(d => norm(d.getFlag("gm-help","record")?.sourcePath) === key)
    || docs.find(d => norm(d.getFlag("gm-help","record")?.sourceTitle) === key)
    || docs.find(d => norm(d.name) === key);
}
function inline(source, rec, docs) {
  const tokens = [];
  const stash = html => {const i=tokens.length;tokens.push(html);return "\uFFF0"+i+"\uFFF1";};
  let value=String(source || "");
  value=value.replace(/!\[\[([^\]]+)\]\]/g,(_,contents)=>{
    const [name,width] = contents.replace(/\\\|/g,"|").split("|");
    const path=rec?.media?.[name.trim()];
    if(!path || !/^(?:https?:\/\/|[a-z0-9_./%-]+)$/i.test(path) || path.includes("..")) return stash("<em>"+h(name)+"</em>");
    const size=/^\d{2,4}$/.test(String(width||"")) ? Math.min(750,Number(width)) : 500;
    return stash('<img class="gmh-md-img" src="'+h(path)+'" loading="lazy" style="max-width:'+size+'px" alt="'+h(name)+'">');
  });
  value=value.replace(/(?<!!)\[\[([^\]]+)\]\]/g,(_,contents)=>{
    const [dest,label] = contents.replace(/\\\|/g,"|").split("|");
    const name=dest.split("#")[0].trim(), visible=label || dest;
    if(/\.(?:png|jpe?g|webp)$/i.test(name) && rec?.media?.[name]) {
      return stash('<img class="gmh-md-img" src="'+h(rec.media[name])+'" loading="lazy" alt="'+h(visible)+'">');
    }
    if (!name) return stash("<span>"+h(visible)+"</span>");
    const doc=linked(name,docs);
    return doc ? stash('<button type="button" class="gmh-wiki-link" data-gmh-action="select" data-id="'+h(doc.id)+'">'+h(visible)+'</button>')
      : stash('<span class="gmh-missing-link">'+h(visible)+'</span>');
  });
  value=value.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g,(_,name,url)=>
    stash('<img class="gmh-md-img" src="'+h(url)+'" loading="lazy" alt="'+h(name)+'">'));
  value=value.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,(_,label,url)=>
    stash('<a target="_blank" rel="noopener noreferrer" href="'+h(url)+'">'+h(label)+'</a>'));
  value=value.replace(/\x60([^\x60\n]+)\x60/g,(_,t)=>stash("<code>"+h(t)+"</code>"));
  value=h(value).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
    .replace(/~~([^~]+)~~/g,"<del>$1</del>")
    .replace(/(^|[^\*])\*([^*\n]+)\*/g,"$1<em>$2</em>");
  return value.replace(/\uFFF0(\d+)\uFFF1/g,(_,i)=>tokens[+i]||"");
}
const tableDivider = s => /^\s*\|?[\s:|-]+\|[\s:|-]+\|?\s*$/.test(s) && s.includes("-");
const parts = s => s.trim().replace(/^\|/,"").replace(/\|$/,"").split(/(?<!\\)\|/);
export function renderObsidianMarkdown(source, record, docs) {
  const lines=String(source||"").replace(/\r\n/g,"\n").split("\n");
  const out=[];let list="",quote=false,code=false,codeLines=[];
  const endList=()=>{if(list){out.push("</"+list+">");list="";}};
  const endQuote=()=>{if(quote){out.push("</blockquote>");quote=false;}};
  const endCode=()=>{out.push("<pre><code>"+h(codeLines.join("\n"))+"</code></pre>");codeLines=[];code=false;};
  for(let i=0;i<lines.length;i++){
    const line=lines[i],t=line.trim();
    if(/^\s*\x60{3}/.test(line)){if(code)endCode();else{endList();endQuote();code=true;}continue;}
    if(code){codeLines.push(line);continue;}
    if(!t){endList();endQuote();continue;}
    const callout=line.match(/^\s*>\s*\[!([a-z-]+)\]\s*(.*)$/i);
    if(callout){endList();endQuote();out.push('<div class="gmh-callout"><strong>'+h(callout[1].toUpperCase())+"</strong> "+inline(callout[2],record,docs)+"</div>");continue;}
    if(/^\s*>\s?/.test(line)){endList();if(!quote){out.push("<blockquote>");quote=true;}out.push("<p>"+inline(line.replace(/^\s*>\s?/,""),record,docs)+"</p>");continue;}
    endQuote();
    const heading=line.match(/^\s*(#{1,6})\s+(.+)$/);
    if(heading){endList();const n=Math.min(6,heading[1].length+1);out.push("<h"+n+">"+inline(heading[2],record,docs)+"</h"+n+">");continue;}
    if(/^\s*(?:---+|\*\*\*+)\s*$/.test(line)){endList();out.push("<hr>");continue;}
    if(t.startsWith("|") && i+1<lines.length && tableDivider(lines[i+1])){
      endList();const headers=parts(line),rows=[];i+=2;
      while(i<lines.length&&lines[i].trim().startsWith("|")){rows.push(parts(lines[i]));i++;}
      i--;out.push('<div class="gmh-table-scroll"><table><thead><tr>'+headers.map(c=>"<th>"+inline(c,record,docs)+"</th>").join("")+"</tr></thead><tbody>"+
        rows.map(row=>"<tr>"+row.map(c=>"<td>"+inline(c,record,docs)+"</td>").join("")+"</tr>").join("")+"</tbody></table></div>");continue;
    }
    const bullet=line.match(/^\s*(?:[-*+]\s+|(\d+)\.\s+)(.*)$/);
    if(bullet){const next=bullet[1]?"ol":"ul";if(list!==next){endList();out.push("<"+next+">");list=next;}out.push("<li>"+inline(bullet[2].replace(/^\[(?:x| )\]\s*/i,""),record,docs)+"</li>");continue;}
    endList();out.push("<p>"+inline(line,record,docs)+"</p>");
  }
  if(code)endCode();endList();endQuote();
  return out.join("\n");
}
