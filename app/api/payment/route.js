import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request) {
  const data = await request.json();

  // Ambil data penting dari Midtrans
  const orderId = data.order_id;
  const transactionStatus = data.transaction_status;
  const fraudStatus = data.fraud_status;

  console.log(`Webhook diterima untuk Order: ${orderId} - Status: ${transactionStatus}`);

  // Logika update status ke Supabase
  if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
    if (fraudStatus === 'accept' || !fraudStatus) {
      // UPDATE STATUS JADI LUNAS
      const { error } = await supabase
        .from('orders')
        .update({ status: 'Lunas' })
        .eq('id', orderId);
        
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
    // UPDATE STATUS JADI GAGAL
    await supabase
      .from('orders')
      .update({ status: 'Gagal' })
      .eq('id', orderId);
  }

  return NextResponse.json({ message: 'Webhook Berhasil' });
}