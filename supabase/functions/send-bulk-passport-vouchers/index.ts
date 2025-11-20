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

interface SendBulkRequest {
  passportIds: (string | number)[];
  email: string;
  message?: string;
}

interface VoucherData {
  id: string;
  voucher_code: string;
  passport_number: string;
  given_name: string;
  surname: string;
  nationality: string;
  amount: number;
  valid_until: string;
  status: string;
}

async function generateVoucherHTML(voucher: VoucherData): Promise<string> {
  // Generate QR code for voucher
  const qrDataUrl = await QRCode.toDataURL(voucher.voucher_code, {
    width: 120,
    margin: 1,
  });

  return `
    <div style="page-break-inside: avoid; border: 2px solid #10b981; border-radius: 8px; padding: 15px; margin: 10px 0; background: white;">
      <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 10px;">
        <h3 style="color: #10b981; margin: 0;">PNG GREEN FEES VOUCHER</h3>
        <p style="font-size: 11px; color: #6b7280; margin: 5px 0;">Exit Pass Voucher</p>
      </div>

      <div style="display: flex; justify-content: space-between;">
        <div style="flex: 1;">
          <p style="margin: 4px 0; font-size: 12px;"><strong>Voucher Code:</strong></p>
          <p style="margin: 4px 0; font-size: 14px; font-family: monospace; color: #10b981; font-weight: bold;">${voucher.voucher_code}</p>

          <p style="margin: 8px 0 4px; font-size: 12px;"><strong>Passport:</strong> ${voucher.passport_number}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Name:</strong> ${voucher.given_name} ${voucher.surname}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Nationality:</strong> ${voucher.nationality}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Amount:</strong> PGK ${voucher.amount.toFixed(2)}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Valid Until:</strong> ${new Date(voucher.valid_until).toLocaleDateString()}</p>
        </div>

        <div style="text-align: center; padding-left: 10px;">
          <img src="${qrDataUrl}" alt="QR Code" style="border: 1px solid #e5e7eb; border-radius: 4px;" />
          <p style="font-size: 9px; color: #6b7280; margin: 4px 0;">Scan to validate</p>
        </div>
      </div>

      <div style="border-top: 1px dashed #e5e7eb; margin-top: 10px; padding-top: 8px; font-size: 9px; color: #6b7280; text-align: center;">
        Present this voucher at immigration checkpoint. Valid for single use only.
      </div>
    </div>
  `;
}

async function generateBulkVouchersHTML(vouchers: VoucherData[], message?: string): Promise<string> {
  const voucherHtmlPromises = vouchers.map(v => generateVoucherHTML(v));
  const voucherHtmls = await Promise.all(voucherHtmlPromises);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>PNG Green Fees - Bulk Vouchers</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      line-height: 1.4;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid #10b981;
    }
    .logo {
      font-size: 24px;
      font-weight: bold;
      color: #10b981;
    }
    .summary {
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 20px;
    }
    .summary h3 {
      margin: 0 0 10px;
      color: #166534;
    }
    .message {
      background: #f9fafb;
      border-left: 4px solid #6b7280;
      padding: 10px 15px;
      margin-bottom: 20px;
      font-style: italic;
    }
    .vouchers-container {
      display: grid;
      grid-template-columns: 1fr;
      gap: 15px;
    }
    @media print {
      .voucher-card {
        page-break-inside: avoid;
      }
    }
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 11px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">PNG GREEN FEES SYSTEM</div>
    <p style="color: #6b7280; margin: 5px 0;">Bulk Voucher Export</p>
  </div>

  <div class="summary">
    <h3>Voucher Summary</h3>
    <p><strong>Total Vouchers:</strong> ${vouchers.length}</p>
    <p><strong>Total Value:</strong> PGK ${vouchers.reduce((sum, v) => sum + v.amount, 0).toFixed(2)}</p>
    <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
  </div>

  ${message ? `<div class="message">${message}</div>` : ""}

  <div class="vouchers-container">
    ${voucherHtmls.join("")}
  </div>

  <div class="footer">
    <p>PNG Green Fees System - Green Fees Collection & Management</p>
    <p>These vouchers are valid for single use only. Present at immigration checkpoint.</p>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const { passportIds, email, message }: SendBulkRequest = await req.json();
    if (!email || !Array.isArray(passportIds) || passportIds.length === 0) {
      return json({ error: "email and non-empty passportIds[] required" }, 400);
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

    // Fetch individual purchases (vouchers) for the given passport IDs
    const { data: purchases, error: fetchError } = await supabase
      .from("individual_purchases")
      .select(`
        id,
        voucher_code,
        passport_number,
        amount,
        valid_until,
        status,
        passport:passports(
          given_name,
          surname,
          nationality
        )
      `)
      .in("passport_id", passportIds);

    if (fetchError) {
      return json({ error: "Failed to fetch vouchers", details: fetchError.message }, 500);
    }

    if (!purchases || purchases.length === 0) {
      return json({ error: "No vouchers found for the specified passport IDs" }, 404);
    }

    // Transform data for HTML generation
    const vouchers: VoucherData[] = purchases.map((p: any) => ({
      id: p.id,
      voucher_code: p.voucher_code,
      passport_number: p.passport_number,
      given_name: p.passport?.given_name || "N/A",
      surname: p.passport?.surname || "N/A",
      nationality: p.passport?.nationality || "N/A",
      amount: p.amount,
      valid_until: p.valid_until,
      status: p.status,
    }));

    // Generate HTML with all vouchers
    const vouchersHtml = await generateBulkVouchersHTML(vouchers, message);

    // Create email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">PNG Green Fees - Bulk Vouchers</h2>
        <p>Dear Customer,</p>
        <p>Please find attached your bulk voucher export containing <strong>${vouchers.length} voucher(s)</strong>.</p>

        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #86efac;">
          <p style="margin: 5px 0;"><strong>Total Vouchers:</strong> ${vouchers.length}</p>
          <p style="margin: 5px 0;"><strong>Total Value:</strong> PGK ${vouchers.reduce((sum, v) => sum + v.amount, 0).toFixed(2)}</p>
        </div>

        ${message ? `<p><strong>Message:</strong> ${message}</p>` : ""}

        <p>Each voucher contains a QR code for validation at the immigration checkpoint.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

        <p style="font-size: 12px; color: #6b7280;">
          This email was sent by PNG Green Fees System.<br>
          Vouchers are valid for single use only.
        </p>
      </div>

      <div style="margin-top: 40px; border-top: 2px solid #10b981; padding-top: 20px;">
        <h3 style="color: #10b981; text-align: center;">Voucher Details</h3>
        ${vouchersHtml}
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
        subject: `PNG Green Fees - ${vouchers.length} Voucher(s) Attached`,
        html: emailHtml,
        tags: [{ name: "type", value: "bulk-vouchers" }],
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
      subject: `PNG Green Fees - ${vouchers.length} Voucher(s) Attached`,
      voucher_count: vouchers.length,
      total_amount: vouchers.reduce((sum, v) => sum + v.amount, 0),
      status: "sent",
      sent_at: new Date().toISOString(),
    }).catch((e) => {
      console.warn("Failed to log email:", e);
    });

    return json({
      success: true,
      count: vouchers.length,
      emailId: emailResult?.id,
      message: `${vouchers.length} voucher(s) sent to ${email}`
    });
  } catch (e) {
    console.error("send-bulk-passport-vouchers error:", e);
    return json({ error: String(e) }, 500);
  }
});
