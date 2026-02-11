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
    <StubPage
      title={dict.stubs.changelog.title}
      subtitle={dict.stubs.changelog.subtitle}
      comingSoon={dict.stubs.changelog.coming_soon}
      icon="clock"
    />
  )
}
