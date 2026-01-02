"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

const CATEGORIES = ["Living Room", "Dining Room", "Bedroom", "Office", "Kitchen", "Outdoor"];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [activeTab, setActiveTab] = useState("dashboard");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // FORM STATE: Mencakup semua fitur (Harga Coret & Berat)
  const [form, setForm] = useState({ 
    name: "", 
    price: "", 
    original_price: "", 
    weight: 1000, 
    image: "", 
    desc: "", 
    category: "Living Room" 
  });
  
  const [isEditing, setIsEditing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadData = async () => {
    const { data: dataProd } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (dataProd) setProducts(dataProd);

    const { data: dataOrd } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (dataOrd) setOrders(dataOrd);
  };

  useEffect(() => {
    const session = sessionStorage.getItem("kaisen_admin_session");
    if (session === "active") {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === "admin123") {
      setIsAuthenticated(true);
      sessionStorage.setItem("kaisen_admin_session", "active");
      setLoginError("");
      loadData();
    } else {
      setLoginError("Password salah!");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("kaisen_admin_session");
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const fileName = `${Date.now()}-${file.name}`;
    
    const { error } = await supabase.storage.from('products').upload(fileName, file);

    if (error) {
      alert("Gagal upload gambar: " + error.message);
      setUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage.from('products').getPublicUrl(fileName);
    setForm(prev => ({ ...prev, image: publicData.publicUrl }));
    setUploading(false);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.image) return alert("Mohon lengkapi data!");
    
    const productData = { 
      name: form.name,
      price: Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      weight: Number(form.weight),
      image: form.image,
      desc: form.desc,
      category: form.category || "Living Room"
    };

    if (isEditing) {
      const { error } = await supabase.from('products').update(productData).eq('id', isEditing);
      if (!error) { setIsEditing(null); loadData(); alert("Produk berhasil diupdate!"); }
    } else {
      const { error } = await supabase.from('products').insert([productData]);
      if (!error) { loadData(); alert("Produk berhasil ditambah!"); }
    }
    setForm({ name: "", price: "", original_price: "", weight: 1000, image: "", desc: "", category: "Living Room" });
  };

  const handleDeleteProduct = async (id) => {
    if (confirm("Hapus produk ini?")) {
      await supabase.from('products').delete().eq('id', id);
      loadData();
    }
  };

  const handleDeleteOrder = async (id) => {
    if (confirm("Hapus riwayat pesanan ini?")) {
      await supabase.from('orders').delete().eq('id', id);
      loadData();
    }
  };

  const totalRevenue = orders.filter(o => o.status === 'Lunas').reduce((acc, curr) => acc + Number(curr.total), 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 font-sans text-zinc-900">
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-zinc-100 max-w-sm w-full text-center">
          <div className="mb-8 flex justify-center"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGyPp7An3NS_fMKTqTD7R2pqIAfbpFyfccKw&s" alt="Logo" className="h-16 w-auto" /></div>
          <h1 className="text-2xl font-black uppercase mb-2">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full p-4 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 text-center font-bold text-black" />
            {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
            <button type="submit" className="w-full bg-black text-amber-500 py-4 rounded-xl font-bold hover:bg-zinc-800 transition">MASUK DASHBOARD</button>
          </form>
          <Link href="/" className="block mt-6 text-xs text-zinc-400 hover:text-black transition uppercase font-bold tracking-widest">← Kembali ke Website</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 flex flex-col md:flex-row">
      <aside className="bg-black text-white w-full md:w-64 flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-2">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTGyPp7An3NS_fMKTqTD7R2pqIAfbpFyfccKw&s" className="h-8 w-auto invert" />
          <span className="font-bold text-amber-500 tracking-wider">ADMIN</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition flex items-center gap-3 ${activeTab === 'dashboard' ? 'bg-amber-500 text-black' : 'hover:bg-zinc-900 text-zinc-400'}`}>📊 Dashboard</button>
          <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition flex items-center gap-3 ${activeTab === 'orders' ? 'bg-amber-500 text-black' : 'hover:bg-zinc-900 text-zinc-400'}`}>📦 Pesanan Masuk <span className="ml-auto bg-white text-black text-[10px] px-2 rounded-full">{orders.length}</span></button>
          <button onClick={() => setActiveTab('products')} className={`w-full text-left px-4 py-3 rounded-xl font-bold transition flex items-center gap-3 ${activeTab === 'products' ? 'bg-amber-500 text-black' : 'hover:bg-zinc-900 text-zinc-400'}`}>🛋️ Kelola Produk</button>
        </nav>
        <div className="p-4 border-t border-zinc-800">
          <button onClick={handleLogout} className="w-full bg-red-900/30 text-red-500 py-3 rounded-xl font-bold hover:bg-red-900/50 transition border border-red-900/50">LOGOUT</button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-black uppercase">Dashboard Ringkasan</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100"><p className="text-zinc-400 font-bold text-xs uppercase mb-2">Total Pendapatan (Lunas)</p><h3 className="text-3xl font-black text-green-600">Rp {totalRevenue.toLocaleString('id-ID')}</h3></div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100"><p className="text-zinc-400 font-bold text-xs uppercase mb-2">Total Pesanan</p><h3 className="text-3xl font-black text-black">{orders.length}</h3></div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-zinc-100"><p className="text-zinc-400 font-bold text-xs uppercase mb-2">Produk Aktif</p><h3 className="text-3xl font-black text-black">{products.length}</h3></div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-3xl font-black uppercase">Kelola Produk</h2>
             <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-zinc-200">
                <form onSubmit={handleSaveProduct} className="grid md:grid-cols-3 gap-4">
                   <div className="md:col-span-3">
                      <label className="text-xs font-bold uppercase text-zinc-400">Nama Produk</label>
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl mt-1 text-black outline-none focus:ring-2 ring-amber-500" required />
                   </div>
                   <div>
                      <label className="text-xs font-bold uppercase text-zinc-400">Harga Jual</label>
                      <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl mt-1 text-black outline-none focus:ring-2 ring-amber-500" required />
                   </div>
                   <div>
                      <label className="text-xs font-bold uppercase text-zinc-400">Harga Coret</label>
                      <input type="number" value={form.original_price} onChange={e => setForm({...form, original_price: e.target.value})} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl mt-1 text-black outline-none focus:ring-2 ring-amber-500" />
                   </div>
                   <div>
                      <label className="text-xs font-bold uppercase text-zinc-400">Berat (Gram)</label>
                      <input type="number" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl mt-1 text-black outline-none focus:ring-2 ring-amber-500" required />
                   </div>
                   <div className="md:col-span-3">
                      <label className="text-xs font-bold uppercase text-zinc-400 mb-2 block">Foto Produk</label>
                      {form.image && <img src={form.image} className="w-20 h-20 rounded-lg object-cover mb-2" />}
                      <input type="file" onChange={handleUpload} className="text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200" />
                   </div>
                   <div className="md:col-span-3">
                      <button type="submit" disabled={uploading} className="w-full bg-black text-amber-500 py-4 rounded-xl font-bold uppercase tracking-widest">{isEditing ? "Update Produk" : "Tambah Produk"}</button>
                   </div>
                </form>
             </div>

             <div className="grid md:grid-cols-2 gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-2xl border border-zinc-100 flex gap-4 items-center">
                    <img src={p.image} className="w-16 h-16 rounded-lg object-cover bg-zinc-100" />
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-black">{p.name}</h4>
                      <p className="text-xs text-zinc-400">Rp {p.price.toLocaleString()} | {p.weight}g</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => {setForm(p); setIsEditing(p.id);}} className="text-xs font-bold text-amber-600">Edit</button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="text-xs font-bold text-red-500">Hapus</button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 text-zinc-900">
            <h2 className="text-3xl font-black uppercase">📦 Pesanan Masuk</h2>
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-zinc-200 text-zinc-400 font-bold uppercase tracking-widest text-xs">Belum ada pesanan masuk.</div>
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-sm hover:shadow-md transition">
                    <div className="flex flex-col md:flex-row justify-between border-b border-zinc-100 pb-4 mb-4 gap-4">
                      <div>
                        <span className="bg-zinc-100 text-zinc-600 text-[10px] font-bold px-2 py-1 rounded-md mb-2 inline-block">#{order.id}</span>
                        <h3 className="font-black text-xl text-black uppercase italic">{order.customer_name}</h3>
                        <p className="text-xs text-zinc-500">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-amber-600">Rp {Number(order.total).toLocaleString('id-ID')}</p>
                        <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest ${order.status === 'Lunas' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-zinc-50 p-4 rounded-2xl">
                        <h4 className="font-bold text-[10px] uppercase text-zinc-400 mb-2 tracking-widest">Detail Item</h4>
                        <ul className="space-y-2">
                          {order.items?.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-xs font-bold text-black uppercase">
                              <span>{item.name} <span className="text-amber-600">x1</span></span>
                              <span>Rp {item.price.toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-2xl h-full">
                        <h4 className="font-bold text-[10px] uppercase text-zinc-400 mb-2 tracking-widest">Pengiriman</h4>
                        <p className="text-xs text-black uppercase font-bold"><strong>WA:</strong> {order.whatsapp}</p>
                        <p className="text-xs text-black uppercase font-bold mt-1"><strong>Alamat:</strong> {order.address}</p>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-3 border-t border-zinc-100 pt-4">
                      <button onClick={() => handleDeleteOrder(order.id)} className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline">Hapus Data</button>
                      <a href={`https://wa.me/${order.whatsapp?.replace(/\D/g, '')}?text=Halo%20${order.customer_name},%20pesanan%20ID%20${order.id}%20sedang%20kami%20proses.`} target="_blank" className="bg-green-500 text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-green-600 transition uppercase tracking-widest">Hubungi WhatsApp</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}