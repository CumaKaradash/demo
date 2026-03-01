import { Client, ApiResponse, PaginatedResponse } from '@/types';
import { PrismaClient } from '@/lib/generated/prisma/client';

// @ts-ignore
const prisma = new PrismaClient();

export const getClients = async (page = 1, limit = 10): Promise<PaginatedResponse<Client>> => {
  const skip = (page - 1) * limit;
  const [clients, total] = await Promise.all([
    prisma.client.findMany({
      skip,
      take: limit,
      orderBy: {
        created_at: 'desc'
      }
    }),
    prisma.client.count()
  ]);

  return {
    data: clients.map(client => ({
      // @ts-ignore
      ...client,
      created_at: client.created_at.toISOString(),
      updated_at: client.updated_at.toISOString()
    })) as Client[],
    total,
    page,
    limit,
    hasMore: skip + limit < total
  };
};

export const getClientById = async (id: string): Promise<ApiResponse<Client>> => {
  try {
    const client = await prisma.client.findUnique({
      where: { id }
    });

    if (!client) {
      return {
        data: null as any,
        error: 'Müşteri bulunamadı'
      };
    }

    return { data: {
      ...client,
      created_at: client.created_at.toISOString(),
      updated_at: client.updated_at.toISOString()
    } as Client };
  } catch (error) {
    return {
      data: null as any,
      error: 'Müşteri yüklenirken hata oluştu'
    };
  }
};

export const createClient = async (clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Client>> => {
  try {
    const client = await prisma.client.create({
      data: clientData
    });

    return { data: {
      ...client,
      created_at: client.created_at.toISOString(),
      updated_at: client.updated_at.toISOString()
    } as Client, message: 'Müşteri başarıyla eklendi' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Müşteri oluşturulurken hata oluştu'
    };
  }
};

export const updateClient = async (id: string, updates: Partial<Omit<Client, 'id' | 'created_at'>>): Promise<ApiResponse<Client>> => {
  try {
    const client = await prisma.client.update({
      where: { id },
      data: updates
    });

    return { data: {
      ...client,
      created_at: client.created_at.toISOString(),
      updated_at: client.updated_at.toISOString()
    } as Client, message: 'Müşteri başarıyla güncellendi' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Müşteri güncellenirken hata oluştu'
    };
  }
};

export const deleteClient = async (id: string): Promise<ApiResponse<void>> => {
  try {
    await prisma.client.delete({
      where: { id }
    });

    return { data: undefined, message: 'Müşteri başarıyla silindi' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Müşteri silinirken hata oluştu'
    };
  }
};

export const searchClients = async (query: string, status?: Client['status']): Promise<ApiResponse<Client[]>> => {
  try {
    const clients = await prisma.client.findMany({
      where: {
        AND: [
          status ? { status } : {},
          query ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query } },
              { company: { contains: query, mode: 'insensitive' } }
            ]
          } : {}
        ]
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return { data: clients.map(client => ({
      // @ts-ignore
      ...client,
      created_at: client.created_at.toISOString(),
      updated_at: client.updated_at.toISOString()
    })) as Client[] };
  } catch (error) {
    return {
      data: [],
      error: 'Müşteriler aranırken hata oluştu'
    };
  }
};
