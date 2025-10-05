import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText, FileType } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExportButton = ({ data, columns, filename = 'export', title = 'Report' }) => {
  const { toast } = useToast();
  const [showMenu, setShowMenu] = useState(false);

  const handleExportExcel = () => {
    try {
      // Prepare data for export
      const exportData = data.map((row) => {
        const exportRow = {};
        columns.forEach((col) => {
          const value = typeof col.selector === 'function'
            ? col.selector(row)
            : row[col.selector];
          exportRow[col.name] = value || '';
        });
        return exportRow;
      });

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const columnWidths = columns.map(() => ({ wch: 15 }));
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, title);

      // Generate filename with current date
      const filenameWithDate = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filenameWithDate);

      toast({
        title: "Export Successful",
        description: `Exported ${exportData.length} records to Excel`,
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export to Excel.",
      });
    }
    setShowMenu(false);
  };

  const handleExportCSV = () => {
    try {
      // Prepare headers
      const headers = columns.map((col) => col.name).join(',');

      // Prepare rows
      const rows = data.map((row) => {
        return columns
          .map((col) => {
            const value = typeof col.selector === 'function'
              ? col.selector(row)
              : row[col.selector];
            // Escape commas and quotes in CSV
            const stringValue = String(value || '');
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(',');
      });

      // Combine headers and rows
      const csvContent = [headers, ...rows].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Exported ${data.length} records to CSV`,
      });
    } catch (error) {
      console.error('CSV export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export to CSV.",
      });
    }
    setShowMenu(false);
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(16);
      doc.text(title, 14, 15);

      // Add date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

      // Prepare table headers
      const headers = columns.map((col) => col.name);

      // Prepare table body
      const body = data.map((row) =>
        columns.map((col) => {
          const value = typeof col.selector === 'function'
            ? col.selector(row)
            : row[col.selector];
          return String(value || '');
        })
      );

      // Add table using autoTable
      autoTable(doc, {
        head: [headers],
        body: body,
        startY: 28,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [16, 185, 129], textColor: 255 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
      });

      // Save PDF
      doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "Export Successful",
        description: `Exported ${data.length} records to PDF`,
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export to PDF.",
      });
    }
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300"
      >
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>

      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 z-20">
            <div className="py-1">
              <button
                onClick={handleExportExcel}
                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
                Export as Excel
              </button>
              <button
                onClick={handleExportCSV}
                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <FileText className="w-4 h-4 mr-2 text-blue-600" />
                Export as CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="flex items-center w-full px-4 py-2 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <FileType className="w-4 h-4 mr-2 text-red-600" />
                Export as PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportButton;
