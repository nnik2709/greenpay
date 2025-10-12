// Supabase Edge Function: generate-quotation-pdf
// Generates a professional PDF quotation document
// Request: POST JSON { quotation_id: string }
// Response: 200 { pdfUrl: string, quotation: {...} }

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import QRCode from 'https://esm.sh/qrcode@1.5.3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

interface QuotationData {
  id: string
  quotation_number: string
  company_name: string
  contact_person?: string
  contact_email?: string
  contact_phone?: string
  number_of_passports: number
  price_per_passport: number
  total_amount: number
  discount?: number
  amount_after_discount?: number
  notes?: string
  valid_until: string
  created_at: string
  status: string
}

async function generateQuotationHTML(quotation: QuotationData): Promise<string> {
  // Generate QR code for quotation reference
  const qrDataUrl = await QRCode.toDataURL(quotation.quotation_number, {
    width: 150,
    margin: 2,
  })

  const discount = quotation.discount || 0
  const amountAfterDiscount = quotation.amount_after_discount || quotation.total_amount

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quotation ${quotation.quotation_number}</title>
  <style>
    @page { margin: 20mm; }
    body { 
      font-family: 'Arial', sans-serif; 
      line-height: 1.6;
      color: #333;
      max-width: 210mm;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #10b981;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 18px;
      color: #6b7280;
    }
    .quotation-number {
      background: #10b981;
      color: white;
      padding: 10px 20px;
      display: inline-block;
      border-radius: 5px;
      font-size: 20px;
      font-weight: bold;
      margin: 20px 0;
    }
    .info-section {
      margin: 30px 0;
      display: flex;
      justify-between;
    }
    .info-box {
      flex: 1;
      margin: 0 10px;
    }
    .info-box h3 {
      color: #10b981;
      font-size: 14px;
      text-transform: uppercase;
      margin-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .info-box p {
      margin: 5px 0;
      font-size: 14px;
    }
    .table-container {
      margin: 30px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #f3f4f6;
      color: #374151;
      padding: 15px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      border-bottom: 2px solid #10b981;
    }
    td {
      padding: 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    .text-right {
      text-align: right;
    }
    .total-section {
      margin-top: 30px;
      float: right;
      width: 300px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      font-size: 16px;
    }
    .total-row.subtotal {
      border-top: 1px solid #e5e7eb;
    }
    .total-row.discount {
      color: #ef4444;
    }
    .total-row.grand-total {
      border-top: 2px solid #10b981;
      font-weight: bold;
      font-size: 20px;
      color: #10b981;
      margin-top: 10px;
      padding-top: 15px;
    }
    .notes-section {
      clear: both;
      margin-top: 50px;
      padding: 20px;
      background: #f9fafb;
      border-left: 4px solid #10b981;
    }
    .notes-section h3 {
      margin-top: 0;
      color: #10b981;
    }
    .terms-section {
      margin-top: 30px;
      font-size: 12px;
      color: #6b7280;
    }
    .terms-section h3 {
      color: #374151;
      font-size: 14px;
    }
    .terms-section ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .terms-section li {
      margin: 5px 0;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #9ca3af;
    }
    .qr-section {
      text-align: center;
      margin: 30px 0;
    }
    .qr-section img {
      border: 2px solid #e5e7eb;
      padding: 10px;
      border-radius: 8px;
    }
    .signature-section {
      margin-top: 80px;
      display: flex;
      justify-content: space-between;
    }
    .signature-box {
      width: 200px;
      text-align: center;
    }
    .signature-line {
      border-top: 2px solid #374151;
      margin-top: 60px;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">PNG GREEN FEES SYSTEM</div>
    <div class="subtitle">Green Fees Collection & Management</div>
    <div class="quotation-number">QUOTATION ${quotation.quotation_number}</div>
  </div>

  <div class="info-section">
    <div class="info-box">
      <h3>To:</h3>
      <p><strong>${quotation.company_name}</strong></p>
      ${quotation.contact_person ? `<p>Attn: ${quotation.contact_person}</p>` : ''}
      ${quotation.contact_email ? `<p>Email: ${quotation.contact_email}</p>` : ''}
      ${quotation.contact_phone ? `<p>Phone: ${quotation.contact_phone}</p>` : ''}
    </div>
    
    <div class="info-box">
      <h3>Quotation Details:</h3>
      <p><strong>Date:</strong> ${new Date(quotation.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p><strong>Valid Until:</strong> ${new Date(quotation.valid_until).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p><strong>Status:</strong> <span style="color: #10b981;">${quotation.status.toUpperCase()}</span></p>
    </div>
  </div>

  <div class="table-container">
    <h3 style="color: #10b981; font-size: 16px;">ITEMS</h3>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Quantity</th>
          <th class="text-right">Unit Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Corporate Exit Pass Vouchers</strong>
            <br>
            <small style="color: #6b7280;">Individual exit pass vouchers for ${quotation.company_name}</small>
          </td>
          <td class="text-right">${quotation.number_of_passports}</td>
          <td class="text-right">PGK ${quotation.price_per_passport.toFixed(2)}</td>
          <td class="text-right"><strong>PGK ${quotation.total_amount.toFixed(2)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="total-section">
    <div class="total-row subtotal">
      <span>Subtotal:</span>
      <span>PGK ${quotation.total_amount.toFixed(2)}</span>
    </div>
    ${discount > 0 ? `
    <div class="total-row discount">
      <span>Discount:</span>
      <span>- PGK ${discount.toFixed(2)}</span>
    </div>
    ` : ''}
    <div class="total-row grand-total">
      <span>TOTAL:</span>
      <span>PGK ${amountAfterDiscount.toFixed(2)}</span>
    </div>
  </div>

  ${quotation.notes ? `
  <div class="notes-section">
    <h3>Notes:</h3>
    <p>${quotation.notes}</p>
  </div>
  ` : ''}

  <div class="qr-section">
    <p style="font-size: 14px; margin-bottom: 10px;"><strong>Quotation Reference:</strong></p>
    <img src="${qrDataUrl}" alt="QR Code" />
    <p style="font-size: 12px; color: #6b7280; margin-top: 10px;">Scan this QR code for verification</p>
  </div>

  <div class="terms-section">
    <h3>Terms & Conditions:</h3>
    <ul>
      <li>This quotation is valid until ${new Date(quotation.valid_until).toLocaleDateString()}.</li>
      <li>Prices are quoted in Papua New Guinea Kina (PGK).</li>
      <li>Payment is due upon approval of this quotation.</li>
      <li>All vouchers must be used within their validity period.</li>
      <li>Vouchers are non-refundable once issued.</li>
      <li>This quotation does not constitute a binding contract until formally accepted.</li>
    </ul>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-line">
        <strong>Prepared By</strong><br>
        PNG Green Fees System
      </div>
    </div>
    <div class="signature-box">
      <div class="signature-line">
        <strong>Accepted By</strong><br>
        ${quotation.company_name}
      </div>
    </div>
  </div>

  <div class="footer">
    <p>PNG Green Fees System - Green Fees Collection & Management</p>
    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
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
    const { quotation_id } = body

    if (!quotation_id) {
      return new Response(JSON.stringify({ error: 'quotation_id is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Fetch quotation details
    const { data: quotation, error } = await supabase
      .from('quotations')
      .select('*')
      .eq('id', quotation_id)
      .single()

    if (error || !quotation) {
      return new Response(JSON.stringify({ error: 'Quotation not found' }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate HTML
    const html = await generateQuotationHTML(quotation)

    // Convert HTML to bytes
    const htmlBytes = new TextEncoder().encode(html)

    // Upload HTML to Supabase Storage (can be converted to PDF client-side)
    const timestamp = Date.now()
    const filename = `quotation_${quotation.quotation_number}_${timestamp}.html`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('voucher-batches')
      .upload(`quotations/${filename}`, htmlBytes, {
        contentType: 'text/html',
        cacheControl: '3600',
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      // Return HTML directly if upload fails
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `inline; filename="${filename}"`,
        },
      })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('voucher-batches')
      .getPublicUrl(`quotations/${filename}`)

    return new Response(JSON.stringify({ 
      success: true,
      pdfUrl: urlData.publicUrl,
      htmlUrl: urlData.publicUrl,
      filename,
      quotation: {
        number: quotation.quotation_number,
        company: quotation.company_name,
        amount: quotation.total_amount,
        validUntil: quotation.valid_until
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (e: any) {
    console.error('generate-quotation-pdf error', e)
    return new Response(JSON.stringify({ 
      error: 'Server error: ' + (e.message || 'Unknown error') 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})


