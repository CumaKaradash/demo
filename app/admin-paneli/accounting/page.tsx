"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Wallet, 
  Plus, 
  Trash2, 
  Calendar,
  PieChart
} from "lucide-react";

// --- TİPLER ---
type TransactionType = "income" | "expense";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
}

// --- SABİTLER ---
const INCOME_CATEGORIES = ["Seans Ücreti", "Eğitim / Seminer", "Danışmanlık", "Diğer"];
const EXPENSE_CATEGORIES = ["Ofis Kirası", "Faturalar", "Yazılım / Abonelik", "Vergi / Muhasebe", "Reklam / Pazarlama", "Kırtasiye / Malzeme", "Diğer"];

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", 
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

// --- YARDIMCI FONKSİYONLAR ---
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(amount);
};

export default function AccountingPage() {
  // --- STATE'LER ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Form State'leri
  const [type, setType] = useState<TransactionType>("income");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(INCOME_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Filtre State'leri
  const currentDate = new Date();
  const [filterMonth, setFilterMonth] = useState(currentDate.getMonth());
  const [filterYear, setFilterYear] = useState(currentDate.getFullYear());

  // --- EFEKTLER ---
  // Sayfa yüklendiğinde LocalStorage'dan verileri çek
  useEffect(() => {
    const saved = localStorage.getItem("accounting_transactions");
    if (saved) {
      try {
        setTransactions(JSON.parse(saved));
      } catch (e) {
        console.error("Veriler yüklenemedi", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // İşlemler değiştiğinde LocalStorage'a kaydet
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("accounting_transactions", JSON.stringify(transactions));
    }
  }, [transactions, isLoaded]);

  // Tip değiştiğinde default kategoriyi ayarla
  useEffect(() => {
    setCategory(type === "income" ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
  }, [type]);

  // --- İŞLEYİCİLER (HANDLERS) ---
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;

    const newTransaction: Transaction = {
      id: crypto.randomUUID(),
      type,
      amount: Number(amount),
      category,
      description,
      date,
    };

    setTransactions((prev) => [newTransaction, ...prev].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    
    // Formu temizle (Tarih ve tip hariç)
    setAmount("");
    setDescription("");
  };

  const handleDelete = (id: string) => {
    if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // --- HESAPLAMALAR ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    });
  }, [transactions, filterMonth, filterYear]);

  const stats = useMemo(() => {
    const currentMonthIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const currentMonthExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      currentMonthIncome,
      currentMonthExpense,
      currentMonthBalance: currentMonthIncome - currentMonthExpense,
      totalBalance: totalIncome - totalExpense
    };
  }, [transactions, filteredTransactions]);

  // Grafik hesaplamaları
  const totalMonthlyVolume = stats.currentMonthIncome + stats.currentMonthExpense;
  const incomePercentage = totalMonthlyVolume === 0 ? 50 : (stats.currentMonthIncome / totalMonthlyVolume) * 100;
  const expensePercentage = totalMonthlyVolume === 0 ? 50 : (stats.currentMonthExpense / totalMonthlyVolume) * 100;

  if (!isLoaded) return <div className="p-8 text-slate-500">Yükleniyor...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      
      {/* BAŞLIK VE FİLTRE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Ön Muhasebe</h1>
          <p className="text-sm text-slate-500">Gelir ve giderlerinizi takip edin, finansal durumunuzu analiz edin.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-blue-100 shadow-sm">
          <Calendar className="w-4 h-4 text-blue-500 ml-2" />
          <select 
            value={filterMonth} 
            onChange={(e) => setFilterMonth(Number(e.target.value))}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select 
            value={filterYear} 
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer pr-2"
          >
            {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* İSTATİSTİK KARTLARI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wallet className="w-16 h-16 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-slate-500 mb-1">Genel Net Bakiye</p>
          <p className={`text-3xl font-bold ${stats.totalBalance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
            {formatCurrency(stats.totalBalance)}
          </p>
          <p className="text-xs text-slate-400 mt-2">Tüm zamanların toplamı</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ArrowUpCircle className="w-16 h-16 text-green-600" />
          </div>
          <p className="text-sm font-medium text-green-600 mb-1">Seçili Ay Geliri</p>
          <p className="text-3xl font-bold text-slate-800">
            {formatCurrency(stats.currentMonthIncome)}
          </p>
          <p className="text-xs text-slate-400 mt-2">{MONTHS[filterMonth]} ayı toplam tahsilat</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ArrowDownCircle className="w-16 h-16 text-red-600" />
          </div>
          <p className="text-sm font-medium text-red-600 mb-1">Seçili Ay Gideri</p>
          <p className="text-3xl font-bold text-slate-800">
            {formatCurrency(stats.currentMonthExpense)}
          </p>
          <p className="text-xs text-slate-400 mt-2">{MONTHS[filterMonth]} ayı toplam harcama</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: YENİ KAYIT FORMU */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-blue-100 shadow-sm h-fit">
          <h2 className="text-lg font-medium text-slate-800 mb-6 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-600" />
            Yeni İşlem Ekle
          </h2>
          
          <form onSubmit={handleAddTransaction} className="space-y-4">
            {/* Tip Seçimi (Toggle) */}
            <div className="flex p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType("income")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  type === "income" ? "bg-white text-green-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Gelir
              </button>
              <button
                type="button"
                onClick={() => setType("expense")}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                  type === "expense" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Gider
              </button>
            </div>

            {/* Tutar */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tutar (TL)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₺</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Kategori & Tarih */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Kategori</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tarih</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Açıklama */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Açıklama (Opsiyonel)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                placeholder="Örn: Ahmet Bey 4. seans ücreti"
              />
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 rounded-lg text-white font-medium transition-colors ${
                type === "income" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              }`}
            >
              {type === "income" ? "Gelir Ekle" : "Gider Ekle"}
            </button>
          </form>
        </div>

        {/* SAĞ KOLON: LİSTE VE GRAFİK */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Mini Analiz Çubuğu */}
          <div className="bg-white p-6 rounded-2xl border border-blue-100 shadow-sm">
            <h3 className="text-sm font-medium text-slate-800 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-500" />
              Aylık Nakit Akışı Özeti
            </h3>
            {totalMonthlyVolume > 0 ? (
              <div>
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-green-600 font-medium">Gelir: %{Math.round(incomePercentage)}</span>
                  <span className="text-red-600 font-medium">Gider: %{Math.round(expensePercentage)}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-green-500 transition-all duration-1000" 
                    style={{ width: `${incomePercentage}%` }}
                  />
                  <div 
                    className="h-full bg-red-500 transition-all duration-1000" 
                    style={{ width: `${expensePercentage}%` }}
                  />
                </div>
                <p className="text-center text-xs text-slate-400 mt-3">
                  Bu ayki net durumunuz: <span className={`font-medium ${stats.currentMonthBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.currentMonthBalance > 0 ? "+" : ""}{formatCurrency(stats.currentMonthBalance)}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-2">Bu ay için henüz işlem bulunmuyor.</p>
            )}
          </div>

          {/* İşlem Tablosu */}
          <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-blue-50 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-medium text-slate-800">İşlem Geçmişi ({MONTHS[filterMonth]})</h3>
              <span className="text-xs font-medium px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full">
                {filteredTransactions.length} Kayıt
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white border-b border-blue-50 text-slate-500">
                  <tr>
                    <th className="py-3 px-4 font-medium">Tarih</th>
                    <th className="py-3 px-4 font-medium">Kategori</th>
                    <th className="py-3 px-4 font-medium">Açıklama</th>
                    <th className="py-3 px-4 font-medium text-right">Tutar</th>
                    <th className="py-3 px-4 font-medium text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <Wallet className="w-12 h-12 mb-3 opacity-20" />
                          <p>Bu aya ait kayıt bulunamadı.</p>
                          <p className="text-xs mt-1">Soldaki formu kullanarak işlem ekleyebilirsiniz.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                          {new Date(t.date).toLocaleDateString("tr-TR")}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            t.type === "income" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                          }`}>
                            {t.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-[200px] truncate" title={t.description}>
                          {t.description || "-"}
                        </td>
                        <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${
                          t.type === "income" ? "text-green-600" : "text-red-600"
                        }`}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}