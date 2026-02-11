import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { locales, type Locale } from '@/i18n/config'
import StubPage from '@/components/marketing/sections/StubPage'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://meridian.app'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: `${dict.stubs.docs.title} - Meridian`,
    description: dict.stubs.docs.subtitle,
    alternates: {
      canonical: `${BASE_URL}/${locale}/docs`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/docs`])),
    },
  }
}

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <StubPage
      title={dict.stubs.docs.title}
      subtitle={dict.stubs.docs.subtitle}
      comingSoon={dict.stubs.docs.coming_soon}
      icon="book-open"
    />
  )
}
