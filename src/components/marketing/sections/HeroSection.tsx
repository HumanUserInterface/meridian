'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import BlurText from '@/components/reactbits/BlurText'
import GradientText from '@/components/reactbits/GradientText'
import Magnet from '@/components/reactbits/Magnet'
import FadeInOnScroll from '../animations/FadeInOnScroll'

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

          {/* Right: Product preview */}
          <FadeInOnScroll delay={0.2} direction="left">
            <div className="relative aspect-[4/3] rounded-2xl border bg-card/80 backdrop-blur-sm shadow-2xl overflow-hidden">
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-cloud/40 via-transparent to-brand-seafoam/5 dark:from-brand-deep-ocean/20 dark:via-transparent dark:to-brand-seafoam/5" />

              {/* Mock cocoon graph */}
              <div className="absolute inset-6 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <line x1="50%" y1="45%" x2="22%" y2="15%" className="stroke-brand-steel-blue/30" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="50%" y1="45%" x2="78%" y2="15%" className="stroke-brand-steel-blue/30" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="50%" y1="45%" x2="15%" y2="75%" className="stroke-brand-seafoam/30" strokeWidth="1.5" />
                  <line x1="50%" y1="45%" x2="85%" y2="75%" className="stroke-brand-seafoam/30" strokeWidth="1.5" />
                  <line x1="50%" y1="45%" x2="50%" y2="85%" className="stroke-brand-sky/30" strokeWidth="1.5" />
                  <line x1="22%" y1="15%" x2="15%" y2="75%" className="stroke-muted-foreground/10" strokeWidth="1" />
                  <line x1="78%" y1="15%" x2="85%" y2="75%" className="stroke-muted-foreground/10" strokeWidth="1" />
                </svg>

                {/* Pillar */}
                <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-36 h-14 bg-blue-500/15 border-2 border-blue-500/60 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/5">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Pillar Page</span>
                </div>

                {/* Clusters */}
                <div className="absolute top-[8%] left-[14%] w-28 h-11 bg-emerald-500/15 border border-emerald-500/50 rounded-lg flex items-center justify-center">
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Cluster A</span>
                </div>
                <div className="absolute top-[8%] right-[14%] w-28 h-11 bg-emerald-500/15 border border-emerald-500/50 rounded-lg flex items-center justify-center">
                  <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Cluster B</span>
                </div>

                {/* Supporting */}
                <div className="absolute bottom-[18%] left-[8%] w-24 h-10 bg-muted border border-border rounded-lg flex items-center justify-center">
                  <span className="text-[11px] text-muted-foreground">Support</span>
                </div>
                <div className="absolute bottom-[18%] right-[8%] w-24 h-10 bg-muted border border-border rounded-lg flex items-center justify-center">
                  <span className="text-[11px] text-muted-foreground">Support</span>
                </div>

                {/* Blog */}
                <div className="absolute bottom-[4%] left-1/2 -translate-x-1/2 w-24 h-10 bg-rose-500/15 border border-rose-400/50 rounded-lg flex items-center justify-center">
                  <span className="text-[11px] font-medium text-rose-500 dark:text-rose-400">Blog Post</span>
                </div>
              </div>

              {/* Corner badges */}
              <div className="absolute top-3 left-3 px-2 py-1 bg-brand-seafoam/10 border border-brand-seafoam/30 rounded-md">
                <span className="text-[10px] font-semibold text-brand-seafoam">Health: 94/100</span>
              </div>
              <div className="absolute top-3 right-3 px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded-md">
                <span className="text-[10px] font-semibold text-blue-500">6 Pages</span>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  )
}
