import { createClient } from '@/lib/supabase/server'
import { COMPANY_INFO } from '@/lib/pdf/company-info'
import type { CompanyInfo } from '@/lib/types/transport'

/**
 * Server-side helper: Fetch company info from the app_settings DB table.
 * Falls back to COMPANY_INFO (env vars) if the table is empty or unavailable.
 *
 * Usage: in Server Components, API routes, or PDF generation services.
 */
export async function getCompanyInfo(): Promise<CompanyInfo> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value')

    if (error || !data) {
      return COMPANY_INFO
    }

    const s = Object.fromEntries(data.map((row) => [row.key, row.value]))

    return {
      name: s.company_name || COMPANY_INFO.name,
      address: s.company_address || COMPANY_INFO.address,
      phone: s.company_phone || COMPANY_INFO.phone,
      hotline: s.company_hotline || COMPANY_INFO.hotline,
      email: s.company_email || COMPANY_INFO.email,
      emailAlt: s.company_email_alt || COMPANY_INFO.emailAlt,
      website: s.company_website || COMPANY_INFO.website,
      taxCode: s.company_tax_code || COMPANY_INFO.taxCode,
    }
  } catch {
    // If DB is unreachable, fall back to env vars gracefully
    return COMPANY_INFO
  }
}
