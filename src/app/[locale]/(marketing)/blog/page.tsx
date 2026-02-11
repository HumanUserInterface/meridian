import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { locales, type Locale } from '@/i18n/config'
import { FileText } from 'lucide-react'

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
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          {dict.stubs.blog.title}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          {dict.stubs.blog.subtitle}
        </p>
        <p className="text-muted-foreground">
          {dict.stubs.blog.coming_soon}
        </p>
      </div>
    </section>
  )
}
