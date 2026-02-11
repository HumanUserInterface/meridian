'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import BlurText from '@/components/reactbits/BlurText'
import FadeInOnScroll from '../animations/FadeInOnScroll'

interface FAQSectionProps {
  dict: {
    faq: {
      title: string
      items: { question: string; answer: string }[]
    }
  }
}

export default function FAQSection({ dict }: FAQSectionProps) {
  return (
    <section id="faq" className="py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <BlurText
          text={dict.faq.title}
          delay={60}
          animateBy="words"
          className="font-display text-3xl sm:text-4xl font-bold text-foreground justify-center mb-12"
        />

        <FadeInOnScroll delay={0.1}>
          <Accordion type="single" collapsible className="w-full">
            {dict.faq.items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border/60">
                <AccordionTrigger className="text-left text-base font-medium hover:text-primary transition-colors">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeInOnScroll>
      </div>
    </section>
  )
}
