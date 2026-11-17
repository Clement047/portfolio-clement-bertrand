import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function boxes(bytes,start=0,end=bytes.length){
  const result=[];
  for(let p=start;p<end;){
    if(p+8>end)throw Error('Incomplete MP4 box header');
    let size=bytes.readUInt32BE(p),header=8;
    if(size===1){if(p+16>end)throw Error('Incomplete extended box');size=Number(bytes.readBigUInt64BE(p+8));header=16;}
    if(size===0)size=end-p;
    if(!Number.isSafeInteger(size)||size<header||p+size>end)throw Error('Invalid MP4 box size');
    result.push({type:bytes.toString('ascii',p+4,p+8),start:p,end:p+size,size,header});p+=size;
  }
  return result;
}

// Reorder the container only. Every encoded audio/video byte and timing table
// stays unchanged; the only edited fields are absolute media chunk offsets.
export function faststartMp4(input){
  const top=boxes(input),moovs=top.filter(b=>b.type==='moov'),media=top.filter(b=>b.type==='mdat');
  if(moovs.length!==1||!media.length)return {bytes:input,changed:false,reason:'Not a self-contained non-fragmented MP4'};
  const moov=moovs[0];
  if(moov.start<media[0].start)return {bytes:input,changed:false,reason:'Already fast-start'};
  if(top.some(b=>['moof','sidx'].includes(b.type)))throw Error('Fragmented/indexed MP4 requires a dedicated remuxer');
  const order=top.filter(b=>b!==moov);order.splice(order.indexOf(media[0]),0,moov);
  const positions=new Map();let next=0;
  for(const b of order){positions.set(b,next);next+=b.size;}
  const movie=Buffer.from(input.subarray(moov.start,moov.end)),patches=[];
  function remap(value){
    const original=Number(value);
    if(!Number.isSafeInteger(original))throw Error('Chunk offset exceeds safe integer range');
    const box=media.find(b=>original>=b.start+b.header&&original<b.end);
    if(!box)throw Error('Chunk does not refer to an embedded media payload');
    return BigInt(original-box.start+positions.get(box));
  }
  const containers=new Set(['moov','trak','mdia','minf','stbl']);
  function visit(start,end){
    for(const b of boxes(movie,start,end)){
      const body=b.start+b.header;
      if(b.type==='cmov'||b.type==='mvex')throw Error('Compressed/fragmented movie metadata is unsupported');
      if(b.type==='stco'||b.type==='co64'){
        if(body+8>b.end)throw Error('Invalid chunk offset table');
        const count=movie.readUInt32BE(body+4),width=b.type==='stco'?4:8;
        if(body+8+count*width!==b.end)throw Error('Invalid chunk offset table length');
        for(let i=0;i<count;i++){
          const p=body+8+i*width,old=width===4?BigInt(movie.readUInt32BE(p)):movie.readBigUInt64BE(p),value=remap(old);
          if(width===4){if(value>0xffffffffn)throw Error('32-bit chunk offset overflow');movie.writeUInt32BE(Number(value),p);}else movie.writeBigUInt64BE(value,p);
          patches.push({offset:p,width,old:String(old),value:String(value)});
        }
      }else if(containers.has(b.type))visit(body,b.end);
    }
  }
  visit(0,movie.length);
  if(!patches.length)throw Error('No chunk offset tables found');
  const output=Buffer.concat(order.map(b=>b===moov?movie:input.subarray(b.start,b.end)));
  if(output.length!==input.length)throw Error('Container length changed');
  const after=boxes(output),afterMedia=after.filter(b=>b.type==='mdat');
  const mediaHashes=media.map(b=>hash(input.subarray(b.start,b.end)));
  if(JSON.stringify(mediaHashes)!==JSON.stringify(afterMedia.map(b=>hash(output.subarray(b.start,b.end)))))throw Error('Encoded media was modified');
  // Undo only the offset edits: all other movie metadata must match byte for byte.
  const check=Buffer.from(movie);
  for(const p of patches){if(p.width===4)check.writeUInt32BE(Number(p.old),p.offset);else check.writeBigUInt64BE(BigInt(p.old),p.offset);}
  if(!check.equals(input.subarray(moov.start,moov.end)))throw Error('Non-offset movie metadata was modified');
  return {bytes:output,changed:true,mediaHashes,chunkOffsets:patches.length,metadataBytes:moov.size,sha256Before:hash(input),sha256After:hash(output)};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const args=process.argv.slice(2),backupIndex=args.indexOf('--backup-dir');
  if(backupIndex<0||!args[backupIndex+1])throw Error('Pass --backup-dir and explicit MP4 paths');
  const backupDir=path.resolve(args[backupIndex+1]);args.splice(backupIndex,2);fs.mkdirSync(backupDir,{recursive:true});
  for(const name of args){
    const file=path.resolve(name),input=fs.readFileSync(file),result=faststartMp4(input);
    if(!result.changed){console.log(JSON.stringify({file,changed:false,reason:result.reason}));continue;}
    const backup=path.join(backupDir,result.sha256Before+'-'+path.basename(file));
    if(!fs.existsSync(backup))fs.writeFileSync(backup,input,{flag:'wx'});
    // Versioned web asset: leave source footage intact and avoid stale range caches.
    const output=file.replace(/\.mp4$/i,'.faststart.mp4');
    if(output===file)throw Error('Expected an .mp4 file');
    if(fs.existsSync(output)){if(hash(fs.readFileSync(output))!==result.sha256After)throw Error('Output already exists with different bytes');}
    else fs.writeFileSync(output,result.bytes,{flag:'wx'});
    const {bytes,...summary}=result;console.log(JSON.stringify({file,output,backup,...summary}));
  }
}
