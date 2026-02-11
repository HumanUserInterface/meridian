'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import BlurText from '@/components/reactbits/BlurText'
import SpotlightCard from '@/components/reactbits/SpotlightCard'
import Magnet from '@/components/reactbits/Magnet'
import FadeInOnScroll from '../animations/FadeInOnScroll'

interface PricingSectionProps {
  dict: {
    pricing: {
      title: string
      subtitle: string
      plan: {
        name: string
        price: string
        period: string
        description: string
        cta: string
        features: string[]
      }
    }
  }
  standalone?: boolean
}

export default function PricingSection({ dict, standalone }: PricingSectionProps) {
  return (
    <section id="pricing" className={standalone ? 'py-28' : 'py-28 bg-muted/30'}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <BlurText
            text={dict.pricing.title}
            delay={60}
            animateBy="words"
            className="font-display text-3xl sm:text-4xl font-bold text-foreground justify-center"
          />
          <FadeInOnScroll delay={0.15}>
            <p className="mt-4 text-lg text-muted-foreground">
              {dict.pricing.subtitle}
            </p>
          </FadeInOnScroll>
        </div>

        <FadeInOnScroll delay={0.1}>
          <SpotlightCard
            className="max-w-lg mx-auto border-primary/20 shadow-xl hover:shadow-2xl transition-shadow"
            spotlightColor="rgba(58, 154, 133, 0.15)"
          >
            <div className="relative z-10">
              <div className="text-center mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-brand-seafoam/10 text-brand-seafoam text-sm font-semibold mb-4 border border-brand-seafoam/20">
                  {dict.pricing.plan.name}
                </span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-5xl font-bold text-foreground">
                    {dict.pricing.plan.price}
                  </span>
                  <span className="text-muted-foreground text-lg">
                    {dict.pricing.plan.period}
                  </span>
                </div>
                <p className="mt-3 text-muted-foreground">
                  {dict.pricing.plan.description}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {dict.pricing.plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-brand-seafoam flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Magnet padding={80} magnetStrength={4} wrapperClassName="w-full">
                <Button className="w-full text-base" size="lg" asChild>
                  <Link href="/auth/signup">{dict.pricing.plan.cta}</Link>
                </Button>
              </Magnet>
            </div>
          </SpotlightCard>
        </FadeInOnScroll>
      </div>
    </section>
  )
}
