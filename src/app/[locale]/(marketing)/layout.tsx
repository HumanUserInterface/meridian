import { locales, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import MarketingNavbar from '@/components/marketing/MarketingNavbar'
import MarketingFooter from '@/components/marketing/MarketingFooter'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const dict = await getDictionary(locale as Locale)

  return (
    <>
      <MarketingNavbar locale={locale as Locale} dict={dict} />
      <main className="min-h-screen pt-16">{children}</main>
      <MarketingFooter locale={locale as Locale} dict={dict} />
    </>
  )
}
