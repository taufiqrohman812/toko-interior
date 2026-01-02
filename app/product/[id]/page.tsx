"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini benar

export default function ProductDetail() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [flyingItem, setFlyingItem] = useState(null); 
  const [bumpCart, setBumpCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // 1. FETCH PRODUK DARI SUPABASE (SINGLE)
    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .single();
      
      if (data) setProduct(data);
      if (error) console.error("Error loading product:", error);
    };
    fetchProduct();

    // 2. LOAD KERANJANG DARI LOCAL STORAGE
    const currentCart = JSON.parse(localStorage.getItem("toko_interior_cart") || "[]");
    setCartItems(currentCart);
  }, [params.id]);

  const updateCartState = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem("toko_interior_cart", JSON.stringify(newCart));
  };

  const addToCart = (e, isDirectBuy = false) => {
    if (!product) return;
    if (isDirectBuy) { const newItems = Array(qty).fill(product); updateCartState([...cartItems, ...newItems]); router.push('/checkout'); return; }
    const buttonRect = e.target.getBoundingClientRect();
    const cartIcon = document.getElementById('cart-icon-target');
    let endX = window.innerWidth - 50; 
    let endY = 50;
    if (cartIcon) { const cartRect = cartIcon.getBoundingClientRect(); endX = cartRect.left + (cartRect.width / 2); endY = cartRect.top + (cartRect.height / 2); }
    setFlyingItem({ image: product.image, x: buttonRect.left + (buttonRect.width / 2), y: buttonRect.top + (buttonRect.height / 2), width: 100, opacity: 1 });
    setTimeout(() => { setFlyingItem({ image: product.image, x: endX, y: endY, width: 20, opacity: 0 }); }, 50);
    setTimeout(() => { const newItems = Array(qty).fill(product); updateCartState([...cartItems, ...newItems]); setFlyingItem(null); setBumpCart(true); setTimeout(() => setBumpCart(false), 300); }, 700);
  };

  const getGroupedItems = () => { const groups = {}; cartItems.forEach(item => { if (groups[item.id]) groups[item.id].qty += 1; else groups[item.id] = { ...item, qty: 1 }; }); return Object.values(groups); };
  const groupedPreview = getGroupedItems();
  const totalPrice = cartItems.reduce((acc, item) => acc + item.price, 0);

  if (!product) return <div className="min-h-screen flex items-center justify-center pt-20 text-zinc-500">Memuat produk...</div>;
  
  // LOGIKA HARGA BARU
  const hasDiscount = product.original_price && product.original_price > product.price;

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans pt-24 overflow-x-hidden">
      {flyingItem && <img src={flyingItem.image} className="fixed z-[9999] rounded-full shadow-2xl object-cover pointer-events-none transition-all duration-700 ease-in-out" style={{ left: `${flyingItem.x}px`, top: `${flyingItem.y}px`, width: `${flyingItem.width}px`, height: `${flyingItem.width}px`, opacity: flyingItem.opacity, transform: 'translate(-50%, -50%)' }} />}

      <nav className="fixed top-0 left-0 w-full px-6 py-4 flex justify-between items-center z-50 bg-white/95 backdrop-blur-md shadow-sm text-black border-b border-zinc-100">
        <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGyPp7An3NS_fMKTqTD7R2pqIAfbpFyfccKw&s" alt="Logo" className="h-10 w-auto" />
          <h1 className="text-xl font-black tracking-tighter uppercase drop-shadow-sm text-black">Kaisen<span className="text-amber-500">.</span>Interior</h1>
        </Link>
        <div className="hidden lg:flex items-center gap-8 font-medium text-sm tracking-wide">
          <Link href="/" className="hover:text-amber-500 transition">Beranda</Link>
          <Link href="/#about" className="hover:text-amber-500 transition">Tentang Kami</Link>
          <Link href="/#collection" className="hover:text-amber-500 transition">Produk</Link>
          <Link href="/#services" className="hover:text-amber-500 transition">Layanan</Link>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center rounded-full px-4 py-2 transition-all w-64 border bg-zinc-100 border-zinc-200 focus-within:ring-2 focus-within:ring-amber-500">
            <input type="text" placeholder="Cari furniture..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter') router.push('/'); }} className="bg-transparent outline-none w-full text-sm placeholder-opacity-70 text-black placeholder-zinc-400" />
            <button className="text-zinc-400">🔍</button>
          </div>
          <Link href="/admin" className="text-xs font-bold transition px-4 py-2 rounded-full backdrop-blur-md shadow-sm whitespace-nowrap bg-amber-500 text-black hover:bg-amber-400">Admin</Link>
          <div className="relative" onMouseEnter={() => setShowCartPreview(true)} onMouseLeave={() => setShowCartPreview(false)}>
            <Link href="/cart" id="cart-icon-target" className={`relative cursor-pointer p-2 rounded-full px-4 flex items-center gap-2 transition duration-300 backdrop-blur-md border shadow-sm bg-black border-black text-amber-500 hover:bg-zinc-800 ${bumpCart ? 'scale-125 bg-amber-500 border-amber-500 text-black' : 'scale-100'}`}><span className="text-lg">🛒</span><span className="font-bold">{cartItems.length}</span></Link>
            {showCartPreview && <div className="absolute top-full right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 text-zinc-900"><div className="p-4 bg-zinc-50 border-b border-zinc-200"><h3 className="font-bold text-zinc-700 text-sm">Keranjang Belanja ({cartItems.length})</h3></div><div className="max-h-60 overflow-y-auto p-2 space-y-2">{cartItems.length === 0 ? (<p className="text-center text-zinc-400 text-xs py-4">Belum ada barang</p>) : (groupedPreview.map((item) => (<div key={item.id} className="flex gap-3 items-center p-2 hover:bg-zinc-50 rounded-xl transition"><img src={item.image} className="w-12 h-12 rounded-lg object-cover" /><div className="flex-1 min-w-0"><p className="text-sm font-bold text-black truncate">{item.name}</p><p className="text-xs text-amber-600 font-medium">{item.qty} x Rp {item.price.toLocaleString()}</p></div></div>)))}</div>{cartItems.length > 0 && (<div className="p-4 bg-zinc-50 border-t border-zinc-200"><div className="flex justify-between mb-3 text-sm font-bold"><span>Total:</span><span>Rp {totalPrice.toLocaleString()}</span></div><Link href="/cart" className="block w-full text-center bg-black text-amber-500 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition">Lihat Keranjang</Link></div>)}</div>}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-amber-600 mb-8 transition text-sm font-bold tracking-wide uppercase">← Kembali ke Katalog</Link>
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-start">
          <div className="bg-zinc-50 p-4 rounded-[2.5rem] shadow-sm border border-zinc-100">
            <div className="aspect-square rounded-[2rem] overflow-hidden relative group">
              <img src={product.image} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt={product.name} />
              <span className="absolute top-6 left-6 bg-amber-500 text-black text-xs px-3 py-1 rounded-full font-bold shadow-lg">Best Seller</span>
            </div>
          </div>
          <div className="space-y-8">
            <div>
              {product.category && <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">{product.category}</p>}
              <h1 className="text-4xl md:text-5xl font-black text-black mb-4 tracking-tight leading-tight uppercase">{product.name}</h1>
              
              <div className="flex flex-col items-start gap-1">
                {/* HARGA CORET */}
                {hasDiscount && (
                  <span className="text-lg text-zinc-400 line-through">
                    Rp {product.original_price.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                  </span>
                )}
                <p className="text-4xl font-bold text-amber-600">Rp {product.price.toLocaleString('id-ID')}</p>
              </div>
            </div>
            <div className="prose text-zinc-600 leading-relaxed border-t border-b border-zinc-200 py-6"><h3 className="font-bold text-black mb-2 text-sm uppercase tracking-wider">Deskripsi Produk</h3><p className="whitespace-pre-line text-sm">{product.desc || "Tidak ada deskripsi tersedia untuk produk ini. Hubungi admin untuk detail lebih lanjut."}</p></div>
            <div className="flex items-center gap-6"><span className="font-bold text-sm uppercase tracking-widest text-zinc-400">Jumlah</span><div className="flex items-center bg-zinc-100 rounded-full border border-zinc-200 p-1"><button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full font-bold text-lg transition shadow-sm"> - </button><span className="w-12 text-center font-bold text-black">{qty}</span><button onClick={() => setQty(q => q + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-full font-bold text-lg transition shadow-sm"> + </button></div></div>
            <div className="flex flex-col gap-4 pt-4"><button onClick={(e) => addToCart(e, true)} className="w-full bg-black text-white py-5 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition shadow-xl shadow-zinc-200 active:scale-95 border-2 border-black hover:border-zinc-800">Beli Sekarang (Order)</button><button onClick={(e) => addToCart(e, false)} className="w-full bg-white border-2 border-zinc-200 text-black py-4 rounded-2xl font-bold hover:bg-zinc-50 hover:border-black transition active:scale-95">+ Masukkan Keranjang</button></div>
            <div className="grid grid-cols-2 gap-4 text-xs text-zinc-500 pt-4"><div className="flex gap-2 items-center"><span className="text-green-600 text-lg">✓</span> Produk Original 100%</div><div className="flex gap-2 items-center"><span className="text-green-600 text-lg">✓</span> Garansi Pengiriman</div><div className="flex gap-2 items-center"><span className="text-green-600 text-lg">✓</span> Material Premium</div><div className="flex gap-2 items-center"><span className="text-green-600 text-lg">✓</span> Support 24/7</div></div>
          </div>
        </div>
      </main>

      <footer className="mt-20 pt-16 pb-12 bg-black text-white text-sm border-t border-zinc-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6 mb-12">
          <div className="col-span-1 md:col-span-2 lg:col-span-1"><h4 className="font-bold text-amber-500 mb-4 text-base">Lokasi Showroom</h4><p className="text-zinc-400 mb-4 leading-relaxed">Juragan Akrilik, Tegal, Jawa Tengah.</p><div className="rounded-2xl overflow-hidden h-48 shadow-sm border border-zinc-800 relative"><iframe src="https://maps.google.com/maps?q=Juragan%20Akrilik%20Tegal&t=&z=13&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style={{border:0}} allowFullScreen="" loading="lazy" className="absolute inset-0 grayscale hover:grayscale-0 transition duration-500 opacity-80 hover:opacity-100"></iframe></div></div>
          <div className=""><h4 className="font-bold text-amber-500 mb-4 text-base">Navigasi</h4><ul className="space-y-3 text-zinc-400 font-medium"><li><Link href="/" className="hover:text-amber-500 transition">Beranda</Link></li><li><Link href="/#collection" className="hover:text-amber-500 transition">Produk Terbaru</Link></li><li><Link href="/#about" className="hover:text-amber-500 transition">Tentang Kami</Link></li><li><Link href="/#services" className="hover:text-amber-500 transition">Layanan</Link></li></ul></div>
          <div className=""><h4 className="font-bold text-amber-500 mb-4 text-base">Bantuan Pelanggan</h4><ul className="space-y-3 text-zinc-400 font-medium"><li><Link href="/cart" className="hover:text-amber-500 transition">Cek Keranjang</Link></li><li><span className="hover:text-amber-500 transition cursor-pointer">Konfirmasi Pembayaran</span></li><li><span className="hover:text-amber-500 transition cursor-pointer">Syarat & Ketentuan</span></li><li><span className="hover:text-amber-500 transition cursor-pointer">Kebijakan Privasi</span></li></ul></div>
          <div><h4 className="font-bold text-amber-500 mb-4 text-base">Hubungi Kami</h4><ul className="space-y-3 text-zinc-400 font-medium"><li><a href="https://wa.me/6285712087986" target="_blank" className="hover:text-green-500 transition flex items-center gap-2"><span className="text-lg">💬</span> WhatsApp Admin</a></li><li><a href="https://instagram.com/kaisen_interior" target="_blank" className="hover:text-pink-500 transition flex items-center gap-2"><span className="text-lg">📸</span> @kaisen_interior</a></li><li className="pt-4 flex items-center gap-2"><span className="text-lg">📧</span> hello@kaiseninterior.com</li></ul></div>
        </div>
        <div className="text-center py-8 border-t border-zinc-800 px-6"><p className="tracking-widest uppercase text-zinc-600 text-xs font-bold">© 2026 KAISEN INTERIOR. All Rights Reserved.</p></div>
      </footer>
    </div>
  );
}