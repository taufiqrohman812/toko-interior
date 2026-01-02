import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';

export async function POST(request) {
  const { orderId, grossAmount, customerDetails, items } = await request.json();

  // Inisialisasi Midtrans Snap
  let snap = new midtransClient.Snap({
    isProduction: false, // Tetap false karena kita pakai Sandbox
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
  });

  // Parameter Transaksi
  let parameter = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    customer_details: customerDetails,
    item_details: items, // Daftar barang yang dibeli
    credit_card: {
      secure: true
    }
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return NextResponse.json(transaction); // Mengirim token transaksi ke frontend
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}