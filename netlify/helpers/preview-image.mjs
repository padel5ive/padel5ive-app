/* Image validation for 1200x630 published WhatsApp previews.
 * JPEG (compact default) and prior PNG previews remain readable.
 */
export function previewImageType(bytes) {
 if(!bytes||bytes.byteLength<60)return null;
 if(bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a') {
  return bytes.byteLength>=24&&bytes.readUInt32BE(16)===1200&&bytes.readUInt32BE(20)===630?'png':null;
 }
 if(bytes[0]!==0xff||bytes[1]!==0xd8||bytes[2]!==0xff)return null;
 let pos=2;
 while(pos+4<bytes.byteLength){
  if(bytes[pos]!==0xff){pos++;continue;}
  while(bytes[pos]===0xff)pos++;
  const marker=bytes[pos++];
  if(marker===0xda||marker===0xd9)break;
  if((marker>=0xd0&&marker<=0xd7)||marker===0x01)continue;
  if(pos+2>bytes.byteLength)break;
  const len=bytes.readUInt16BE(pos);
  if(len<2||pos+len>bytes.byteLength)break;
  if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb].includes(marker)) {
   if(len<7)return null;
   return bytes.readUInt16BE(pos+3)===630&&bytes.readUInt16BE(pos+5)===1200?'jpg':null;
  }
  pos+=len;
 }
 return null;
}
