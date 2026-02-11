'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import BlurText from '@/components/reactbits/BlurText'
import GradientText from '@/components/reactbits/GradientText'
import Magnet from '@/components/reactbits/Magnet'
import FadeInOnScroll from '../animations/FadeInOnScroll'
import CocoonPreview from '../CocoonPreview'

interface HeroSectionProps {
  dict: {
    hero: {
      title: string
      subtitle: string
      cta_primary: string
      cta_secondary: string
    }
  }
  locale: string
}

export default function HeroSection({ dict, locale }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-cloud/60 via-brand-sky/10 to-transparent dark:from-brand-deep-ocean/30 dark:via-brand-midnight dark:to-transparent" />
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-seafoam/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-sky/10 blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-28 sm:pt-32 sm:pb-36">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Copy */}
          <div>
            <GradientText
              colors={['#3A9A85', '#5B8DAB', '#8FC1DA', '#3A9A85']}
              animationSpeed={6}
              className="text-sm font-semibold tracking-wider uppercase mb-6"
            >
              Semantic Cocoon Planner
            </GradientText>

            <BlurText
              text={dict.hero.title}
              delay={80}
              animateBy="words"
              direction="top"
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]"
            />

            <FadeInOnScroll delay={0.3}>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
                {dict.hero.subtitle}
              </p>
            </FadeInOnScroll>

            <FadeInOnScroll delay={0.45}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Magnet padding={60} magnetStrength={3}>
                  <Button size="lg" className="text-base px-8" asChild>
                    <Link href="/auth/signup">
                      {dict.hero.cta_primary}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </Magnet>
                <Magnet padding={60} magnetStrength={3}>
                  <Button size="lg" variant="outline" className="text-base px-8" asChild>
                    <Link href={`/${locale}#how-it-works`}>
                      {dict.hero.cta_secondary}
                    </Link>
                  </Button>
                </Magnet>
              </div>
            </FadeInOnScroll>
          </div>

          {/* Right: Real product visualization */}
          <FadeInOnScroll delay={0.2} direction="left">
            <CocoonPreview />
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  )
}
