"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  Star,
  FileText,
  Calendar
} from "lucide-react";

// --- TİPLER ---
type FieldType = "text" | "textarea" | "email" | "tel" | "single_choice" | "multiple_choice" | "date" | "rating";

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

interface TestForm {
  id: string;
  testSlug: string;
  title: string;
  fields: FormField[];
  createdAt: string;
}

interface FormResponse {
  id: string;
  formId: string;
  data: Record<string, string | string[]>;
  createdAt: string;
}

export default function FormPage() {
  // --- STATE'LER ---
  const [form, setForm] = useState<TestForm | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState<Record<string, string | string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- EFEKTLER (Veri Çekme) ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Next.js useParams yerine tarayıcı URL'sinden slug'ı manuel alıyoruz (Derleme hatasını önlemek için)
      const pathParts = window.location.pathname.split('/');
      const extractedSlug = pathParts.pop() || "";

      // Admin panelinde oluşturulan formları LocalStorage'dan buluyoruz
      const storedForms = localStorage.getItem("mock_forms");
      if (storedForms && extractedSlug) {
        const forms: TestForm[] = JSON.parse(storedForms);
        const targetForm = forms.find(f => f.testSlug === extractedSlug);
        
        if (targetForm) {
          setForm(targetForm);
        }
      }
    }
    setLoaded(true);
  }, []);

  // --- HESAPLAMALAR ---
  // İlerleme çubuğu (Progress) için doldurulmuş (zorunlu veya değil) alanların oranını hesapla
  const progress = useMemo(() => {
    if (!form || form.fields.length === 0) return 0;
    
    let filledCount = 0;
    form.fields.forEach(field => {
      const val = data[field.id];
      if (field.type === "multiple_choice") {
        if (Array.isArray(val) && val.length > 0) filledCount++;
      } else {
        if (val && String(val).trim() !== "") filledCount++;
      }
    });

    return Math.round((filledCount / form.fields.length) * 100);
  }, [form, data]);

  // --- İŞLEYİCİLER (HANDLERS) ---
  const handleChange = (fieldId: string, value: string) => {
    setData(prev => ({ ...prev, [fieldId]: value }));
    if (error) setError(null);
  };

  const handleMultipleChoice = (fieldId: string, value: string, checked: boolean) => {
    setData((prev) => {
      const current = (prev[fieldId] as string[]) ?? [];
      const next = checked ? [...current, value] : current.filter((v) => v !== value);
      return { ...prev, [fieldId]: next };
    });
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    
    // Validasyon: Zorunlu alanlar doldurulmuş mu?
    let firstMissingField: string | null = null;
    
    const requiredMissing = form.fields.some((f) => {
      if (!f.required) return false;
      const val = data[f.id];
      
      let isMissing = false;
      if (f.type === "single_choice" || f.type === "rating") {
        isMissing = !val;
      } else if (f.type === "multiple_choice") {
        isMissing = !(val as string[])?.length;
      } else {
        isMissing = !val || (typeof val === "string" && !val.trim());
      }

      if (isMissing && !firstMissingField) firstMissingField = f.label;
      return isMissing;
    });

    if (requiredMissing) {
      setError(`Lütfen zorunlu alanları doldurun: ${firstMissingField}`);
      
      // Hatalı alanı ekrana kaydır (basit scroll)
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Yanıtı Kaydet
    const newResponse: FormResponse = {
      id: crypto.randomUUID(),
      formId: form.id,
      data,
      createdAt: new Date().toISOString()
    };

    const storedResponses = localStorage.getItem("mock_responses");
    const existingResponses = storedResponses ? JSON.parse(storedResponses) : [];
    
    localStorage.setItem("mock_responses", JSON.stringify([newResponse, ...existingResponses]));
    
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- DURUM EKRANLARI ---
  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-3 text-slate-400">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium text-sm">Form Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-6">
          <FileText className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Form Bulunamadı</h1>
        <p className="text-slate-500 max-w-md mx-auto mb-8">
          Ulaşmaya çalıştığınız form yayından kaldırılmış, bağlantı yanlış yazılmış veya form URL'si değiştirilmiş olabilir.
        </p>
        <a href="/" className="px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
          Ana Sayfaya Dön
        </a>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="bg-white p-10 rounded-[2rem] shadow-xl w-full max-w-lg text-center border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-blue-500"></div>
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-3">Teşekkürler!</h1>
          <p className="text-slate-500 text-lg mb-8 leading-relaxed">
            Yanıtlarınız başarıyla kaydedildi ve uzmanımıza güvenli bir şekilde iletildi. 
          </p>
          <a href="/" className="inline-block w-full py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors shadow-md">
            Ana Sayfaya Dön
          </a>
        </div>
      </div>
    );
  }

  // --- ANA FORM EKRANI ---
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center selection:bg-purple-100">
      
      {/* Üst Kısım: Progress Bar (Sticky) */}
      <div className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest truncate max-w-[200px] sm:max-w-xs" title={form.title}>
            {form.title}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black text-purple-600">%{progress}</span>
            <div className="w-24 sm:w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-3xl px-4 sm:px-6 py-10 sm:py-16">
        
        {/* Form Başlığı */}
        <div className="mb-10 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight mb-4">{form.title}</h1>
          <p className="text-slate-500 text-lg leading-relaxed">Lütfen aşağıdaki soruları dikkatlice okuyarak sizin için en uygun olan seçeneği işaretleyin veya doldurun.</p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-4">
            <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-800">Eksik Bilgi</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 sm:space-y-12">
          {form.fields.map((field, idx) => {
            const isAnswered = 
              field.type === "multiple_choice" 
                ? (data[field.id] as string[])?.length > 0 
                : !!data[field.id];

            return (
              <div 
                key={field.id} 
                className={`bg-white p-6 sm:p-8 rounded-[2rem] border-2 transition-all duration-300 relative group ${
                  isAnswered ? 'border-purple-200 shadow-md bg-purple-50/10' : 'border-slate-100 shadow-sm hover:border-slate-300'
                }`}
              >
                {/* Soru Numarası (Opsiyonel görsel şıklık) */}
                <div className="absolute -left-3 -top-3 w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs font-black shadow-md border-2 border-white z-10">
                  {idx + 1}
                </div>

                <div className="mb-5 sm:mb-6">
                  <label className="text-lg sm:text-xl font-bold text-slate-800 leading-snug">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1.5" title="Bu alan zorunludur">*</span>}
                  </label>
                </div>

                {/* --- COMPONENT RENDER AREA --- */}
                
                {/* Text / Tel / Email Inputs */}
                {["text", "email", "tel"].includes(field.type) && (
                  <input
                    type={field.type}
                    value={(data[field.id] as string) ?? ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-purple-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal text-lg"
                    placeholder="Yanıtınızı buraya yazın..."
                  />
                )}

                {/* Textarea */}
                {field.type === "textarea" && (
                  <textarea
                    value={(data[field.id] as string) ?? ""}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                    rows={4}
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-purple-500 outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal text-lg resize-y custom-scrollbar"
                    placeholder="Detaylı yanıtınızı buraya yazın..."
                  />
                )}

                {/* Date Input */}
                {field.type === "date" && (
                  <div className="relative max-w-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Calendar className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                      type="date"
                      value={(data[field.id] as string) ?? ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-purple-500 outline-none transition-all font-medium text-slate-800 text-lg cursor-pointer"
                    />
                  </div>
                )}

                {/* Rating (Yıldızlı Puanlama) */}
                {field.type === "rating" && (
                  <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const currentValue = parseInt((data[field.id] as string) || "0");
                      const isSelected = currentValue >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleChange(field.id, String(star))}
                          className={`p-3 rounded-2xl transition-all border-2 flex flex-col items-center gap-2 ${
                            isSelected 
                              ? 'bg-amber-50 border-amber-200 text-amber-500 scale-105 shadow-sm' 
                              : 'bg-slate-50 border-transparent text-slate-300 hover:text-amber-300 hover:bg-slate-100'
                          }`}
                        >
                          <Star className={`w-8 h-8 sm:w-10 sm:h-10 ${isSelected ? 'fill-current' : ''}`} />
                          <span className={`text-xs font-black ${isSelected ? 'text-amber-700' : 'text-slate-400'}`}>{star}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Single Choice (Radio Buttons) */}
                {field.type === "single_choice" && (
                  <div className="space-y-3">
                    {(field.options ?? []).filter(o => o.trim()).map((opt) => {
                      const isSelected = data[field.id] === opt;
                      return (
                        <label
                          key={opt}
                          className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-purple-600 bg-purple-50/50 shadow-sm ring-1 ring-purple-600/20' 
                              : 'border-slate-100 bg-slate-50 hover:border-purple-300 hover:bg-white'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-purple-600 bg-purple-600' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          {/* Gizli input, form state'i label üzerinden yönetiliyor ama accessibility için koyuyoruz */}
                          <input
                            type="radio"
                            name={field.id}
                            value={opt}
                            checked={isSelected}
                            onChange={() => handleChange(field.id, opt)}
                            className="hidden"
                          />
                          <span className={`text-base sm:text-lg font-medium ${isSelected ? 'text-purple-900 font-bold' : 'text-slate-700'}`}>
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {/* Multiple Choice (Checkboxes) */}
                {field.type === "multiple_choice" && (
                  <div className="space-y-3">
                    {(field.options ?? []).filter(o => o.trim()).map((opt) => {
                      const isSelected = ((data[field.id] as string[]) ?? []).includes(opt);
                      return (
                        <label
                          key={opt}
                          className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-blue-600 bg-blue-50/50 shadow-sm ring-1 ring-blue-600/20' 
                              : 'border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-white'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
                          </div>
                          <input
                            type="checkbox"
                            value={opt}
                            checked={isSelected}
                            onChange={(e) => handleMultipleChoice(field.id, opt, e.target.checked)}
                            className="hidden"
                          />
                          <span className={`text-base sm:text-lg font-medium ${isSelected ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                            {opt}
                          </span>
                        </label>
                      );
                    })}
                    <p className="text-xs font-bold text-slate-400 mt-4 ml-1 uppercase tracking-widest">* Birden fazla seçenek işaretleyebilirsiniz.</p>
                  </div>
                )}

              </div>
            );
          })}

          <div className="pt-8 pb-16 flex flex-col items-center">
            {progress < 100 && (
              <p className="text-sm font-bold text-slate-400 mb-6 flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
                <AlertCircle className="w-4 h-4" /> Formu gönderebilmek için zorunlu alanları doldurmalısınız.
              </p>
            )}
            
            <button 
              type="submit" 
              className={`w-full sm:w-auto min-w-[250px] py-4 sm:py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                progress === 100 
                  ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/30 hover:bg-purple-700 hover:scale-105' 
                  : 'bg-slate-800 text-white shadow-md hover:bg-slate-900'
              }`}
            >
              {progress === 100 ? 'Yanıtlarımı Gönder' : 'Formu Tamamla'} 
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </form>
      </div>

      {/* Scrollbar gizleme stili (Textarea için) */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}} />
    </div>
  );
}