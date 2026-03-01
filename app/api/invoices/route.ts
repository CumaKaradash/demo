import { NextRequest, NextResponse } from 'next/server';
import {
  getInvoices,
  getInvoiceById,
  getInvoicesByClientId,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getInvoiceItems,
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
      return NextResponse.json(result);
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceData, items } = body;

    if (!invoiceData || !items) {
      return NextResponse.json(
        { error: 'invoiceData and items are required' },
        { status: 400 }
      );
    }

    const result = await createInvoice(invoiceData, items);
    return NextResponse.json(result, { status: 201 });
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
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = await updateInvoice(id, body);
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
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteInvoice(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
