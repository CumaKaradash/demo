import { Appointment, ApiResponse, PaginatedResponse } from '@/types';
import { PrismaClient } from '@/lib/generated/prisma/client';

// @ts-ignore
const prisma = new PrismaClient();

export const getAppointments = async (page = 1, limit = 10): Promise<PaginatedResponse<Appointment>> => {
  const skip = (page - 1) * limit;
  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      skip,
      take: limit,
      include: {
        client: true
      },
      orderBy: {
        created_at: 'desc'
      }
    }),
    prisma.appointment.count()
  ]);

  return {
    // @ts-ignore
    data: appointments.map(apt => ({
      ...apt,
      created_at: apt.created_at.toISOString(),
      updated_at: apt.updated_at.toISOString(),
      client: apt.client ? {
        ...apt.client,
        created_at: apt.client.created_at.toISOString(),
        updated_at: apt.client.updated_at.toISOString()
      } : undefined
    })) as Appointment[],
    total,
    page,
    limit,
    hasMore: skip + limit < total
  };
};

export const getAppointmentById = async (id: string): Promise<ApiResponse<Appointment>> => {
  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true
      }
    });

    if (!appointment) {
      return {
        data: null as any,
        error: 'Randevu bulunamadı'
      };
    }

    return { data: {
      // @ts-ignore
      ...appointment,
      created_at: appointment.created_at.toISOString(),
      updated_at: appointment.updated_at.toISOString(),
      client: appointment.client ? {
        // @ts-ignore
        ...appointment.client,
        created_at: appointment.client.created_at.toISOString(),
        updated_at: appointment.client.updated_at.toISOString()
      } : undefined
    } as Appointment };
  } catch (error) {
    return {
      data: null as any,
      error: 'Randevu yüklenirken hata oluştu'
    };
  }
};

export const getAppointmentsByClientId = async (clientId: string): Promise<ApiResponse<Appointment[]>> => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { client_id: clientId },
      include: {
        client: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return { data: appointments.map(apt => ({
      // @ts-ignore
      ...apt,
      created_at: apt.created_at.toISOString(),
      updated_at: apt.updated_at.toISOString(),
      client: apt.client ? {
        // @ts-ignore
        ...apt.client,
        created_at: apt.client.created_at.toISOString(),
        updated_at: apt.client.updated_at.toISOString()
      } : undefined
    })) as Appointment[] };
  } catch (error) {
    return {
      data: [],
      error: 'Randevular yüklenirken hata oluştu'
    };
  }
};

export const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'client'>): Promise<ApiResponse<Appointment>> => {
  try {
    const appointment = await prisma.appointment.create({
      data: appointmentData,
      include: {
        client: true
      }
    });

    return { data: {
      ...appointment,
      created_at: appointment.created_at.toISOString(),
      updated_at: appointment.updated_at.toISOString(),
      client: appointment.client ? {
        ...appointment.client,
        created_at: appointment.client.created_at.toISOString(),
        updated_at: appointment.client.updated_at.toISOString()
      } : undefined
    } as Appointment, message: 'Randevu başarıyla eklendi' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Randevu oluşturulurken hata oluştu'
    };
  }
};

export const updateAppointment = async (id: string, updates: Partial<Omit<Appointment, 'id' | 'created_at' | 'client'>>): Promise<ApiResponse<Appointment>> => {
  try {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: updates,
      include: {
        client: true
      }
    });

    return { data: {
      ...appointment,
      created_at: appointment.created_at.toISOString(),
      updated_at: appointment.updated_at.toISOString(),
      client: appointment.client ? {
        ...appointment.client,
        created_at: appointment.client.created_at.toISOString(),
        updated_at: appointment.client.updated_at.toISOString()
      } : undefined
    } as Appointment, message: 'Randevu başarıyla güncellendi' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Randevu güncellenirken hata oluştu'
    };
  }
};

export const deleteAppointment = async (id: string): Promise<ApiResponse<void>> => {
  try {
    await prisma.appointment.delete({
      where: { id }
    });

    return { data: undefined, message: 'Randevu başarıyla silindi' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Randevu silinirken hata oluştu'
    };
  }
};

export const getAppointmentsByDateRange = async (startDate: string, endDate: string): Promise<ApiResponse<Appointment[]>> => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        client: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    return { data: appointments.map(apt => ({
      // @ts-ignore
      ...apt,
      created_at: apt.created_at.toISOString(),
      updated_at: apt.updated_at.toISOString(),
      client: apt.client ? {
        // @ts-ignore
        ...apt.client,
        created_at: apt.client.created_at.toISOString(),
        updated_at: apt.client.updated_at.toISOString()
      } : undefined
    })) as Appointment[] };
  } catch (error) {
    return {
      data: [],
      error: 'Randevular yüklenirken hata oluştu'
    };
  }
};

export const getUpcomingAppointments = async (): Promise<ApiResponse<Appointment[]>> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: today
        },
        status: 'scheduled'
      },
      include: {
        client: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    return { data: appointments.map(apt => ({
      // @ts-ignore
      ...apt,
      created_at: apt.created_at.toISOString(),
      updated_at: apt.updated_at.toISOString(),
      client: apt.client ? {
        // @ts-ignore
        ...apt.client,
        created_at: apt.client.created_at.toISOString(),
        updated_at: apt.client.updated_at.toISOString()
      } : undefined
    })) as Appointment[] };
  } catch (error) {
    return {
      data: [],
      error: 'Randevular yüklenirken hata oluştu'
    };
  }
};
