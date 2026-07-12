import type { Metadata } from 'next'
import { DM_Mono, Outfit, Plus_Jakarta_Sans } from 'next/font/google'
import '@/styles/globals.css'

// ─── Font loading (Next.js optimised, no layout shift) ───────
// Two voices: Plus Jakarta Sans carries the STRUCTURAL voice — display titles/headings/logo AND the
// data (scores, KPI values, deltas) via --font-numeric, rendered heavy with tabular figures for
// instant legibility. Outfit is the neutral READING voice (body/UI). DM Mono is kept only for small
// tabular contexts (--font-mono), not for hero numbers.
const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono-google',
  display: 'swap',
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit-google',
  display: 'swap',
})

// Plus Jakarta Sans is a variable font (up to 800) — omitting `weight` loads the full axis so titles
// and hero numbers get real (not synthesized) bold weights.
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta-google',
  display: 'swap',
})


export const metadata: Metadata = {
  title: { default: 'Zevian', template: '%s · Zevian' },
  description: 'Performance management for remote teams.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://localhost:3000'),
  openGraph: {
    title: 'Zevian',
    description: 'Performance management for remote teams.',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon.png?v=1', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon.png?v=1', type: 'image/png' },
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmMono.variable} ${outfit.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  )
}
