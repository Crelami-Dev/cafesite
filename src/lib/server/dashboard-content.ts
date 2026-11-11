import {contentFields} from "../admin-content-fields";
import {HttpError,objectValue,textValue} from "./validation";
export function validateContent(resource:string,data:unknown):unknown {
 if(resource==="categories"){
  if(!Array.isArray(data)||data.length===0||data.length>50)throw new HttpError(400,"Minimal 1 kategori menu diperlukan.");
  const seen=new Set<string>();
  for(const raw of data){
   const row=objectValue(raw);
   const id=textValue(row.id,"ID kategori",60);
   textValue(row.name,"Nama kategori",80);
   if(!/^[a-z0-9-]+$/.test(id)||seen.has(id))throw new HttpError(400,"ID kategori harus unik dan memakai huruf kecil, angka, atau tanda hubung.");
   seen.add(id);
  }
  return data;
 }
 const fields=contentFields[resource];if(!fields)return data;
 const rows=resource==="cafe"?[objectValue(data)]:Array.isArray(data)?data.map(objectValue):null;
 if(!rows||rows.length>2000)throw new HttpError(400,"Daftar konten tidak valid.");
 const ids=new Set<string>();
 for(const row of rows){
  if(resource!=="cafe"){if(typeof row.id!=="string"||!row.id||ids.has(row.id))throw new HttpError(400,"ID konten harus unik.");ids.add(row.id);}
  for(const field of fields){const v=row[field.key];if(field.required&&(v===undefined||String(v).trim()===""))throw new HttpError(400,`${field.label} wajib diisi.`);if(v!==undefined&&typeof v!=="string"&&typeof v!=="number")throw new HttpError(400,`${field.label} tidak valid.`);if(String(v??"").length>5000)throw new HttpError(400,`${field.label} terlalu panjang.`);if(field.options&&!field.options.includes(String(v)))throw new HttpError(400,`${field.label} tidak valid.`);if(field.type==="url"&&v){try{const url=new URL(String(v));if(!["https:","http:"].includes(url.protocol))throw new Error();}catch{throw new HttpError(400,`${field.label} harus berupa URL http/https.`);}}}
  if(resource==="testimonials"&&(!Number.isInteger(row.rating)||Number(row.rating)<1||Number(row.rating)>5))throw new HttpError(400,"Rating harus 1 sampai 5.");
  if(resource==="gallery"&&!/^\/(?!\/)|^https:\/\//.test(String(row.src)))throw new HttpError(400,"Alamat foto tidak valid.");
  if(resource==="cafe"){
   if(!/^\d{8,15}$/.test(String(row.whatsapp)))throw new HttpError(400,"Nomor WhatsApp harus 8–15 digit, termasuk kode negara.");
   if(!Array.isArray(row.openingHours)||row.openingHours.length!==7)throw new HttpError(400,"Isi jam operasional tujuh hari.");
   for(const raw of row.openingHours){const hour=objectValue(raw);if(typeof hour.day!=="string"||typeof hour.isOpen!=="boolean")throw new HttpError(400,"Hari operasional tidak valid.");if(hour.isOpen&&(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(hour.openTime))||!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(hour.closeTime))))throw new HttpError(400,`Isi waktu buka dan tutup untuk ${hour.day}.`);}
  }
 }
 return data;
}
