import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id'); // province id
  const apiKey = process.env.RAJAONGKIR_API_KEY;

  const url = id 
    ? `https://api.rajaongkir.com/starter/city?province=${id}` 
    : `https://api.rajaongkir.com/starter/province`;

  try {
    const response = await fetch(url, { 
      headers: { 'key': apiKey },
      cache: 'no-store' // Agar data selalu fresh
    });
    
    const data = await response.json();

    // CEK APAKAH RESPON DARI RAJAONGKIR VALID
    if (data.rajaongkir && data.rajaongkir.results) {
      return NextResponse.json(data.rajaongkir.results);
    } else {
      // Jika error dari RajaOngkir (misal API Key salah)
      const errorMsg = JSON.stringify(data); 
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Koneksi ke server gagal" }, { status: 500 });
  }
}