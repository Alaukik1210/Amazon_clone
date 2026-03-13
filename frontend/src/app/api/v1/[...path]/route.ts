import { NextRequest } from "next/server";

const DEFAULT_BACKEND_ORIGIN = "https://amazon-clone-1-fcwc.onrender.com";
const isProduction = process.env.NODE_ENV === "production";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "content-length",
]);

const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "content-type",
  "authorization",
  "cookie",
  "user-agent",
] as const;

function getBackendOrigin(): string {
  const backendUrl = process.env.BACKEND_URL?.trim();
  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  const originCandidate =
    backendUrl ||
    (publicApiUrl?.startsWith("http") ? publicApiUrl : "") ||
    DEFAULT_BACKEND_ORIGIN;

  return originCandidate.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
}

function buildUpstreamRequestHeaders(headers: Headers): Headers {
  const out = new Headers();

  for (const header of FORWARDED_REQUEST_HEADERS) {
    const value = headers.get(header);
    if (value) out.set(header, value);
  }

  return out;
}

function buildClientResponseHeaders(headers: Headers): Headers {
  const out = new Headers();

  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(lower)) return;
    out.append(key, value);
  });

  return out;
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, context: RouteContext): Promise<Response> {
  try {
    const resolved = await context.params;
    const path = resolved.path ?? [];
    const incomingUrl = new URL(request.url);

    const target = new URL(`${getBackendOrigin()}/api/v1/${path.join("/")}`);
    target.search = incomingUrl.search;

    const init: RequestInit = {
      method: request.method,
      headers: buildUpstreamRequestHeaders(request.headers),
      redirect: "manual",
      cache: "no-store",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.arrayBuffer();
    }

    const upstream = await fetch(target, init);

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: buildClientResponseHeaders(upstream.headers),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown proxy error";
    return Response.json(
      {
        success: false,
        message: "API proxy failed",
        ...(isProduction ? {} : { detail }),
      },
      { status: 502 }
    );
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}

export async function HEAD(request: NextRequest, context: RouteContext) {
  return proxy(request, context);
}
