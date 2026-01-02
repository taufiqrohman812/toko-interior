"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function DashboardAdmin() {
  const [products, setProducts] = useState([]);
  
  // State Form
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [image, setImage] = useState("");
  const [desc, setDesc] = useState(""); // <--- STATE BARU UNTUK DESKRIPSI

  useEffect(() => {
    const savedProducts = JSON.parse(localStorage.getItem("toko_interior_products") || "[]");
    setProducts(savedProducts);
  }, []);

  const addProduct = (e) => {
    e.preventDefault();
    const newProduct = { 
      id: Date.now(), // ID unik berdasarkan waktu
      name, 
      price: parseInt(price), 
      image: image || "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=400",
      desc: desc || "Tidak ada deskripsi produk." // <--- SIMPAN DESKRIPSI
    };
    
    const updatedProducts = [newProduct, ...products];
    setProducts(updatedProducts);
    localStorage.setItem("toko_interior_products", JSON.stringify(updatedProducts));
    
    // Reset form
    setName(""); setPrice(""); setImage(""); setDesc("");
    alert("Produk Berhasil Ditambahkan!");
  };

  const deleteProduct = (id) => {
    if(confirm("Hapus produk ini?")) {
      const filtered = products.filter(p => p.id !== id);
      setProducts(filtered);
      localStorage.setItem("toko_interior_products", JSON.stringify(filtered));
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-800 font-sans">
      <nav className="bg-white border-b border-slate-200 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-stone-800 text-white p-2 rounded-lg font-bold">LI</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          </div>
          <Link href="/" className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition">
            Lihat Toko ↗
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 lg:p-10">
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* FORM INPUT */}
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 sticky top-28">
              <h2 className="text-xl font-bold mb-6 text-slate-900">Tambah Produk Baru</h2>
              <form onSubmit={addProduct} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nama Barang</label>
                  <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={name} onChange={(e)=>setName(e.target.value)} required placeholder="Sofa..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Harga (Rp)</label>
                  <input type="number" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={price} onChange={(e)=>setPrice(e.target.value)} required placeholder="100000" />
                </div>
                
                {/* INPUT DESKRIPSI BARU */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Deskripsi Produk</label>
                  <textarea 
                    rows="4"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none resize-none" 
                    value={desc} 
                    onChange={(e)=>setDesc(e.target.value)} 
                    placeholder="Jelaskan spesifikasi, bahan, dan ukuran produk..."
                    required
                  ></textarea>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">URL Foto</label>
                  <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={image} onChange={(e)=>setImage(e.target.value)} placeholder="https://..." />
                </div>
                <button className="w-full bg-stone-800 text-white py-4 rounded-xl font-bold hover:bg-stone-700 transition shadow-lg">
                  Simpan ke Katalog
                </button>
              </form>
            </div>
          </div>

          {/* LIST PRODUK */}
          <div className="lg:col-span-2 space-y-4">
             {/* Sama seperti sebelumnya, hanya menampilkan list */}
             <h2 className="text-2xl font-bold text-slate-900">Katalog ({products.length})</h2>
             {products.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                  <div className="flex gap-4 items-center">
                    <img src={p.image} className="w-16 h-16 object-cover rounded-xl" />
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-amber-700 text-sm">Rp {p.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteProduct(p.id)} className="text-red-400 hover:text-red-600">Hapus</button>
                </div>
             ))}
          </div>
        </div>
      </main>
    </div>
  );
}