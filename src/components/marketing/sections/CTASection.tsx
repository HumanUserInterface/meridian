'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import BlurText from '@/components/reactbits/BlurText'
import Magnet from '@/components/reactbits/Magnet'
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
    <section className="relative py-28 bg-brand-deep-ocean dark:bg-brand-deep-ocean/90 overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-brand-seafoam/10 blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <BlurText
          text={dict.cta.title}
          delay={60}
          animateBy="words"
          className="font-display text-3xl sm:text-4xl font-bold text-white justify-center"
        />
        <FadeInOnScroll delay={0.15}>
          <p className="mt-4 text-lg text-white/60">
            {dict.cta.subtitle}
          </p>
        </FadeInOnScroll>
        <FadeInOnScroll delay={0.25}>
          <div className="mt-8">
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
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  )
}
