"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Activity,
  HeartHandshake,
  MonitorSmartphone,
  Baby
} from "lucide-react";

// --- SABİTLER VE TİPLER ---
const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"
];

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

const SERVICES = [
  { id: "bireysel", title: "Bireysel Terapi", desc: "Kişisel farkındalık ve psikolojik destek.", icon: User, color: "bg-blue-50 text-blue-600 border-blue-200" },
  { id: "cift", title: "Çift ve Aile Terapisi", desc: "İlişki dinamikleri ve iletişim sorunları.", icon: HeartHandshake, color: "bg-rose-50 text-rose-600 border-rose-200" },
  { id: "cocuk", title: "Çocuk ve Ergen Terapisi", desc: "Gelişimsel süreçler ve davranışsal destek.", icon: Baby, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { id: "online", title: "Online Terapi", desc: "İnternet üzerinden uzaktan görüşme.", icon: MonitorSmartphone, color: "bg-purple-50 text-purple-600 border-purple-200" }
];

interface Appointment {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  notes?: string;
  status: "pending" | "confirmed";
}

// --- YARDIMCI FONKSİYONLAR ---
function formatDateStr(d: Date) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

export default function BookingPage() {
  // --- STATE'LER ---
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoaded, setIsLoaded] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([]);
  
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    phone: "",
    email: "",
    notes: ""
  });
  const [submitted, setSubmitted] = useState(false);

  // --- EFEKTLER ---
  useEffect(() => {
    // Admin panelinin kullandığı aynı veritabanından randevuları çekiyoruz ki saatler çakışmasın
    const storedApps = localStorage.getItem("mock_appointments");
    if (storedApps) {
      setExistingAppointments(JSON.parse(storedApps));
    }
    setIsLoaded(true);
  }, []);

  // --- İŞLEYİCİLER (HANDLERS) ---
  const isSlotTaken = (date: string, time: string) => {
    return existingAppointments.some(app => app.date === date && app.time === time);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || !selectedService) return;

    const serviceName = SERVICES.find(s => s.id === selectedService)?.title || "Belirtilmedi";
    
    // Admin panelinde Service alanı olmadığı için, hizmet tipini Notes içine otomatik ekliyoruz
    const combinedNotes = `Hizmet Tipi: ${serviceName}\n\nDanışan Notu: ${formData.notes || "Belirtilmemiş."}`;

    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      name: formData.name.trim(),
      surname: formData.surname.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      date: selectedDate,
      time: selectedTime,
      notes: combinedNotes,
      status: "pending" // Varsayılan olarak admin onayını bekler
    };

    const updatedAppointments = [...existingAppointments, newAppointment];
    localStorage.setItem("mock_appointments", JSON.stringify(updatedAppointments));
    
    setSubmitted(true);
  };

  // --- TAKVİM HESAPLAMALARI ---
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Saatleri sıfırla ki sadece gün kıyaslaması yapılsın

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Pzt başlangıçlı

  const calendarCells = Array.from({ length: 42 }, (_, i) => {
    const day = i - startOffset + 1;
    if (day < 1 || day > daysInMonth) return null;
    
    const d = new Date(year, month, day);
    const dateStr = formatDateStr(d);
    const isPast = d < today; // Geçmiş günler seçilemez
    
    return { day, dateStr, isPast };
  });

  if (!isLoaded) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Activity className="w-8 h-8 text-blue-500 animate-pulse" /></div>;

  // --- BAŞARI EKRANI ---
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-500">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-slate-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Randevunuz Alındı!</h1>
          <p className="text-slate-500 mb-8 leading-relaxed">
            <strong>{selectedDate?.split('-').reverse().join('.')}</strong> tarihi, saat <strong>{selectedTime}</strong> için randevu talebiniz başarıyla oluşturuldu. Uzmanımız en kısa sürede onay için sizinle iletişime geçecektir.
          </p>
          <a href="/" className="inline-block px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  // --- SİHİRBAZ EKRANI ---
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 flex flex-col items-center">
      
      {/* Üst Navigasyon ve İlerleme */}
      <div className="w-full max-w-4xl mb-8">
        <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-6 w-fit transition-colors">
          <ChevronLeft className="w-4 h-4" /> Ana Sayfa
        </a>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Randevu Sihirbazı</h1>
            <p className="text-sm text-slate-500 mt-1">Sadece birkaç adımda görüşmenizi planlayın.</p>
          </div>
          
          {/* Stepper */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === num ? "bg-blue-600 text-white shadow-md ring-4 ring-blue-50" : 
                  step > num ? "bg-green-500 text-white" : "bg-slate-100 text-slate-400"
                }`}>
                  {step > num ? <CheckCircle2 className="w-4 h-4" /> : num}
                </div>
                {num !== 4 && <div className={`w-6 sm:w-10 h-1 mx-1 rounded-full ${step > num ? 'bg-green-500' : 'bg-slate-100'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[500px]">
        
        {/* ADIM 1: HİZMET SEÇİMİ */}
        {step === 1 && (
          <div className="p-8 sm:p-12 animate-in slide-in-from-right-8 fade-in duration-500">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">1</span>
              Hangi hizmetten faydalanmak istiyorsunuz?
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SERVICES.map((srv) => {
                const isSelected = selectedService === srv.id;
                const Icon = srv.icon;
                return (
                  <button
                    key={srv.id}
                    onClick={() => setSelectedService(srv.id)}
                    className={`flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all ${
                      isSelected ? "border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600" : "border-slate-100 bg-white hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`p-3 rounded-xl ${isSelected ? "bg-blue-600 text-white" : srv.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className={`font-bold ${isSelected ? "text-blue-900" : "text-slate-800"}`}>{srv.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{srv.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="mt-10 flex justify-end pt-6 border-t border-slate-100">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedService}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                İleri: Tarih Seçimi <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ADIM 2: TARİH VE SAAT SEÇİMİ */}
        {step === 2 && (
          <div className="flex flex-col md:flex-row h-full animate-in slide-in-from-right-8 fade-in duration-500">
            
            {/* Sol: Takvim */}
            <div className="flex-1 p-8 sm:p-10 border-b md:border-b-0 md:border-r border-slate-100 bg-slate-50/30">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">2</span>
                Gün Seçin
              </h2>
              
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => setCurrentMonth(new Date(year, month - 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 text-slate-600">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-slate-800">
                    {MONTHS[month]} {year}
                  </span>
                  <button onClick={() => setCurrentMonth(new Date(year, month + 1))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 text-slate-600">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map(d => (
                    <div key={d} className="py-2 text-center text-[10px] font-black uppercase text-slate-400">{d}</div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((cell, i) => {
                    if (!cell) return <div key={i} className="aspect-square" />;
                    const isSelected = selectedDate === cell.dateStr;
                    return (
                      <button
                        key={i}
                        disabled={cell.isPast}
                        onClick={() => { setSelectedDate(cell.dateStr); setSelectedTime(null); }}
                        className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                          cell.isPast ? "text-slate-300 cursor-not-allowed bg-slate-50" : 
                          isSelected ? "bg-blue-600 text-white shadow-md font-bold scale-105" : 
                          "text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-transparent hover:border-blue-200"
                        }`}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Sağ: Saatler */}
            <div className="flex-1 p-8 sm:p-10 flex flex-col">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" /> 
                {selectedDate ? `${selectedDate.split('-').reverse().join('.')} Saatleri` : "Saat Seçimi"}
              </h2>

              {!selectedDate ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                  <CalendarIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">Saatleri görmek için önce sol taraftan bir gün seçmelisiniz.</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {TIME_SLOTS.map((time) => {
                      const taken = isSlotTaken(selectedDate, time);
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          disabled={taken}
                          onClick={() => setSelectedTime(time)}
                          className={`py-3 rounded-xl text-sm font-bold transition-all border-2 ${
                            taken ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed" : 
                            isSelected ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : 
                            "border-slate-100 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                          }`}
                        >
                          {time} {taken && <span className="block text-[10px] font-medium uppercase mt-0.5">Dolu</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-between pt-6 border-t border-slate-100">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Geri
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedTime}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  İleri <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ADIM 3: KİŞİSEL BİLGİLER */}
        {step === 3 && (
          <div className="p-8 sm:p-12 animate-in slide-in-from-right-8 fade-in duration-500">
             <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">3</span>
              İletişim Bilgileriniz
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> Adınız *</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  placeholder="Örn: Ayşe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> Soyadınız *</label>
                <input
                  required
                  value={formData.surname}
                  onChange={(e) => setFormData(p => ({ ...p, surname: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  placeholder="Örn: Yılmaz"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> Telefon Numaranız *</label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  placeholder="0555 555 55 55"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><Mail className="w-4 h-4 text-slate-400" /> E-posta Adresiniz</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  placeholder="ornek@email.com"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> Eklemek İstedikleriniz (Opsiyonel)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none"
                  placeholder="Görüşme öncesi uzmana iletmek istediğiniz notlar..."
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between pt-6 border-t border-slate-100">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Geri
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!formData.name || !formData.surname || !formData.phone}
                className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                Önizleme ve Onay <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ADIM 4: ONAY EKRANI */}
        {step === 4 && (
          <div className="p-8 sm:p-12 flex flex-col items-center animate-in slide-in-from-right-8 fade-in duration-500">
            <h2 className="text-xl font-bold text-slate-800 mb-8 text-center">Randevu Özeti</h2>

            {/* Bilet/Makbuz Görünümü */}
            <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden relative">
              {/* Bilet Süslemesi */}
              <div className="absolute top-1/2 -left-4 w-8 h-8 bg-slate-50 rounded-full border-r border-slate-200 -translate-y-1/2"></div>
              <div className="absolute top-1/2 -right-4 w-8 h-8 bg-slate-50 rounded-full border-l border-slate-200 -translate-y-1/2"></div>
              
              <div className="bg-blue-600 p-6 text-center border-b-2 border-dashed border-blue-400/50">
                <p className="text-blue-100 text-sm font-medium uppercase tracking-widest mb-1">Seçilen Hizmet</p>
                <h3 className="text-xl font-black text-white">{SERVICES.find(s => s.id === selectedService)?.title}</h3>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Tarih</p>
                    <p className="text-lg font-bold text-slate-800">{selectedDate?.split('-').reverse().join('.')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Saat</p>
                    <p className="text-lg font-bold text-slate-800">{selectedTime}</p>
                  </div>
                </div>

                <div className="w-full h-px bg-slate-100"></div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Danışan Bilgileri</p>
                  <p className="font-bold text-slate-800 text-lg">{formData.name} {formData.surname}</p>
                  <p className="text-sm font-medium text-slate-500 mt-1">{formData.phone}</p>
                  {formData.email && <p className="text-sm font-medium text-slate-500">{formData.email}</p>}
                </div>
              </div>
            </div>

            <div className="w-full max-w-md mt-10 flex gap-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Düzenle
              </button>
              <button
                onClick={handleSubmit}
                className="flex-[2] py-3.5 bg-green-500 text-white font-bold text-lg rounded-xl hover:bg-green-600 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> Randevuyu Tamamla
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Scrollbar gizleme stili */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}} />
    </div>
  );
}