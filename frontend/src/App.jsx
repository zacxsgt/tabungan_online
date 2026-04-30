import React, { useState, useEffect } from 'react';
import { 
  Home, Wallet, User, History, TrendingUp, Sparkles, CheckCircle2, 
  BarChart2, Activity, ArrowUpRight, ArrowDownLeft, Settings, 
  Bell, Shield, LogOut, ChevronRight, CreditCard, PlusCircle, X, ChevronLeft,
  Lock, Moon, Globe, Plus, Image as ImageIcon, Trash2
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = 'https://tabunganonline-production.up.railway.app/api';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [filterGrafik, setFilterGrafik] = useState('bulanan'); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); 
  const [chartType, setChartType] = useState('bar'); 
  const [isLoading, setIsLoading] = useState(true); 

  const [activeForm, setActiveForm] = useState({ id: null, type: null }); 
  const [nominalInput, setNominalInput] = useState('');
  const [actionModal, setActionModal] = useState({ show: false, type: null, step: 1, selectedId: null, inputAmount: '' });
  const [settingsModal, setSettingsModal] = useState({ show: false, menu: null });
  const [editProfileForm, setEditProfileForm] = useState({ nama: '', instansi: '' });

  const [addModal, setAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ nama: '', harga: '', gambar: '' });

  const [notifSettings, setNotifSettings] = useState({ pengingatHarian: true, saldoMenipis: false, infoPembaruan: true });
  const [appPreferences, setAppPreferences] = useState({ tema: 'terang', bahasa: 'indonesia' });

  const [profileData, setProfileData] = useState({ nama: 'Loading...', instansi: 'Loading...' });
  const [targets, setTargets] = useState([]);
  const [historyTransaksi, setHistoryTransaksi] = useState([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const userRes = await fetch(`${API_URL}/user`);
      const userData = await userRes.json();
      if (userData) {
          setProfileData(userData);
          setAppPreferences({ tema: userData.tema || 'terang', bahasa: userData.bahasa || 'indonesia' });
      }

      const targetsRes = await fetch(`${API_URL}/targets`);
      const targetsData = await targetsRes.json();
      setTargets(targetsData);

      const historyRes = await fetch(`${API_URL}/transactions`);
      const historyData = await historyRes.json();
      
      const formattedHistory = historyData.map(tx => ({
        id: tx.id,
        type: tx.jenis,
        title: tx.jenis === 'in' ? `Nabung ${tx.nama_barang}` : `Tarik ${tx.nama_barang}`,
        amount: tx.nominal,
        date: new Date(tx.tanggal).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(tx.tanggal).getTime(),
        icon: tx.jenis === 'in' ? ArrowDownLeft : ArrowUpRight
      }));
      setHistoryTransaksi(formattedHistory);

    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const executeTransaction = async (id, type, amountStr) => {
    const nominal = parseInt(amountStr, 10);
    if (isNaN(nominal) || nominal <= 0) { alert("Masukkan nominal angka yang valid."); return false; }
    const isMasuk = type === 'add';

    try {
      const response = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: id, jenis: isMasuk ? 'in' : 'out', nominal: nominal })
      });
      if (!response.ok) throw new Error('Gagal menyimpan transaksi');
      await fetchData();
      return true;
    } catch (error) {
      alert("Gagal menyimpan transaksi ke database.");
      return false;
    }
  };

  const handleInlineSubmit = async (id) => {
    if(await executeTransaction(id, activeForm.type, nominalInput)) {
      setActiveForm({ id: null, type: null }); setNominalInput('');
    }
  };

  const handleModalSubmit = async () => {
    if(await executeTransaction(actionModal.selectedId, actionModal.type, actionModal.inputAmount)) {
      setActionModal({ show: false, type: null, step: 1, selectedId: null, inputAmount: '' });
    }
  };

  const handleAddTarget = async () => {
    if(!newItem.nama || !newItem.harga) return alert("Nama dan Harga wajib diisi!");
    const nominalHarga = parseInt(newItem.harga, 10);
    if(isNaN(nominalHarga) || nominalHarga <= 0) return alert("Harga harus berupa angka valid!");
    
    try {
      const res = await fetch(`${API_URL}/targets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_barang: newItem.nama, harga_saat_ini: nominalHarga, gambar: newItem.gambar || '' })
      });
      if(res.ok) {
        setAddModal(false);
        setNewItem({ nama: '', harga: '', gambar: '' });
        fetchData(); 
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan.");
    }
  };

  // --- NEW: FUNGSI HAPUS BARANG ---
  const handleDeleteTarget = async (id, nama_barang) => {
    const confirmDelete = window.confirm(`Yakin ingin membatalkan target "${nama_barang}"?\nSemua riwayat menabung untuk barang ini akan ikut terhapus.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_URL}/targets/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData(); // Muat ulang data setelah dihapus
      } else {
        alert("Gagal menghapus barang.");
      }
    } catch (error) {
      alert("Terjadi kesalahan jaringan saat menghapus.");
    }
  };

  const handleOpenSettings = (menuTitle) => {
    setSettingsModal({ show: true, menu: menuTitle });
    if (menuTitle === 'Edit Profil') setEditProfileForm({ nama: profileData.nama, instansi: profileData.instansi });
  };

  const handleSaveProfile = async () => {
    if(editProfileForm.nama.trim() === '') return alert('Nama tidak boleh kosong');
    try {
        const response = await fetch(`${API_URL}/user`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editProfileForm)
        });
        if (!response.ok) throw new Error('Gagal update profil');
        setProfileData(prev => ({...prev, ...editProfileForm}));
        setSettingsModal({ show: false, menu: null });
    } catch (error) {
        alert("Gagal mengupdate profil di database.");
    }
  };

  const handleToggleNotif = (key) => setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
  const handleFakeSaveSettings = () => { setSettingsModal({ show: false, menu: null }); alert(`Pengaturan ${settingsModal.menu} berhasil diperbarui.`); };

  const formatRupiahUntukGrafik = (value) => {
    if (value >= 1000000) return `Rp ${(value / 1000000).toFixed(1).replace('.0', '')} Jt`;
    else if (value >= 1000) return `Rp ${(value / 1000).toFixed(0)} Rb`;
    return `Rp ${value}`;
  };

  let chartData = [];
  if (filterGrafik === 'harian') {
    chartData = [{ name: 'Sn', masuk: 0, keluar: 0 }, { name: 'Sl', masuk: 0, keluar: 0 }, { name: 'Rb', masuk: 0, keluar: 0 }, { name: 'Km', masuk: 0, keluar: 0 }, { name: 'Jm', masuk: 0, keluar: 0 }, { name: 'Sb', masuk: 0, keluar: 0 }, { name: 'Mg', masuk: 0, keluar: 0 }];
    historyTransaksi.forEach(tx => {
      const d = new Date(tx.timestamp).getDay(); 
      const index = d === 0 ? 6 : d - 1; 
      if (tx.type === 'in') chartData[index].masuk += tx.amount; else chartData[index].keluar += tx.amount;
    });
  } else if (filterGrafik === 'bulanan') {
    chartData = [{ name: 'Mg 1', masuk: 0, keluar: 0 }, { name: 'Mg 2', masuk: 0, keluar: 0 }, { name: 'Mg 3', masuk: 0, keluar: 0 }, { name: 'Mg 4', masuk: 0, keluar: 0 }];
    historyTransaksi.forEach(tx => {
      const date = new Date(tx.timestamp);
      if (date.getMonth() + 1 === selectedMonth) {
        let week = Math.floor((date.getDate() - 1) / 7);
        if (week > 3) week = 3;
        if (tx.type === 'in') chartData[week].masuk += tx.amount; else chartData[week].keluar += tx.amount;
      }
    });
  } else if (filterGrafik === 'tahunan') {
    const yearMap = {};
    historyTransaksi.forEach(tx => {
      const y = new Date(tx.timestamp).getFullYear().toString();
      if (!yearMap[y]) yearMap[y] = { name: y, masuk: 0, keluar: 0 };
      if (tx.type === 'in') yearMap[y].masuk += tx.amount; else yearMap[y].keluar += tx.amount;
    });
    chartData = Object.values(yearMap).sort((a,b) => a.name.localeCompare(b.name));
    if (chartData.length === 0) chartData = [{ name: new Date().getFullYear().toString(), masuk: 0, keluar: 0 }];
  }

  const totalTabungan = targets.reduce((acc, curr) => acc + (curr.tabungan_terkumpul || 0), 0);
  const rekomendasiBeli = targets.filter(item => item.harga_saat_ini <= totalTabungan && ((item.tabungan_terkumpul || 0) / item.harga_saat_ini) * 100 < 100);
  const namaBulan = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const smoothUpVariant = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };
  const staggerContainer = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const popInVariant = { hidden: { opacity: 0, y: 20, scale: 0.95 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: "easeOut" } } };
  const pageVariant = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } }, exit: { opacity: 0, x: -20, transition: { duration: 0.2 } } };

  if (isLoading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-black text-[#006BFF] text-xl">Memuat TabungIn...</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen w-full font-sans text-slate-800 overflow-x-hidden relative">
      
      {/* HEADER */}
      <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white/90 backdrop-blur-lg shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#006BFF] leading-none">TabungIn</h1>
            <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-bold mt-1">Catatan Mandiri</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FFF100] border-2 border-[#006BFF] shadow-sm flex items-center justify-center font-black text-[#006BFF] text-sm cursor-pointer hover:scale-105">
              {profileData.nama ? profileData.nama.substring(0,2).toUpperCase() : 'IT'}
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        
        {/* --- HALAMAN 1: HOME --- */}
        {activeTab === 'home' && (
          <motion.div key="home" variants={pageVariant} initial="initial" animate="animate" exit="exit" className="max-w-5xl mx-auto px-5 w-full pb-32">
            
            <motion.div variants={smoothUpVariant} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="pt-6 mb-8">
              <div className="bg-gradient-to-br from-[#08C2FF] to-[#006BFF] p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-white shadow-xl shadow-[#08C2FF]/20 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-32 h-32 md:w-48 md:h-48 bg-[#FFF100] rounded-full blur-3xl opacity-20"></div>
                  <p className="text-sm md:text-base font-medium opacity-90">Total Seluruh Tabungan</p>
                  <h2 className="text-3xl md:text-5xl font-black mt-1 tracking-tight">Rp {totalTabungan.toLocaleString('id-ID')}</h2>
              </div>
            </motion.div>

            {rekomendasiBeli.length > 0 && (
              <motion.div variants={smoothUpVariant} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="mb-10">
                <div className="bg-[#FFF100] rounded-[1.8rem] md:rounded-[2rem] p-5 md:p-6 border-2 border-[#006BFF] shadow-[4px_4px_0px_#006BFF] overflow-hidden">
                  <h3 className="text-sm md:text-base font-black flex items-center gap-2 text-[#006BFF] mb-2"><Sparkles size={20} />Siap Dibungkus!</h3>
                  <p className="text-[11px] md:text-sm text-[#006BFF]/80 mb-4 font-bold">Uangmu cukup untuk beli barang ini secara lunas:</p>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {rekomendasiBeli.map(item => (
                      <div key={item.id} className="min-w-[150px] shrink-0 bg-white p-3 rounded-2xl border border-slate-200 cursor-pointer hover:scale-[1.02] transition-transform">
                        <h4 className="font-bold text-slate-800 text-[11px] truncate">{item.nama_barang}</h4>
                        <p className="text-[#006BFF] font-black text-xs mt-1">Rp {item.harga_saat_ini.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* KATALOG TARGET */}
            <motion.div variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.1 }} className="mb-12 w-full">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-sm md:text-lg font-black flex items-center text-slate-700 uppercase tracking-widest">
                  Katalog <span className="ml-2 text-[#08C2FF] text-[10px] md:text-xs font-black bg-[#BCF2F6] px-2.5 py-1 rounded-md">AKTIF</span>
                </h3>
                <button onClick={() => setAddModal(true)} className="flex items-center gap-1.5 bg-[#006BFF] text-white px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all">
                  <Plus size={14} strokeWidth={3}/> BARANG
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {targets.map((item) => {
                  const persen = Math.min(((item.tabungan_terkumpul || 0) / item.harga_saat_ini) * 100, 100);
                  const isTercapai = persen >= 100;
                  
                  return (
                    <motion.div variants={popInVariant} key={item.id} className={`relative bg-white p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] border hover:shadow-lg transition-shadow duration-300 ${isTercapai ? 'border-[#08C2FF]' : 'border-slate-100'} shadow-sm flex flex-col justify-between`}>
                      
                      {/* --- TOMBOL HAPUS BARANG --- */}
                      <button 
                        onClick={() => handleDeleteTarget(item.id, item.nama_barang)} 
                        className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-md text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors z-10 shadow-sm border border-red-100"
                        title="Hapus Barang"
                      >
                        <Trash2 size={14} />
                      </button>

                      <div>
                        {item.gambar && (
                          <div className="w-full h-24 mb-3 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
                            <img src={item.gambar} alt={item.nama_barang} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                          </div>
                        )}
                        <h4 className="font-bold text-slate-800 text-[11px] md:text-sm leading-tight line-clamp-2 md:h-10 h-8 pr-6">{item.nama_barang}</h4>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1 mb-3">Rp {item.harga_saat_ini.toLocaleString()}</p>
                      </div>
                      <div>
                        <div className="flex justify-between items-end mb-1.5"><span className="text-[9px] md:text-xs font-bold text-slate-300">Progres</span><span className={`text-[10px] md:text-xs font-black ${isTercapai ? 'text-[#006BFF]' : 'text-[#08C2FF]'}`}>{persen.toFixed(0)}%</span></div>
                        <div className="h-1.5 md:h-2 w-full bg-[#BCF2F6]/50 rounded-full overflow-hidden mb-4"><motion.div initial={{ width: 0 }} animate={{ width: `${persen}%` }} transition={{ duration: 1, ease: "easeOut" }} className={`h-full rounded-full ${isTercapai ? 'bg-[#006BFF]' : 'bg-[#08C2FF]'}`} /></div>
                        {isTercapai ? (
                           <div className="w-full bg-[#08C2FF]/10 text-[#006BFF] py-2 rounded-xl text-[10px] md:text-xs font-black flex justify-center items-center border border-[#08C2FF]/20"><CheckCircle2 size={14} className="mr-1"/> LUNAS</div>
                        ) : (
                          <div>
                            {activeForm.id === item.id ? (
                              <div className="flex flex-col gap-2 transition-all">
                                <div className="flex bg-slate-50 border border-[#08C2FF]/50 rounded-xl px-2 py-1.5 items-center">
                                  <span className="text-[10px] font-black text-slate-400 mr-1.5">Rp</span>
                                  <input autoFocus type="number" value={nominalInput} onChange={(e) => setNominalInput(e.target.value)} placeholder="0" className="bg-transparent w-full outline-none text-xs font-black text-[#006BFF]"/>
                                </div>
                                <div className="flex gap-1.5">
                                  <button onClick={() => handleInlineSubmit(item.id)} className={`flex-1 text-white py-1.5 rounded-lg text-[10px] font-black shadow-md ${activeForm.type === 'add' ? 'bg-[#006BFF]' : 'bg-[#08C2FF]'}`}>SIMPAN</button>
                                  <button onClick={() => { setActiveForm({id: null, type: null}); setNominalInput(''); }} className="w-8 bg-slate-100 text-slate-400 py-1.5 rounded-lg text-[10px] font-black flex justify-center items-center hover:bg-slate-200"><X size={14} /></button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex gap-1.5">
                                <button onClick={() => { setActiveForm({id: item.id, type: 'add'}); setNominalInput(''); }} className="flex-1 bg-[#006BFF] text-white py-2 rounded-xl text-[10px] md:text-xs font-black shadow-md active:scale-95 transition-transform">+ TABUNG</button>
                                <button onClick={() => { setActiveForm({id: item.id, type: 'sub'}); setNominalInput(''); }} className="w-8 md:w-10 bg-[#BCF2F6] text-[#006BFF] py-2 rounded-xl text-[10px] md:text-xs font-black flex justify-center items-center active:scale-95 transition-transform">-</button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* GRAFIK */}
            <motion.div variants={smoothUpVariant} initial="hidden" whileInView="show" viewport={{ once: true }} className="w-full">
              <div className="bg-white p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                  
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-sm md:text-lg font-black flex items-center gap-2 text-slate-700 uppercase tracking-widest"><TrendingUp size={18} className="text-[#08C2FF]" /> Analisis</h3>
                    <div className="flex bg-[#F8FAFC] p-1 rounded-xl border border-slate-100">
                      <button onClick={() => setChartType('bar')} className={`p-1.5 md:p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-[#006BFF] text-white shadow-sm' : 'text-slate-400'}`}><BarChart2 size={16} strokeWidth={3} /></button>
                      <button onClick={() => setChartType('line')} className={`p-1.5 md:p-2 rounded-lg transition-all ${chartType === 'line' ? 'bg-[#006BFF] text-white shadow-sm' : 'text-slate-400'}`}><Activity size={16} strokeWidth={3} /></button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex bg-[#F8FAFC] p-1 rounded-xl md:rounded-2xl border border-slate-100 w-full sm:w-auto">
                      {['harian', 'bulanan', 'tahunan'].map((type) => (
                        <button key={type} onClick={() => setFilterGrafik(type)} className={`flex-1 sm:px-4 py-1.5 md:py-2 text-[9px] md:text-xs font-black rounded-lg md:rounded-xl transition-all uppercase tracking-tighter ${filterGrafik === type ? 'bg-[#08C2FF] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                          {type}
                        </button>
                      ))}
                    </div>
                    {filterGrafik === 'bulanan' && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between bg-[#F8FAFC] px-3 py-1.5 md:py-2 rounded-xl border border-slate-100">
                        <span className="text-[10px] md:text-xs font-bold text-slate-500 mr-2">Bulan:</span>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-white border border-[#BCF2F6] text-[10px] md:text-xs font-black rounded-md px-2 py-1 outline-none text-[#006BFF] cursor-pointer shadow-sm hover:border-[#08C2FF] transition-all">
                          {namaBulan.map((bulan, index) => <option key={index + 1} value={index + 1}>{bulan}</option>)}
                        </select>
                      </motion.div>
                    )}
                  </div>

                  <div className="h-52 md:h-72 w-full -ml-4 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === 'bar' ? (
                        <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }} tickFormatter={formatRupiahUntukGrafik} width={80} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                          <Bar dataKey="masuk" name="Nabung" fill="#006BFF" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          <Bar dataKey="keluar" name="Tarik" fill="#08C2FF" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      ) : (
                        <LineChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }} tickFormatter={formatRupiahUntukGrafik} width={80} />
                          <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                          <Line type="monotone" dataKey="masuk" name="Nabung" stroke="#006BFF" strokeWidth={4} />
                          <Line type="monotone" dataKey="keluar" name="Tarik" stroke="#08C2FF" strokeWidth={4} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
              </div>
            </motion.div>

          </motion.div>
        )}

        {/* --- HALAMAN 2: WALLET --- */}
        {activeTab === 'wallet' && (
          <motion.div key="wallet" variants={pageVariant} initial="initial" animate="animate" exit="exit" className="max-w-5xl mx-auto px-5 w-full pb-32 pt-6">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><Wallet className="text-[#006BFF]"/> Dompetku</h2>
            
            <div className="bg-gradient-to-tr from-[#006BFF] to-[#08C2FF] p-6 md:p-8 rounded-[2rem] text-white shadow-xl shadow-[#006BFF]/20 relative overflow-hidden mb-8">
              <div className="absolute right-0 top-0 w-40 h-40 bg-white opacity-10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start mb-8 relative z-10">
                <CreditCard size={32} className="opacity-80"/>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold tracking-widest backdrop-blur-sm">AKTIF</span>
              </div>
              <p className="text-sm font-medium opacity-80 mb-1 relative z-10">Saldo Tersedia</p>
              <h3 className="text-4xl font-black tracking-tight relative z-10">Rp {totalTabungan.toLocaleString('id-ID')}</h3>
            </div>

            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">Aksi Cepat</h3>
            <div className="grid grid-cols-2 gap-4 mb-10">
              <button onClick={() => setActionModal({ show: true, type: 'add', step: 1, selectedId: null, inputAmount: '' })} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-[#006BFF] hover:shadow-md transition-all active:scale-95">
                <div className="w-12 h-12 rounded-full bg-[#006BFF]/10 text-[#006BFF] flex items-center justify-center"><PlusCircle size={24} /></div>
                <span className="text-xs font-bold text-slate-700">Tabung</span>
              </button>
              <button onClick={() => setActionModal({ show: true, type: 'sub', step: 1, selectedId: null, inputAmount: '' })} className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-2 hover:border-[#08C2FF] hover:shadow-md transition-all active:scale-95">
                <div className="w-12 h-12 rounded-full bg-[#08C2FF]/10 text-[#08C2FF] flex items-center justify-center"><ArrowUpRight size={24} /></div>
                <span className="text-xs font-bold text-slate-700">Ambil Tabungan</span>
              </button>
            </div>

            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">Alokasi Dana Aktif</h3>
            <div className="flex flex-col gap-3">
              {targets.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {item.gambar ? (
                      <img src={item.gambar} alt="icon" className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#F8FAFC] border border-slate-200 flex items-center justify-center text-lg">🎯</div>
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-slate-800">{item.nama_barang}</h4>
                      <p className="text-[10px] font-bold text-slate-400">Target: Rp {item.harga_saat_ini.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-[#006BFF] text-sm">Rp {item.tabungan_terkumpul.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* --- HALAMAN 3: HISTORY --- */}
        {activeTab === 'history' && (
          <motion.div key="history" variants={pageVariant} initial="initial" animate="animate" exit="exit" className="max-w-5xl mx-auto px-5 w-full pb-32 pt-6">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><History className="text-[#006BFF]"/> Riwayat</h2>
            
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-2">
              {historyTransaksi.length === 0 ? (
                 <p className="text-center text-slate-400 font-bold p-5">Belum ada riwayat transaksi.</p>
              ) : (
                historyTransaksi.map((trx, index) => {
                  const Icon = trx.icon;
                  const isMasuk = trx.type === 'in';
                  return (
                    <div key={trx.id} className={`flex items-center justify-between p-4 ${index !== historyTransaksi.length -1 ? 'border-b border-slate-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${isMasuk ? 'bg-[#006BFF]/10 text-[#006BFF]' : 'bg-[#08C2FF]/10 text-[#08C2FF]'}`}>
                          <Icon size={20} strokeWidth={3} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-800">{trx.title}</h4>
                          <p className="text-[10px] font-bold text-slate-400 mt-0.5">{trx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${isMasuk ? 'text-[#006BFF]' : 'text-[#08C2FF]'}`}>
                          {isMasuk ? '+' : '-'}Rp {trx.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </motion.div>
        )}

        {/* --- HALAMAN 4: PROFILE --- */}
        {activeTab === 'profile' && (
          <motion.div key="profile" variants={pageVariant} initial="initial" animate="animate" exit="exit" className="max-w-5xl mx-auto px-5 w-full pb-32 pt-6">
            <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2"><User className="text-[#006BFF]"/> Profil Saya</h2>
            
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 mb-8">
              <div className="w-20 h-20 rounded-full bg-[#FFF100] border-4 border-[#006BFF] flex items-center justify-center shadow-md shrink-0">
                <span className="text-2xl font-black text-[#006BFF]">{profileData.nama ? profileData.nama.substring(0,2).toUpperCase() : 'IT'}</span>
              </div>
              <div className="overflow-hidden">
                <h3 className="text-xl font-black text-slate-800 truncate">{profileData.nama}</h3>
                <p className="text-sm font-bold text-slate-400 truncate">{profileData.instansi}</p>
                <span className="inline-block mt-2 bg-[#BCF2F6] text-[#006BFF] px-3 py-1 rounded-full text-[10px] font-black uppercase">Member Aktif</span>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">Pengaturan Akun</h3>
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-2 mb-8">
              {[
                { icon: User, title: 'Edit Profil', color: 'text-[#006BFF]', bg: 'bg-[#006BFF]/10' },
                { icon: Bell, title: 'Notifikasi', color: 'text-orange-500', bg: 'bg-orange-100' },
                { icon: Shield, title: 'Keamanan', color: 'text-emerald-500', bg: 'bg-emerald-100' },
                { icon: Settings, title: 'Preferensi Aplikasi', color: 'text-slate-500', bg: 'bg-slate-100' },
              ].map((menu, idx) => (
                <div key={idx} onClick={() => handleOpenSettings(menu.title)} className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors active:scale-[0.98]">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${menu.bg} ${menu.color}`}>
                      <menu.icon size={18} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-sm text-slate-700">{menu.title}</span>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>
              ))}
            </div>

            <button onClick={() => alert('Keluar dari aplikasi...')} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-100 active:scale-95 transition-all">
              <LogOut size={18} strokeWidth={3} /> KELUAR APLIKASI
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL TAMBAH BARANG BARU --- */}
      <AnimatePresence>
        {addModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end justify-center sm:items-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-[#F8FAFC] w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-10 sm:pb-6 max-h-[90vh] flex flex-col shadow-2xl border-t border-slate-200">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-black text-xl text-slate-800 leading-tight">Tambah Barang</h3>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1">Masukkan target tabungan barumu.</p>
                </div>
                <button onClick={() => setAddModal(false)} className="p-2 bg-slate-200 rounded-full text-slate-500 hover:bg-slate-300 transition-colors"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nama Barang</label>
                  <input type="text" value={newItem.nama} onChange={(e) => setNewItem({...newItem, nama: e.target.value})} className="mt-1 w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#006BFF] transition-colors" placeholder="Misal: PS5 Pro" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Harga Target (Rp)</label>
                  <input type="number" value={newItem.harga} onChange={(e) => setNewItem({...newItem, harga: e.target.value})} className="mt-1 w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#006BFF] transition-colors" placeholder="Misal: 12000000" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1"><ImageIcon size={12}/> Link Gambar (Opsional)</label>
                  <input type="text" value={newItem.gambar} onChange={(e) => setNewItem({...newItem, gambar: e.target.value})} className="mt-1 w-full bg-white border border-slate-200 p-4 rounded-2xl text-[11px] font-bold outline-none focus:border-[#006BFF] transition-colors" placeholder="https://..." />
                </div>
                
                <button onClick={handleAddTarget} className="mt-2 w-full bg-[#006BFF] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#006BFF]/30 active:scale-95 transition-all">
                  SIMPAN KE KATALOG
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL TRANSAKSI KEUANGAN --- */}
      <AnimatePresence>
        {actionModal.show && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end justify-center sm:items-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-[#F8FAFC] w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-5 pb-10 sm:pb-5 max-h-[85vh] flex flex-col shadow-2xl border-t border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  {actionModal.step === 2 && (<button onClick={() => setActionModal({ ...actionModal, step: 1, inputAmount: '' })} className="p-2 bg-white rounded-full text-slate-600 shadow-sm"><ChevronLeft size={20}/></button>)}
                  <div>
                    <h3 className="font-black text-lg text-slate-800 leading-tight">{actionModal.type === 'add' ? 'Tabung Uang' : 'Ambil Tabungan'}</h3>
                    <p className="text-[10px] font-bold text-slate-400">{actionModal.step === 1 ? 'Pilih target barang' : 'Masukkan nominal'}</p>
                  </div>
                </div>
                <button onClick={() => setActionModal({ show: false, type: null, step: 1, selectedId: null, inputAmount: '' })} className="p-2 bg-slate-200 rounded-full text-slate-500 hover:bg-slate-300 transition-colors"><X size={20}/></button>
              </div>

              {actionModal.step === 1 && (
                <div className="flex flex-col gap-3 overflow-y-auto no-scrollbar pb-5">
                  {targets.map(t => {
                    const isLunas = t.tabungan_terkumpul >= t.harga_saat_ini;
                    if (actionModal.type === 'sub' && t.tabungan_terkumpul <= 0) return null;
                    if (actionModal.type === 'add' && isLunas) return null;
                    return (
                      <div key={t.id} onClick={() => setActionModal({ ...actionModal, step: 2, selectedId: t.id })} className={`bg-white p-4 rounded-2xl border-2 border-transparent cursor-pointer flex justify-between items-center shadow-sm transition-all hover:border-[#006BFF]/30 active:scale-[0.98]`}>
                        <div><h4 className="font-bold text-sm text-slate-800">{t.nama_barang}</h4><p className="text-[10px] font-bold text-slate-400 mt-1">Sisa Target: Rp {(t.harga_saat_ini - t.tabungan_terkumpul).toLocaleString()}</p></div>
                        <div className="text-right"><span className="text-[10px] font-bold text-slate-400">Terkumpul</span><p className="font-black text-[#006BFF] text-sm">Rp {t.tabungan_terkumpul.toLocaleString()}</p></div>
                      </div>
                    );
                  })}
                </div>
              )}

              {actionModal.step === 2 && (
                <div className="flex flex-col justify-between h-full">
                  <div className="bg-white border border-[#08C2FF]/30 rounded-2xl p-5 mb-6 flex flex-col items-center shadow-sm">
                    <span className="text-xs font-bold text-slate-400 mb-2">Rp</span>
                    <input autoFocus type="number" value={actionModal.inputAmount} onChange={(e) => setActionModal({ ...actionModal, inputAmount: e.target.value })} placeholder="0" className="bg-transparent w-full outline-none text-4xl font-black text-[#006BFF] text-center" />
                  </div>
                  <button onClick={handleModalSubmit} className={`w-full py-4 rounded-2xl text-sm font-black text-white shadow-lg transition-transform active:scale-95 ${actionModal.type === 'add' ? 'bg-[#006BFF] shadow-[#006BFF]/30' : 'bg-[#08C2FF] shadow-[#08C2FF]/30'}`}>KONFIRMASI {actionModal.type === 'add' ? 'TABUNGAN' : 'PENARIKAN'}</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MODAL PENGATURAN AKUN --- */}
      <AnimatePresence>
        {settingsModal.show && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-end justify-center sm:items-center">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="bg-[#F8FAFC] w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 pb-10 sm:pb-6 max-h-[85vh] flex flex-col shadow-2xl border-t border-slate-200">
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-black text-xl text-slate-800 leading-tight">{settingsModal.menu}</h3>
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 mt-1">Ubah preferensi {settingsModal.menu.toLowerCase()} kamu.</p>
                </div>
                <button onClick={() => setSettingsModal({ show: false, menu: null })} className="p-2 bg-slate-200 rounded-full text-slate-500 hover:bg-slate-300 transition-colors"><X size={20}/></button>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar">
                
                {/* Form Edit Profil */}
                {settingsModal.menu === 'Edit Profil' && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Nama Lengkap / Panggilan</label>
                      <input type="text" value={editProfileForm.nama} onChange={(e) => setEditProfileForm({...editProfileForm, nama: e.target.value})} className="mt-1 w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#006BFF] transition-colors" placeholder="Masukkan nama kamu" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Instansi / Sekolah / Pekerjaan</label>
                      <input type="text" value={editProfileForm.instansi} onChange={(e) => setEditProfileForm({...editProfileForm, instansi: e.target.value})} className="mt-1 w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#006BFF] transition-colors" placeholder="Masukkan nama instansi" />
                    </div>
                    <button onClick={handleSaveProfile} className="mt-4 w-full bg-[#006BFF] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#006BFF]/30 active:scale-95 transition-all">SIMPAN PROFIL</button>
                  </div>
                )}

                {/* Form Notifikasi */}
                {settingsModal.menu === 'Notifikasi' && (
                  <div className="flex flex-col gap-3">
                    {[
                      { label: 'Pengingat Nabung Harian', stateKey: 'pengingatHarian' },
                      { label: 'Peringatan Saldo Menipis', stateKey: 'saldoMenipis' },
                      { label: 'Info Pembaruan Aplikasi', stateKey: 'infoPembaruan' }
                    ].map((item, i) => {
                      const isActive = notifSettings[item.stateKey];
                      return (
                        <div key={i} onClick={() => handleToggleNotif(item.stateKey)} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm cursor-pointer active:scale-[0.98] transition-transform">
                          <span className="font-bold text-sm text-slate-700">{item.label}</span>
                          <div className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors duration-300 ${isActive ? 'bg-[#006BFF]' : 'bg-slate-200'}`}>
                             <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                          </div>
                        </div>
                      )
                    })}
                    <button onClick={handleFakeSaveSettings} className="mt-4 w-full bg-[#006BFF] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#006BFF]/30 active:scale-95 transition-all">SIMPAN PENGATURAN</button>
                  </div>
                )}

                {/* Form Keamanan */}
                {settingsModal.menu === 'Keamanan' && (
                  <div className="flex flex-col gap-4">
                    <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-2">
                      <p className="text-xs font-bold text-orange-600 flex items-center gap-2"><Lock size={16}/> Jaga kerahasiaan PIN/Password kamu.</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Password Lama</label>
                      <input type="password" placeholder="••••••••" className="mt-1 w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#006BFF] transition-colors" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Password Baru</label>
                      <input type="password" placeholder="••••••••" className="mt-1 w-full bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#006BFF] transition-colors" />
                    </div>
                    <button onClick={handleFakeSaveSettings} className="mt-4 w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-all">PERBARUI PASSWORD</button>
                  </div>
                )}

                {/* Form Preferensi Aplikasi */}
                {settingsModal.menu === 'Preferensi Aplikasi' && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Tampilan Tema</label>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setAppPreferences({...appPreferences, tema: 'terang'})}
                          className={`flex-1 font-bold p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${appPreferences.tema === 'terang' ? 'bg-white border-2 border-[#006BFF] text-[#006BFF] shadow-sm' : 'bg-slate-100 border-2 border-transparent text-slate-500 hover:bg-slate-200'}`}
                        ><Settings size={16}/> Terang</button>
                        <button 
                          onClick={() => setAppPreferences({...appPreferences, tema: 'gelap'})}
                          className={`flex-1 font-bold p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${appPreferences.tema === 'gelap' ? 'bg-white border-2 border-[#006BFF] text-[#006BFF] shadow-sm' : 'bg-slate-100 border-2 border-transparent text-slate-500 hover:bg-slate-200'}`}
                        ><Moon size={16}/> Gelap</button>
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 mb-2 block">Bahasa</label>
                      <div className="flex gap-3">
                        <button 
                          onClick={() => setAppPreferences({...appPreferences, bahasa: 'indonesia'})}
                          className={`flex-1 font-bold p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${appPreferences.bahasa === 'indonesia' ? 'bg-white border-2 border-[#006BFF] text-[#006BFF] shadow-sm' : 'bg-slate-100 border-2 border-transparent text-slate-500 hover:bg-slate-200'}`}
                        ><Globe size={16}/> Indonesia</button>
                        <button 
                          onClick={() => setAppPreferences({...appPreferences, bahasa: 'english'})}
                          className={`flex-1 font-bold p-3 rounded-xl flex items-center justify-center gap-2 transition-all ${appPreferences.bahasa === 'english' ? 'bg-white border-2 border-[#006BFF] text-[#006BFF] shadow-sm' : 'bg-slate-100 border-2 border-transparent text-slate-500 hover:bg-slate-200'}`}
                        >English</button>
                      </div>
                    </div>
                    <button onClick={handleFakeSaveSettings} className="mt-4 w-full bg-[#006BFF] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#006BFF]/30 active:scale-95 transition-all">SIMPAN PREFERENSI</button>
                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVBAR BAWAH */}
      <motion.nav initial={{ y: 80 }} animate={{ y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="fixed bottom-5 left-1/2 transform -translate-x-1/2 w-[calc(100%-2.5rem)] md:w-[450px] bg-white/90 backdrop-blur-xl border border-slate-100 shadow-2xl shadow-[#006BFF]/10 rounded-[2rem] p-1.5 md:p-2 flex justify-around items-center z-50">
        {[
          { id: 'home', icon: Home, label: 'Beranda' },
          { id: 'wallet', icon: Wallet, label: 'Keuangan' },
          { id: 'history', icon: History, label: 'Riwayat' },
          { id: 'profile', icon: User, label: 'Profil' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 p-2 md:p-3 rounded-2xl transition-all active:scale-95 w-16 md:w-20 ${activeTab === tab.id ? 'bg-[#006BFF] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50 hover:text-[#006BFF]'}`}>
            <tab.icon size={22} strokeWidth={2.5} />
            {activeTab === tab.id && <span className="text-[9px] font-black">{tab.label}</span>}
          </button>
        ))}
      </motion.nav>

    </div>
  );
}

export default App;
