"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const [cartItems, setCartItems] = useState([]);
  const [groupedItems, setGroupedItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0); // Untuk badge navbar
  const router = useRouter();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = JSON.parse(localStorage.getItem("toko_interior_cart") || "[]");
    setCartItems(savedCart);
    setCartCount(savedCart.length);

    // LOGIKA GROUPING
    const groups = {};
    savedCart.forEach(item => {
      if (groups[item.id]) {
        groups[item.id].qty += 1;
      } else {
        groups[item.id] = { ...item, qty: 1 };
      }
    });
    setGroupedItems(Object.values(groups));
    setIsLoading(false);
  };

  const updateCart = (newCartArray) => {
    localStorage.setItem("toko_interior_cart", JSON.stringify(newCartArray));
    loadCart(); // Refresh data
  };

  const increaseQty = (product) => {
    const newCart = [...cartItems, product];
    updateCart(newCart);
  };

  const decreaseQty = (productId) => {
    const newCart = [...cartItems];
    const index = newCart.findIndex(item => item.id === productId);
    if (index !== -1) {
      newCart.splice(index, 1);
      updateCart(newCart);
    }
  };

  const removeItemFull = (productId) => {
    if (confirm("Hapus barang ini dari keranjang?")) {
      const newCart = cartItems.filter(item => item.id !== productId);
      updateCart(newCart);
    }
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + item.price, 0);

  const formatRupiah = (num) => {
    return "Rp " + num.toLocaleString('id-ID');
  };

  if (isLoading) {
    return <div className="min-h-screen bg-white flex items-center justify-center text-zinc-400">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans pt-24">
      
      {/* --- NAVBAR (WHITE MODE) --- */}
      <nav className="fixed top-0 left-0 w-full px-6 py-4 flex justify-between items-center z-50 bg-white/95 backdrop-blur-md shadow-sm text-black border-b border-zinc-100">
        <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
          <img 
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGyPp7An3NS_fMKTqTD7R2pqIAfbpFyfccKw&s" 
            alt="Kaisen Interior Logo" 
            className="h-10 w-auto"
          />
          <h1 className="text-xl font-black tracking-tighter uppercase drop-shadow-sm text-black">
            Kaisen<span className="text-amber-500">.</span>Interior
          </h1>
        </Link>

        <div className="hidden lg:flex items-center gap-8 font-medium text-sm tracking-wide">
          <Link href="/" className="hover:text-amber-500 transition">Beranda</Link>
          <Link href="/#about" className="hover:text-amber-500 transition">Tentang Kami</Link>
          <Link href="/#collection" className="hover:text-amber-500 transition">Produk</Link>
          <Link href="/#services" className="hover:text-amber-500 transition">Layanan</Link>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href="/admin" className="text-xs font-bold transition px-4 py-2 rounded-full backdrop-blur-md shadow-sm whitespace-nowrap bg-amber-500 text-black hover:bg-amber-400">
            Admin
          </Link>
          <div className="relative cursor-pointer p-2 rounded-full px-4 flex items-center gap-2 transition duration-300 backdrop-blur-md border shadow-sm bg-black border-black text-amber-500 hover:bg-zinc-800">
            <span className="text-lg">🛒</span>
            <span className="font-bold">{cartCount}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-10 px-6">
        
        {/* BREADCRUMB */}
        <div className="mb-8 text-sm text-zinc-400 flex items-center gap-2 uppercase tracking-wider font-bold">
          <Link href="/" className="hover:text-black transition">Beranda</Link>
          <span>/</span>
          <span className="text-amber-600">Keranjang</span>
        </div>

        {groupedItems.length === 0 ? (
          /* TAMPILAN KOSONG */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-zinc-100 text-center px-4">
            <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center text-4xl mb-6 text-zinc-300">
              🛒
            </div>
            <h2 className="text-3xl font-black text-black mb-2 uppercase">Keranjang Kosong</h2>
            <p className="text-zinc-500 max-w-md mb-8">Sepertinya Anda belum menemukan furnitur impian. Mari jelajahi koleksi terbaru kami.</p>
            <Link href="/" className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-amber-500 hover:text-black transition shadow-lg active:scale-95 border-2 border-transparent hover:border-black">
              Mulai Belanja
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-10 items-start">
            
            {/* KOLOM KIRI: DAFTAR ITEM */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-end mb-2">
                 <h2 className="text-2xl font-black text-black uppercase">Item Pilihan ({cartItems.length})</h2>
              </div>

              {groupedItems.map((item) => (
                <div key={item.id} className="group bg-white p-4 sm:p-6 rounded-[2.5rem] shadow-sm border border-zinc-100 flex flex-col sm:flex-row gap-6 items-center hover:shadow-md transition-all duration-300">
                  
                  {/* GAMBAR */}
                  <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-zinc-100 rounded-2xl overflow-hidden relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                  </div>

                  {/* INFO */}
                  <div className="flex-1 w-full text-center sm:text-left">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-black uppercase leading-tight">{item.name}</h3>
                      {/* Tombol Hapus Desktop */}
                      <button onClick={() => removeItemFull(item.id)} className="hidden sm:block text-zinc-300 hover:text-red-500 transition px-2 font-bold text-xl">×</button>
                    </div>
                    <p className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-widest">Furniture Series</p>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      {/* HARGA */}
                      <p className="text-xl font-bold text-amber-600">
                        {formatRupiah(item.price)}
                      </p>

                      {/* CONTROLLER QTY */}
                      <div className="flex items-center gap-4 bg-zinc-50 p-1.5 rounded-full border border-zinc-200">
                        <button 
                          onClick={() => decreaseQty(item.id)}
                          className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-sm hover:bg-zinc-200 transition text-black font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold w-6 text-center text-sm text-black">{item.qty}</span>
                        <button 
                          onClick={() => increaseQty(item)}
                          className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-full shadow-sm hover:bg-zinc-800 transition font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tombol Hapus Mobile */}
                  <button onClick={() => removeItemFull(item.id)} className="sm:hidden text-red-500 text-sm font-bold hover:underline w-full py-2">Hapus Produk</button>
                </div>
              ))}
            </div>

            {/* KOLOM KANAN: RINGKASAN HARGA (STICKY) */}
            <div className="lg:col-span-1 sticky top-28">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-zinc-100 relative overflow-hidden">
                
                <h3 className="text-xl font-black text-black mb-6 relative z-10 uppercase">Ringkasan Pesanan</h3>
                
                <div className="space-y-4 mb-6 relative z-10">
                  <div className="flex justify-between text-zinc-500 text-sm">
                    <span>Subtotal</span>
                    <span className="font-bold text-black">{formatRupiah(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 text-sm">
                    <span>Pajak (PPN 0%)</span>
                    <span className="font-bold text-black">Rp 0</span>
                  </div>
                  <div className="flex justify-between text-zinc-500 text-sm">
                    <span>Ongkos Kirim</span>
                    <span className="text-green-600 font-black bg-green-50 px-2 py-0.5 rounded text-[10px] uppercase">GRATIS</span>
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-zinc-100 my-6"></div>

                <div className="flex justify-between items-center mb-8">
                  <span className="font-bold text-zinc-900">Total Bayar</span>
                  <span className="text-2xl font-black text-amber-600">{formatRupiah(totalPrice)}</span>
                </div>

                <button 
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 active:scale-95 flex justify-center items-center gap-2 group border-2 border-black hover:border-zinc-800"
                >
                  Checkout
                  <span className="group-hover:translate-x-1 transition">→</span>
                </button>

                <p className="text-center text-xs text-zinc-400 mt-6 flex items-center justify-center gap-1">
                  <span>🔒</span> Pembayaran Aman & Terenkripsi
                </p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* --- FOOTER --- */}
      <footer className="mt-20 pt-16 pb-12 bg-black text-white text-sm border-t border-zinc-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6 mb-12">
          
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <h4 className="font-bold text-amber-500 mb-4 text-base">Lokasi Showroom</h4>
            <p className="text-zinc-400 mb-4 leading-relaxed">Juragan Akrilik, Tegal, Jawa Tengah.</p>
            <div className="rounded-2xl overflow-hidden h-48 shadow-sm border border-zinc-800 relative">
               <iframe src="https://maps.google.com/maps?q=Juragan%20Akrilik%20Tegal&t=&z=13&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style={{border:0}} allowFullScreen="" loading="lazy" className="absolute inset-0 grayscale hover:grayscale-0 transition duration-500 opacity-80 hover:opacity-100"></iframe>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-amber-500 mb-4 text-base">Navigasi</h4>
            <ul className="space-y-3 text-zinc-400 font-medium">
              <li><Link href="/" className="hover:text-amber-500 transition">Beranda</Link></li>
              <li><Link href="/#collection" className="hover:text-amber-500 transition">Produk Terbaru</Link></li>
              <li><Link href="/#about" className="hover:text-amber-500 transition">Tentang Kami</Link></li>
              <li><Link href="/#services" className="hover:text-amber-500 transition">Layanan</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-amber-500 mb-4 text-base">Bantuan Pelanggan</h4>
            <ul className="space-y-3 text-zinc-400 font-medium">
              <li><Link href="/cart" className="hover:text-amber-500 transition">Cek Keranjang</Link></li>
              <li><span className="hover:text-amber-500 transition cursor-pointer">Konfirmasi Pembayaran</span></li>
              <li><span className="hover:text-amber-500 transition cursor-pointer">Syarat & Ketentuan</span></li>
              <li><span className="hover:text-amber-500 transition cursor-pointer">Kebijakan Privasi</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-amber-500 mb-4 text-base">Hubungi Kami</h4>
            <ul className="space-y-3 text-zinc-400 font-medium">
              <li><a href="https://wa.me/6285712087986" target="_blank" className="hover:text-green-500 transition flex items-center gap-2"><span className="text-lg">💬</span> WhatsApp Admin</a></li>
              <li><a href="https://instagram.com/kaisen_interior" target="_blank" className="hover:text-pink-500 transition flex items-center gap-2"><span className="text-lg">📸</span> @kaisen_interior</a></li>
              <li className="pt-4 flex items-center gap-2"><span className="text-lg">📧</span> hello@kaiseninterior.com</li>
            </ul>
          </div>
        </div>
        
        <div className="text-center py-8 border-t border-zinc-800 px-6">
            <p className="tracking-widest uppercase text-zinc-600 text-xs font-bold">© 2026 KAISEN INTERIOR. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}