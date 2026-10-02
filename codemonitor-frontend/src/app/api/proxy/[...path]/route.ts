import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://localhost:8085";

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_API_USERNAME || "admin";
const DEFAULT_PASSWORD = process.env.NEXT_PUBLIC_API_PASSWORD || "admin123";

async function proxyRequest(request: NextRequest, params: { path?: string[] }) {
  const path = params.path ? params.path.join("/") : "";
  const search = request.nextUrl.search;
  const targetUrl = `${BACKEND_BASE}/api/${path}${search}`;

  // Forward or set basic auth
  const headers = new Headers();
  request.headers.forEach((val, key) => {
    // Skip host, connection, content-length
    if (!["host", "connection", "content-length"].includes(key.toLowerCase())) {
      headers.set(key, val);
    }
  });

  if (!headers.has("authorization")) {
    const creds = Buffer.from(`${DEFAULT_USERNAME}:${DEFAULT_PASSWORD}`).toString("base64");
    headers.set("authorization", `Basic ${creds}`);
  }

  let body: BodyInit | undefined = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.text();
    } catch {
      // no body
    }
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    });

    const data = await backendRes.text();
    const responseHeaders = new Headers();
    backendRes.headers.forEach((val, key) => {
      if (!["content-encoding", "transfer-encoding"].includes(key.toLowerCase())) {
        responseHeaders.set(key, val);
      }
    });

    return new NextResponse(data, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      {
        status: 503,
        error: "Backend Unavailable",
        message: `Failed to connect to backend server at ${BACKEND_BASE}: ${error?.message || "Connection refused"}`,
      },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const params = await context.params;
  return proxyRequest(request, params);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
