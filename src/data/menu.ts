import { MenuItem, MenuCategory } from "@/types";

export interface MenuCategoryMeta {
  id: MenuCategory;
  name: string;
  description: string;
  icon?: string;
  image?: string;
}

export const menuCategories: MenuCategoryMeta[] = [
  {
    id: "coffee",
    name: "Coffee",
    description: "Biji Nusantara yang kami sangrai sendiri, plus espresso yang diracik pelan",
    icon: "☕",
    image: "/Image/Gallery/gal-02-morning-brew.webp",
  },
  {
    id: "non-coffee",
    name: "Non-Coffee",
    description: "Teh, matcha Uji, dan mocktail — buat hari-hari yang nggak ngopi",
    icon: "🍵",
    image: "/Image/Menu/Berry_Tea.webp",
  },
  {
    id: "food",
    name: "Food",
    description: "Makanan berat dengan bumbu yang nggak malu-malu",
    icon: "🍳",
    image: "/Image/Menu/Nasi_Goreng.webp",
  },
  {
    id: "snack",
    name: "Snack",
    description: "Camilan gurih yang bikin ngobrol makin lama",
    icon: "🍟",
    image: "/Image/Menu/Truffle_Fries.webp",
  },
  {
    id: "dessert",
    name: "Dessert",
    description: "Penutup yang susah ditolak. Serius.",
    icon: "🥐",
    image: "/Image/Menu/Croissant.webp",
  },
];

// Data menu CafeSite dengan gambar teroptimasi WebP di /Image/Menu/
export const menuItems: MenuItem[] = [
  // --- Kategori: Coffee ---
  {
    id: "c-01",
    name: "Americano",
    description: "Espresso single origin Sumatra. Panas atau dingin, dua-duanya enak.",
    price: 22000,
    category: "coffee",
    image: "/Image/Menu/Americano.webp",
    tags: ["Single Origin", "Sugar Free"],
    isFeatured: false,
  },
  {
    id: "c-02",
    name: "Caramel Macchiato",
    description: "Espresso, susu, dan saus caramel yang nggak pelit. Rata-rata yang pertama kali ke sini pesen ini.",
    price: 28000,
    category: "coffee",
    image: "/Image/Menu/C_Macchiato.webp",
    tags: ["Best Seller", "Sweet"],
    isFeatured: true,
  },
  {
    id: "c-03",
    name: "Manual Brew V60",
    description: "Single origin yang diseduh manual. Aciditynya kelihatan, floral, sedikit fruity.",
    price: 30000,
    category: "coffee",
    image: "/Image/Menu/V60.webp",
    tags: ["Signature", "Artisanal"],
    isFeatured: true,
  },

  // --- Kategori: Non-Coffee ---
  {
    id: "nc-01",
    name: "Matcha Latte",
    description: "Matcha Uji asli, susunya bikin creamy. Nggak pait-pait amat.",
    price: 26000,
    category: "non-coffee",
    image: "/Image/Menu/Macha_latte.webp",
    tags: ["Best Seller", "Japanese"],
    isFeatured: true,
  },
  {
    id: "nc-02",
    name: "Artisan Berry Tea",
    description: "Teh hitam beraroma berry. Asem manis yang bikin nggak bosen.",
    price: 24000,
    category: "non-coffee",
    image: "/Image/Menu/Berry_Tea.webp",
    tags: ["Refreshing", "Iced"],
    isFeatured: false,
  },
  {
    id: "nc-03",
    name: "Sparkling Lychee Mint",
    description: "Soda dengan leci utuh dan mint yang diremas. Coba deh pas siang panas.",
    price: 28000,
    category: "non-coffee",
    image: "/Image/Menu/Lychee_Mint.webp",
    tags: ["Mocktail", "Citrus"],
    isFeatured: false,
  },

  // --- Kategori: Food ---
  {
    id: "f-01",
    name: "Nasi Goreng Kampung",
    description: "Nasgor rempah dengan ayam suwir, acar, dan telor ceplok. Pulang malem wajib ini.",
    price: 35000,
    category: "food",
    image: "/Image/Menu/Nasi_Goreng.webp",
    tags: ["Signature", "Hearty"],
    isFeatured: true,
  },
  {
    id: "f-02",
    name: "Creamy Chicken Carbonara",
    description: "Fettuccine creamy, parmesan, smoked chicken. Cocok pas lagi laper parah.",
    price: 42000,
    category: "food",
    image: "/Image/Menu/Carbonara.webp",
    tags: ["Pasta", "Creamy"],
    isFeatured: false,
  },

  // --- Kategori: Snack ---
  {
    id: "s-01",
    name: "Truffle Fries",
    description: "Kentang goreng minyak truffle, parmesannya nggak tanggung. Buat berdua pas.",
    price: 25000,
    category: "snack",
    image: "/Image/Menu/Truffle_Fries.webp",
    tags: ["Favorit Tamu", "Sharing"],
    isFeatured: true,
  },
  {
    id: "s-02",
    name: "Cireng Bumbu Rujak",
    description: "Aci renyah di luar, kenyal di dalam. Sambalnya asem nendang.",
    price: 20000,
    category: "snack",
    image: "/Image/Menu/Cireng.webp",
    tags: ["Tradisional", "Spicy"],
    isFeatured: false,
  },

  // --- Kategori: Dessert ---
  {
    id: "d-01",
    name: "Classic Butter Croissant",
    description: "Lapisannya renyah, wangi butter, dalemnya lembut. Dibakar dikit makin enak.",
    price: 24000,
    category: "dessert",
    image: "/Image/Menu/Croissant.webp",
    tags: ["Fresh Baked", "French"],
    isFeatured: true,
  },
  {
    id: "d-02",
    name: "Basque Burnt Cheesecake",
    description: "Dalemnya lumer, atasnya karamel khas basque. Simpel tapi nagih.",
    price: 32000,
    category: "dessert",
    image: "/Image/Menu/Cheesecake.webp",
    tags: ["Sweet", "Rich"],
    isFeatured: false,
  },
];
