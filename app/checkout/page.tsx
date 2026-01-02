"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function CheckoutPage() {
  const [cart, setCart] = useState([]);
  const [status, setStatus] = useState("idle");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    whatsapp: "",
    address: ""
  });

  const FLAT_ONGKIR = 25000; 
  const router = useRouter();

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("toko_interior_cart") || "[]");
    setCart(items);

    const midtransScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    const script = document.createElement('script');
    script.src = midtransScriptUrl;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;

    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  // --- LOGIKA QUANTITY: Mengelompokkan item yang sama ---
  const getGroupedCart = () => {
    const groups = {};
    cart.forEach(item => {
      if (groups[item.id]) {
        groups[item.id].qty += 1;
      } else {
        groups[item.id] = { ...item, qty: 1 };
      }
    });
    return Object.values(groups);
  };

  const groupedCart = getGroupedCart();
  const totalPrice = cart.reduce((acc, item) => acc + item.price, 0);
  const grandTotal = totalPrice + FLAT_ONGKIR;

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setStatus("loading");
    const orderId = "ORD-" + Date.now();

    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderId,
          grossAmount: grandTotal,
          customerDetails: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.whatsapp,
          },
          // Kirim data item dengan quantity yang benar ke Midtrans
          items: [
            ...groupedCart.map(item => ({
              id: item.id.toString(),
              price: item.price,
              quantity: item.qty,
              name: item.name.substring(0, 50)
            })),
            {
              id: 'shipping-fee',
              price: FLAT_ONGKIR,
              quantity: 1,
              name: 'Ongkos Kirim Flat'
            }
          ]
        })
      });

      const data = await res.json();

      if (data.token) {
        window.snap.pay(data.token, {
          onSuccess: async function(result) {
            // Simpan ke Supabase dengan data yang sudah dikelompokkan
            await saveOrderToSupabase(orderId, "Lunas");
            localStorage.removeItem("toko_interior_cart");
            alert("Pembayaran Berhasil!");
            router.push('/');
          },
          onPending: function(result) { alert("Menunggu pembayaran Anda."); },
          onError: function(result) { alert("Pembayaran gagal!"); },
          onClose: function() { alert("Halaman ditutup."); }
        });
      }
    } catch (err) {
      alert("Terjadi kesalahan: " + err.message);
    } finally {
      setStatus("idle");
    }
  };

  const saveOrderToSupabase = async (orderId, paymentStatus) => {
    await supabase.from('orders').insert([{
      id: orderId,
      customer_name: `${formData.firstName} ${formData.lastName}`,
      whatsapp: formData.whatsapp,
      address: formData.address,
      total: grandTotal,
      items: groupedCart, // Simpan data item beserta qty-nya
      status: paymentStatus
    }]);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-4 text-zinc-900">Keranjang Anda Kosong</h2>
        <Link href="/" className="bg-black text-amber-500 px-8 py-3 rounded-xl font-bold">Kembali Belanja</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-12 px-6 font-sans text-zinc-900">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        
        {/* FORM DATA DIRI */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-200">
          <h2 className="text-3xl font-black mb-8 uppercase italic text-zinc-900">Detail Pengiriman</h2>
          <form onSubmit={handlePayment} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Nama Depan</label>
                <input name="firstName" placeholder="Nama Depan" onChange={handleInputChange} className="p-4 bg-zinc-100 rounded-xl border-none w-full text-zinc-900 outline-none focus:ring-2 ring-amber-500" required />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Nama Belakang</label>
                <input name="lastName" placeholder="Nama Belakang" onChange={handleInputChange} className="p-4 bg-zinc-100 rounded-xl border-none w-full text-zinc-900 outline-none focus:ring-2 ring-amber-500" required />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Email Aktif</label>
              <input name="email" type="email" placeholder="email@anda.com" onChange={handleInputChange} className="p-4 bg-zinc-100 rounded-xl border-none w-full text-zinc-900 outline-none focus:ring-2 ring-amber-500" required />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Nomor WhatsApp</label>
              <input name="whatsapp" type="tel" placeholder="0812xxxx" onChange={handleInputChange} className="p-4 bg-zinc-100 rounded-xl border-none w-full text-zinc-900 outline-none focus:ring-2 ring-amber-500" required />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Alamat Lengkap</label>
              <textarea name="address" placeholder="Tuliskan alamat lengkap..." onChange={handleInputChange} className="p-4 bg-zinc-100 rounded-xl border-none w-full text-zinc-900 outline-none focus:ring-2 ring-amber-500" rows="3" required />
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest mb-1">Metode Pengiriman</p>
              <p className="text-base font-black text-zinc-900">Ongkir Flat - Rp {FLAT_ONGKIR.toLocaleString()}</p>
            </div>

            <button 
              type="submit" 
              className="w-full bg-black text-amber-500 py-5 rounded-2xl font-black text-xl hover:bg-zinc-800 transition shadow-2xl uppercase tracking-widest disabled:opacity-50 mt-4"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sedang Memproses..." : "Bayar Sekarang"}
            </button>
          </form>
        </div>

        {/* RINGKASAN PESANAN DENGAN QUANTITY */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-200 h-fit sticky top-28">
          <h2 className="text-3xl font-black mb-8 uppercase italic text-zinc-900">Ringkasan</h2>
          <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2">
            {groupedCart.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-center border-b border-zinc-100 pb-4">
                <div className="w-16 h-16 bg-zinc-100 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-base text-zinc-900 line-clamp-1 uppercase italic">{item.name}</p>
                  <p className="text-sm font-black text-amber-600">
                    Rp {item.price.toLocaleString()} <span className="text-zinc-400 font-normal lowercase">x{item.qty}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-zinc-900">Rp {(item.price * item.qty).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-bold uppercase text-sm">Subtotal Barang</span>
              <span className="font-black text-zinc-900 text-lg">Rp {totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 font-bold uppercase text-sm">Ongkos Kirim</span>
              <span className="font-black text-zinc-900 text-lg">Rp {FLAT_ONGKIR.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-6 border-t-4 border-double border-zinc-100 mt-4">
              <span className="text-2xl font-black uppercase italic text-zinc-900">Total Akhir</span>
              <span className="text-3xl font-black text-amber-600 underline">Rp {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}