import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://backend.dev.violet.uplus.co.kr';

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get('url');
  if (!urlParam || (!urlParam.startsWith('/nodes') && !urlParam.startsWith('/jobs'))) {
    return new NextResponse('Invalid or missing url param', { status: 400 });
  }
  const backendUrl = `${BASE_URL}${urlParam}`;
  try {
    const backendRes = await fetch(backendUrl, {
      headers: {
        // Forward user-agent and cookies if needed
        'user-agent': req.headers.get('user-agent') || '',
        'cookie': req.headers.get('cookie') || '',
      },
      // Next.js Edge API Routes run in the Node.js runtime, so env proxy is used
    });
    const contentType = backendRes.headers.get('content-type') || '';
    const body = await backendRes.text();
    return new NextResponse(body, {
      status: backendRes.status,
      headers: { 'content-type': contentType },
    });
  } catch (e) {
    return new NextResponse('Proxy error', { status: 502 });
  }
} 