"use client";

import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  Users, 
  Wallet, 
  FileText, 
  Archive, 
  Clock, 
  ArrowRight,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle2,
  FileBadge
} from "lucide-react";

// --- TİPLER ---
interface Appointment {
  id: string;
  name: string;
  surname: string;
  time: string;
  date: string;
  status: "pending" | "confirmed";
}

export default function AdminHomePage() {
  // --- STATE'LER ---
  const [greeting, setGreeting] = useState("Merhaba");
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Özet Veri State'leri
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    pendingAppointments: 0,
    totalClients: 0,
    thisMonthIncome: 0,
    totalFiles: 0,
    totalResponses: 0
  });

  // --- EFEKTLER VE VERİ YÜKLEME ---
  useEffect(() => {
    // 1. Karşılama Mesajını Ayarla
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Günaydın");
    else if (hour < 18) setGreeting("İyi Günler");
    else setGreeting("İyi Akşamlar");

    // 2. LocalStorage'dan Tüm Verileri Çek ve Analiz Et
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();

    // Randevular
    const apps = JSON.parse(localStorage.getItem('mock_appointments') || '[]') as Appointment[];
    const todayApps = apps.filter(a => a.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
    const pending = apps.filter(a => a.status === 'pending').length;

    // Kişiler (Sadece Randevulardan benzersiz telefon numaralarını sayıyoruz basitçe)
    const manualClients = JSON.parse(localStorage.getItem('mock_clients') || '[]');
    const uniquePhones = new Set([...apps.map(a => a.phone), ...manualClients.map((c:any) => c.phone)]);

    // Muhasebe
    const trans = JSON.parse(localStorage.getItem('accounting_transactions') || '[]');
    const monthlyIncome = trans
      .filter((t:any) => t.type === 'income' && new Date(t.date).getMonth() === currentMonth)
      .reduce((acc:number, t:any) => acc + t.amount, 0);

    // Arşiv & Testler
    const files = JSON.parse(localStorage.getItem('archiveFiles') || '[]');
    const responses = JSON.parse(localStorage.getItem('mock_responses') || '[]');

    setTodaysAppointments(todayApps);
    setStats({
      pendingAppointments: pending,
      totalClients: uniquePhones.size,
      thisMonthIncome: monthlyIncome,
      totalFiles: files.length,
      totalResponses: responses.length
    });

    setIsLoaded(true);
  }, []);

  // Para formatlayıcı
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(amount);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Activity className="w-8 h-8 animate-pulse text-blue-500" />
          <p className="text-sm font-medium">Dashboard Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* BAŞLIK VE KARŞILAMA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Activity className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            {greeting}, Psikolog Hanım/Bey 👋
          </h1>
          <p className="text-blue-100 font-medium">
            Bugün {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Harika bir gün dileriz!
          </p>
        </div>
        <div className="relative z-10 flex gap-3">
          <a href="/admin-paneli/calendar" className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-xl text-white font-medium text-sm transition-all flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Randevularım
          </a>
        </div>
      </div>

      {/* TEPEDEKİ HIZLI İSTATİSTİKLER (KPI CARDS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-blue-300 transition-colors group">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Bugünün Seansları</p>
            <p className="text-2xl font-black text-slate-800">{todaysAppointments.length}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-emerald-300 transition-colors group">
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Wallet className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Aylık Tahsilat</p>
            <p className="text-2xl font-black text-slate-800">{formatCurrency(stats.thisMonthIncome)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-orange-300 transition-colors group">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Toplam Danışan</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalClients}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:border-purple-300 transition-colors group">
          <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
            <FileBadge className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Form Yanıtları</p>
            <p className="text-2xl font-black text-slate-800">{stats.totalResponses}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* SOL KOLON: BUGÜNÜN PROGRAMI */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 h-full">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" /> Bugünün Programı
              </h2>
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {todaysAppointments.length} Seans
              </span>
            </div>

            {todaysAppointments.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <CalendarIcon className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="font-semibold text-slate-700 mb-1">Bugün Randevunuz Yok</h3>
                <p className="text-sm text-slate-500">Bugün için planlanmış herhangi bir seansınız bulunmuyor. Günü planlamak veya dinlenmek için harika bir fırsat!</p>
              </div>
            ) : (
              <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent space-y-6">
                {todaysAppointments.map((apt, idx) => (
                  <div key={apt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${apt.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                      {apt.status === 'confirmed' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-black text-slate-800">{apt.time}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${apt.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                          {apt.status === 'confirmed' ? 'Onaylı' : 'Bekliyor'}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-700 truncate">{apt.name} {apt.surname}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <a href="/admin-paneli/calendar" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 group">
                Tüm Takvimi Görüntüle <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: SİSTEM MODÜLLERİ (NAVİGASYON) */}
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 px-2">
            <LayoutList className="w-5 h-5 text-indigo-500" /> Sistem Modülleri
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Takvim Modülü */}
            <a href="/admin-paneli/calendar" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-lg transition-all relative overflow-hidden block">
              <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
              <div className="flex justify-between items-start relative z-10 mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                {stats.pendingAppointments > 0 && (
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    {stats.pendingAppointments} Onay Bekliyor
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Randevu Takvimi</h3>
              <p className="text-sm text-slate-500 font-medium">Danışan görüşmelerinizi organize edin, onaylayın ve yönetin.</p>
            </a>

            {/* Kişiler (CRM) Modülü */}
            <a href="/admin-paneli/people" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-lg transition-all relative overflow-hidden block">
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
              <div className="flex justify-between items-start relative z-10 mb-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Danışan (CRM)</h3>
              <p className="text-sm text-slate-500 font-medium">Kişi profillerini inceleyin, geçmiş randevularını ve notları görün.</p>
            </a>

            {/* Test ve Form Modülü */}
            <a href="/admin-paneli/tests" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-purple-400 hover:shadow-lg transition-all relative overflow-hidden block">
              <div className="absolute right-0 top-0 w-32 h-32 bg-purple-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
              <div className="flex justify-between items-start relative z-10 mb-4">
                <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                {stats.totalResponses > 0 && (
                  <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    {stats.totalResponses} Yanıt
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Test ve Formlar</h3>
              <p className="text-sm text-slate-500 font-medium">BDE, SCL-90 gibi testler oluşturun, sonuçları otomatik analiz edin.</p>
            </a>

            {/* Muhasebe Modülü */}
            <a href="/admin-paneli/accounting" className="group bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-lg transition-all relative overflow-hidden block">
              <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-bl-full -z-0 opacity-50 group-hover:scale-110 transition-transform"></div>
              <div className="flex justify-between items-start relative z-10 mb-4">
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Ön Muhasebe</h3>
              <p className="text-sm text-slate-500 font-medium">Seans gelirlerini ve ofis giderlerini takip edin, nakit akışını izleyin.</p>
            </a>

            {/* Dijital Arşiv Modülü (Geniş Span) */}
            <a href="/admin-paneli/archive" className="md:col-span-2 group bg-slate-800 p-6 rounded-3xl border border-slate-700 shadow-lg hover:bg-slate-900 transition-all relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="absolute right-0 top-0 w-64 h-64 bg-slate-700 rounded-full -z-0 opacity-20 transform translate-x-1/2 -translate-y-1/2 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10 flex items-start md:items-center gap-5">
                <div className="p-4 bg-slate-700/50 backdrop-blur-md text-white rounded-2xl border border-slate-600">
                  <Archive className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Dijital Arşiv Merkezi</h3>
                  <p className="text-sm text-slate-400 font-medium max-w-sm">Dökümanlarınızı (PDF, Word) ve önemli URL bağlantılarınızı güvenle saklayın.</p>
                </div>
              </div>
              <div className="relative z-10 flex-shrink-0 w-full md:w-auto text-right">
                <span className="inline-block bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold px-4 py-2 rounded-xl">
                  Depolanan Dosya: {stats.totalFiles}
                </span>
              </div>
            </a>

          </div>
        </div>

      </div>
    </div>
  );
}

// LayoutList icon import for the module header
function LayoutList(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
      <path d="M14 4h7" />
      <path d="M14 9h7" />
      <path d="M14 15h7" />
      <path d="M14 20h7" />
    </svg>
  );
}