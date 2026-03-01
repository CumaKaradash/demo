import { Invoice, InvoiceItem, ApiResponse, PaginatedResponse } from '@/types';
import { PrismaClient } from '@/lib/generated/prisma/client';

// @ts-ignore
const prisma = new PrismaClient();

export const getInvoices = async (page = 1, limit = 10): Promise<PaginatedResponse<Invoice>> => {
  const skip = (page - 1) * limit;
  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      skip,
      take: limit,
      include: {
        client: true,
        appointment: true,
        items: true,
        transactions: true
      },
      orderBy: {
        created_at: 'desc'
      }
    }),
    prisma.invoice.count()
  ]);

  return {
    data: invoices.map(invoice => ({
      // @ts-ignore
      ...invoice,
      created_at: invoice.created_at.toISOString(),
      updated_at: invoice.updated_at.toISOString(),
      // @ts-ignore
      client: invoice.client ? {
        // @ts-ignore
        ...invoice.client,
        created_at: invoice.client.created_at.toISOString(),
        updated_at: invoice.client.updated_at.toISOString()
      } : undefined,
      // @ts-ignore
      appointment: invoice.appointment ? {
        // @ts-ignore
        ...invoice.appointment,
        created_at: invoice.appointment.created_at.toISOString(),
        updated_at: invoice.appointment.updated_at.toISOString()
      } : undefined,
      items: invoice.items.map(item => ({
        // @ts-ignore
        ...item,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString()
      })),
      transactions: invoice.transactions.map(tx => ({
        // @ts-ignore
        ...tx,
        created_at: tx.created_at.toISOString(),
        updated_at: tx.updated_at.toISOString()
      }))
    })) as Invoice[],
    total,
    page,
    limit,
    hasMore: skip + limit < total
  };
};

export const getInvoiceById = async (id: string): Promise<ApiResponse<Invoice>> => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        appointment: true,
        items: true,
        transactions: true
      }
    });

    if (!invoice) {
      return {
        data: null as any,
        error: 'Fatura bulunamadı'
      };
    }

    return { data: {
      // @ts-ignore
      ...invoice,
      created_at: invoice.created_at.toISOString(),
      updated_at: invoice.updated_at.toISOString(),
      // @ts-ignore
      client: invoice.client ? {
        // @ts-ignore
        ...invoice.client,
        created_at: invoice.client.created_at.toISOString(),
        updated_at: invoice.client.updated_at.toISOString()
      } : undefined,
      // @ts-ignore
      appointment: invoice.appointment ? {
        // @ts-ignore
        ...invoice.appointment,
        created_at: invoice.appointment.created_at.toISOString(),
        updated_at: invoice.appointment.updated_at.toISOString()
      } : undefined,
      items: invoice.items.map(item => ({
        // @ts-ignore
        ...item,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString()
      })),
      transactions: invoice.transactions.map(tx => ({
        // @ts-ignore
        ...tx,
        created_at: tx.created_at.toISOString(),
        updated_at: tx.updated_at.toISOString()
      }))
    } as Invoice };
  } catch (error) {
    return {
      data: null as any,
      error: 'Fatura yüklenirken hata oluştu'
    };
  }
};

export const getInvoicesByClientId = async (clientId: string): Promise<ApiResponse<Invoice[]>> => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { client_id: clientId },
      include: {
        client: true,
        appointment: true,
        items: true,
        transactions: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return { data: invoices.map(invoice => ({
      // @ts-ignore
      ...invoice,
      created_at: invoice.created_at.toISOString(),
      updated_at: invoice.updated_at.toISOString(),
      // @ts-ignore
      client: invoice.client ? {
        // @ts-ignore
        ...invoice.client,
        created_at: invoice.client.created_at.toISOString(),
        updated_at: invoice.client.updated_at.toISOString()
      } : undefined,
      // @ts-ignore
      appointment: invoice.appointment ? {
        // @ts-ignore
        ...invoice.appointment,
        created_at: invoice.appointment.created_at.toISOString(),
        updated_at: invoice.appointment.updated_at.toISOString()
      } : undefined,
      items: invoice.items.map(item => ({
        // @ts-ignore
        ...item,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString()
      })),
      transactions: invoice.transactions.map(tx => ({
        // @ts-ignore
        ...tx,
        created_at: tx.created_at.toISOString(),
        updated_at: tx.updated_at.toISOString()
      }))
    })) as Invoice[] };
  } catch (error) {
    return {
      data: [],
      error: 'Faturalar yüklenirken hata oluştu'
    };
  }
};

export const createInvoice = async (invoiceData: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'client' | 'appointment' | 'items' | 'transactions'>, items: Omit<InvoiceItem, 'id' | 'created_at' | 'updated_at'>[]): Promise<ApiResponse<Invoice>> => {
  try {
    const invoice = await prisma.invoice.create({
      data: {
        ...invoiceData,
        items: {
          create: items
        }
      },
      include: {
        client: true,
        appointment: true,
        items: true,
        transactions: true
      }
    });

    return { data: {
      // @ts-ignore
      ...invoice,
      created_at: invoice.created_at.toISOString(),
      updated_at: invoice.updated_at.toISOString(),
      // @ts-ignore
      client: invoice.client ? {
        // @ts-ignore
        ...invoice.client,
        created_at: invoice.client.created_at.toISOString(),
        updated_at: invoice.client.updated_at.toISOString()
      } : undefined,
      // @ts-ignore
      appointment: invoice.appointment ? {
        // @ts-ignore
        ...invoice.appointment,
        created_at: invoice.appointment.created_at.toISOString(),
        updated_at: invoice.appointment.updated_at.toISOString()
      } : undefined,
      items: invoice.items.map(item => ({
        // @ts-ignore
        ...item,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString()
      })),
      transactions: invoice.transactions.map(tx => ({
        // @ts-ignore
        ...tx,
        created_at: tx.created_at.toISOString(),
        updated_at: tx.updated_at.toISOString()
      }))
    } as Invoice, message: 'Fatura başarıyla oluşturuldu' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Fatura oluşturulurken hata oluştu'
    };
  }
};

export const updateInvoice = async (id: string, updates: Partial<Omit<Invoice, 'id' | 'created_at' | 'client' | 'appointment' | 'items' | 'transactions'>>): Promise<ApiResponse<Invoice>> => {
  try {
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updates as any,
      include: {
        client: true,
        appointment: true,
        items: true,
        transactions: true
      }
    });

    return { data: {
      // @ts-ignore
      ...invoice,
      created_at: invoice.created_at.toISOString(),
      updated_at: invoice.updated_at.toISOString(),
      // @ts-ignore
      client: invoice.client ? {
        // @ts-ignore
        ...invoice.client,
        created_at: invoice.client.created_at.toISOString(),
        updated_at: invoice.client.updated_at.toISOString()
      } : undefined,
      // @ts-ignore
      appointment: invoice.appointment ? {
        // @ts-ignore
        ...invoice.appointment,
        created_at: invoice.appointment.created_at.toISOString(),
        updated_at: invoice.appointment.updated_at.toISOString()
      } : undefined,
      items: invoice.items.map(item => ({
        // @ts-ignore
        ...item,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString()
      })),
      transactions: invoice.transactions.map(tx => ({
        // @ts-ignore
        ...tx,
        created_at: tx.created_at.toISOString(),
        updated_at: tx.updated_at.toISOString()
      }))
    } as Invoice, message: 'Fatura başarıyla güncellendi' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Fatura güncellenirken hata oluştu'
    };
  }
};

export const deleteInvoice = async (id: string): Promise<ApiResponse<void>> => {
  try {
    await prisma.invoice.delete({
      where: { id }
    });

    return { data: undefined, message: 'Fatura başarıyla silindi' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Fatura silinirken hata oluştu'
    };
  }
};

export const getInvoiceItems = async (invoiceId: string): Promise<ApiResponse<InvoiceItem[]>> => {
  try {
    const items = await prisma.invoiceItem.findMany({
      where: { invoice_id: invoiceId },
      orderBy: {
        created_at: 'asc'
      }
    });

    return { data: items.map((item: any) => ({
      // @ts-ignore
      ...item,
      created_at: item.created_at.toISOString(),
      updated_at: item.updated_at.toISOString()
    })) as InvoiceItem[] };
  } catch (error) {
    return {
      data: [],
      error: 'Fatura kalemleri yüklenirken hata oluştu'
    };
  }
};

export const getUnpaidInvoices = async (): Promise<ApiResponse<Invoice[]>> => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { status: 'sent' },
          { status: 'draft' }
        ]
      },
      include: {
        client: true,
        appointment: true,
        items: true,
        transactions: true
      },
      orderBy: {
        due_date: 'asc'
      }
    });

    return { data: invoices.map(invoice => ({
      // @ts-ignore
      ...invoice,
      created_at: invoice.created_at.toISOString(),
      updated_at: invoice.updated_at.toISOString(),
      // @ts-ignore
      client: invoice.client ? {
        // @ts-ignore
        ...invoice.client,
        created_at: invoice.client.created_at.toISOString(),
        updated_at: invoice.client.updated_at.toISOString()
      } : undefined,
      // @ts-ignore
      appointment: invoice.appointment ? {
        // @ts-ignore
        ...invoice.appointment,
        created_at: invoice.appointment.created_at.toISOString(),
        updated_at: invoice.appointment.updated_at.toISOString()
      } : undefined,
      items: invoice.items.map(item => ({
        // @ts-ignore
        ...item,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString()
      })),
      transactions: invoice.transactions.map(tx => ({
        // @ts-ignore
        ...tx,
        created_at: tx.created_at.toISOString(),
        updated_at: tx.updated_at.toISOString()
      }))
    })) as Invoice[] };
  } catch (error) {
    return {
      data: [],
      error: 'Faturalar yüklenirken hata oluştu'
    };
  }
};

export const getOverdueInvoices = async (): Promise<ApiResponse<Invoice[]>> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const invoices = await prisma.invoice.findMany({
      where: {
        status: 'sent',
        due_date: {
          lt: today
        }
      },
      include: {
        client: true,
        appointment: true,
        items: true,
        transactions: true
      },
      orderBy: {
        due_date: 'asc'
      }
    });

    return { data: invoices.map(invoice => ({
      // @ts-ignore
      ...invoice,
      created_at: invoice.created_at.toISOString(),
      updated_at: invoice.updated_at.toISOString(),
      // @ts-ignore
      client: invoice.client ? {
        // @ts-ignore
        ...invoice.client,
        created_at: invoice.client.created_at.toISOString(),
        updated_at: invoice.client.updated_at.toISOString()
      } : undefined,
      // @ts-ignore
      appointment: invoice.appointment ? {
        // @ts-ignore
        ...invoice.appointment,
        created_at: invoice.appointment.created_at.toISOString(),
        updated_at: invoice.appointment.updated_at.toISOString()
      } : undefined,
      items: invoice.items.map(item => ({
        // @ts-ignore
        ...item,
        created_at: item.created_at.toISOString(),
        updated_at: item.updated_at.toISOString()
      })),
      transactions: invoice.transactions.map(tx => ({
        // @ts-ignore
        ...tx,
        created_at: tx.created_at.toISOString(),
        updated_at: tx.updated_at.toISOString()
      }))
    })) as Invoice[] };
  } catch (error) {
    return {
      data: [],
      error: 'Faturalar yüklenirken hata oluştu'
    };
  }
};
