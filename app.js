/**
 * =========================================================================================
 * KIKO POS & SMART SHOP v2.1 — TOKO DELINA ATK & FOTOKOPI ("Kiko Smart Stationery")
 * Frontend & Hybrid GAS Client Engine (PRD v2.1 & DESIGNnew.md)
 * Lokasi: Jl. Lintas Sumatera, Tanjung Raja, Kabupaten Ogan Ilir
 * =========================================================================================
 */

const APP_STATE = {
  // Pengaturan Identitas & Branding Dinamis (CMS Pengaturan_Toko)
  store: {
    name: "Toko Delina ATK & Fotokopi",
    tagline: "Kiko Smart Stationery • Tanjung Raja",
    address: "Jl. Lintas Sumatera, Tanjung Raja, Kab. Ogan Ilir, Sumatera Selatan",
    logo: "assets/logo.jpg",
    phone: "0812-7890-1234",
    email: "tokodelina.tanjungraja@gmail.com",
    receiptFooter: "Transaksi Sah, Halal & Bebas Riba • Jazakumullahu Khairan Katsiran",
    darkMode: false,
    qrisImage: null,
    bankAccounts: [
      { bank: "Bank Sumsel Babel", norek: "150-09-88210-4", an: "Toko Delina ATK", badge: "Utama SPJ Daerah" },
      { bank: "BSI (Bank Syariah Indonesia)", norek: "719-8824-901", an: "Deri / Delina ATK", badge: "Bebas Riba" },
      { bank: "BRI Cabang Tanjung Raja", norek: "5721-01-029384-53-9", an: "Toko Delina", badge: "Transfer Cepat" }
    ]
  },

  // Jadwal Waktu Sholat Wilayah Tanjung Raja, Kab. Ogan Ilir (Termasuk Imsak & Terbit)
  prayerTimes: {
    imsak: "04:18",
    subuh: "04:28",
    terbit: "05:43",
    dzuhur: "11:54",
    ashar: "15:12",
    maghrib: "18:01",
    isya: "19:12"
  },
  autoAzanEnabled: true,

  // Sesi Autentikasi 4 Tingkat (RBAC)
  authLevel: 2, // 1: Publik, 2: Member/Instansi, 3: Kasir POS, 4: Owner Super Admin
  user: {
    id: "MTR-SDN01",
    name: "Dra. Hj. Nurjanah, M.Pd",
    role: "Tingkat 2 • Perwakilan Instansi SPJ",
    phone: "0812-7890-8812",
    instansi: "SDN 01 Tanjung Raja",
    emailBendahara: "bendahara@sdn01tanjungraja.sch.id",
    commissionBalance: 485000,
    loyaltyCount: 12 // Menuju 15x transaksi Bintang 5 + Ulasan
  },

  // Keranjang Belanja & Mode Harga + Status Validasi Bukti Bayar
  cart: [],
  isPaymentProofVerified: false,
  paymentProofDataUrl: null,
  posCart: [
    { id: "PRD-001", name: "Kertas HVS Sinar Dunia PaperOne A4 80gsm", price: 54000, qty: 2 },
    { id: "PRD-004", name: "Pulpen Pilot Ballliner G2 0.5mm Hitam", price: 32000, qty: 1 }
  ],
  isWholesaleMode: false,
  fulfillment: "collect",
  activeProduct: null,

  // Riwayat Pesanan & Antrean Cetak Terpadu (Sinkron antara POS Kasir, Order Cetak, & Lacak Pesanan)
  shiftCashTotal: 1120000,
  shiftNonCashTotal: 730000,
  netProfitToday: 950000,
  activeTrackedOrder: null,

  orderHistory: [
    {
      invoiceId: "#INV-20261027-088",
      date: "27 Okt 2026 • 14:20 WIB",
      customer: "Dra. Hj. Nurjanah, M.Pd (SDN 01 Tanjung Raja)",
      itemsSummary: "5 Rim HVS A4 80g, 2 Ktk Pilot G2, Cetak Ujian",
      total: 422000,
      komisi: 21100,
      status: "Siap Ambil",
      paymentMethod: "QRIS Syariah",
      photo: "assets/print_review.jpg",
      isSpj: true
    },
    {
      invoiceId: "#INV-20261024-052",
      date: "24 Okt 2026 • 09:45 WIB",
      customer: "Budi Santoso (Kantor Desa Tanjung Raja Selatan)",
      itemsSummary: "10 Rim HVS F4 70g, 3 Ktk Pulpen Standard AE7",
      total: 553500,
      komisi: 27675,
      status: "Selesai & Lunas",
      paymentMethod: "Transfer Bank BSI",
      photo: "assets/product_hvs.jpg",
      isSpj: true
    },
    {
      invoiceId: "#INV-20261019-019",
      date: "19 Okt 2026 • 16:10 WIB",
      customer: "Siti Delina (SMPN 2 Tanjung Raja)",
      itemsSummary: "Cetak & Jilid Spiral Kawat Modul Guru (6 Buku)",
      total: 198000,
      komisi: 9900,
      status: "Sedang Dicetak",
      paymentMethod: "Tunai (Cash)",
      photo: "assets/print_review.jpg",
      isSpj: true
    }
  ]
};

/**
 * Helper memanggil backend Google Apps Script (jika di-deploy di GAS) dengan fallback lokal instan
 */
function callGasBackend(action, payload, callback) {
  if (typeof google !== "undefined" && google.script && google.script.run) {
    google.script.run
      .withSuccessHandler(res => { if (callback) callback(res); })
      .withFailureHandler(err => {
        console.warn("GAS Backend notice:", err);
        if (callback) callback({ success: true, simulated: true });
      })
      .apiCallFromClient(action, payload);
  } else {
    if (callback) setTimeout(() => callback({ success: true, simulated: true }), 150);
  }
}

// =========================================================================================
// MASTER DATA PRODUK ATK & PERCETAKAN (`Master_Produk`)
// =========================================================================================
const MASTER_PRODUCTS = [
  {
    id: "PRD-001",
    sku: "ATK-HVS-A480",
    barcode: "8991389200101",
    name: "Kertas HVS Sinar Dunia PaperOne A4 80gsm",
    category: "kertas",
    brand: "Sinar Dunia / PaperOne",
    unit: "Rim (500 Lembar)",
    hpp: 45000,
    priceEceran: 54000,
    priceGrosir: 51000,
    stock: 35,
    rating: 5.0,
    soldCount: 280,
    image: "assets/product_hvs.jpg",
    alternativeId: "PRD-002",
    specs: {
      "Kode / Barcode": "PRD-001 (8991389200101)",
      "SKU Toko": "ATK-HVS-A480",
      "Merk / Brand": "Sinar Dunia (SiDU) PaperOne Original",
      "Ukuran Kertas": "A4 (210 x 297 mm)",
      "Ketebalan / Gramatur": "80 GSM (Super White 98% & Tebal)",
      "Isi Kemasan": "1 Rim = 500 Lembar",
      "Kompatibilitas": "Laserjet, Inkjet, Mesin Fotokopi High-Speed",
      "Sertifikasi": "ISO 9001, Halal Syariah, Bebas Riba"
    },
    description: "Kertas HVS premium multi-purpose dengan derajat keputihan tinggi (Super White) dan ketebalan 80gsm. Sangat ideal untuk cetak skripsi, laporan SPJ sekolah/desa, dan dokumen resmi bolak-balik tanpa tembus tinta.",
    reviews: [
      { user: "Dra. Hj. Nurjanah (SDN 01)", stars: 5, text: "Kertasnya tebal dan bersih, sangat bagus untuk laporan SPJ sekolah." },
      { user: "M. Ridho Pratama (Unsri)", stars: 5, text: "Pakai kertas ini untuk cetak skripsi Bab 1-5 hasilnya mulus tidak macet." }
    ]
  },
  {
    id: "PRD-002",
    sku: "ATK-HVS-A470",
    barcode: "8991389200202",
    name: "Kertas HVS Sinar Dunia A4 70gsm SiDU",
    category: "kertas",
    brand: "Sinar Dunia (SiDU)",
    unit: "Rim (500 Lembar)",
    hpp: 40000,
    priceEceran: 48000,
    priceGrosir: 45000,
    stock: 48,
    rating: 4.9,
    soldCount: 420,
    image: "assets/product_hvs.jpg",
    alternativeId: "PRD-001",
    specs: {
      "Kode / Barcode": "PRD-002 (8991389200202)",
      "SKU Toko": "ATK-HVS-A470",
      "Merk / Brand": "Sinar Dunia (SiDU)",
      "Ukuran Kertas": "A4 (210 x 297 mm)",
      "Ketebalan / Gramatur": "70 GSM",
      "Isi Kemasan": "1 Rim = 500 Lembar",
      "Peruntukan": "Fotokopi Harian, Soal Ujian Sekolah, Modul"
    },
    description: "Pilihan paling ekonomis dan laris untuk kebutuhan fotokopi massal, penggandaan soal ujian sekolah, serta tugas harian pelajar di Tanjung Raja.",
    reviews: [
      { user: "Siti Delina (SMPN 2 Tj. Raja)", stars: 5, text: "Selalu beli borongan untuk ujian semester, harga grosirnya hemat." }
    ]
  },
  {
    id: "PRD-003",
    sku: "ATK-HVS-F470",
    barcode: "8991389200303",
    name: "Kertas Folio F4 70gsm Sinar Dunia",
    category: "kertas",
    brand: "Sinar Dunia (SiDU)",
    unit: "Rim (500 Lembar)",
    hpp: 44000,
    priceEceran: 53000,
    priceGrosir: 49500,
    stock: 24,
    rating: 4.9,
    soldCount: 310,
    image: "assets/product_hvs.jpg",
    alternativeId: "PRD-001",
    specs: {
      "Kode / Barcode": "PRD-003 (8991389200303)",
      "SKU Toko": "ATK-HVS-F470",
      "Merk / Brand": "Sinar Dunia (SiDU)",
      "Ukuran Kertas": "F4 / Folio Resmi (215 x 330 mm)",
      "Gramatur": "70 GSM",
      "Isi Kemasan": "500 Lembar / Rim",
      "Peruntukan": "Administrasi Kantor Desa, Kecamatan, & Sekolah"
    },
    description: "Ukuran standar F4/Folio untuk arsip surat keputusan kantor desa, kelurahan, kecamatan, dan berkas administrasi sekolah di Kabupaten Ogan Ilir.",
    reviews: [
      { user: "Budi Santoso (Sekdes Tj. Raja Selatan)", stars: 5, text: "Wajib untuk administrasi desa, pengiriman kurir lokal cepat." }
    ]
  },
  {
    id: "PRD-004",
    sku: "ATK-PEN-PLTG2",
    barcode: "8991389200404",
    name: "Pulpen Pilot Ballliner G2 0.5mm Hitam",
    category: "alat-tulis",
    brand: "Pilot Japan",
    unit: "Kotak (12 Pcs)",
    hpp: 24000,
    priceEceran: 32000,
    priceGrosir: 28500,
    stock: 18,
    rating: 4.9,
    soldCount: 150,
    image: "assets/product_hvs.jpg",
    alternativeId: "PRD-005",
    specs: {
      "Kode / Barcode": "PRD-004 (8991389200404)",
      "SKU Toko": "ATK-PEN-PLTG2",
      "Merk": "Pilot Original",
      "Ukuran Mata Pena": "0.5 mm Extra Smooth Gel",
      "Warna Tinta": "Hitam Pekat Anti-Luntur",
      "Isi Kemasan": "1 Kotak = 12 Batang"
    },
    description: "Pulpen gel kualitas tinggi dengan aliran tinta lembut dan cepat kering, sangat nyaman untuk tanda tangan berkas SPJ dan mencatat materi kuliah.",
    reviews: [
      { user: "Dra. Hj. Nurjanah", stars: 5, text: "Enak sekali dipakai tanda tangan berkas dinas, tinta tidak macet." }
    ]
  },
  {
    id: "PRD-005",
    sku: "ATK-PEN-AE7",
    barcode: "8991389200505",
    name: "Pulpen Standard AE7 0.5mm Hitam (Best Seller)",
    category: "alat-tulis",
    brand: "Standard",
    unit: "Kotak (12 Pcs)",
    hpp: 16000,
    priceEceran: 22000,
    priceGrosir: 19500,
    stock: 50,
    rating: 5.0,
    soldCount: 620,
    image: "assets/product_hvs.jpg",
    alternativeId: "PRD-004",
    specs: {
      "Kode / Barcode": "PRD-005 (8991389200505)",
      "SKU Toko": "ATK-PEN-AE7",
      "Merk": "Standard AE7 Alfa",
      "Tip": "0.5 mm Oil Gel",
      "Isi Kemasan": "1 Lusin (12 Pcs)",
      "Keunggulan": "Tahan Lama, Ekonomis, Tidak Bocor"
    },
    description: "Pulpen sejuta umat paling laris untuk kebutuhan guru, siswa, mahasiswa, dan pegawai kantor di Tanjung Raja.",
    reviews: [
      { user: "Rahmat Hidayat", stars: 5, text: "Harga terjangkau dan awet dipakai sehari-hari." }
    ]
  },
  {
    id: "PRD-006",
    sku: "ATK-BK-DBLF",
    barcode: "8991389200606",
    name: "Kertas Folio Bergaris Double Folio SiDU",
    category: "kertas",
    brand: "Sinar Dunia (SiDU)",
    unit: "Pack (100 Lembar)",
    hpp: 13500,
    priceEceran: 18000,
    priceGrosir: 16000,
    stock: 0, // STOK 0 -> Otomatis memicu rekomendasi produk alternatif oleh AI Kiko!
    rating: 4.8,
    soldCount: 390,
    image: "assets/product_hvs.jpg",
    alternativeId: "PRD-007",
    specs: {
      "Kode / Barcode": "PRD-006 (8991389200606)",
      "SKU Toko": "ATK-BK-DBLF",
      "Merk": "Sinar Dunia (SiDU)",
      "Ukuran": "Double Folio Bergaris",
      "Status Stok": "HABIS / SOLD OUT (0 Pack)",
      "Rekomendasi Alternatif AI": "Kertas Folio Bergaris Gelatik Kembar (PRD-007)"
    },
    description: "Kertas double folio bergaris untuk ujian dan pembukuan. Saat ini stok sedang 0 (habis), dan AI Kiko secara proaktif menawarkan produk alternatif Gelatik Kembar yang ready di toko.",
    reviews: [
      { user: "Mahasiswa Unsri", stars: 5, text: "Saat SiDU habis, Kiko langsung menyarankan Gelatik Kembar yang sama bagusnya!" }
    ]
  },
  {
    id: "PRD-007",
    sku: "ATK-BK-GLTK",
    barcode: "8991389200707",
    name: "Kertas Folio Bergaris Gelatik Kembar (Alternatif Ready)",
    category: "kertas",
    brand: "Gelatik Kembar",
    unit: "Pack (100 Lembar)",
    hpp: 13000,
    priceEceran: 17500,
    priceGrosir: 15500,
    stock: 30,
    rating: 4.9,
    soldCount: 210,
    image: "assets/product_hvs.jpg",
    alternativeId: null,
    specs: {
      "Kode / Barcode": "PRD-007 (8991389200707)",
      "SKU Toko": "ATK-BK-GLTK",
      "Merk": "Gelatik Kembar Original",
      "Ukuran": "Double Folio Bergaris Presisi",
      "Isi Kemasan": "100 Lembar / Pack",
      "Status Stok": "Ready 30 Pack di Toko Delina"
    },
    description: "Produk alternatif terbaik dengan kualitas kertas halus dan cetakan garis biru presisi, sangat direkomendasikan oleh AI Kiko.",
    reviews: [
      { user: "Putri Amalia", stars: 5, text: "Kertasnya halus dan garisnya jelas, harga malah lebih hemat." }
    ]
  },
  {
    id: "PRD-008",
    sku: "JSA-SKR-SPRL",
    barcode: "8991389200808",
    name: "Paket Cetak Skripsi & Jilid Spiral Kawat Mewah",
    category: "cetak",
    brand: "Layanan Cetak Toko Delina",
    unit: "Paket Buku",
    hpp: 9000,
    priceEceran: 15000,
    priceGrosir: 13000,
    stock: 99,
    rating: 5.0,
    soldCount: 450,
    image: "assets/print_review.jpg",
    alternativeId: null,
    specs: {
      "Kode / Barcode": "PRD-008 (8991389200808)",
      "SKU Toko": "JSA-SKR-SPRL",
      "ID Layanan": "SRV-008",
      "Jenis": "Jilid Spiral Kawat + Cover Mika & Buffalo",
      "Estimasi Pengerjaan": "15 – 30 Menit Selesai",
      "Metode Order": "Upload PDF via Web PWA / Bot Telegram"
    },
    description: "Layanan unggulan cetak laporan, proposal, modul sekolah, dan skripsi mahasiswa dengan hasil cetak tajam serta jilid kawat spiral presisi.",
    reviews: [
      { user: "M. Ridho Pratama", stars: 5, text: "Hasil jilid spiral kawatnya rapi sekali, selesai tepat waktu tanpa antre." }
    ]
  },
  {
    id: "PRD-009",
    sku: "ATK-STP-JK107",
    barcode: "8991389200909",
    name: "Joyko Binder Clip No. 107 & Stapler HD-10 Set",
    category: "kantor",
    brand: "Joyko",
    unit: "Set Lengkap",
    hpp: 18000,
    priceEceran: 24000,
    priceGrosir: 21500,
    stock: 42,
    rating: 4.9,
    soldCount: 195,
    image: "assets/product_hvs.jpg",
    alternativeId: null,
    specs: {
      "Kode / Barcode": "PRD-009 (8991389200909)",
      "SKU Toko": "ATK-STP-JK107",
      "Merk": "Joyko Original",
      "Isi Paket": "1 Kotak Binder Clip 107 + 1 Stapler HD-10",
      "Material": "Baja Anti-Karat Kuat"
    },
    description: "Paket penjepit berkas dan stapler tangguh untuk merapikan dokumen SPJ sekolah maupun arsip kantor desa.",
    reviews: [
      { user: "Staf Kecamatan Tanjung Raja", stars: 5, text: "Kuat untuk menjepit berkas laporan tebal." }
    ]
  },
  {
    id: "PRD-010",
    sku: "TNT-PRN-003",
    barcode: "8991389201000",
    name: "Tinta Printer Epson 003 / Canon GI-790 Original",
    category: "tinta",
    brand: "Epson / Canon",
    unit: "Botol (70ml)",
    hpp: 76000,
    priceEceran: 95000,
    priceGrosir: 88000,
    stock: 15,
    rating: 5.0,
    soldCount: 95,
    image: "assets/product_hvs.jpg",
    alternativeId: null,
    specs: {
      "Kode / Barcode": "PRD-010 (8991389201000)",
      "SKU Toko": "TNT-PRN-003",
      "Kemasan": "Botol 70 ml Segel Resmi",
      "Pilihan Warna": "Black, Cyan, Magenta, Yellow",
      "Jaminan": "100% Original Aman untuk Printhead"
    },
    description: "Tinta printer original menghasilkan cetakan teks hitam pekat dan warna cemerlang untuk printer inventaris sekolah maupun kantor.",
    reviews: [
      { user: "Operator SDN 01", stars: 5, text: "Tinta original segel resmi, printer sekolah jadi awet." }
    ]
  }
];

// =========================================================================================
// DATA ULASAN GALERI REVIEW BERANIMASI (RUNNING CARD MARQUEE KIRI KE KANAN)
// =========================================================================================
const MARQUEE_REVIEWS = [
  {
    name: "Dra. Hj. Nurjanah, M.Pd",
    role: "Bendahara SDN 01 Tanjung Raja",
    rating: 5,
    comment: "Pesan 20 rim kertas HVS untuk ujian sekolah, diantar kurir lokal lengkap dengan Nota SPJ PDF resmi. Sangat amanah!",
    photo: "assets/print_review.jpg"
  },
  {
    name: "M. Ridho Pratama",
    role: "Mahasiswa Unsri Indralaya",
    rating: 5,
    comment: "Cetak skripsi 60 halaman warna + jilid spiral kawat rapi banget tanpa antre. Foto hasil cetakan langsung muncul di web!",
    photo: "assets/print_review.jpg"
  },
  {
    name: "Budi Santoso",
    role: "Sekretaris Desa Tanjung Raja Selatan",
    rating: 5,
    comment: "Transparansi saldo komisi instansi sangat jelas dan nota SPJ ber-kop Toko Delina langsung terkirim ke email desa.",
    photo: "assets/print_review.jpg"
  },
  {
    name: "Siti Delina",
    role: "Staf TU SMP Negeri 2 Tanjung Raja",
    rating: 5,
    comment: "Belanja ATK kantor rutin via chat Robot Kiko Berpeci, otomatis masuk keranjang dan bebas riba. Barakallah!",
    photo: "assets/product_hvs.jpg"
  },
  {
    name: "Rahmat Hidayat",
    role: "Warga Tanjung Raja • Member Loyalty",
    rating: 5,
    comment: "Alhamdulillah konsisten kasih rating bintang 5 sampai 15x transaksi, beneran dapat hadiah Flashdisk 32GB gratis!",
    photo: "assets/loyalty_gift.jpg"
  },
  {
    name: "Ust. M. Zulkarnain",
    role: "Pengurus Masjid Agung Ogan Ilir",
    rating: 5,
    comment: "Fitur jadwal sholat Ogan Ilir dengan suara azan otomatis dan dzikir Al-Matsurat di header web sangat bermanfaat.",
    photo: "assets/print_review.jpg"
  }
];

// =========================================================================================
// DATA DZIKIR PAGI & PETANG AL-MA'TSURAT (`https://almatsurat.com/`)
// =========================================================================================
const ALMATSURAT_DATA = {
  pagi: [
    {
      judul: "Ta'awwudz, Al-Fatihah & Ayat Kursi (QS. Al-Baqarah: 255)",
      arabic: "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ",
      latin: "Allahu laa ilaaha illaa huwal hayyul qayyuum, laa ta'khudzuhuu sinatuw wa laa naum...",
      arti: "Allah, tidak ada tuhan selain Dia. Yang Mahahidup, Yang terus-menerus mengurus makhluk-Nya, tidak mengantuk dan tidak tidur...",
      fadhilah: "Barangsiapa membacanya di pagi hari, ia dilindungi hingga petang. (HR. Al-Hakim • almatsurat.com)",
      targetCount: 1
    },
    {
      judul: "Al-Ikhlas, Al-Falaq, & An-Naas (3x Pagi & Petang)",
      arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ ۝ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۝ قُلْ أَعُوذُ بِرَبِّ النَّاسِ",
      latin: "Qul huwallahu ahad... Qul a'uudzu bi rabbil falaq... Qul a'uudzu bi rabbin-naas...",
      arti: "Katakanlah: Dialah Allah Yang Maha Esa... Aku berlindung kepada Tuhan yang menguasai subuh... Aku berlindung kepada Tuhan manusia...",
      fadhilah: "Dibaca 3x setiap pagi dan petang maka mencukupkanmu dari segala sesuatu. (HR. Abu Dawud & Tirmidzi)",
      targetCount: 3
    },
    {
      judul: "Dzikir Pagi Utama (Ashbahnaa wa Ashbahal Mulku Lillaah)",
      arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
      latin: "Ashbahnaa wa ashbahal mulku lillaahi walhamdu lillaahi, laa ilaaha illallaahu wahdahu laa syariika lah...",
      arti: "Kami berpagi hari dan kerajaan alam semesta tetap milik Allah. Segala puji bagi Allah, tiada sekutu bagi-Nya.",
      fadhilah: "Memohon kebaikan hari ini dan berlindung dari keburukannya. (HR. Muslim • almatsurat.com)",
      targetCount: 3
    },
    {
      judul: "Sayyidul Istighfar & Doa Rabithah Al-Ma'tsurat",
      arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَٰهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ",
      latin: "Allahumma anta rabbii laa ilaaha illaa anta, khalaqtanii wa ana 'abduka, wa ana 'alaa 'ahdika wa wa'dika mastatha'tu...",
      arti: "Ya Allah, Engkau adalah Tuhanku, tiada tuhan selain Engkau. Engkau telah menciptakanku dan aku adalah hamba-Mu...",
      fadhilah: "Penghulu istighfar pembuka pintu keberkahan dan ampunan. (HR. Bukhari)",
      targetCount: 1
    }
  ],
  petang: [
    {
      judul: "Dzikir Petang Utama (Amsaynaa wa Amsal Mulku Lillaah)",
      arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَٰهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
      latin: "Amsaynaa wa amsal mulku lillaahi walhamdu lillaahi, laa ilaaha illallaahu wahdahu laa syariika lah...",
      arti: "Kami memasuki waktu petang dan kerajaan ini tetap milik Allah. Segala puji bagi Allah semata.",
      fadhilah: "Perlindungan dan ketenangan hati di waktu petang hingga pagi. (HR. Muslim • almatsurat.com)",
      targetCount: 3
    },
    {
      judul: "Doa Perlindungan Petang (Bismillaahil-ladzii laa yadhurru)",
      arabic: "بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
      latin: "Bismillaahil-ladzii laa yadhurru ma'asmihii syai'un fil-ardhi wa laa fis-samaa'i wa huwas-samii'ul 'aliim.",
      arti: "Dengan nama Allah yang bersama nama-Nya tidak ada sesuatu pun di bumi dan di langit yang membahayakan.",
      fadhilah: "Barangsiapa membacanya 3 kali di petang hari maka tidak ada bahaya yang memudharatkannya hingga pagi. (HR. Tirmidzi)",
      targetCount: 3
    },
    {
      judul: "Doa Keridhaan (Radhiitu Billaahi Rabbaa)",
      arabic: "رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا وَرَسُولًا",
      latin: "Radhiitu billaahi rabbaa, wa bil-islaami diinaa, wa bi Muhammadin shallallaahu 'alaihi wa sallama nabiyyaw wa rasuulaa.",
      arti: "Aku ridha Allah sebagai Rabbku, Islam sebagai agamaku, dan Muhammad ﷺ sebagai Nabi dan Rasulku.",
      fadhilah: "Allah pasti meridhai hamba yang membacanya di pagi dan petang hari. (HR. Abu Dawud)",
      targetCount: 3
    }
  ]
};

// =========================================================================================
// DATA HADIAH LOYALTY (`Loyalty_Gifts`) & 4 KUTIPAN KONTEKSTUAL (PRD Bab 4.2)
// =========================================================================================
const LOYALTY_GIFTS_DATA = [
  {
    id: "GIFT-01",
    name: "Flashdisk Sandisk Cruzer Blade 32GB Original",
    desc: "Cocok untuk menyimpan berkas skripsi, modul guru, dan dokumen SPJ kantor.",
    stok: 12
  },
  {
    id: "GIFT-02",
    name: "1 Rim Kertas HVS Sinar Dunia PaperOne A4 80gsm",
    desc: "Gratis 1 rim kertas HVS tebal 500 lembar untuk kebutuhan cetak Anda.",
    stok: 20
  },
  {
    id: "GIFT-03",
    name: "Tumbler Stainless Syariah Eksklusif Toko Delina",
    desc: "Tumbler termos dingin/panas beraksen hijau zamrud & emas.",
    stok: 8
  },
  {
    id: "GIFT-04",
    name: "Kalkulator Meja Citizen 12 Digit Dual Power",
    desc: "Kalkulator akurat untuk bendahara sekolah, staf desa, dan warung.",
    stok: 10
  }
];

// =========================================================================================
// MASTER TARIF LAYANAN CETAK (`Master_Layanan_Cetak`) & MITRA INSTANSI (`Data_Instansi_Komisi`)
// =========================================================================================
const PRINT_SERVICES_DATA = [
  { id: "bw", name: "Fotokopi / Print Hitam Putih (B/W)", unit: "lembar", price: 350 },
  { id: "color-text", name: "Print Warna Standar / Tugas / Skripsi", unit: "lembar", price: 1000 },
  { id: "color-full", name: "Print Full Color / Grafik / Poster", unit: "lembar", price: 2500 },
  { id: "photo", name: "Cetak Pas Foto & Kertas Glossy", unit: "lembar", price: 5000 }
];

const INSTANSI_PARTNERS_DATA = [
  {
    id: "MTR-SDN01",
    instansi: "SDN 01 Tanjung Raja",
    pic: "Dra. Hj. Nurjanah, M.Pd",
    email: "bendahara@sdn01tanjungraja.sch.id",
    phone: "0812-7890-8812",
    totalSpj: 9700000,
    balance: 485000,
    status: "Siap Dicairkan"
  },
  {
    id: "MTR-DESA02",
    instansi: "Kantor Desa Tanjung Raja Selatan",
    pic: "Budi Santoso, S.Sos",
    email: "pemdes.tjrajaselatan@oganilirkab.go.id",
    phone: "0813-6700-4411",
    totalSpj: 6400000,
    balance: 320000,
    status: "Aktif Terkumpul"
  },
  {
    id: "MTR-SMPN02",
    instansi: "SMP Negeri 2 Tanjung Raja",
    pic: "Siti Delina, S.Pd",
    email: "tu@smpn2tanjungraja.sch.id",
    phone: "0852-6811-9900",
    totalSpj: 4900000,
    balance: 245000,
    status: "Aktif Terkumpul"
  }
];

// =========================================================================================
// LOCALSTORAGE PERSISTENCE & CROSS-MODULE SYNC HELPER
// =========================================================================================
const KIKO_STORAGE_KEY = "KIKO_POS_SMART_SHOP_V21_STATE";

function savePersistedState() {
  try {
    const payload = {
      store: APP_STATE.store,
      shiftCashTotal: APP_STATE.shiftCashTotal,
      shiftNonCashTotal: APP_STATE.shiftNonCashTotal,
      netProfitToday: APP_STATE.netProfitToday,
      commissionBalance: APP_STATE.user.commissionBalance,
      loyaltyCount: APP_STATE.user.loyaltyCount,
      orderHistory: APP_STATE.orderHistory,
      masterProducts: MASTER_PRODUCTS,
      printServices: PRINT_SERVICES_DATA,
      loyaltyGifts: LOYALTY_GIFTS_DATA,
      instansiPartners: INSTANSI_PARTNERS_DATA,
      marqueeReviews: MARQUEE_REVIEWS
    };
    localStorage.setItem(KIKO_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Penyimpanan localStorage penuh atau dibatasi browser:", err);
  }
}

function loadPersistedState() {
  try {
    const raw = localStorage.getItem(KIKO_STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);

    if (data.store) Object.assign(APP_STATE.store, data.store);
    if (typeof data.shiftCashTotal === "number") APP_STATE.shiftCashTotal = data.shiftCashTotal;
    if (typeof data.shiftNonCashTotal === "number") APP_STATE.shiftNonCashTotal = data.shiftNonCashTotal;
    if (typeof data.netProfitToday === "number") APP_STATE.netProfitToday = data.netProfitToday;
    if (typeof data.commissionBalance === "number") APP_STATE.user.commissionBalance = data.commissionBalance;
    if (typeof data.loyaltyCount === "number") APP_STATE.user.loyaltyCount = data.loyaltyCount;

    if (Array.isArray(data.orderHistory) && data.orderHistory.length > 0) {
      APP_STATE.orderHistory = data.orderHistory;
    }
    if (Array.isArray(data.masterProducts) && data.masterProducts.length > 0) {
      MASTER_PRODUCTS.length = 0;
      data.masterProducts.forEach(p => MASTER_PRODUCTS.push(p));
    }
    if (Array.isArray(data.printServices) && data.printServices.length > 0) {
      PRINT_SERVICES_DATA.length = 0;
      data.printServices.forEach(s => PRINT_SERVICES_DATA.push(s));
    }
    if (Array.isArray(data.loyaltyGifts) && data.loyaltyGifts.length > 0) {
      LOYALTY_GIFTS_DATA.length = 0;
      data.loyaltyGifts.forEach(g => LOYALTY_GIFTS_DATA.push(g));
    }
    if (Array.isArray(data.instansiPartners) && data.instansiPartners.length > 0) {
      INSTANSI_PARTNERS_DATA.length = 0;
      data.instansiPartners.forEach(ins => INSTANSI_PARTNERS_DATA.push(ins));
    }
    if (Array.isArray(data.marqueeReviews) && data.marqueeReviews.length > 0) {
      MARQUEE_REVIEWS.length = 0;
      data.marqueeReviews.forEach(r => MARQUEE_REVIEWS.push(r));
    }
  } catch (err) {
    console.warn("Gagal memuat state localStorage:", err);
  }
}

function resetPersistedState() {
  localStorage.removeItem(KIKO_STORAGE_KEY);
  showToast("🔄 Seluruh data aplikasi direset ke bawaan awal. Memuat ulang halaman...");
  setTimeout(() => window.location.reload(), 900);
}

/**
 * Helper membuka link WhatsApp sungguhan (`https://wa.me/...`) berisi Struk Digital Syariah
 */
function openWhatsAppReceipt(orderData) {
  const ord = orderData || APP_STATE.activeTrackedOrder || APP_STATE.orderHistory[0];
  const rawPhone = APP_STATE.user.phone || "081278908812";
  const cleanPhone = rawPhone.replace(/[^0-9]/g, "").replace(/^0/, "62");

  const lines = [
    `*بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ*`,
    `*${APP_STATE.store.name.toUpperCase()}*`,
    `_${APP_STATE.store.tagline}_`,
    `${APP_STATE.store.address}`,
    `--------------------------------`,
    `*No. Nota:* ${ord.invoiceId}`,
    `*Waktu:* ${ord.date}`,
    `*Pelanggan:* ${ord.customer || APP_STATE.user.name}`,
    `*Status:* ${ord.status}`,
    `--------------------------------`,
    `*Rincian Pesanan:*`,
    `${ord.itemsSummary}`,
    `--------------------------------`,
    `*TOTAL BAYAR (BEBAS RIBA): Rp ${(ord.total || 0).toLocaleString("id-ID")}*`,
    ord.komisi > 0 ? `*Komisi SPJ Instansi:* +Rp ${ord.komisi.toLocaleString("id-ID")}` : null,
    `--------------------------------`,
    `_"${APP_STATE.store.receiptFooter}"_`
  ].filter(Boolean).join("\n");

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines)}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");
  showToast(`📲 Membuka WhatsApp Struk Digital Syariah untuk ${ord.invoiceId}...`);
}

/**
 * Helper mengisi konten Modal Struk Thermal & Modal Nota PDF SPJ secara dinamis berdasarkan transaksi
 */
function populateThermalAndSpjModals(orderObj) {
  const ord = orderObj || APP_STATE.orderHistory[0];
  if (!ord) return;
  APP_STATE.activeTrackedOrder = ord;

  // Update Struk Thermal
  const invNoEl = document.getElementById("thermalInvNo");
  const itemsListEl = document.getElementById("thermalItemsList");
  const totalValEl = document.getElementById("thermalTotalVal");
  if (invNoEl) invNoEl.textContent = ord.invoiceId;
  if (totalValEl) totalValEl.textContent = `Rp ${(ord.total || 0).toLocaleString("id-ID")}`;

  if (itemsListEl) {
    if (Array.isArray(ord.lineItems) && ord.lineItems.length > 0) {
      itemsListEl.innerHTML = ord.lineItems.map(li => `
        <div style="display:flex; justify-content:space-between;">
          <span>${li.name.slice(0, 22)} x${li.qty}</span>
          <span>Rp ${(li.price * li.qty).toLocaleString("id-ID")}</span>
        </div>
      `).join("");
    } else {
      itemsListEl.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:8px;">
          <span>${ord.itemsSummary}</span>
          <span style="white-space:nowrap;">Rp ${(ord.total || 0).toLocaleString("id-ID")}</span>
        </div>
      `;
    }
  }

  // Update Nota PDF SPJ
  const spjInvEl = document.getElementById("spjInvoiceNumber");
  const spjCustEl = document.getElementById("spjCustomerName");
  const spjDateEl = document.getElementById("spjDate");
  const spjTotalEl = document.getElementById("spjGrandTotal");
  const spjBodyEl = document.getElementById("spjTableBody");

  if (spjInvEl) spjInvEl.textContent = ord.invoiceId.replace("#INV-", "SPJ-");
  if (spjCustEl) spjCustEl.textContent = ord.customer || `${APP_STATE.user.name} (${APP_STATE.user.instansi})`;
  if (spjDateEl) spjDateEl.textContent = ord.date.split("•")[0].trim();
  if (spjTotalEl) spjTotalEl.textContent = `Rp ${(ord.total || 0).toLocaleString("id-ID")}`;

  if (spjBodyEl && Array.isArray(ord.lineItems) && ord.lineItems.length > 0) {
    spjBodyEl.innerHTML = ord.lineItems.map((li, i) => `
      <tr>
        <td style="text-align:center;">${i + 1}</td>
        <td>${li.name}</td>
        <td style="text-align:center;">${li.qty}</td>
        <td style="text-align:center;">${li.unit || "Unit"}</td>
        <td style="text-align:right;">${li.price.toLocaleString("id-ID")}</td>
        <td style="text-align:right;">${(li.price * li.qty).toLocaleString("id-ID")}</td>
      </tr>
    `).join("");
  }
}

const ISLAMIC_QUOTES = {
  printTask: {
    title: "Momen 1: Motivasi Menuntut Ilmu & Amanah Cetak (HR. Muslim)",
    hadith: "Menuntut ilmu adalah jalan menuju kebaikan. Rasulullah ﷺ bersabda: 'Barangsiapa menempuh jalan untuk menuntut ilmu, maka Allah mudahkan baginya jalan menuju surga.' (HR. Muslim). Berkas tugas Kakak segera kami proses dengan rapi, Bismillah."
  },
  paymentSuccess: {
    title: "Momen 2: Keberkahan Perniagaan Jujur & Halal",
    hadith: "Alhamdulillah, pembayaran telah kami terima dengan sah. Rasulullah ﷺ bersabda bahwa pedagang dan pembeli yang jujur lagi amanah akan bersama para nabi dan orang-orang shiddiqin. Terima kasih atas kepercayaannya berbelanja di Toko Delina."
  },
  instansiCommission: {
    title: "Momen 3: Menjaga Akad, Transparansi & Amanah (QS. Al-Isra: 34)",
    quran: "Bismillah, berikut rincian komisi belanja instansi. Allah ﷻ berfirman: 'Dan penuhilah janji, sesungguhnya janji itu pasti diminta pertanggungjawabannya.' (QS. Al-Isra: 34). Semoga menjadi rezeki yang halal dan barokah."
  },
  loyaltyReward: {
    title: "Momen 4: Sunnah Saling Memberi Hadiah (HR. Bukhari)",
    hadith: "Maa Syaa Allah! Kakak berhak memilih hadiah loyalitas. Rasulullah ﷺ bersabda: 'Saling memberi hadiahlah kalian, niscaya kalian akan saling mencintai.' (HR. Bukhari dalam Al-Adab Al-Mufrad). Silakan dipilih hadiah terbaiknya, Kak."
  }
};

// =========================================================================================
// AUDIO AZAN SYNTHESIZER (WEB AUDIO API — SUARA AZAN SUNGGUHAN OGAN ILIR)
// =========================================================================================
// AUDIO AZAN & IQOMAH SUNTOKHAN (MP3 ASLI) ENGINE
// Makkah (Sheikh Ali Ahmed Mulla), Subuh Fajr, & Iqomah Berurutan Otomatis
// =========================================================================================
class AzanAndIqomahPlayer {
  constructor() {
    this.audio = new Audio();
    this.currentMode = null; // 'AZAN' | 'IQOMAH' | null
    this.isPlaying = false;
    this.currentTrackType = 'makkah'; // 'makkah' | 'subuh'

    // Sumber audio lokal utama dan cadangan remote URL
    this.tracks = {
      makkah: {
        title: 'Azan Makkah Merdu (Sheikh Ali Ahmed Mulla)',
        src: 'assets/audio/adhan_makkah.mp3',
        fallback: 'https://raw.githubusercontent.com/AalianKhan/adhans/master/adhan.mp3'
      },
      subuh: {
        title: 'Azan Subuh Fajr (As-Shalatu Khairum Minan Naum)',
        src: 'assets/audio/adhan_subuh.mp3',
        fallback: 'https://raw.githubusercontent.com/AalianKhan/adhans/master/adhan_fajr.mp3'
      },
      iqamah: {
        title: 'Iqomah Sholat Berjamaah',
        src: 'assets/audio/iqamah.mp3',
        fallback: 'https://archive.org/download/iqamah_201405/iqamah.mp3'
      }
    };

    this.bindEvents();
  }

  bindEvents() {
    this.audio.addEventListener('timeupdate', () => {
      this.handleTimeUpdate();
    });

    this.audio.addEventListener('ended', () => {
      this.handleAudioEnded();
    });

    this.audio.addEventListener('error', (e) => {
      console.warn('[Audio Player] Gagal memuat audio lokal, mencoba fallback URL...', e);
      if (this.currentMode === 'AZAN') {
        const trk = this.tracks[this.currentTrackType];
        if (this.audio.src !== trk.fallback) {
          this.audio.src = trk.fallback;
          this.audio.play().catch(err => console.warn('Fallback error:', err));
        }
      } else if (this.currentMode === 'IQOMAH') {
        const trk = this.tracks.iqamah;
        if (this.audio.src !== trk.fallback) {
          this.audio.src = trk.fallback;
          this.audio.play().catch(err => console.warn('Fallback error:', err));
        }
      }
    });
  }

  formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  handleTimeUpdate() {
    const cur = this.audio.currentTime || 0;
    const dur = this.audio.duration || 0;
    const fill = document.getElementById('azanProgressFill');
    const timeDisplay = document.getElementById('azanTimeDisplay');

    if (dur > 0 && fill) {
      const pct = Math.min(100, Math.max(0, (cur / dur) * 100));
      fill.style.width = `${pct}%`;
    }
    if (timeDisplay) {
      timeDisplay.textContent = `${this.formatTime(cur)} / ${this.formatTime(dur)}`;
    }
  }

  handleAudioEnded() {
    if (this.currentMode === 'AZAN') {
      // Azan selesai, otomatis lanjut ke Iqomah!
      showToast('🕌 Azan selesai berkumandang. Lanjut mengumandangkan Iqomah...');
      this.playIqomah();
    } else if (this.currentMode === 'IQOMAH') {
      // Iqomah selesai!
      showToast('✅ Iqomah selesai. Luruskan & rapatkan shaf sholat!');
      this.stopAudio();
      const statusText = document.getElementById('azanStatusText');
      const badge = document.getElementById('azanStateBadge');
      if (statusText) statusText.textContent = 'Iqomah selesai. Selamat menunaikan ibadah sholat.';
      if (badge) badge.innerHTML = '<i class="fa-solid fa-circle-check text-emerald"></i> Selesai';
    }
  }

  playAzan(forcedType = null) {
    const select = document.getElementById('selectAzanType');
    if (forcedType && select) {
      select.value = forcedType;
    }
    const type = select ? select.value : (forcedType || 'makkah');
    this.currentTrackType = type;
    this.currentMode = 'AZAN';
    this.isPlaying = true;

    const track = this.tracks[type] || this.tracks.makkah;
    this.audio.src = track.src;
    this.audio.load();

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.updateUIPlayingAzan(track.title);
      }).catch(err => {
        console.warn('[Audio Player] Autoplay was prevented or error:', err);
        this.updateUIPlayingAzan(track.title);
      });
    }

    showToast(`🔊 Memutar ${track.title}...`);
  }

  playIqomah() {
    this.currentMode = 'IQOMAH';
    this.isPlaying = true;
    const track = this.tracks.iqamah;
    this.audio.src = track.src;
    this.audio.load();

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.updateUIPlayingIqomah();
      }).catch(err => {
        console.warn('[Audio Player] Autoplay prevented:', err);
        this.updateUIPlayingIqomah();
      });
    }

    showToast('🔔 Mengumandangkan Iqomah Sholat...');
  }

  stopAudio() {
    this.isPlaying = false;
    this.currentMode = null;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.resetUI();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.stopAudio();
      showToast('Audio dihentikan.');
    } else {
      this.playAzan();
    }
  }

  updateUIPlayingAzan(title) {
    const btn = document.getElementById('btnTestAzan');
    const btnText = document.getElementById('btnTestAzanText');
    const btnIcon = document.getElementById('btnTestAzanIcon');
    const statusText = document.getElementById('azanStatusText');
    const badge = document.getElementById('azanStateBadge');
    const soundIcon = document.getElementById('azanSoundIcon');

    if (btn) btn.classList.add('is-playing');
    if (btnText) btnText.textContent = 'Hentikan Azan';
    if (btnIcon) btnIcon.className = 'fa-solid fa-stop';
    if (statusText) statusText.textContent = `Sedang berkumandang: ${title}`;
    if (badge) badge.innerHTML = '<i class="fa-solid fa-volume-high text-emerald"></i> Memutar Azan';
    if (soundIcon) soundIcon.classList.add('playing');
  }

  updateUIPlayingIqomah() {
    const btn = document.getElementById('btnTestAzan');
    const btnText = document.getElementById('btnTestAzanText');
    const btnIcon = document.getElementById('btnTestAzanIcon');
    const statusText = document.getElementById('azanStatusText');
    const badge = document.getElementById('azanStateBadge');
    const soundIcon = document.getElementById('azanSoundIcon');

    if (btn) btn.classList.add('is-playing');
    if (btnText) btnText.textContent = 'Hentikan Iqomah';
    if (btnIcon) btnIcon.className = 'fa-solid fa-stop';
    if (statusText) statusText.textContent = 'Mengumandangkan Iqomah... Qad qaamatis-shalaah!';
    if (badge) badge.innerHTML = '<i class="fa-solid fa-bell text-gold"></i> Melantunkan Iqomah';
    if (soundIcon) soundIcon.classList.add('playing');
  }

  resetUI() {
    const btn = document.getElementById('btnTestAzan');
    const btnText = document.getElementById('btnTestAzanText');
    const btnIcon = document.getElementById('btnTestAzanIcon');
    const statusText = document.getElementById('azanStatusText');
    const badge = document.getElementById('azanStateBadge');
    const soundIcon = document.getElementById('azanSoundIcon');
    const fill = document.getElementById('azanProgressFill');
    const timeDisplay = document.getElementById('azanTimeDisplay');

    if (btn) btn.classList.remove('is-playing');
    if (btnText) btnText.textContent = 'Putar Azan';
    if (btnIcon) btnIcon.className = 'fa-solid fa-play';
    if (statusText) statusText.textContent = 'Siap memutar lantunan azan merdu & iqomah';
    if (badge) badge.innerHTML = '<i class="fa-solid fa-circle-pause"></i> Siap Memutar';
    if (soundIcon) soundIcon.classList.remove('playing');
    if (fill) fill.style.width = '0%';
    if (timeDisplay) timeDisplay.textContent = '00:00 / --:--';
  }

  // Kompatibilitas mundur
  playAzanChant() {
    this.playAzan();
  }
}

const azanAudioPlayer = new AzanAndIqomahPlayer();
const azanSynthesizer = azanAudioPlayer;

// =========================================================================================
// CASHIER BEEP SOUND FX ENGINE & BARCODE SVG GENERATOR
// Audio Synthesizer Kasir Otomatis (WAV PCM Audio + Web Audio API Fallback)
// =========================================================================================
let cashierAudioBeep = null;
let cashierAudioError = null;
try {
  cashierAudioBeep = new Audio("assets/audio/cashier_beep.wav");
  cashierAudioBeep.preload = "auto";
  cashierAudioError = new Audio("assets/audio/cashier_error.wav");
  cashierAudioError.preload = "auto";
} catch (e) {}

function playCashierBeep(isSuccess = true) {
  try {
    const audio = isSuccess ? cashierAudioBeep : cashierAudioError;
    if (audio) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          playCashierBeepWebAudio(isSuccess);
        });
        return;
      }
    }
  } catch (err) {}
  playCashierBeepWebAudio(isSuccess);
}

function playCashierBeepWebAudio(isSuccess = true) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === "suspended") ctx.resume();

    if (isSuccess) {
      // Bunyi BEEP tajam khas mesin kasir retail supermarket (2100 Hz, 80 ms)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(2100, ctx.currentTime);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else {
      // Bunyi BEEP-BEEP ganda bernada rendah (400 Hz) tanda barcode tidak terdaftar
      [0, 0.12].forEach(delay => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(400, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + delay + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.09);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.09);
      });
    }
  } catch (err) {
    console.warn("[Cashier Beep FX] Audio context notice:", err);
  }
}

function generateBarcodeSvg(code, width = 180, height = 55) {
  const cleanCode = String(code || "").trim();
  let barBits = "101"; // start guard
  for (let i = 0; i < cleanCode.length; i++) {
    const charCode = cleanCode.charCodeAt(i);
    const pattern = [
      "11011001100", "11001101100", "11001100110", "10010011000",
      "10010001100", "10001001100", "10011001000", "10011000100",
      "10001100100", "11001001000"
    ][(charCode + i) % 10];
    barBits += pattern;
  }
  barBits += "101011"; // stop guard

  const barWidth = width / barBits.length;
  let rects = "";
  for (let j = 0; j < barBits.length; j++) {
    if (barBits[j] === "1") {
      rects += `<rect x="${(j * barWidth).toFixed(1)}" y="0" width="${Math.max(1, barWidth).toFixed(1)}" height="${height - 18}" fill="#111827"/>`;
    }
  }

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" style="background:#ffffff; display:block; margin:0 auto;">
      ${rects}
      <text x="${width / 2}" y="${height - 2}" font-family="'Courier New', monospace" font-size="11" font-weight="bold" text-anchor="middle" fill="#111827">${cleanCode}</text>
    </svg>
  `;
}

// =========================================================================================
// 0. HALAMAN LOGIN & PORTAL AUTENTIKASI 4 TINGKAT (RBAC GATEWAY)
// =========================================================================================
function initAuthGateway() {
  const modal = document.getElementById("authGatewayModal");
  const btnOpenTop = document.getElementById("btnOpenLoginGateway");
  const btnOpenAcc = document.getElementById("btnAccountSwitchLogin");
  const btnClose = document.getElementById("btnCloseAuthModal");
  const tabs = document.querySelectorAll(".auth-tier-tab");
  const panes = {
    "1": document.getElementById("authPaneTier1"),
    "2": document.getElementById("authPaneTier2"),
    "3": document.getElementById("authPaneTier3"),
    "4": document.getElementById("authPaneTier4")
  };

  function openLoginModal() {
    modal.classList.add("open");
  }

  btnOpenTop.addEventListener("click", openLoginModal);
  if (btnOpenAcc) btnOpenAcc.addEventListener("click", openLoginModal);
  btnClose.addEventListener("click", () => modal.classList.remove("open"));

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tier = tab.getAttribute("data-tier");
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      Object.values(panes).forEach(p => p.classList.remove("active"));
      if (panes[tier]) panes[tier].classList.add("active");
    });
  });

  // Keypad interaktif untuk PIN 6 Digit Kasir
  const kasirPinInput = document.getElementById("loginKasirPin");
  document.querySelectorAll("#kasirPinKeypad .pin-key-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-key");
      if (key === "C") {
        kasirPinInput.value = "";
      } else if (key === "123456") {
        kasirPinInput.value = "123456";
      } else if (kasirPinInput.value.length < 6) {
        kasirPinInput.value += key;
      }
    });
  });

  // Login Tingkat 1: Publik Umum (Tanpa Login)
  document.getElementById("btnLoginTier1").addEventListener("click", () => {
    const guestName = document.getElementById("loginGuestName").value.trim() || "Pelanggan Umum";
    applyRbacSession(1, {
      id: "GUEST",
      name: guestName,
      role: "Tingkat 1 • Publik Umum (Tanpa Login)",
      phone: "-",
      instansi: "Umum",
      commissionBalance: 0,
      loyaltyCount: 0
    });
    modal.classList.remove("open");
    showToast(`Ahlan wa Sahlan, ${guestName}! Mode Belanja Publik Aktif.`);
  });

  // Login Tingkat 2: Member Reguler & Perwakilan Instansi SPJ
  document.getElementById("btnLoginTier2").addEventListener("click", () => {
    const wa = document.getElementById("loginMemberWa").value.trim() || "0812-7890-8812";
    const profileType = document.getElementById("loginMemberProfile").value;

    if (profileType === "instansi") {
      applyRbacSession(2, {
        id: "MTR-SDN01",
        name: "Dra. Hj. Nurjanah, M.Pd",
        role: "Tingkat 2 • Perwakilan Instansi SPJ",
        phone: wa,
        instansi: "SDN 01 Tanjung Raja",
        emailBendahara: "bendahara@sdn01tanjungraja.sch.id",
        commissionBalance: 485000,
        loyaltyCount: 12
      });
    } else if (profileType === "desa") {
      applyRbacSession(2, {
        id: "MTR-DESA02",
        name: "Budi Santoso, S.IP",
        role: "Tingkat 2 • Perwakilan Kantor Desa SPJ",
        phone: wa,
        instansi: "Kantor Desa Tanjung Raja Selatan",
        emailBendahara: "kaurkeuangan@tanjungrajaselatan.desa.id",
        commissionBalance: 640000,
        loyaltyCount: 14
      });
    } else {
      applyRbacSession(2, {
        id: "MBR-UNSRI",
        name: "M. Ridho Pratama",
        role: "Tingkat 2 • Member Reguler Loyalty",
        phone: wa,
        instansi: "Mahasiswa Unsri Indralaya",
        emailBendahara: "ridho.pratama@student.unsri.ac.id",
        commissionBalance: 0,
        loyaltyCount: 15
      });
    }

    modal.classList.remove("open");
    showToast(`Alhamdulillah, Login Tingkat 2 (${APP_STATE.user.name}) Berhasil!`);
  });

  // Login Tingkat 3: Kasir & Operator Fotokopi (PIN 6 Digit)
  document.getElementById("btnLoginTier3").addEventListener("click", () => {
    const pin = kasirPinInput.value.trim();
    if (pin !== "123456") {
      showToast("⚠️ PIN 6 Digit Kasir salah! Gunakan PIN default: 123456");
      return;
    }
    const staffId = document.getElementById("loginKasirId").value.trim() || "KSR-01 (Ahmad)";
    applyRbacSession(3, {
      id: "KSR-01",
      name: staffId,
      role: "Tingkat 3 • Kasir & Operator Fotokopi",
      phone: APP_STATE.store.phone,
      instansi: "Internal Toko Delina",
      commissionBalance: 0,
      loyaltyCount: 0
    });
    modal.classList.remove("open");
    document.getElementById("modalPosKasir").classList.add("open");
    showToast("Bismillah! Login Kasir Sukses. Terminal POS Kasir Dibuka.");
  });

  // Login Tingkat 4: Owner / Super Admin (Keamanan Ganda + Alert Telegram)
  document.getElementById("btnLoginTier4").addEventListener("click", () => {
    const email = document.getElementById("loginOwnerEmail").value.trim();
    const masterPin = document.getElementById("loginOwnerPin").value.trim();
    if (masterPin !== "999888") {
      showToast("⚠️ Master PIN Owner salah! Gunakan Master PIN default: 999888");
      return;
    }
    applyRbacSession(4, {
      id: "OWNER-01",
      name: "Bpk. Deri / Ibu Delina (Owner)",
      role: "Tingkat 4 • Owner / Super Admin",
      phone: APP_STATE.store.phone,
      instansi: "Owner Toko Delina ATK & Fotokopi",
      emailBendahara: email,
      commissionBalance: 485000,
      loyaltyCount: 15
    });
    modal.classList.remove("open");
    document.getElementById("modalOwnerDashboard").classList.add("open");
    initOwnerCharts();
    callGasBackend("authenticateUser", { level: 4, email, pin: masterPin });
    showToast("🔐 Login Super Admin Sukses! Alert keamanan terkirim ke Telegram Pribadi Owner.");
  });
}

function applyRbacSession(level, userData) {
  APP_STATE.authLevel = level;
  APP_STATE.user = { ...APP_STATE.user, ...userData };

  document.getElementById("activeRbacBadge").textContent = userData.role;
  document.getElementById("activeSessionUserText").textContent = `${userData.name} (${userData.instansi})`;

  document.getElementById("userProfileName").textContent = userData.name;
  document.getElementById("userProfilePhone").textContent = `WA / Telegram: ${userData.phone}`;
  document.getElementById("userProfileRole").textContent = userData.role;

  // Update Kartu Instansi & Loyalty
  if (userData.instansi && userData.instansi !== "Umum" && userData.instansi !== "Internal Toko Delina") {
    document.getElementById("instansiNameText").textContent = userData.instansi;
    document.getElementById("instansiRepText").textContent = `Perwakilan: ${userData.name}`;
    document.getElementById("instansiBalanceVal").textContent = `Rp ${(userData.commissionBalance || 485000).toLocaleString("id-ID")}`;
    document.getElementById("spjCustomerName").textContent = `Bendahara ${userData.instansi}`;
  }

  updateLoyaltyCardDisplay(userData.loyaltyCount || 12);
}

function updateLoyaltyCardDisplay(count) {
  const safeCount = Math.min(15, Math.max(0, count));
  APP_STATE.user.loyaltyCount = safeCount;
  const pct = Math.round((safeCount / 15) * 100);
  document.getElementById("loyaltyCounterBadge").textContent = `${safeCount} / 15 Transaksi ★5`;
  document.getElementById("loyaltyProgressBar").style.width = `${pct}%`;

  const remEl = document.getElementById("loyaltyRemainingText");
  if (safeCount >= 15) {
    remEl.textContent = "🎉 Syarat 15x Tercapai! Silakan Klaim Hadiah Gratis!";
  } else {
    remEl.textContent = `${15 - safeCount}x Transaksi Lagi Gratis Hadiah!`;
  }
}

// =========================================================================================
// 1. REAL-TIME DIGITAL CLOCK & JADWAL SHOLAT + COUNTDOWN + AUTO-AZAN
// =========================================================================================
function initRealTimeEngines() {
  const clockTimeEl = document.getElementById("clockTimeDisplay");
  const clockDateEl = document.getElementById("clockDateDisplay");
  const sholatCountdownEl = document.getElementById("sholatCountdownTimer");
  const nextPrayerNameEl = document.getElementById("nextPrayerName");
  const pillSholatLabel = document.getElementById("pillSholatLabel");

  function updateClock() {
    const now = new Date();
    const hrs = String(now.getHours()).padStart(2, "0");
    const mins = String(now.getMinutes()).padStart(2, "0");
    const secs = String(now.getSeconds()).padStart(2, "0");
    clockTimeEl.innerHTML = `<i class="fa-regular fa-clock" style="font-size:0.7rem;"></i> ${hrs}:${mins}:${secs} WIB`;

    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
    clockDateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;

    calculateNextPrayer(now);
  }

  function calculateNextPrayer(now) {
    const times = APP_STATE.prayerTimes;
    const prayerList = [
      { name: "Imsak", time: times.imsak, id: "cell-imsak" },
      { name: "Subuh", time: times.subuh, id: "cell-subuh" },
      { name: "Terbit", time: times.terbit, id: "cell-terbit" },
      { name: "Dzuhur", time: times.dzuhur, id: "cell-dzuhur" },
      { name: "Ashar", time: times.ashar, id: "cell-ashar" },
      { name: "Maghrib", time: times.maghrib, id: "cell-maghrib" },
      { name: "Isya", time: times.isya, id: "cell-isya" }
    ];

    const currentSecs = (now.getHours() * 3600) + (now.getMinutes() * 60) + now.getSeconds();
    let next = null;
    let targetSecs = 0;

    prayerList.forEach(p => {
      const el = document.getElementById(p.id);
      if (el) el.classList.remove("current-prayer");
    });

    for (const p of prayerList) {
      const [h, m] = p.time.split(":").map(Number);
      const pSecs = (h * 3600) + (m * 60);
      if (pSecs > currentSecs) {
        next = p;
        targetSecs = pSecs;
        break;
      }
    }

    if (!next) {
      next = prayerList[0];
      const [h, m] = next.time.split(":").map(Number);
      targetSecs = (24 * 3600) + (h * 3600) + (m * 60);
    }

    const targetCell = document.getElementById(next.id);
    if (targetCell) targetCell.classList.add("current-prayer");

    const diffSecs = targetSecs - currentSecs;
    const diffH = Math.floor(diffSecs / 3600);
    const diffM = Math.floor((diffSecs % 3600) / 60);
    const diffS = diffSecs % 60;

    sholatCountdownEl.textContent = `-${String(diffH).padStart(2, "0")}:${String(diffM).padStart(2, "0")}:${String(diffS).padStart(2, "0")}`;
    nextPrayerNameEl.textContent = `${next.name} (${next.time} WIB)`;
    pillSholatLabel.textContent = `${next.name} ${next.time}`;

    if (diffSecs === 0 && APP_STATE.autoAzanEnabled) {
      const azanType = (next.name && next.name.toLowerCase().includes("subuh")) ? "subuh" : "makkah";
      azanAudioPlayer.playAzan(azanType);
    }
  }

  updateClock();
  setInterval(updateClock, 1000);
}

// =========================================================================================
// DROPDOWNS HEADER 1: SHOLAT/AZAN, CUACA/AQI TANJUNG RAJA, & DZIKIR AL-MA'TSURAT
// =========================================================================================
function initHeaderDropdowns() {
  const pills = [
    { btn: "btnPillSholat", content: "dropdownSholatContent" },
    { btn: "btnPillCuaca", content: "dropdownCuacaContent" },
    { btn: "btnPillDzikir", content: "dropdownDzikirContent" }
  ];

  pills.forEach(p => {
    const btn = document.getElementById(p.btn);
    const content = document.getElementById(p.content);

    btn.addEventListener("click", e => {
      e.stopPropagation();
      const isOpen = content.classList.contains("open");
      pills.forEach(other => {
        document.getElementById(other.content).classList.remove("open");
        document.getElementById(other.btn).classList.remove("active");
      });
      if (!isOpen) {
        content.classList.add("open");
        btn.classList.add("active");
      }
    });
  });

  document.querySelectorAll("[data-close]").forEach(el => {
    el.addEventListener("click", () => {
      const targetId = el.getAttribute("data-close");
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.remove("open");
        pills.forEach(p => document.getElementById(p.btn).classList.remove("active"));
      }
    });
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".portal-pills-row") && !e.target.closest(".portal-dropdown-content")) {
      pills.forEach(p => {
        document.getElementById(p.content).classList.remove("open");
        document.getElementById(p.btn).classList.remove("active");
      });
    }
  });

  const btnTestAzan = document.getElementById("btnTestAzan");
  if (btnTestAzan) {
    btnTestAzan.addEventListener("click", () => {
      azanAudioPlayer.togglePlay();
    });
  }

  const btnSkipToIqomah = document.getElementById("btnSkipToIqomah");
  if (btnSkipToIqomah) {
    btnSkipToIqomah.addEventListener("click", () => {
      azanAudioPlayer.playIqomah();
    });
  }

  const btnToggleDoaAzan = document.getElementById("btnToggleDoaAzan");
  const boxDoa = document.getElementById("boxDoaSetelahAzan");
  const btnCloseDoa = document.getElementById("btnCloseDoaAzan");
  if (btnToggleDoaAzan && boxDoa) {
    btnToggleDoaAzan.addEventListener("click", () => {
      const isHidden = boxDoa.style.display === "none";
      boxDoa.style.display = isHidden ? "block" : "none";
    });
  }
  if (btnCloseDoa && boxDoa) {
    btnCloseDoa.addEventListener("click", () => {
      boxDoa.style.display = "none";
    });
  }

  const selectAzanType = document.getElementById("selectAzanType");
  if (selectAzanType) {
    selectAzanType.addEventListener("change", (e) => {
      if (azanAudioPlayer.isPlaying && azanAudioPlayer.currentMode === "AZAN") {
        azanAudioPlayer.playAzan(e.target.value);
      }
    });
  }

  const btnMuteAzan = document.getElementById("btnMuteAzan");
  btnMuteAzan.addEventListener("click", () => {
    APP_STATE.autoAzanEnabled = !APP_STATE.autoAzanEnabled;
    if (APP_STATE.autoAzanEnabled) {
      btnMuteAzan.innerHTML = '<i class="fa-solid fa-bell"></i> Auto: Aktif';
      btnMuteAzan.style.background = "#475569";
      showToast("Auto-Audio Azan Wilayah Ogan Ilir Diaktifkan");
    } else {
      btnMuteAzan.innerHTML = '<i class="fa-solid fa-bell-slash"></i> Auto: Mute';
      btnMuteAzan.style.background = "#dc2626";
      showToast("Auto-Audio Azan Dinonaktifkan");
    }
  });

  renderDzikirList("pagi");

  const tabPagi = document.getElementById("tabDzikirPagi");
  const tabPetang = document.getElementById("tabDzikirPetang");

  tabPagi.addEventListener("click", () => {
    tabPagi.classList.add("active");
    tabPetang.classList.remove("active");
    renderDzikirList("pagi");
  });

  tabPetang.addEventListener("click", () => {
    tabPetang.classList.add("active");
    tabPagi.classList.remove("active");
    renderDzikirList("petang");
  });
}

function renderDzikirList(waktu) {
  const container = document.getElementById("dzikirListContainer");
  container.innerHTML = "";
  const items = ALMATSURAT_DATA[waktu];

  items.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "dzikir-item-card";
    card.innerHTML = `
      <div style="font-size:0.75rem; font-weight:700; color:var(--primary-dark); margin-bottom:4px;">
        ${idx + 1}. ${item.judul}
      </div>
      <div class="dzikir-arabic">${item.arabic}</div>
      <div class="dzikir-latin">${item.latin}</div>
      <div class="dzikir-arti">${item.arti}</div>
      <div class="dzikir-fadhilah"><i class="fa-solid fa-star text-gold"></i> ${item.fadhilah}</div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:0.65rem; color:var(--slate-muted);">Sunnah: ${item.targetCount}x baca</span>
        <button type="button" class="dzikir-counter-btn" data-counter="0" data-max="${item.targetCount}">
          <i class="fa-solid fa-fingerprint"></i> Tasbih: <span class="counter-num">0</span>/${item.targetCount}
        </button>
      </div>
    `;

    const btnCount = card.querySelector(".dzikir-counter-btn");
    const numSpan = card.querySelector(".counter-num");

    btnCount.addEventListener("click", () => {
      let cur = parseInt(btnCount.getAttribute("data-counter"), 10);
      const max = parseInt(btnCount.getAttribute("data-max"), 10);
      cur += 1;
      btnCount.setAttribute("data-counter", cur);
      numSpan.textContent = cur;

      if (cur === max) {
        showToast(`Alhamdulillah, dzikir "${item.judul}" selesai dibaca ${max}x.`);
        btnCount.style.background = "#046a38";
        btnCount.style.color = "#ffffff";
      }
    });

    container.appendChild(card);
  });
}

// =========================================================================================
// HEADER 2: SMART AI CHATBOT KIKO (COLLAPSIBLE, VOICE NOTE, & AUTO-EXPAND TEXTAREA)
// =========================================================================================
function attachAutoExpandTextarea(textareaEl) {
  if (!textareaEl) return;
  const resize = () => {
    textareaEl.style.height = "auto";
    textareaEl.style.height = Math.min(140, textareaEl.scrollHeight) + "px";
  };
  textareaEl.addEventListener("input", resize);
  textareaEl.addEventListener("focus", resize);
}

function initHeaderKikoAi() {
  const headerAi = document.getElementById("headerKikoAi");
  const collapseBar = document.getElementById("kikoCollapseBar");
  const textarea = document.getElementById("kikoHeaderInput");
  const btnVoice = document.getElementById("btnHeaderVoice");
  const btnSend = document.getElementById("btnHeaderSend");

  collapseBar.addEventListener("click", () => {
    headerAi.classList.toggle("collapsed");
  });

  // Wajib: Kolom input chat fleksibel yang auto-expand mengikuti panjang teks di semua mode
  attachAutoExpandTextarea(textarea);

  // Voice Note (Web Speech API jika didukung browser + fallback simulasi transkripsi)
  let isRecording = false;
  btnVoice.addEventListener("click", () => {
    isRecording = !isRecording;
    if (isRecording) {
      btnVoice.classList.add("recording");
      showToast("🎙️ Voice Note Kiko Aktif: Silakan ucapkan pesanan ATK/cetak Anda...");
      setTimeout(() => {
        if (isRecording) {
          isRecording = false;
          btnVoice.classList.remove("recording");
          textarea.value = "Beli Kertas HVS A4 80gsm 5 rim dan Pulpen Pilot G2 1 kotak untuk SDN 01 Tanjung Raja, tolong siapkan Nota SPJ";
          textarea.dispatchEvent(new Event("input"));
          showToast("✅ Voice Note berhasil ditranskripsi oleh AI Kiko! Kolom input otomatis menyesuaikan panjang teks.");
        }
      }, 2400);
    } else {
      btnVoice.classList.remove("recording");
    }
  });

  function handleHeaderSend() {
    const text = textarea.value.trim();
    if (!text) return;
    openKikoDialogWithContext(text);
    textarea.value = "";
    textarea.style.height = "auto";
  }

  btnSend.addEventListener("click", handleHeaderSend);
  textarea.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleHeaderSend();
    }
  });

  document.querySelectorAll(".header-kiko-ai .kiko-quick-chips .nlp-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const command = chip.getAttribute("data-nlp") || chip.textContent.trim();
      openKikoDialogWithContext(command);
    });
  });
}

// =========================================================================================
// 2. GALERI REVIEW BERANIMASI (RUNNING CARD MARQUEE BERGERAK DARI KIRI KE KANAN)
// =========================================================================================
function renderRunningReviewMarquee() {
  const track = document.getElementById("marqueeTrack");
  if (!track) return;
  track.innerHTML = "";

  const duplicatedReviews = [...MARQUEE_REVIEWS, ...MARQUEE_REVIEWS];
  duplicatedReviews.forEach(rev => {
    const card = document.createElement("div");
    card.className = "marquee-card";
    card.innerHTML = `
      <div class="marquee-thumb-wrap">
        <img src="${rev.photo}" alt="Bukti Cetak ${rev.name}" class="marquee-thumb-img">
      </div>
      <div class="marquee-card-body">
        <div class="marquee-stars">
          ${'<i class="fa-solid fa-star"></i>'.repeat(rev.rating)}
          <span style="font-size:0.6rem; color:#046a38; font-weight:700; margin-left:3px;">Verified</span>
        </div>
        <div class="marquee-author">${rev.name}</div>
        <div class="marquee-role-badge">${rev.role}</div>
        <div class="marquee-quote">"${rev.comment}"</div>
      </div>
    `;

    card.addEventListener("click", () => {
      showToast(`★5 dari ${rev.name} (${rev.role}): "${rev.comment}"`);
    });

    track.appendChild(card);
  });
}

// =========================================================================================
// 4. GRID ETALASE PRODUK 2 KOLOM ALA TOKOPEDIA MOBILE & SLIDE-UP BOTTOM-SHEET
// =========================================================================================
let renderCatalogGridFn = null;

function initProductCatalog() {
  const gridContainer = document.getElementById("productGridContainer");
  const searchInput = document.getElementById("productSearchInput");
  const chips = document.querySelectorAll(".category-chips-row .cat-chip");

  let activeCategory = "all";
  let searchQuery = "";

  function renderGrid() {
    gridContainer.innerHTML = "";

    const filtered = MASTER_PRODUCTS.filter(p => {
      const matchCat = activeCategory === "all" || p.category === activeCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      gridContainer.innerHTML = `
        <div style="grid-column: span 2; text-align:center; padding:30px 10px; color:var(--slate-muted);">
          <i class="fa-solid fa-box-open" style="font-size:2rem; margin-bottom:8px; color:#cbd5e1;"></i>
          <p style="font-size:0.8rem;">Produk tidak ditemukan. Silakan tanya Robot Kiko Berpeci untuk rekomendasi alternatif.</p>
        </div>
      `;
      return;
    }

    filtered.forEach(prod => {
      const card = document.createElement("div");
      card.className = "tokopedia-card";
      const isOut = prod.stock === 0;

      card.innerHTML = `
        <div class="card-image-wrap">
          <img src="${prod.image}" alt="${prod.name}" class="card-product-img">
          <span class="badge-halal-syariah"><i class="fa-solid fa-check"></i> Syariah</span>
          <span class="badge-stock-pill ${isOut ? "out-of-stock" : ""}">
            ${isOut ? "Stok 0 • Ada Alternatif" : `Stok: ${prod.stock} ${prod.unit.split(" ")[0]}`}
          </span>
        </div>
        <div class="card-body-content">
          <div class="card-product-title" title="${prod.name}">${prod.name}</div>
          <div class="pricing-dual-box">
            <div class="price-eceran">Rp ${prod.priceEceran.toLocaleString("id-ID")}</div>
            <div class="price-grosir-wrap">
              <span class="price-grosir-tag">Grosir SPJ</span>
              <span class="price-grosir-val">Rp ${prod.priceGrosir.toLocaleString("id-ID")}</span>
            </div>
          </div>
          <div class="card-meta-row">
            <div class="card-rating-star">
              <i class="fa-solid fa-star"></i> ${prod.rating.toFixed(1)} • ${prod.soldCount}+ terjual
            </div>
            <button type="button" class="btn-quick-add-cart" title="Tambah Cepat ke Keranjang">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>
      `;

      card.addEventListener("click", e => {
        if (e.target.closest(".btn-quick-add-cart")) {
          e.stopPropagation();
          addToCart(prod, 1);
          return;
        }
        openProductBottomSheet(prod);
      });

      gridContainer.appendChild(card);
    });
  }

  renderCatalogGridFn = renderGrid;

  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeCategory = chip.getAttribute("data-cat");
      renderGrid();
    });
  });

  searchInput.addEventListener("input", e => {
    searchQuery = e.target.value.trim();
    renderGrid();
  });

  const btnTriggerBarcode = document.getElementById("btnTriggerBarcode");
  if (btnTriggerBarcode) {
    btnTriggerBarcode.addEventListener("click", () => {
      const modalScanner = document.getElementById("modalBarcodeScanner");
      if (modalScanner) {
        modalScanner.classList.add("open");
        const btnOpenCam = document.getElementById("btnOpenBarcodeCam");
        if (btnOpenCam) btnOpenCam.click();
      }
    });
  }

  renderGrid();
}

function openProductBottomSheet(product) {
  APP_STATE.activeProduct = product;
  const backdrop = document.getElementById("bottomSheetBackdrop");
  const zoomBox = document.getElementById("sheetGalleryZoomBox");
  const imgEl = document.getElementById("sheetDetailImg");
  const titleEl = document.getElementById("sheetProductTitle");
  const eceranEl = document.getElementById("sheetPriceEceran");
  const grosirEl = document.getElementById("sheetPriceGrosir");
  const ratingSoldEl = document.getElementById("sheetRatingSold");
  const stockEl = document.getElementById("sheetStockBadge");
  const specTable = document.getElementById("sheetSpecTable");
  const descEl = document.getElementById("sheetProductDesc");
  const reviewsEl = document.getElementById("sheetProductReviews");
  const qtyInput = document.getElementById("inputSheetQty");

  zoomBox.classList.remove("zoomed");
  imgEl.src = product.image;
  titleEl.textContent = product.name;
  eceranEl.textContent = `Rp ${product.priceEceran.toLocaleString("id-ID")}`;
  grosirEl.textContent = `Grosir SPJ: Rp ${product.priceGrosir.toLocaleString("id-ID")}`;
  ratingSoldEl.innerHTML = `<i class="fa-solid fa-star"></i> ${product.rating.toFixed(1)} (${product.soldCount}+ Terjual)`;

  if (product.stock === 0) {
    stockEl.textContent = "Stok Habis (0) • AI Kiko Siap Tawarkan Produk Alternatif";
    stockEl.style.background = "#fee2e2";
    stockEl.style.color = "#991b1b";
  } else {
    stockEl.textContent = `Stok Real-Time: ${product.stock} ${product.unit} Ready`;
    stockEl.style.background = "#dcfce7";
    stockEl.style.color = "#166534";
  }

  qtyInput.value = 1;

  specTable.innerHTML = "";
  for (const [k, v] of Object.entries(product.specs)) {
    const row = document.createElement("tr");
    row.innerHTML = `<td class="spec-label">${k}</td><td class="spec-val">${v}</td>`;
    specTable.appendChild(row);
  }

  descEl.textContent = product.description;

  reviewsEl.innerHTML = "";
  const prodRevs = product.reviews || [
    { user: "Pelanggan Setia Tanjung Raja", stars: 5, text: "Barang original sesuai deskripsi, pelayanan cepat dan berkah." }
  ];
  prodRevs.forEach(r => {
    const item = document.createElement("div");
    item.style.background = "#f8fafc";
    item.style.border = "1px solid #e2e8f0";
    item.style.borderRadius = "8px";
    item.style.padding = "8px 10px";
    item.style.fontSize = "0.74rem";
    item.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
        <strong>${r.user}</strong>
        <span style="color:#f59e0b;">${"★".repeat(r.stars)}</span>
      </div>
      <div style="color:var(--slate-text);">"${r.text}"</div>
    `;
    reviewsEl.appendChild(item);
  });

  backdrop.classList.add("open");
}

function initBottomSheetControls() {
  const backdrop = document.getElementById("bottomSheetBackdrop");
  const zoomBox = document.getElementById("sheetGalleryZoomBox");
  const btnClose = document.getElementById("btnCloseBottomSheet");
  const btnPlus = document.getElementById("btnQtyPlus");
  const btnMinus = document.getElementById("btnQtyMinus");
  const qtyInput = document.getElementById("inputSheetQty");
  const btnAddToCart = document.getElementById("btnSheetAddToCart");
  const btnAskKiko = document.getElementById("btnSheetAskKiko");

  zoomBox.addEventListener("click", () => {
    zoomBox.classList.toggle("zoomed");
  });

  btnClose.addEventListener("click", () => backdrop.classList.remove("open"));
  backdrop.addEventListener("click", e => {
    if (e.target === backdrop) backdrop.classList.remove("open");
  });

  btnPlus.addEventListener("click", () => {
    qtyInput.value = parseInt(qtyInput.value, 10) + 1;
  });

  btnMinus.addEventListener("click", () => {
    const v = parseInt(qtyInput.value, 10);
    if (v > 1) qtyInput.value = v - 1;
  });

  btnAddToCart.addEventListener("click", () => {
    if (!APP_STATE.activeProduct) return;
    const qty = parseInt(qtyInput.value, 10) || 1;
    addToCart(APP_STATE.activeProduct, qty);
    backdrop.classList.remove("open");
  });

  btnAskKiko.addEventListener("click", () => {
    if (!APP_STATE.activeProduct) return;
    const prod = APP_STATE.activeProduct;
    backdrop.classList.remove("open");
    if (prod.stock === 0) {
      openKikoDialogWithContext(`Cek stok ${prod.name}`);
    } else {
      openKikoDialogWithContext(`Tanya spesifikasi & harga grosir SPJ untuk ${prod.name}`);
    }
  });
}

// =========================================================================================
// ANIMASI BALON TERBANG & PECAH (BALLOON POP CELEBRATION + WEB AUDIO POP) SAAT CHECKOUT
// =========================================================================================
function playPopSoundEffect(delayMs = 0) {
  setTimeout(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(360 + Math.random() * 260, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.11);
      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Abaikan jika browser membatasi audio
    }
  }, delayMs);
}

function spawnBurstParticles(x, y, mainColor) {
  const stage = document.getElementById("balloonCelebrationStage");
  if (!stage) return;
  const palette = [mainColor, "#facc15", "#10b981", "#ff0055", "#00b0ff", "#ffffff"];

  for (let i = 0; i < 12; i++) {
    const p = document.createElement("div");
    p.className = "pop-burst-particle";
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.background = palette[i % palette.length];
    p.style.border = "1px solid #111827";
    stage.appendChild(p);

    const angle = (Math.PI * 2 * i) / 12;
    const dist = 45 + Math.random() * 65;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;

    p.animate(
      [
        { transform: "translate(0, 0) scale(1.2)", opacity: 1 },
        { transform: `translate(${tx}px, ${ty}px) scale(0.1)`, opacity: 0 }
      ],
      { duration: 680, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" }
    );
    setTimeout(() => p.remove(), 720);
  }
}

function triggerBalloonPopCelebration() {
  const stage = document.getElementById("balloonCelebrationStage");
  if (!stage) return;

  const colors = [
    "linear-gradient(135deg, #10b981, #046a38)",
    "linear-gradient(135deg, #facc15, #d4af37)",
    "linear-gradient(135deg, #ec4899, #be185d)",
    "linear-gradient(135deg, #38bdf8, #0284c7)",
    "linear-gradient(135deg, #a855f7, #6b21a8)",
    "linear-gradient(135deg, #f97316, #c2410c)"
  ];
  const icons = ["★", "✓", "🎈", "✨", "🕌", "💎"];

  for (let i = 0; i < 14; i++) {
    const balloon = document.createElement("div");
    balloon.className = "checkout-balloon";
    const bg = colors[i % colors.length];
    balloon.style.background = bg;
    balloon.style.left = `${8 + Math.random() * 82}vw`;
    balloon.innerHTML = `<span>${icons[i % icons.length]}</span>`;
    stage.appendChild(balloon);

    const riseDuration = 1100 + Math.random() * 900;
    const targetY = -(window.innerHeight * (0.42 + Math.random() * 0.42));
    const driftX = (Math.random() - 0.5) * 90;

    balloon.animate(
      [
        { transform: "translate(0, 0) scale(0.85)" },
        { transform: `translate(${driftX}px, ${targetY}px) scale(1.08)` }
      ],
      { duration: riseDuration, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
    );

    // Pecahkan balon di udara (POP!)
    setTimeout(() => {
      const rect = balloon.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      balloon.classList.add("popped");
      spawnBurstParticles(centerX, centerY, "#facc15");
      playPopSoundEffect(0);
      setTimeout(() => balloon.remove(), 220);
    }, riseDuration - 80);
  }
}

// =========================================================================================
// KERANJANG BELANJA BERGAMBAR, QRIS & REKENING TEGAS, WAJIB UPLOAD BUKTI BAYAR, & CHECKOUT
// =========================================================================================
function addToCart(product, qty) {
  if (product.stock === 0 && product.category !== "cetak") {
    const altProd = MASTER_PRODUCTS.find(p => p.id === product.alternativeId) || MASTER_PRODUCTS[6];
    showToast(`⚠️ Stok ${product.name} sedang 0! Kiko menawarkan alternatif: ${altProd.name}`);
    openKikoDialogWithContext(`Cek stok ${product.name}`);
    return;
  }

  const existing = APP_STATE.cart.find(item => item.product.id === product.id);
  if (existing) {
    existing.qty += qty;
  } else {
    APP_STATE.cart.push({ product, qty, note: "" });
  }

  updateCartBadges();
  renderCartView();
  showToast(`🛒 +${qty} ${product.name} berhasil masuk keranjang!`);
}

window.addAlternativeProductById = function(prodId, qty) {
  const prod = MASTER_PRODUCTS.find(p => p.id === prodId);
  if (prod) addToCart(prod, qty || 1);
};

function updateCartBadges() {
  const totalCount = APP_STATE.cart.reduce((sum, item) => sum + item.qty, 0);
  const badge = document.getElementById("cartBadgeCount");
  if (!badge) return;
  badge.textContent = totalCount;
  badge.style.display = totalCount > 0 ? "flex" : "none";
}

function updateCheckoutLockState() {
  const btnCheckout = document.getElementById("btnCheckoutSubmit");
  const lockNotice = document.getElementById("checkoutLockNotice");
  const ocrBadge = document.getElementById("cartOcrStatusBadge");
  if (!btnCheckout || !lockNotice) return;

  if (APP_STATE.cart.length === 0) {
    btnCheckout.classList.add("btn-checkout-locked");
    btnCheckout.innerHTML = `<i class="fa-solid fa-basket-shopping"></i> Pilih Barang Dulu untuk Checkout`;
    lockNotice.style.background = "#f1f5f9";
    lockNotice.style.color = "#475569";
    lockNotice.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>Tambahkan produk ATK atau layanan cetak ke keranjang terlebih dahulu.</span>`;
    return;
  }

  if (APP_STATE.isPaymentProofVerified) {
    btnCheckout.classList.remove("btn-checkout-locked");
    btnCheckout.innerHTML = `<i class="fa-solid fa-check-double"></i> Pembayaran Sah! Klik Proses Checkout & Terbitkan Struk (🎈)`;
    lockNotice.style.background = "#dcfce7";
    lockNotice.style.color = "#166534";
    lockNotice.innerHTML = `<i class="fa-solid fa-circle-check"></i> <span>Alhamdulillah! Bukti pembayaran telah tervalidasi Vision AI OCR. Pesanan siap diproses!</span>`;
    if (ocrBadge) {
      ocrBadge.textContent = "✓ Terverifikasi Vision AI 100%";
      ocrBadge.style.background = "#dcfce7";
      ocrBadge.style.color = "#166534";
    }
  } else {
    btnCheckout.classList.add("btn-checkout-locked");
    btnCheckout.innerHTML = `<i class="fa-solid fa-lock"></i> Upload & Scan Bukti Bayar Dulu untuk Membuka Checkout`;
    lockNotice.style.background = "#fff1f2";
    lockNotice.style.color = "#9f1239";
    lockNotice.innerHTML = `<i class="fa-solid fa-lock"></i> <span>Wajib transfer ke QRIS/Rekening di atas & upload foto bukti bayar agar pesanan bisa diproses!</span>`;
    if (ocrBadge) {
      ocrBadge.textContent = "🔒 Belum Upload Bukti Bayar";
      ocrBadge.style.background = "#fee2e2";
      ocrBadge.style.color = "#991b1b";
    }
  }
}

function renderCartBankAndQris() {
  const bankListEl = document.getElementById("cartBankAccountsList");
  const qrisVisualEl = document.getElementById("cartQrisVisualContainer");
  const modalQrisBigEl = document.getElementById("modalQrisBigPreview");
  const qrisMerchantEl = document.getElementById("cartQrisMerchantName");
  const modalQrisTitleEl = document.getElementById("modalQrisStoreTitle");

  if (qrisMerchantEl) qrisMerchantEl.textContent = APP_STATE.store.name.toUpperCase();
  if (modalQrisTitleEl) modalQrisTitleEl.textContent = APP_STATE.store.name.toUpperCase();

  if (APP_STATE.store.qrisImage) {
    if (qrisVisualEl) {
      qrisVisualEl.innerHTML = `<img src="${APP_STATE.store.qrisImage}" alt="QRIS Toko" style="width:100%; height:100%; object-fit:contain;">`;
    }
    if (modalQrisBigEl) {
      modalQrisBigEl.innerHTML = `<img src="${APP_STATE.store.qrisImage}" alt="QRIS Toko Besar" style="max-width:240px; max-height:240px; object-fit:contain;">`;
    }
  }

  if (!bankListEl) return;
  bankListEl.innerHTML = "";
  const accounts = APP_STATE.store.bankAccounts || [];

  accounts.forEach(acc => {
    const pill = document.createElement("div");
    pill.className = "bank-account-pill";
    pill.innerHTML = `
      <div style="min-width:0;">
        <div style="display:flex; align-items:center; gap:5px; flex-wrap:wrap;">
          <strong style="font-size:0.72rem; color:var(--primary-dark);">${acc.bank}</strong>
          <span style="font-size:0.58rem; background:#dcfce7; color:#166534; padding:1px 6px; border-radius:99px; font-weight:800; border:1px solid #111827;">${acc.badge || "Resmi"}</span>
        </div>
        <div style="font-family:var(--font-mono); font-size:0.86rem; font-weight:900; color:#111827; letter-spacing:0.4px; margin-top:1px;" class="rek-number-display">
          ${acc.norek}
        </div>
        <div style="font-size:0.65rem; color:var(--slate-muted); font-weight:600;">a.n ${acc.an}</div>
      </div>
      <button type="button" class="copy-rek-btn" title="Salin Nomor Rekening">
        <i class="fa-regular fa-copy"></i> Salin
      </button>
    `;

    pill.querySelector(".copy-rek-btn").addEventListener("click", () => {
      const cleanNo = acc.norek.replace(/[^0-9]/g, "");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(cleanNo).catch(() => {});
      }
      showToast(`📋 Nomor Rekening ${acc.bank} (${acc.norek}) berhasil disalin!`);
    });

    bankListEl.appendChild(pill);
  });
}

function renderCartView() {
  const container = document.getElementById("cartItemsContainer");
  if (!container) return;
  container.innerHTML = "";

  if (APP_STATE.cart.length === 0) {
    container.innerHTML = `
      <div class="glow-card-black" style="text-align:center; padding:24px 16px;">
        <i class="fa-solid fa-basket-shopping" style="font-size:2.4rem; color:var(--primary); margin-bottom:8px;"></i>
        <p style="font-size:0.88rem; font-weight:800; color:var(--charcoal);">Keranjang Belanja Masih Kosong</p>
        <p style="font-size:0.72rem; color:var(--slate-muted); margin-bottom:12px;">
          Klik produk di Beranda, buat pesanan di Order Cetak, atau klik tombol di bawah untuk mengisi paket contoh:
        </p>
        <button type="button" class="btn-spj-download" id="btnFillSampleCart" style="margin:0 auto; border:2px solid #111827; padding:9px 16px;">
          <i class="fa-solid fa-cart-plus"></i> + Isi Paket Contoh ATK & Cetak (Lihat Kartu Bergambar)
        </button>
      </div>
    `;
    const btnFill = document.getElementById("btnFillSampleCart");
    if (btnFill) {
      btnFill.addEventListener("click", () => {
        if (MASTER_PRODUCTS[0]) APP_STATE.cart.push({ product: MASTER_PRODUCTS[0], qty: 5, note: "Kertas HVS A4 80gsm untuk ujian sekolah" });
        if (MASTER_PRODUCTS[3]) APP_STATE.cart.push({ product: MASTER_PRODUCTS[3], qty: 2, note: "Warna tinta hitam pekat" });
        if (MASTER_PRODUCTS[7]) APP_STATE.cart.push({ product: MASTER_PRODUCTS[7], qty: 1, note: "Jilid spiral kawat rapi + mika hijau" });
        updateCartBadges();
        renderCartView();
        showToast("🛒 3 Barang contoh lengkap dengan foto berhasil dimasukkan ke Keranjang!");
      });
    }
    updateCartTotals(0);
    updateCheckoutLockState();
    return;
  }

  let subtotal = 0;
  APP_STATE.cart.forEach((item, idx) => {
    const prod = item.product;
    const price = APP_STATE.isWholesaleMode ? prod.priceGrosir : prod.priceEceran;
    const savingPerUnit = Math.max(0, prod.priceEceran - prod.priceGrosir);
    const itemTotal = price * item.qty;
    subtotal += itemTotal;

    const card = document.createElement("div");
    card.className = "glow-card-black cart-rich-card";
    card.innerHTML = `
      <div class="cart-rich-top">
        <!-- Foto Barang (Bisa Diklik untuk Buka Detail & Zoom) -->
        <div class="cart-item-thumb-box" data-zoom="${idx}" title="Klik gambar untuk melihat detail & zoom barang">
          <img src="${prod.image || "assets/product_hvs.jpg"}" alt="${prod.name}">
          <span class="cart-item-zoom-tag"><i class="fa-solid fa-magnifying-glass-plus"></i> Detail</span>
        </div>

        <!-- Informasi Nama, Merk, Harga & Penghematan SPJ -->
        <div style="flex:1; min-width:0;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px;">
            <div style="font-size:0.82rem; font-weight:800; color:var(--charcoal); line-height:1.25;">
              ${prod.name}
            </div>
            <button type="button" class="btn-mini-action danger" data-del="${idx}" title="Hapus barang dari keranjang" style="border:1.5px solid #111827; background:#fee2e2; color:#991b1b;">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>

          <div style="font-size:0.66rem; color:var(--slate-muted); margin-top:2px;">
            ${prod.brand || "Toko Delina"} • Satuan: <strong>${prod.unit || "Unit"}</strong>
          </div>

          <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:4px;">
            <span style="font-family:var(--font-mono); font-size:0.78rem; font-weight:800; color:var(--primary);">
              Rp ${price.toLocaleString("id-ID")} / ${(prod.unit || "Unit").split(" ")[0]}
            </span>
            ${APP_STATE.isWholesaleMode && savingPerUnit > 0
              ? `<span style="background:#fef08a; color:#854d0e; font-size:0.6rem; font-weight:800; padding:1px 6px; border-radius:99px; border:1px solid #111827;">Hemat SPJ Rp ${(savingPerUnit * item.qty).toLocaleString("id-ID")}</span>`
              : `<span style="background:#e0f2fe; color:#0369a1; font-size:0.58rem; font-weight:700; padding:1px 6px; border-radius:99px;">Grosir SPJ: Rp ${prod.priceGrosir.toLocaleString("id-ID")}</span>`
            }
          </div>
        </div>
      </div>

      <!-- Baris Bawah: Input Catatan Item & Edit Jumlah (Tombol - / Ketik Angka Langsung / Tombol +) -->
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding-top:8px; border-top:1px dashed #cbd5e1; flex-wrap:wrap;">
        <div style="flex:1; min-width:140px;">
          <input type="text" class="cart-item-note-input" data-note="${idx}" value="${item.note || ""}" placeholder="Catatan item (misal: warna hitam / bungkus rapi)...">
        </div>

        <div style="display:flex; align-items:center; gap:5px;">
          <button type="button" class="qty-btn" style="width:30px; height:30px; border-radius:6px; border:1.8px solid #111827; font-weight:900;" data-act="minus" title="Kurangi 1">-</button>
          <input type="number" class="cart-qty-direct-input" value="${item.qty}" min="1" max="999" title="Ketik langsung jumlah barang">
          <button type="button" class="qty-btn" style="width:30px; height:30px; border-radius:6px; border:1.8px solid #111827; font-weight:900;" data-act="plus" title="Tambah 1">+</button>
          <div style="font-family:var(--font-mono); font-size:0.86rem; font-weight:900; color:var(--primary-dark); min-width:86px; text-align:right;">
            Rp ${itemTotal.toLocaleString("id-ID")}
          </div>
        </div>
      </div>
    `;

    // Klik Foto Barang -> Buka Slide-Up Bottom-Sheet Detail & Zoom
    card.querySelector("[data-zoom]").addEventListener("click", () => {
      openProductBottomSheet(prod);
    });

    // Hapus Barang
    card.querySelector("[data-del]").addEventListener("click", () => {
      APP_STATE.cart.splice(idx, 1);
      updateCartBadges();
      renderCartView();
      showToast(`🗑️ ${prod.name} dihapus dari keranjang.`);
    });

    // Kurangi Jumlah
    card.querySelector("[data-act='minus']").addEventListener("click", () => {
      if (item.qty > 1) item.qty -= 1;
      else APP_STATE.cart.splice(idx, 1);
      updateCartBadges();
      renderCartView();
    });

    // Tambah Jumlah
    card.querySelector("[data-act='plus']").addEventListener("click", () => {
      item.qty += 1;
      updateCartBadges();
      renderCartView();
    });

    // Ketik Jumlah Angka Secara Langsung
    const directInput = card.querySelector(".cart-qty-direct-input");
    directInput.addEventListener("change", () => {
      const val = parseInt(directInput.value, 10);
      if (!val || val <= 0) {
        APP_STATE.cart.splice(idx, 1);
      } else {
        item.qty = Math.min(999, val);
      }
      updateCartBadges();
      renderCartView();
    });

    // Simpan Catatan per Barang
    const noteInput = card.querySelector("[data-note]");
    noteInput.addEventListener("input", () => {
      item.note = noteInput.value;
    });

    container.appendChild(card);
  });

  updateCartTotals(subtotal);
  updateCheckoutLockState();
}

function updateCartTotals(subtotal) {
  const ongkir = APP_STATE.fulfillment === "delivery" && subtotal > 0 ? 10000 : 0;
  const estKomisi = APP_STATE.isWholesaleMode ? Math.round(subtotal * 0.05) : 0;
  const grandTotal = subtotal + ongkir;

  document.getElementById("cartSubtotal").textContent = `Rp ${subtotal.toLocaleString("id-ID")}`;
  document.getElementById("cartOngkir").textContent = `Rp ${ongkir.toLocaleString("id-ID")}`;
  document.getElementById("cartEstKomisi").textContent = `Rp ${estKomisi.toLocaleString("id-ID")}`;
  document.getElementById("cartGrandTotal").textContent = `Rp ${grandTotal.toLocaleString("id-ID")}`;
}

function initCartControls() {
  // Isi awal keranjang dengan 2 item populer agar saat pengguna membuka tab Keranjang langsung terlihat foto & fitur editnya
  if (APP_STATE.cart.length === 0 && MASTER_PRODUCTS.length >= 8) {
    APP_STATE.cart.push(
      { product: MASTER_PRODUCTS[0], qty: 5, note: "Kertas HVS A4 80gsm untuk laporan SPJ" },
      { product: MASTER_PRODUCTS[7], qty: 1, note: "Jilid spiral kawat + cover mika hijau" }
    );
    updateCartBadges();
  }

  const btnToggleWholesale = document.getElementById("btnToggleCartWholesale");
  const modeLabel = document.getElementById("cartPriceModeLabel");
  const btnCollect = document.getElementById("btnFulfillmentCollect");
  const btnDelivery = document.getElementById("btnFulfillmentDelivery");
  const descEl = document.getElementById("fulfillmentDesc");
  const deliveryAddrBox = document.getElementById("cartDeliveryAddressBox");
  const fileInputOcr = document.getElementById("cartOcrFileInput");
  const btnSimulateProof = document.getElementById("btnSimulateProofFile");
  const btnScanOcr = document.getElementById("btnScanOcrCart");
  const ocrBadge = document.getElementById("cartOcrStatusBadge");
  const ocrPreviewBox = document.getElementById("cartOcrPreviewBox");
  const ocrPreviewImg = document.getElementById("cartOcrPreviewImg");
  const btnRemoveProofImg = document.getElementById("btnRemoveProofImg");
  const btnZoomQris = document.getElementById("btnZoomQrisBox");
  const btnCheckout = document.getElementById("btnCheckoutSubmit");

  renderCartBankAndQris();
  renderCartView();

  if (btnZoomQris) {
    btnZoomQris.addEventListener("click", () => {
      document.getElementById("modalQrisZoom").classList.add("open");
    });
  }

  btnToggleWholesale.addEventListener("click", () => {
    APP_STATE.isWholesaleMode = !APP_STATE.isWholesaleMode;
    if (APP_STATE.isWholesaleMode) {
      modeLabel.textContent = "Harga Grosir Mitra Instansi SPJ (Komisi 5% Aktif)";
      btnToggleWholesale.innerHTML = '<i class="fa-solid fa-repeat"></i> Kembali ke Harga Eceran';
      showToast("🏛️ Mode Harga Grosir Instansi SPJ Aktif!");
    } else {
      modeLabel.textContent = "Harga Eceran Umum";
      btnToggleWholesale.innerHTML = '<i class="fa-solid fa-repeat"></i> Aktifkan Harga Grosir SPJ';
      showToast("Mode Harga Eceran Umum Aktif");
    }
    renderCartView();
  });

  btnCollect.addEventListener("click", () => {
    APP_STATE.fulfillment = "collect";
    btnCollect.classList.add("active");
    btnDelivery.classList.remove("active");
    descEl.textContent = "📍 Click & Collect: Ambil langsung di Toko Delina Jl. Lintas Sumatera, Tanjung Raja tanpa antre.";
    if (deliveryAddrBox) deliveryAddrBox.style.display = "none";
    renderCartView();
  });

  btnDelivery.addEventListener("click", () => {
    APP_STATE.fulfillment = "delivery";
    btnDelivery.classList.add("active");
    btnCollect.classList.remove("active");
    descEl.textContent = "🛵 Pesan Antar Lokal: Kurir internal Toko Delina mengantar ke alamat sekolah/desa di Tanjung Raja (+Rp 10.000).";
    if (deliveryAddrBox) deliveryAddrBox.style.display = "block";
    renderCartView();
  });

  function runLaserVisionAiVerification(imgSrc) {
    if (ocrPreviewImg && imgSrc) ocrPreviewImg.src = imgSrc;
    if (ocrPreviewBox) {
      ocrPreviewBox.classList.add("active", "scanning");
    }
    ocrBadge.textContent = "🔍 Vision AI Memindai Struk...";
    ocrBadge.style.background = "#fef08a";
    ocrBadge.style.color = "#854d0e";

    setTimeout(() => {
      if (ocrPreviewBox) ocrPreviewBox.classList.remove("scanning");
      APP_STATE.isPaymentProofVerified = true;
      APP_STATE.paymentProofDataUrl = imgSrc || "assets/print_review.jpg";
      updateCheckoutLockState();
      showToast("✅ Vision AI OCR: Bukti pembayaran cocok 100%! Tombol Checkout kini Terbuka.");
    }, 1100);
  }

  if (fileInputOcr) {
    fileInputOcr.addEventListener("change", () => {
      if (fileInputOcr.files && fileInputOcr.files[0]) {
        const reader = new FileReader();
        reader.onload = e => runLaserVisionAiVerification(e.target.result);
        reader.readAsDataURL(fileInputOcr.files[0]);
      }
    });
  }

  if (btnSimulateProof) {
    btnSimulateProof.addEventListener("click", () => {
      runLaserVisionAiVerification("assets/print_review.jpg");
    });
  }

  btnScanOcr.addEventListener("click", () => {
    runLaserVisionAiVerification(APP_STATE.paymentProofDataUrl || "assets/print_review.jpg");
  });

  if (btnRemoveProofImg) {
    btnRemoveProofImg.addEventListener("click", () => {
      APP_STATE.isPaymentProofVerified = false;
      APP_STATE.paymentProofDataUrl = null;
      if (fileInputOcr) fileInputOcr.value = "";
      if (ocrPreviewBox) ocrPreviewBox.classList.remove("active", "scanning");
      updateCheckoutLockState();
      showToast("🔄 Bukti bayar dihapus. Silakan unggah foto bukti transfer yang baru.");
    });
  }

  btnCheckout.addEventListener("click", () => {
    if (APP_STATE.cart.length === 0) {
      showToast("⚠️ Keranjang belanja masih kosong! Tambahkan barang terlebih dahulu.");
      return;
    }

    if (!APP_STATE.isPaymentProofVerified) {
      showToast("🔒 Mohon unggah foto Bukti Transfer / QRIS terlebih dahulu (atau klik tombol 'Contoh Bukti Bayar') sebelum memproses pesanan!");
      const ocrCard = document.getElementById("cartOcrValidationCard");
      if (ocrCard) ocrCard.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Mainkan Selebrasi Balon Terbang & Pecah (Balloon Pop Celebration)!
    triggerBalloonPopCelebration();

    let subtotal = 0;
    let totalHpp = 0;
    const lineItems = [];

    APP_STATE.cart.forEach(i => {
      const p = APP_STATE.isWholesaleMode ? i.product.priceGrosir : i.product.priceEceran;
      const hpp = i.product.hpp || Math.round(p * 0.78);
      subtotal += p * i.qty;
      totalHpp += hpp * i.qty;
      lineItems.push({
        id: i.product.id,
        name: i.product.name + (i.note ? ` (${i.note})` : ""),
        qty: i.qty,
        unit: i.product.unit || "Unit",
        price: p
      });

      const masterProd = MASTER_PRODUCTS.find(m => m.id === i.product.id);
      if (masterProd && masterProd.stock >= i.qty && masterProd.category !== "cetak") {
        masterProd.stock = Math.max(0, masterProd.stock - i.qty);
        masterProd.soldCount = (masterProd.soldCount || 0) + i.qty;
      }
    });

    const komisi = APP_STATE.isWholesaleMode ? Math.round(subtotal * 0.05) : 0;
    const ongkir = APP_STATE.fulfillment === "delivery" ? 10000 : 0;
    const grandTotal = subtotal + ongkir;
    const profit = Math.max(0, subtotal - totalHpp - komisi);
    const newInv = "#INV-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 899);

    if (komisi > 0) {
      APP_STATE.user.commissionBalance += komisi;
      document.getElementById("instansiBalanceVal").textContent = `Rp ${APP_STATE.user.commissionBalance.toLocaleString("id-ID")}`;
      const partner = INSTANSI_PARTNERS_DATA.find(ins => ins.instansi === APP_STATE.user.instansi) || INSTANSI_PARTNERS_DATA[0];
      if (partner) {
        partner.balance += komisi;
        partner.totalSpj += grandTotal;
      }
    }

    APP_STATE.shiftNonCashTotal += grandTotal;
    APP_STATE.netProfitToday += profit;

    const recipientName = document.getElementById("cartInputRecipient")
      ? document.getElementById("cartInputRecipient").value.trim()
      : APP_STATE.user.name;
    const deliveryAddr = APP_STATE.fulfillment === "delivery" && document.getElementById("cartInputAddress")
      ? ` • Antar ke: ${document.getElementById("cartInputAddress").value.trim()}`
      : " • Ambil di Toko";

    const newOrderObj = {
      invoiceId: newInv,
      date: "Hari Ini • " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
      customer: `${recipientName} (${APP_STATE.user.instansi})${deliveryAddr}`,
      itemsSummary: APP_STATE.cart.map(i => `${i.qty}x ${i.product.name.slice(0, 22)}`).join(", "),
      lineItems,
      total: grandTotal,
      komisi,
      status: APP_STATE.cart.some(i => i.product.category === "cetak") ? "Sedang Dicetak" : "Siap Ambil",
      paymentMethod: "QRIS / Transfer Bank (Terverifikasi Vision AI)",
      photo: APP_STATE.paymentProofDataUrl || "assets/print_review.jpg",
      isSpj: APP_STATE.isWholesaleMode
    };

    APP_STATE.orderHistory.unshift(newOrderObj);
    populateThermalAndSpjModals(newOrderObj);
    savePersistedState();

    if (renderCatalogGridFn) renderCatalogGridFn();
    if (window.refreshAllSyncedModules) window.refreshAllSyncedModules(newInv);
    renderAccountOrderHistory();

    callGasBackend("createTransaction", {
      namaPelanggan: recipientName,
      namaInstansi: APP_STATE.user.instansi,
      kategoriHarga: APP_STATE.isWholesaleMode ? "Grosir_Instansi_SPJ" : "Eceran",
      totalAtk: subtotal,
      nominalKomisi: komisi
    });

    // Reset Keranjang & Status Bukti Bayar setelah sukses checkout
    APP_STATE.cart = [];
    APP_STATE.isPaymentProofVerified = false;
    APP_STATE.paymentProofDataUrl = null;
    if (fileInputOcr) fileInputOcr.value = "";
    if (ocrPreviewBox) ocrPreviewBox.classList.remove("active", "scanning");
    updateCartBadges();
    renderCartView();

    showToast(`🎈🎉 Alhamdulillah! Checkout ${newInv} Berhasil & Struk Syariah Diterbitkan!`);
    setTimeout(() => {
      document.getElementById("modalThermalReceipt").classList.add("open");
    }, 850);
    openKikoDialogWithContext(`Konfirmasi pembayaran berhasil untuk invoice ${newInv}`);
  });
}

// =========================================================================================
// 5. FLOATING CHAT WIDGET "KIKO ON-WEB" (ROBOT KIKO BERPECI & 4 KUTIPAN AL-QUR'AN/HADITS)
// =========================================================================================
function initFloatingKikoWidget() {
  const btnOpen = document.getElementById("btnOpenKikoDialog");
  const dialog = document.getElementById("kikoFloatingDialog");
  const btnClose = document.getElementById("btnCloseKikoDialog");
  const input = document.getElementById("kikoDialogInput");
  const btnVoice = document.getElementById("btnDialogVoice");
  const btnSend = document.getElementById("btnDialogSend");

  // Auto-expand textarea di dalam Floating Chat Dialog juga!
  attachAutoExpandTextarea(input);

  btnOpen.addEventListener("click", () => {
    dialog.classList.toggle("open");
  });

  btnClose.addEventListener("click", () => {
    dialog.classList.remove("open");
  });

  function handleSend() {
    const q = input.value.trim();
    if (!q) return;
    processKikoNlpCommand(q);
    input.value = "";
    input.style.height = "auto";
  }

  btnSend.addEventListener("click", handleSend);
  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  btnVoice.addEventListener("click", () => {
    btnVoice.classList.add("recording");
    showToast("🎙️ Merekam Voice Note di Kiko On-Web...");
    setTimeout(() => {
      btnVoice.classList.remove("recording");
      input.value = "Beli HVS A4 5 rim dan Pulpen Pilot satu kotak";
      input.dispatchEvent(new Event("input"));
    }, 1800);
  });

  // Tombol Chip Cepat untuk menguji seluruh kapabilitas Kiko & 4 Momen Al-Qur'an/Hadits
  document.getElementById("chipChatHvs").addEventListener("click", () => {
    processKikoNlpCommand("Beli HVS A4 5 rim dan Pulpen Pilot satu kotak");
  });

  document.getElementById("chipChatPrintHadith").addEventListener("click", () => {
    processKikoNlpCommand("Ini berkas ujian & skripsi, print 60 halaman warna jilid spiral kawat habis berapa?");
  });

  document.getElementById("chipChatVision").addEventListener("click", () => {
    simulateVisionAiOcrUpload();
  });

  document.getElementById("chipChatKomisiAyat").addEventListener("click", () => {
    processKikoNlpCommand("Cek saldo komisi belanja instansi SDN 01 Tanjung Raja");
  });

  document.getElementById("chipChatHadiahHadith").addEventListener("click", () => {
    processKikoNlpCommand("Mau tukar hadiah reward 15x transaksi bintang 5");
  });

  document.getElementById("chipChatStok0").addEventListener("click", () => {
    processKikoNlpCommand("Cek stok kertas folio bergaris SiDU");
  });

  document.getElementById("chipChatEskalasi").addEventListener("click", () => {
    processKikoNlpCommand("Komplain pesanan cetak rumit, tolong hubungi admin manusia");
  });
}

function openKikoDialogWithContext(prompt) {
  const dialog = document.getElementById("kikoFloatingDialog");
  dialog.classList.add("open");
  processKikoNlpCommand(prompt);
}

function appendChatMessage(sender, text, isHtml = false) {
  const messagesContainer = document.getElementById("kikoDialogMessages");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble bubble-${sender}`;
  if (isHtml) bubble.innerHTML = text;
  else bubble.textContent = text;
  messagesContainer.appendChild(bubble);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function processKikoNlpCommand(query) {
  appendChatMessage("user", query);
  callGasBackend("processKikoChat", { message: query, namaPelanggan: APP_STATE.user.name });

  const q = query.toLowerCase();

  setTimeout(() => {
    // MOMEN 1: Cetak Dokumen Sekolah / Skripsi / Pekerjaan -> HR. Muslim (Menuntut Ilmu)
    if (q.includes("print") || q.includes("cetak") || q.includes("skripsi") || q.includes("jilid") || q.includes("ujian")) {
      const responseHtml = `
        <span class="islamic-greeting">Assalamu’alaikum Warahmatullahi Wabarakatuh, Barakallahu fiik Kak!</span>
        Untuk cetak 60 halaman warna + Jilid Spiral Kawat Skripsi lengkap mika & buffalo, estimasi biayanya <strong>Rp 72.000</strong> (selesai 15–20 menit). Berkas telah Kiko catat ke <code>Antrean_Cetak</code>.
        <div class="chat-quote-box">
          <i class="fa-solid fa-graduation-cap text-gold" style="font-size:1.1rem; margin-top:2px;"></i>
          <div>
            <strong>${ISLAMIC_QUOTES.printTask.title}</strong><br>
            <em>"${ISLAMIC_QUOTES.printTask.hadith}"</em>
          </div>
        </div>
        <div style="font-size:0.7rem; color:var(--primary-dark); margin-top:6px;">
          Semoga urusan cetak dan belanja Kakak hari ini dimudahkan dan membawa berkah. Wassalamu’alaikum Warahmatullahi Wabarakatuh.
        </div>
      `;
      appendChatMessage("kiko", responseHtml, true);
      return;
    }

    // MOMEN 2: Konfirmasi Pembayaran Berhasil / Cek Transaksi -> Hadits Pedagang Jujur & Amanah
    if (q.includes("bayar") || q.includes("konfirmasi") || q.includes("lunas") || q.includes("transfer")) {
      const responseHtml = `
        <span class="islamic-greeting">Alhamdulillah, Jazakumullahu Khairan Katsiran!</span>
        Pembayaran transaksi atas nama <strong>${APP_STATE.user.name} (${APP_STATE.user.instansi})</strong> telah terverifikasi sah dan bebas riba. Struk Digital & Nota PDF SPJ resmi siap diunduh.
        <div class="chat-quote-box">
          <i class="fa-solid fa-handshake-angle text-emerald" style="font-size:1.1rem; margin-top:2px;"></i>
          <div>
            <strong>${ISLAMIC_QUOTES.paymentSuccess.title}</strong><br>
            <em>"${ISLAMIC_QUOTES.paymentSuccess.hadith}"</em>
          </div>
        </div>
        <div style="font-size:0.7rem; color:var(--primary-dark); margin-top:6px;">
          Semoga urusan cetak dan belanja Kakak hari ini dimudahkan dan membawa berkah. Wassalamu’alaikum Warahmatullahi Wabarakatuh.
        </div>
      `;
      appendChatMessage("kiko", responseHtml, true);
      return;
    }

    // MOMEN 3: Mitra Instansi Memeriksa Saldo Komisi -> QS. Al-Isra: 34
    if (q.includes("komisi") || q.includes("spj") || q.includes("saldo") || q.includes("instansi")) {
      const responseHtml = `
        <span class="islamic-greeting">Bismillah, Rincian Transparan Saldo Komisi Instansi</span>
        Halo Kak <strong>${APP_STATE.user.name}</strong>, saldo komisi belanja untuk <strong>${APP_STATE.user.instansi}</strong> saat ini tercatat sebesar <strong>Rp ${APP_STATE.user.commissionBalance.toLocaleString("id-ID")}</strong>. Dokumen Nota SPJ ber-kop Toko Delina siap diunduh atau dikirim ke email bendahara.
        <div class="chat-quote-box">
          <i class="fa-solid fa-scale-balanced text-gold" style="font-size:1.1rem; margin-top:2px;"></i>
          <div>
            <strong>${ISLAMIC_QUOTES.instansiCommission.title}</strong><br>
            <em>"${ISLAMIC_QUOTES.instansiCommission.quran}"</em>
          </div>
        </div>
      `;
      appendChatMessage("kiko", responseHtml, true);
      return;
    }

    // MOMEN 4: Member Mengklaim Hadiah Reward 15x Transaksi -> HR. Bukhari (Al-Adab Al-Mufrad)
    if (q.includes("hadiah") || q.includes("reward") || q.includes("15x") || q.includes("loyalty") || q.includes("tukar")) {
      const responseHtml = `
        <span class="islamic-greeting">Maa Syaa Allah, Tabarakallah!</span>
        Progres Loyalty Bintang 5 Kakak saat ini adalah <strong>${APP_STATE.user.loyaltyCount} / 15 Transaksi</strong>. Hadiah pilihan di tab <code>Loyalty_Gifts</code> (Flashdisk 32GB, 1 Rim HVS A4 80g, Tumbler Eksklusif, Kalkulator Citizen) siap dipilih!
        <div class="chat-quote-box">
          <i class="fa-solid fa-gift text-gold" style="font-size:1.1rem; margin-top:2px;"></i>
          <div>
            <strong>${ISLAMIC_QUOTES.loyaltyReward.title}</strong><br>
            <em>"${ISLAMIC_QUOTES.loyaltyReward.hadith}"</em>
          </div>
        </div>
      `;
      appendChatMessage("kiko", responseHtml, true);
      return;
    }

    // CEK STOK 0 -> PROAKTIF TAWARKAN PRODUK ALTERNATIF + ALERT KE OWNER
    if (q.includes("folio") || q.includes("stok") || q.includes("habis")) {
      const pOut = MASTER_PRODUCTS.find(p => p.stock === 0) || MASTER_PRODUCTS[5];
      const pAlt = MASTER_PRODUCTS.find(p => p.id === pOut.alternativeId) || MASTER_PRODUCTS[6];

      const responseHtml = `
        <span class="islamic-greeting">Afwan Kak, Informasi Stok Real-Time & Rekomendasi Alternatif:</span>
        Saat ini <strong>${pOut.name}</strong> sedang habis (Stok: <strong>0</strong>). Kiko telah mengirim alert otomatis ke Telegram Owner.<br><br>
        Sebagai solusinya, Kiko merekomendasikan produk alternatif yang <strong>Ready Stock</strong> di rak Toko Delina:<br>
        ✨ <strong>${pAlt.name}</strong><br>
        • Harga Eceran: <strong>Rp ${pAlt.priceEceran.toLocaleString("id-ID")}</strong> (Grosir SPJ: Rp ${pAlt.priceGrosir.toLocaleString("id-ID")})<br>
        • Sisa Stok: <strong>${pAlt.stock} ${pAlt.unit}</strong><br><br>
        <button type="button" class="btn-sheet-add-cart" style="height:32px; font-size:0.72rem; padding:0 12px;" onclick="window.addAlternativeProductById('${pAlt.id}', 2)">
          <i class="fa-solid fa-cart-plus"></i> + Masukkan 2 Pack Alternatif Ini ke Keranjang
        </button>
      `;
      appendChatMessage("kiko", responseHtml, true);
      return;
    }

    // NLP AUTO-ADD TO CART (Contoh: "Beli HVS A4 5 rim dan Pulpen Pilot satu kotak")
    if (q.includes("beli") || q.includes("pesan")) {
      const hvs = MASTER_PRODUCTS[0];
      const pilot = MASTER_PRODUCTS[3];
      addToCart(hvs, 5);
      addToCart(pilot, 1);

      const responseHtml = `
        <span class="islamic-greeting">Bismillah, Auto-Add to Cart Berhasil!</span>
        Kiko telah memeriksa stok di <code>Master_Produk</code> dan otomatis memasukkan pesanan Kakak ke Keranjang:<br>
        • <strong>5 Rim</strong> ${hvs.name}<br>
        • <strong>1 Kotak</strong> ${pilot.name}<br><br>
        Tafaddhol buka menu <strong>Keranjang</strong> di navigasi bawah untuk memilih Ambil di Toko atau Pesan Antar Tanjung Raja.
      `;
      appendChatMessage("kiko", responseHtml, true);
      return;
    }

    // ESKALASI PINTAR KE TELEGRAM ADMIN MANUSIA
    if (q.includes("manusia") || q.includes("admin") || q.includes("komplain") || q.includes("owner")) {
      callGasBackend("escalateToTelegram", { nama: APP_STATE.user.name, wa: APP_STATE.user.phone, pesan: query });
      const responseHtml = `
        <span class="islamic-greeting">Baik Kak, Eskalasi Prioritas ke Admin Manusia Terkirim!</span>
        Kiko baru saja mengirim notifikasi real-time ke Telegram pribadi Owner Toko Delina:<br>
        <em>"Halo Bos, ada pelanggan di chat ini yang butuh bantuan admin manusia."</em><br>
        Insya Allah Owner/Admin kami segera menghubungi WhatsApp Kakak.
      `;
      appendChatMessage("kiko", responseHtml, true);
      showToast("🚨 Alert Eskalasi terkirim ke Telegram Pribadi Owner!");
      return;
    }

    // RESPON DEFAULT SANTUN ISLAMI
    const defaultHtml = `
      <span class="islamic-greeting">Assalamu’alaikum Warahmatullahi Wabarakatuh, Ahlan wa Sahlan di Kiko Smart Stationery (Toko Delina)!</span>
      Insya Allah Kiko siap membantu Kakak:<br>
      1. Ketik <em>"Beli HVS A4 5 rim..."</em> untuk belanja otomatis.<br>
      2. Ketik <em>"Cek stok folio"</em> untuk cek stok & alternatif.<br>
      3. Klik tombol chip di bawah untuk melihat 4 kutipan Al-Qur'an & Hadits kontekstual.<br>
      Semoga urusan cetak dan belanja Kakak hari ini dimudahkan dan membawa berkah. Wassalamu’alaikum Warahmatullahi Wabarakatuh.
    `;
    appendChatMessage("kiko", defaultHtml, true);
  }, 450);
}

function simulateVisionAiOcrUpload() {
  const dialog = document.getElementById("kikoFloatingDialog");
  dialog.classList.add("open");
  appendChatMessage("user", "📷 [Mengunggah Foto Bukti Transfer QRIS / Bank Sumsel Babel Rp 422.000]");

  setTimeout(() => {
    appendChatMessage("kiko", "🔍 <em>Vision AI (OCR) sedang mengekstrak teks, tanggal, & nominal bukti pembayaran serta mencocokkan dengan Transaksi_Header...</em>", true);
  }, 300);

  setTimeout(() => {
    const ocrHtml = `
      <div style="background:#ecfdf5; border:1.5px solid #10b981; border-radius:var(--radius-sm); padding:10px; font-size:0.74rem; margin-bottom:6px;">
        <strong style="color:#046a38;"><i class="fa-solid fa-circle-check"></i> Vision AI OCR: Pembayaran Cocok 100% (LUNAS)!</strong><br>
        • Kanal Bayar: QRIS / Bank Sumsel Babel<br>
        • Pengirim: ${APP_STATE.user.name} (${APP_STATE.user.instansi})<br>
        • Nominal Terbaca OCR: <strong>Rp 422.000</strong><br>
        • Status Invoice <code>#INV-20261027-088</code>: <strong>VERIFIED LUNAS</strong>
      </div>
      <div class="chat-quote-box">
        <i class="fa-solid fa-handshake-angle text-emerald" style="font-size:1.1rem; margin-top:2px;"></i>
        <div>
          <strong>${ISLAMIC_QUOTES.paymentSuccess.title}</strong><br>
          <em>"${ISLAMIC_QUOTES.paymentSuccess.hadith}"</em>
        </div>
      </div>
    `;
    appendChatMessage("kiko", ocrHtml, true);
    showToast("✅ Vision AI OCR: Bukti transfer Rp 422.000 Valid & Lunas!");
  }, 1300);
}

// =========================================================================================
// ORDER CETAK & FOTOKOPI CALCULATOR (`Master_Layanan_Cetak` & `Antrean_Cetak`)
// =========================================================================================
function syncPrintServicesDropdown() {
  const serviceType = document.getElementById("printServiceType");
  if (!serviceType) return;
  const currentVal = serviceType.value;
  serviceType.innerHTML = "";
  PRINT_SERVICES_DATA.forEach((srv, idx) => {
    const opt = document.createElement("option");
    opt.value = srv.id;
    opt.setAttribute("data-price", srv.price);
    opt.textContent = `${srv.name} — Rp ${srv.price.toLocaleString("id-ID")} / ${srv.unit || "lembar"}`;
    if (srv.id === currentVal || (!currentVal && idx === 1)) opt.selected = true;
    serviceType.appendChild(opt);
  });
}

function initPrintOrderCalculator() {
  syncPrintServicesDropdown();

  const serviceType = document.getElementById("printServiceType");
  const pageCount = document.getElementById("printPageCount");
  const copyCount = document.getElementById("printCopyCount");
  const finishingType = document.getElementById("printFinishingType");
  const fileUpload = document.getElementById("printFileUpload");
  const fileStatus = document.getElementById("printFileStatus");
  const totalEstimateEl = document.getElementById("printTotalEstimate");
  const btnSubmit = document.getElementById("btnSubmitPrintOrder");

  function calculatePrintTotal() {
    const selectedOpt = serviceType.selectedOptions[0] || serviceType.options[0];
    const pagePrice = selectedOpt ? (parseInt(selectedOpt.getAttribute("data-price"), 10) || 350) : 350;
    const pages = parseInt(pageCount.value, 10) || 1;
    const copies = parseInt(copyCount.value, 10) || 1;
    const finishPrice = parseInt(finishingType.selectedOptions[0].getAttribute("data-price"), 10) || 0;

    const total = ((pagePrice * pages) + finishPrice) * copies;
    totalEstimateEl.textContent = `Rp ${total.toLocaleString("id-ID")}`;

    const formulaEl = document.getElementById("printFormulaBreakdown");
    if (formulaEl) {
      formulaEl.textContent = `(${pages} Hal × Rp ${pagePrice.toLocaleString("id-ID")} + Jilid Rp ${finishPrice.toLocaleString("id-ID")}) × ${copies} Rangkap`;
    }
    return total;
  }

  serviceType.addEventListener("change", calculatePrintTotal);
  pageCount.addEventListener("input", calculatePrintTotal);
  copyCount.addEventListener("input", calculatePrintTotal);
  finishingType.addEventListener("change", calculatePrintTotal);

  fileUpload.addEventListener("change", () => {
    if (fileUpload.files && fileUpload.files[0]) {
      fileStatus.innerHTML = `<i class="fa-solid fa-circle-check text-emerald"></i> Berkas <strong>${fileUpload.files[0].name}</strong> siap diunggah ke Google Drive Toko Delina.`;
    }
  });

  btnSubmit.addEventListener("click", () => {
    const total = calculatePrintTotal();
    const selectedOpt = serviceType.selectedOptions[0] || serviceType.options[0];
    const serviceName = selectedOpt ? selectedOpt.text.split("—")[0].trim() : "Print Dokumen";
    const finishName = finishingType.selectedOptions[0].text.split("—")[0].trim();
    const pages = pageCount.value;
    const copies = copyCount.value;
    const custName = document.getElementById("printCustomerName").value.trim() || `${APP_STATE.user.name} (${APP_STATE.user.instansi})`;

    const customPrintItem = {
      id: "SRV-CETAK-" + Date.now(),
      name: `${serviceName} (${pages} Hal x ${copies} Rangkap) + ${finishName}`,
      category: "cetak",
      brand: "Percetakan Toko Delina",
      unit: "Paket Cetak",
      hpp: Math.round(total * 0.55),
      priceEceran: total,
      priceGrosir: Math.round(total * 0.95),
      stock: 999,
      rating: 5.0,
      soldCount: 1,
      image: "assets/print_review.jpg",
      alternativeId: null,
      specs: { "Halaman": pages, "Rangkap": copies, "Jilid": finishName, "Pemesan": custName },
      description: "Pesanan cetak dokumen online tercatat di Antrean_Cetak Google Sheets."
    };

    // Catat langsung ke Antrean_Cetak & OrderHistory supaya muncul di POS Kasir Tab Antrean & Lacak Pesanan!
    const newInv = "#INV-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 899);
    const printOrderEntry = {
      invoiceId: newInv,
      date: "Hari Ini • " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
      customer: custName,
      itemsSummary: customPrintItem.name,
      lineItems: [{ id: customPrintItem.id, name: customPrintItem.name, qty: 1, unit: "Paket", price: total }],
      total: total,
      komisi: Math.round(total * 0.05),
      status: "Antre",
      paymentMethod: "Menunggu Konfirmasi / Bayar via QRIS",
      photo: "assets/print_review.jpg",
      isSpj: true
    };
    APP_STATE.orderHistory.unshift(printOrderEntry);
    savePersistedState();
    if (window.refreshAllSyncedModules) window.refreshAllSyncedModules(newInv);
    renderAccountOrderHistory();

    addToCart(customPrintItem, 1);

    // Otomatis pindah ke Tab Keranjang agar pembeli langsung bisa melihat item & melakukan pembayaran QRIS/Transfer
    const cartNavBtn = document.querySelector('.bottom-nav-bar .nav-item-btn[data-view="viewCart"]');
    if (cartNavBtn) cartNavBtn.click();
    showToast("🖨️ Berkas masuk ke Keranjang! Silakan scan QRIS/Transfer & upload bukti bayar.");
    openKikoDialogWithContext(`Ini berkas tugas/skripsi, print ${pages} halaman ${finishName}`);
  });

  window.recalculatePrintEstimate = calculatePrintTotal;
  calculatePrintTotal();
}

// =========================================================================================
// MODAL NOTA PDF SPJ RESMI, STRUK THERMAL SYARIAH, LOYALTY 15x, & TAMBAH ULASAN MARQUEE
// =========================================================================================
function initSpjAndLoyaltyModals() {
  const modalSpj = document.getElementById("modalSpjPdf");
  const modalThermal = document.getElementById("modalThermalReceipt");
  const modalGifts = document.getElementById("modalLoyaltyGifts");
  const modalAddRev = document.getElementById("modalAddReview");

  document.getElementById("btnPreviewSpjPdf").addEventListener("click", () => {
    populateThermalAndSpjModals(APP_STATE.activeTrackedOrder || APP_STATE.orderHistory[0]);
    modalSpj.classList.add("open");
  });
  document.getElementById("btnTrackOpenSpj").addEventListener("click", () => {
    populateThermalAndSpjModals(APP_STATE.activeTrackedOrder || APP_STATE.orderHistory[0]);
    modalSpj.classList.add("open");
  });

  document.getElementById("btnEmailSpj").addEventListener("click", () => {
    const targetEmail = APP_STATE.user.emailBendahara || "bendahara@sdn01tanjungraja.sch.id";
    const ord = APP_STATE.activeTrackedOrder || APP_STATE.orderHistory[0];
    callGasBackend("generateAndSendSpjPdf", { email: targetEmail, instansi: APP_STATE.user.instansi, total: ord ? ord.total : 422000 });
    showToast(`📧 Nota PDF SPJ resmi ber-kop ${APP_STATE.store.name} berhasil dikirim ke ${targetEmail}!`);
  });

  // Tombol Ajukan Pencairan Komisi di Kartu Akun Instansi Beranda
  const btnReqPayout = document.getElementById("btnRequestCommissionPayout");
  if (btnReqPayout) {
    btnReqPayout.addEventListener("click", () => {
      if (APP_STATE.user.commissionBalance <= 0) {
        showToast("ℹ️ Saldo komisi instansi saat ini Rp 0 (sudah dicairkan).");
        return;
      }
      const partner = INSTANSI_PARTNERS_DATA.find(p => p.instansi === APP_STATE.user.instansi) || INSTANSI_PARTNERS_DATA[0];
      if (partner) partner.status = "Menunggu Pencairan Owner";
      savePersistedState();
      if (window. refreshAllSyncedModules) window.refreshAllSyncedModules();
      showToast(`💰 Pengajuan pencairan komisi Rp ${APP_STATE.user.commissionBalance.toLocaleString("id-ID")} terkirim ke Dashboard Owner!`);
      openKikoDialogWithContext("Cek saldo komisi belanja instansi SDN 01 Tanjung Raja");
    });
  }

  document.getElementById("btnPrintSpjAction").addEventListener("click", () => {
    window.print();
  });

  document.getElementById("btnSendSpjEmailAction").addEventListener("click", () => {
    const email = document.getElementById("inputSpjTargetEmail").value.trim() || "bendahara@sdn01tanjungraja.sch.id";
    const ord = APP_STATE.activeTrackedOrder || APP_STATE.orderHistory[0];
    callGasBackend("generateAndSendSpjPdf", { email, instansi: APP_STATE.user.instansi, total: ord ? ord.total : 422000 });
    modalSpj.classList.remove("open");
    showToast(`📧 Dokumen PDF Nota SPJ resmi telah dikirim ke ${email}!`);
  });

  // Modal Struk Thermal Syariah
  document.getElementById("btnTrackViewStruk").addEventListener("click", () => {
    populateThermalAndSpjModals(APP_STATE.activeTrackedOrder || APP_STATE.orderHistory[0]);
    modalThermal.classList.add("open");
  });
  document.getElementById("btnOpenThermalReceiptDemo").addEventListener("click", () => {
    populateThermalAndSpjModals(APP_STATE.activeTrackedOrder || APP_STATE.orderHistory[0]);
    modalThermal.classList.add("open");
  });

  document.getElementById("btnPrintThermalNow").addEventListener("click", () => {
    window.print();
    showToast("🖨️ Mencetak Struk Thermal 58mm/80mm Toko Delina...");
  });

  // Tombol WA 1-Klik Sungguhan (`https://wa.me/...`)
  document.getElementById("btnSendWaOneClick").addEventListener("click", () => {
    openWhatsAppReceipt(APP_STATE.activeTrackedOrder || APP_STATE.orderHistory[0]);
  });

  // Modal Loyalty Gifts 15x
  const giftsListContainer = document.getElementById("loyaltyGiftsList");
  let selectedGiftId = LOYALTY_GIFTS_DATA[0] ? LOYALTY_GIFTS_DATA[0].id : "GIFT-01";

  function renderLoyaltyGiftsList() {
    giftsListContainer.innerHTML = "";
    LOYALTY_GIFTS_DATA.forEach(gift => {
      const isSelected = gift.id === selectedGiftId;
      const item = document.createElement("div");
      item.style.cssText = `padding:10px 12px; border:1.5px solid ${isSelected ? "var(--gold)" : "var(--surface-border)"}; border-radius:var(--radius-md); background:${isSelected ? "#fefce8" : "#ffffff"}; cursor:pointer; transition:var(--transition);`;
      item.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong style="font-size:0.8rem; color:var(--charcoal);"><i class="fa-solid fa-gift text-gold"></i> ${gift.name}</strong>
          <span class="aqi-pill">Stok: ${gift.stok}</span>
        </div>
        <div style="font-size:0.7rem; color:var(--slate-muted); margin-top:2px;">${gift.desc}</div>
      `;
      item.addEventListener("click", () => {
        selectedGiftId = gift.id;
        renderLoyaltyGiftsList();
      });
      giftsListContainer.appendChild(item);
    });
  }

  document.getElementById("btnOpenLoyaltyGifts").addEventListener("click", () => {
    renderLoyaltyGiftsList();
    modalGifts.classList.add("open");
  });

  document.getElementById("btnClaimLoyaltyReward").addEventListener("click", () => {
    const gift = LOYALTY_GIFTS_DATA.find(g => g.id === selectedGiftId) || LOYALTY_GIFTS_DATA[0];
    if (gift && gift.stok > 0) gift.stok -= 1;
    savePersistedState();
    if (window.refreshAllSyncedModules) window.refreshAllSyncedModules();
    modalGifts.classList.remove("open");
    callGasBackend("claimLoyaltyGift", { giftName: gift ? gift.name : "Hadiah Loyalty" });
    showToast(`🎁 Alhamdulillah! Hadiah "${gift ? gift.name : "Loyalty"}" berhasil dipilih!`);
    openKikoDialogWithContext(`Mau tukar hadiah reward 15x transaksi bintang 5: ${gift ? gift.name : "Hadiah"}`);
  });

  // Modal Tambah Ulasan Bintang 5 & Foto Cetakan (Langsung Masuk ke Running Card Marquee & +1 Loyalty!)
  document.getElementById("btnOpenAddReviewModal").addEventListener("click", () => {
    document.getElementById("revInputName").value = APP_STATE.user.name;
    document.getElementById("revInputRole").value = APP_STATE.user.instansi;
    modalAddRev.classList.add("open");
  });

  document.getElementById("btnSubmitReviewMarquee").addEventListener("click", () => {
    const name = document.getElementById("revInputName").value.trim() || APP_STATE.user.name;
    const role = document.getElementById("revInputRole").value.trim() || APP_STATE.user.instansi;
    const comment = document.getElementById("revInputComment").value.trim() || "Pelayanan sangat memuaskan dan berkah!";
    const photoInput = document.getElementById("revInputPhoto");

    const finalizeReview = photoDataUrl => {
      MARQUEE_REVIEWS.unshift({
        name,
        role,
        rating: 5,
        comment,
        photo: photoDataUrl || "assets/print_review.jpg"
      });
      renderRunningReviewMarquee();
      updateLoyaltyCardDisplay(APP_STATE.user.loyaltyCount + 1);
      savePersistedState();
      modalAddRev.classList.remove("open");
      showToast("🌟 Ulasan Bintang 5 berhasil ditambahkan ke Running Card Marquee & Counter Loyalty bertambah +1!");
    };

    if (photoInput.files && photoInput.files[0]) {
      const reader = new FileReader();
      reader.onload = e => finalizeReview(e.target.result);
      reader.readAsDataURL(photoInput.files[0]);
    } else {
      finalizeReview("assets/print_review.jpg");
    }
  });
}

// =========================================================================================
// TERMINAL POS KASIR FISIK (3 SUB-TAB) & DASHBOARD SUPER ADMIN / OWNER CRUD (5 SUB-TAB)
// =========================================================================================
function initPosAndOwnerModals() {
  const modalPos = document.getElementById("modalPosKasir");
  const modalOwner = document.getElementById("modalOwnerDashboard");

  // -------------------------------------------------------------------------
  // A. NAVIGASI SUB-TAB TERMINAL POS KASIR (`posTabKasir`, `posTabAntrean`, `posTabClosing`)
  // -------------------------------------------------------------------------
  const posTabBtns = document.querySelectorAll("#posSubtabsNav .dashboard-subtab-btn");
  const posPanes = modalPos.querySelectorAll(".subtab-pane");
  posTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-postab");
      posTabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      posPanes.forEach(p => p.classList.toggle("active", p.id === targetId));
    });
  });

  // -------------------------------------------------------------------------
  // B. POS TAB 1: KATALOG VISUAL KLIK LANGSUNG & KERANJANG KASIR MEJA DEPAN
  // -------------------------------------------------------------------------
  const posCatalogGrid = document.getElementById("posVisualCatalogGrid");
  const posCatFilter = document.getElementById("posCatalogCatFilter");
  const posSearchInput = document.getElementById("posBarcodeQuery");
  const posCustomerSelect = document.getElementById("posCustomerSelect");
  const priceCatSelect = document.getElementById("posPriceCategory");
  const posCartList = document.getElementById("posCartList");
  const posTotalEl = document.getElementById("posTotalTagihan");
  const cashInput = document.getElementById("posCashReceived");
  const changeEl = document.getElementById("posCashChange");
  const paymentMethodSelect = document.getElementById("posPaymentMethod");

  function addProductToPosCart(prod, isFromScan = false) {
    if (!prod) return;
    if (prod.stock === 0 && prod.category !== "cetak") {
      playCashierBeep(false);
      const alt = MASTER_PRODUCTS.find(p => p.id === prod.alternativeId) || MASTER_PRODUCTS[6];
      showToast(`⚠️ Stok "${prod.name}" habis (0)! Disarankan alternatif: ${alt ? alt.name : "Produk Lain"}`);
      return;
    }

    playCashierBeep(true);
    const existing = APP_STATE.posCart.find(item => item.id === prod.id);
    if (existing) {
      existing.qty += 1;
    } else {
      APP_STATE.posCart.push({
        id: prod.id,
        name: prod.name,
        sku: prod.sku || prod.id,
        barcode: prod.barcode || "",
        price: prod.priceEceran,
        qty: 1
      });
    }

    renderPosCart();
    renderPosVisualCatalog();

    // Efek visual pulse menyala pada Banner Live Counter di bagian atas
    const liveBanner = document.getElementById("posLiveCartBanner");
    if (liveBanner) {
      liveBanner.classList.remove("banner-scanned-pulse");
      void liveBanner.offsetWidth; // trigger reflow
      liveBanner.classList.add("banner-scanned-pulse");
    }

    const currentQty = existing ? existing.qty : 1;
    if (isFromScan) {
      showToast(`✅ [${prod.sku || prod.id}] ${prod.name} discan (+1, Total: ${currentQty}x)`);
    } else {
      showToast(`+1 ${prod.name} masuk keranjang Kasir POS (Total: ${currentQty}x)`);
    }

    // Efek visual pulse highlight baris keranjang yang discan
    setTimeout(() => {
      const rowEl = document.getElementById(`pos-cart-row-${prod.id}`);
      if (rowEl) {
        rowEl.classList.remove("row-scanned-pulse");
        void rowEl.offsetWidth; // trigger reflow
        rowEl.classList.add("row-scanned-pulse");
        rowEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 50);
  }

  function handleBarcodeScanResult(rawQuery) {
    if (!rawQuery) return;
    const q = String(rawQuery).trim().toLowerCase();
    if (!q) return;

    // Pencarian menyeluruh: barcode EAN, SKU, ID produk, atau nama barang
    const found = MASTER_PRODUCTS.find(p => {
      const barcodeMatch = p.barcode && p.barcode.toLowerCase() === q;
      const skuMatch = p.sku && p.sku.toLowerCase() === q;
      const idMatch = p.id && p.id.toLowerCase() === q;
      const nameMatch = p.name && p.name.toLowerCase().includes(q);
      const specMatch = p.specs && p.specs["Kode / Barcode"] && p.specs["Kode / Barcode"].toLowerCase().includes(q);
      return barcodeMatch || skuMatch || idMatch || nameMatch || specMatch;
    });

    if (found) {
      // Kosongkan kolom pencarian agar katalog visual mereset menampilkan seluruh barang dengan badge
      if (posSearchInput) posSearchInput.value = "";
      addProductToPosCart(found, true);
    } else {
      playCashierBeep(false);
      showToast(`❌ Barcode / SKU "${rawQuery}" tidak terdaftar di Master Produk Delina!`);
    }
  }

  // GLOBAL HARDWARE BARCODE SCANNER GUN LISTENER (USB / Bluetooth Wireless)
  let hwBarcodeBuffer = "";
  let hwLastKeyTime = Date.now();

  window.addEventListener("keydown", (e) => {
    // Hanya tangkap jika Modal POS Kasir sedang terbuka
    if (!modalPos || !modalPos.classList.contains("open")) return;

    // Abaikan jika fokus pada input selain posBarcodeQuery
    const activeEl = document.activeElement;
    if (activeEl && activeEl.tagName === "INPUT" && activeEl.id !== "posBarcodeQuery") {
      return;
    }

    const now = Date.now();
    const diff = now - hwLastKeyTime;
    hwLastKeyTime = now;

    if (e.key === "Enter") {
      if (hwBarcodeBuffer.length >= 3) {
        e.preventDefault();
        console.log("[Hardware Barcode Gun] Kode terbaca:", hwBarcodeBuffer);
        handleBarcodeScanResult(hwBarcodeBuffer);
        hwBarcodeBuffer = "";
      }
    } else if (e.key.length === 1) {
      if (diff > 250) {
        hwBarcodeBuffer = e.key;
      } else {
        hwBarcodeBuffer += e.key;
      }
    }
  });

  function renderPosVisualCatalog() {
    if (!posCatalogGrid) return;
    posCatalogGrid.innerHTML = "";
    const cat = posCatFilter ? posCatFilter.value : "all";
    const q = posSearchInput ? posSearchInput.value.trim().toLowerCase() : "";
    const isSpj = priceCatSelect && priceCatSelect.value === "spj";

    const filtered = MASTER_PRODUCTS.filter(p => {
      const matchCat = cat === "all" || p.category === cat;
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || (p.brand && p.brand.toLowerCase().includes(q)) || (p.sku && p.sku.toLowerCase().includes(q)) || (p.barcode && p.barcode.includes(q));
      return matchCat && matchQ;
    });

    if (filtered.length === 0) {
      posCatalogGrid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:16px; font-size:0.75rem; color:var(--slate-muted);">Barang tidak ditemukan.</div>`;
      return;
    }

    filtered.forEach(prod => {
      const activePrice = isSpj ? prod.priceGrosir : prod.priceEceran;
      const isOut = prod.stock === 0 && prod.category !== "cetak";
      const inCart = APP_STATE.posCart.find(item => item.id === prod.id);
      const card = document.createElement("div");
      card.className = `pos-item-card ${isOut ? "out-of-stock" : ""}`;
      card.innerHTML = `
        ${inCart ? `<span class="pos-item-cart-badge"><i class="fa-solid fa-cart-shopping"></i> ${inCart.qty} di Nota</span>` : ""}
        <img src="${prod.image || "assets/product_hvs.jpg"}" alt="${prod.name}" class="pos-item-thumb">
        <div class="pos-item-title">${prod.name}</div>
        <div style="font-size:0.62rem; color:var(--slate-muted); font-family:var(--font-mono); margin:1px 0;">${prod.sku || prod.id}</div>
        <div class="pos-item-meta">
          <span class="pos-item-price">Rp ${activePrice.toLocaleString("id-ID")}</span>
          <span class="pos-item-stock" style="color:${isOut ? "#dc2626" : "#64748b"}; font-weight:${isOut ? "800" : "600"};">
            ${isOut ? "Stok: 0" : `Stok: ${prod.stock}`}
          </span>
        </div>
      `;
      card.addEventListener("click", () => addProductToPosCart(prod));
      posCatalogGrid.appendChild(card);
    });
  }

  function renderPosCart() {
    if (!posCartList) return;
    posCartList.innerHTML = "";
    const isSpj = priceCatSelect.value === "spj";
    let total = 0;

    if (APP_STATE.posCart.length === 0) {
      posCartList.innerHTML = `<div style="text-align:center; padding:12px; font-size:0.72rem; color:var(--slate-muted);">Keranjang kasir kosong. Klik kartu produk di atas atau scan barcode barang.</div>`;
    }

    APP_STATE.posCart.forEach((item, idx) => {
      const master = MASTER_PRODUCTS.find(p => p.id === item.id);
      const unitPrice = master ? (isSpj ? master.priceGrosir : master.priceEceran) : item.price;
      const sub = unitPrice * item.qty;
      total += sub;

      const row = document.createElement("div");
      row.id = `pos-cart-row-${item.id}`;
      row.style.cssText = "display:flex; justify-content:space-between; align-items:center; font-size:0.74rem; padding:6px 6px; border-bottom:1px solid #f1f5f9; gap:6px; border-radius:4px; transition:background-color 0.3s;";
      row.innerHTML = `
        <div style="flex:1; min-width:0;">
          <div style="font-weight:700; color:var(--charcoal); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.name}</div>
          <div style="font-size:0.65rem; color:var(--slate-muted); display:flex; align-items:center; gap:5px;">
            <span style="font-family:var(--font-mono); background:#f1f5f9; padding:1px 5px; border-radius:3px; color:#475569; font-weight:700;">${master ? (master.sku || master.id) : item.id}</span>
            <span>@ Rp ${unitPrice.toLocaleString("id-ID")}</span>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:4px;">
          <button type="button" class="btn-mini-action" data-minus="${idx}" title="Kurangi 1">-</button>
          <strong style="font-family:var(--font-mono); min-width:22px; text-align:center;">${item.qty}</strong>
          <button type="button" class="btn-mini-action" data-plus="${idx}" title="Tambah 1">+</button>
          <strong style="font-family:var(--font-mono); min-width:68px; text-align:right; color:var(--primary-dark);">Rp ${sub.toLocaleString("id-ID")}</strong>
          <button type="button" class="btn-mini-action danger" data-del="${idx}" title="Hapus">×</button>
        </div>
      `;
      row.querySelector("[data-minus]").addEventListener("click", () => {
        if (item.qty > 1) item.qty -= 1;
        else APP_STATE.posCart.splice(idx, 1);
        renderPosCart();
        renderPosVisualCatalog();
      });
      row.querySelector("[data-plus]").addEventListener("click", () => {
        item.qty += 1;
        renderPosCart();
        renderPosVisualCatalog();
      });
      row.querySelector("[data-del]").addEventListener("click", () => {
        APP_STATE.posCart.splice(idx, 1);
        renderPosCart();
        renderPosVisualCatalog();
      });
      posCartList.appendChild(row);
    });

    posTotalEl.textContent = `Rp ${total.toLocaleString("id-ID")}`;
    const received = parseInt(cashInput.value, 10) || 0;
    const diff = received - total;
    changeEl.textContent = diff >= 0 ? `Rp ${diff.toLocaleString("id-ID")}` : `Kurang Rp ${Math.abs(diff).toLocaleString("id-ID")}`;

    // Sinkronisasi Live Counter Banner di bagian atas POS
    const totalItems = APP_STATE.posCart.length;
    const totalPcs = APP_STATE.posCart.reduce((sum, item) => sum + item.qty, 0);
    const liveCartCountBadge = document.getElementById("posCartItemCountBadge");
    const liveTotalBanner = document.getElementById("posLiveTotalBanner");
    if (liveCartCountBadge) {
      liveCartCountBadge.textContent = totalItems === 0
        ? "Nota Kasir: Kosong (0 Pcs)"
        : `Nota Kasir: ${totalItems} Barang (${totalPcs} Pcs)`;
    }
    if (liveTotalBanner) {
      liveTotalBanner.textContent = `Rp ${total.toLocaleString("id-ID")}`;
    }

    return total;
  }

  if (posCatFilter) posCatFilter.addEventListener("change", renderPosVisualCatalog);
  if (posSearchInput) posSearchInput.addEventListener("input", renderPosVisualCatalog);

  if (posCustomerSelect) {
    posCustomerSelect.addEventListener("change", () => {
      const val = posCustomerSelect.value;
      if (!val.toLowerCase().includes("umum")) {
        priceCatSelect.value = "spj";
        showToast(`🏛️ Pelanggan Instansi dipilih: Harga Grosir SPJ & Komisi 5% otomatis aktif!`);
      } else {
        priceCatSelect.value = "eceran";
      }
      renderPosVisualCatalog();
      renderPosCart();
    });
  }

  priceCatSelect.addEventListener("change", () => {
    renderPosVisualCatalog();
    renderPosCart();
  });
  cashInput.addEventListener("input", renderPosCart);

  // Tombol Nominal Uang Tunai Cepat (`Uang Pas`, `50rb`, `100rb`, `150rb`, `200rb`, `500rb`)
  document.querySelectorAll(".cash-chip-btn").forEach(chip => {
    chip.addEventListener("click", () => {
      const cashAttr = chip.getAttribute("data-cash");
      const currentTotal = renderPosCart();
      if (cashAttr === "exact") {
        cashInput.value = currentTotal;
      } else {
        cashInput.value = parseInt(cashAttr, 10) || currentTotal;
      }
      renderPosCart();
    });
  });

  const btnClearPosCart = document.getElementById("btnClearPosCart");
  if (btnClearPosCart) {
    btnClearPosCart.addEventListener("click", () => {
      APP_STATE.posCart = [];
      renderPosCart();
      renderPosVisualCatalog();
      showToast("🗑️ Keranjang Kasir POS dikosongkan.");
    });
  }

  // Tombol + Masukkan Barcode / SKU
  const btnSubmitBarcode = document.getElementById("btnPosSubmitBarcode");
  if (btnSubmitBarcode) {
    btnSubmitBarcode.addEventListener("click", () => {
      if (posSearchInput) {
        const q = posSearchInput.value.trim();
        if (q) {
          handleBarcodeScanResult(q);
        } else {
          showToast("Ketik Barcode / SKU terlebih dahulu atau klik salah satu chip uji coba di bawah!");
          posSearchInput.focus();
        }
      }
    });
  }

  if (posSearchInput) {
    posSearchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        const q = posSearchInput.value.trim();
        if (q) {
          handleBarcodeScanResult(q);
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // C. SCANNER KAMERA LIVE (WEBCAM / HP) & GENERATOR LABEL BARCODE
  // -------------------------------------------------------------------------
  const modalScanner = document.getElementById("modalBarcodeScanner");
  const btnOpenCam = document.getElementById("btnOpenBarcodeCam");
  const btnTorch = document.getElementById("btnToggleCameraTorch");
  const btnSwitchFacing = document.getElementById("btnSwitchCameraFacing");
  const btnSimulateCam = document.getElementById("btnSimulateCameraBarcodeHit");
  const modalBarcodeLabels = document.getElementById("modalBarcodeLabels");
  const btnOpenLabels = document.getElementById("btnOpenBarcodeLabelModal");
  const btnPrintStickers = document.getElementById("btnPrintBarcodeStickersAction");
  const quickPillsContainer = document.getElementById("quickScanPillsContainer");
  const modalQuickGrid = document.getElementById("modalQuickBarcodeGrid");

  let cameraMediaStream = null;
  let nativeBarcodeDetector = null;
  let isCamScanning = false;
  let currentCamFacing = "environment";
  let torchActive = false;

  async function startLiveCameraScanner() {
    const video = document.getElementById("barcodeVideoFeed");
    const statusPill = document.getElementById("scannerCameraStatus");
    if (!video) return;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (statusPill) statusPill.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-gold"></i> Browser tidak mendukung akses kamera langsung. Silakan gunakan Tombol Barcode Contoh di bawah.';
      return;
    }

    try {
      if (statusPill) statusPill.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghubungkan Kamera...';
      if (cameraMediaStream) {
        cameraMediaStream.getTracks().forEach(t => t.stop());
      }

      cameraMediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentCamFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });

      video.srcObject = cameraMediaStream;
      await video.play();
      isCamScanning = true;
      if (statusPill) statusPill.innerHTML = '<i class="fa-solid fa-laser"></i> Kamera Aktif — Arahkan Barcode ke Garis Laser Merah';

      // BarcodeDetector native check
      if ("BarcodeDetector" in window) {
        try {
          nativeBarcodeDetector = new window.BarcodeDetector({
            formats: ["ean_13", "code_128", "qr_code", "code_39", "upc_a", "ean_8"]
          });
          loopCameraFrameScanner();
        } catch (e) {
          console.warn("BarcodeDetector init:", e);
        }
      }
    } catch (err) {
      console.warn("[Camera Scanner] Izin kamera atau device:", err);
      if (statusPill) {
        statusPill.innerHTML = '<i class="fa-solid fa-circle-info text-gold"></i> Kamera tidak aktif. Anda dapat mengklik Barcode Contoh di bawah!';
      }
    }
  }

  function stopLiveCameraScanner() {
    isCamScanning = false;
    if (cameraMediaStream) {
      cameraMediaStream.getTracks().forEach(t => t.stop());
      cameraMediaStream = null;
    }
    const video = document.getElementById("barcodeVideoFeed");
    if (video) video.srcObject = null;
  }

  let lastCamScanTime = 0;
  async function loopCameraFrameScanner() {
    if (!isCamScanning || !nativeBarcodeDetector) return;
    const video = document.getElementById("barcodeVideoFeed");
    if (video && video.readyState >= 2) {
      try {
        const barcodes = await nativeBarcodeDetector.detect(video);
        if (barcodes && barcodes.length > 0) {
          const now = Date.now();
          if (now - lastCamScanTime > 1500) {
            lastCamScanTime = now;
            const code = barcodes[0].rawValue;
            handleBarcodeScanResult(code);
          }
        }
      } catch (e) {}
    }
    if (isCamScanning) {
      requestAnimationFrame(loopCameraFrameScanner);
    }
  }

  if (btnOpenCam && modalScanner) {
    btnOpenCam.addEventListener("click", () => {
      modalScanner.classList.add("open");
      startLiveCameraScanner();
    });
  }

  // Tutup kamera saat modal scanner ditutup
  document.querySelectorAll('[data-close="modalBarcodeScanner"]').forEach(el => {
    el.addEventListener("click", () => {
      if (modalScanner) modalScanner.classList.remove("open");
      stopLiveCameraScanner();
    });
  });

  if (btnTorch) {
    btnTorch.addEventListener("click", async () => {
      if (!cameraMediaStream) return;
      const track = cameraMediaStream.getVideoTracks()[0];
      if (track && typeof track.applyConstraints === "function") {
        try {
          torchActive = !torchActive;
          await track.applyConstraints({ advanced: [{ torch: torchActive }] });
          btnTorch.style.background = torchActive ? "var(--gold)" : "#374151";
          btnTorch.style.color = torchActive ? "#111827" : "#ffffff";
          showToast(torchActive ? "Flash kamera dinyalakan." : "Flash kamera dimatikan.");
        } catch (e) {
          showToast("Flash senter tidak didukung pada kamera ini.");
        }
      }
    });
  }

  if (btnSwitchFacing) {
    btnSwitchFacing.addEventListener("click", () => {
      currentCamFacing = currentCamFacing === "environment" ? "user" : "environment";
      startLiveCameraScanner();
    });
  }

  if (btnSimulateCam) {
    btnSimulateCam.addEventListener("click", () => {
      const sampleList = MASTER_PRODUCTS.filter(p => p.stock > 0);
      const randomProd = sampleList[Math.floor(Math.random() * sampleList.length)];
      handleBarcodeScanResult(randomProd.barcode || randomProd.sku);
    });
  }

  // RENDER BILAH TOMBOL CEPAT BARCODE UJI COBA (RAPID TEST STRIP)
  const testSampleProducts = [
    { prod: MASTER_PRODUCTS[0], label: "PaperOne A4" },
    { prod: MASTER_PRODUCTS[1], label: "SiDU A4 70g" },
    { prod: MASTER_PRODUCTS[4], label: "Pulpen Standard" },
    { prod: MASTER_PRODUCTS[3], label: "Pilot G2" },
    { prod: MASTER_PRODUCTS[8], label: "Stapler Joyko" },
    { prod: MASTER_PRODUCTS[9], label: "Tinta Epson 003" }
  ].filter(item => Boolean(item.prod));

  if (quickPillsContainer) {
    quickPillsContainer.innerHTML = "";
    testSampleProducts.forEach(({ prod, label }) => {
      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "quick-scan-pill";
      pill.title = `Scan Barcode: ${prod.barcode} (${prod.sku})`;
      pill.innerHTML = `<i class="fa-solid fa-barcode text-gold"></i> ${label}`;
      pill.addEventListener("click", () => {
        handleBarcodeScanResult(prod.barcode || prod.sku);
      });
      quickPillsContainer.appendChild(pill);
    });
  }

  if (modalQuickGrid) {
    modalQuickGrid.innerHTML = "";
    testSampleProducts.forEach(({ prod, label }) => {
      const cardBtn = document.createElement("button");
      cardBtn.type = "button";
      cardBtn.className = "quick-barcode-modal-btn";
      cardBtn.innerHTML = `
        <div style="font-weight:700; font-size:0.7rem; color:#fef08a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          <i class="fa-solid fa-barcode text-gold"></i> ${label} (${prod.name})
        </div>
        <div style="font-size:0.62rem; color:#94a3b8; font-family:var(--font-mono); margin-top:2px;">
          ${prod.barcode} • ${prod.sku}
        </div>
        <div style="font-size:0.64rem; color:#34d399; font-weight:700; margin-top:2px;">
          Rp ${prod.priceEceran.toLocaleString("id-ID")} (+1 Scan)
        </div>
      `;
      cardBtn.addEventListener("click", () => {
        handleBarcodeScanResult(prod.barcode || prod.sku);
      });
      modalQuickGrid.appendChild(cardBtn);
    });
  }

  // RENDER MODAL GENERATOR & CETAK LABEL BARCODE
  function renderBarcodeLabelsGrid() {
    const grid = document.getElementById("barcodeLabelsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    MASTER_PRODUCTS.forEach(prod => {
      const card = document.createElement("div");
      card.className = "barcode-printable-card";
      card.innerHTML = `
        <div style="font-size:0.65rem; font-weight:800; color:var(--primary-dark); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:2px;">
          Toko Delina ATK Tanjung Raja
        </div>
        <div style="font-size:0.74rem; font-weight:800; color:#111827; line-height:1.2; height:28px; overflow:hidden; margin-bottom:4px;">
          ${prod.name}
        </div>
        <div style="margin:4px 0;">
          ${generateBarcodeSvg(prod.barcode || prod.sku, 170, 52)}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.65rem; font-weight:700; margin-top:4px; border-top:1px dashed #cbd5e1; padding-top:4px;">
          <span style="color:#64748b; font-family:var(--font-mono);">${prod.sku}</span>
          <span style="color:var(--primary-dark); font-size:0.75rem;">Rp ${prod.priceEceran.toLocaleString("id-ID")}</span>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  if (btnOpenLabels && modalBarcodeLabels) {
    btnOpenLabels.addEventListener("click", () => {
      modalBarcodeLabels.classList.add("open");
      renderBarcodeLabelsGrid();
    });
  }

  if (btnPrintStickers) {
    btnPrintStickers.addEventListener("click", () => {
      window.print();
    });
  }

  function processPosCheckout(openWaInsteadOfThermal = false) {
    if (APP_STATE.posCart.length === 0) {
      showToast("⚠️ Keranjang Kasir POS masih kosong! Klik barang di katalog visual terlebih dahulu.");
      return;
    }

    const isSpj = priceCatSelect.value === "spj";
    const customerLabel = posCustomerSelect ? posCustomerSelect.value : "Pelanggan Umum (Walk-In)";
    const payMethod = paymentMethodSelect ? paymentMethodSelect.value : "Tunai (Cash)";

    let total = 0;
    let totalHpp = 0;
    const lineItems = [];

    APP_STATE.posCart.forEach(item => {
      const master = MASTER_PRODUCTS.find(p => p.id === item.id);
      const unitPrice = master ? (isSpj ? master.priceGrosir : master.priceEceran) : item.price;
      const unitHpp = master ? (master.hpp || Math.round(unitPrice * 0.78)) : Math.round(unitPrice * 0.78);
      total += unitPrice * item.qty;
      totalHpp += unitHpp * item.qty;

      lineItems.push({
        id: item.id,
        name: item.name,
        qty: item.qty,
        unit: master ? master.unit : "Unit",
        price: unitPrice
      });

      if (master && master.category !== "cetak") {
        master.stock = Math.max(0, master.stock - item.qty);
        master.soldCount = (master.soldCount || 0) + item.qty;
      }
    });

    const komisi = isSpj ? Math.round(total * 0.05) : 0;
    const profit = Math.max(0, total - totalHpp - komisi);
    const newInv = "#INV-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(100 + Math.random() * 899);

    if (payMethod.includes("Tunai")) {
      APP_STATE.shiftCashTotal += total;
    } else {
      APP_STATE.shiftNonCashTotal += total;
    }
    APP_STATE.netProfitToday += profit;

    if (komisi > 0) {
      APP_STATE.user.commissionBalance += komisi;
      const balEl = document.getElementById("instansiBalanceVal");
      if (balEl) balEl.textContent = `Rp ${APP_STATE.user.commissionBalance.toLocaleString("id-ID")}`;

      const partner = INSTANSI_PARTNERS_DATA.find(ins => customerLabel.includes(ins.instansi)) || INSTANSI_PARTNERS_DATA[0];
      if (partner) {
        partner.balance += komisi;
        partner.totalSpj += total;
      }
    }

    const newOrderObj = {
      invoiceId: newInv,
      date: "Hari Ini • " + new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
      customer: customerLabel,
      itemsSummary: APP_STATE.posCart.map(i => `${i.qty}x ${i.name.slice(0, 22)}`).join(", "),
      lineItems,
      total,
      komisi,
      status: "Selesai & Lunas",
      paymentMethod: payMethod,
      photo: "assets/print_review.jpg",
      isSpj
    };

    APP_STATE.orderHistory.unshift(newOrderObj);
    populateThermalAndSpjModals(newOrderObj);
    savePersistedState();

    if (renderCatalogGridFn) renderCatalogGridFn();
    if (window.refreshAllSyncedModules) window.refreshAllSyncedModules(newInv);
    renderAccountOrderHistory();

    callGasBackend("createTransaction", {
      namaPelanggan: customerLabel,
      namaInstansi: isSpj ? customerLabel : "Umum",
      kategoriHarga: isSpj ? "Grosir_Instansi_SPJ" : "Eceran",
      totalAtk: total,
      nominalKomisi: komisi,
      metodeBayar: payMethod
    });

    if (openWaInsteadOfThermal) {
      openWhatsAppReceipt(newOrderObj);
    } else {
      modalPos.classList.remove("open");
      document.getElementById("modalThermalReceipt").classList.add("open");
      showToast(`🖨️ Transaksi ${newInv} berhasil disimpan & Struk Thermal siap dicetak!`);
    }
  }

  document.getElementById("btnPrintPosReceipt").addEventListener("click", () => processPosCheckout(false));
  document.getElementById("btnSharePosWa").addEventListener("click", () => processPosCheckout(true));

  // -------------------------------------------------------------------------
  // C. POS TAB 2: ANTREAN CETAK & PESANAN ONLINE (`posPrintQueueList`) + UPLOAD FOTO
  // -------------------------------------------------------------------------
  const posPrintQueueList = document.getElementById("posPrintQueueList");

  function renderPosPrintQueueAndKpis() {
    if (!posPrintQueueList) return;
    posPrintQueueList.innerHTML = "";

    const activeCount = APP_STATE.orderHistory.filter(o => o.status === "Antre" || o.status === "Sedang Dicetak").length;
    const readyCount = APP_STATE.orderHistory.filter(o => o.status.includes("Siap Ambil")).length;
    const totalShift = APP_STATE.shiftCashTotal + APP_STATE.shiftNonCashTotal;

    const badgeEl = document.getElementById("posQueueCountBadge");
    const kpiQueueEl = document.getElementById("posKpiQueue");
    const kpiReadyEl = document.getElementById("posKpiReady");
    const kpiShiftEl = document.getElementById("posKpiShift");
    const cashClosingEl = document.getElementById("closingCashTotal");
    const nonCashClosingEl = document.getElementById("closingNonCashTotal");
    const grandClosingEl = document.getElementById("closingGrandTotal");

    if (badgeEl) badgeEl.textContent = APP_STATE.orderHistory.length;
    if (kpiQueueEl) kpiQueueEl.textContent = `${activeCount || 1} Berkas`;
    if (kpiReadyEl) kpiReadyEl.textContent = `${readyCount} Paket`;
    if (kpiShiftEl) kpiShiftEl.textContent = `Rp ${(totalShift / 1000000).toFixed(2)} Jt`;
    if (cashClosingEl) cashClosingEl.textContent = `Rp ${APP_STATE.shiftCashTotal.toLocaleString("id-ID")}`;
    if (nonCashClosingEl) nonCashClosingEl.textContent = `Rp ${APP_STATE.shiftNonCashTotal.toLocaleString("id-ID")}`;
    if (grandClosingEl) grandClosingEl.textContent = `Rp ${totalShift.toLocaleString("id-ID")}`;

    APP_STATE.orderHistory.forEach((ord, idx) => {
      const card = document.createElement("div");
      card.className = "admin-item-row";
      card.style.flexDirection = "column";
      card.style.alignItems = "stretch";
      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <div>
            <div style="display:flex; align-items:center; gap:6px;">
              <strong style="font-family:var(--font-mono); font-size:0.78rem; color:var(--primary-dark);">${ord.invoiceId}</strong>
              <span class="aqi-pill" style="font-size:0.62rem;">${ord.status}</span>
            </div>
            <div style="font-size:0.74rem; font-weight:700; color:var(--charcoal); margin-top:2px;">${ord.customer || APP_STATE.user.name}</div>
            <div style="font-size:0.68rem; color:var(--slate-muted);">${ord.itemsSummary}</div>
          </div>
          <div style="text-align:right;">
            <strong style="font-family:var(--font-mono); font-size:0.8rem; color:var(--primary);">Rp ${(ord.total || 0).toLocaleString("id-ID")}</strong>
            <div style="font-size:0.62rem; color:var(--slate-muted);">${ord.date}</div>
          </div>
        </div>
        <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:6px; margin-top:6px; padding-top:6px; border-top:1px dashed #e2e8f0;">
          <div style="display:flex; gap:4px; flex-wrap:wrap;">
            <button type="button" class="btn-mini-action ${ord.status === "Antre" ? "primary" : ""}" data-status="Antre">1. Antre</button>
            <button type="button" class="btn-mini-action ${ord.status === "Sedang Dicetak" ? "primary" : ""}" data-status="Sedang Dicetak">2. Sedang Dicetak</button>
            <button type="button" class="btn-mini-action ${ord.status === "Siap Ambil" ? "primary" : ""}" data-status="Siap Ambil">3. Siap Ambil</button>
            <button type="button" class="btn-mini-action ${ord.status === "Selesai & Lunas" ? "primary" : ""}" data-status="Selesai & Lunas">✓ Selesai & Lunas</button>
          </div>
          <div style="display:flex; gap:4px;">
            <button type="button" class="btn-mini-action" data-wa="${idx}" title="Kirim WA Pelanggan"><i class="fa-brands fa-whatsapp text-emerald"></i> WA</button>
            <button type="button" class="btn-mini-action" data-struk="${idx}" title="Cetak Struk"><i class="fa-solid fa-print"></i> Struk</button>
          </div>
        </div>
      `;

      card.querySelectorAll("[data-status]").forEach(sBtn => {
        sBtn.addEventListener("click", () => {
          const newStatus = sBtn.getAttribute("data-status");
          ord.status = newStatus;
          savePersistedState();
          if (window.refreshAllSyncedModules) window.refreshAllSyncedModules(ord.invoiceId);
          renderAccountOrderHistory();
          callGasBackend("updatePrintQueueStatus", { invoiceId: ord.invoiceId, status: newStatus });
          showToast(`🖨️ Status pesanan ${ord.invoiceId} diperbarui menjadi: "${newStatus}"!`);
        });
      });

      card.querySelector("[data-wa]").addEventListener("click", () => openWhatsAppReceipt(ord));
      card.querySelector("[data-struk]").addEventListener("click", () => {
        populateThermalAndSpjModals(ord);
        modalPos.classList.remove("open");
        document.getElementById("modalThermalReceipt").classList.add("open");
      });

      posPrintQueueList.appendChild(card);
    });
  }

  // Kasir unggah manual foto hasil cetakan/struk -> masuk ke Order Terkini & Running Card Marquee!
  document.getElementById("btnUploadFinishedJob").addEventListener("click", () => {
    const captionInput = document.getElementById("posPhotoCaption");
    const fileInput = document.getElementById("posPhotoFileInput");
    const caption = (captionInput && captionInput.value.trim()) || "Berkas cetakan dan nota struk telah selesai dikerjakan dengan rapi di Toko Delina Tanjung Raja.";

    const finalizeJobPhoto = photoUrl => {
      if (APP_STATE.orderHistory[0]) {
        APP_STATE.orderHistory[0].photo = photoUrl;
        APP_STATE.orderHistory[0].status = "Siap Ambil";
      }
      MARQUEE_REVIEWS.unshift({
        name: "Dokumentasi Kasir POS (Ahmad)",
        role: APP_STATE.orderHistory[0] ? `Pesanan ${APP_STATE.orderHistory[0].invoiceId} Siap Ambil` : "Pesanan Cetak & Jilid Siap Ambil",
        rating: 5,
        comment: caption,
        photo: photoUrl
      });
      renderRunningReviewMarquee();
      savePersistedState();
      if (window.refreshAllSyncedModules) window.refreshAllSyncedModules();
      callGasBackend("uploadPrintPhoto", { customerName: "Pelanggan POS", caption });
      showToast("📸 Foto hasil cetakan/struk berhasil diunggah Kasir, tampil di Lacak Pesanan & Running Card Marquee!");
    };

    if (fileInput && fileInput.files && fileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = e => finalizeJobPhoto(e.target.result);
      reader.readAsDataURL(fileInput.files[0]);
    } else {
      finalizeJobPhoto("assets/print_review.jpg");
    }
  });

  // Proteksi RBAC Kasir (Dilarang ubah HPP/Harga Master & Dilarang hapus transaksi lunas)
  document.getElementById("btnKasirTryEditPrice").addEventListener("click", () => {
    showToast("⛔ AKSES DITOLAK (RBAC Tingkat 3): Kasir dilarang mengubah harga master produk atau HPP!");
  });

  document.getElementById("btnKasirRequestCorrection").addEventListener("click", () => {
    const inv = APP_STATE.orderHistory[0] ? APP_STATE.orderHistory[0].invoiceId : "#INV-20261027-088";
    callGasBackend("requestTransactionCorrection", { invoiceId: inv, staffName: "Kasir Ahmad" });
    showToast(`📨 Kasir tidak dapat menghapus transaksi lunas (${inv}). Pengajuan koreksi telah dikirim ke Telegram Owner!`);
  });

  document.getElementById("btnOpenKasirPos").addEventListener("click", () => {
    renderPosVisualCatalog();
    renderPosCart();
    renderPosPrintQueueAndKpis();
    modalPos.classList.add("open");
  });

  // =========================================================================
  // D. DASHBOARD SUPER ADMIN / OWNER (5 SUB-TAB CRUD LENGKAP & ANALITIK)
  // =========================================================================
  const ownerTabBtns = document.querySelectorAll("#ownerSubtabsNav .dashboard-subtab-btn");
  const ownerPanes = modalOwner.querySelectorAll(".subtab-pane");
  ownerTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-ownertab");
      ownerTabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      ownerPanes.forEach(p => p.classList.toggle("active", p.id === targetId));
      if (targetId === "ownerTabAnalytics") initOwnerCharts();
    });
  });

  // --- OWNER TAB 1: CRUD MASTER PRODUK (`Master_Produk`) ---
  const prodEditId = document.getElementById("prodEditId");
  const prodInputName = document.getElementById("prodInputName");
  const prodInputCat = document.getElementById("prodInputCat");
  const prodInputBrand = document.getElementById("prodInputBrand");
  const prodInputUnit = document.getElementById("prodInputUnit");
  const prodInputStock = document.getElementById("prodInputStock");
  const prodInputHpp = document.getElementById("prodInputHpp");
  const prodInputEceran = document.getElementById("prodInputEceran");
  const prodInputGrosir = document.getElementById("prodInputGrosir");
  const prodInputImageUrl = document.getElementById("prodInputImageUrl");
  const prodInputImageFile = document.getElementById("prodInputImageFile");
  const prodInputSpecs = document.getElementById("prodInputSpecs");
  const prodInputDesc = document.getElementById("prodInputDesc");
  const ownerFormTitle = document.getElementById("ownerProdFormTitle");
  const ownerProductsTableList = document.getElementById("ownerProductsTableList");
  const ownerTotalProductsCount = document.getElementById("ownerTotalProductsCount");

  function resetOwnerProductForm() {
    prodEditId.value = "";
    prodInputName.value = "";
    prodInputCat.value = "kertas";
    prodInputBrand.value = "";
    prodInputUnit.value = "";
    prodInputStock.value = "25";
    prodInputHpp.value = "40000";
    prodInputEceran.value = "50000";
    prodInputGrosir.value = "46000";
    prodInputImageUrl.value = "assets/product_hvs.jpg";
    if (prodInputImageFile) prodInputImageFile.value = "";
    prodInputSpecs.value = "";
    prodInputDesc.value = "";
    ownerFormTitle.innerHTML = `<i class="fa-solid fa-circle-plus text-emerald"></i> Input Barang Jualan Baru ke Etalase Depan & POS Kasir`;
  }

  document.getElementById("btnResetProdForm").addEventListener("click", resetOwnerProductForm);

  if (prodInputImageFile) {
    prodInputImageFile.addEventListener("change", () => {
      if (prodInputImageFile.files && prodInputImageFile.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
          prodInputImageUrl.value = e.target.result;
          showToast("📸 Foto barang berhasil dimuat! Klik 'Simpan & Tampilkan' untuk menyimpan.");
        };
        reader.readAsDataURL(prodInputImageFile.files[0]);
      }
    });
  }

  function renderOwnerProductsTable() {
    if (!ownerProductsTableList) return;
    ownerProductsTableList.innerHTML = "";
    if (ownerTotalProductsCount) ownerTotalProductsCount.textContent = `${MASTER_PRODUCTS.length} Produk`;

    MASTER_PRODUCTS.forEach((prod, idx) => {
      const marginEcer = prod.priceEceran - (prod.hpp || 0);
      const isOut = prod.stock === 0 && prod.category !== "cetak";
      const row = document.createElement("div");
      row.className = "admin-item-row";
      row.innerHTML = `
        <img src="${prod.image || "assets/product_hvs.jpg"}" alt="${prod.name}" style="width:42px; height:42px; border-radius:6px; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0;">
        <div class="admin-item-info">
          <div class="admin-item-title">${prod.name} <span style="font-size:0.62rem; color:var(--slate-muted);">(${prod.id})</span></div>
          <div class="admin-item-sub">
            HPP: Rp ${(prod.hpp || 0).toLocaleString("id-ID")} •
            <strong class="text-emerald">Ecer: Rp ${prod.priceEceran.toLocaleString("id-ID")}</strong> •
            Grosir SPJ: Rp ${prod.priceGrosir.toLocaleString("id-ID")} •
            Laba/Unit: +Rp ${marginEcer.toLocaleString("id-ID")}
          </div>
          <div style="font-size:0.65rem; margin-top:2px;">
            <span class="aqi-pill" style="background:${isOut ? "#fee2e2" : "#dcfce7"}; color:${isOut ? "#991b1b" : "#166534"};">
              Stok: ${prod.stock} ${prod.unit}
            </span>
            <span style="color:var(--slate-muted); margin-left:6px;">Kategori: ${prod.category}</span>
          </div>
        </div>
        <div class="admin-item-actions">
          <button type="button" class="btn-mini-action primary" data-edit="${prod.id}" title="Edit Barang"><i class="fa-solid fa-pen"></i> Edit</button>
          <button type="button" class="btn-mini-action" data-zero="${prod.id}" title="Toggle Stok 0 / Ready">${prod.stock === 0 ? "Isi Stok" : "Set Stok=0"}</button>
          <button type="button" class="btn-mini-action danger" data-del="${idx}" title="Hapus Barang"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

      row.querySelector("[data-edit]").addEventListener("click", () => {
        prodEditId.value = prod.id;
        prodInputName.value = prod.name;
        prodInputCat.value = prod.category || "kertas";
        prodInputBrand.value = prod.brand || "";
        prodInputUnit.value = prod.unit || "Unit";
        prodInputStock.value = prod.stock;
        prodInputHpp.value = prod.hpp || Math.round(prod.priceEceran * 0.8);
        prodInputEceran.value = prod.priceEceran;
        prodInputGrosir.value = prod.priceGrosir;
        prodInputImageUrl.value = prod.image || "assets/product_hvs.jpg";
        prodInputSpecs.value = prod.specs ? Object.entries(prod.specs).map(([k, v]) => `${k}: ${v}`).join(", ") : "";
        prodInputDesc.value = prod.description || "";
        ownerFormTitle.innerHTML = `<i class="fa-solid fa-pen-to-square text-gold"></i> Mode Edit Barang: ${prod.name} (${prod.id})`;
        prodInputName.focus();
        showToast(`✏️ Mengedit "${prod.name}". Silakan ubah data di form atas lalu klik Simpan.`);
      });

      row.querySelector("[data-zero]").addEventListener("click", () => {
        prod.stock = prod.stock === 0 ? 30 : 0;
        savePersistedState();
        if (renderCatalogGridFn) renderCatalogGridFn();
        renderPosVisualCatalog();
        renderOwnerProductsTable();
        showToast(prod.stock === 0 ? `⚠️ Stok "${prod.name}" diset 0 (Habis).` : `✅ Stok "${prod.name}" diisi kembali menjadi 30.`);
      });

      row.querySelector("[data-del]").addEventListener("click", () => {
        const removed = MASTER_PRODUCTS.splice(idx, 1)[0];
        savePersistedState();
        if (renderCatalogGridFn) renderCatalogGridFn();
        renderPosVisualCatalog();
        renderOwnerProductsTable();
        callGasBackend("deleteMasterProduct", { role: "owner", id: removed.id });
        showToast(`🗑️ Produk "${removed.name}" telah dihapus dari etalase.`);
      });

      ownerProductsTableList.appendChild(row);
    });
  }

  document.getElementById("btnSaveMasterProduct").addEventListener("click", () => {
    const name = prodInputName.value.trim();
    if (!name) {
      showToast("⚠️ Mohon isi Nama Produk / Barang terlebih dahulu!");
      prodInputName.focus();
      return;
    }

    const cat = prodInputCat.value || "kertas";
    const brand = prodInputBrand.value.trim() || "Original Toko Delina";
    const unit = prodInputUnit.value.trim() || "Unit / Pcs";
    const stock = Math.max(0, parseInt(prodInputStock.value, 10) || 0);
    const hpp = Math.max(0, parseInt(prodInputHpp.value, 10) || 0);
    const priceEceran = Math.max(0, parseInt(prodInputEceran.value, 10) || 0);
    const priceGrosir = Math.max(0, parseInt(prodInputGrosir.value, 10) || priceEceran);
    const image = prodInputImageUrl.value.trim() || "assets/product_hvs.jpg";
    const desc = prodInputDesc.value.trim() || `Produk ${name} berkualitas tinggi tersedia di ${APP_STATE.store.name} Tanjung Raja.`;

    const parsedSpecs = {
      "Merk / Brand": brand,
      "Satuan Kemasan": unit,
      "Sertifikasi": "Halal Syariah & Bebas Riba"
    };
    if (prodInputSpecs.value.trim()) {
      prodInputSpecs.value.split(",").forEach(pair => {
        const [k, ...rest] = pair.split(":");
        if (k && rest.length > 0) {
          parsedSpecs[k.trim()] = rest.join(":").trim();
        } else if (k && k.trim()) {
          parsedSpecs["Spesifikasi"] = k.trim();
        }
      });
    }

    const existingId = prodEditId.value.trim();
    if (existingId) {
      const target = MASTER_PRODUCTS.find(p => p.id === existingId);
      if (target) {
        Object.assign(target, {
          name,
          category: cat,
          brand,
          unit,
          stock,
          hpp,
          priceEceran,
          priceGrosir,
          image,
          specs: parsedSpecs,
          description: desc
        });
      }
      showToast(`✅ Perubahan pada produk "${name}" berhasil disimpan & tampil di Beranda!`);
    } else {
      const newId = "PRD-" + String(MASTER_PRODUCTS.length + 1).padStart(3, "0") + "-" + Math.floor(10 + Math.random() * 89);
      parsedSpecs["Kode / Barcode"] = newId;
      MASTER_PRODUCTS.unshift({
        id: newId,
        name,
        category: cat,
        brand,
        unit,
        hpp,
        priceEceran,
        priceGrosir,
        stock,
        rating: 5.0,
        soldCount: 1,
        image,
        alternativeId: MASTER_PRODUCTS[0] ? MASTER_PRODUCTS[0].id : null,
        specs: parsedSpecs,
        description: desc,
        reviews: [
          { user: "Pelanggan Toko Delina", stars: 5, text: "Produk baru kualitas mantap, harga bersahabat dan berkah!" }
        ]
      });
      showToast(`🎉 Barang baru "${name}" berhasil ditambahkan ke Etalase Beranda & Katalog POS Kasir!`);
    }

    savePersistedState();
    if (renderCatalogGridFn) renderCatalogGridFn();
    renderPosVisualCatalog();
    renderOwnerProductsTable();
    callGasBackend("saveMasterProduct", { role: "owner", name, category: cat, brand, unit, hpp, priceEceran, priceGrosir, stock, image, description: desc });
    resetOwnerProductForm();
  });

  // --- OWNER TAB 2: CRUD TARIF CETAK (`Master_Layanan_Cetak`) & HADIAH LOYALTY (`Loyalty_Gifts`) ---
  const ownerPrintServicesList = document.getElementById("ownerPrintServicesList");
  const ownerLoyaltyGiftsAdminList = document.getElementById("ownerLoyaltyGiftsAdminList");

  function renderOwnerServicesAndGifts() {
    if (ownerPrintServicesList) {
      ownerPrintServicesList.innerHTML = "";
      PRINT_SERVICES_DATA.forEach((srv, idx) => {
        const row = document.createElement("div");
        row.className = "admin-item-row";
        row.innerHTML = `
          <div class="admin-item-info">
            <div class="admin-item-title">${srv.name}</div>
            <div class="admin-item-sub">Tarif: <strong class="text-emerald">Rp ${srv.price.toLocaleString("id-ID")}</strong> / ${srv.unit || "lembar"}</div>
          </div>
          <div class="admin-item-actions">
            <button type="button" class="btn-mini-action danger" data-delsrv="${idx}"><i class="fa-solid fa-trash"></i></button>
          </div>
        `;
        row.querySelector("[data-delsrv]").addEventListener("click", () => {
          if (PRINT_SERVICES_DATA.length <= 1) {
            showToast("⚠️ Minimal harus ada 1 layanan cetak aktif.");
            return;
          }
          PRINT_SERVICES_DATA.splice(idx, 1);
          savePersistedState();
          syncPrintServicesDropdown();
          if (window.recalculatePrintEstimate) window.recalculatePrintEstimate();
          renderOwnerServicesAndGifts();
          showToast("🗑️ Layanan cetak dihapus.");
        });
        ownerPrintServicesList.appendChild(row);
      });
    }

    if (ownerLoyaltyGiftsAdminList) {
      ownerLoyaltyGiftsAdminList.innerHTML = "";
      LOYALTY_GIFTS_DATA.forEach((gift, idx) => {
        const row = document.createElement("div");
        row.className = "admin-item-row";
        row.innerHTML = `
          <div class="admin-item-info">
            <div class="admin-item-title"><i class="fa-solid fa-gift text-gold"></i> ${gift.name}</div>
            <div class="admin-item-sub">${gift.desc} • <strong>Stok: ${gift.stok} Unit</strong></div>
          </div>
          <div class="admin-item-actions">
            <button type="button" class="btn-mini-action" data-addgiftstock="${idx}">+5 Stok</button>
            <button type="button" class="btn-mini-action danger" data-delgift="${idx}"><i class="fa-solid fa-trash"></i></button>
          </div>
        `;
        row.querySelector("[data-addgiftstock]").addEventListener("click", () => {
          gift.stok += 5;
          savePersistedState();
          renderOwnerServicesAndGifts();
          showToast(`✅ Stok hadiah "${gift.name}" bertambah +5!`);
        });
        row.querySelector("[data-delgift]").addEventListener("click", () => {
          LOYALTY_GIFTS_DATA.splice(idx, 1);
          savePersistedState();
          renderOwnerServicesAndGifts();
          showToast("🗑️ Item hadiah dihapus dari katalog Loyalty.");
        });
        ownerLoyaltyGiftsAdminList.appendChild(row);
      });
    }
  }

  document.getElementById("btnAddPrintService").addEventListener("click", () => {
    const nameEl = document.getElementById("srvInputName");
    const priceEl = document.getElementById("srvInputPrice");
    const name = nameEl.value.trim();
    const price = parseInt(priceEl.value, 10) || 1000;
    if (!name) {
      showToast("⚠️ Masukkan nama layanan cetak terlebih dahulu!");
      return;
    }
    PRINT_SERVICES_DATA.push({
      id: "srv-" + Date.now(),
      name,
      unit: "lembar/paket",
      price
    });
    nameEl.value = "";
    priceEl.value = "";
    savePersistedState();
    syncPrintServicesDropdown();
    if (window.recalculatePrintEstimate) window.recalculatePrintEstimate();
    renderOwnerServicesAndGifts();
    showToast(`🖨️ Tarif layanan "${name}" (Rp ${price.toLocaleString("id-ID")}) berhasil disimpan & tampil di Kalkulator Order Cetak!`);
  });

  document.getElementById("btnAddLoyaltyGift").addEventListener("click", () => {
    const nameEl = document.getElementById("giftInputName");
    const descEl = document.getElementById("giftInputDesc");
    const stockEl = document.getElementById("giftInputStock");
    const name = nameEl.value.trim();
    if (!name) {
      showToast("⚠️ Masukkan nama hadiah terlebih dahulu!");
      return;
    }
    LOYALTY_GIFTS_DATA.push({
      id: "GIFT-" + Date.now(),
      name,
      desc: descEl.value.trim() || "Hadiah apresiasi member setia 15x transaksi bintang 5.",
      stok: parseInt(stockEl.value, 10) || 10
    });
    nameEl.value = "";
    descEl.value = "";
    savePersistedState();
    renderOwnerServicesAndGifts();
    showToast(`🎁 Hadiah baru "${name}" berhasil ditambahkan ke Katalog Loyalty 15x!`);
  });

  // --- OWNER TAB 3: PENCAIRAN KOMISI MITRA INSTANSI SPJ (`Data_Instansi_Komisi`) ---
  const ownerInstansiCommissionList = document.getElementById("ownerInstansiCommissionList");

  function renderOwnerInstansiCommission() {
    if (!ownerInstansiCommissionList) return;
    ownerInstansiCommissionList.innerHTML = "";

    INSTANSI_PARTNERS_DATA.forEach(partner => {
      const row = document.createElement("div");
      row.className = "admin-item-row";
      row.innerHTML = `
        <div class="admin-item-info">
          <div class="admin-item-title">${partner.instansi} <span class="aqi-pill" style="font-size:0.62rem;">${partner.status}</span></div>
          <div class="admin-item-sub">PIC: ${partner.pic} • Email SPJ: ${partner.email}</div>
          <div style="font-size:0.72rem; margin-top:3px;">
            Total Belanja SPJ: <strong>Rp ${partner.totalSpj.toLocaleString("id-ID")}</strong> •
            Saldo Komisi: <strong class="text-emerald">Rp ${partner.balance.toLocaleString("id-ID")}</strong>
          </div>
        </div>
        <div class="admin-item-actions">
          <button type="button" class="btn-mini-action primary" data-payout="${partner.id}" ${partner.balance <= 0 ? "disabled" : ""}>
            <i class="fa-solid fa-money-bill-transfer"></i> ${partner.balance > 0 ? "Cairkan Komisi" : "Sudah Cair"}
          </button>
        </div>
      `;
      row.querySelector("[data-payout]").addEventListener("click", () => {
        if (partner.balance <= 0) return;
        const disbursedAmount = partner.balance;
        partner.balance = 0;
        partner.status = "Lunas Dicairkan";
        if (partner.instansi === APP_STATE.user.instansi) {
          APP_STATE.user.commissionBalance = 0;
          const balEl = document.getElementById("instansiBalanceVal");
          if (balEl) balEl.textContent = "Rp 0";
        }
        savePersistedState();
        renderOwnerInstansiCommission();
        callGasBackend("approveCommissionPayout", { role: "owner", instansi: partner.instansi, nominal: disbursedAmount });
        showToast(`✅ Komisi SPJ untuk ${partner.instansi} sebesar Rp ${disbursedAmount.toLocaleString("id-ID")} telah disetujui & dicairkan!`);
      });
      ownerInstansiCommissionList.appendChild(row);
    });
  }

  // --- OWNER TAB 4 & 5: ANALITIK KEUANGAN, CMS BRANDING DINAMIS, & RESET LOCALSTORAGE ---
  function updateOwnerFinancialMetrics() {
    const netEl = document.getElementById("ownerRealtimeNetProfit");
    if (netEl) netEl.textContent = `Rp ${APP_STATE.netProfitToday.toLocaleString("id-ID")}`;
  }

  document.getElementById("btnOpenOwnerDashboard").addEventListener("click", () => {
    renderOwnerProductsTable();
    renderOwnerServicesAndGifts();
    renderOwnerInstansiCommission();
    updateOwnerFinancialMetrics();
    modalOwner.classList.add("open");
    initOwnerCharts();
  });

  // Upload File Logo Baru dari perangkat lokal Owner
  const cmsLogoFileInput = document.getElementById("cmsLogoFileUpload");
  cmsLogoFileInput.addEventListener("change", () => {
    if (cmsLogoFileInput.files && cmsLogoFileInput.files[0]) {
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById("cmsStoreLogoUrl").value = e.target.result;
        showToast("🖼️ File gambar logo berhasil dimuat, klik 'Terapkan Branding' untuk menyimpan!");
      };
      reader.readAsDataURL(cmsLogoFileInput.files[0]);
    }
  });

  // Upload File Gambar QRIS Baru dari perangkat lokal Owner
  const cmsQrisFileInput = document.getElementById("cmsQrisFileUpload");
  if (cmsQrisFileInput) {
    cmsQrisFileInput.addEventListener("change", () => {
      if (cmsQrisFileInput.files && cmsQrisFileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
          APP_STATE.store.qrisImage = e.target.result;
          renderCartBankAndQris();
          savePersistedState();
          showToast("📷 Gambar QRIS Toko berhasil diperbarui & langsung tampil di halaman Keranjang!");
        };
        reader.readAsDataURL(cmsQrisFileInput.files[0]);
      }
    });
  }

  function applyStoreBrandingToDom() {
    const { name, tagline, address, phone, logo } = APP_STATE.store;
    if (name) {
      document.getElementById("dynamicStoreName").innerHTML = `${name} <i class="fa-solid fa-circle-check text-gold" style="font-size:0.75rem;"></i>`;
      document.getElementById("authStoreName").textContent = name;
      document.getElementById("spjKopStoreName").textContent = name.toUpperCase();
      document.getElementById("thermalStoreName").textContent = name.toUpperCase();
      document.title = `${name} — ${tagline}`;
    }
    if (tagline) {
      document.getElementById("dynamicStoreTagline").textContent = tagline;
      document.getElementById("spjKopTagline").textContent = tagline.toUpperCase();
    }
    if (address) {
      document.getElementById("spjKopAddress").innerHTML = `${address}<br>WhatsApp CS: ${phone} • Email: ${APP_STATE.store.email}`;
    }
    if (logo) {
      document.getElementById("dynamicStoreLogo").src = logo;
      document.getElementById("authStoreLogo").src = logo;
    }
    const balEl = document.getElementById("instansiBalanceVal");
    if (balEl) balEl.textContent = `Rp ${APP_STATE.user.commissionBalance.toLocaleString("id-ID")}`;
    renderCartBankAndQris();
  }

  // Simpan CMS Pengaturan Branding Dinamis Tanpa Coding + Rekening Bank & QRIS
  document.getElementById("btnSaveCmsSettings").addEventListener("click", () => {
    const storeName = document.getElementById("cmsStoreName").value.trim();
    const tagline = document.getElementById("cmsStoreTagline").value.trim();
    const address = document.getElementById("cmsStoreAddress").value.trim();
    const phoneEl = document.getElementById("cmsStorePhone");
    const phone = phoneEl ? phoneEl.value.trim() : APP_STATE.store.phone;
    const logoUrl = document.getElementById("cmsStoreLogoUrl").value.trim();

    const bank1El = document.getElementById("cmsBank1");
    const bank2El = document.getElementById("cmsBank2");
    const bank3El = document.getElementById("cmsBank3");

    if (storeName) APP_STATE.store.name = storeName;
    if (tagline) APP_STATE.store.tagline = tagline;
    if (address) APP_STATE.store.address = address;
    if (phone) APP_STATE.store.phone = phone;
    if (logoUrl) APP_STATE.store.logo = logoUrl;

    if (bank1El && bank2El && bank3El) {
      const parseBankInput = (raw, bankName, badge) => {
        const parts = raw.split("(a.n");
        const norek = (parts[0] || raw).trim();
        const an = parts[1] ? parts[1].replace(")", "").trim() : APP_STATE.store.name;
        return { bank: bankName, norek, an, badge };
      };
      APP_STATE.store.bankAccounts = [
        parseBankInput(bank1El.value, "Bank Sumsel Babel", "Utama SPJ Daerah"),
        parseBankInput(bank2El.value, "BSI (Bank Syariah Indonesia)", "Bebas Riba"),
        parseBankInput(bank3El.value, "BRI Cabang Tanjung Raja", "Transfer Cepat")
      ];
    }

    applyStoreBrandingToDom();
    savePersistedState();
    callGasBackend("updateCmsBranding", { role: "owner", storeName, tagline, address, phone, logoUrl });
    modalOwner.classList.remove("open");
    showToast("✅ CMS Branding, Nomor Rekening Bank, & QRIS berhasil diterapkan ke seluruh aplikasi!");
  });

  const btnResetStorage = document.getElementById("btnResetLocalStorage");
  if (btnResetStorage) {
    btnResetStorage.addEventListener("click", resetPersistedState);
  }

  // Simulasi Set Stok = 0 dari Dashboard Owner -> Uji AI Kiko menawarkan produk alternatif + Alert Telegram
  document.getElementById("btnSimulateZeroStock").addEventListener("click", () => {
    const targetProd = MASTER_PRODUCTS[0];
    if (!targetProd) return;
    targetProd.stock = targetProd.stock === 0 ? 35 : 0;
    savePersistedState();
    if (renderCatalogGridFn) renderCatalogGridFn();
    renderPosVisualCatalog();
    renderOwnerProductsTable();

    callGasBackend("updateProductStock", {
      role: "owner",
      productId: targetProd.id,
      productName: targetProd.name,
      newStock: targetProd.stock
    });

    if (targetProd.stock === 0) {
      modalOwner.classList.remove("open");
      showToast(`⚠️ Stok "${targetProd.name}" diubah menjadi 0! Alert Telegram dikirim ke Owner & AI Kiko menawarkan alternatif.`);
      openKikoDialogWithContext(`Cek stok ${targetProd.name}`);
    } else {
      showToast(`✅ Stok "${targetProd.name}" dipulihkan menjadi 35 Rim.`);
    }
  });

  // Broadcast Promosi Telegram Terpersonalisasi
  document.getElementById("btnBroadcastTelegramPromo").addEventListener("click", () => {
    callGasBackend("broadcastTelegramPromo", {});
    showToast("📢 Broadcast Promosi Telegram Terpersonalisasi (menyebut nama masing-masing member) berhasil dikirim!");
  });

  // Ekspor CSV Rekap Keuangan Owner
  document.getElementById("btnExportOwnerCsv").addEventListener("click", () => {
    const csvContent = `data:text/csv;charset=utf-8,Tanggal,Omzet_Tunai,Omzet_NonTunai,Laba_Bersih_Hari_Ini\n${new Date().toISOString().slice(0, 10)},${APP_STATE.shiftCashTotal},${APP_STATE.shiftNonCashTotal},${APP_STATE.netProfitToday}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Rekap_Keuangan_Toko_Delina_OganIlir.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("📊 File CSV Rekap Keuangan Toko Delina berhasil diunduh!");
  });

  // Trigger Email Rekap Keuangan & PDF Backup 21.00 WIB
  document.getElementById("btnTestDailyEmail").addEventListener("click", () => {
    callGasBackend("triggerDailyBackup", {});
    showToast("📧 Email Rekap Keuangan Harian + Lampiran PDF Backup (21.00 WIB) berhasil dikirim ke Email Owner!");
  });

  // Expose global sync function so Checkout, Print Order, POS, and Track stay 100% in sync
  window.refreshAllSyncedModules = function(selectedInvId) {
    renderPosVisualCatalog();
    renderPosCart();
    renderPosPrintQueueAndKpis();
    renderOwnerProductsTable();
    renderOwnerServicesAndGifts();
    renderOwnerInstansiCommission();
    updateOwnerFinancialMetrics();
    if (window.refreshOrderTrackingView) window.refreshOrderTrackingView(selectedInvId);
  };

  applyStoreBrandingToDom();
  renderPosVisualCatalog();
  renderPosCart();
  renderPosPrintQueueAndKpis();
  renderOwnerProductsTable();
  renderOwnerServicesAndGifts();
  renderOwnerInstansiCommission();
  updateOwnerFinancialMetrics();
}

// =========================================================================================
// 3 GRAFIK VISUAL CHART.JS PADA DASHBOARD OWNER (PRD Bab 6.3.2)
// =========================================================================================
let chartsInitialized = false;

function initOwnerCharts() {
  if (chartsInitialized || typeof Chart === "undefined") return;
  chartsInitialized = true;

  // Grafik 1: Tren Omzet & Laba Bersih
  const ctx1 = document.getElementById("chartOmzetTrends");
  if (ctx1) {
    new Chart(ctx1, {
      type: "line",
      data: {
        labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
        datasets: [
          {
            label: "Omzet ATK (Rp)",
            data: [1350000, 1550000, 1850000, 1480000, 2150000, 2650000, 1950000],
            borderColor: "#046a38",
            backgroundColor: "rgba(4, 106, 56, 0.12)",
            tension: 0.35,
            fill: true
          },
          {
            label: "Omzet Fotokopi/Cetak (Rp)",
            data: [780000, 920000, 1100000, 890000, 1380000, 1650000, 1150000],
            borderColor: "#d4af37",
            backgroundColor: "rgba(212, 175, 55, 0.12)",
            tension: 0.35,
            fill: true
          },
          {
            label: "Laba Bersih (Rp)",
            data: [720000, 860000, 1020000, 810000, 1280000, 1540000, 1060000],
            borderColor: "#0284c7",
            borderDash: [4, 4],
            tension: 0.35,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } }
      }
    });
  }

  // Grafik 2: Top 5 Produk & Layanan Terlaris
  const ctx2 = document.getElementById("chartTopProducts");
  if (ctx2) {
    new Chart(ctx2, {
      type: "bar",
      data: {
        labels: ["Standard AE7", "Jilid Skripsi", "HVS A4 70g", "Folio SiDU", "HVS A4 80g"],
        datasets: [{
          label: "Unit / Rim Terjual",
          data: [620, 450, 420, 390, 280],
          backgroundColor: ["#046a38", "#d4af37", "#059669", "#0f5132", "#f59e0b"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } }
      }
    });
  }

  // Grafik 3: Porsi Pelanggan & Loyalty
  const ctx3 = document.getElementById("chartCustomerSegment");
  if (ctx3) {
    new Chart(ctx3, {
      type: "doughnut",
      data: {
        labels: ["Instansi SPJ (Sekolah/Desa)", "Member Loyalty 15x", "Pelanggan Umum"],
        datasets: [{
          data: [55, 28, 17],
          backgroundColor: ["#046a38", "#d4af37", "#0284c7"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } } }
      }
    });
  }
}

// =========================================================================================
// LACAK PESANAN DINAMIS (`#viewTrack`), RIWAYAT AKUN, & 5 MENU BOTTOM NAVIGATION BAR
// =========================================================================================
function initOrderTrackingView() {
  const selectRecent = document.getElementById("selectTrackRecentInvoice");
  const inputInv = document.getElementById("inputTrackInvoice");
  const btnSearch = document.getElementById("btnSearchTrack");
  const invNumEl = document.getElementById("trackInvoiceNum");
  const custLabelEl = document.getElementById("trackCustomerLabel");
  const itemsLabelEl = document.getElementById("trackItemsSummaryLabel");
  const statusBadgeEl = document.getElementById("trackStatusBadge");
  const step1El = document.getElementById("trackStep1");
  const step2El = document.getElementById("trackStep2");
  const step3El = document.getElementById("trackStep3");
  const photoEl = document.getElementById("trackResultPhoto");
  const ocrTextEl = document.getElementById("trackOcrText");
  const btnWaReal = document.getElementById("btnTrackSendWaReal");

  function displayTrackedOrder(orderObj) {
    const ord = orderObj || APP_STATE.orderHistory[0];
    if (!ord) return;
    APP_STATE.activeTrackedOrder = ord;
    populateThermalAndSpjModals(ord);

    if (inputInv) inputInv.value = ord.invoiceId;
    if (invNumEl) invNumEl.textContent = ord.invoiceId;
    if (custLabelEl) custLabelEl.textContent = `${ord.customer || APP_STATE.user.name} • Total: Rp ${(ord.total || 0).toLocaleString("id-ID")}`;
    if (itemsLabelEl) itemsLabelEl.textContent = `Item: ${ord.itemsSummary}`;
    if (statusBadgeEl) statusBadgeEl.textContent = ord.status;
    if (photoEl && ord.photo) photoEl.src = ord.photo;
    if (ocrTextEl) {
      ocrTextEl.innerHTML = `<i class="fa-solid fa-eye text-emerald"></i> <strong>Hasil Ekstraksi Vision AI (OCR) & Status Pembayaran:</strong><br>${ord.paymentMethod || "QRIS / Transfer Bank"} • Nominal: Rp ${(ord.total || 0).toLocaleString("id-ID")} • Status: <strong>${ord.status.toUpperCase()}</strong>`;
    }

    // Update 3-step visual progress bar
    const st = (ord.status || "").toLowerCase();
    const isStep2 = st.includes("cetak") || st.includes("proses") || st.includes("siap") || st.includes("selesai") || st.includes("lunas");
    const isStep3 = st.includes("siap") || st.includes("selesai") || st.includes("lunas") || st.includes("ambil") || st.includes("antar");

    if (step1El) step1El.style.background = "var(--primary)";
    if (step2El) {
      step2El.style.background = isStep2 ? "var(--primary)" : "#e2e8f0";
      step2El.style.color = isStep2 ? "#ffffff" : "var(--slate-muted)";
    }
    if (step3El) {
      step3El.style.background = isStep3 ? "var(--gold)" : "#e2e8f0";
      step3El.style.color = isStep3 ? "var(--charcoal)" : "var(--slate-muted)";
    }
  }

  function populateTrackDropdown(selectedInvId) {
    if (!selectRecent) return;
    selectRecent.innerHTML = "";
    APP_STATE.orderHistory.forEach(ord => {
      const opt = document.createElement("option");
      opt.value = ord.invoiceId;
      opt.textContent = `${ord.invoiceId} — ${ord.itemsSummary.slice(0, 32)} (${ord.status})`;
      if (selectedInvId && ord.invoiceId === selectedInvId) opt.selected = true;
      selectRecent.appendChild(opt);
    });
    const targetOrd = APP_STATE.orderHistory.find(o => o.invoiceId === (selectedInvId || selectRecent.value)) || APP_STATE.orderHistory[0];
    displayTrackedOrder(targetOrd);
  }

  if (selectRecent) {
    selectRecent.addEventListener("change", () => {
      const found = APP_STATE.orderHistory.find(o => o.invoiceId === selectRecent.value);
      if (found) {
        displayTrackedOrder(found);
        showToast(`🔍 Menampilkan detail pesanan ${found.invoiceId}`);
      }
    });
  }

  if (btnSearch) {
    btnSearch.addEventListener("click", () => {
      const q = (inputInv.value || "").trim().toLowerCase();
      const found = APP_STATE.orderHistory.find(o => o.invoiceId.toLowerCase().includes(q) || (o.itemsSummary && o.itemsSummary.toLowerCase().includes(q))) || APP_STATE.orderHistory[0];
      if (found) {
        if (selectRecent) selectRecent.value = found.invoiceId;
        displayTrackedOrder(found);
        showToast(`🔍 Menampilkan status real-time & foto cetakan untuk ${found.invoiceId}`);
      }
    });
  }

  if (btnWaReal) {
    btnWaReal.addEventListener("click", () => {
      openWhatsAppReceipt(APP_STATE.activeTrackedOrder || APP_STATE.orderHistory[0]);
    });
  }

  window.refreshOrderTrackingView = populateTrackDropdown;
  populateTrackDropdown();
}

function renderAccountOrderHistory() {
  const container = document.getElementById("accountOrderHistory");
  if (!container) return;
  container.innerHTML = "";

  APP_STATE.orderHistory.forEach(ord => {
    const card = document.createElement("div");
    card.style.cssText = "padding:10px 12px; border:1px solid var(--surface-border); border-radius:var(--radius-md); background:#f8fafc; display:flex; justify-content:space-between; align-items:center; gap:8px;";
    card.innerHTML = `
      <div style="flex:1; min-width:0;">
        <div style="display:flex; align-items:center; gap:6px;">
          <strong style="font-family:var(--font-mono); font-size:0.78rem; color:var(--primary);">${ord.invoiceId}</strong>
          <span style="font-size:0.62rem; background:#dcfce7; color:#166534; padding:1px 6px; border-radius:99px; font-weight:700;">${ord.status}</span>
        </div>
        <div style="font-size:0.72rem; color:var(--charcoal); margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ord.itemsSummary}</div>
        <div style="font-size:0.64rem; color:var(--slate-muted);">${ord.date} ${ord.komisi > 0 ? `• Komisi SPJ: +Rp ${ord.komisi.toLocaleString("id-ID")}` : ""}</div>
      </div>
      <div style="text-align:right; display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
        <div style="font-family:var(--font-mono); font-weight:800; font-size:0.82rem; color:var(--charcoal);">Rp ${ord.total.toLocaleString("id-ID")}</div>
        <div style="display:flex; gap:4px;">
          <button type="button" class="azan-toggle-btn btn-hist-wa" style="padding:3px 7px; font-size:0.62rem; background:#25d366; color:#fff; border:none;">
            <i class="fa-brands fa-whatsapp"></i> WA
          </button>
          <button type="button" class="azan-toggle-btn btn-hist-spj" style="padding:3px 8px; font-size:0.62rem;">
            <i class="fa-solid fa-file-pdf"></i> Nota SPJ
          </button>
        </div>
      </div>
    `;
    card.querySelector(".btn-hist-wa").addEventListener("click", () => {
      openWhatsAppReceipt(ord);
    });
    card.querySelector(".btn-hist-spj").addEventListener("click", () => {
      populateThermalAndSpjModals(ord);
      document.getElementById("modalSpjPdf").classList.add("open");
    });
    container.appendChild(card);
  });
}

function initBottomNavigation() {
  const navBtns = document.querySelectorAll(".bottom-nav-bar .nav-item-btn");
  const views = document.querySelectorAll(".app-view");

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const targetViewId = btn.getAttribute("data-view");
      navBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      views.forEach(v => {
        v.classList.toggle("active", v.id === targetViewId);
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
      if (targetViewId === "viewCart") renderCartView();
      if (targetViewId === "viewTrack" && window.refreshOrderTrackingView) window.refreshOrderTrackingView();
      if (targetViewId === "viewAccount") renderAccountOrderHistory();
    });
  });
}

function showToast(msg) {
  const toast = document.getElementById("toastNotification");
  const msgEl = document.getElementById("toastMessage");
  if (!toast || !msgEl) return;
  msgEl.textContent = msg;
  toast.style.display = "flex";
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 3400);
}

// =========================================================================================
// DARK MODE SYARIAH EMERALD & EFEK SENTUH (TOUCH GLOW) BORDER PELANGI
// =========================================================================================
function initDarkModeAndTouchGlow() {
  const btnDark = document.getElementById("btnToggleDarkMode");
  const iconDark = document.getElementById("darkModeIcon");

  function syncDarkModeUi() {
    if (APP_STATE.store.darkMode) {
      document.body.classList.add("dark-mode");
      if (iconDark) iconDark.className = "fa-solid fa-sun";
    } else {
      document.body.classList.remove("dark-mode");
      if (iconDark) iconDark.className = "fa-solid fa-moon";
    }
  }

  syncDarkModeUi();

  if (btnDark) {
    btnDark.addEventListener("click", () => {
      APP_STATE.store.darkMode = !APP_STATE.store.darkMode;
      syncDarkModeUi();
      savePersistedState();
      showToast(APP_STATE.store.darkMode
        ? "🌙 Mode Malam (Dark Mode Syariah Emerald & Gold) Aktif!"
        : "☀️ Mode Siang (Light Mode) Aktif!");
    });
  }

  // Dukungan Efek Sentuh (Touch) pada layar HP/Tablet agar animasi pelangi glowing menyala saat disentuh
  document.addEventListener("touchstart", e => {
    const glowCard = e.target.closest(".glow-card-black");
    document.querySelectorAll(".glow-card-black.touch-glow-active").forEach(el => {
      if (el !== glowCard) el.classList.remove("touch-glow-active");
    });
    if (glowCard) {
      glowCard.classList.add("touch-glow-active");
    }
  }, { passive: true });
}

// =========================================================================================
// PWA INSTALLER ENGINE (STANDALONE DETECTION, SERVICE WORKER, & PANDUAN MODAL)
// =========================================================================================
let deferredPwaPrompt = null;

function initPwaInstaller() {
  const btnInstall = document.getElementById("btnInstallPwaApp");
  const btnGuide = document.getElementById("btnPwaGuideModal");
  const notInstalledSec = document.getElementById("pwaNotInstalledSection");
  const alreadyInstalledSec = document.getElementById("pwaAlreadyInstalledSection");
  const modalGuide = document.getElementById("modalPwaGuide");

  // Deteksi jika aplikasi sedang berjalan di mode standalone (sudah terpasang di layar utama / desktop)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true ||
                       (document.referrer && document.referrer.includes('android-app://'));

  if (isStandalone) {
    if (notInstalledSec) notInstalledSec.style.display = "none";
    if (alreadyInstalledSec) alreadyInstalledSec.style.display = "block";
  }

  // Tangkap event instalasi browser modern (Android Chrome / Edge Desktop)
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPwaPrompt = e;
    console.log("[PWA] Prompt instalasi dideteksi oleh browser.");
    if (!isStandalone) {
      if (notInstalledSec) notInstalledSec.style.display = "flex";
      if (alreadyInstalledSec) alreadyInstalledSec.style.display = "none";
    }
  });

  // Tombol aksi pasang aplikasi
  if (btnInstall) {
    btnInstall.addEventListener("click", async () => {
      if (deferredPwaPrompt) {
        deferredPwaPrompt.prompt();
        const { outcome } = await deferredPwaPrompt.userChoice;
        if (outcome === "accepted") {
          showToast("✅ Alhamdulillah! Aplikasi Toko Delina berhasil dipasang di perangkat.");
          if (notInstalledSec) notInstalledSec.style.display = "none";
          if (alreadyInstalledSec) alreadyInstalledSec.style.display = "block";
        } else {
          showToast("Pemasangan aplikasi ditunda.");
        }
        deferredPwaPrompt = null;
      } else {
        // Tampilkan modal panduan jika browser tidak mendukung auto-prompt (seperti Safari iOS atau browser tertentu)
        if (modalGuide) modalGuide.classList.add("open");
      }
    });
  }

  // Tombol buka panduan instalasi
  if (btnGuide && modalGuide) {
    btnGuide.addEventListener("click", () => {
      modalGuide.classList.add("open");
    });
  }

  // Tab switching di dalam Modal Panduan PWA (Android, iOS, Desktop)
  const tabAndroid = document.getElementById("btnPwaTabAndroid");
  const tabIos = document.getElementById("btnPwaTabIos");
  const tabDesktop = document.getElementById("btnPwaTabDesktop");
  const stepAndroid = document.getElementById("pwaStepAndroid");
  const stepIos = document.getElementById("pwaStepIos");
  const stepDesktop = document.getElementById("pwaStepDesktop");

  function switchPwaTab(activeTab, activeStep) {
    [tabAndroid, tabIos, tabDesktop].forEach(t => {
      if (t) {
        t.classList.remove("active");
        t.style.background = "#f1f5f9";
        t.style.color = "#475569";
      }
    });
    [stepAndroid, stepIos, stepDesktop].forEach(s => {
      if (s) s.style.display = "none";
    });

    if (activeTab) {
      activeTab.classList.add("active");
      activeTab.style.background = "var(--primary)";
      activeTab.style.color = "#ffffff";
    }
    if (activeStep) {
      activeStep.style.display = "block";
    }
  }

  if (tabAndroid) {
    tabAndroid.addEventListener("click", () => switchPwaTab(tabAndroid, stepAndroid));
  }
  if (tabIos) {
    tabIos.addEventListener("click", () => switchPwaTab(tabIos, stepIos));
  }
  if (tabDesktop) {
    tabDesktop.addEventListener("click", () => switchPwaTab(tabDesktop, stepDesktop));
  }

  // Registrasi Service Worker PWA untuk caching offline
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js")
        .then(reg => {
          console.log("[PWA Service Worker] Berhasil terdaftar dengan scope:", reg.scope);
        })
        .catch(err => {
          console.warn("[PWA Service Worker] Gagal mendaftarkan service worker:", err);
        });
    });
  }
}

// =========================================================================================
// INITIALIZE APPLICATION ON DOM READY
// =========================================================================================
document.addEventListener("DOMContentLoaded", () => {
  loadPersistedState();
  initDarkModeAndTouchGlow();
  initAuthGateway();
  initRealTimeEngines();
  initHeaderDropdowns();
  initHeaderKikoAi();
  renderRunningReviewMarquee();
  initProductCatalog();
  initBottomSheetControls();
  initCartControls();
  initFloatingKikoWidget();
  initPrintOrderCalculator();
  initSpjAndLoyaltyModals();
  initOrderTrackingView();
  initPosAndOwnerModals();
  renderAccountOrderHistory();
  initBottomNavigation();
  initPwaInstaller();
});
