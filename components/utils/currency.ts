export function formatVND(value: number | null | undefined) {
  if (!value || value === 0) return ''
  return value.toLocaleString('vi-VN') + ' đ'
}

export function parseVND(input: string) {
  const digits = input.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}