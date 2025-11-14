import { NextRequest, NextResponse } from 'next/server';
import { generateSalePDF } from '@/lib/pdf-server';

export async function POST(request: NextRequest) {
  try {
    const { sale } = await request.json();
    
    if (!sale) {
      return NextResponse.json(
        { error: 'Sale data is required' },
        { status: 400 }
      );
    }

    const pdfBytes = await generateSalePDF(sale);
    
    // Create buffer and get content length
    const pdfBuffer = Buffer.from(pdfBytes);
    
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Length': pdfBuffer.length.toString(),
        'Content-Disposition': `attachment; filename="invoice-${String(sale.id).padStart(6, '0')}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
