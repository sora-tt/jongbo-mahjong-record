import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Session cookies are issued from the API origin, so they are not reliably
// readable from the frontend origin middleware in production. Client-side auth
// guards handle redirects after the app loads.
export const middleware = (_request: NextRequest) => NextResponse.next();

export const config = {
  matcher: ["/", "/login", "/signup"],
};
