export function formatRupiah(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) {
    return 'Rp 0,00';
  }
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

// PDF Generation Utility
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

export const generateSalePDF = async (sale: Sale) => {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  
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
  
  // Colors (no background colors)
  const primaryColor = [59, 130, 246]; // Blue
  const textColor = [55, 65, 81]; // Dark gray
  
  // Company jargon and logo horizontal layout
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  // Add logo on the left
  try {
    const logoImg = new Image();
    logoImg.src = '/invoice.png';
    await new Promise((resolve, reject) => {
      logoImg.onload = resolve;
      logoImg.onerror = reject;
    });
    // Logo on the left
    pdf.addImage(logoImg, 'PNG', margin, yPosition, 35, 25);
  } catch (error) {
    // If logo fails to load, add a placeholder text on the left
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.text('YOUR COMPANY', margin, yPosition + 15);
  }
  
  // Company info on the right
  const companyInfoX = margin + 45;
  pdf.text('Digital Printing Indoor - Outdoor', companyInfoX, yPosition + 8);
  pdf.text('Offset & Media Promotion | Email: win123id@gmail.com', companyInfoX, yPosition + 18);
  
  yPosition += 35;
  
  // Two-column layout for Bill To and Invoice Details
  checkPageBreak(40);
  
  const sectionStartY = yPosition;
  
  // Bill To section
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
  
  // Invoice Details on the right (top-aligned with Bill To)
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
  
  detailsY += 6;
  pdf.text(`Time`, detailsX, detailsY);
  pdf.text(`${new Date(sale.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`, detailsX + 35, detailsY);
  
  // Set yPosition to the maximum of both sections
  yPosition = Math.max(billToY, detailsY + 10);
  
  // Table headers (no background)
  checkPageBreak(80);
  
  // Draw line above headers
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
  
  // Draw line below headers
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;
  
  // Table items (no alternating backgrounds)
  pdf.setFont('helvetica', 'normal');
  let itemCount = 0;
  
  if (sale.sale_items && sale.sale_items.length > 0) {
    sale.sale_items.forEach((item) => {
      checkPageBreak(25);
      
      xPos = margin + 5;
      
      // Get product data from actual structure
      const product = (item as any).products || item.product;
      
      // Item description with size info for size-based products
      pdf.setFontSize(10);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      const description = product?.name || 'Unknown Product';
      const itemDescription = item.description || '';
      
      let fullDescription = '';
      if (product?.type === 'size') {
        // For size-based: join size info with description
        const width = item.width || 0;
        const height = item.height || 0;
        const sizeInfo = `${width} × ${height} cm`;
        fullDescription = itemDescription 
          ? `${description} - ${itemDescription} (${sizeInfo})`
          : `${description} (${sizeInfo})`;
      } else {
        // For quantity-based: normal description
        fullDescription = itemDescription 
          ? `${description} - ${itemDescription}`
          : description;
      }
      
      const descriptionLines = pdf.splitTextToSize(fullDescription, columnWidths[0] - 5);
      
      descriptionLines.forEach((line: string, index: number) => {
        pdf.text(line, xPos, yPosition + 5 + (index * 4));
      });
      
      const rowHeight = Math.max(15, descriptionLines.length * 4 + 5);
      
      // Quantity (for all product types)
      let quantityText = '';
      if (product?.type === 'quantity') {
        quantityText = item.quantity?.toString() || '1';
      } else {
        quantityText = item.quantity?.toString() || '1';
      }
      
      pdf.setFontSize(9);
      pdf.setTextColor(textColor[0], textColor[1], textColor[2]);
      pdf.text(quantityText, xPos + columnWidths[0] + 10, yPosition + 5, { align: 'center' });
      
      // Price per unit (calculated for size-based)
      const unitPrice = product?.price_per_unit || 0;
      let pricePerUnitText = '';
      if (product?.type === 'size') {
        // For size-based: calculate width × height × selling price
        const width = item.width || 0;
        const height = item.height || 0;
        const calculatedPrice = width * height * unitPrice;
        pricePerUnitText = `Rp ${calculatedPrice.toLocaleString('id-ID')}`;
      } else {
        // For quantity-based: show unit price
        pricePerUnitText = `Rp ${unitPrice.toLocaleString('id-ID')}`;
      }
      
      pdf.setFontSize(9);
      pdf.text(pricePerUnitText, xPos + columnWidths[0] + columnWidths[1] + 15, yPosition + 5, { align: 'center' });
      
      // Amount (calculated total)
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      let finalAmount = 0;
      if (product?.type === 'size') {
        // For size-based: (width × height × selling price) × quantity
        const width = item.width || 0;
        const height = item.height || 0;
        const quantity = item.quantity || 1;
        finalAmount = width * height * unitPrice * quantity;
      } else {
        // For quantity-based: unit price × quantity
        finalAmount = item.item_total;
      }
      pdf.text(`Rp ${finalAmount.toLocaleString('id-ID')}`, xPos + columnWidths[0] + columnWidths[1] + columnWidths[2] + 20, yPosition + 5, { align: 'right' });
      
      yPosition += rowHeight;
      itemCount++;
    });
  }
  
  yPosition += 10;
  
  // Total section with border (no background)
  checkPageBreak(40);
  
  // Draw border around total section
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
  
  // Footer
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(128, 128, 128);
  pdf.text('This is a computer-generated invoice and requires no signature.', pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  // Save the PDF
  pdf.save(`invoice-${String(sale.id).padStart(6, '0')}.pdf`);
};
