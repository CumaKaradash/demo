// Supabase uyumlu TypeScript tipleri
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Müşteri tablosu
export interface Client extends BaseEntity {
  name: string;
  email: string;
  phone: string;
  address?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'prospect';
  company?: string;
  tax_id?: string;
}

// Randevu tablosu
export interface Appointment extends BaseEntity {
  client_id: string;
  service_type: string;
  date: string;
  time: string;
  duration: number; // dakika
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  price?: number;
  client?: Client; // ilişkisel veri
}

// Fatura tablosu
export interface Invoice extends BaseEntity {
  client_id: string;
  appointment_id?: string;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string;
  client?: Client; // ilişkisel veri
  appointment?: Appointment; // ilişkisel veri
}

// Fatura kalemleri
export interface InvoiceItem extends BaseEntity {
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// Form tablosu
export interface Form extends BaseEntity {
  title: string;
  slug: string;
  description?: string;
  is_active: boolean;
  fields: FormField[];
}

// Form alan tipleri
export interface FormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // select, checkbox, radio için
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Form yanıtları
export interface FormResponse extends BaseEntity {
  form_id: string;
  client_id: string;
  responses: Record<string, any>;
  form?: Form; // ilişkisel veri
  client?: Client; // ilişkisel veri
}

// Gelir/Gider kayıtları
export interface Transaction extends BaseEntity {
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  payment_method: 'cash' | 'bank' | 'card' | 'transfer';
  invoice_id?: string;
  invoice?: Invoice; // ilişkisel veri
}

// Dashboard istatistikleri
export interface DashboardStats {
  totalClients: number;
  activeClients: number;
  monthlyRevenue: number;
  pendingAppointments: number;
  completedAppointments: number;
  unpaidInvoices: number;
  totalRevenue: number;
  totalExpenses: number;
}

// API response tipleri
export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
