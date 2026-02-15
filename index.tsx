
import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Users, CreditCard, Megaphone, LayoutDashboard, Plus, Search, 
  MessageSquare, Send, X, Menu, ChevronRight, TrendingUp, 
  AlertCircle, FileText, UserPlus, Calendar, Wallet, Home, 
  Phone, Briefcase, FileCheck, ShieldCheck, UserCircle, Download,
  Filter, MoreVertical, CheckCircle2, Clock, Trash2, Edit3, Printer,
  History, ArrowUpRight, ArrowDownRight, QrCode, FileSpreadsheet, Settings,
  CloudOff, Cloud, User, MapPin, Hash, BriefcaseBusiness
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// --- Supabase Config & Safe Initialization ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// --- Mock Data ---
const MOCK_WARGA: Warga[] = [
  { id: 'w1', nik: '3273011010800001', nama: 'Budi Santoso', jk: 'L', tglLahir: '1980-10-10', pekerjaan: 'PNS', phone: '08123456789', statusKeluarga: 'Kepala Keluarga', kkId: 'kk1' },
  { id: 'w2', nik: '3273011010800002', nama: 'Siti Aminah', jk: 'P', tglLahir: '1982-05-15', pekerjaan: 'Wiraswasta', phone: '08129876543', statusKeluarga: 'Istri', kkId: 'kk1' },
  { id: 'w3', nik: '3273011010800003', nama: 'Andi Pratama', jk: 'L', tglLahir: '1995-12-20', pekerjaan: 'Mahasiswa', phone: '081333444555', statusKeluarga: 'Kepala Keluarga', kkId: 'kk2' },
];

const MOCK_KK: Keluarga[] = [
  { id: 'kk1', nomorKK: '3273010101010001', alamat: 'Jl. Melati No. 12, RT 04/RW 02', kepalaKeluarga: 'Budi Santoso' },
  { id: 'kk2', nomorKK: '3273010101010002', alamat: 'Jl. Anggrek No. 05, RT 04/RW 02', kepalaKeluarga: 'Andi Pratama' },
];

const MOCK_LOGS: AuditLog[] = [
  { id: 'l1', user: 'System', action: 'Aplikasi berjalan dalam mode Demo', timestamp: new Date().toLocaleString() },
];

// --- Types ---
type Role = 'admin' | 'pengurus' | 'warga';

interface Warga {
  id: string;
  nik: string;
  nama: string;
  jk: 'L' | 'P';
  tglLahir: string;
  pekerjaan: string;
  phone: string;
  statusKeluarga: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Lainnya';
  kkId: string;
}

interface Keluarga {
  id: string;
  nomorKK: string;
  alamat: string;
  kepalaKeluarga: string;
}

interface Transaction {
  id: string;
  wargaId: string;
  wargaNama: string;
  amount: number;
  date: string;
  type: 'Keamanan' | 'Kebersihan' | 'Kas RT';
  status: 'Lunas' | 'Belum';
  bulan: string;
  tahun: string;
}

interface LetterRequest {
  id: string;
  wargaId: string;
  wargaNama: string;
  type: 'Domisili' | 'Pengantar' | 'Keterangan Usaha';
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
  reason: string;
}

interface AuditLog {
  id: string;
  user: string;
  action: string;
  timestamp: string;
}

// --- Components ---
const Card = ({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) => (
  <div className={`bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${className}`}>
    <div className={noPadding ? "" : "p-6"}>{children}</div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-800 tracking-tight">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-8 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

// --- View: Dashboard ---
const DashboardView = ({ stats, logs, isOffline }: { stats: any, logs: AuditLog[], isOffline: boolean }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {isOffline && (
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4 text-amber-800">
        <div className="p-2 bg-amber-100 rounded-xl text-amber-600"><AlertCircle size={20} /></div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest">Demo Mode Active</p>
          <p className="text-[11px] font-medium opacity-80">Menggunakan data simulasi lokal. Hubungkan Supabase untuk persistensi data.</p>
        </div>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[
        { label: 'Total Warga', value: stats.wargaCount, trend: '+3%', icon: Users, color: 'blue' },
        { label: 'Keluarga (KK)', value: stats.kkCount, trend: 'Stabil', icon: Home, color: 'indigo' },
        { label: 'Kas RT 04', value: `Rp ${stats.totalIuran.toLocaleString('id-ID')}`, trend: '+12%', icon: Wallet, color: 'emerald' },
        { label: 'Layanan Surat', value: stats.pendingLetters, trend: 'Stabil', sub: 'Perlu Approval', icon: FileText, color: 'amber' },
      ].map((item, idx) => (
        <Card key={idx}>
          <div className="flex justify-between items-start">
            <div className={`p-3 rounded-2xl bg-slate-50 text-${item.color}-600`}><item.icon size={24} /></div>
            {item.trend && item.trend !== 'Stabil' && (
              <span className={`flex items-center text-[10px] font-bold ${item.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {item.trend.startsWith('+') ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
                {item.trend}
              </span>
            )}
          </div>
          <div className="mt-5">
            <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{item.label}</h3>
            <p className="text-2xl font-black text-slate-800 mt-1 tracking-tight">{item.value}</p>
          </div>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="lg:col-span-2">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-black text-slate-800 text-xl tracking-tight">Ikhtisar Keuangan</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">{isOffline ? 'Data Simulasi Lokal' : 'Real-time Sync Active'}</p>
          </div>
        </div>
        <div className="h-64 flex items-end justify-between gap-4 px-2">
          {[40, 25, 60, 85, 45, 95, 75, 50, 65, 80, 55, 30].map((h, i) => (
            <div key={i} className="flex-1 bg-slate-50/50 rounded-t-2xl relative group">
              <div style={{ height: `${h}%` }} className="bg-blue-600 rounded-t-2xl w-full absolute bottom-0 transition-all duration-500 group-hover:bg-blue-400"></div>
            </div>
          ))}
        </div>
      </Card>
      <Card noPadding>
        <div className="p-6 border-b border-slate-50"><h3 className="font-black text-slate-800 text-xl tracking-tight">Audit Log</h3></div>
        <div className="divide-y divide-slate-50">
          {logs.map(log => (
            <div key={log.id} className="p-5 hover:bg-slate-50 transition-colors group flex gap-4">
              <div className="p-2 bg-slate-100 text-slate-400 rounded-xl shrink-0"><History size={16} /></div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-snug">{log.action}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-1">{log.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

// --- View: Database Warga ---
const WargaView = ({ data, kkList, onAdd }: { data: Warga[], kkList: Keluarga[], onAdd: (w: Warga) => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setModalOpen] = useState(false);
  const filtered = data.filter(w => w.nama.toLowerCase().includes(searchTerm.toLowerCase()) || w.nik.includes(searchTerm));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari Nama atau NIK..." 
            className="w-full bg-white border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all"
        >
          <UserPlus size={18} /> Tambah Warga
        </button>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                <th className="px-8 py-5">Nama Lengkap</th>
                <th className="px-8 py-5">NIK</th>
                <th className="px-8 py-5">Status Keluarga</th>
                <th className="px-8 py-5">Pekerjaan</th>
                <th className="px-8 py-5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(w => (
                <tr key={w.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs uppercase group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                        {w.nama.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-none">{w.nama}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">{w.jk === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600 font-mono">{w.nik}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${w.statusKeluarga === 'Kepala Keluarga' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                      {w.statusKeluarga}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-medium text-slate-500">{w.pekerjaan}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"><Edit3 size={16} /></button>
                      <button className="p-2 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><Users size={32} /></div>
              <p className="text-slate-400 text-sm font-medium">Data warga tidak ditemukan.</p>
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Tambah Warga Baru">
        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          onAdd({
            id: Math.random().toString(36).substr(2, 9),
            nik: formData.get('nik') as string,
            nama: formData.get('nama') as string,
            jk: formData.get('jk') as 'L' | 'P',
            tglLahir: formData.get('tglLahir') as string,
            pekerjaan: formData.get('pekerjaan') as string,
            phone: formData.get('phone') as string,
            statusKeluarga: formData.get('statusKeluarga') as any,
            kkId: formData.get('kkId') as string,
          });
          setModalOpen(false);
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Lengkap</label>
              <input name="nama" required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold" placeholder="Contoh: Ahmad Subagja" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">NIK (KTP)</label>
              <input name="nik" required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold" placeholder="16 Digit NIK" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jenis Kelamin</label>
              <select name="jk" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold">
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Keluarga</label>
              <select name="statusKeluarga" className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold">
                <option value="Kepala Keluarga">Kepala Keluarga</option>
                <option value="Istri">Istri</option>
                <option value="Anak">Anak</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nomor KK Terkait</label>
            <select name="kkId" required className="w-full bg-slate-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold">
              <option value="">Pilih Kartu Keluarga...</option>
              {kkList.map(k => <option key={k.id} value={k.id}>{k.nomorKK} - {k.kepalaKeluarga}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all mt-4">Simpan Data Warga</button>
        </form>
      </Modal>
    </div>
  );
};

// --- View: Kartu Keluarga ---
const KKView = ({ data, warga }: { data: Keluarga[], warga: Warga[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const filtered = data.filter(k => k.nomorKK.includes(searchTerm) || k.kepalaKeluarga.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari No. KK atau Kepala Keluarga..." 
            className="w-full bg-white border border-slate-100 pl-12 pr-4 py-3.5 rounded-2xl text-sm focus:ring-2 focus:ring-blue-600 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(k => {
          const members = warga.filter(w => w.kkId === k.id);
          return (
            <Card key={k.id} className="hover:-translate-y-1 transition-transform group">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Home size={24} /></div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Anggota Keluarga</p>
                   <p className="text-xl font-black text-slate-800 mt-1">{members.length}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nomor Kartu Keluarga</p>
                  <p className="text-sm font-black text-slate-800 font-mono tracking-wider">{k.nomorKK}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kepala Keluarga</p>
                  <p className="text-sm font-bold text-slate-700">{k.kepalaKeluarga}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alamat</p>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">{k.alamat}</p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
                 <button className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-800 transition-colors">Lihat Detail Anggota</button>
                 <button className="p-2 hover:bg-slate-50 rounded-xl transition-colors"><MoreVertical size={16} className="text-slate-400" /></button>
              </div>
            </Card>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <div className="py-20 text-center bg-white rounded-[2.5rem] border border-slate-100">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><Home size={32} /></div>
          <p className="text-slate-400 text-sm font-medium">Data Kartu Keluarga tidak ditemukan.</p>
        </div>
      )}
    </div>
  );
};

// --- Main App Component ---
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState<Role>('admin');
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!supabase);
  
  const [warga, setWarga] = useState<Warga[]>([]);
  const [kk, setKK] = useState<Keluarga[]>([]);
  const [iuran, setIuran] = useState<Transaction[]>([]);
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!supabase) {
        setWarga(MOCK_WARGA);
        setKK(MOCK_KK);
        setLogs(MOCK_LOGS);
        setIsOffline(true);
        setLoading(false);
        return;
      }

      try {
        const [{ data: dataWarga }, { data: dataKK }, { data: dataIuran }, { data: dataLetters }, { data: dataLogs }] = await Promise.all([
          supabase.from('warga').select('*'),
          supabase.from('keluarga').select('*'),
          supabase.from('iuran').select('*'),
          supabase.from('letters').select('*'),
          supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(5)
        ]);

        setWarga(dataWarga || []);
        setKK(dataKK || []);
        setIuran(dataIuran || []);
        setLetters(dataLetters || []);
        setLogs(dataLogs || []);
        setIsOffline(false);
      } catch (error) {
        setIsOffline(true);
        setWarga(MOCK_WARGA);
        setKK(MOCK_KK);
        setLogs([{ id: 'err', action: 'Gagal sinkronisasi cloud. Menggunakan offline data.', user: 'System', timestamp: new Date().toLocaleString() }]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddWarga = async (newWarga: Warga) => {
    const logAction = {
      id: Math.random().toString(),
      user: 'Admin',
      action: `Menambah warga: ${newWarga.nama}`,
      timestamp: new Date().toLocaleString()
    };
    
    setWarga(prev => [newWarga, ...prev]);
    setLogs(prev => [logAction, ...prev.slice(0, 4)]);

    if (supabase) {
      try {
        await supabase.from('warga').insert([newWarga]);
        await supabase.from('audit_logs').insert([logAction]);
      } catch (e) {
        console.error("Cloud insert failed", e);
      }
    }
  };

  const stats = useMemo(() => ({
    wargaCount: warga.length,
    kkCount: kk.length,
    totalIuran: iuran.reduce((sum, i) => sum + i.amount, 0),
    pendingLetters: letters.filter(l => l.status === 'Pending').length
  }), [warga, kk, iuran, letters]);

  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'warga', label: 'Database Warga', icon: Users, roles: ['admin', 'pengurus'] },
    { id: 'kk', label: 'Kartu Keluarga', icon: Home, roles: ['admin', 'pengurus', 'warga'] },
    { id: 'iuran', label: 'Keuangan & Kas', icon: Wallet, roles: ['admin', 'pengurus', 'warga'] },
    { id: 'surat', label: 'Layanan Surat', icon: FileCheck, roles: ['admin', 'pengurus', 'warga'] },
    { id: 'settings', label: 'Pengaturan', icon: Settings, roles: ['admin'] },
  ];

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-6 text-sm font-black text-slate-800 uppercase tracking-widest animate-pulse">Syncing Cloud...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <aside className="w-72 bg-white border-r border-slate-100 flex flex-col hidden lg:flex">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-500/20"><ShieldCheck size={24} /></div>
            <div className="flex flex-col">
              <h1 className="text-xl font-black text-slate-800 tracking-tighter leading-none">SMART RT</h1>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1">{isOffline ? 'Demo Mode' : 'Cloud Ready'}</span>
            </div>
          </div>
          <nav className="space-y-2">
            {menuItems.filter(i => !i.roles || i.roles.includes(role)).map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-50'}`}>
                <item.icon size={20} />
                <span className="font-bold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="p-8 mt-auto">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
             <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-slate-100"><UserCircle size={28} /></div>
                <div>
                   <p className="text-xs font-black text-slate-800 truncate max-w-[120px]">{role === 'admin' ? 'Ketua RT 04' : 'Warga RT 04'}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{role}</p>
                </div>
             </div>
             <div className="grid grid-cols-3 gap-1.5">
                {['admin', 'pengurus', 'warga'].map(r => (
                  <button key={r} onClick={() => setRole(r as Role)} className={`py-1.5 rounded-lg text-[8px] font-black uppercase ${role === r ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border hover:bg-slate-50'}`}>{r.slice(0, 3)}</button>
                ))}
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100 px-10 py-5 flex justify-between items-center">
           <div className="flex flex-col">
              <h2 className="font-black text-slate-800 text-xl capitalize tracking-tight">{activeTab.replace('-', ' ')}</h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className={`w-2 h-2 rounded-full animate-pulse ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em]">{isOffline ? 'Configuration Required' : 'Verified by Supabase Cloud'}</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 relative">
                 <Calendar size={18} />
                 <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
              </div>
           </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView stats={stats} logs={logs} isOffline={isOffline} />}
          {activeTab === 'warga' && <WargaView data={warga} kkList={kk} onAdd={handleAddWarga} />}
          {activeTab === 'kk' && <KKView data={kk} warga={warga} />}
          
          {['iuran', 'surat', 'settings'].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in-95 duration-500">
               <div className="w-32 h-32 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mb-8"><Clock size={48} className="text-blue-200" /></div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">Modul {activeTab.toUpperCase()}</h3>
               <p className="text-slate-400 mt-2 max-w-md font-medium">Pengembangan modul berlanjut. Fitur cloud database akan segera diaktifkan.</p>
               <button onClick={() => setActiveTab('dashboard')} className="mt-10 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Back to Overview</button>
            </div>
          )}
        </div>
      </main>

      <AIChatbot isOffline={isOffline} />
    </div>
  );
};

const AIChatbot = ({ isOffline }: { isOffline: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: 'Halo! Saya SmartRT Assistant. Bagaimana saya bisa membantu Anda hari ini?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const txt = input;
    setMessages(prev => [...prev, { role: 'user', text: txt }]);
    setInput('');
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const resp = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: txt,
        config: { systemInstruction: `Kamu adalah asisten pintar RT 04 yang efisien. Cloud status: ${isOffline ? 'Offline' : 'Online'}.` }
      });
      setMessages(prev => [...prev, { role: 'bot', text: resp.text || 'Gagal memproses permintaan.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Sistem AI sedang sibuk.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-[60]">
      {!isOpen ? (
        <button onClick={() => setIsOpen(true)} className="bg-slate-900 text-white p-5 rounded-[2rem] shadow-2xl flex items-center gap-3 hover:scale-105 transition-all">
          <MessageSquare size={24} />
          <span className="text-xs font-black uppercase tracking-widest pr-2">Smart Assistant</span>
        </button>
      ) : (
        <div className="bg-white w-[26rem] rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center"><ShieldCheck size={20} /></div>
               <div>
                  <h3 className="font-black text-sm uppercase tracking-widest leading-none">SmartRT Bot</h3>
                  <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Sistem Pintar RT 04</p>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
          </div>
          <div className="h-96 overflow-y-auto p-8 space-y-6 bg-[#FDFDFD]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-xs font-medium leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white shadow-sm border text-slate-700'}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-white border-t border-slate-50 flex gap-3">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-medium outline-none" placeholder="Tanya tentang warga..." />
            <button onClick={sendMessage} className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg hover:bg-slate-800 transition-colors"><Send size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
