// Supabase Edge Function: report-export
// Exports CSV from reporting views with optional date filters.
// Request: POST JSON { type: 'passports'|'individual'|'corporate'|'bulk'|'quotations'|'revenue', filters: { from?: string, to?: string }, format?: 'csv' }
// Response: text/csv

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

// Use service role if provided (recommended for server-side exports), otherwise anon
const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY || ''
)

type ReportType = 'passports' | 'individual' | 'corporate' | 'bulk' | 'quotations' | 'revenue'

const VIEW_MAP: Record<ReportType, { view: string; dateField: string }> = {
  passports: { view: 'report_passports', dateField: 'created_at' },
  individual: { view: 'report_individual_purchases', dateField: 'created_at' },
  corporate: { view: 'report_corporate_vouchers', dateField: 'created_at' },
  bulk: { view: 'report_bulk_uploads', dateField: 'created_at' },
  quotations: { view: 'report_quotations', dateField: 'created_at' },
  revenue: { view: 'revenue_report', dateField: 'date' },
}

function toCsv(rows: any[]): string {
  if (!rows || rows.length === 0) return ''
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k))
      return set
    }, new Set<string>())
  )
  const escape = (val: any) => {
    if (val === null || val === undefined) return ''
    const s = String(val)
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }
  const lines = [headers.join(',')]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(','))
  }
  return lines.join('\n')
}

serve(async (req) => {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    const { type, filters, format } = await req.json().catch(() => ({}))
    const reportType = String(type || '').toLowerCase() as ReportType

    if (!VIEW_MAP[reportType]) {
      return new Response('Invalid report type', { status: 400 })
    }

    const { view, dateField } = VIEW_MAP[reportType]
    const from = filters?.from ? new Date(filters.from) : undefined
    const to = filters?.to ? new Date(filters.to) : undefined

    // Build query
    let query = supabase.from(view).select('*', { head: false })

    if (from) {
      // for revenue_report date is a date/timestamp bucket
      query = query.gte(dateField, from.toISOString())
    }
    if (to) {
      query = query.lte(dateField, to.toISOString())
    }

    // Restrict scope based on role (basic example: if JWT has a user id and role claims, apply created_by filter)
    // Note: With service role key, RLS is bypassed; if you prefer RLS enforcement, use ANON key and rely on policies.

    const { data, error } = await query.limit(10000)
    if (error) {
      console.error('report-export query error', error)
      return new Response('Query error: ' + error.message, { status: 500 })
    }

    const rows = data ?? []

    if ((format || 'csv') !== 'csv') {
      return new Response('Only CSV supported for now', { status: 400 })
    }

    const csv = toCsv(rows)
    const filename = `${view}_${new Date().toISOString().slice(0, 10)}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e: any) {
    console.error('report-export fatal', e)
    return new Response('Server error', { status: 500 })
  }
})
