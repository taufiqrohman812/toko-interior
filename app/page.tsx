"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient'; // Pastikan path ini benar

// DAFTAR KATEGORI
const CATEGORIES = ["All", "Living Room", "Dining Room", "Bedroom", "Office", "Kitchen", "Outdoor"];

// KOMPONEN COUNT UP
const CountUp = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); }
    }, { threshold: 0.5 });
    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - progress, 3)) * end));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return <span ref={countRef}>{count}{suffix}</span>;
};

// DATA SLIDE CAROUSEL
const slides = [
  { id: 1, image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1920", title: "Estetika Ruang Tamu", subtitle: "Koleksi sofa modern untuk kenyamanan maksimal keluarga Anda." },
  { id: 2, image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4f9d?q=80&w=1920", title: "Sentuhan Kayu Alami", subtitle: "Hadirkan kehangatan alam dengan furnitur material premium." },
  { id: 3, image: "https://images.unsplash.com/photo-1616137466218-f487bc505501?q=80&w=1920", title: "Ruang Kerja Minimalis", subtitle: "Tingkatkan produktivitas dengan desain meja yang ergonomis." }
];

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [flyingItem, setFlyingItem] = useState(null); 
  const [bumpCart, setBumpCart] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const router = useRouter();

  useEffect(() => {
    // 1. AMBIL DATA DARI SUPABASE
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setProducts(data);
      if (error) console.error("Error loading products:", error);
      setIsLoading(false);
    };
    fetchProducts();

    // 2. AMBIL CART DARI LOCAL STORAGE
    const currentCart = JSON.parse(localStorage.getItem("toko_interior_cart") || "[]");
    setCartItems(currentCart);

    const slideInterval = setInterval(() => { setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1)); }, 5000);
    const handleScroll = () => { if (window.scrollY > window.innerHeight - 100) setIsScrolled(true); else setIsScrolled(false); };
    window.addEventListener('scroll', handleScroll);
    return () => { clearInterval(slideInterval); window.removeEventListener('scroll', handleScroll); };
  }, []);

  const updateCartState = (newCart) => {
    setCartItems(newCart);
    localStorage.setItem("toko_interior_cart", JSON.stringify(newCart));
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    const buttonRect = e.target.getBoundingClientRect();
    const cartIcon = document.getElementById('cart-icon-target');
    let endX = window.innerWidth - 50; 
    let endY = 50;
    if (cartIcon) {
      const cartRect = cartIcon.getBoundingClientRect();
      endX = cartRect.left + (cartRect.width / 2);
      endY = cartRect.top + (cartRect.height / 2);
    }
    setFlyingItem({ image: product.image, x: buttonRect.left + (buttonRect.width / 2), y: buttonRect.top + (buttonRect.height / 2), width: 80, opacity: 1 });
    setTimeout(() => { setFlyingItem({ image: product.image, x: endX, y: endY, width: 20, opacity: 0 }); }, 50);
    setTimeout(() => {
      const newCart = [...cartItems, product];
      updateCartState(newCart);
      setFlyingItem(null);
      setBumpCart(true);
      setTimeout(() => setBumpCart(false), 300);
    }, 700);
  };

  const handleDirectBuy = (e, product) => {
    e.stopPropagation();
    const newCart = [...cartItems, product];
    updateCartState(newCart);
    router.push('/checkout');
  };

  const nextSlide = () => setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1));

  const groupedPreview = () => {
    const groups = {};
    cartItems.forEach(item => { if (groups[item.id]) groups[item.id].qty += 1; else groups[item.id] = { ...item, qty: 1 }; });
    return Object.values(groups);
  };
  const totalPrice = cartItems.reduce((acc, item) => acc + item.price, 0);

  // LOGIKA FILTER
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === "All" || (product.category && product.category === activeCategory);
    return matchesSearch && matchesCategory;
  });

  const scrollToSection = (id) => { const element = document.getElementById(id); if (element) element.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans overflow-x-hidden">
      {flyingItem && <img src={flyingItem.image} className="fixed z-[9999] rounded-full shadow-2xl object-cover pointer-events-none transition-all duration-700 ease-in-out" style={{ left: `${flyingItem.x}px`, top: `${flyingItem.y}px`, width: `${flyingItem.width}px`, height: `${flyingItem.width}px`, opacity: flyingItem.opacity, transform: 'translate(-50%, -50%)' }} />}

      {/* NAVBAR */}
      <nav className={`fixed top-0 left-0 w-full px-6 py-4 flex justify-between items-center z-50 transition-all duration-500 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-sm text-black' : 'bg-black/30 backdrop-blur-md border-b border-white/10 text-white'}`}>
        <Link href="/" className="flex-shrink-0 flex items-center gap-3 group">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGyPp7An3NS_fMKTqTD7R2pqIAfbpFyfccKw&s" alt="Logo" className="h-10 w-auto transition-all duration-500" />
          <h1 className={`text-xl font-black tracking-tighter uppercase transition-colors duration-500 drop-shadow-sm ${isScrolled ? 'text-black' : 'text-white'}`}>Kaisen<span className="text-amber-500">.</span>Interior</h1>
        </Link>
        <div className="hidden lg:flex items-center gap-8 font-medium text-sm tracking-wide">
          <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="hover:text-amber-500 transition">Beranda</button>
          <button onClick={() => scrollToSection('about')} className="hover:text-amber-500 transition">Tentang Kami</button>
          <button onClick={() => scrollToSection('collection')} className="hover:text-amber-500 transition">Produk</button>
          <button onClick={() => scrollToSection('services')} className="hover:text-amber-500 transition">Layanan</button>
        </div>
        <div className="flex items-center gap-4">
          <div className={`hidden md:flex items-center rounded-full px-4 py-2 transition-all w-64 border ${isScrolled ? 'bg-zinc-100 border-zinc-200 focus-within:ring-2 focus-within:ring-amber-500' : 'bg-white/10 border-white/20 focus-within:bg-black/40'}`}>
            <input type="text" placeholder="Cari furniture..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); if(e.target.value.length > 0) scrollToSection('collection'); }} className={`bg-transparent outline-none w-full text-sm placeholder-opacity-70 ${isScrolled ? 'text-black placeholder-zinc-400' : 'text-white placeholder-white'}`} />
            <button className={`${isScrolled ? 'text-zinc-400' : 'text-white/70'}`}>🔍</button>
          </div>
          <Link href="/admin" className={`text-xs font-bold transition px-4 py-2 rounded-full backdrop-blur-md shadow-sm whitespace-nowrap ${isScrolled ? 'bg-amber-500 text-black hover:bg-amber-400' : 'bg-white/10 text-white hover:bg-white/20'}`}>Admin</Link>
          <div className="relative" onMouseEnter={() => setShowCartPreview(true)} onMouseLeave={() => setShowCartPreview(false)}>
            <Link href="/cart" id="cart-icon-target" className={`relative cursor-pointer p-2 rounded-full px-4 flex items-center gap-2 transition duration-300 backdrop-blur-md border shadow-sm ${isScrolled ? 'bg-black border-black text-amber-500 hover:bg-zinc-800' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'} ${bumpCart ? 'scale-125 bg-amber-500 border-amber-500 text-black' : 'scale-100'}`}>
              <span className="text-lg">🛒</span><span className="font-bold">{cartItems.length}</span>
            </Link>
            {showCartPreview && <div className="absolute top-full right-0 mt-4 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 text-zinc-900"><div className="p-4 bg-zinc-50 border-b border-zinc-200"><h3 className="font-bold text-zinc-700 text-sm">Keranjang Belanja ({cartItems.length})</h3></div><div className="max-h-60 overflow-y-auto p-2 space-y-2">{cartItems.length === 0 ? (<p className="text-center text-zinc-400 text-xs py-4">Belum ada barang</p>) : (groupedPreview().map((item) => (<div key={item.id} className="flex gap-3 items-center p-2 hover:bg-zinc-50 rounded-xl transition"><img src={item.image} className="w-12 h-12 rounded-lg object-cover" /><div className="flex-1 min-w-0"><p className="text-sm font-bold text-black truncate">{item.name}</p><p className="text-xs text-amber-600 font-medium">{item.qty} x Rp {item.price.toLocaleString()}</p></div></div>)))}</div>{cartItems.length > 0 && (<div className="p-4 bg-zinc-50 border-t border-zinc-200"><div className="flex justify-between mb-3 text-sm font-bold"><span>Total:</span><span>Rp {totalPrice.toLocaleString()}</span></div><Link href="/cart" className="block w-full text-center bg-black text-amber-500 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition">Lihat Keranjang</Link></div>)}</div>}
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative w-full h-screen overflow-hidden bg-black">
        {slides.map((slide, index) => (
          <div key={slide.id} className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}>
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/40"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pt-16">
              <span className="text-amber-500 font-bold tracking-[0.3em] text-xs md:text-sm mb-4 uppercase animate-in slide-in-from-bottom-4 duration-1000 bg-black/50 px-4 py-1 rounded-full backdrop-blur-sm border border-amber-500/30">New Arrival 2026</span>
              <h2 className="text-3xl md:text-6xl font-black text-white mb-4 drop-shadow-2xl tracking-tight max-w-4xl leading-tight uppercase">{slide.title}</h2>
              <p className="text-zinc-200 text-sm md:text-lg max-w-2xl font-light mb-8 leading-relaxed drop-shadow-md px-4">{slide.subtitle}</p>
              <button onClick={() => scrollToSection('collection')} className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-amber-500 transition shadow-2xl active:scale-95 text-base border-2 border-transparent hover:border-black">Belanja Sekarang</button>
            </div>
          </div>
        ))}
        <button onClick={prevSlide} className="absolute left-4 md:left-10 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/30 p-4 rounded-full text-white backdrop-blur-sm transition border border-white/20">←</button>
        <button onClick={nextSlide} className="absolute right-4 md:right-10 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/30 p-4 rounded-full text-white backdrop-blur-sm transition border border-white/20">→</button>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-4">{slides.map((_, idx) => (<div key={idx} onClick={() => setCurrentSlide(idx)} className={`h-1.5 rounded-full cursor-pointer transition-all duration-500 ${idx === currentSlide ? 'bg-amber-500 w-12' : 'bg-white/40 w-4'}`}></div>))}</div>
      </section>

      {/* ABOUT SECTION */}
      <section id="about" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div><span className="text-amber-600 font-bold tracking-widest text-xs uppercase border-b-2 border-amber-500 pb-1">Tentang Kami</span><h2 className="text-4xl font-bold text-black mt-4 mb-6 leading-tight">Mewujudkan Hunian Impian dengan Kualitas Premium</h2><p className="text-zinc-600 leading-relaxed mb-8"><span className="font-bold text-black">KAISEN INTERIOR</span> hadir dengan visi modern: menghadirkan furnitur berkelas dengan sentuhan estetika Kunyit Emas yang khas.</p><div className="flex gap-10 border-t border-zinc-100 pt-8"><div><h4 className="text-4xl font-black text-amber-500"><CountUp end={5} suffix="k+" /></h4><p className="text-zinc-500 text-sm font-bold uppercase mt-1">Pelanggan Puas</p></div><div><h4 className="text-4xl font-black text-amber-500"><CountUp end={300} suffix="+" /></h4><p className="text-zinc-500 text-sm font-bold uppercase mt-1">Koleksi Produk</p></div></div></div>
          <div className="relative h-96 rounded-3xl overflow-hidden shadow-2xl"><div className="absolute inset-0 bg-amber-500/10 z-10"></div><img src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800" className="w-full h-full object-cover grayscale hover:grayscale-0 transition duration-700" /></div>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="py-24 px-6 bg-zinc-50">
        <div className="max-w-6xl mx-auto text-center mb-16"><span className="text-amber-600 font-bold tracking-widest text-xs uppercase">Layanan Kami</span><h2 className="text-3xl font-bold text-black mt-3">Pengalaman Belanja Terbaik</h2></div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
           <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition text-center group border border-zinc-100"><div className="text-4xl mb-6 bg-zinc-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto group-hover:bg-amber-100 transition">🚚</div><h3 className="font-bold text-xl mb-3">Gratis Ongkir</h3><p className="text-sm text-zinc-500">Pengiriman gratis ke seluruh pulau Jawa.</p></div>
           <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition text-center group border border-zinc-100"><div className="text-4xl mb-6 bg-zinc-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto group-hover:bg-amber-100 transition">🛡️</div><h3 className="font-bold text-xl mb-3">Garansi 2 Tahun</h3><p className="text-sm text-zinc-500">Jaminan kualitas rangka dan busa.</p></div>
           <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition text-center group border border-zinc-100"><div className="text-4xl mb-6 bg-zinc-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto group-hover:bg-amber-100 transition">💳</div><h3 className="font-bold text-xl mb-3">Cicilan 0%</h3><p className="text-sm text-zinc-500">Kerjasama dengan berbagai bank.</p></div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <main id="collection" className="max-w-6xl mx-auto py-24 px-6">
        <div className="text-center mb-10">
          <span className="text-amber-600 uppercase tracking-widest text-xs font-bold">Katalog Terbaru</span>
          <h2 className="text-4xl font-bold mt-3 text-black">Koleksi Pilihan</h2>
          {searchTerm && <p className="mt-4 text-zinc-500">Menampilkan hasil: <span className="font-bold text-black">"{searchTerm}"</span></p>}
        </div>

        {/* TAB KATEGORI */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider border-2 transition ${activeCategory === cat ? 'bg-black border-black text-amber-500' : 'bg-white border-zinc-200 text-zinc-500 hover:border-black hover:text-black'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-20 text-zinc-400">Memuat koleksi...</div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
            {filteredProducts.map((product) => {
              // --- LOGIKA HARGA CORET ---
              const hasDiscount = product.original_price && product.original_price > product.price;
              const discountPercent = hasDiscount 
                ? Math.round(((product.original_price - product.price) / product.original_price) * 100) 
                : 0;

              return (
              <div key={product.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-zinc-100 flex flex-col">
                <div onClick={() => router.push(`/product/${product.id}`)} className="relative h-64 overflow-hidden cursor-pointer">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur text-xs px-3 py-1 rounded-full font-bold shadow-sm opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">Lihat Detail ↗</span>
                  
                  {/* BADGE DISKON */}
                  {hasDiscount && (
                    <span className="absolute top-4 left-4 bg-amber-500 text-black text-[10px] px-2 py-1 rounded-full font-bold shadow-sm">
                      Save {discountPercent}%
                    </span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  {product.category && <p className="text-[10px] uppercase font-bold text-amber-600 mb-1 tracking-widest">{product.category}</p>}
                  <h3 onClick={() => router.push(`/product/${product.id}`)} className="text-lg font-bold text-black leading-tight cursor-pointer hover:underline mb-2 line-clamp-2">{product.name}</h3>
                  
                  {/* HARGA */}
                  <div className="mb-4 flex flex-col items-start">
                    {hasDiscount && (
                      <span className="text-xs text-zinc-400 line-through mb-1">
                        Rp {product.original_price.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                      </span>
                    )}
                    <span className="text-xl font-bold text-amber-600">Rp {product.price.toLocaleString('id-ID')}</span>
                  </div>

                  <div className="mt-auto flex flex-col gap-2">
                    <button onClick={(e) => handleAddToCart(e, product)} className="w-full bg-zinc-100 text-zinc-800 py-2.5 rounded-xl font-bold hover:bg-zinc-200 transition active:scale-95 flex justify-center items-center gap-2 border border-zinc-200 text-sm"><span>+</span> Keranjang</button>
                    <button onClick={(e) => handleDirectBuy(e, product)} className="w-full bg-black text-amber-500 py-2.5 rounded-xl font-bold hover:bg-zinc-900 transition-all active:scale-95 shadow-lg shadow-zinc-200 text-sm border border-black hover:border-amber-500">Beli Sekarang</button>
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-3xl border-2 border-dashed border-zinc-200">
            <h3 className="text-xl font-medium text-zinc-400 font-serif">
              {activeCategory === "All" ? (searchTerm ? `Produk "${searchTerm}" tidak ditemukan.` : "Koleksi belum tersedia") : `Belum ada produk di kategori ${activeCategory}`}
            </h3>
            {!searchTerm && <Link href="/admin" className="text-black underline font-bold mt-2 inline-block">Ke Admin Panel</Link>}
            {searchTerm && <button onClick={() => setSearchTerm("")} className="text-amber-600 underline font-bold mt-2 inline-block">Reset Pencarian</button>}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="mt-20 pt-16 pb-12 bg-black text-white text-sm border-t border-zinc-800">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6 mb-12">
          <div className="col-span-1 md:col-span-2 lg:col-span-1"><h4 className="font-bold text-amber-500 mb-4 text-base">Lokasi Showroom</h4><p className="text-zinc-400 mb-4 leading-relaxed">Juragan Akrilik, Tegal, Jawa Tengah.</p><div className="rounded-2xl overflow-hidden h-48 shadow-sm border border-zinc-800 relative"><iframe src="https://maps.google.com/maps?q=Juragan%20Akrilik%20Tegal&t=&z=13&ie=UTF8&iwloc=&output=embed" width="100%" height="100%" style={{border:0}} allowFullScreen="" loading="lazy" className="absolute inset-0 grayscale hover:grayscale-0 transition duration-500 opacity-80 hover:opacity-100"></iframe></div></div>
          <div className=""><h4 className="font-bold text-amber-500 mb-4 text-base">Navigasi</h4><ul className="space-y-3 text-zinc-400 font-medium"><li><button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="hover:text-amber-500 transition">Beranda</button></li><li><button onClick={() => scrollToSection('collection')} className="hover:text-amber-500 transition">Produk Terbaru</button></li><li><button onClick={() => scrollToSection('about')} className="hover:text-amber-500 transition">Tentang Kami</button></li><li><button onClick={() => scrollToSection('services')} className="hover:text-amber-500 transition">Layanan</button></li></ul></div>
          <div className=""><h4 className="font-bold text-amber-500 mb-4 text-base">Bantuan Pelanggan</h4><ul className="space-y-3 text-zinc-400 font-medium"><li><Link href="/cart" className="hover:text-amber-500 transition">Cek Keranjang</Link></li><li><button className="hover:text-amber-500 transition">Konfirmasi Pembayaran</button></li><li><button className="hover:text-amber-500 transition">Syarat & Ketentuan</button></li><li><button className="hover:text-amber-500 transition">Kebijakan Privasi</button></li></ul></div>
          <div><h4 className="font-bold text-amber-500 mb-4 text-base">Hubungi Kami</h4><ul className="space-y-3 text-zinc-400 font-medium"><li><a href="https://wa.me/6285712087986" target="_blank" className="hover:text-green-500 transition flex items-center gap-2"><span className="text-lg">💬</span> WhatsApp Admin</a></li><li><a href="https://instagram.com/kaisen_interior" target="_blank" className="hover:text-pink-500 transition flex items-center gap-2"><span className="text-lg">📸</span> @kaisen_interior</a></li><li className="pt-4 flex items-center gap-2"><span className="text-lg">📧</span> hello@kaiseninterior.com</li></ul></div>
        </div>
        <div className="text-center py-8 border-t border-zinc-800 px-6"><p className="tracking-widest uppercase text-zinc-600 text-xs font-bold">© 2026 KAISEN INTERIOR. All Rights Reserved.</p></div>
      </footer>
    </div>
  );
}