'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { locales, type Locale } from '@/i18n/config'
import { cn } from '@/lib/utils'

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()

  function switchedPath(target: Locale) {
    // Replace current locale prefix with target
    const segments = pathname.split('/')
    segments[1] = target
    return segments.join('/')
  }

  function setCookie(target: Locale) {
    document.cookie = `NEXT_LOCALE=${target};path=/;max-age=${60 * 60 * 24 * 365}`
  }

  return (
    <div className="flex items-center rounded-full border bg-background/50 backdrop-blur-sm p-0.5 text-sm">
      {locales.map((l) => (
        <Link
          key={l}
          href={switchedPath(l)}
          onClick={() => setCookie(l)}
          className={cn(
            'px-2.5 py-1 rounded-full font-medium transition-colors',
            l === locale
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  )
}
