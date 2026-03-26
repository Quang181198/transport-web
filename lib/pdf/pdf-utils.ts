import fs from 'node:fs/promises'
import path from 'node:path'
import { Font } from '@react-pdf/renderer'

let fontsRegistered = false

export function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
}

export async function registerPdfFontsOnce() {
  if (fontsRegistered) return true

  try {
    const regularPath = path.join(
      process.cwd(),
      'public',
      'fonts',
      'NotoSans-Regular.ttf',
    )
    const boldPath = path.join(
      process.cwd(),
      'public',
      'fonts',
      'NotoSans-Bold.ttf',
    )

    await fs.access(regularPath)
    await fs.access(boldPath)

    Font.register({
      family: 'NotoSans',
      fonts: [
        { src: regularPath, fontWeight: 400 },
        { src: boldPath, fontWeight: 700 },
      ],
    })

    fontsRegistered = true
    return true
  } catch {
    return false
  }
}

export async function fileToDataUri(fileName: string) {
  try {
    const filePath = path.join(process.cwd(), 'public', fileName)
    const fileBuffer = await fs.readFile(filePath)
    const ext = path.extname(fileName).toLowerCase()

    const mime =
      ext === '.jpg' || ext === '.jpeg'
        ? 'image/jpeg'
        : ext === '.webp'
          ? 'image/webp'
          : 'image/png'

    return `data:${mime};base64,${fileBuffer.toString('base64')}`
  } catch {
    return null
  }
}

export async function streamToBuffer(stream: NodeJS.ReadableStream) {
  const chunks: Buffer[] = []

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }

  return Buffer.concat(chunks)
}

export function sanitizeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, '_')
}