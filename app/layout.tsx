import './globals.css'
import { DialogProvider } from '@/lib/dialog-context'
import DialogRenderer from '@/components/ui/dialog-renderer'

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