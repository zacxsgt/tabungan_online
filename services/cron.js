// services/cron.js
const cron = require('node-cron');
const db = require('../config/db');
const { getPrice } = require('./scraper');

function initCron() {
    // Berjalan setiap jam 12 malam
    cron.schedule('0 0 * * *', async () => {
        console.log("🕒 Memulai update harga otomatis...");
        const [items] = await db.query('SELECT id, url_barang, harga_saat_ini FROM targets');

        for (let item of items) {
            const hargaBaru = await getPrice(item.url_barang);
            if (hargaBaru && hargaBaru !== item.harga_saat_ini) {
                await db.query('UPDATE targets SET harga_saat_ini = ? WHERE id = ?', [hargaBaru, item.id]);
                await db.query('INSERT INTO price_history (target_id, harga) VALUES (?, ?)', [item.id, hargaBaru]);
                console.log(`📈 Update: ${item.id} sekarang Rp${hargaBaru}`);
            }
        }
    });
}

module.exports = { initCron };