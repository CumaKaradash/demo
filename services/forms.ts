import { Form, FormResponse, FormField, ApiResponse, PaginatedResponse } from '@/types';
import { PrismaClient } from '@/lib/generated/prisma/client';

// @ts-ignore
const prisma = new PrismaClient();

export const getForms = async (page = 1, limit = 10): Promise<PaginatedResponse<Form>> => {
  const skip = (page - 1) * limit;
  const [forms, total] = await Promise.all([
    prisma.form.findMany({
      skip,
      take: limit,
      orderBy: {
        created_at: 'desc'
      }
    }),
    prisma.form.count()
  ]);

  return {
    data: forms.map(f => ({
      // @ts-ignore
      ...f,
      fields: f.fields as unknown as FormField[],
      created_at: f.created_at.toISOString(),
      updated_at: f.updated_at.toISOString()
    })) as Form[],
    total,
    page,
    limit,
    hasMore: skip + limit < total
  };
};

export const getFormById = async (id: string): Promise<ApiResponse<Form>> => {
  try {
    const form = await prisma.form.findUnique({
      where: { id }
    });

    if (!form) {
      return {
        data: null as any,
        error: 'Form bulunamadı'
      };
    }

    return { data: {
      ...form,
      fields: form.fields as unknown as FormField[],
      created_at: form.created_at.toISOString(),
      updated_at: form.updated_at.toISOString()
    } as Form };
  } catch (error) {
    return {
      data: null as any,
      error: 'Form yüklenirken hata oluştu'
    };
  }
};
export const getFormBySlug = async (slug: string): Promise<ApiResponse<Form>> => {
  try {
    const form = await prisma.form.findUnique({
      where: { slug, is_active: true }
    });

    if (!form) {
      return {
        data: null as any,
        error: 'Form bulunamadı'
      };
    }

    return { data: {
      ...form,
      fields: form.fields as unknown as FormField[],
      created_at: form.created_at.toISOString(),
      updated_at: form.updated_at.toISOString()
    } as Form };
  } catch (error) {
    return {
      data: null as any,
      error: 'Form yüklenirken hata oluştu'
    };
  }
};

export const createForm = async (formData: Omit<Form, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Form>> => {
  try {
    const form = await prisma.form.create({
      data: {
        ...formData,
        fields: formData.fields as any
      }
    });

    return { data: {
      ...form,
      fields: form.fields as unknown as FormField[],
      created_at: form.created_at.toISOString(),
      updated_at: form.updated_at.toISOString()
    } as Form, message: 'Form başarıyla oluşturuldu' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Form oluşturulurken hata oluştu'
    };
  }
};

export const updateForm = async (id: string, updates: Partial<Omit<Form, 'id' | 'created_at'>>): Promise<ApiResponse<Form>> => {
  try {
    const form = await prisma.form.update({
      where: { id },
      data: updates.fields ? {
        ...updates,
        fields: updates.fields as any
      } : updates as any
    });

    return { data: {
      ...form,
      fields: form.fields as unknown as FormField[],
      created_at: form.created_at.toISOString(),
      updated_at: form.updated_at.toISOString()
    } as Form, message: 'Form başarıyla güncellendi' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Form güncellenirken hata oluştu'
    };
  }
};

export const deleteForm = async (id: string): Promise<ApiResponse<void>> => {
  try {
    await prisma.form.delete({
      where: { id }
    });

    return { data: undefined, message: 'Form başarıyla silindi' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Form silinirken hata oluştu'
    };
  }
};

export const submitFormResponse = async (formId: string, clientId: string, responses: Record<string, any>): Promise<ApiResponse<FormResponse>> => {
  try {
    const response = await prisma.formResponse.create({
      data: {
        form_id: formId,
        client_id: clientId,
        responses: responses as any
      },
      include: {
        form: true,
        client: true
      }
    });

    return { data: {
      ...response,
      responses: response.responses as Record<string, string | string[]>,
      form: {
        ...response.form,
        fields: response.form.fields as unknown as FormField[],
        created_at: response.form.created_at.toISOString(),
        updated_at: response.form.updated_at.toISOString()
      },
      client: response.client ? {
        ...response.client,
        created_at: response.client.created_at.toISOString(),
        updated_at: response.client.updated_at.toISOString()
      } : undefined,
      created_at: response.created_at.toISOString(),
      updated_at: response.updated_at.toISOString()
    } as FormResponse, message: 'Form yanıtı başarıyla kaydedildi' };
  } catch (error) {
    return {
      data: null as any,
      error: 'Form yanıtı kaydedilirken hata oluştu'
    };
  }
};

export const getFormResponses = async (formId?: string, clientId?: string): Promise<ApiResponse<FormResponse[]>> => {
  try {
    const responses = await prisma.formResponse.findMany({
      where: {
        ...(formId && { form_id: formId }),
        ...(clientId && { client_id: clientId })
      },
      include: {
        form: true,
        client: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return { data: responses.map((r: any) => ({
      ...r,
      responses: r.responses as Record<string, string | string[]>
    })) as FormResponse[] };
  } catch (error) {
    return {
      data: [],
      error: 'Form yanıtları yüklenirken hata oluştu'
    };
  }
};

export const getFormResponsesByClientId = async (clientId: string): Promise<ApiResponse<FormResponse[]>> => {
  return getFormResponses(undefined, clientId);
};
