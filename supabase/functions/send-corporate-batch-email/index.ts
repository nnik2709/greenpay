import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface CorporateVoucher {
  id: string;
  voucher_code: string;
  passport_number: string;
  amount: number;
  status: string;
  created_at: string;
}

interface BatchData {
  batch_id: string;
  company_name: string;
  total_amount: number;
  payment_method: string;
  created_at: string;
  vouchers: CorporateVoucher[];
}

Deno.serve(async (req: Request) => {
  try {
    const { batchId, recipientEmail } = await req.json();

    if (!batchId || !recipientEmail) {
      return new Response(
        JSON.stringify({ error: 'Batch ID and recipient email are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get batch data
    const { data: batchData, error: batchError } = await supabase
      .from('corporate_vouchers')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });

    if (batchError) {
      console.error('Error fetching batch data:', batchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch batch data', details: batchError.message }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!batchData || batchData.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Batch not found' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get company info from first voucher
    const firstVoucher = batchData[0];
    const companyName = firstVoucher.company_name || 'Unknown Company';
    const totalAmount = batchData.reduce((sum, voucher) => sum + voucher.amount, 0);
    const validCount = batchData.filter(v => v.status === 'valid').length;
    const usedCount = batchData.filter(v => v.status === 'used').length;

    // Generate email content
    const emailSubject = `Corporate Voucher Batch - ${companyName}`;
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Corporate Voucher Batch</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #16B67B; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .batch-info { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #16B67B; }
        .voucher-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .voucher-table th, .voucher-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .voucher-table th { background-color: #16B67B; color: white; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .status-valid { color: #16B67B; font-weight: bold; }
        .status-used { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PNG Green Fees - Corporate Voucher Batch</h1>
        </div>
        
        <div class="content">
            <h2>Corporate Voucher Batch Details</h2>
            
            <div class="batch-info">
                <h3>Batch Information</h3>
                <p><strong>Batch ID:</strong> ${batchId}</p>
                <p><strong>Company:</strong> ${companyName}</p>
                <p><strong>Date Created:</strong> ${new Date(firstVoucher.created_at).toLocaleDateString()}</p>
                <p><strong>Total Amount:</strong> PGK ${totalAmount.toFixed(2)}</p>
                <p><strong>Payment Method:</strong> ${firstVoucher.payment_method || 'Not specified'}</p>
                <p><strong>Status:</strong> ${validCount} Valid, ${usedCount} Used</p>
            </div>

            <h3>Voucher Details</h3>
            <table class="voucher-table">
                <thead>
                    <tr>
                        <th>Voucher Code</th>
                        <th>Passport Number</th>
                        <th>Amount</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${batchData.map(voucher => `
                        <tr>
                            <td>${voucher.voucher_code}</td>
                            <td>${voucher.passport_number}</td>
                            <td>PGK ${voucher.amount.toFixed(2)}</td>
                            <td class="status-${voucher.status}">${voucher.status.toUpperCase()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="batch-info">
                <h3>Instructions</h3>
                <p>This batch contains ${batchData.length} corporate vouchers for ${companyName}.</p>
                <p>Each voucher can be used once for PNG Green Fees payment.</p>
                <p>Please keep this email for your records.</p>
            </div>
        </div>

        <div class="footer">
            <p>PNG Green Fees System</p>
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>`;

    const emailText = `
PNG Green Fees - Corporate Voucher Batch

Batch Information:
- Batch ID: ${batchId}
- Company: ${companyName}
- Date Created: ${new Date(firstVoucher.created_at).toLocaleDateString()}
- Total Amount: PGK ${totalAmount.toFixed(2)}
- Payment Method: ${firstVoucher.payment_method || 'Not specified'}
- Status: ${validCount} Valid, ${usedCount} Used

Voucher Details:
${batchData.map(voucher => 
  `${voucher.voucher_code} - ${voucher.passport_number} - PGK ${voucher.amount.toFixed(2)} - ${voucher.status.toUpperCase()}`
).join('\n')}

Instructions:
This batch contains ${batchData.length} corporate vouchers for ${companyName}.
Each voucher can be used once for PNG Green Fees payment.
Please keep this email for your records.

PNG Green Fees System
This is an automated email. Please do not reply.
`;

    // For now, we'll simulate sending the email
    // In production, you would integrate with an email service like SendGrid, AWS SES, etc.
    console.log('Email would be sent to:', recipientEmail);
    console.log('Subject:', emailSubject);
    console.log('HTML Content Length:', emailHtml.length);
    console.log('Text Content Length:', emailText.length);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Log the email sending activity
    const { error: logError } = await supabase
      .from('email_logs')
      .insert({
        recipient_email: recipientEmail,
        subject: emailSubject,
        batch_id: batchId,
        company_name: companyName,
        voucher_count: batchData.length,
        total_amount: totalAmount,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Error logging email:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        batchId,
        recipientEmail,
        voucherCount: batchData.length,
        totalAmount
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-corporate-batch-email:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
