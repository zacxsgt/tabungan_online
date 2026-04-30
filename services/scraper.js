// services/scraper.js
async function getPrice(url) {
    console.log("--- 🛠️ Memulai Simulasi Pengambilan Harga ---");
    console.log(`🌐 Menganalisis Link: ${url}`);

    // Memberi jeda 1.5 detik agar terasa seperti proses asli
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Logika harga acak berdasarkan kata kunci di URL
    let hargaSimulasi = Math.floor(Math.random() * (18000000 - 12000000 + 1)) + 12000000; // Default 12-18jt

    if (url.includes('ipad') || url.includes('tablet')) {
        hargaSimulasi = Math.floor(Math.random() * (8000000 - 4000000 + 1)) + 4000000; // 4-8jt
    } else if (url.includes('keyboard') || url.includes('mouse')) {
        hargaSimulasi = Math.floor(Math.random() * (2000000 - 500000 + 1)) + 500000; // 500rb-2jt
    }

    console.log(`✅ Sukses! Harga Simulasi: Rp ${hargaSimulasi.toLocaleString('id-ID')}`);
    return hargaSimulasi;
}

module.exports = { getPrice };