import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Simply pass through all requests
  // Auth is handled client-side using localStorage
  return NextResponse.next({ request })
}
