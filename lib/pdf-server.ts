// Server-side PDF Generation Utility
import jsPDF from 'jspdf';
import path from 'path';
import fs from 'fs';

// Helper function to round up to nearest 1000
const roundUpToNearestThousand = (amount: number): number => {
  return Math.ceil(amount / 1000) * 1000;
};

interface SaleItem {
  id?: number;
  product_id: number;
  product: {
    id: number;
    name: string;
    type: 'size' | 'quantity';
    price_per_unit: number;
  };
  quantity?: number;
  width?: number;
  height?: number;
  description: string;
  item_total: number;
}

interface Sale {
  id: number;
  total_price: number;
  created_at: string;
  customer_id?: number | null;
  customers?: {
    name: string;
    email?: string;
    phone?: string;
  } | null;
  sale_items?: SaleItem[];
}

export const generateSalePDF = async (sale: Sale): Promise<Uint8Array> => {
  // Create a new jsPDF instance
  const pdf = new jsPDF();
  
  // Page dimensions
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Margins
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;
  
  let yPosition = margin;
  
  // Helper function to add new page if needed
  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };
  
  // Colors
  const primaryColor = [59, 130, 246]; // Blue
  const textColor = [55, 65, 81]; // Dark gray
  
  // Company header
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  // Use logo.jpg for better compression
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath);
      const base64Logo = logoData.toString('base64');
      pdf.addImage(`data:image/jpeg;base64,${base64Logo}`, 'JPEG', margin, yPosition, 35, 25);
    } else {
      throw new Error('Logo file not found');
    }
  } catch (error) {
    // Fallback to text logo
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('YOUR COMPANY', margin, yPosition + 15);
  }
  
  // Company info
  const companyInfoX = margin + 45;
  pdf.text('Digital Printing Indoor - Outdoor', companyInfoX, yPosition + 8);
  pdf.text('Offset & Media Promotion | Email: win123id@gmail.com', companyInfoX, yPosition + 12);
  
  yPosition += 35;
  
  // Bill To section
  checkPageBreak(40);
  const sectionStartY = yPosition;
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('BILL TO:', margin, sectionStartY);
  
  let billToY = sectionStartY + 8;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  pdf.text(sale.customers?.name || 'Walk-in Customer', margin, billToY);
  
  billToY += 6;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  if (sale.customers?.phone) {
    pdf.text(`Phone: ${sale.customers.phone}`, margin, billToY);
    billToY += 5;
  }
  if (sale.customers?.email) {
    pdf.text(`Email: ${sale.customers.email}`, margin, billToY);
    billToY += 5;
  }
  
  // Invoice Details
  const detailsX = pageWidth - margin - 80;
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('INVOICE DETAILS:', detailsX, sectionStartY);
  
  let detailsY = sectionStartY + 8;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  pdf.text(`Invoice #`, detailsX, detailsY);
  pdf.text(`${String(sale.id).padStart(6, '0')}`, detailsX + 35, detailsY);
  
  detailsY += 6;
  pdf.text(`Date`, detailsX, detailsY);
  pdf.text(`${new Date(sale.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, detailsX + 35, detailsY);
  
  yPosition = Math.max(billToY, detailsY + 10);
  
  // Table headers
  checkPageBreak(80);
  
  pdf.setDrawColor(textColor[0], textColor[1], textColor[2]);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 8;
  
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  const headers = ['Item Description', 'Quantity', 'Price / Unit', 'Amount'];
  const columnWidths = [contentWidth * 0.45, contentWidth * 0.15, contentWidth * 0.20, contentWidth * 0.20];
  let xPos = margin + 5;
  
  headers.forEach((header, index) => {
    if (index === 0) {
      pdf.text(header, xPos, yPosition);
    } else if (index === 1) {
      pdf.text(header, xPos + 10, yPosition, { align: 'center' });
    } else if (index === 2) {
      pdf.text(header, xPos + 15, yPosition, { align: 'center' });
    } else {
      pdf.text(header, xPos + 20, yPosition, { align: 'right' });
    }
    xPos += columnWidths[index];
  });
  
  yPosition += 8;
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  
  // Table items
  pdf.setFont('helvetica', 'normal');
  
  if (sale.sale_items && sale.sale_items.length > 0) {
    sale.sale_items.forEach((item) => {
      checkPageBreak(25);
      
      xPos = margin + 5;
      const product = (item as any).products || item.product;
      
      // Item description
      pdf.setFontSize(10);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      const description = product?.name || 'Unknown Product';
      const itemDescription = item.description || '';
      
      let fullDescription = '';
      if (product?.type === 'size') {
        const width = item.width || 0;
        const height = item.height || 0;
        const sizeInfo = `${width} × ${height} cm`;
        fullDescription = itemDescription 
          ? `${description} - ${itemDescription} (${sizeInfo})`
          : `${description} (${sizeInfo})`;
      } else {
        fullDescription = itemDescription 
          ? `${description} - ${itemDescription}`
          : description;
      }
      
      const descriptionLines = pdf.splitTextToSize(fullDescription, columnWidths[0] - 5);
      
      descriptionLines.forEach((line: string, index: number) => {
        pdf.text(line, xPos, yPosition + 5 + (index * 4));
      });
      
      const rowHeight = Math.max(15, descriptionLines.length * 4 + 5);
      
      // Quantity
      let quantityText = item.quantity?.toString() || '1';
      
      pdf.setFontSize(9);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(quantityText, xPos + columnWidths[0] + 10, yPosition + 5, { align: 'center' });
      
      // Price per unit display
      const unitPrice = product?.price_per_unit || 0;
      const quantityValue = item.quantity && item.quantity > 0 ? item.quantity : 1;
      let pricePerUnitText = '';
      if (product?.type === 'size') {
        // For size-based products, show effective per-item price: item_total / quantity
        const perUnit = (item.item_total || 0) / quantityValue;
        pricePerUnitText = `Rp ${perUnit.toLocaleString('id-ID')}`;
      } else {
        // For quantity-based products, keep using stored price_per_unit
        pricePerUnitText = `Rp ${unitPrice.toLocaleString('id-ID')}`;
      }
      
      pdf.setFontSize(9);
      pdf.text(pricePerUnitText, xPos + columnWidths[0] + columnWidths[1] + 15, yPosition + 5, { align: 'center' });
      
      // Amount (use item_total from database for all item types)
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const finalAmount = item.item_total || 0;
      pdf.text(`Rp ${finalAmount.toLocaleString('id-ID')}`, xPos + columnWidths[0] + columnWidths[1] + columnWidths[2] + 20, yPosition + 5, { align: 'right' });
      
      yPosition += rowHeight;
    });
  }
  
  yPosition += 10;
  
  // Total section
  checkPageBreak(40);
  
  pdf.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.rect(pageWidth - margin - 120, yPosition, 120, 30);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  pdf.text('TOTAL AMOUNT', pageWidth - margin - 115, yPosition + 12);
  
  pdf.setFontSize(16);
  pdf.text(`Rp ${sale.total_price.toLocaleString('id-ID')}`, pageWidth - margin - 5, yPosition + 12, { align: 'right' });
  
  // Payment terms
  yPosition += 35;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  pdf.text('Payment terms: Due upon receipt. Thank you for your business!', margin, yPosition);
  
  // Payment details
  yPosition += 8;
  pdf.setFont('helvetica', 'normal');
  pdf.text('Payment Details:', margin, yPosition);
  yPosition += 5;
  pdf.text('Bank: BCA', margin, yPosition);
  yPosition += 5;
  pdf.text('Account No: 5270577565', margin, yPosition);
  yPosition += 5;
  pdf.text('Account Name: Ricky Iswanto', margin, yPosition);
  
  // Footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(128, 128, 128);
  pdf.text('This is a computer-generated invoice and requires no signature.', pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  // Return PDF as bytes
  return new Uint8Array(pdf.output('arraybuffer'));
};
