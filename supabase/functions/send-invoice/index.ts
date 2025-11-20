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

interface SendInvoiceRequest {
  invoiceId: string | number;
  email: string;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  payment_date?: string;
  payment_reference?: string;
  notes?: string;
  quotation: {
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
  };
}

async function generateInvoiceHTML(invoice: InvoiceData): Promise<string> {
  // Generate QR code for invoice reference
  const qrDataUrl = await QRCode.toDataURL(invoice.invoice_number, {
    width: 150,
    margin: 2,
  });

  const quotation = invoice.quotation;
  const discount = quotation.discount || 0;
  const amountAfterDiscount = quotation.amount_after_discount || quotation.total_amount;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
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
      border-bottom: 3px solid #3b82f6;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 16px;
      color: #6b7280;
    }
    .invoice-number {
      background: #3b82f6;
      color: white;
      padding: 10px 20px;
      display: inline-block;
      border-radius: 5px;
      font-size: 18px;
      font-weight: bold;
      margin: 20px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-paid { background: #d1fae5; color: #065f46; }
    .status-overdue { background: #fee2e2; color: #991b1b; }
    .info-section {
      margin: 20px 0;
    }
    .info-box {
      margin-bottom: 20px;
    }
    .info-box h3 {
      color: #3b82f6;
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
      border-bottom: 2px solid #3b82f6;
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
      border-top: 2px solid #3b82f6;
      font-weight: bold;
      font-size: 18px;
      color: #3b82f6;
      margin-top: 10px;
      padding-top: 10px;
    }
    .payment-info {
      margin-top: 30px;
      padding: 15px;
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
    }
    .payment-info h3 {
      margin-top: 0;
      color: #3b82f6;
    }
    .notes-section {
      margin-top: 20px;
      padding: 15px;
      background: #f9fafb;
      border-left: 4px solid #6b7280;
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
    <div class="invoice-number">INVOICE ${invoice.invoice_number}</div>
    <br>
    <span class="status-badge status-${invoice.status}">${invoice.status}</span>
  </div>

  <div class="info-section">
    <div class="info-box">
      <h3>Bill To:</h3>
      <p><strong>${quotation.company_name}</strong></p>
      ${quotation.contact_person ? `<p>Attn: ${quotation.contact_person}</p>` : ""}
      ${quotation.contact_email ? `<p>Email: ${quotation.contact_email}</p>` : ""}
      ${quotation.contact_phone ? `<p>Phone: ${quotation.contact_phone}</p>` : ""}
    </div>

    <div class="info-box">
      <h3>Invoice Details:</h3>
      <p><strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
      <p><strong>Due Date:</strong> ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Upon Receipt"}</p>
      <p><strong>Reference:</strong> ${quotation.quotation_number}</p>
      ${invoice.payment_reference ? `<p><strong>Payment Ref:</strong> ${invoice.payment_reference}</p>` : ""}
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
          <small style="color: #6b7280;">As per quotation ${quotation.quotation_number}</small>
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
    <div class="grand-total">AMOUNT DUE: PGK ${amountAfterDiscount.toFixed(2)}</div>
  </div>

  <div class="payment-info">
    <h3>Payment Information</h3>
    <p><strong>Bank:</strong> Bank of South Pacific</p>
    <p><strong>Account Name:</strong> PNG Green Fees Collection</p>
    <p><strong>Account Number:</strong> 1000123456</p>
    <p><strong>Reference:</strong> ${invoice.invoice_number}</p>
  </div>

  ${invoice.notes ? `
  <div class="notes-section">
    <h3 style="margin-top: 0; color: #374151;">Notes:</h3>
    <p>${invoice.notes}</p>
  </div>
  ` : ""}

  <div class="qr-section">
    <p style="font-size: 12px; margin-bottom: 8px;"><strong>Invoice Reference:</strong></p>
    <img src="${qrDataUrl}" alt="QR Code" />
    <p style="font-size: 11px; color: #6b7280; margin-top: 8px;">Scan for verification</p>
  </div>

  <div class="footer">
    <p>PNG Green Fees System - Green Fees Collection & Management</p>
    <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
    <p style="margin-top: 10px;">Please include invoice number ${invoice.invoice_number} with your payment.</p>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const { invoiceId, email }: SendInvoiceRequest = await req.json();
    if (!invoiceId || !email) {
      return json({ error: "invoiceId and email are required" }, 400);
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

    // Fetch invoice with related quotation data
    const { data: invoice, error: fetchError } = await supabase
      .from("invoices")
      .select(`
        *,
        quotation:quotations(
          quotation_number,
          company_name,
          contact_person,
          contact_email,
          contact_phone,
          number_of_passports,
          price_per_passport,
          total_amount,
          discount,
          amount_after_discount
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (fetchError || !invoice) {
      return json({ error: "Invoice not found", details: fetchError?.message }, 404);
    }

    // Generate HTML content for the invoice
    const invoiceHtml = await generateInvoiceHTML(invoice);

    // Create email HTML with invoice embedded
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Invoice from PNG Green Fees System</h2>
        <p>Dear ${invoice.quotation.contact_person || invoice.quotation.company_name},</p>
        <p>Please find attached your invoice <strong>${invoice.invoice_number}</strong>.</p>

        <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p style="margin: 5px 0;"><strong>Company:</strong> ${invoice.quotation.company_name}</p>
          <p style="margin: 5px 0;"><strong>Amount Due:</strong> PGK ${(invoice.quotation.amount_after_discount || invoice.quotation.total_amount).toFixed(2)}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : "Upon Receipt"}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="text-transform: uppercase;">${invoice.status}</span></p>
        </div>

        <p>Please ensure payment is made by the due date to avoid any delays in voucher issuance.</p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">

        <p style="font-size: 12px; color: #6b7280;">
          This email was sent by PNG Green Fees System.<br>
          Invoice Reference: ${invoice.invoice_number}
        </p>
      </div>

      <div style="margin-top: 40px; border-top: 2px solid #3b82f6; padding-top: 20px;">
        <h3 style="color: #3b82f6; text-align: center;">Full Invoice Document</h3>
        ${invoiceHtml}
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
        subject: `Invoice ${invoice.invoice_number} - PNG Green Fees`,
        html: emailHtml,
        tags: [{ name: "type", value: "invoice" }],
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
      subject: `Invoice ${invoice.invoice_number} - PNG Green Fees`,
      status: "sent",
      sent_at: new Date().toISOString(),
    }).catch((e) => {
      console.warn("Failed to log email:", e);
    });

    return json({
      success: true,
      invoiceId,
      emailId: emailResult?.id,
      message: `Invoice sent to ${email}`
    });
  } catch (e) {
    console.error("send-invoice error:", e);
    return json({ error: String(e) }, 500);
  }
});
