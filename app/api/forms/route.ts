import { NextRequest, NextResponse } from 'next/server';
import {
  getForms,
  getFormById,
  getFormBySlug,
  createForm,
  updateForm,
  deleteForm,
  submitFormResponse
} from '@/services/forms';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const slug = searchParams.get('slug');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (id) {
      const result = await getFormById(id);
      return NextResponse.json(result);
    }

    if (slug) {
      const result = await getFormBySlug(slug);
      return NextResponse.json(result);
    }

    const result = await getForms(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a form submission
    if (body.formId && body.clientId && body.responses) {
      const result = await submitFormResponse(body.formId, body.clientId, body.responses);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ data: result.data, message: result.message }, { status: 201 });
    }

    // Otherwise, create a new form
    const result = await createForm(body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ data: result.data, message: result.message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = await updateForm(id, body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Form ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteForm(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
