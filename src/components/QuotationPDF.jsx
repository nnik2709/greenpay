import React from 'react';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download, Send } from 'lucide-react';

/**
 * Enhanced Quotation PDF Generator
 * Based on Laravel template with CCDA branding, T&C, and signature box
 */
const QuotationPDF = ({ quotation, onEmailClick }) => {

  const generatePDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Colors (Laravel template colors)
    const greenPrimary = [102, 185, 88]; // #66b958
    const greenDark = [44, 85, 48]; // #2c5530
    const gray = [102, 102, 102];
    const lightGray = [248, 249, 250];

    let yPos = margin;

    // Helper function to add border
    const addBorder = () => {
      doc.setDrawColor(...greenPrimary);
      doc.setLineWidth(0.5);
      doc.rect(margin - 5, margin - 5, contentWidth + 10, pageHeight - (margin * 2) + 10);
    };

    // Add border
    addBorder();

    // Header - QUOTATION Title
    doc.setFontSize(24);
    doc.setTextColor(...greenDark);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION', pageWidth / 2, yPos + 10, { align: 'center' });

    yPos += 20;

    // Header border line
    doc.setDrawColor(...greenPrimary);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos, pageWidth - margin, yPos);

    yPos += 10;

    // Quotation Number and Subject
    doc.setFontSize(10);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'bold');
    doc.text('Quotation #:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.quotation_number || 'N/A', margin + 30, yPos);

    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Subject:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.subject || 'Government Exit Pass Vouchers', margin + 30, yPos);

    yPos += 7;

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.created_at ? new Date(quotation.created_at).toLocaleDateString() : new Date().toLocaleDateString(), margin + 30, yPos);

    yPos += 12;

    // Two-column layout: FROM and TO
    const leftColX = margin;
    const rightColX = pageWidth / 2 + 5;
    const colStartY = yPos;

    // FROM Section
    doc.setFillColor(...lightGray);
    doc.rect(leftColX, colStartY, (pageWidth / 2) - margin - 10, 45, 'F');
    doc.setDrawColor(...greenPrimary);
    doc.setLineWidth(1);
    doc.line(leftColX, colStartY, leftColX, colStartY + 45);

    doc.setFontSize(9);
    doc.setTextColor(...greenDark);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION FROM:', leftColX + 3, colStartY + 5);

    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'bold');
    doc.text('Climate Change & Development Authority', leftColX + 3, colStartY + 12);

    doc.setFont('helvetica', 'normal');
    doc.text('Email: info@ccda.gov.pg', leftColX + 3, colStartY + 18);
    doc.text('Phone: +675 323 0111', leftColX + 3, colStartY + 24);
    doc.text('Port Moresby, Papua New Guinea', leftColX + 3, colStartY + 30);

    // Issuing Officer (more prominent)
    if (quotation.creator_name || quotation.created_by_name) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...greenDark);
      doc.text('Issued By:', leftColX + 3, colStartY + 36);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      doc.text(quotation.creator_name || quotation.created_by_name, leftColX + 20, colStartY + 36);
    }

    // TO Section
    doc.setFillColor(...lightGray);
    doc.rect(rightColX, colStartY, (pageWidth / 2) - margin - 10, 45, 'F');
    doc.setDrawColor(...greenPrimary);
    doc.setLineWidth(1);
    doc.line(rightColX, colStartY, rightColX, colStartY + 45);

    doc.setFontSize(9);
    doc.setTextColor(...greenDark);
    doc.setFont('helvetica', 'bold');
    doc.text('QUOTATION TO:', rightColX + 3, colStartY + 5);

    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'bold');
    doc.text(quotation.client_name || 'N/A', rightColX + 3, colStartY + 12);

    doc.setFont('helvetica', 'normal');
    doc.text(`Email: ${quotation.client_email || 'N/A'}`, rightColX + 3, colStartY + 18);

    if (quotation.client_phone) {
      doc.text(`Phone: ${quotation.client_phone}`, rightColX + 3, colStartY + 24);
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Quotation Date:', rightColX + 3, colStartY + 30);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.created_at ? new Date(quotation.created_at).toLocaleDateString() : new Date().toLocaleDateString(), rightColX + 30, colStartY + 30);

    doc.setFont('helvetica', 'bold');
    doc.text('Valid Until:', rightColX + 3, colStartY + 36);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.validity_date ? new Date(quotation.validity_date).toLocaleDateString() : 'N/A', rightColX + 30, colStartY + 36);

    yPos = colStartY + 50;

    // Services Table Header
    doc.setFillColor(...greenPrimary);
    doc.rect(margin, yPos, contentWidth, 10, 'F');

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('SERVICE DESCRIPTION', margin + 2, yPos + 6.5);
    doc.text('UNIT PRICE', pageWidth - margin - 55, yPos + 6.5, { align: 'right' });
    doc.text('QUANTITY', pageWidth - margin - 35, yPos + 6.5, { align: 'right' });
    doc.text('TOTAL', pageWidth - margin - 2, yPos + 6.5, { align: 'right' });

    yPos += 10;

    // Service Row
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, yPos, contentWidth, 20, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'bold');
    doc.text('Government Exit Pass Vouchers', margin + 2, yPos + 6);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Official exit pass vouchers for government facility access', margin + 2, yPos + 11);

    doc.setFont('helvetica', 'normal');
    const unitPrice = parseFloat(quotation.voucher_value || 0).toFixed(2);
    const quantity = quotation.total_vouchers || 0;
    const total = parseFloat(quotation.total_amount || 0).toFixed(2);

    doc.text(`K ${unitPrice}`, pageWidth - margin - 55, yPos + 8, { align: 'right' });
    doc.text(`${quantity}`, pageWidth - margin - 35, yPos + 8, { align: 'right' });
    doc.text(`K ${total}`, pageWidth - margin - 2, yPos + 8, { align: 'right' });

    yPos += 20;

    // Subtotal
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal:', pageWidth - margin - 55, yPos + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(`K ${total}`, pageWidth - margin - 2, yPos + 5, { align: 'right' });

    yPos += 8;

    // Discount if applicable
    if (quotation.discount_percentage && quotation.discount_percentage > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Discount (${quotation.discount_percentage}%):`, pageWidth - margin - 55, yPos + 5);
      doc.setFont('helvetica', 'normal');
      const discountAmount = parseFloat(quotation.discount_amount || 0).toFixed(2);
      doc.text(`-K ${discountAmount}`, pageWidth - margin - 2, yPos + 5, { align: 'right' });
      yPos += 8;
    }

    // Total
    doc.setFillColor(...greenDark);
    doc.rect(pageWidth - margin - 60, yPos, 60, 10, 'F');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', pageWidth - margin - 55, yPos + 7);
    const finalAmount = parseFloat(quotation.amount_after_discount || quotation.total_amount || 0).toFixed(2);
    doc.text(`K ${finalAmount}`, pageWidth - margin - 2, yPos + 7, { align: 'right' });

    yPos += 15;

    // Terms & Conditions Section (if provided)
    if (quotation.terms_conditions) {
      yPos += 5;
      doc.setFillColor(...lightGray);
      doc.rect(margin, yPos, contentWidth, 'auto', 'F');
      doc.setDrawColor(...greenPrimary);
      doc.setLineWidth(1);
      doc.line(margin, yPos, margin, yPos + 30);

      doc.setFontSize(9);
      doc.setTextColor(...greenDark);
      doc.setFont('helvetica', 'bold');
      doc.text('TERMS & CONDITIONS:', margin + 3, yPos + 5);

      doc.setFontSize(8);
      doc.setTextColor(...gray);
      doc.setFont('helvetica', 'normal');
      const termsLines = doc.splitTextToSize(quotation.terms_conditions, contentWidth - 10);
      doc.text(termsLines, margin + 3, yPos + 11);

      yPos += (termsLines.length * 4) + 12;
    }

    // Notes Section (if provided)
    if (quotation.notes) {
      yPos += 5;
      doc.setFillColor(...lightGray);
      doc.rect(margin, yPos, contentWidth, 'auto', 'F');
      doc.setDrawColor(...greenPrimary);
      doc.setLineWidth(1);
      doc.line(margin, yPos, margin, yPos + 25);

      doc.setFontSize(9);
      doc.setTextColor(...greenDark);
      doc.setFont('helvetica', 'bold');
      doc.text('ADDITIONAL NOTES:', margin + 3, yPos + 5);

      doc.setFontSize(8);
      doc.setTextColor(...gray);
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(quotation.notes, contentWidth - 10);
      doc.text(notesLines, margin + 3, yPos + 11);

      yPos += (notesLines.length * 4) + 12;
    }

    // Footer Section
    yPos = pageHeight - 40;

    // Thank you message (left)
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', margin, yPos);

    // Signature box (right)
    doc.setDrawColor(...greenDark);
    doc.setLineWidth(0.5);
    doc.rect(pageWidth - margin - 60, yPos - 10, 60, 30);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...greenDark);
    doc.text('Authorized Signature:', pageWidth - margin - 58, yPos - 7);

    doc.setDrawColor(...gray);
    doc.setLineWidth(0.3);
    doc.line(pageWidth - margin - 58, yPos + 5, pageWidth - margin - 10, yPos + 5);

    // Issuing Officer Name (below signature line)
    if (quotation.creator_name || quotation.created_by_name) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...greenDark);
      doc.setFontSize(8);
      doc.text(quotation.creator_name || quotation.created_by_name, pageWidth - margin - 35, yPos + 10, { align: 'center' });
    }

    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...gray);
    doc.setFontSize(6);
    doc.text('Issuing Officer', pageWidth - margin - 35, yPos + 14, { align: 'center' });
    doc.text('Climate Change & Development Authority', pageWidth - margin - 35, yPos + 17, { align: 'center' });

    // Save PDF
    doc.save(`Quotation_${quotation.quotation_number || 'DRAFT'}.pdf`);
  };

  return (
    <div className="flex gap-2">
      <Button onClick={generatePDF} variant="outline">
        <Download className="w-4 h-4 mr-2" />
        Download PDF
      </Button>
      {onEmailClick && (
        <Button onClick={onEmailClick} className="bg-green-700 hover:bg-green-800">
          <Send className="w-4 h-4 mr-2" />
          Email Quotation
        </Button>
      )}
    </div>
  );
};

export default QuotationPDF;
