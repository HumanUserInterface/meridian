'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
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
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-cloud/50 to-transparent dark:from-brand-deep-ocean/20 dark:to-transparent" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div>
            <FadeInOnScroll>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
                {dict.hero.title}
              </h1>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.1}>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
                {dict.hero.subtitle}
              </p>
            </FadeInOnScroll>
            <FadeInOnScroll delay={0.2}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild>
                  <Link href="/auth/signup">
                    {dict.hero.cta_primary}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href={`/${locale}#how-it-works`}>
                    {dict.hero.cta_secondary}
                  </Link>
                </Button>
              </div>
            </FadeInOnScroll>
          </div>

          {/* Right: Product preview placeholder */}
          <FadeInOnScroll delay={0.3} direction="left">
            <div className="relative aspect-[4/3] rounded-xl border bg-card shadow-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-cloud via-brand-sky/20 to-brand-seafoam/10 dark:from-brand-midnight dark:via-brand-deep-ocean/30 dark:to-brand-seafoam/10" />
              {/* Fake node graph */}
              <div className="absolute inset-8 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Pillar */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-16 bg-blue-500/20 border-2 border-blue-500 rounded-lg flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Pillar Page
                  </div>
                  {/* Cluster nodes */}
                  <div className="absolute top-4 left-4 w-24 h-12 bg-emerald-500/20 border border-emerald-500 rounded-lg flex items-center justify-center text-xs text-emerald-700 dark:text-emerald-300">
                    Cluster
                  </div>
                  <div className="absolute top-4 right-4 w-24 h-12 bg-emerald-500/20 border border-emerald-500 rounded-lg flex items-center justify-center text-xs text-emerald-700 dark:text-emerald-300">
                    Cluster
                  </div>
                  <div className="absolute bottom-4 left-8 w-24 h-12 bg-gray-500/20 border border-gray-400 rounded-lg flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
                    Support
                  </div>
                  <div className="absolute bottom-4 right-8 w-24 h-12 bg-gray-500/20 border border-gray-400 rounded-lg flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
                    Support
                  </div>
                  <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-24 h-12 bg-rose-500/20 border border-rose-400 rounded-lg flex items-center justify-center text-xs text-rose-600 dark:text-rose-300">
                    Blog
                  </div>
                  {/* Connection lines via SVG */}
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <line x1="50%" y1="50%" x2="20%" y2="15%" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
                    <line x1="50%" y1="50%" x2="80%" y2="15%" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
                    <line x1="50%" y1="50%" x2="25%" y2="85%" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
                    <line x1="50%" y1="50%" x2="75%" y2="85%" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
                    <line x1="50%" y1="50%" x2="50%" y2="78%" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
            </div>
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  )
}
