'use client'

import { use } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import BlurText from '@/components/reactbits/BlurText'
import SpotlightCard from '@/components/reactbits/SpotlightCard'
import Magnet from '@/components/reactbits/Magnet'
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
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-cloud/40 to-transparent dark:from-brand-deep-ocean/20 dark:to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <BlurText
            text={dict.about.hero_title}
            delay={80}
            animateBy="words"
            className="font-display text-4xl sm:text-5xl font-bold text-foreground justify-center"
          />
          <FadeInOnScroll delay={0.2}>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {dict.about.hero_subtitle}
            </p>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Why Meridian */}
      <section className="py-20 bg-muted/30">
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
      <section className="py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <BlurText
            text={dict.about.values_title}
            delay={60}
            animateBy="words"
            className="font-display text-3xl font-bold text-foreground justify-center mb-12"
          />
          <StaggerChildren className="grid sm:grid-cols-3 gap-5">
            {dict.about.values.map((value, i) => (
              <StaggerItem key={i}>
                <SpotlightCard className="h-full transition-all duration-300 hover:-translate-y-1">
                  <div className="relative z-10">
                    <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </SpotlightCard>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 bg-brand-deep-ocean dark:bg-brand-deep-ocean/90 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-brand-seafoam/10 blur-[100px]" />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <BlurText
            text={dict.cta.title}
            delay={60}
            animateBy="words"
            className="font-display text-3xl font-bold text-white justify-center"
          />
          <FadeInOnScroll delay={0.15}>
            <p className="text-lg text-white/60 mt-4 mb-8">{dict.cta.subtitle}</p>
          </FadeInOnScroll>
          <FadeInOnScroll delay={0.25}>
            <Magnet padding={80} magnetStrength={3}>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-brand-deep-ocean hover:bg-white/90 text-base px-8 shadow-xl shadow-black/20"
                asChild
              >
                <Link href="/auth/signup">
                  {dict.cta.button}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </Magnet>
          </FadeInOnScroll>
        </div>
      </section>
    </>
  )
}
