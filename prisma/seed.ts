import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin' },
  });

  const agentRole = await prisma.role.upsert({
    where: { name: 'Agent' },
    update: {},
    create: { name: 'Agent' },
  });

  const revenueManagerRole = await prisma.role.upsert({
    where: { name: 'Revenue Manager' },
    update: {},
    create: { name: 'Revenue Manager' },
  });

  const auditorRole = await prisma.role.upsert({
    where: { name: 'Auditor' },
    update: {},
    create: { name: 'Auditor' },
  });

  console.log('✅ Roles created');

  // Create users with different roles
  const hashedPassword = await bcrypt.hash('ChangeMe123!', 10);
  
  const users = await Promise.all([
    // Admin User
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: 'John Admin',
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        isActive: true,
        roleId: adminRole.id,
        profile: {
          create: {
            phone: '+675 123 4567',
            address: 'Port Moresby, NCD',
            bio: 'System Administrator'
          }
        }
      },
    }),
    // Agent User
    prisma.user.upsert({
      where: { email: 'agent@example.com' },
      update: {},
      create: {
        name: 'Sarah Agent',
        email: 'agent@example.com',
        passwordHash: hashedPassword,
        isActive: true,
        roleId: agentRole.id,
        profile: {
          create: {
            phone: '+675 234 5678',
            address: 'Lae, Morobe Province',
            bio: 'Passport Processing Agent'
          }
        }
      },
    }),
    // Revenue Manager
    prisma.user.upsert({
      where: { email: 'revenue@example.com' },
      update: {},
      create: {
        name: 'Michael Revenue',
        email: 'revenue@example.com',
        passwordHash: hashedPassword,
        isActive: true,
        roleId: revenueManagerRole.id,
        profile: {
          create: {
            phone: '+675 345 6789',
            address: 'Madang, Madang Province',
            bio: 'Revenue Management Specialist'
          }
        }
      },
    }),
    // Auditor
    prisma.user.upsert({
      where: { email: 'auditor@example.com' },
      update: {},
      create: {
        name: 'Lisa Auditor',
        email: 'auditor@example.com',
        passwordHash: hashedPassword,
        isActive: true,
        roleId: auditorRole.id,
        profile: {
          create: {
            phone: '+675 456 7890',
            address: 'Goroka, Eastern Highlands',
            bio: 'Financial Auditor'
          }
        }
      },
    }),
  ]);

  console.log('✅ Users created');

  // Create bulk passport uploads
  const bulkUploads = await Promise.all([
    prisma.bulkPassportUpload.create({
      data: {
        originalName: 'corporate_passports_batch_1.xlsx',
        totalRows: 25,
        processedRows: 25,
        totalAmount: 12500.00,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
      },
    }),
    prisma.bulkPassportUpload.create({
      data: {
        originalName: 'individual_passports_batch_2.xlsx',
        totalRows: 15,
        processedRows: 15,
        totalAmount: 7500.00,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
      },
    }),
  ]);

  console.log('✅ Bulk uploads created');

  // Create passports
  const passportData = [
    // Individual passports
    {
      type: 'Individual',
      code: 'IND001',
      nationality: 'Papua New Guinea',
      passportNo: 'P123456789',
      surname: 'Doe',
      givenName: 'John',
      dob: new Date('1985-03-15'),
      sex: 'M',
      placeOfBirth: 'Port Moresby',
      placeOfIssue: 'Port Moresby',
      dateOfIssue: new Date('2020-01-15'),
      dateOfExpiry: new Date('2030-01-15'),
      fileNumber: 'FILE001',
      photoPath: 'passport_images/john_doe.jpg',
      signaturePath: 'signatures/john_doe.png',
      bulkUploadId: bulkUploads[1].id,
    },
    {
      type: 'Individual',
      code: 'IND002',
      nationality: 'Papua New Guinea',
      passportNo: 'P987654321',
      surname: 'Smith',
      givenName: 'Jane',
      dob: new Date('1990-07-22'),
      sex: 'F',
      placeOfBirth: 'Lae',
      placeOfIssue: 'Lae',
      dateOfIssue: new Date('2019-06-10'),
      dateOfExpiry: new Date('2029-06-10'),
      fileNumber: 'FILE002',
      photoPath: 'passport_images/jane_smith.jpg',
      signaturePath: 'signatures/jane_smith.png',
      bulkUploadId: bulkUploads[1].id,
    },
    {
      type: 'Individual',
      code: 'IND003',
      nationality: 'Papua New Guinea',
      passportNo: 'P456789123',
      surname: 'Johnson',
      givenName: 'Bob',
      dob: new Date('1978-11-08'),
      sex: 'M',
      placeOfBirth: 'Madang',
      placeOfIssue: 'Madang',
      dateOfIssue: new Date('2021-03-20'),
      dateOfExpiry: new Date('2031-03-20'),
      fileNumber: 'FILE003',
      photoPath: 'passport_images/bob_johnson.jpg',
      signaturePath: 'signatures/bob_johnson.png',
      bulkUploadId: bulkUploads[1].id,
    },
    {
      type: 'Individual',
      code: 'IND004',
      nationality: 'Papua New Guinea',
      passportNo: 'P789123456',
      surname: 'Wilson',
      givenName: 'Alice',
      dob: new Date('1992-05-14'),
      sex: 'F',
      placeOfBirth: 'Goroka',
      placeOfIssue: 'Goroka',
      dateOfIssue: new Date('2022-08-15'),
      dateOfExpiry: new Date('2032-08-15'),
      fileNumber: 'FILE004',
      photoPath: 'passport_images/alice_wilson.jpg',
      signaturePath: 'signatures/alice_wilson.png',
      bulkUploadId: bulkUploads[1].id,
    },
    // Corporate passports
    {
      type: 'Corporate',
      code: 'CORP001',
      nationality: 'Papua New Guinea',
      passportNo: 'C123456789',
      surname: 'Brown',
      givenName: 'David',
      dob: new Date('1980-09-30'),
      sex: 'M',
      placeOfBirth: 'Port Moresby',
      placeOfIssue: 'Port Moresby',
      dateOfIssue: new Date('2023-01-10'),
      dateOfExpiry: new Date('2033-01-10'),
      fileNumber: 'CORP001',
      photoPath: 'passport_images/david_brown.jpg',
      signaturePath: 'signatures/david_brown.png',
      bulkUploadId: bulkUploads[0].id,
    },
  ];

  const passports = await Promise.all(
    passportData.map(data => prisma.passport.create({ data }))
  );

  console.log('✅ Passports created');

  // Create voucher batches
  const voucherBatches = await Promise.all([
    prisma.voucherBatch.create({
      data: {
        totalVouchers: 50,
        voucherValue: 100.00,
        totalAmount: 5000.00,
        discount: 0.00,
        amountAfterDiscount: 5000.00,
        collectedAmount: 5000.00,
        returnedAmount: 0.00,
        paymentMode: 'card',
        cardNumber: '****1234',
        cardHolder: 'Corporate Client',
        cvv: '123',
        expiryDate: '12/25',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        shareWithEmail: 'corporate@example.com',
        shareWithNumber: '+675 123 4567',
        purchaseOrderReference: 'PO-2024-001',
      },
    }),
    prisma.voucherBatch.create({
      data: {
        totalVouchers: 30,
        voucherValue: 200.00,
        totalAmount: 6000.00,
        discount: 500.00,
        amountAfterDiscount: 5500.00,
        collectedAmount: 5500.00,
        returnedAmount: 0.00,
        paymentMode: 'cash',
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2024-12-31'),
        shareWithEmail: 'individual@example.com',
        shareWithNumber: '+675 234 5678',
        purchaseOrderReference: 'PO-2024-002',
      },
    }),
  ]);

  console.log('✅ Voucher batches created');

  // Create vouchers
  const voucherData = [];
  for (let i = 1; i <= 20; i++) {
    voucherData.push({
      voucherBatchId: voucherBatches[0].id,
      code: `VOUCHER${Date.now()}${i.toString().padStart(3, '0')}`,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      value: 100.00,
      status: i <= 15 ? 'active' : 'used',
      usedAt: i <= 15 ? null : new Date('2024-06-15'),
      passportId: i <= 4 ? passports[i - 1].id : null,
    });
  }

  for (let i = 21; i <= 30; i++) {
    voucherData.push({
      voucherBatchId: voucherBatches[1].id,
      code: `VOUCHER${Date.now()}${i.toString().padStart(3, '0')}`,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      value: 200.00,
      status: i <= 25 ? 'active' : 'expired',
      usedAt: i <= 25 ? null : new Date('2024-05-20'),
      passportId: i <= 25 ? passports[4].id : null,
    });
  }

  const vouchers = await Promise.all(
    voucherData.map(data => prisma.voucher.create({ data }))
  );

  console.log('✅ Vouchers created');

  // Create payments
  const paymentData = [
    {
      code: `PAY${Date.now()}001`,
      totalVouchers: 5,
      voucherValue: 100.00,
      totalAmount: 500.00,
      discount: 0.00,
      amountAfterDiscount: 500.00,
      collectedAmount: 500.00,
      returnedAmount: 0.00,
      paymentMode: 'cash',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      passportId: passports[0].id,
    },
    {
      code: `PAY${Date.now()}002`,
      totalVouchers: 3,
      voucherValue: 200.00,
      totalAmount: 600.00,
      discount: 50.00,
      amountAfterDiscount: 550.00,
      collectedAmount: 550.00,
      returnedAmount: 0.00,
      paymentMode: 'card',
      cardNumber: '****1234',
      cardHolder: 'John Doe',
      cvv: '123',
      expiryDate: '12/25',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      passportId: passports[1].id,
    },
    {
      code: `PAY${Date.now()}003`,
      totalVouchers: 2,
      voucherValue: 100.00,
      totalAmount: 200.00,
      discount: 0.00,
      amountAfterDiscount: 200.00,
      collectedAmount: 200.00,
      returnedAmount: 0.00,
      paymentMode: 'cash',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      passportId: passports[2].id,
    },
    {
      code: `PAY${Date.now()}004`,
      totalVouchers: 10,
      voucherValue: 100.00,
      totalAmount: 1000.00,
      discount: 100.00,
      amountAfterDiscount: 900.00,
      collectedAmount: 900.00,
      returnedAmount: 0.00,
      paymentMode: 'card',
      cardNumber: '****5678',
      cardHolder: 'Alice Wilson',
      cvv: '456',
      expiryDate: '06/26',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
      passportId: passports[3].id,
    },
  ];

  const payments = await Promise.all(
    paymentData.map(data => prisma.payment.create({ data }))
  );

  console.log('✅ Payments created');

  // Create quotations for climate change exit pass services
  const quotationData = [
    {
      subject: 'Carbon Offset Certificate - Individual',
      description: 'Individual carbon offset certificate for climate change exit pass',
      amount: 50.00,
      status: 'pending',
    },
    {
      subject: 'Environmental Impact Assessment',
      description: 'Environmental impact assessment for corporate climate change exit pass',
      amount: 500.00,
      status: 'approved',
    },
    {
      subject: 'Climate Change Mitigation Fee',
      description: 'Climate change mitigation fee for high-emission travel',
      amount: 200.00,
      status: 'sent',
    },
    {
      subject: 'Green Technology Investment Certificate',
      description: 'Certificate for investment in green technology projects',
      amount: 1000.00,
      status: 'converted',
    },
    {
      subject: 'Renewable Energy Credit',
      description: 'Renewable energy credit for sustainable travel',
      amount: 75.00,
      status: 'pending',
    },
    {
      subject: 'Forest Conservation Contribution',
      description: 'Contribution to forest conservation programs',
      amount: 150.00,
      status: 'approved',
    },
  ];

  const quotations = await Promise.all(
    quotationData.map(data => prisma.quotation.create({ data }))
  );

  console.log('✅ Quotations created');

  // Create invoices for converted quotations
  await prisma.invoice.create({
    data: {
      quotationId: quotations[3].id,
      amount: 12000.00,
      status: 'paid',
    },
  });

  console.log('✅ Invoices created');

  // Create tickets
  const ticketData = [
    {
      subject: 'Login Issue',
      category: 'Technical',
      priority: 'High',
      status: 'Open',
      description: 'Unable to login to the system with correct credentials',
      userId: users[1].id,
    },
    {
      subject: 'Payment Problem',
      category: 'Billing',
      priority: 'Medium',
      status: 'InProgress',
      description: 'Payment not being processed correctly for voucher purchases',
      userId: users[2].id,
    },
    {
      subject: 'Voucher Not Working',
      category: 'Technical',
      priority: 'High',
      status: 'Resolved',
      description: 'Generated voucher codes are not being accepted at validation',
      userId: users[1].id,
    },
    {
      subject: 'Report Generation Error',
      category: 'Technical',
      priority: 'Low',
      status: 'Open',
      description: 'Revenue reports are not generating properly',
      userId: users[3].id,
    },
    {
      subject: 'Bulk Upload Failed',
      category: 'Technical',
      priority: 'Medium',
      status: 'Open',
      description: 'Excel file upload is failing for passport data',
      userId: users[0].id,
    },
  ];

  const tickets = await Promise.all(
    ticketData.map(data => prisma.ticket.create({ data }))
  );

  console.log('✅ Tickets created');

  // Create ticket responses
  const ticketResponses = await Promise.all([
    prisma.ticketResponse.create({
      data: {
        ticketId: tickets[0].id,
        responderId: users[0].id,
        message: 'Please try clearing your browser cache and cookies, then attempt to login again.',
      },
    }),
    prisma.ticketResponse.create({
      data: {
        ticketId: tickets[1].id,
        responderId: users[0].id,
        message: 'I have identified the issue with the payment gateway integration. A fix will be deployed within 24 hours.',
      },
    }),
    prisma.ticketResponse.create({
      data: {
        ticketId: tickets[2].id,
        responderId: users[0].id,
        message: 'The voucher validation issue has been resolved. All vouchers should now work correctly.',
      },
    }),
  ]);

  console.log('✅ Ticket responses created');

  // Create user sessions
  const sessions = await Promise.all([
    prisma.userSession.create({
      data: {
        userId: users[0].id,
        loginTime: new Date('2024-01-15T08:00:00Z'),
        logoutTime: new Date('2024-01-15T17:30:00Z'),
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    }),
    prisma.userSession.create({
      data: {
        userId: users[1].id,
        loginTime: new Date('2024-01-16T09:15:00Z'),
        logoutTime: null,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    }),
  ]);

  console.log('✅ User sessions created');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${users.length} (Admin, Agent, Revenue Manager, Auditor)`);
  console.log(`   - Passports: ${passports.length} (Individual & Corporate)`);
  console.log(`   - Vouchers: ${vouchers.length} (Active, Used, Expired)`);
  console.log(`   - Payments: ${payments.length} (Cash & Card)`);
  console.log(`   - Quotations: ${quotations.length} (Various statuses)`);
  console.log(`   - Tickets: ${tickets.length} (Support tickets)`);
  console.log(`   - Bulk Uploads: ${bulkUploads.length} (Corporate & Individual)`);
  console.log(`   - Voucher Batches: ${voucherBatches.length} (Different values)`);
  console.log(`   - Ticket Responses: ${ticketResponses.length} (Support responses)`);
  console.log(`   - User Sessions: ${sessions.length} (Login tracking)`);
  
  console.log('\n🔑 Login Credentials:');
  console.log('   - admin@example.com / ChangeMe123! (Admin)');
  console.log('   - agent@example.com / ChangeMe123! (Agent)');
  console.log('   - revenue@example.com / ChangeMe123! (Revenue Manager)');
  console.log('   - auditor@example.com / ChangeMe123! (Auditor)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
