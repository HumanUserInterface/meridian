'use client'

import { FileText, Clock, BookOpen } from 'lucide-react'
import BlurText from '@/components/reactbits/BlurText'
import FadeInOnScroll from '../animations/FadeInOnScroll'

const iconMap = {
  'file-text': FileText,
  'clock': Clock,
  'book-open': BookOpen,
}

interface StubPageProps {
  title: string
  subtitle: string
  comingSoon: string
  icon: keyof typeof iconMap
}

export default function StubPage({ title, subtitle, comingSoon, icon }: StubPageProps) {
  const Icon = iconMap[icon]

  return (
    <section className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-brand-cloud/30 to-transparent dark:from-brand-deep-ocean/10 dark:to-transparent" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <FadeInOnScroll>
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon className="w-8 h-8 text-muted-foreground" />
          </div>
        </FadeInOnScroll>

        <BlurText
          text={title}
          delay={80}
          animateBy="words"
          className="font-display text-4xl font-bold text-foreground justify-center mb-4"
        />

        <FadeInOnScroll delay={0.2}>
          <p className="text-lg text-muted-foreground mb-8">
            {subtitle}
          </p>
        </FadeInOnScroll>

        <FadeInOnScroll delay={0.3}>
          <div className="inline-block px-6 py-3 bg-muted/50 border border-border/50 rounded-lg">
            <p className="text-muted-foreground text-sm">
              {comingSoon}
            </p>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  )
}
