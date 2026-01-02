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
    // 1. Ambil Data Keranjang
    const items = JSON.parse(localStorage.getItem("toko_interior_cart") || "[]");
    setCart(items);

    // 2. Load Script Midtrans Snap (Sandbox)
    const midtransScriptUrl = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    if (!document.getElementById('midtrans-script')) {
      const script = document.createElement('script');
      script.id = 'midtrans-script';
      script.src = midtransScriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Logika Mengelompokkan Item (Quantity)
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
    if (status === "loading") return;
    
    setStatus("loading");
    const orderId = "ORD-" + Date.now();

    try {
      // Panggil API Payment kita
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
          items: [
            ...groupedCart.map(item => ({
              id: item.id.toString(),
              price: item.price,
              quantity: item.qty,
              name: item.name.substring(0, 50)
            })),
            { id: 'shipping-fee', price: FLAT_ONGKIR, quantity: 1, name: 'Ongkos Kirim Flat' }
          ]
        })
      });

      const data = await res.json();

      if (data.token) {
        // Eksekusi Popup Midtrans
        window.snap.pay(data.token, {
          onSuccess: async function(result) {
            await saveOrderToSupabase(orderId, "Lunas");
            localStorage.removeItem("toko_interior_cart");
            router.push('/');
          },
          onPending: function(result) { alert("Menunggu Pembayaran..."); },
          onError: function(result) { alert("Pembayaran Gagal!"); },
          onClose: function() { setStatus("idle"); }
        });
      } else {
        alert("Gagal mendapatkan token pembayaran. Cek log server.");
        setStatus("idle");
      }
    } catch (err) {
      console.error("Payment Error:", err);
      alert("Terjadi kesalahan koneksi.");
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
      items: groupedCart,
      status: paymentStatus
    }]);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-zinc-900">
        <h2 className="text-2xl font-bold mb-4">Keranjang Kosong</h2>
        <Link href="/" className="bg-black text-amber-500 px-8 py-3 rounded-xl font-bold">Kembali Belanja</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-12 px-6 font-sans text-zinc-900">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
        
        {/* FORM PENGIRIMAN */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-200">
          <h2 className="text-3xl font-black mb-8 uppercase italic">Detail Pengiriman</h2>
          <form onSubmit={handlePayment} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <input name="firstName" placeholder="Nama Depan" onChange={handleInputChange} className="p-4 bg-zinc-100 rounded-xl w-full text-zinc-900 outline-none focus:ring-2 ring-amber-500" required />
              <input name="lastName" placeholder="Nama Belakang" onChange={handleInputChange} className="p-4 bg-zinc-100 rounded-xl w-full text-zinc-900 outline-none focus:ring-2 ring-amber-500" required />
            </div>
            <input name="email" type="email" placeholder="Email Aktif" onChange={handleInputChange} className="p-4 bg-zinc-100 rounded-xl w-full text-zinc-900 outline-none focus:ring-2 ring-amber-500" required />
            <input name="whatsapp" type="tel" placeholder="Nomor WhatsApp" onChange={handleInputChange} className="p-4 bg-zinc-100 rounded-xl w-full text-zinc-900 outline-none focus:ring-2 ring-amber-500" required />
            <textarea name="address" placeholder="Alamat Pengiriman Lengkap" onChange={handleInputChange} className="p-4 bg-zinc-100 rounded-xl w-full text-zinc-900 outline-none focus:ring-2 ring-amber-500" rows="3" required />
            
            <button 
              type="submit" 
              className="w-full bg-black text-amber-500 py-5 rounded-2xl font-black text-xl hover:bg-zinc-800 transition shadow-2xl uppercase tracking-widest disabled:opacity-50"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </form>
        </div>

        {/* RINGKASAN PESANAN */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-200 h-fit sticky top-28">
          <h2 className="text-3xl font-black mb-8 uppercase italic">Ringkasan</h2>
          <div className="space-y-4 mb-8 max-h-64 overflow-y-auto pr-2">
            {groupedCart.map((item, idx) => (
              <div key={idx} className="flex gap-4 items-center border-b border-zinc-100 pb-4 text-zinc-900">
                <img src={item.image} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-bold text-base uppercase italic">{item.name}</p>
                  <p className="text-sm font-black text-amber-600">
                    Rp {item.price.toLocaleString()} <span className="text-zinc-400 font-normal lowercase">x{item.qty}</span>
                  </p>
                </div>
                <div className="text-right font-black">
                  Rp {(item.price * item.qty).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
          
          <div className="space-y-4 pt-4 border-t-4 border-double border-zinc-100">
            <div className="flex justify-between font-bold text-sm">
              <span className="text-zinc-500 uppercase">Subtotal</span>
              <span>Rp {totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-sm">
              <span className="text-zinc-500 uppercase">Ongkos Kirim</span>
              <span>Rp {FLAT_ONGKIR.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-3xl font-black text-amber-600 pt-4 mt-4">
              <span className="text-zinc-900 italic uppercase">Total</span>
              <span className="underline">Rp {grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}