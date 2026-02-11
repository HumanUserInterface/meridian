'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  MousePointerClick,
  Sparkles,
  Link2,
  Search,
  FileOutput,
  Tag,
} from 'lucide-react'
import StaggerChildren, { StaggerItem } from '../animations/StaggerChildren'
import FadeInOnScroll from '../animations/FadeInOnScroll'

const icons = [MousePointerClick, Sparkles, Link2, Search, FileOutput, Tag]

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
    <section id="features" className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <FadeInOnScroll>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {dict.features.title}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {dict.features.subtitle}
            </p>
          </div>
        </FadeInOnScroll>

        <StaggerChildren className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {dict.features.items.map((feature, i) => {
            const Icon = icons[i] || Search
            return (
              <StaggerItem key={i}>
                <Card className="h-full hover:shadow-md transition-shadow border-border/50">
                  <CardContent className="pt-6">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </StaggerItem>
            )
          })}
        </StaggerChildren>
      </div>
    </section>
  )
}
