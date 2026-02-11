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
    title: `${dict.stubs.blog.title} - Meridian`,
    description: dict.stubs.blog.subtitle,
    alternates: {
      canonical: `${BASE_URL}/${locale}/blog`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/blog`])),
    },
  }
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <StubPage
      title={dict.stubs.blog.title}
      subtitle={dict.stubs.blog.subtitle}
      comingSoon={dict.stubs.blog.coming_soon}
      icon="file-text"
    />
  )
}
