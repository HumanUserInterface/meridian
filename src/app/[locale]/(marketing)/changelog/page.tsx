import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { locales, type Locale } from '@/i18n/config'
import { Clock } from 'lucide-react'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://meridian.app'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: `${dict.stubs.changelog.title} - Meridian`,
    description: dict.stubs.changelog.subtitle,
    alternates: {
      canonical: `${BASE_URL}/${locale}/changelog`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/changelog`])),
    },
  }
}

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          {dict.stubs.changelog.title}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          {dict.stubs.changelog.subtitle}
        </p>
        <p className="text-muted-foreground">
          {dict.stubs.changelog.coming_soon}
        </p>
      </div>
    </section>
  )
}
