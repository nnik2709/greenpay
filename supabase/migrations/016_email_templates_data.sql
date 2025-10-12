-- Email Templates Data Migration
-- Insert all email templates from the Laravel system

INSERT INTO email_templates (name, subject, body, variables, created_at, updated_at) VALUES

-- Individual Passport Voucher Email
('individual-passport-voucher', 'Your Passport Voucher', 
'<p>Dear Customer,</p>

<p>Your passport voucher is attached to this email.</p>

<p><strong>Your Voucher Includes</strong></p>
<ul>
  <li>Passport information already linked to the voucher</li>
  <li>Unique voucher code for redemption</li>
  <li>Voucher value and validity details</li>
  <li>QR code for easy processing</li>
</ul>

<p><strong>How to Use Your Voucher</strong></p>
<ol>
  <li>Present your voucher at the counter</li>
  <li>Show valid identification</li>
  <li>Your passport details are already linked</li>
  <li>Complete your transaction</li>
</ol>

<p><strong>Important</strong></p>
<ul>
  <li>Keep your voucher safe</li>
  <li>This voucher can only be used once</li>
  <li>Bring valid ID when using the voucher</li>
  <li>Contact us if you need help</li>
</ul>

<p>Thank you for choosing Climate Change and Development Authority.</p>',
'[]', NOW(), NOW()),

-- Invoice Email
('invoice-email', 'Invoice {invoice_number} - Climate Change Development Authority',
'<p>Dear {{ $invoice->client_name }},</p>

<p>Please find attached your invoice.</p>

<p><strong>Invoice Details</strong></p>
<ul>
  <li>Invoice Number: {{ $invoice->invoice_number }}</li>
  <li>Invoice Date: {{ $invoice->invoice_date->format(''d M Y'') }}</li>
  <li>Due Date: {{ $invoice->due_date->format(''d M Y'') }}</li>
  @if($invoice->purchase_order_reference)
  <li>PO Reference: {{ $invoice->purchase_order_reference }}</li>
  @endif
  <li>Total Vouchers: {{ number_format($invoice->total_vouchers) }}</li>
  <li>Voucher Value: PGK {{ number_format($invoice->voucher_value, 2) }} each</li>
  <li>Validity: {{ $invoice->valid_from->format(''d M Y'') }} - {{ $invoice->valid_until->format(''d M Y'') }}</li>
  <li>Amount Due: PGK {{ number_format($invoice->amount_after_discount, 2) }}</li>
  <li>Payment Mode: {{ ucfirst($invoice->payment_mode) }}</li>
  <li>Amount Collected: PGK {{ number_format($invoice->collected_amount, 2) }}</li>
  @if($invoice->returned_amount > 0)
  <li>Change Given: PGK {{ number_format($invoice->returned_amount, 2) }}</li>
  @endif
</ul>

<p>If you have any questions, please reply to this email.</p>

<p>Thank you,<br>
Climate Change Development Authority</p>',
'["invoice"]', NOW(), NOW()),

-- New User Notification
('new-user-notification', 'New User Created - {app.name}',
'<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New User Created - CCDA Green Fee Platform</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #136a42;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .notification-title {
            color: #136a42;
            font-size: 24px;
            font-weight: bold;
            margin: 15px 0 10px 0;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
            margin-bottom: 0;
        }
        .content-section {
            margin-bottom: 25px;
        }
        .user-details-box {
            background-color: #f8f9fa;
            border: 2px solid #136a42;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .detail-item {
            margin-bottom: 15px;
        }
        .detail-label {
            font-weight: bold;
            color: #136a42;
            display: inline-block;
            width: 120px;
        }
        .detail-value {
            font-family: ''Courier New'', monospace;
            background-color: #fff;
            padding: 5px 10px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1 class="notification-title">New User Created</h1>
            <p class="subtitle">A new user account has been added to CCDA Green Fee Platform</p>
        </div>

        <div class="content-section">
            <p>Hello Admin,</p>
            
            <p>A new user account has been successfully created in CCDA Green Fee Platform.</p>
            
            <p>Here are the details of the new user:</p>
        </div>

        <div class="user-details-box">
            <div class="detail-item">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ $newUser->name }}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ $newUser->email }}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Role:</span>
                <span class="detail-value">{{ $newUser->role ? $newUser->role->name : ''User'' }}</span>
            </div>
        </div>

        <div class="content-section">
            <p>This is an automated notification. The new user has been sent a welcome email with their login credentials.</p>
            
            <p>If you have any concerns about this new account, please review it in the admin panel.</p>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; {{ date(''Y'') }} CCDA Green Fee Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
'["newUser", "createdBy"]', NOW(), NOW()),

-- Passport Bulk Vouchers
('passport-bulk-vouchers', 'Your Passport Vouchers',
'<p>Dear Customer,</p>

<p>Your passport vouchers are attached to this email.</p>

<p><strong>Your Vouchers Include:</strong></p>
<ul>
  <li>Passport information already linked to each voucher</li>
  <li>Unique voucher codes for redemption</li>
  <li>Voucher value and validity details</li>
  <li>QR codes for easy processing</li>
</ul>

<p><strong>How to Use Your Vouchers:</strong></p>
<ol>
  <li>Present your voucher at the counter</li>
  <li>Show valid identification</li>
  <li>Your passport details are already linked</li>
  <li>Complete your transaction</li>
</ol>

<p><strong>Important:</strong></p>
<ul>
  <li>Keep your vouchers safe</li>
  <li>Each voucher can only be used once</li>
  <li>Bring valid ID when using vouchers</li>
  <li>Contact us if you need help</li>
</ul>

<p>Thank you for choosing Climate Change and Development Authority.</p>',
'[]', NOW(), NOW()),

-- Passport Purchase Images
('passport-purchase-images', 'Your Vouchers',
'<p>Dear Customer,</p>

<p>Thank you for your purchase.<br>
  Attached are your voucher cards in image format. Each voucher contains the amount, validity date, and a unique voucher code for secure and exclusive use.
</p>

<p>
  Please ensure these vouchers are kept confidential and used only by the intended recipient, as they are non-transferable and subject to the terms provided at the time of purchase.
</p>

<p>
  If you need printed copies, would like a usage summary, or are interested in future purchases, please feel free to get in touch with us at any time.
</p>

<p>We appreciate your trust and look forward to serving you again.</p>

<p>
  Warm regards,<br>
  <strong>Climate Change and Development Authority</strong><br>
</p>',
'[]', NOW(), NOW()),

-- Quotation Email
('quotation-email', 'Quotation #{quotation_number} - Climate Change & Development Authority',
'<p>Dear {{ $quotation->client_name }},</p>

<p>Please find attached the quotation you requested.</p>

<p><strong>Quotation Details</strong></p>
<ul>
  <li>Quotation #: {{ $quotation->quotation_number }}</li>
  <li>Subject: {{ $quotation->subject }}</li>
  <li>Total Amount: PGK {{ number_format($quotation->total_amount, 2) }}</li>
  <li>Service: Government Exit Pass Vouchers</li>
  <li>Quantity: {{ $quotation->total_vouchers }} vouchers</li>
  <li>Unit Price: PGK {{ number_format($quotation->voucher_value, 2) }}</li>
  <li>Valid Until: {{ $quotation->validity_date->format(''d M Y'') }}</li>
  @if($quotation->notes)
  <li>Notes: {{ $quotation->notes }}</li>
  @endif
  @if($quotation->purchase_order_reference ?? false)
  <li>PO Reference: {{ $quotation->purchase_order_reference }}</li>
  @endif
</ul>

<p>The attached PDF includes the full terms, details and the complete pricing breakdown.</p>

<p>For any questions or changes, reply to this email.</p>

<p>Thank you,<br>
Climate Change & Development Authority</p>',
'["quotation"]', NOW(), NOW()),

-- Ticket Created
('ticket_created', 'New Ticket Created: {ticket.subject}',
'<h2>A New Support Ticket Has Been Submitted</h2>

<p>Hello Support Team,</p>

<p>
    A new support ticket has been submitted by <strong>{{ $ticket->user->name ?? ''a user'' }}</strong>.
    Below are the details:
</p>

<table cellpadding="6" cellspacing="0" border="0">
    <tr>
        <td><strong>Subject:</strong></td>
        <td>{{ $ticket->subject }}</td>
    </tr>
    <tr>
        <td><strong>Category:</strong></td>
        <td>{{ $ticket->category }}</td>
    </tr>
    <tr>
        <td><strong>Priority:</strong></td>
        <td>{{ $ticket->priority }}</td>
    </tr>
    <tr>
        <td><strong>Submitted At:</strong></td>
        <td>{{ $ticket->created_at->format(''F j, Y \\a\\t h:i A'') }}</td>
    </tr>
</table>

<p><strong>Description:</strong></p>
<p style="background-color: #f8f9fa; padding: 10px; border-left: 4px solid #66b958;">
    {{ $ticket->description }}
</p>

<p>Thank you,<br>
{{ config(''app.name'') }} Support System</p>',
'["ticket"]', NOW(), NOW()),

-- Voucher Images
('voucher-images', 'Your Vouchers',
'<p>Dear Customer,</p>

<p>Your passport vouchers are attached to this email.</p>

@if($customMessage)
<p><strong>Message:</strong><br>
{{ $customMessage }}
</p>
@endif

<p><strong>How to Register Your Voucher:</strong></p>

<ol>
  <li>Scan the QR code on your voucher with your phone camera</li>
  <li>Enter your passport number when prompted</li>
  <li>Fill in your personal details (name, nationality, date of birth, etc.)</li>
  <li>Submit the form</li>
</ol>

<p><strong>What You Need:</strong></p>
<ul>
  <li>Your passport number</li>
  <li>Your full name and nationality</li>
  <li>Date of birth and gender</li>
  <li>Family information (father, mother, spouse names)</li>
  <li>Your current address</li>
</ul>

<p><strong>Important:</strong></p>
<ul>
  <li>Keep your voucher safe</li>
  <li>Each voucher can only be used once</li>
  <li>Contact us if you need help</li>
</ul>

<p>Thank you for choosing Climate Change and Development Authority.</p>',
'["customMessage"]', NOW(), NOW()),

-- Welcome Email
('welcome', 'Welcome to {app.name} - Your Account Details',
'<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to CCDA Green Fee Platform</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .email-container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #136a42;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .welcome-title {
            color: #136a42;
            font-size: 24px;
            font-weight: bold;
            margin: 15px 0 10px 0;
        }
        .subtitle {
            color: #666;
            font-size: 16px;
            margin-bottom: 0;
        }
        .content-section {
            margin-bottom: 25px;
        }
        .credentials-box {
            background-color: #f8f9fa;
            border: 2px solid #136a42;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .credential-item {
            margin-bottom: 15px;
        }
        .credential-label {
            font-weight: bold;
            color: #136a42;
            display: inline-block;
            width: 120px;
        }
        .credential-value {
            font-family: ''Courier New'', monospace;
            background-color: #fff;
            padding: 5px 10px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        .login-button {
            display: inline-block;
            background-color: #0d9d2aff;
            color: #fff !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
        }
        .important-note {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 15px;
            margin: 20px 0;
        }
        .important-note strong {
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1 class="welcome-title">Welcome to CCDA Green Fee Platform!</h1>
            <p class="subtitle">Your account has been successfully created</p>
        </div>

        <div class="content-section">
            <p>Dear <strong>{{ $user->name }}</strong>,</p>
            
            <p>Welcome to CCDA Green Fee Platform! Your account has been successfully created and you can now access our system.</p>
            
            <p>Here are your login credentials:</p>
        </div>

        <div class="credentials-box">
            <div class="credential-item">
                <span class="credential-label">Email:</span>
                <span class="credential-value">{{ $user->email }}</span>
            </div>
            @if($password)
            <div class="credential-item">
                <span class="credential-label">Password:</span>
                <span class="credential-value">{{ $password }}</span>
            </div>
            @endif
        </div>

        <div class="important-note">
            <strong>Important:</strong> Please change your password after your first login for security purposes.
        </div>

        <div style="text-align: center;">
            <a href="{{ $loginUrl }}" class="login-button">Login to Your Account</a>
        </div>

        <div class="content-section">
            <p>If you have any questions or need assistance, please don''t hesitate to contact our support team.</p>
            
            <p>Thank you for choosing CCDA Green Fee Platform!</p>
            
            <p>Best regards,<br>
            <strong>The CCDA Green Fee Platform Team</strong></p>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>&copy; {{ date(''Y'') }} CCDA Green Fee Platform. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
'["user", "password", "loginUrl"]', NOW(), NOW());

-- Update existing templates if they exist
UPDATE email_templates SET 
    subject = 'Your Passport Voucher',
    body = '<p>Dear Customer,</p>

<p>Your passport voucher is attached to this email.</p>

<p><strong>Your Voucher Includes</strong></p>
<ul>
  <li>Passport information already linked to the voucher</li>
  <li>Unique voucher code for redemption</li>
  <li>Voucher value and validity details</li>
  <li>QR code for easy processing</li>
</ul>

<p><strong>How to Use Your Voucher</strong></p>
<ol>
  <li>Present your voucher at the counter</li>
  <li>Show valid identification</li>
  <li>Your passport details are already linked</li>
  <li>Complete your transaction</li>
</ol>

<p><strong>Important</strong></p>
<ul>
  <li>Keep your voucher safe</li>
  <li>This voucher can only be used once</li>
  <li>Bring valid ID when using the voucher</li>
  <li>Contact us if you need help</li>
</ul>

<p>Thank you for choosing Climate Change and Development Authority.</p>',
    variables = '[]',
    updated_at = NOW()
WHERE name = 'individual-passport-voucher';

