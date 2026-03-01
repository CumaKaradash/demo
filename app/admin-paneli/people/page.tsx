"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  MessageCircle,
  Calendar,
  Clock,
  Activity,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  User,
  Save
} from "lucide-react";

// --- TİPLER VE INTERFACE'LER ---
interface Appointment {
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

interface ManualClient {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  registeredAt: string;
}

interface ClientProfile {
  id: string;
  name: string;
  surname: string;
  phone: string;
  email: string;
  totalAppointments: number;
  pendingAppointments: number;
  confirmedAppointments: number;
  lastAppointment?: string;
  appointments: Appointment[]; // Geçmiş/gelecek tüm randevuları
  registeredAt: string;
  notes?: string;
}

// --- YARDIMCI FONKSİYONLAR ---
const getAvatarColor = (name: string) => {
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500", "bg-amber-500", "bg-cyan-500"];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

export default function PeoplePage() {
  // --- STATE'LER ---
  const [people, setPeople] = useState<ClientProfile[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Arama & Filtreleme
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_appointments">("newest");
  
  // Modallar
  const [selectedPerson, setSelectedPerson] = useState<ClientProfile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [personalNote, setPersonalNote] = useState("");

  // Yeni Danışan Formu
  const [newClient, setNewClient] = useState({ name: "", surname: "", phone: "", email: "" });

  // --- VERİ YÜKLEME VE BİRLEŞTİRME (CRM MANTIĞI) ---
  const loadData = () => {
    if (typeof window === 'undefined') return;

    // 1. Randevuları al
    const storedAppointments = localStorage.getItem('mock_appointments');
    const appointments: Appointment[] = storedAppointments ? JSON.parse(storedAppointments) : [];

    // 2. Manuel eklenen danışanları al
    const storedClients = localStorage.getItem('mock_clients');
    const manualClients: ManualClient[] = storedClients ? JSON.parse(storedClients) : [];

    // 3. Danışan notlarını al
    const storedNotes = localStorage.getItem('mock_client_notes');
    const clientNotes: Record<string, string> = storedNotes ? JSON.parse(storedNotes) : {};

    const peopleMap = new Map<string, ClientProfile>();

    // Manuel eklenenleri haritaya yerleştir
    manualClients.forEach(client => {
      const key = `${client.email}-${client.phone}`;
      peopleMap.set(key, {
        id: client.id,
        name: client.name,
        surname: client.surname,
        phone: client.phone,
        email: client.email,
        totalAppointments: 0,
        pendingAppointments: 0,
        confirmedAppointments: 0,
        appointments: [],
        registeredAt: client.registeredAt,
        notes: clientNotes[client.id] || ""
      });
    });

    // Randevulardan gelen verilerle birleştir/güncelle
    appointments.forEach((appointment) => {
      const key = `${appointment.email}-${appointment.phone}`;
      const existing = peopleMap.get(key);

      if (existing) {
        existing.totalAppointments++;
        if (appointment.status === "pending") existing.pendingAppointments++;
        else existing.confirmedAppointments++;
        
        if (!existing.lastAppointment || appointment.date > existing.lastAppointment) {
          existing.lastAppointment = appointment.date;
        }
        existing.appointments.push(appointment);
      } else {
        const newId = crypto.randomUUID();
        peopleMap.set(key, {
          id: newId,
          name: appointment.name,
          surname: appointment.surname,
          phone: appointment.phone,
          email: appointment.email,
          totalAppointments: 1,
          pendingAppointments: appointment.status === "pending" ? 1 : 0,
          confirmedAppointments: appointment.status === "confirmed" ? 1 : 0,
          lastAppointment: appointment.date,
          appointments: [appointment],
          registeredAt: appointment.date, // Randevu tarihi kayıt tarihi sayılır
          notes: clientNotes[newId] || ""
        });
      }
    });

    setPeople(Array.from(peopleMap.values()));
  };

  useEffect(() => {
    loadData();
    setIsLoaded(true);
  }, []);

  // --- İŞLEYİCİLER (HANDLERS) ---
  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = crypto.randomUUID();
    const client: ManualClient = {
      id: newId,
      ...newClient,
      registeredAt: new Date().toISOString().split('T')[0]
    };

    const storedClients = localStorage.getItem('mock_clients');
    const existingClients = storedClients ? JSON.parse(storedClients) : [];
    localStorage.setItem('mock_clients', JSON.stringify([...existingClients, client]));
    
    setNewClient({ name: "", surname: "", phone: "", email: "" });
    setShowAddModal(false);
    loadData();
  };

  const handleSaveNote = () => {
    if (!selectedPerson) return;
    
    const storedNotes = localStorage.getItem('mock_client_notes');
    const clientNotes: Record<string, string> = storedNotes ? JSON.parse(storedNotes) : {};
    
    clientNotes[selectedPerson.id] = personalNote;
    localStorage.setItem('mock_client_notes', JSON.stringify(clientNotes));
    
    // Görüntüyü de güncelle
    setSelectedPerson({ ...selectedPerson, notes: personalNote });
    loadData();
    alert("Not başarıyla kaydedildi.");
  };

  const openPersonDetails = (person: ClientProfile) => {
    setSelectedPerson(person);
    setPersonalNote(person.notes || "");
  };

  // --- HESAPLAMALAR VE FİLTRELER ---
  const filteredAndSortedPeople = useMemo(() => {
    let result = people.filter(
      (person) =>
        person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.phone.includes(searchTerm)
    );

    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime());
        break;
      case "most_appointments":
        result.sort((a, b) => b.totalAppointments - a.totalAppointments);
        break;
    }

    return result;
  }, [people, searchTerm, sortBy]);

  const stats = useMemo(() => {
    return {
      total: people.length,
      withPending: people.filter(p => p.pendingAppointments > 0).length,
      active: people.filter(p => p.totalAppointments > 0).length
    };
  }, [people]);

  if (!isLoaded) return <div className="p-8 text-slate-500">Danışanlar yükleniyor...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* ÜST BAŞLIK VE ARAÇ ÇUBUĞU */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Danışan Yönetimi</h1>
          <p className="text-sm text-slate-500 mt-1">Tüm danışan profillerini ve randevu geçmişlerini buradan takip edin.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Arama Kutusu */}
          <div className="relative flex-1 lg:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="İsim, e-posta, telefon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
          
          {/* Sıralama */}
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer text-slate-700"
          >
            <option value="newest">En Yeniler</option>
            <option value="oldest">En Eskiler</option>
            <option value="most_appointments">En Çok Randevu</option>
          </select>

          {/* Yeni Danışan Ekle */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Yeni Ekle
          </button>
        </div>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-blue-100 flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5"><User className="w-32 h-32 text-blue-600" /></div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><User className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Toplam Danışan</p>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-green-100 flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5"><Activity className="w-32 h-32 text-green-600" /></div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Activity className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Aktif (Randevulu)</p>
            <p className="text-2xl font-bold text-slate-800">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-orange-100 flex items-center gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 opacity-5"><AlertCircle className="w-32 h-32 text-orange-600" /></div>
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><AlertCircle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Bekleyen İşlemi Olanlar</p>
            <p className="text-2xl font-bold text-slate-800">{stats.withPending}</p>
          </div>
        </div>
      </div>

      {/* DANIŞANLAR GRİDİ */}
      {filteredAndSortedPeople.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 animate-in fade-in duration-500">
          {filteredAndSortedPeople.map((person) => (
            <div
              key={person.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-blue-300 transition-all group flex flex-col h-full"
            >
              {/* Kart Başlığı (Avatar + İsim) */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4 items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${getAvatarColor(person.name)}`}>
                    {person.name.charAt(0)}{person.surname.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">
                      {person.name} {person.surname}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {person.totalAppointments > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-green-50 text-green-700">
                          <Activity className="w-3 h-3" /> Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                          <User className="w-3 h-3" /> Yeni
                        </span>
                      )}
                      {person.pendingAppointments > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700">
                          <AlertCircle className="w-3 h-3" /> İşlem Bekliyor
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* İletişim Bilgileri */}
              <div className="space-y-2.5 mb-6 text-sm">
                <div className="flex items-center gap-3 text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate" title={person.email}>{person.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{person.phone}</span>
                </div>
                {person.lastAppointment && (
                  <div className="flex items-center gap-3 text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Son İşlem: {person.lastAppointment.split('-').reverse().join('.')}</span>
                  </div>
                )}
              </div>

              {/* Randevu Özet ve Butonlar (Kartın Altına Yaslanır) */}
              <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-800 leading-none mb-1">{person.totalAppointments}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Toplam</p>
                  </div>
                  <div className="w-px bg-slate-200"></div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600 leading-none mb-1">{person.confirmedAppointments}</p>
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Onaylı</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => openPersonDetails(person)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-blue-600 font-medium text-sm rounded-lg hover:bg-blue-50 transition-colors group-hover:bg-blue-600 group-hover:text-white"
                >
                  Profili Gör <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* BOŞ DURUM (EMPTY STATE) */
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center">
          <div className="w-20 h-20 mx-auto bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <UserPlus className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {searchTerm ? "Sonuç Bulunamadı" : "Henüz Danışan Yok"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            {searchTerm
              ? "Arama kriterlerinize uygun bir danışan bulunamadı. Lütfen farklı kelimelerle tekrar deneyin."
              : "Sisteme henüz bir danışan eklenmemiş veya randevu alınmamış. Hemen yeni bir danışan ekleyerek başlayabilirsiniz."}
          </p>
          {!searchTerm && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Yeni Danışan Ekle
            </button>
          )}
        </div>
      )}

      {/* --- DANIŞAN DETAY MODALI (CRM PANELİ) --- */}
      {selectedPerson && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm ${getAvatarColor(selectedPerson.name)}`}>
                  {selectedPerson.name.charAt(0)}{selectedPerson.surname.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedPerson.name} {selectedPerson.surname}</h2>
                  <p className="text-xs font-medium text-slate-500">Kayıt: {selectedPerson.registeredAt.split('-').reverse().join('.')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={`https://wa.me/${selectedPerson.phone.replace(/\D/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  title="WhatsApp'tan Yaz"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
                <a 
                  href={`mailto:${selectedPerson.email}`} 
                  className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  title="E-posta Gönder"
                >
                  <Mail className="w-5 h-5" />
                </a>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button
                  onClick={() => setSelectedPerson(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (İki Kolonlu Tasarım) */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8 custom-scrollbar">
              
              {/* Sol Kolon: Bilgiler ve Notlar */}
              <div className="md:col-span-1 space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4" /> İletişim Bilgileri
                  </h3>
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Telefon</p>
                      <p className="font-medium text-slate-800">{selectedPerson.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">E-posta</p>
                      <p className="font-medium text-slate-800 break-all">{selectedPerson.email}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Özel Danışan Notları
                  </h3>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <textarea 
                      value={personalNote}
                      onChange={(e) => setPersonalNote(e.target.value)}
                      placeholder="Bu danışan için seans notları veya hatırlatmalar ekleyin (Sadece siz görebilirsiniz)..."
                      className="w-full p-4 h-48 resize-none outline-none text-sm text-slate-700 bg-transparent"
                    />
                    <div className="bg-slate-50 p-2 border-t border-slate-100 flex justify-end">
                      <button 
                        onClick={handleSaveNote}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" /> Notu Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sağ Kolon: Randevu Geçmişi */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Randevu Geçmişi
                  </h3>
                  <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                    Toplam {selectedPerson.appointments.length} İşlem
                  </span>
                </div>

                {selectedPerson.appointments.length === 0 ? (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
                    Bu danışana ait henüz bir randevu kaydı bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                    {/* Randevuları tarihe göre yeniden eskiye sırala */}
                    {[...selectedPerson.appointments]
                      .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime())
                      .map((apt, idx) => (
                      <div key={apt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          {apt.status === "confirmed" ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-orange-500" />}
                        </div>
                        
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${apt.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                              {apt.status === 'confirmed' ? 'Onaylı Seans' : 'Bekleyen Talep'}
                            </span>
                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" /> {apt.date.split('-').reverse().join('.')}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-500" /> Saat: {apt.time}
                          </p>
                          {apt.notes && (
                            <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                              <span className="font-semibold block mb-0.5">Danışan Notu:</span>
                              {apt.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- YENİ DANIŞAN EKLEME MODALI --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Yeni Danışan Ekle
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ad *</label>
                  <input required type="text" value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Örn: Ayşe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Soyad *</label>
                  <input required type="text" value={newClient.surname} onChange={e => setNewClient({...newClient, surname: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="Örn: Yılmaz" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefon *</label>
                <input required type="tel" value={newClient.phone} onChange={e => setNewClient({...newClient, phone: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="0555 555 55 55" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-posta</label>
                <input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" placeholder="ayse@example.com" />
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors">
                  İptal
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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