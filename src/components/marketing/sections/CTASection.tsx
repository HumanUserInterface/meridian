'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import FadeInOnScroll from '../animations/FadeInOnScroll'

interface CTASectionProps {
  dict: {
    cta: {
      title: string
      subtitle: string
      button: string
    }
  }
}

export default function CTASection({ dict }: CTASectionProps) {
  return (
    <section className="py-24 bg-brand-deep-ocean dark:bg-brand-deep-ocean/80">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <FadeInOnScroll>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white">
            {dict.cta.title}
          </h2>
          <p className="mt-4 text-lg text-white/70">
            {dict.cta.subtitle}
          </p>
          <div className="mt-8">
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
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  )
}
