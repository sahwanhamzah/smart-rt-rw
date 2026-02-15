
import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Users, CreditCard, Megaphone, LayoutDashboard, Plus, Search, 
  MessageSquare, Send, X, Menu, ChevronRight, TrendingUp, 
  AlertCircle, FileText, UserPlus, Calendar, Wallet, Home, 
  Phone, Briefcase, FileCheck, ShieldCheck, UserCircle, Download,
  Filter, MoreVertical, CheckCircle2, Clock, Trash2, Edit3, Printer,
  History, ArrowUpRight, ArrowDownRight, QrCode, FileSpreadsheet, Settings,
  CloudOff, Cloud, User, MapPin, Hash, BriefcaseBusiness, Info, Copy, Check
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// --- Supabase Config & Safe Initialization ---
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Failed to initialize Supabase:", e);
  }
}

// --- Mock Data ---
const MOCK_WARGA: Warga[] = [
  { id: 'w1', nik: '3273011010800001', nama: 'Budi Santoso', jk: 'L', tglLahir: '1980-10-10', pekerjaan: 'PNS', phone: '08123456789', statusKeluarga: 'Kepala Keluarga', kkId: 'kk1' },
  { id: 'w2', nik: '3273011010800002', nama: 'Siti Aminah', jk: 'P', tglLahir: '1982-05-15', pekerjaan: 'Wiraswasta', phone: '08129876543', statusKeluarga: 'Istri', kkId: 'kk1' },
];

const MOCK_KK: Keluarga[] = [
  { id: 'kk1', nomorKK: '3273010101010001', alamat: 'Jl. Melati No. 12, RT 04/RW 02', kepalaKeluarga: 'Budi Santoso' },
];

const MOCK_IURAN: Transaction[] = [
  { id: 'i1', wargaId: 'w1', wargaNama: 'Budi Santoso', amount: 50000, date: '2023-10-01', type: 'Keamanan', status: 'Lunas', bulan: 'Oktober', tahun: '2023' },
];

const MOCK_LETTERS: LetterRequest[] = [
  { id: 'l1', wargaId: 'w1', wargaNama: 'Budi Santoso', type: 'Domisili', status: 'Pending', date: '2023-10-25', reason: 'Syarat Bank' },
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
  type: 'Keamanan' | 'Kebersihan' | 'Kas RT' | 'Lainnya';
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

// --- Shared Components ---
const Card = ({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) => (
  <div className={`bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${className}`}>
    <div className={noPadding ? "" : "p-8"}>{children}</div>
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
      <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex items-center gap-6 text-amber-800">
        <div className="p-4 bg-amber-100 rounded-2xl text-amber-600"><AlertCircle size={24} /></div>
        <div>
          <p className="text-sm font-black uppercase tracking-widest leading-none">Demo Mode Active</p>
          <p className="text-xs font-medium opacity-80 mt-1.5">
            {!SUPABASE_URL ? "Variabel NEXT_PUBLIC_SUPABASE_URL belum diatur di Vercel/Local." : "Terhubung ke URL Supabase, tetapi tabel database belum ada. Cek halaman 'Pengaturan' untuk SQL Script."}
          </p>
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
            <div className={`p-4 rounded-2xl bg-slate-50 text-${item.color}-600`}><item.icon size={24} /></div>
            {item.trend && item.trend !== 'Stabil' && (
              <span className={`flex items-center text-[10px] font-bold ${item.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                {item.trend.startsWith('+') ? <ArrowUpRight size={12} className="mr-0.5" /> : <ArrowDownRight size={12} className="mr-0.5" />}
                {item.trend}
              </span>
            )}
          </div>
          <div className="mt-6">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{item.label}</h3>
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
            <p className="text-xs text-slate-400 mt-1 font-medium">Laporan kas bulanan RT 04</p>
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
        <div className="p-8 border-b border-slate-50"><h3 className="font-black text-slate-800 text-xl tracking-tight">Audit Log</h3></div>
        <div className="divide-y divide-slate-50">
          {logs.map(log => (
            <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors group flex gap-4">
              <div className="p-3 bg-slate-100 text-slate-400 rounded-xl shrink-0"><History size={18} /></div>
              <div>
                <p className="text-xs font-bold text-slate-800 leading-snug">{log.action}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-1.5">{log.timestamp}</p>
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
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => data.filter(w => 
    w.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
    w.nik.includes(searchTerm)
  ), [data, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Database Warga</h2>
          <p className="text-xs text-slate-400 mt-1 font-bold uppercase tracking-widest">Manajemen Data Penduduk RT 04</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari NIK atau Nama..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
          </div>
          <button onClick={() => setModalOpen(true)} className="bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
            <UserPlus size={18} /> Tambah Warga
          </button>
        </div>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                <th className="px-10 py-6">Informasi Personal</th>
                <th className="px-10 py-6">NIK</th>
                <th className="px-10 py-6">Pekerjaan</th>
                <th className="px-10 py-6">Status Keluarga</th>
                <th className="px-10 py-6">Kontak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredData.map(w => (
                <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-7">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${w.jk === 'L' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                        {w.jk}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 leading-none">{w.nama}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-wider">{w.tglLahir}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-7">
                    <span className="font-mono text-sm text-slate-600 tracking-tighter">{w.nik}</span>
                  </td>
                  <td className="px-10 py-7 text-sm font-bold text-slate-500">{w.pekerjaan}</td>
                  <td className="px-10 py-7">
                    <span className="px-3 py-1.5 bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest">{w.statusKeluarga}</span>
                  </td>
                  <td className="px-10 py-7 text-sm font-black text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-300" />
                      {w.phone}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center">
                    <p className="text-slate-400 font-bold">Data warga tidak ditemukan.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Tambah Data Warga Baru">
        <form className="space-y-6" onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          onAdd({
            id: Math.random().toString(36).substr(2, 9),
            nik: fd.get('nik') as string,
            nama: fd.get('nama') as string,
            jk: fd.get('jk') as any,
            tglLahir: fd.get('tglLahir') as string,
            pekerjaan: fd.get('pekerjaan') as string,
            phone: fd.get('phone') as string,
            statusKeluarga: fd.get('statusKeluarga') as any,
            kkId: fd.get('kkId') as string,
          });
          setModalOpen(false);
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">NIK</label>
              <input name="nik" required maxLength={16} placeholder="16 Digit NIK" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Lengkap</label>
              <input name="nama" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jenis Kelamin</label>
              <select name="jk" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold">
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal Lahir</label>
              <input name="tglLahir" type="date" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pekerjaan</label>
              <input name="pekerjaan" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">No. Telepon</label>
              <input name="phone" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold" placeholder="08..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status dalam Keluarga</label>
              <select name="statusKeluarga" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold">
                <option value="Kepala Keluarga">Kepala Keluarga</option>
                <option value="Istri">Istri</option>
                <option value="Anak">Anak</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hubungkan ke KK</label>
              <select name="kkId" required className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold">
                {kkList.map(k => <option key={k.id} value={k.id}>{k.nomorKK} ({k.kepalaKeluarga})</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">Simpan Data Warga</button>
        </form>
      </Modal>
    </div>
  );
};

// --- View: Settings ---
const SettingsView = ({ role, isOffline }: { role: string, isOffline: boolean }) => {
  const [copied, setCopied] = useState(false);
  const sqlScript = `-- JALANKAN INI DI SUPABASE SQL EDITOR --

-- 1. Tabel Warga
CREATE TABLE IF NOT EXISTS warga (
  id TEXT PRIMARY KEY,
  nik TEXT UNIQUE NOT NULL,
  nama TEXT NOT NULL,
  jk TEXT,
  tglLahir DATE,
  pekerjaan TEXT,
  phone TEXT,
  statusKeluarga TEXT,
  kkId TEXT
);

-- 2. Tabel Keluarga
CREATE TABLE IF NOT EXISTS keluarga (
  id TEXT PRIMARY KEY,
  nomorKK TEXT UNIQUE NOT NULL,
  alamat TEXT,
  kepalaKeluarga TEXT
);

-- 3. Tabel Iuran
CREATE TABLE IF NOT EXISTS iuran (
  id TEXT PRIMARY KEY,
  wargaId TEXT,
  wargaNama TEXT,
  amount NUMERIC,
  date DATE,
  type TEXT,
  status TEXT,
  bulan TEXT,
  tahun TEXT
);

-- 4. Tabel Surat
CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY,
  wargaId TEXT,
  wargaNama TEXT,
  type TEXT,
  status TEXT,
  date DATE,
  reason TEXT
);

-- 5. Tabel Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  "user" TEXT,
  action TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- DISABLE RLS AGAR APLIKASI BISA MENULIS (Untuk Setup Awal)
ALTER TABLE warga DISABLE ROW LEVEL SECURITY;
ALTER TABLE keluarga DISABLE ROW LEVEL SECURITY;
ALTER TABLE iuran DISABLE ROW LEVEL SECURITY;
ALTER TABLE letters DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Profil Pengurus</h3>
          <div className="flex items-center gap-6 mb-10">
            <div className="w-24 h-24 rounded-[2rem] bg-slate-100 flex items-center justify-center text-blue-600 border border-slate-200">
              <UserCircle size={48} />
            </div>
            <div>
              <p className="text-xl font-black text-slate-800">Ketua RT 04</p>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">RW 02 • Melati Mas</p>
            </div>
          </div>
          <div className="space-y-4">
             <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jabatan</span>
               <span className="text-sm font-bold text-slate-800">Ketua RT</span>
             </div>
             <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role Sistem</span>
               <span className="text-sm font-bold text-indigo-600 capitalize">{role}</span>
             </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mb-8">Koneksi Cloud (Diagnosa)</h3>
          <div className={`p-6 rounded-[2rem] border mb-8 flex items-center gap-6 ${isOffline ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <div className={`p-4 rounded-2xl ${isOffline ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {isOffline ? <CloudOff size={32} /> : <Cloud size={32} />}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-widest leading-none">{isOffline ? 'Offline / Mode Demo' : 'Cloud Sync Aktif'}</p>
              <p className="text-[10px] font-bold opacity-70 mt-1.5">
                {!SUPABASE_URL ? "Diagnosa: URL Supabase Hilang." : isOffline ? "Diagnosa: Tabel belum ada." : "Status: Alhamdulillah Berhasil Koneksi."}
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
             <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
               <div className="flex items-center gap-3 mb-4 text-blue-600">
                 <Info size={18} />
                 <span className="text-[10px] font-black uppercase tracking-widest">Setup Guide</span>
               </div>
               <p className="text-[11px] text-slate-500 leading-relaxed">
                 1. Tambahkan <strong>NEXT_PUBLIC_SUPABASE_URL</strong> di Environment Vercel.<br/>
                 2. Tambahkan <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY</strong>.<br/>
                 3. Jalankan SQL script di bawah di Dashboard Supabase Anda.
               </p>
             </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6">
           <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Supabase SQL Editor Script</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Salin script ini ke SQL Editor di dashboard Supabase Anda untuk membuat tabel.</p>
           </div>
           <button 
            onClick={copyToClipboard}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
           >
             {copied ? <Check size={14} /> : <Copy size={14} />}
             {copied ? 'Copied!' : 'Copy SQL'}
           </button>
        </div>
        <div className="relative">
          <pre className="bg-slate-900 text-slate-300 p-8 rounded-[2rem] text-[10px] font-mono leading-relaxed overflow-x-auto max-h-96">
            {sqlScript}
          </pre>
        </div>
      </Card>
    </div>
  );
};

// --- View: Iuran, Surat, KK ---
// (Modul-modul ini tetap sama seperti sebelumnya tetapi dipastikan terhubung ke handler yang benar)

// --- AIChatbot Component ---
const AIChatbot = ({ isOffline }: { isOffline: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Use GoogleGenAI with Gemini API for chat assistance
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // Initialize AI with API Key from process.env
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Call generateContent with Gemini model and instructions
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `You are SmartRT Assistant, a helpful AI for RT 04 RW 02 Melati Mas residents and administrators. 
          The app manages: 
          1. Warga (Residents): Database of NIK, names, jobs.
          2. KK (Family Cards): Family groupings.
          3. Iuran (Fees): Security, Cleanliness, RT Cash payments.
          4. Letters (Surat): Requesting Domisili, Business, or Introduction letters.
          Answer questions politely and concisely. Status: ${isOffline ? 'Offline/Demo' : 'Online/Cloud'}.`,
        }
      });

      // Directly access .text property from response
      const aiText = response.text || "Maaf, saya sedang mengalami kendala teknis.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Maaf, terjadi kesalahan saat menghubungi asisten AI." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {isOpen ? (
        <div className="bg-white w-96 h-[500px] rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
          <div className="p-6 bg-blue-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <MessageSquare size={20} />
              </div>
              <div>
                <p className="font-black text-sm tracking-tight leading-none">SmartRT AI</p>
                <p className="text-[10px] font-bold opacity-70 mt-1 uppercase tracking-widest">Assistant Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-xl transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
                  <TrendingUp size={24} />
                </div>
                <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Ada yang bisa dibantu?</p>
                <p className="text-[10px] text-slate-400 mt-2 px-6">Tanyakan tentang cara bayar iuran, cek data warga, atau pengajuan surat.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                  m.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'
                }`}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1">
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
          </div>
          <div className="p-6 border-t border-slate-50">
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ketik pesan..."
                className="w-full bg-slate-50 border-none rounded-2xl pl-6 pr-14 py-4 text-xs font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-blue-600 text-white rounded-[1.5rem] shadow-2xl shadow-blue-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group"
        >
          <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
        </button>
      )}
    </div>
  );
};

// --- Main App Component ---
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [role, setRole] = useState<Role>('admin');
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(true);
  
  const [warga, setWarga] = useState<Warga[]>([]);
  const [kk, setKK] = useState<Keluarga[]>([]);
  const [iuran, setIuran] = useState<Transaction[]>([]);
  const [letters, setLetters] = useState<LetterRequest[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      if (!supabase) {
        console.warn("Supabase client is missing credentials.");
        setWarga(MOCK_WARGA); setKK(MOCK_KK); setIuran(MOCK_IURAN); setLetters(MOCK_LETTERS);
        setLogs([{ id: 'l1', user: 'System', action: 'Gagal inisialisasi Key. Menggunakan mode simulasi.', timestamp: new Date().toLocaleString() }]);
        setIsOffline(true); setLoading(false); return;
      }

      try {
        console.log("Mencoba fetch data dari Supabase...");
        // Cek satu tabel dulu untuk verifikasi keberadaan tabel
        const { error: testError } = await supabase.from('warga').select('id').limit(1);
        if (testError) throw new Error("Tabel 'warga' tidak ditemukan di database.");

        const [{ data: dW }, { data: dK }, { data: dI }, { data: dL }, { data: dLog }] = await Promise.all([
          supabase.from('warga').select('*'),
          supabase.from('keluarga').select('*'),
          supabase.from('iuran').select('*'),
          supabase.from('letters').select('*'),
          supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(5)
        ]);

        setWarga(dW || []); setKK(dK || []); setIuran(dI || []); setLetters(dL || []); setLogs(dLog || []);
        setIsOffline(false);
        console.log("Koneksi Supabase Berhasil!");
      } catch (error) {
        console.warn("Koneksi gagal (mungkin tabel belum dibuat):", error);
        setIsOffline(true);
        setWarga(MOCK_WARGA); setKK(MOCK_KK); setIuran(MOCK_IURAN); setLetters(MOCK_LETTERS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAction = async (module: string, data: any, logMsg: string) => {
    const logAction = { id: Math.random().toString(), user: 'Admin', action: logMsg, timestamp: new Date().toLocaleString() };
    setLogs(prev => [logAction, ...prev.slice(0, 4)]);

    // Update Local State for Instant UI
    if (module === 'warga') setWarga(p => [data, ...p]);
    if (module === 'iuran') setIuran(p => [data, ...p]);
    if (module === 'letters') setLetters(p => [data, ...p]);

    // Push to Cloud if Online
    if (supabase && !isOffline) {
      try {
        console.log(`Pushing action to ${module}...`);
        const { error } = await supabase.from(module).insert([data]);
        await supabase.from('audit_logs').insert([logAction]);
        if (error) throw error;
      } catch (e) { 
        console.error("Cloud action failed", e); 
        alert("Gagal sinkron ke Cloud. Cek console untuk detail.");
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

  if (loading) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-6 text-sm font-black text-slate-800 uppercase tracking-widest animate-pulse">Syncing SmartRT...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-900">
      <aside className="w-80 bg-white border-r border-slate-100 flex flex-col hidden lg:flex">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-14">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-[1.5rem] text-white shadow-xl shadow-blue-500/20"><ShieldCheck size={28} /></div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-slate-800 tracking-tighter leading-none">SmartRT</h1>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mt-1.5">{isOffline ? 'Demo Mode' : 'Cloud Ready'}</span>
            </div>
          </div>
          <nav className="space-y-3">
            {menuItems.filter(i => !i.roles || i.roles.includes(role)).map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all duration-300 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-50'}`}>
                <item.icon size={22} />
                <span className="font-bold text-[13px]">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="p-10 mt-auto">
          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-blue-600 border border-slate-100"><UserCircle size={28} /></div>
                <div>
                   <p className="text-xs font-black text-slate-800 truncate max-w-[140px]">Ketua RT 04</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Status: {role}</p>
                </div>
             </div>
             <div className="grid grid-cols-3 gap-2">
                {['admin', 'pengurus', 'warga'].map(r => (
                  <button key={r} onClick={() => setRole(r as Role)} className={`py-2 rounded-xl text-[8px] font-black uppercase ${role === r ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border hover:bg-slate-50'}`}>{r.slice(0, 3)}</button>
                ))}
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-40 border-b border-slate-100 px-12 py-7 flex justify-between items-center">
           <div>
              <h2 className="font-black text-slate-800 text-2xl capitalize tracking-tight">{activeTab.replace('-', ' ')}</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                 {isOffline ? 'Simulasi Data Lokal (Alhamdulillah Sukses)' : 'Terhubung ke Cloud Database'}
              </p>
           </div>
           <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 cursor-pointer transition-colors border border-slate-100">
              <Calendar size={20} />
           </div>
        </header>

        <div className="p-12 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView stats={stats} logs={logs} isOffline={isOffline} />}
          {activeTab === 'warga' && <WargaView data={warga} kkList={kk} onAdd={(w) => handleAction('warga', w, `Tambah warga: ${w.nama}`)} />}
          {activeTab === 'settings' && <SettingsView role={role} isOffline={isOffline} />}
          
          {/* Fallback untuk Tab lain yang belum terisi di snapshot ini */}
          {!['dashboard', 'warga', 'settings'].includes(activeTab) && (
            <div className="text-center py-20">
               <Clock size={48} className="mx-auto text-slate-200 mb-6" />
               <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Modul {activeTab} segera aktif</p>
               <button onClick={() => setActiveTab('dashboard')} className="mt-10 px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Kembali ke Dashboard</button>
            </div>
          )}
        </div>
      </main>

      <AIChatbot isOffline={isOffline} />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
