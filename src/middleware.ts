import { type NextRequest, NextResponse } from 'next/server'
import { locales, defaultLocale } from '@/i18n/config'

const localeSet = new Set<string>(locales)

// Paths that should NOT get locale prefixing
const skipPrefixes = ['/api', '/auth', '/dashboard', '/project', '/settings', '/workspace', '/_next', '/favicon.ico']

function getLocale(request: NextRequest): string {
  // 1. Check cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value
  if (cookieLocale && localeSet.has(cookieLocale)) return cookieLocale

  // 2. Check Accept-Language header
  const acceptLang = request.headers.get('accept-language')
  if (acceptLang) {
    const preferred = acceptLang.split(',').map((l) => l.split(';')[0].trim().substring(0, 2))
    for (const lang of preferred) {
      if (localeSet.has(lang)) return lang
    }
  }

  return defaultLocale
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets and non-marketing routes
  if (
    skipPrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    pathname.match(/\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/)
  ) {
    return NextResponse.next({ request })
  }

  // Check if pathname already has a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )

  if (pathnameHasLocale) {
    return NextResponse.next({ request })
  }

  // Root path → redirect to locale homepage
  if (pathname === '/') {
    const locale = getLocale(request)
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  // Bare marketing paths (e.g. /pricing) → redirect to /{locale}/pricing
  const marketingPaths = ['/pricing', '/about', '/blog', '/changelog', '/docs']
  if (marketingPaths.includes(pathname)) {
    const locale = getLocale(request)
    return NextResponse.redirect(new URL(`/${locale}${pathname}`, request.url))
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
