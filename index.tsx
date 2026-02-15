
import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Users, CreditCard, Megaphone, LayoutDashboard, Plus, Search, 
  MessageSquare, Send, X, Menu, ChevronRight, TrendingUp, 
  AlertCircle, FileText, UserPlus, Calendar, Wallet, Home, 
  Phone, Briefcase, FileCheck, ShieldCheck, UserCircle, Download,
  Filter, MoreVertical, CheckCircle2, Clock, Trash2, Edit3, Printer,
  History, ArrowUpRight, ArrowDownRight, QrCode, FileSpreadsheet, Settings,
  CloudOff, Cloud
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// --- Supabase Config & Safe Initialization ---
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Only create client if credentials exist to avoid "supabaseUrl is required" crash
let supabase: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// --- Mock Data (Fallback) ---
const MOCK_WARGA: Warga[] = [
  { id: 'w1', nik: '3273011010800001', nama: 'Budi Santoso (Demo)', jk: 'L', tglLahir: '1980-10-10', pekerjaan: 'PNS', phone: '08123456789', statusKeluarga: 'Kepala Keluarga', kkId: 'kk1' },
  { id: 'w2', nik: '3273011010800002', nama: 'Siti Aminah (Demo)', jk: 'P', tglLahir: '1982-05-15', pekerjaan: 'Wiraswasta', phone: '08129876543', statusKeluarga: 'Kepala Keluarga', kkId: 'kk2' },
];

const MOCK_KK: Keluarga[] = [
  { id: 'kk1', nomorKK: '3273010101010001', alamat: 'Jl. Melati No. 12', kepalaKeluarga: 'Budi Santoso' },
];

const MOCK_LOGS: AuditLog[] = [
  { id: 'l1', user: 'System', action: 'Aplikasi berjalan dalam mode Demo (Offline)', timestamp: new Date().toLocaleString() },
];

// --- Types & Interfaces ---
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

// --- Professional UI Components ---
interface CardProps { children: React.ReactNode; className?: string; noPadding?: boolean; }
const Card: React.FC<CardProps> = ({ children, className = "", noPadding = false }) => (
  <div className={`bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] ${className}`}>
    <div className={noPadding ? "" : "p-6"}>{children}</div>
  </div>
);

// --- Page Views ---
const DashboardView = ({ stats, logs, isOffline }: { stats: any, logs: AuditLog[], isOffline: boolean }) => (
  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    {isOffline && (
      <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-4 text-amber-800">
        <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
          <AlertCircle size={20} />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-widest">Demo Mode Active</p>
          <p className="text-[11px] font-medium opacity-80">Konfigurasi Supabase URL/Key tidak ditemukan. Menggunakan data simulasi lokal.</p>
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
            <div className={`p-3 rounded-2xl bg-slate-50 text-${item.color}-600`}>
              <item.icon size={24} />
            </div>
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
            <p className="text-xs text-slate-400 mt-1 font-medium">{isOffline ? 'Data Simulasi Lokal' : 'Data real-time dari Cloud Database'}</p>
          </div>
        </div>
        <div className="h-64 flex items-end justify-between gap-4 px-2">
          {[40, 25, 60, 85, 45, 95, 75, 50, 65, 80, 55, 30].map((h, i) => (
            <div key={i} className="flex-1 bg-slate-50/50 rounded-t-2xl relative group">
              <div style={{ height: `${h}%` }} className="bg-blue-500 rounded-t-2xl w-full absolute bottom-0 transition-all duration-500"></div>
            </div>
          ))}
        </div>
      </Card>

      <Card noPadding>
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-black text-slate-800 text-xl tracking-tight">Audit Log</h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">{isOffline ? 'Sistem Event Log' : 'Aktivitas Cloud Terbaru'}</p>
        </div>
        <div className="divide-y divide-slate-50">
          {logs.map(log => (
            <div key={log.id} className="p-5 hover:bg-slate-50 transition-colors group">
              <div className="flex gap-4">
                <div className="p-2 bg-slate-100 text-slate-400 rounded-xl shrink-0"><History size={16} /></div>
                <div>
                  <p className="text-xs font-bold text-slate-800 leading-snug">{log.action}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1">{log.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

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
        // Fallback to Mocks if Supabase is not configured
        console.warn("Supabase not configured, using mock data.");
        setWarga(MOCK_WARGA);
        setKK(MOCK_KK);
        setLogs(MOCK_LOGS);
        setIsOffline(true);
        setLoading(false);
        return;
      }

      try {
        const [
          { data: dataWarga },
          { data: dataKK },
          { data: dataIuran },
          { data: dataLetters },
          { data: dataLogs }
        ] = await Promise.all([
          supabase.from('warga').select('*'),
          supabase.from('keluarga').select('*'),
          supabase.from('iuran').select('*'),
          supabase.from('letters').select('*'),
          supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(5)
        ]);

        if (dataWarga) setWarga(dataWarga);
        if (dataKK) setKK(dataKK);
        if (dataIuran) setIuran(dataIuran);
        if (dataLetters) setLetters(dataLetters);
        if (dataLogs) setLogs(dataLogs);
        setIsOffline(false);
      } catch (error) {
        console.error("Error syncing with cloud:", error);
        setIsOffline(true);
        // Load mocks on error as secondary fallback
        setWarga(MOCK_WARGA);
        setKK(MOCK_KK);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        <p className="mt-6 text-sm font-black text-slate-800 uppercase tracking-widest animate-pulse">
          {isOffline ? 'Loading Demo Interface...' : 'Syncing with Cloud...'}
        </p>
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
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
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
                  <button key={r} onClick={() => setRole(r as Role)} className={`py-1.5 rounded-lg text-[8px] font-black uppercase ${role === r ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border'}`}>{r.slice(0, 3)}</button>
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
                 {isOffline ? (
                   <div className="flex items-center gap-2">
                     <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1">
                       <CloudOff size={10} /> Configuration Required for Cloud Sync
                     </span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-2">
                     <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] flex items-center gap-1">
                       <Cloud size={10} /> Verified by Supabase Cloud
                     </span>
                   </div>
                 )}
              </div>
           </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DashboardView stats={stats} logs={logs} isOffline={isOffline} />}
          {activeTab !== 'dashboard' && (
            <div className="flex flex-col items-center justify-center py-32 text-center animate-in zoom-in-95 duration-500">
               <div className="w-32 h-32 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center mb-8"><Clock size={48} className="text-blue-200" /></div>
               <h3 className="text-2xl font-black text-slate-800 tracking-tight">Modul {activeTab.toUpperCase()}</h3>
               <p className="text-slate-400 mt-2 max-w-md font-medium">Fungsi Write/Update untuk modul ini memerlukan tabel {activeTab} di Supabase dengan RLS policy yang diatur.</p>
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
    { role: 'bot', text: 'Halo! Saya SmartRT Assistant. Apa ada yang bisa saya bantu?' }
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
        config: { systemInstruction: `Kamu adalah asisten pintar RT 04. Gunakan bahasa Indonesia yang ramah. Status Cloud saat ini: ${isOffline ? 'Offline/Demo Mode (Supabase tidak terhubung)' : 'Online (Terhubung ke Supabase)'}.` }
      });
      setMessages(prev => [...prev, { role: 'bot', text: resp.text || 'Maaf, saya gagal merespon.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Terjadi gangguan sistem AI. Pastikan API_KEY sudah benar.' }]);
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
                  <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-widest">{isOffline ? 'Demo Assistant' : 'Cloud Assistant'}</p>
               </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
          </div>
          <div className="h-96 overflow-y-auto p-8 space-y-6 bg-[#FDFDFD]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-5 py-3.5 rounded-3xl text-xs font-medium leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white shadow-sm border text-slate-700'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-2 p-2">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-300"></span>
              </div>
            )}
          </div>
          <div className="p-6 bg-white border-t border-slate-50 flex gap-3">
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-4 text-xs font-medium focus:ring-2 focus:ring-blue-600 transition-all outline-none" placeholder="Tanyakan sesuatu..." />
            <button onClick={sendMessage} className="p-4 bg-slate-900 text-white rounded-2xl shadow-lg active:scale-95 transition-all"><Send size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
