import { DashboardStats, ApiResponse } from '@/types';
import { getClients } from './clients';
import { getAppointments, getUpcomingAppointments } from './appointments';
import { getUnpaidInvoices } from './invoices';

export const getDashboardStats = async (): Promise<ApiResponse<DashboardStats>> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  try {
    // Müşteri verileri
    const clientsResponse = await getClients(1, 100);
    const clients = clientsResponse.data;
    const activeClients = clients.filter(c => c.status === 'active').length;
    
    // Randevu verileri
    const appointmentsResponse = await getAppointments(1, 100);
    const appointments = appointmentsResponse.data;
    const completedAppointments = appointments.filter(a => a.status === 'completed').length;
    
    const upcomingResponse = await getUpcomingAppointments();
    const pendingAppointments = upcomingResponse.data.length;
    
    // Fatura verileri
    const unpaidResponse = await getUnpaidInvoices();
    const unpaidInvoices = unpaidResponse.data.length;
    
    // Gelir hesaplaması (tamamlanmış randevulardan)
    const monthlyRevenue = appointments
      .filter(a => {
        const appointmentDate = new Date(a.date);
        const currentDate = new Date();
        return a.status === 'completed' && 
               appointmentDate.getMonth() === currentDate.getMonth() &&
               appointmentDate.getFullYear() === currentDate.getFullYear();
      })
      .reduce((total, appointment) => total + (appointment.price || 0), 0);
    
    const totalRevenue = appointments
      .filter(a => a.status === 'completed')
      .reduce((total, appointment) => total + (appointment.price || 0), 0);
    
    // Giderler (mock veri, gerçek uygulamada veritabanından gelecek)
    const totalExpenses = Math.round(totalRevenue * 0.3); // Gelirin %30'u kadar gider varsayımı
    
    const stats: DashboardStats = {
      totalClients: clients.length,
      activeClients,
      monthlyRevenue,
      pendingAppointments,
      completedAppointments,
      unpaidInvoices,
      totalRevenue,
      totalExpenses
    };
    
    return { data: stats };
  } catch (error) {
    return {
      data: {} as DashboardStats,
      error: 'Dashboard verileri yüklenirken hata oluştu'
    };
  }
};

export const getRecentActivity = async (): Promise<ApiResponse<any[]>> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Son aktiviteler (mock veri)
  const activities = [
    {
      id: '1',
      type: 'appointment_completed',
      description: 'Ahmet Yılmaz ile danışmanlık randevusu tamamlandı',
      timestamp: '2024-02-25T17:00:00Z',
      icon: 'check-circle',
      color: 'green'
    },
    {
      id: '2',
      type: 'new_client',
      description: 'Ayşe Demir sisteme kaydedildi',
      timestamp: '2024-02-22T11:15:00Z',
      icon: 'user-plus',
      color: 'blue'
    },
    {
      id: '3',
      type: 'invoice_paid',
      description: 'INV-2024-001 faturası ödendi',
      timestamp: '2024-03-08T10:30:00Z',
      icon: 'credit-card',
      color: 'green'
    },
    {
      id: '4',
      type: 'appointment_scheduled',
      description: 'Ayşe Demir için teknik destek randevusu planlandı',
      timestamp: '2024-02-22T11:15:00Z',
      icon: 'calendar',
      color: 'orange'
    },
    {
      id: '5',
      type: 'form_submitted',
      description: 'Müşteri bilgi formu dolduruldu',
      timestamp: '2024-02-15T11:20:00Z',
      icon: 'file-text',
      color: 'purple'
    }
  ];
  
  return { data: activities };
};

export const getUpcomingAppointmentsForDashboard = async (limit = 5): Promise<ApiResponse<any[]>> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const upcomingResponse = await getUpcomingAppointments();
  const appointments = upcomingResponse.data
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
  
  return { data: appointments };
};

export const getUnpaidInvoicesForDashboard = async (limit = 5): Promise<ApiResponse<any[]>> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const unpaidResponse = await getUnpaidInvoices();
  const invoices = unpaidResponse.data
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
    .slice(0, limit);
  
  return { data: invoices };
};
