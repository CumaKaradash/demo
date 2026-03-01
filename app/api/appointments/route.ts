import { NextRequest, NextResponse } from 'next/server';
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
  getAppointmentsByClientId,
  getAppointmentsByDateRange,
  getUpcomingAppointments
} from '@/services/appointments';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clientId = searchParams.get('clientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const upcoming = searchParams.get('upcoming');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (id) {
      const result = await getAppointmentById(id);
      return NextResponse.json(result);
    }

    if (clientId) {
      const result = await getAppointmentsByClientId(clientId);
      return NextResponse.json(result);
    }

    if (startDate && endDate) {
      const result = await getAppointmentsByDateRange(startDate, endDate);
      return NextResponse.json(result);
    }

    if (upcoming === 'true') {
      const result = await getUpcomingAppointments();
      return NextResponse.json(result);
    }

    const result = await getAppointments(page, limit);
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
    const result = await createAppointment(body);
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
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = await updateAppointment(id, body);
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
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const result = await deleteAppointment(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
