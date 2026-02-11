'use client'

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
    <section id="how-it-works" className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <FadeInOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {dict.howItWorks.title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {dict.howItWorks.subtitle}
            </p>
          </div>
        </FadeInOnScroll>

        <StaggerChildren className="relative" staggerDelay={0.15}>
          {/* Connecting line */}
          <div className="absolute left-6 top-8 bottom-8 w-px bg-border hidden sm:block" />

          <div className="space-y-12">
            {dict.howItWorks.steps.map((step, i) => (
              <StaggerItem key={i}>
                <div className="flex gap-6 items-start">
                  <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-lg font-bold">
                    {i + 1}
                  </div>
                  <div className="pt-2">
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
