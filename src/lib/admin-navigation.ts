export const dashboardNavigation = [
 {id:"summary",label:"Ringkasan",href:"/dashboard",group:"Kedai"},
 {id:"orders",label:"Pesanan",href:"/dashboard/orders",group:"Operasional"},
 {id:"menu",label:"Menu kedai",href:"/dashboard/menu",group:"Operasional"},
 {id:"tables",label:"Meja & QR",href:"/dashboard/tables",group:"Operasional"},
 {id:"wa_bot",label:"WhatsApp Bot",href:"/dashboard/wa-bot",group:"Operasional"},
 {id:"cafe",label:"Info kafe",href:"/dashboard/cafe",group:"Konten"},
 {id:"gallery",label:"Galeri",href:"/dashboard/gallery",group:"Konten"},
 {id:"testimonials",label:"Testimoni",href:"/dashboard/testimonials",group:"Konten"},
 {id:"faq",label:"FAQ",href:"/dashboard/faq",group:"Konten"},
 {id:"location",label:"Panduan lokasi",href:"/dashboard/location",group:"Konten"},
 {id:"reports",label:"Laporan",href:"/dashboard/reports",group:"Pengelolaan"},
 {id:"modules",label:"Akses tim",href:"/dashboard/team",group:"Pengelolaan"},
] as const;
