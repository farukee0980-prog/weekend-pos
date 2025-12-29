import { NextRequest, NextResponse } from 'next/server';
import { addStaff } from '@/lib/db/staff';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lineUserId, displayName, pictureUrl, addedBy, role } = body;

    if (!lineUserId || !displayName || !addedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await addStaff(lineUserId, displayName, pictureUrl, addedBy, role);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error: any) {
    console.error('Add staff API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
