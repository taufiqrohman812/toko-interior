import { NextResponse } from 'next/server';

export async function POST(request) {
  const { destination, weight, courier } = await request.json();
  const apiKey = process.env.RAJAONGKIR_API_KEY;

  try {
    const response = await fetch('https://api.rajaongkir.com/starter/cost', {
      method: 'POST',
      headers: {
        'key': apiKey,
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        origin: '444', // Kode Kota Tegal
        destination: destination,
        weight: weight,
        courier: courier
      })
    });

    const data = await response.json();
    if (data.rajaongkir.status.code !== 200) throw new Error(data.rajaongkir.status.description);
    return NextResponse.json(data.rajaongkir.results[0].costs);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}