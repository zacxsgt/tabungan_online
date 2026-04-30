require('dotenv').config(); // Tambahkan ini agar bisa membaca file .env di laptop
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- KONFIGURASI DATABASE (DIPERBAIKI UNTUK RAILWAY & LOKAL) ---
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tabungan_online',
    port: process.env.DB_PORT || 3306
});

db.getConnection()
    .then(() => console.log(`✅ Terhubung ke Database MySQL (${process.env.DB_NAME || 'tabungan_online'})`))
    .catch((err) => console.error('❌ Gagal konek database:', err));

// --- RUTE UTAMA (Mencegah error "Cannot GET /") ---
app.get('/', (req, res) => {
    res.send('✅ Backend Tabungan Online Berjalan Lancar di Railway!');
});

// --- API 1: AMBIL DATA USER (PROFIL) ---
app.get('/api/user', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM users LIMIT 1');
        if (rows.length === 0) {
            return res.json({ nama: 'Fandi', instansi: 'UNPAB', tema: 'terang', bahasa: 'indonesia' });
        }
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- API 2: UPDATE DATA USER (EDIT PROFIL) ---
app.put('/api/user', async (req, res) => {
    const { nama, instansi } = req.body;
    try {
        await db.query('UPDATE users SET nama = ?, instansi = ? WHERE id = 1', [nama, instansi]);
        res.json({ message: 'Profil berhasil diupdate!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- API 3: AMBIL DATA TARGET BARANG ---
app.get('/api/targets', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM targets');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- API 4: AMBIL RIWAYAT TRANSAKSI ---
app.get('/api/transactions', async (req, res) => {
    try {
        const query = `
            SELECT t.*, b.nama_barang 
            FROM transactions t 
            JOIN targets b ON t.target_id = b.id 
            ORDER BY t.tanggal DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- API 5: SIMPAN TRANSAKSI BARU (NABUNG / TARIK) ---
app.post('/api/transactions', async (req, res) => {
    const { target_id, jenis, nominal } = req.body; 
    
    try {
        await db.query(
            'INSERT INTO transactions (target_id, jenis, nominal) VALUES (?, ?, ?)',
            [target_id, jenis, nominal]
        );

        if (jenis === 'in') {
            await db.query('UPDATE targets SET tabungan_terkumpul = tabungan_terkumpul + ? WHERE id = ?', [nominal, target_id]);
        } else if (jenis === 'out') {
            await db.query(`
                UPDATE targets 
                SET tabungan_terkumpul = CASE 
                    WHEN tabungan_terkumpul - ? < 0 THEN 0 
                    ELSE tabungan_terkumpul - ? 
                END 
                WHERE id = ?`, 
            [nominal, nominal, target_id]);
        }

        res.json({ message: 'Transaksi berhasil disimpan!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- API 6: TAMBAH TARGET BARANG BARU ---
app.post('/api/targets', async (req, res) => {
    const { nama_barang, harga_saat_ini, gambar } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO targets (nama_barang, harga_saat_ini, gambar, tabungan_terkumpul) VALUES (?, ?, ?, 0)',
            [nama_barang, harga_saat_ini, gambar]
        );
        res.json({ message: 'Barang baru berhasil ditambahkan!', id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- API 7: HAPUS TARGET BARANG (BATAL NABUNG) ---
app.delete('/api/targets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM targets WHERE id = ?', [id]);
        res.json({ message: 'Barang berhasil dihapus!' });
    } catch (error) {
        console.error("Error Hapus Data:", error);
        res.status(500).json({ error: error.message });
    }
});

// --- JALANKAN SERVER (DIPERBAIKI UNTUK RAILWAY) ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server TabungIn menyala di port ${PORT}`);
});