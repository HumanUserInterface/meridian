'use client'

import ClickSpark from '@/components/reactbits/ClickSpark'

export default function HomePageClient({ children }: { children: React.ReactNode }) {
  return (
    <ClickSpark sparkColor="#3A9A85" sparkSize={12} sparkRadius={20} sparkCount={10} duration={500}>
      {children}
    </ClickSpark>
  )
}
