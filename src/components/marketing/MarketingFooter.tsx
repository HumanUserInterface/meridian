import Link from 'next/link'
import type { Locale } from '@/i18n/config'

interface MarketingFooterProps {
  locale: Locale
  dict: {
    footer: {
      product: string
      resources: string
      company: string
      legal: string
      copyright: string
      links: {
        features: string
        pricing: string
        changelog: string
        docs: string
        blog: string
        about: string
        contact: string
        privacy: string
        terms: string
      }
    }
  }
}

export default function MarketingFooter({ locale, dict }: MarketingFooterProps) {
  const { footer } = dict

  const columns = [
    {
      title: footer.product,
      links: [
        { label: footer.links.features, href: `/${locale}#features` },
        { label: footer.links.pricing, href: `/${locale}/pricing` },
        { label: footer.links.changelog, href: `/${locale}/changelog` },
      ],
    },
    {
      title: footer.resources,
      links: [
        { label: footer.links.docs, href: `/${locale}/docs` },
        { label: footer.links.blog, href: `/${locale}/blog` },
      ],
    },
    {
      title: footer.company,
      links: [
        { label: footer.links.about, href: `/${locale}/about` },
      ],
    },
    {
      title: footer.legal,
      links: [
        { label: footer.links.privacy, href: `/${locale}` },
        { label: footer.links.terms, href: `/${locale}` },
      ],
    },
  ]

  return (
    <footer className="border-t bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {col.title}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {footer.copyright}
        </div>
      </div>
    </footer>
  )
}
