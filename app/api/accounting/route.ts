import { NextRequest, NextResponse } from 'next/server';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoicesByClientId,
  getUnpaidInvoices,
  getOverdueInvoices
} from '@/services/invoices';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clientId = searchParams.get('clientId');
    const unpaid = searchParams.get('unpaid');
    const overdue = searchParams.get('overdue');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (id) {
      const result = await getInvoiceById(id);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      return NextResponse.json({ data: result.data });
    }

    if (clientId) {
      const result = await getInvoicesByClientId(clientId);
      return NextResponse.json(result);
    }

    if (unpaid === 'true') {
      const result = await getUnpaidInvoices();
      return NextResponse.json(result);
    }

    if (overdue === 'true') {
      const result = await getOverdueInvoices();
      return NextResponse.json(result);
    }

    const result = await getInvoices(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Invoices GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createInvoice(body.invoiceData, body.items);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ data: result.data, message: result.message }, { status: 201 });
  } catch (error) {
    console.error('Invoices POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    const body = await request.json();
    const result = await updateInvoice(id, body);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ data: result.data, message: result.message });
  } catch (error) {
    console.error('Invoices PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    const result = await deleteInvoice(id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('Invoices DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
