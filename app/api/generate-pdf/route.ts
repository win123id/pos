import { requireAdmin } from '@/lib/authz/require-admin';
import { NextRequest, NextResponse } from 'next/server';
import { generateSalePDF } from '@/lib/pdf-server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const saleId = Number(searchParams.get('saleId'));

    if (!Number.isInteger(saleId) || saleId <= 0) {
      return NextResponse.json(
        { error: 'A valid saleId is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: sale, error } = await supabase
      .from('sales')
      .select(`
        *,
        customers(name, email, phone, address),
        sale_items(
          *,
          products(id, name, type, price_per_unit, cost_price)
        )
      `)
      .eq('id', saleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Sale not found' },
          { status: 404 }
        );
      }
      throw error;
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
