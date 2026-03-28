import type { CompanyInfo } from '../types/transport'

/**
 * Company info is read from environment variables.
 * Each customer sets their own values in .env.local (or deployment env).
 * See .env.example for the full list of available variables.
 *
 * For runtime overrides (admin can edit in-app), see lib/settings/get-company-info.ts
 */
export const COMPANY_INFO: CompanyInfo = {
  name: process.env.NEXT_PUBLIC_COMPANY_NAME ?? '',
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS ?? '',
  phone: process.env.NEXT_PUBLIC_COMPANY_PHONE ?? '',
  hotline: process.env.NEXT_PUBLIC_COMPANY_HOTLINE ?? '',
  email: process.env.NEXT_PUBLIC_COMPANY_EMAIL ?? '',
  emailAlt: process.env.NEXT_PUBLIC_COMPANY_EMAIL_ALT ?? '',
  website: process.env.NEXT_PUBLIC_COMPANY_WEBSITE ?? '',
  taxCode: process.env.NEXT_PUBLIC_COMPANY_TAX_CODE ?? '',
}