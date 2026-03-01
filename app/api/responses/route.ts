import { NextRequest, NextResponse } from 'next/server';
import {
  submitFormResponse,
  getFormResponses,
  getFormResponsesByClientId
} from '@/services/forms';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const formId = searchParams.get('formId');
    const clientId = searchParams.get('clientId');

    if (clientId) {
      const result = await getFormResponsesByClientId(clientId);
      return NextResponse.json(result);
    }

    const result = await getFormResponses(formId || undefined, clientId || undefined);
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
    const { formId, clientId, responses } = body;

    if (!formId || !clientId || !responses) {
      return NextResponse.json(
        { error: 'formId, clientId, and responses are required' },
        { status: 400 }
      );
    }

    const result = await submitFormResponse(formId, clientId, responses);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
