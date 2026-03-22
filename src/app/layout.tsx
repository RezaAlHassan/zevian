import type { Metadata } from 'next'
import { DM_Mono, Outfit } from 'next/font/google'
import '@/styles/globals.css'

// ─── Font loading (Next.js optimised, no layout shift) ───────
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


export const metadata: Metadata = {
  title: { default: 'Zevian', template: '%s · Zevian' },
  description: 'AI-powered performance management for remote teams.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'Zevian',
    description: 'AI-powered performance management for remote teams.',
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
    <html lang="en" className={`${dmMono.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  )
}
