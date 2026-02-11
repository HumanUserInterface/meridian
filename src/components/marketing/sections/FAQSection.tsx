'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <FadeInOnScroll>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-center mb-12">
            {dict.faq.title}
          </h2>
        </FadeInOnScroll>

        <FadeInOnScroll delay={0.1}>
          <Accordion type="single" collapsible className="w-full">
            {dict.faq.items.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
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
