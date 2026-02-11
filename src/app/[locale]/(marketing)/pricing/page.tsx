import type { Metadata } from 'next'
import { getDictionary } from '@/i18n/dictionaries'
import { locales, type Locale } from '@/i18n/config'
import PricingSection from '@/components/marketing/sections/PricingSection'
import FAQSection from '@/components/marketing/sections/FAQSection'
import CTASection from '@/components/marketing/sections/CTASection'
import JsonLd from '@/components/marketing/JsonLd'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://meridian.app'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return {
    title: `${dict.pricing.title} - Meridian`,
    description: dict.pricing.subtitle,
    alternates: {
      canonical: `${BASE_URL}/${locale}/pricing`,
      languages: Object.fromEntries(locales.map((l) => [l, `${BASE_URL}/${l}/pricing`])),
    },
    openGraph: {
      title: `${dict.pricing.title} - Meridian`,
      description: dict.pricing.subtitle,
      url: `${BASE_URL}/${locale}/pricing`,
      siteName: 'Meridian',
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
  }
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Meridian Pro',
    description: dict.pricing.plan.description,
    offers: {
      '@type': 'Offer',
      price: '35',
      priceCurrency: 'USD',
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/InStock',
    },
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
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={faqJsonLd} />
      <PricingSection dict={dict} standalone />
      <FAQSection dict={dict} />
      <CTASection dict={dict} />
    </>
  )
}
