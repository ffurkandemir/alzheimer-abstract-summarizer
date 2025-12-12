import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Alzheimer Abstract Summarizer',
  description: 'AI-powered tool for summarizing Alzheimer and neurodegenerative disease research abstracts',
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
