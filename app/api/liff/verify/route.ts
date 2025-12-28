import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { id_token } = await req.json();
    if (!id_token) {
      return NextResponse.json({ ok: false, error: 'Missing id_token' }, { status: 400 });
    }

    const clientId = process.env.LINE_CHANNEL_ID;
    if (!clientId) {
      return NextResponse.json({ ok: false, error: 'Missing LINE_CHANNEL_ID' }, { status: 500 });
    }

    const form = new URLSearchParams();
    form.set('id_token', id_token);
    form.set('client_id', clientId);

    const res = await fetch('https://api.line.me/oauth2/v2.1/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ ok: false, error: text }, { status: 401 });
    }

    const data = await res.json();
    // data.sub = line user id, data.name, data.picture if scope requested
    return NextResponse.json({ ok: true, userId: data.sub, name: data.name, picture: data.picture });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'Verify failed' }, { status: 500 });
  }
}
