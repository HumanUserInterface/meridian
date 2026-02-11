'use client'

import {
  MousePointerClick,
  Sparkles,
  Link2,
  Search,
  FileOutput,
  Tag,
} from 'lucide-react'
import SpotlightCard from '@/components/reactbits/SpotlightCard'
import BlurText from '@/components/reactbits/BlurText'
import FadeInOnScroll from '../animations/FadeInOnScroll'
import StaggerChildren, { StaggerItem } from '../animations/StaggerChildren'

const icons = [MousePointerClick, Sparkles, Link2, Search, FileOutput, Tag]

const spotlightColors = [
  'rgba(59, 130, 246, 0.12)',
  'rgba(58, 154, 133, 0.12)',
  'rgba(91, 141, 171, 0.12)',
  'rgba(143, 193, 218, 0.12)',
  'rgba(168, 85, 247, 0.12)',
  'rgba(244, 63, 94, 0.12)',
]

interface FeaturesSectionProps {
  dict: {
    features: {
      title: string
      subtitle: string
      items: { title: string; description: string }[]
    }
  }
}

export default function FeaturesSection({ dict }: FeaturesSectionProps) {
  return (
    <section id="features" className="py-28 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <BlurText
            text={dict.features.title}
            delay={60}
            animateBy="words"
            className="font-display text-3xl sm:text-4xl font-bold text-foreground justify-center"
          />
          <FadeInOnScroll delay={0.15}>
            <p className="mt-4 text-lg text-muted-foreground">
              {dict.features.subtitle}
            </p>
          </FadeInOnScroll>
        </div>

        <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.08}>
          {dict.features.items.map((feature, i) => {
            const Icon = icons[i] || Search
            return (
              <StaggerItem key={i}>
                <SpotlightCard
                  className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  spotlightColor={spotlightColors[i]}
                >
                  <div className="relative z-10">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2 text-base">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </SpotlightCard>
              </StaggerItem>
            )
          })}
        </StaggerChildren>
      </div>
    </section>
  )
}
