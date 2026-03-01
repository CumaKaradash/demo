"use client";

import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { 
  UploadCloud, FileText, File, Link as LinkIcon, 
  Search, Trash2, Download, Eye, Plus, ExternalLink,
  CheckSquare, Square, HardDrive, Filter
} from "lucide-react";

// --- TİPLER ---
interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: string;
  customerName: string;
  documentType: "PDF" | "Test" | "Görsel" | "Diğer";
  url?: string;
}

interface SavedLink {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
  dateAdded: string;
}

// --- YARDIMCI FONKSİYONLAR ---
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

export default function ArchivePage() {
  // --- STATE'LER ---
  const [activeTab, setActiveTab] = useState<"files" | "links">("files");
  const [isLoaded, setIsLoaded] = useState(false);

  // Dosya State'leri
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [fileSearch, setFileSearch] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link State'leri
  const [savedLinks, setSavedLinks] = useState<SavedLink[]>([]);
  const [linkSearch, setLinkSearch] = useState("");
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [newLink, setNewLink] = useState({ title: "", url: "", description: "", category: "Makale" });

  // --- EFEKTLER ---
  useEffect(() => {
    const storedFiles = localStorage.getItem("archiveFiles");
    if (storedFiles) setUploadedFiles(JSON.parse(storedFiles));

    const storedLinks = localStorage.getItem("archiveLinks");
    if (storedLinks) setSavedLinks(JSON.parse(storedLinks));

    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("archiveFiles", JSON.stringify(uploadedFiles));
      localStorage.setItem("archiveLinks", JSON.stringify(savedLinks));
    }
  }, [uploadedFiles, savedLinks, isLoaded]);

  // --- DOSYA İŞLEYİCİLERİ ---
  const handleFileUpload = useCallback((files: FileList) => {
    setIsUploading(true);
    setUploadProgress(0);

    // Yükleme animasyonu simülasyonu
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          
          const newFiles: UploadedFile[] = Array.from(files).map((file) => {
            let docType: UploadedFile["documentType"] = "Diğer";
            if (file.type === "application/pdf") docType = "PDF";
            else if (file.type.includes("image")) docType = "Görsel";
            else if (file.name.toLowerCase().includes("test")) docType = "Test";

            return {
              id: crypto.randomUUID(),
              name: file.name,
              type: file.type,
              size: file.size,
              uploadDate: new Date().toISOString(),
              customerName: file.name.split('.')[0] || "Bilinmiyor",
              documentType: docType,
              url: URL.createObjectURL(file)
            };
          });

          setUploadedFiles(prev => [...newFiles, ...prev]);
          setIsUploading(false);
          setUploadProgress(0);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const toggleFileSelection = (id: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedFiles(newSelection);
  };

  const toggleAllFiles = () => {
    if (selectedFiles.size === filteredFiles.length) setSelectedFiles(new Set());
    else setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
  };

  const deleteSelectedFiles = () => {
    if (confirm(`${selectedFiles.size} dosyayı silmek istediğinize emin misiniz?`)) {
      setUploadedFiles(prev => prev.filter(f => !selectedFiles.has(f.id)));
      setSelectedFiles(new Set());
    }
  };

  // --- LİNK İŞLEYİCİLERİ ---
  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.title || !newLink.url) return;

    const formattedUrl = newLink.url.startsWith('http') ? newLink.url : `https://${newLink.url}`;

    setSavedLinks(prev => [{
      id: crypto.randomUUID(),
      ...newLink,
      url: formattedUrl,
      dateAdded: new Date().toISOString()
    }, ...prev]);
    
    setNewLink({ title: "", url: "", description: "", category: "Makale" });
    setShowLinkModal(false);
  };

  const deleteLink = (id: string) => {
    if (confirm("Bu bağlantıyı silmek istediğinize emin misiniz?")) {
      setSavedLinks(prev => prev.filter(l => l.id !== id));
    }
  };

  // --- HESAPLAMALAR VE FİLTRELER ---
  const filteredFiles = useMemo(() => {
    return uploadedFiles.filter(f => 
      f.name.toLowerCase().includes(fileSearch.toLowerCase()) || 
      f.customerName.toLowerCase().includes(fileSearch.toLowerCase())
    );
  }, [uploadedFiles, fileSearch]);

  const filteredLinks = useMemo(() => {
    return savedLinks.filter(l => 
      l.title.toLowerCase().includes(linkSearch.toLowerCase()) ||
      l.category.toLowerCase().includes(linkSearch.toLowerCase())
    );
  }, [savedLinks, linkSearch]);

  const totalUsedStorage = uploadedFiles.reduce((sum, f) => sum + f.size, 0);
  const maxStorage = 5 * 1024 * 1024 * 1024; // 5GB kurgusal limit
  const storagePercentage = (totalUsedStorage / maxStorage) * 100;

  if (!isLoaded) return <div className="p-8 text-slate-500">Arşiv yükleniyor...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      
      {/* ÜST BAŞLIK VE KOTA ALANI */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dijital Arşiv</h1>
          <p className="text-sm text-slate-500 mt-1">Belgelerinizi, formlarınızı ve önemli bağlantılarınızı tek bir yerde yönetin.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 min-w-[250px]">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <HardDrive className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700">Depolama</span>
              <span className="text-slate-500">{formatFileSize(totalUsedStorage)} / 5 GB</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${storagePercentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.max(storagePercentage, 1)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SEKMELER (TABS) */}
      <div className="flex space-x-1 bg-slate-200/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("files")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "files" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          Dosya Arşivi
        </button>
        <button
          onClick={() => setActiveTab("links")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === "links" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          Bağlantı Arşivi
        </button>
      </div>

      {/* --- DOSYA ARŞİVİ SEKME İÇERİĞİ --- */}
      {activeTab === "files" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Yükleme Alanı */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              isDragging ? "border-blue-500 bg-blue-50" : 
              isUploading ? "border-slate-300 bg-slate-50 pointer-events-none" : 
              "border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50 cursor-pointer"
            }`}
          >
            {isUploading ? (
              <div className="max-w-xs mx-auto">
                <UploadCloud className="w-12 h-12 mx-auto text-blue-500 animate-bounce mb-4" />
                <p className="text-sm font-medium text-slate-700 mb-2">Dosyalar Yükleniyor...</p>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <UploadCloud className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-base font-medium text-slate-800 mb-1">
                  Dosyaları buraya sürükleyin veya <span className="text-blue-600">tıklayarak seçin</span>
                </p>
                <p className="text-sm text-slate-500">PDF, Word, Excel, Görseller (Maks. 50MB)</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
          </div>

          {/* Dosya Tablosu Araç Çubuğu */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Dosya veya müşteri ara..."
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {selectedFiles.size > 0 && (
                <button 
                  onClick={deleteSelectedFiles}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {selectedFiles.size} Seçileni Sil
                </button>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <Filter className="w-4 h-4" />
                Toplam {filteredFiles.length} Dosya
              </div>
            </div>
          </div>

          {/* Dosya Tablosu */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">
                      <button onClick={toggleAllFiles} className="text-slate-400 hover:text-blue-600">
                        {selectedFiles.size === filteredFiles.length && filteredFiles.length > 0 ? 
                          <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />
                        }
                      </button>
                    </th>
                    <th className="py-3 px-4 font-medium">Dosya Adı</th>
                    <th className="py-3 px-4 font-medium">Danışan / İlgi</th>
                    <th className="py-3 px-4 font-medium">Tür</th>
                    <th className="py-3 px-4 font-medium">Tarih</th>
                    <th className="py-3 px-4 font-medium text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFiles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        <File className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <p>Aradığınız kriterlerde dosya bulunamadı.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredFiles.map((file) => (
                      <tr key={file.id} className={`hover:bg-slate-50/80 transition-colors ${selectedFiles.has(file.id) ? 'bg-blue-50/30' : ''}`}>
                        <td className="py-3 px-4 text-center">
                          <button onClick={() => toggleFileSelection(file.id)} className="text-slate-400 hover:text-blue-600">
                            {selectedFiles.has(file.id) ? 
                              <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5" />
                            }
                          </button>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700 flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            file.documentType === 'PDF' ? 'bg-red-100 text-red-600' :
                            file.documentType === 'Görsel' ? 'bg-purple-100 text-purple-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{file.customerName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                            {file.documentType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">{formatDate(file.uploadDate)}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            {file.url && (
                              <a href={file.url} target="_blank" rel="noopener noreferrer" 
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Görüntüle">
                                <Eye className="w-4 h-4" />
                              </a>
                            )}
                            <a href={file.url} download={file.name}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded" title="İndir">
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- BAĞLANTI (URL) ARŞİVİ SEKME İÇERİĞİ --- */}
      {activeTab === "links" && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Bağlantı başlığı veya kategori ara..."
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            
            <button 
              onClick={() => setShowLinkModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Yeni Bağlantı
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLinks.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-dashed border-slate-300 rounded-xl">
                <LinkIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>Henüz bir bağlantı kaydedilmemiş.</p>
                <button onClick={() => setShowLinkModal(true)} className="mt-3 text-sm text-blue-600 font-medium hover:underline">
                  İlk bağlantınızı ekleyin
                </button>
              </div>
            ) : (
              filteredLinks.map((link) => (
                <div key={link.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                      {link.category}
                    </span>
                    <button onClick={() => deleteLink(link.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="font-medium text-slate-800 mb-2 line-clamp-1" title={link.title}>{link.title}</h3>
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">{link.description || "Açıklama eklenmemiş."}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
                    <span className="text-xs text-slate-400">{formatDate(link.dateAdded)}</span>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      Ziyaret Et <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* YENİ BAĞLANTI EKLEME MODALI */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-500" />
              Yeni Bağlantı Ekle
            </h2>
            
            <form onSubmit={handleAddLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık</label>
                <input 
                  required
                  type="text" 
                  value={newLink.title}
                  onChange={e => setNewLink({...newLink, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="Örn: BDT Teknikleri Makalesi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">URL (Link)</label>
                <input 
                  required
                  type="url" 
                  value={newLink.url}
                  onChange={e => setNewLink({...newLink, url: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  placeholder="https://example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <select 
                    value={newLink.category}
                    onChange={e => setNewLink({...newLink, category: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  >
                    <option>Makale</option>
                    <option>Test Formu</option>
                    <option>Video / Eğitim</option>
                    <option>Araç / Yazılım</option>
                    <option>Diğer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama (Opsiyonel)</label>
                <textarea 
                  rows={2}
                  value={newLink.description}
                  onChange={e => setNewLink({...newLink, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                  placeholder="Bu bağlantı ne hakkında?"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}