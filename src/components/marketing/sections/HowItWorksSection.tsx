'use client'

import BlurText from '@/components/reactbits/BlurText'
import CountUp from '@/components/reactbits/CountUp'
import FadeInOnScroll from '../animations/FadeInOnScroll'
import StaggerChildren, { StaggerItem } from '../animations/StaggerChildren'

interface HowItWorksSectionProps {
  dict: {
    howItWorks: {
      title: string
      subtitle: string
      steps: { title: string; description: string }[]
    }
  }
}

export default function HowItWorksSection({ dict }: HowItWorksSectionProps) {
  return (
    <section id="how-it-works" className="py-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <BlurText
            text={dict.howItWorks.title}
            delay={60}
            animateBy="words"
            className="font-display text-3xl sm:text-4xl font-bold text-foreground justify-center"
          />
          <FadeInOnScroll delay={0.15}>
            <p className="mt-4 text-lg text-muted-foreground">
              {dict.howItWorks.subtitle}
            </p>
          </FadeInOnScroll>
        </div>

        <StaggerChildren className="relative" staggerDelay={0.15}>
          {/* Connecting line */}
          <div className="absolute left-[1.45rem] top-12 bottom-12 w-px bg-gradient-to-b from-brand-seafoam via-brand-steel-blue to-brand-sky hidden sm:block" />

          <div className="space-y-14">
            {dict.howItWorks.steps.map((step, i) => (
              <StaggerItem key={i}>
                <div className="flex gap-6 items-start group">
                  <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-lg font-bold shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                    <CountUp to={i + 1} duration={0.8} delay={0.2 * i} />
                  </div>
                  <div className="pt-1.5">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </div>
        </StaggerChildren>
      </div>
    </section>
  )
}
