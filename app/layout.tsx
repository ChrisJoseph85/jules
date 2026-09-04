import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Jules Proxy App',
  description: 'A frontend wrapper for Jules REST API',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
