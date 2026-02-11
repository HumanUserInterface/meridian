'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Check } from 'lucide-react'
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
    <section id="pricing" className={standalone ? 'py-24' : 'py-24 bg-muted/30'}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <FadeInOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {dict.pricing.title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {dict.pricing.subtitle}
            </p>
          </div>
        </FadeInOnScroll>

        <FadeInOnScroll delay={0.1}>
          <Card className="max-w-lg mx-auto border-primary/30 shadow-lg">
            <CardContent className="pt-8 pb-8">
              <div className="text-center mb-6">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
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

              <Button className="w-full" size="lg" asChild>
                <Link href="/auth/signup">{dict.pricing.plan.cta}</Link>
              </Button>
            </CardContent>
          </Card>
        </FadeInOnScroll>
      </div>
    </section>
  )
}
