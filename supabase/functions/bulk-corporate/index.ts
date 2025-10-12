// Supabase Edge Function: bulk-corporate
// Creates a batch of corporate vouchers by inserting multiple rows into corporate_vouchers.
// Request: POST JSON { company_name: string, count: number, amount: number, payment_method: string, valid_from: string, valid_until: string }
// Response: 200 { vouchers: [{voucher_code, valid_from, valid_until, amount}], count }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

function genCode(prefix = 'VCH') {
  const ts = Date.now().toString(36).toUpperCase()
  const rnd = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix}-${ts}-${rnd}`
}

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader) return new Response('Unauthorized', { status: 401 })

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  try {
    const body = await req.json()
    const company_name = (body?.company_name || '').trim()
    const count = Math.max(1, Math.min(10000, Number(body?.count || 0)))
    const amount = Number(body?.amount)
    const payment_method = (body?.payment_method || '').trim()
    const valid_from = body?.valid_from || new Date().toISOString()
    const valid_until = body?.valid_until

    if (!company_name || !amount || !payment_method || !valid_until) {
      return new Response('Missing required fields', { status: 400 })
    }

    // Prepare rows
    const rows = Array.from({ length: count }).map(() => ({
      voucher_code: genCode('CORP'),
      company_name,
      amount,
      payment_method,
      valid_from,
      valid_until,
      quantity: 1,
    }))

    // Insert with retry on conflict (rare)
    let inserted: any[] = []
    let attempts = 0
    while (inserted.length < rows.length && attempts < 3) {
      attempts++
      const slice = rows.slice(inserted.length)
      const { data, error } = await supabase
        .from('corporate_vouchers')
        .insert(slice)
        .select('*')

      if (error) {
        // On unique violation due to code collision, regenerate codes and retry
        if (error.message && /duplicate key value/i.test(error.message)) {
          for (let i = inserted.length; i < rows.length; i++) {
            rows[i].voucher_code = genCode('CORP')
          }
          continue
        }
        return new Response('Insert error: ' + error.message, { status: 500 })
      }

      inserted = inserted.concat(data || [])
    }

    if (inserted.length !== rows.length) {
      return new Response('Partial insert. Please retry.', { status: 500 })
    }

    const vouchers = inserted.map((r) => ({
      voucher_code: r.voucher_code,
      valid_from: r.valid_from,
      valid_until: r.valid_until,
      amount: r.amount,
    }))

    return new Response(JSON.stringify({ vouchers, count: vouchers.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    console.error('bulk-corporate error', e)
    return new Response('Server error', { status: 500 })
  }
})
