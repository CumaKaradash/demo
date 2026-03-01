"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  Search,
  List,
  Grid,
  AlertCircle,
  MessageCircle
} from "lucide-react";

export interface Appointment {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  notes?: string;
  status?: "pending" | "confirmed";
}

const getAppointmentsFromStorage = (): Appointment[] => {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('mock_appointments');
  if (stored) return JSON.parse(stored);
  
  return [];
}

const getPendingAppointments = () => getAppointmentsFromStorage().filter(a => a.status === "pending");
const getConfirmedAppointments = () => getAppointmentsFromStorage().filter(a => a.status === "confirmed");
const confirmAppointment = (id: string) => {
  const apps = getAppointmentsFromStorage();
  const index = apps.findIndex(a => a.id === id);
  if (index > -1) {
    apps[index].status = "confirmed";
    localStorage.setItem('mock_appointments', JSON.stringify(apps));
  }
};

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

function formatDate(d: Date) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

// Genişletilmiş Randevu Tipi (Status alanı ile)
interface ExtendedAppointment extends Appointment {
  status: "pending" | "confirmed";
}

export default function CalendarPage() {
  // --- STATE'LER ---
  const [appointments, setAppointments] = useState<ExtendedAppointment[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<ExtendedAppointment | null>(null);
  
  // Arayüz State'leri
  const [viewMode, setViewMode] = useState<"calendar" | "agenda">("calendar");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);

  // --- VERİ YÜKLEME ---
  const refresh = () => {
    // Bekleyen ve onaylı randevuları çekip tek bir dizide birleştiriyoruz
    const pending = getPendingAppointments().map(a => ({ ...a, status: "pending" as const }));
    const confirmed = getConfirmedAppointments().map(a => ({ ...a, status: "confirmed" as const }));
    setAppointments([...pending, ...confirmed]);
  };

  useEffect(() => {
    refresh();
    setIsLoaded(true);
  }, []);

  // --- İŞLEYİCİLER (HANDLERS) ---
  const handleConfirm = (id: string) => {
    confirmAppointment(id);
    refresh();
    if (selectedAppointment?.id === id) {
      setSelectedAppointment(null); // Modalı kapat
    }
  };

  const handleDecline = (id: string) => {
    if (confirm("Bu randevu talebini reddetmek/silmek istediğinize emin misiniz?")) {
      const apps = getAppointmentsFromStorage();
      const filtered = apps.filter(a => a.id !== id);
      localStorage.setItem('mock_appointments', JSON.stringify(filtered));
      refresh();
      setSelectedAppointment(null);
    }
  };

  const goToToday = () => setCurrentMonth(new Date());

  // --- TAKVİM HESAPLAMALARI ---
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Pazartesi başlangıçlı
  
  const todayStr = formatDate(new Date());

  // Arama ve filtreleme
  const filteredAppointments = useMemo(() => {
    if (!searchQuery) return appointments;
    const lowerQ = searchQuery.toLowerCase();
    return appointments.filter(a => 
      a.name.toLowerCase().includes(lowerQ) || 
      a.surname.toLowerCase().includes(lowerQ) ||
      a.phone.includes(searchQuery)
    );
  }, [appointments, searchQuery]);

  // Takvim hücrelerini oluştur
  const cells = Array.from({ length: 42 }, (_, i) => {
    const dayNumber = i - startOffset + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) return null;
    
    const date = new Date(year, month, dayNumber);
    const dateStr = formatDate(date);
    
    // O güne ait randevuları bul ve saate göre sırala
    const events = filteredAppointments
      .filter((a) => a.date === dateStr)
      .sort((a, b) => a.time.localeCompare(b.time));
      
    return { day: dayNumber, dateStr, events };
  });

  // Seçili ayın istatistikleri
  const monthStats = useMemo(() => {
    const currentMonthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const thisMonthEvents = appointments.filter(a => a.date.startsWith(currentMonthPrefix));
    
    return {
      total: thisMonthEvents.length,
      pending: thisMonthEvents.filter(a => a.status === "pending").length,
      confirmed: thisMonthEvents.filter(a => a.status === "confirmed").length
    };
  }, [appointments, year, month]);

  if (!isLoaded) return <div className="p-8 text-slate-500">Takvim yükleniyor...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      
      {/* ÜST BAŞLIK VE ARAÇ ÇUBUĞU */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Randevu Takvimi</h1>
          <p className="text-sm text-slate-500 mt-1">Danışan görüşmelerinizi planlayın ve yönetin.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Arama Kutusu */}
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="İsim veya telefon ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          
          {/* Görünüm Değiştirici */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode("calendar")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "calendar" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
              title="Takvim Görünümü"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode("agenda")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "agenda" ? "bg-white shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700"}`}
              title="Liste Görünümü"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-blue-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><CalendarIcon className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Bu Ay Toplam</p>
            <p className="text-2xl font-bold text-slate-800">{monthStats.total}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-orange-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-lg"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Bekleyen Onaylar</p>
            <p className="text-2xl font-bold text-orange-600">{monthStats.pending}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-green-100 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><CheckCircle2 className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Onaylanmış Seanslar</p>
            <p className="text-2xl font-bold text-green-600">{monthStats.confirmed}</p>
          </div>
        </div>
      </div>

      {/* TAKVİM KONTROLLERİ VE İÇERİK */}
      <div className="bg-white border border-blue-100 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-500">
        
        {/* Ay Navigasyonu */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800 w-40">
              {MONTHS[month]} {year}
            </h2>
            <button 
              onClick={goToToday}
              className="hidden sm:block px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              Bugün
            </button>
          </div>
          <div className="flex gap-1">
            <button
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              onClick={() => setCurrentMonth(new Date(year, month - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
              onClick={() => setCurrentMonth(new Date(year, month + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {viewMode === "calendar" ? (
          /* AY GÖRÜNÜMÜ (GRID) */
          <div>
            <div className="grid grid-cols-7 border-b border-blue-100 bg-slate-50">
              {DAYS.map((day) => (
                <div key={day} className="py-3 px-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 bg-slate-100 gap-px border-b border-blue-100">
              {cells.map((cell, i) => (
                <div
                  key={i}
                  className={`min-h-[120px] bg-white p-2 transition-colors ${
                    !cell ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'
                  }`}
                >
                  {cell && (
                    <div className="h-full flex flex-col">
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                          cell.dateStr === todayStr ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700'
                        }`}>
                          {cell.day}
                        </span>
                        {cell.events.length > 0 && (
                          <span className="text-[10px] font-medium text-slate-400 mt-1">
                            {cell.events.length} Randevu
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[100px] pr-1 custom-scrollbar">
                        {cell.events.map((e) => (
                          <div
                            key={e.id}
                            onClick={() => setSelectedAppointment(e)}
                            title={`${e.time} - ${e.name} ${e.surname}`}
                            className={`text-xs px-2 py-1.5 rounded-md cursor-pointer transition-all border-l-2 flex flex-col gap-0.5 ${
                              e.status === 'pending' 
                                ? 'bg-orange-50 hover:bg-orange-100 border-orange-400 text-orange-800 border border-dashed border-r-orange-200 border-t-orange-200 border-b-orange-200' 
                                : 'bg-blue-50 hover:bg-blue-100 border-blue-500 text-blue-800'
                            }`}
                          >
                            <span className="font-semibold flex items-center gap-1">
                              {e.status === 'pending' && <AlertCircle className="w-3 h-3 text-orange-500" />}
                              {e.time}
                            </span>
                            <span className="truncate">{e.name} {e.surname.charAt(0)}.</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* LİSTE/AJANDA GÖRÜNÜMÜ */
          <div className="divide-y divide-blue-50">
            {cells.filter(c => c && c.events.length > 0).length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CalendarIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>Bu ay için planlanmış randevu bulunmuyor.</p>
              </div>
            ) : (
              cells.filter(c => c && c.events.length > 0).map((cell, i) => (
                <div key={i} className="flex flex-col sm:flex-row items-start p-4 hover:bg-slate-50 transition-colors">
                  <div className="w-full sm:w-48 mb-4 sm:mb-0 shrink-0">
                    <div className={`text-sm font-medium flex items-center gap-2 ${cell!.dateStr === todayStr ? 'text-blue-600' : 'text-slate-800'}`}>
                      <CalendarIcon className="w-4 h-4" />
                      {cell!.day} {MONTHS[month]} {year}
                      {cell!.dateStr === todayStr && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Bugün</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 pl-6">{cell!.events.length} Görüşme</p>
                  </div>
                  
                  <div className="flex-1 space-y-3 w-full">
                    {cell!.events.map((e) => (
                      <div 
                        key={e.id} 
                        onClick={() => setSelectedAppointment(e)}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-shadow hover:shadow-sm ${
                          e.status === 'pending' ? 'bg-orange-50/50 border-orange-100' : 'bg-white border-blue-100'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`px-3 py-1.5 rounded-md font-medium text-sm flex items-center gap-1.5 ${
                            e.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {e.time}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{e.name} {e.surname}</p>
                            <p className="text-xs text-slate-500 hidden sm:block">{e.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {e.status === 'pending' ? (
                            <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Bekliyor
                            </span>
                          ) : (
                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Onaylı
                            </span>
                          )}
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {/* RANDEVU DETAY MODALI */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className={`px-6 py-4 flex justify-between items-center ${
              selectedAppointment.status === 'pending' ? 'bg-orange-50 border-b border-orange-100' : 'bg-blue-50 border-b border-blue-100'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${selectedAppointment.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                  {selectedAppointment.status === 'pending' ? <AlertCircle className="w-5 h-5" /> : <CalendarIcon className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Randevu Detayı</h3>
                  <p className={`text-xs font-medium ${selectedAppointment.status === 'pending' ? 'text-orange-600' : 'text-blue-600'}`}>
                    {selectedAppointment.status === 'pending' ? 'Onay Bekliyor' : 'Onaylandı'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-center gap-6 pb-6 border-b border-slate-100">
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Tarih</p>
                  <p className="text-lg font-semibold text-slate-800">{selectedAppointment.date.split('-').reverse().join('.')}</p>
                </div>
                <div className="w-px h-10 bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Saat</p>
                  <p className="text-lg font-semibold text-slate-800">{selectedAppointment.time}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-0.5">Danışan Adı Soyadı</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedAppointment.name} {selectedAppointment.surname}</p>
                  </div>
                </div>
                
                <div className="flex gap-3 items-start">
                  <Phone className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 font-medium mb-0.5">Telefon Numarası</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">{selectedAppointment.phone}</p>
                      <a 
                        href={`https://wa.me/${selectedAppointment.phone.replace(/\D/g, '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-1 text-green-600 hover:text-green-700 bg-green-50 px-2 py-1 rounded-md transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <Mail className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500 font-medium mb-0.5">E-posta Adresi</p>
                    <p className="text-sm font-medium text-slate-800">{selectedAppointment.email}</p>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
                    <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-slate-500 font-medium mb-1">Danışan Notu</p>
                      <p className="text-sm text-slate-700 leading-relaxed">{selectedAppointment.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              {selectedAppointment.status === 'pending' ? (
                <>
                  <button
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                    onClick={() => handleDecline(selectedAppointment.id)}
                  >
                    Reddet
                  </button>
                  <button
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 shadow-sm transition-colors flex items-center justify-center gap-2"
                    onClick={() => handleConfirm(selectedAppointment.id)}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Randevuyu Onayla
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="flex-1 px-4 py-2.5 bg-white border border-red-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors"
                    onClick={() => handleDecline(selectedAppointment.id)}
                  >
                    İptal Et / Sil
                  </button>
                  <button
                    className="flex-1 px-4 py-2.5 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors"
                    onClick={() => setSelectedAppointment(null)}
                  >
                    Kapat
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Scrollbar gizleme stili (Sadece bu sayfaya özel hücre içi scroll için) */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}} />
    </div>
  );
}