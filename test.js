const puppeteer = require('puppeteer');

async function testScraper(url) {
    console.log("🔍 Memulai simulasi browser...");
    
    const browser = await puppeteer.launch({ 
        headless: false, // Kita set false supaya Anda bisa melihat browserya bekerja
        slowMo: 50 // Memberi jeda agar tidak terlalu cepat
    });

    try {
        const page = await browser.newPage();
        
        // Setting User Agent agar terlihat seperti manusia
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

        console.log(`🌐 Mengunjungi: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Tunggu sebentar agar harga benar-benar muncul
        console.log("⏳ Menunggu elemen harga...");
        const priceSelector = '[data-testid="lblPDPDetailProductPrice"]';
        await page.waitForSelector(priceSelector, { timeout: 15000 });

        const priceText = await page.$eval(priceSelector, el => el.innerText);
        const cleanPrice = parseFloat(priceText.replace(/[^0-9]/g, ""));

        console.log("\n--- HASIL TEST ---");
        console.log(`Nama Barang (Target): iPhone 15 / Produk Tokopedia`);
        console.log(`Harga Terbaca: ${priceText}`);
        console.log(`Angka Murni: ${cleanPrice}`);
        console.log("------------------\n");

    } catch (error) {
        console.error("❌ Test Gagal:", error.message);
    } finally {
        await browser.close();
        console.log("🚪 Browser ditutup.");
    }
}

// Kita coba test dengan link iPhone dari list Anda
const targetURL = "https://www.tokopedia.com/iboxofficial/apple-iphone-13-pro-128-gb-silver";
testScraper(targetURL);