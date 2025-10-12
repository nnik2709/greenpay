// Supabase Edge Function: generate-corporate-zip
// Generates a ZIP file containing QR codes and voucher details for a corporate batch
// Request: POST JSON { company_name: string, batch_date: string }
// Response: 200 { zipUrl: string, vouchers: [...] }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import JSZip from 'https://esm.sh/jszip@3.10.1'
import QRCode from 'https://esm.sh/qrcode@1.5.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

interface VoucherData {
  voucher_code: string
  company_name: string
  amount: number
  valid_from: string
  valid_until: string
  quantity: number
  created_at: string
}

async function generateVoucherPDF(voucher: VoucherData): Promise<string> {
  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(voucher.voucher_code, {
    width: 200,
    margin: 2,
  })

  // Simple HTML template for voucher (will be converted to PDF client-side or via another service)
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .voucher { border: 2px solid #10b981; padding: 30px; max-width: 600px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; }
    .qr-code { text-align: center; margin: 30px 0; }
    .details { margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
    .label { font-weight: bold; color: #374151; }
    .value { color: #1f2937; }
    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="voucher">
    <div class="header">
      <h1 style="color: #10b981; margin: 0;">PNG Green Fees System</h1>
      <h2 style="color: #374151; margin: 10px 0;">Corporate Exit Pass Voucher</h2>
    </div>
    
    <div class="qr-code">
      <img src="${qrDataUrl}" alt="QR Code" />
    </div>
    
    <div class="details">
      <div class="detail-row">
        <span class="label">Voucher Code:</span>
        <span class="value">${voucher.voucher_code}</span>
      </div>
      <div class="detail-row">
        <span class="label">Company:</span>
        <span class="value">${voucher.company_name}</span>
      </div>
      <div class="detail-row">
        <span class="label">Amount:</span>
        <span class="value">PGK ${voucher.amount.toFixed(2)}</span>
      </div>
      <div class="detail-row">
        <span class="label">Quantity:</span>
        <span class="value">${voucher.quantity}</span>
      </div>
      <div class="detail-row">
        <span class="label">Valid From:</span>
        <span class="value">${new Date(voucher.valid_from).toLocaleDateString()}</span>
      </div>
      <div class="detail-row">
        <span class="label">Valid Until:</span>
        <span class="value">${new Date(voucher.valid_until).toLocaleDateString()}</span>
      </div>
      <div class="detail-row">
        <span class="label">Issue Date:</span>
        <span class="value">${new Date(voucher.created_at).toLocaleDateString()}</span>
      </div>
    </div>
    
    <div class="footer">
      <p>This voucher is valid for exit pass payment at PNG Green Fees collection points.</p>
      <p>Please present this voucher or scan the QR code for validation.</p>
    </div>
  </div>
</body>
</html>
  `

  return html
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })

  try {
    const body = await req.json()
    const { company_name, batch_date, voucher_ids } = body

    if (!company_name && !batch_date && !voucher_ids) {
      return new Response(JSON.stringify({ 
        error: 'Please provide either company_name and batch_date, or voucher_ids' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Fetch vouchers
    let query = supabase
      .from('corporate_vouchers')
      .select('*')
      .order('created_at', { ascending: true })

    if (voucher_ids && Array.isArray(voucher_ids)) {
      query = query.in('id', voucher_ids)
    } else {
      if (company_name) {
        query = query.eq('company_name', company_name)
      }
      if (batch_date) {
        const startDate = new Date(batch_date)
        const endDate = new Date(batch_date)
        endDate.setDate(endDate.getDate() + 1)
        query = query.gte('created_at', startDate.toISOString())
        query = query.lt('created_at', endDate.toISOString())
      }
    }

    const { data: vouchers, error } = await query

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    if (!vouchers || vouchers.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No vouchers found for the specified criteria' 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create ZIP file
    const zip = new JSZip()

    // Add a summary file
    const summary = `
PNG Green Fees - Corporate Voucher Batch
=========================================

Company: ${vouchers[0].company_name}
Batch Date: ${new Date(vouchers[0].created_at).toLocaleDateString()}
Total Vouchers: ${vouchers.length}
Total Quantity: ${vouchers.reduce((sum, v) => sum + (v.quantity || 1), 0)}
Total Amount: PGK ${vouchers.reduce((sum, v) => sum + (v.amount || 0), 0).toFixed(2)}

Voucher Details:
${vouchers.map((v, i) => `
${i + 1}. ${v.voucher_code}
   Amount: PGK ${v.amount.toFixed(2)}
   Quantity: ${v.quantity}
   Valid: ${new Date(v.valid_from).toLocaleDateString()} - ${new Date(v.valid_until).toLocaleDateString()}
`).join('\n')}

Generated: ${new Date().toISOString()}
`
    zip.file('BATCH_SUMMARY.txt', summary)

    // Add individual voucher HTML files
    for (let i = 0; i < vouchers.length; i++) {
      const voucher = vouchers[i]
      const html = await generateVoucherPDF(voucher)
      zip.file(`voucher_${i + 1}_${voucher.voucher_code}.html`, html)
      
      // Generate QR code as PNG
      const qrBuffer = await QRCode.toBuffer(voucher.voucher_code, {
        width: 400,
        margin: 2,
      })
      zip.file(`qr_${i + 1}_${voucher.voucher_code}.png`, qrBuffer)
    }

    // Generate CSV for bulk import
    const csvHeader = 'Voucher Code,Company,Amount,Quantity,Valid From,Valid Until,Created At\n'
    const csvRows = vouchers.map(v => 
      `"${v.voucher_code}","${v.company_name}",${v.amount},${v.quantity},"${v.valid_from}","${v.valid_until}","${v.created_at}"`
    ).join('\n')
    zip.file('vouchers.csv', csvHeader + csvRows)

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ 
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    })

    // Upload ZIP to Supabase Storage
    const timestamp = Date.now()
    const zipFileName = `corporate_vouchers_${company_name || 'batch'}_${timestamp}.zip`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voucher-batches')
      .upload(`batches/${zipFileName}`, zipBuffer, {
        contentType: 'application/zip',
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      // If upload fails, return ZIP directly
      return new Response(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${zipFileName}"`,
        },
      })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('voucher-batches')
      .getPublicUrl(`batches/${zipFileName}`)

    return new Response(JSON.stringify({ 
      success: true,
      zipUrl: urlData.publicUrl,
      fileName: zipFileName,
      voucherCount: vouchers.length,
      totalAmount: vouchers.reduce((sum, v) => sum + (v.amount || 0), 0),
      company: vouchers[0].company_name,
      vouchers: vouchers.map(v => ({
        code: v.voucher_code,
        amount: v.amount,
        validUntil: v.valid_until
      }))
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (e: any) {
    console.error('generate-corporate-zip error', e)
    return new Response(JSON.stringify({ 
      error: 'Server error: ' + (e.message || 'Unknown error') 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})


