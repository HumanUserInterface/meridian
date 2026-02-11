import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { locales, type Locale } from '@/i18n/config'
import HeroSection from '@/components/marketing/sections/HeroSection'
import FeaturesSection from '@/components/marketing/sections/FeaturesSection'
import HowItWorksSection from '@/components/marketing/sections/HowItWorksSection'
import PricingSection from '@/components/marketing/sections/PricingSection'
import FAQSection from '@/components/marketing/sections/FAQSection'
import CTASection from '@/components/marketing/sections/CTASection'
import JsonLd from '@/components/marketing/JsonLd'
import HomePageClient from '@/components/marketing/HomePageClient'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://meridian.app'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: 'Meridian - ' + dict.hero.title,
    description: dict.hero.subtitle,
    keywords: ['SEO', 'semantic cocoon', 'content planning', 'topical authority', 'internal linking', 'cocon semantique'],
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}`])),
    },
    openGraph: {
      title: 'Meridian - ' + dict.hero.title,
      description: dict.hero.subtitle,
      url: `${BASE_URL}/${locale}`,
      siteName: 'Meridian',
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Meridian - ' + dict.hero.title,
      description: dict.hero.subtitle,
    },
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Meridian',
    applicationCategory: 'BusinessApplication',
    description: dict.hero.subtitle,
    url: `${BASE_URL}/${locale}`,
    offers: {
      '@type': 'Offer',
      price: '35',
      priceCurrency: 'USD',
    },
    operatingSystem: 'Web',
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: dict.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <HomePageClient>
      <JsonLd data={jsonLd} />
      <JsonLd data={faqJsonLd} />
      <HeroSection dict={dict} locale={locale} />
      <FeaturesSection dict={dict} />
      <HowItWorksSection dict={dict} />
      <PricingSection dict={dict} />
      <FAQSection dict={dict} />
      <CTASection dict={dict} />
    </HomePageClient>
  )
}
