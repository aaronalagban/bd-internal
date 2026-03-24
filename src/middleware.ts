import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // 1. Get the Authorization header from the browser
  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const decodedValue = atob(authValue);
    
    const colonIndex = decodedValue.indexOf(':');
    const user = decodedValue.substring(0, colonIndex);
    const pwd = decodedValue.substring(colonIndex + 1);

    // 2. Safely grab the password from your .env.local vault
    const VALID_USERNAME = process.env.ADMIN_USERNAME;
    const VALID_PASSWORD = process.env.ADMIN_PASSWORD;

    // 3. Check if they match
    if (user === VALID_USERNAME && pwd === VALID_PASSWORD) {
      return NextResponse.next(); // Success! Show the dashboard.
    }
  }

  // 4. If wrong or no password, pop up the login screen!
  return new NextResponse('Authentication Required. Invalid Username or Password.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Marine Dashboard"',
    },
  });
}

// 5. This tells Next.js to lock the whole website EXCEPT for background files
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};