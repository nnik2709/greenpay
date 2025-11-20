import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "https://esm.sh/qrcode@1.5.3";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

interface SendQuotationRequest {
  quotationId: string | number;
  email: string;
}

interface QuotationData {
  id: string;
  quotation_number: string;
  company_name: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  number_of_passports: number;
  price_per_passport: number;
  total_amount: number;
  discount?: number;
  amount_after_discount?: number;
  notes?: string;
  valid_until: string;
  created_at: string;
  status: string;
}

async function generateQuotationHTML(quotation: QuotationData): Promise<string> {
  // Generate QR code for quotation reference
  const qrDataUrl = await QRCode.toDataURL(quotation.quotation_number, {
    width: 150,
    margin: 2,
  });

  const discount = quotation.discount || 0;
  const amountAfterDiscount = quotation.amount_after_discount || quotation.total_amount;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Quotation ${quotation.quotation_number}</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
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
      font-size: 28px;
      font-weight: bold;
      color: #10b981;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 16px;
      color: #6b7280;
    }
    .quotation-number {
      background: #10b981;
      color: white;
      padding: 10px 20px;
      display: inline-block;
      border-radius: 5px;
      font-size: 18px;
      font-weight: bold;
      margin: 20px 0;
    }
    .info-section {
      margin: 20px 0;
    }
    .info-box {
      margin-bottom: 20px;
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
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #f3f4f6;
      color: #374151;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      border-bottom: 2px solid #10b981;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    .text-right {
      text-align: right;
    }
    .total-section {
      margin-top: 20px;
      text-align: right;
    }
    .total-row {
      padding: 8px 0;
      font-size: 14px;
    }
    .grand-total {
      border-top: 2px solid #10b981;
      font-weight: bold;
      font-size: 18px;
      color: #10b981;
      margin-top: 10px;
      padding-top: 10px;
    }
    .notes-section {
      margin-top: 30px;
      padding: 15px;
      background: #f9fafb;
      border-left: 4px solid #10b981;
    }
    .notes-section h3 {
      margin-top: 0;
      color: #10b981;
    }
    .terms-section {
      margin-top: 20px;
      font-size: 11px;
      color: #6b7280;
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
    .qr-section {
      text-align: center;
      margin: 20px 0;
    }
    .qr-section img {
      border: 2px solid #e5e7eb;
      padding: 8px;
      border-radius: 8px;
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
      ${quotation.contact_person ? `<p>Attn: ${quotation.contact_person}</p>` : ""}
      ${quotation.contact_email ? `<p>Email: ${quotation.contact_email}</p>` : ""}
      ${quotation.contact_phone ? `<p>Phone: ${quotation.contact_phone}</p>` : ""}
    </div>

    <div class="info-box">
      <h3>Quotation Details:</h3>
      <p><strong>Date:</strong> ${new Date(quotation.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      <p><strong>Valid Until:</strong> ${new Date(quotation.valid_until).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      <p><strong>Status:</strong> <span style="color: #10b981;">${quotation.status.toUpperCase()}</span></p>
    </div>
  </div>

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
          <strong>Corporate Exit Pass Vouchers</strong><br>
          <small style="color: #6b7280;">Individual exit pass vouchers for ${quotation.company_name}</small>
        </td>
        <td class="text-right">${quotation.number_of_passports}</td>
        <td class="text-right">PGK ${quotation.price_per_passport.toFixed(2)}</td>
        <td class="text-right"><strong>PGK ${quotation.total_amount.toFixed(2)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="total-section">
    <div class="total-row">Subtotal: PGK ${quotation.total_amount.toFixed(2)}</div>
    ${discount > 0 ? `<div class="total-row" style="color: #ef4444;">Discount: - PGK ${discount.toFixed(2)}</div>` : ""}
    <div class="grand-total">TOTAL: PGK ${amountAfterDiscount.toFixed(2)}</div>
  </div>

  ${quotation.notes ? `
  <div class="notes-section">
    <h3>Notes:</h3>
    <p>${quotation.notes}</p>
  </div>
  ` : ""}

  <div class="qr-section">
    <p style="font-size: 12px; margin-bottom: 8px;"><strong>Quotation Reference:</strong></p>
    <img src="${qrDataUrl}" alt="QR Code" />
    <p style="font-size: 11px; color: #6b7280; margin-top: 8px;">Scan for verification</p>
  </div>

  <div class="terms-section">
    <h4 style="color: #374151; font-size: 12px;">Terms & Conditions:</h4>
    <ul style="margin: 8px 0; padding-left: 20px;">
      <li>This quotation is valid until ${new Date(quotation.valid_until).toLocaleDateString()}.</li>
      <li>Prices are quoted in Papua New Guinea Kina (PGK).</li>
      <li>Payment is due upon approval of this quotation.</li>
      <li>All vouchers must be used within their validity period.</li>
    </ul>
  </div>

  <div class="footer">
    <p>PNG Green Fees System - Green Fees Collection & Management</p>
    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const { quotationId, email }: SendQuotationRequest = await req.json();
    if (!quotationId || !email) {
      return json({ error: "quotationId and email are required" }, 400);
    }

    // Check for email provider configuration
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "PNG Green Fees <no-reply@pnggreenfeees.gov.pg>";

    if (!RESEND_API_KEY) {
      return json({
        error: "Email provider not configured",
        hint: "Set RESEND_API_KEY in Edge Function environment variables",
      }, 501);
    }

    // Create Supabase client with service role for database access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch quotation from database
    const { data: quotation, error: fetchError } = await supabase
      .from("quotations")
      .select("*")
      .eq("id", quotationId)
      .single();

    if (fetchError || !quotation) {
      return json({ error: "Quotation not found", details: fetchError?.message }, 404);
    }

    // Generate HTML content for the quotation
    const quotationHtml = await generateQuotationHTML(quotation);

    // Create email HTML with quotation embedded
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Quotation from PNG Green Fees System</h2>
        <p>Dear ${quotation.contact_person || quotation.company_name},</p>
        <p>Please find attached your quotation <strong>${quotation.quotation_number}</strong> for corporate exit pass vouchers.</p>

        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Company:</strong> ${quotation.company_name}</p>
          <p style="margin: 5px 0;"><strong>Number of Vouchers:</strong> ${quotation.number_of_passports}</p>
          <p style="margin: 5px 0;"><strong>Total Amount:</strong> PGK ${(quotation.amount_after_discount || quotation.total_amount).toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Valid Until:</strong> ${new Date(quotation.valid_until).toLocaleDateString()}</p>
        </div>

        <p>To proceed with this quotation, please contact us or reply to this email.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

        <p style="font-size: 12px; color: #6b7280;">
          This email was sent by PNG Green Fees System.<br>
          Quotation Reference: ${quotation.quotation_number}
        </p>
      </div>

      <div style="margin-top: 40px; border-top: 2px solid #10b981; padding-top: 20px;">
        <h3 style="color: #10b981; text-align: center;">Full Quotation Document</h3>
        ${quotationHtml}
      </div>
    `;

    // Send email via Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: `Quotation ${quotation.quotation_number} - PNG Green Fees`,
        html: emailHtml,
        tags: [{ name: "type", value: "quotation" }],
      }),
    });

    const emailResult = await emailResponse.json().catch(() => ({}));

    if (!emailResponse.ok) {
      console.error("Resend API error:", emailResult);
      return json({
        error: "Failed to send email",
        details: emailResult
      }, 502);
    }

    // Log the email in the database
    await supabase.from("email_logs").insert({
      recipient_email: email,
      subject: `Quotation ${quotation.quotation_number} - PNG Green Fees`,
      status: "sent",
      sent_at: new Date().toISOString(),
    }).catch((e) => {
      console.warn("Failed to log email:", e);
    });

    // Update quotation status to 'sent' if it was in 'draft'
    if (quotation.status === "draft") {
      await supabase
        .from("quotations")
        .update({ status: "sent" })
        .eq("id", quotationId)
        .catch((e) => {
          console.warn("Failed to update quotation status:", e);
        });
    }

    return json({
      success: true,
      quotationId,
      emailId: emailResult?.id,
      message: `Quotation sent to ${email}`
    });
  } catch (e) {
    console.error("send-quotation error:", e);
    return json({ error: String(e) }, 500);
  }
});
