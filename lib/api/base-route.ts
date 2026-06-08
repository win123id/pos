import { NextRequest, NextResponse } from "next/server";

export interface ApiResult<T = any> {
  data?: T;
  error?: string;
  statusCode: number;
}

export async function createApiHandler({
  GET,
  POST,
  PUT,
  DELETE,
}: {
  GET?: (request: NextRequest) => Promise<ApiResult>;
  POST?: (request: NextRequest, body: unknown) => Promise<ApiResult>;
  PUT?: (request: NextRequest, body: unknown) => Promise<ApiResult>;
  DELETE?: (request: NextRequest) => Promise<ApiResult>;
}) {
  return async function handler(request: NextRequest) {
    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      let response: ApiResult;

      switch (method) {
        case "GET":
          if (!GET) return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
          response = await GET(request);
          break;

        case "POST":
          if (!POST) return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
          const postBody = await request.json();
          response = await POST(request, postBody);
          break;

        case "PUT":
          if (!PUT) return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
          const putBody = await request.json();
          response = await PUT(request, putBody);
          break;

        case "DELETE":
          if (!DELETE) return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
          response = await DELETE(request);
          break;

        default:
          return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
      }

      const elapsed = Date.now() - startTime;
      console.log(`[API] ${method} ${path} - ${response.statusCode} - ${elapsed}ms`);

      if (response.error) {
        return NextResponse.json({ error: response.error }, { status: response.statusCode });
      }
      return NextResponse.json(response.data, { status: response.statusCode });

    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      console.error(`[API] ${method} ${path} - 500 - ${elapsed}ms - Error: ${error.message}`);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: 500 }
      );
    }
  };
}
