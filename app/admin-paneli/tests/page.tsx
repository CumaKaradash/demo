"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Pencil, Check, X, Trash2, Plus, FileText, 
  Link as LinkIcon, Copy, Globe, Lock, 
  BarChart2, Code, LayoutList, CheckCircle2,
  ChevronRight, Eye, Settings
} from "lucide-react";

// --- TİPLER VE INTERFACE'LER ---
type FieldType = "text" | "email" | "tel" | "single_choice" | "multiple_choice";

interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
}

interface TestUrl {
  id: string;
  slug: string;
  url: string;
  isPublic: boolean;
  createdAt: string;
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

// --- LOCAL STORAGE MOCK DB YARDIMCILARI ---
const getStorage = <T,>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};
const setStorage = <T,>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const getFormUrl = (slug: string) => {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/form/${slug}`;
};

const formatResponseValue = (val: string | string[] | undefined): string => {
  if (val === undefined || val === null) return "—";
  if (Array.isArray(val)) return val.filter(Boolean).join(", ") || "—";
  return String(val) || "—";
};

const JSON_EXAMPLE = `{
  "title": "Beck Depresyon Envanteri",
  "fields": [
    { "label": "Ad Soyad", "type": "text", "required": true },
    { "label": "Yaşınız", "type": "text", "required": true },
    { "label": "Son 2 haftadaki ruh haliniz?", "type": "single_choice", "required": true, "options": ["Çok Mutsuz", "Mutsuz", "Nötr", "Mutlu"] }
  ]
}`;

export default function TestsPage() {
  // --- STATE'LER ---
  const [tests, setTests] = useState<TestUrl[]>([]);
  const [forms, setForms] = useState<TestForm[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Test Oluşturma & Düzenleme
  const [urlInput, setUrlInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSlug, setEditSlug] = useState("");

  // Form Oluşturma Modal State'leri
  const [showFormModal, setShowFormModal] = useState(false);
  const [formBuildMode, setFormBuildMode] = useState<"manual" | "json">("manual");
  const [formTestSlug, setFormTestSlug] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formFields, setFormFields] = useState<Omit<FormField, "id">[]>([]);
  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Yanıtlar Modalı
  const [expandedFormId, setExpandedFormId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // --- VERİ YÜKLEME ---
  const refreshData = () => {
    setTests(getStorage<TestUrl>("mock_tests"));
    setForms(getStorage<TestForm>("mock_forms"));
    setResponses(getStorage<FormResponse>("mock_responses"));
  };

  useEffect(() => {
    refreshData();
    setIsLoaded(true);
  }, []);

  // --- TEST (URL) İŞLEMLERİ ---
  const handleCreateTest = () => {
    const slug = urlInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!slug) return;
    
    const newTest: TestUrl = {
      id: crypto.randomUUID(),
      slug,
      url: `/form/${slug}`,
      isPublic: false,
      createdAt: new Date().toISOString()
    };
    
    const currentTests = getStorage<TestUrl>("mock_tests");
    if (currentTests.some(t => t.slug === slug)) {
      alert("Bu URL (slug) zaten kullanılıyor!");
      return;
    }

    setStorage("mock_tests", [newTest, ...currentTests]);
    setUrlInput("");
    refreshData();
  };

  const saveEditTest = () => {
    if (!editingId) return;
    const slug = editSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (!slug) return;

    const currentTests = getStorage<TestUrl>("mock_tests");
    if (currentTests.some(t => t.slug === slug && t.id !== editingId)) {
      alert("Bu URL zaten kullanımda.");
      return;
    }

    const updated = currentTests.map(t => t.id === editingId ? { ...t, slug, url: `/form/${slug}` } : t);
    setStorage("mock_tests", updated);
    
    // Bağlı formların da slug'ını güncelle
    const oldSlug = currentTests.find(t => t.id === editingId)?.slug;
    if (oldSlug) {
      const currentForms = getStorage<TestForm>("mock_forms");
      setStorage("mock_forms", currentForms.map(f => f.testSlug === oldSlug ? { ...f, testSlug: slug } : f));
    }

    setEditingId(null);
    refreshData();
  };

  const handleDeleteTest = (id: string) => {
    if(!confirm("Bu testi ve ona bağlı tüm formları/yanıtları silmek istediğinize emin misiniz?")) return;
    
    const currentTests = getStorage<TestUrl>("mock_tests");
    const testToDelete = currentTests.find(t => t.id === id);
    
    setStorage("mock_tests", currentTests.filter(t => t.id !== id));
    
    if (testToDelete) {
      const currentForms = getStorage<TestForm>("mock_forms");
      const formsToDelete = currentForms.filter(f => f.testSlug === testToDelete.slug);
      setStorage("mock_forms", currentForms.filter(f => f.testSlug !== testToDelete.slug));
      
      const formIds = formsToDelete.map(f => f.id);
      const currentResponses = getStorage<FormResponse>("mock_responses");
      setStorage("mock_responses", currentResponses.filter(r => !formIds.includes(r.formId)));
    }
    refreshData();
  };

  const togglePublicStatus = (id: string) => {
    const currentTests = getStorage<TestUrl>("mock_tests");
    setStorage("mock_tests", currentTests.map(t => t.id === id ? { ...t, isPublic: !t.isPublic } : t));
    refreshData();
  };

  const handleCopyLink = (slug: string) => {
    const url = getFormUrl(slug);
    navigator.clipboard.writeText(url);
    setCopiedLink(slug);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  // --- FORM OLUŞTURMA İŞLEMLERİ ---
  const addFormField = () => setFormFields(prev => [...prev, { label: "", type: "text", required: false }]);
  const removeFormField = (i: number) => setFormFields(prev => prev.filter((_, idx) => idx !== i));

  const saveFormToDb = (slug: string, title: string, fields: Omit<FormField, "id">[]) => {
    const newForm: TestForm = {
      id: crypto.randomUUID(),
      testSlug: slug,
      title,
      fields: fields.map(f => ({ ...f, id: crypto.randomUUID() })),
      createdAt: new Date().toISOString()
    };
    const currentForms = getStorage<TestForm>("mock_forms");
    setStorage("mock_forms", [newForm, ...currentForms]);
    refreshData();
  };

  const handleManualFormSubmit = () => {
    if (!formTestSlug || !formTitle.trim()) return;
    const validFields = formFields.filter(f => f.label.trim()).map(f => {
      if (f.type === "single_choice" || f.type === "multiple_choice") {
        const opts = (f.options ?? []).filter(o => o.trim());
        if (opts.length < 2) return null;
        return { ...f, options: opts };
      }
      return { ...f, options: undefined };
    }).filter((f): f is NonNullable<typeof f> => f !== null);

    if (validFields.length === 0) {
      alert("En az bir geçerli alan eklemelisiniz. (Seçimli alanlarda en az 2 seçenek olmalı)");
      return;
    }

    saveFormToDb(formTestSlug, formTitle.trim(), validFields);
    closeFormModal();
  };

  const handleJsonFormSubmit = () => {
    setJsonError(null);
    if (!formTestSlug) {
      setJsonError("Lütfen önce bir Test URL (Kategori) seçin.");
      return;
    }
    try {
      const parsed = JSON.parse(jsonInput);
      if (!parsed.title || typeof parsed.title !== "string") throw new Error('JSON\'da "title" (metin) zorunludur.');
      if (!Array.isArray(parsed.fields) || parsed.fields.length === 0) throw new Error('JSON\'da "fields" (dizi) zorunludur.');
      
      const validTypes: FieldType[] = ["text", "email", "tel", "single_choice", "multiple_choice"];
      const validFields = parsed.fields.map((f: any) => {
        const label = String(f?.label ?? "").trim();
        const type = (f?.type ?? "text") as FieldType;
        const required = Boolean(f?.required);
        if (!label || !validTypes.includes(type)) return null;
        if (type === "single_choice" || type === "multiple_choice") {
          const opts = (f?.options ?? []).filter((o: any) => String(o).trim());
          if (opts.length < 2) return null;
          return { label, type, required, options: opts };
        }
        return { label, type, required };
      }).filter((f: any): f is NonNullable<typeof f> => f !== null);

      if (validFields.length === 0) throw new Error("Geçerli alan bulunamadı.");

      saveFormToDb(formTestSlug, parsed.title.trim(), validFields);
      closeFormModal();
    } catch (e: any) {
      setJsonError(e.message || "Geçersiz JSON formatı.");
    }
  };

  const handleDeleteForm = (id: string) => {
    if(!confirm("Bu formu ve tüm yanıtlarını silmek istediğinize emin misiniz?")) return;
    const currentForms = getStorage<TestForm>("mock_forms");
    setStorage("mock_forms", currentForms.filter(f => f.id !== id));
    
    const currentResponses = getStorage<FormResponse>("mock_responses");
    setStorage("mock_responses", currentResponses.filter(r => r.formId !== id));
    
    if(expandedFormId === id) setExpandedFormId(null);
    refreshData();
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setFormTitle("");
    setFormFields([]);
    setJsonInput("");
    setJsonError(null);
  };

  // --- HESAPLAMALAR ---
  const stats = useMemo(() => {
    return {
      totalTests: tests.length,
      publicTests: tests.filter(t => t.isPublic).length,
      totalForms: forms.length,
      totalResponses: responses.length
    };
  }, [tests, forms, responses]);

  if (!isLoaded) return <div className="p-8 text-slate-500">Testler yükleniyor...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      
      {/* ÜST BAŞLIK VE İSTATİSTİKLER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Test & Form Yönetimi</h1>
          <p className="text-sm text-slate-500 mt-1">Danışanlarınıza göndereceğiniz formları oluşturun ve yanıtları analiz edin.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-4 py-2 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{stats.totalTests}</p>
            <p className="text-xs text-blue-800 font-medium">Toplam URL</p>
          </div>
          <div className="text-center px-4 py-2 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats.totalForms}</p>
            <p className="text-xs text-purple-800 font-medium">Aktif Form</p>
          </div>
          <div className="text-center px-4 py-2 bg-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{stats.totalResponses}</p>
            <p className="text-xs text-emerald-800 font-medium">Toplanan Yanıt</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SOL KOLON: TEST (URL) OLUŞTURMA VE LİSTESİ */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-blue-500" /> Yeni Bağlantı Yolu (Slug)
            </h2>
            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Örn: ilk-seans-formu"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button 
                onClick={handleCreateTest}
                disabled={!urlInput.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium text-sm shadow-sm"
              >
                Oluştur
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-320px)] min-h-[400px]">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-medium text-slate-800 text-sm">Oluşturulan URL'ler</h3>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{tests.length}</span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
              {tests.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Globe className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Henüz URL oluşturulmadı.</p>
                </div>
              ) : (
                tests.map(t => (
                  <div key={t.id} className="p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 transition-colors shadow-sm group">
                    <div className="flex justify-between items-start mb-2">
                      {editingId === t.id ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            value={editSlug}
                            onChange={(e) => setEditSlug(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm font-mono border border-blue-300 rounded focus:outline-none"
                            autoFocus
                          />
                          <button onClick={saveEditTest} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:bg-slate-50 rounded"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            <span className="text-slate-400 text-xs truncate">/form/</span>
                            <span className="font-mono text-sm text-blue-700 font-medium truncate" title={t.slug}>{t.slug}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingId(t.id); setEditSlug(t.slug); }} className="p-1 text-slate-400 hover:text-blue-600 rounded" title="Düzenle">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDeleteTest(t.id)} className="p-1 text-slate-400 hover:text-red-600 rounded" title="Sil">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {!editingId && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                        <button 
                          onClick={() => togglePublicStatus(t.id)}
                          className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md transition-colors ${
                            t.isPublic ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {t.isPublic ? <><Globe className="w-3 h-3" /> Topluluğa Açık</> : <><Lock className="w-3 h-3" /> Bana Özel</>}
                        </button>
                        
                        <button 
                          onClick={() => {
                            setFormTestSlug(t.slug);
                            setShowFormModal(true);
                          }}
                          className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Form Ekle
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SAĞ KOLON: FORMLAR VE YANITLAR */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-500" /> Aktif Formlar & Yanıtlar
            </h2>
            {forms.length > 0 && (
               <button 
                onClick={() => { setFormTestSlug(""); setShowFormModal(true); }}
                className="text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Form Oluştur
              </button>
            )}
          </div>

          <div className="space-y-4">
            {forms.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl py-16 text-center">
                <LayoutList className="w-16 h-16 mx-auto text-slate-200 mb-4" />
                <h3 className="text-lg font-medium text-slate-700 mb-2">Henüz Bir Form Eklenmemiş</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                  Danışanlarınıza göndermek üzere testler veya iletişim formları oluşturun. Önce sol menüden bir bağlantı (slug) oluşturmanız gerekir.
                </p>
                <button 
                  onClick={() => setShowFormModal(true)}
                  disabled={tests.length === 0}
                  className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  İlk Formu Oluştur
                </button>
              </div>
            ) : (
              forms.map(form => {
                const formResponses = responses.filter(r => r.formId === form.id);
                const isExpanded = expandedFormId === form.id;
                
                return (
                  <div key={form.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all">
                    {/* Form Kartı Başlığı */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                            {form.testSlug}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">{form.title}</h3>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-4">
                          <span className="flex items-center gap-1.5"><LayoutList className="w-4 h-4" /> {form.fields.length} Soru</span>
                          <span className="flex items-center gap-1.5"><BarChart2 className="w-4 h-4" /> {formResponses.length} Yanıt</span>
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleCopyLink(form.testSlug)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                            copiedLink === form.testSlug ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {copiedLink === form.testSlug ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copiedLink === form.testSlug ? "Kopyalandı" : "Linki Kopyala"}
                        </button>
                        <button
                          onClick={() => setExpandedFormId(isExpanded ? null : form.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                        >
                          {isExpanded ? "Gizle" : "Yanıtları Gör"} <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteForm(form.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Formu Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Yanıtlar Tablosu (Genişletildiğinde) */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-5 animate-in fade-in slide-in-from-top-2 duration-300">
                        {formResponses.length === 0 ? (
                          <div className="text-center py-8 text-slate-500 text-sm">
                            Bu form için henüz bir yanıt toplanmamış.
                          </div>
                        ) : (
                          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm custom-scrollbar">
                            <table className="w-full text-sm text-left whitespace-nowrap">
                              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <tr>
                                  <th className="py-3 px-4 font-semibold w-40">Tarih</th>
                                  {form.fields.map((field) => (
                                    <th key={field.id} className="py-3 px-4 font-semibold">
                                      {field.label} {field.required && <span className="text-red-400">*</span>}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {formResponses.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((r) => (
                                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4 text-slate-500 text-xs">
                                      {new Date(r.createdAt).toLocaleString("tr-TR", { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                    </td>
                                    {form.fields.map((field) => (
                                      <td key={field.id} className="py-3 px-4 text-slate-800 truncate max-w-[200px]" title={formatResponseValue(r.data[field.id])}>
                                        {formatResponseValue(r.data[field.id])}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* --- FORM OLUŞTURMA MODALI --- */}
      {showFormModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" /> Yeni Form Oluştur
              </h2>
              <button onClick={closeFormModal} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Bağlanacak Test URL (Kategori) *</label>
                  <select
                    value={formTestSlug}
                    onChange={(e) => setFormTestSlug(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="">Seçiniz...</option>
                    {tests.map((t) => <option key={t.id} value={t.slug}>/form/{t.slug} {t.isPublic ? "(Açık)" : "(Özel)"}</option>)}
                  </select>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                  <button 
                    onClick={() => setFormBuildMode("manual")} 
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${formBuildMode === 'manual' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Settings className="w-4 h-4" /> Görsel Geliştirici
                  </button>
                  <button 
                    onClick={() => setFormBuildMode("json")} 
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${formBuildMode === 'json' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Code className="w-4 h-4" /> JSON Kod İle
                  </button>
                </div>
              </div>

              {formBuildMode === "manual" ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Form Başlığı *</label>
                    <input
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="Örn: İlk Görüşme Değerlendirme Formu"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 text-sm font-medium"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <label className="text-sm font-bold text-slate-700">Form Soruları / Alanları</label>
                      <button onClick={addFormField} className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Soru Ekle
                      </button>
                    </div>
                    
                    {formFields.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Henüz soru eklemediniz. Sağ üstteki butondan başlayın.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formFields.map((f, i) => (
                          <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
                            <button onClick={() => removeFormField(i)} className="absolute -right-2 -top-2 bg-white border border-slate-200 text-slate-400 hover:text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="w-3.5 h-3.5" />
                            </button>
                            
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                              <div className="md:col-span-6">
                                <input
                                  value={f.label}
                                  onChange={(e) => setFormFields(prev => { const n = [...prev]; n[i] = { ...n[i], label: e.target.value }; return n; })}
                                  placeholder="Soru veya Etiket"
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                                />
                              </div>
                              <div className="md:col-span-4">
                                <select
                                  value={f.type}
                                  onChange={(e) => {
                                    const t = e.target.value as FieldType;
                                    setFormFields(prev => {
                                      const n = [...prev];
                                      n[i] = { ...n[i], type: t, options: t === "single_choice" || t === "multiple_choice" ? ["", ""] : undefined };
                                      return n;
                                    });
                                  }}
                                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                                >
                                  <option value="text">Kısa Metin</option>
                                  <option value="email">E-posta</option>
                                  <option value="tel">Telefon Numarası</option>
                                  <option value="single_choice">Tek Seçim (Radio)</option>
                                  <option value="multiple_choice">Çoklu Seçim (Checkbox)</option>
                                </select>
                              </div>
                              <div className="md:col-span-2 flex items-center h-9">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={f.required}
                                    onChange={(e) => setFormFields(prev => { const n = [...prev]; n[i] = { ...n[i], required: e.target.checked }; return n; })}
                                    className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                                  />
                                  Zorunlu
                                </label>
                              </div>
                            </div>

                            {(f.type === "single_choice" || f.type === "multiple_choice") && (
                              <div className="mt-4 pl-4 border-l-2 border-purple-100 space-y-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Seçenekler</span>
                                {(f.options ?? []).map((opt, oi) => (
                                  <div key={oi} className="flex gap-2 items-center">
                                    <div className={`w-3 h-3 border border-slate-300 shrink-0 ${f.type === 'single_choice' ? 'rounded-full' : 'rounded-sm'}`} />
                                    <input
                                      value={opt}
                                      onChange={(e) => setFormFields(prev => {
                                        const n = [...prev];
                                        const opts = [...(n[i].options ?? [])];
                                        opts[oi] = e.target.value;
                                        n[i] = { ...n[i], options: opts };
                                        return n;
                                      })}
                                      placeholder={`Seçenek ${oi + 1}`}
                                      className="flex-1 max-w-sm px-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-purple-400"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setFormFields(prev => {
                                        const n = [...prev];
                                        const opts = n[i].options ?? [];
                                        n[i] = { ...n[i], options: opts.filter((_, idx) => idx !== oi) };
                                        return n;
                                      })}
                                      disabled={(f.options ?? []).length <= 2}
                                      className="p-1 text-slate-400 hover:text-red-500 rounded disabled:opacity-30 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => setFormFields(prev => {
                                    const n = [...prev];
                                    n[i] = { ...n[i], options: [...(n[i].options ?? []), ""] };
                                    return n;
                                  })}
                                  className="text-xs font-medium text-purple-600 hover:text-purple-700 ml-5 mt-1"
                                >
                                  + Yeni Seçenek Ekle
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100">
                    <p className="font-semibold mb-2 flex items-center gap-1.5"><Globe className="w-4 h-4"/> Neden JSON?</p>
                    Topluluk kütüphanesinden kopyaladığınız hazır psikolojik testleri (örneğin Beck Depresyon Envanteri, SCL-90) buraya yapıştırarak saniyeler içinde kendi hesabınıza kurabilirsiniz.
                  </div>
                  <div className="relative">
                    <textarea
                      value={jsonInput}
                      onChange={(e) => { setJsonInput(e.target.value); setJsonError(null); }}
                      placeholder={JSON_EXAMPLE}
                      className="w-full h-64 p-4 font-mono text-sm bg-slate-900 text-slate-100 rounded-xl border-2 border-transparent focus:border-purple-500 focus:outline-none resize-none custom-scrollbar"
                      spellCheck="false"
                    />
                    <div className="absolute top-3 right-3 text-xs text-slate-500 font-mono select-none pointer-events-none">JSON</div>
                  </div>
                  {jsonError && <p className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-lg flex items-center gap-2"><X className="w-4 h-4"/> {jsonError}</p>}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={closeFormModal} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                İptal
              </button>
              <button 
                onClick={formBuildMode === "manual" ? handleManualFormSubmit : handleJsonFormSubmit}
                className="px-6 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 shadow-sm rounded-xl transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Formu Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scrollbar gizleme stili */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 6px; }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
      `}} />
    </div>
  );
}