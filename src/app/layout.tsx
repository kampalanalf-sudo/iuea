import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'IUEA',
  description: 'IUEA Application with Vercel Speed Insights',
  viewport: 'width=device-width, initial-scale=1',
  authors: [{ name: 'IUEA Team' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  )
}
