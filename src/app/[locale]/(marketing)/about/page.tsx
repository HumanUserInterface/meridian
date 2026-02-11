'use client'

import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import FadeInOnScroll from '@/components/marketing/animations/FadeInOnScroll'
import StaggerChildren, { StaggerItem } from '@/components/marketing/animations/StaggerChildren'
import { getDictionary } from '@/i18n/dictionaries'
import type { Locale } from '@/i18n/config'

export default function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = use(params)
  const dict = use(getDictionary(locale as Locale))

  return (
    <>
      {/* Hero */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <FadeInOnScroll>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">
              {dict.about.hero_title}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {dict.about.hero_subtitle}
            </p>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Why Meridian */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeInOnScroll>
            <h2 className="font-display text-3xl font-bold text-foreground mb-6">
              {dict.about.why_title}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {dict.about.why_description}
            </p>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Values */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <FadeInOnScroll>
            <h2 className="font-display text-3xl font-bold text-foreground mb-12 text-center">
              {dict.about.values_title}
            </h2>
          </FadeInOnScroll>
          <StaggerChildren className="grid sm:grid-cols-3 gap-6">
            {dict.about.values.map((value, i) => (
              <StaggerItem key={i}>
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-brand-deep-ocean dark:bg-brand-deep-ocean/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <FadeInOnScroll>
            <h2 className="font-display text-3xl font-bold text-white mb-4">
              {dict.cta.title}
            </h2>
            <p className="text-lg text-white/70 mb-8">{dict.cta.subtitle}</p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-brand-deep-ocean hover:bg-white/90"
              asChild
            >
              <Link href="/auth/signup">
                {dict.cta.button}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </FadeInOnScroll>
        </div>
      </section>
    </>
  )
}
