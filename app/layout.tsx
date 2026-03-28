import './globals.css'
import { DialogProvider } from '@/lib/dialog-context'
import DialogRenderer from '@/components/ui/dialog-renderer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || 'Transport Management',
  description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || '',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>
        <DialogProvider>
          {children}
          <DialogRenderer />
        </DialogProvider>
      </body>
    </html>
  )
}