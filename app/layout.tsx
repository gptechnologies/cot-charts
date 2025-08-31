import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'COT — Non-Commercials',
  description: 'Commitment of Traders Non-Commercial Positions Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} dark-theme min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
