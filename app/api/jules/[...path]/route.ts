import { NextRequest, NextResponse } from 'next/server';

const JULES_API_BASE = 'https://jules.googleapis.com/v1alpha';

async function handleProxy(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const apiKey = process.env.JULES_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'JULES_API_KEY is not configured on the server' }, { status: 500 });
  }

  const pathString = params.path.join('/');

  // Construct the destination URL
  // We need to keep query parameters if any exist
  const searchParams = request.nextUrl.searchParams;
  const queryString = searchParams.toString();
  const url = `${JULES_API_BASE}/${pathString}${queryString ? `?${queryString}` : ''}`;

  console.log(`Proxying ${request.method} request to ${url}`);

  try {
    const headers = new Headers();
    // Copy incoming headers that are safe to forward
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      // Avoid forwarding host, connection, etc.
      if (lowerKey !== 'host' && lowerKey !== 'connection' && lowerKey !== 'content-length') {
        headers.set(key, value);
      }
    });

    // Inject our API key securely
    headers.set('x-goog-api-key', apiKey);

    const init: RequestInit = {
      method: request.method,
      headers,
    };

    // If it's a POST/PUT/PATCH, forward the body
    if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
      const contentType = request.headers.get('content-type') || '';
      if (contentType.includes('application/json') || contentType.includes('text/plain')) {
         const bodyText = await request.text();
         if (bodyText) {
             init.body = bodyText;
         }
      }
    }

    const response = await fetch(url, init);

    // Read the response body
    const responseBody = await response.text();

    // Reconstruct the response with original status and headers (if needed)
    const newHeaders = new Headers();
    response.headers.forEach((value, key) => {
      newHeaders.set(key, value);
    });

    return new NextResponse(responseBody, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error: any) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const DELETE = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
