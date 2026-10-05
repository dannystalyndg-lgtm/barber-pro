"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent } from "../../../components/ui/card";
import { Package, Image as ImageIcon, Edit2, Plus, UploadCloud, Box, Scissors } from "lucide-react";

export default function InventarioPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [tipo, setTipo] = useState("physical");
  const [stock, setStock] = useState("");
  
  const [archivoImagen, setArchivoImagen] = useState<File | null>(null);
  const [imagenActualUrl, setImagenActualUrl] = useState("");
  const [cargando, setCargando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  const cargarProductos = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setProductos(data);
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    let urlFinalImagen = imagenActualUrl;

    try {
      if (archivoImagen) {
        const fileExt = archivoImagen.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("productos")
          .upload(fileName, archivoImagen, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicURLData } = supabase.storage
          .from("productos")
          .getPublicUrl(fileName);

        urlFinalImagen = publicURLData.publicUrl;
      }

      const datosProducto = {
        name: nombre,
        price: parseFloat(precio),
        type: tipo,
        stock: tipo === "physical" ? parseInt(stock) : 0,
        image_url: urlFinalImagen,
      };

      if (editandoId) {
        const { error } = await supabase.from("products").update(datosProducto).eq("id", editandoId);
        if (error) throw error;
        alert("¡Producto actualizado con éxito!");
      } else {
        const { error } = await supabase.from("products").insert([datosProducto]);
        if (error) throw error;
        alert("¡Producto creado con éxito!");
      }

      limpiarFormulario();
      cargarProductos();
    } catch (error: any) {
      alert("Error al guardar: " + (error.message || "Error desconocido"));
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicion = (prod: any) => {
    setEditandoId(prod.id);
    setNombre(prod.name || "");
    setPrecio(prod.price?.toString() || "");
    setTipo(prod.type || "physical");
    setStock(prod.stock?.toString() || "");
    setImagenActualUrl(prod.image_url || "");
    setArchivoImagen(null);
  };

  const limpiarFormulario = () => {
    setEditandoId(null); setNombre(""); setPrecio(""); setStock(""); 
    setArchivoImagen(null); setImagenActualUrl(""); setTipo("physical");
  };

  return (
    <div className="p-4 md:p-8 text-zinc-100 max-w-7xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-amber-500 flex items-center gap-3">
          <Package className="w-8 h-8" /> Inventario y Servicios
        </h1>
        <p className="text-sm md:text-base text-zinc-400">Gestiona tu catálogo y sube fotos reales de tus trabajos o productos.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* ================= FORMULARIO ================= */}
        <div className="xl:col-span-4">
          <Card className="bg-zinc-900/60 backdrop-blur-xl border-zinc-800/60 shadow-2xl rounded-3xl sticky top-4">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-zinc-100">
                  {editandoId ? "Editar Ítem" : "Nuevo Ítem"}
                </h2>
                {editandoId && (
                  <Button variant="ghost" size="sm" onClick={limpiarFormulario} className="text-xs text-zinc-400 hover:text-white">
                    Cancelar
                  </Button>
                )}
              </div>

              <form onSubmit={guardarProducto} className="space-y-5">
                <div>
                  <Label className="text-zinc-400 text-xs ml-1">Nombre del producto/servicio</Label>
                  <Input required value={nombre} onChange={e => setNombre(e.target.value)} className="bg-zinc-950 border-none text-white h-12 rounded-xl mt-1 focus:ring-1 focus:ring-amber-500" placeholder="Ej: Cera Mate Gorilla" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-zinc-400 text-xs ml-1">Precio ($)</Label>
                    <Input required type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} className="bg-zinc-950 border-none text-white h-12 rounded-xl mt-1 focus:ring-1 focus:ring-amber-500" placeholder="0.00" />
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-xs ml-1">Tipo</Label>
                    <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full h-12 mt-1 px-3 rounded-xl bg-zinc-950 border-none text-sm text-white focus:ring-1 focus:ring-amber-500 appearance-none">
                      <option value="physical">Físico</option>
                      <option value="service">Servicio</option>
                    </select>
                  </div>
                </div>

                {tipo === "physical" && (
                  <div>
                    <Label className="text-zinc-400 text-xs ml-1">Stock Disponible</Label>
                    <Input required type="number" value={stock} onChange={e => setStock(e.target.value)} className="bg-zinc-950 border-none text-white h-12 rounded-xl mt-1 focus:ring-1 focus:ring-amber-500" placeholder="Cantidad" />
                  </div>
                )}
                
                <div className="bg-zinc-950/50 p-4 rounded-xl border border-zinc-800 border-dashed">
                  <Label className="text-zinc-400 text-xs mb-2 flex items-center gap-2"><ImageIcon size={14}/> Foto del Ítem</Label>
                  <input 
                    type="file" accept="image/*"
                    onChange={e => { if (e.target.files && e.target.files[0]) setArchivoImagen(e.target.files[0]); }} 
                    className="w-full text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-amber-500/10 file:text-amber-500 hover:file:bg-amber-500 hover:file:text-white transition-all cursor-pointer" 
                  />
                  {imagenActualUrl && !archivoImagen && (
                    <div className="mt-4 flex items-center gap-3 bg-zinc-900 p-2 rounded-lg">
                      <img src={imagenActualUrl} alt="Miniatura" className="w-10 h-10 object-cover rounded-md border border-zinc-700" />
                      <span className="text-xs text-zinc-400">Foto actual guardada</span>
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={cargando} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold h-12 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                  {cargando ? "Guardando..." : editandoId ? <><Edit2 size={18}/> Actualizar Ítem</> : <><Plus size={18}/> Crear Ítem</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ================= CATÁLOGO ================= */}
        <div className="xl:col-span-8 space-y-4">
          
          {/* Vista Móvil (Tarjetas) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
            {productos.map((prod) => (
              <div key={prod.id} className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4 flex gap-4 items-center">
                <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                  {prod.image_url ? <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" /> : <ImageIcon className="text-zinc-700 w-8 h-8" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${prod.type === 'service' ? 'bg-amber-950 text-amber-400' : 'bg-blue-950 text-blue-400'}`}>
                    {prod.type === 'service' ? 'Servicio' : 'Físico'}
                  </span>
                  <h3 className="font-bold text-zinc-100 text-sm truncate">{prod.name}</h3>
                  <div className="flex justify-between items-end mt-1">
                    <div>
                      <p className="text-lg font-black text-emerald-400">${prod.price}</p>
                      {prod.type === 'physical' && <p className="text-[10px] text-zinc-500">Stock: {prod.stock}</p>}
                    </div>
                    <button onClick={() => iniciarEdicion(prod)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 p-2 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vista Escritorio (Tabla moderna) */}
          <div className="hidden md:block bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/60 rounded-3xl overflow-hidden shadow-2xl">
            <table className="w-full text-sm text-left text-zinc-400">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/80 border-b border-zinc-800/50">
                <tr>
                  <th className="px-6 py-5 font-semibold">Producto / Servicio</th>
                  <th className="px-6 py-5 font-semibold">Tipo</th>
                  <th className="px-6 py-5 font-semibold">Precio</th>
                  <th className="px-6 py-5 font-semibold text-center">Stock</th>
                  <th className="px-6 py-5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {productos.map((prod) => (
                  <tr key={prod.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
                        {prod.image_url ? <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" /> : <ImageIcon className="text-zinc-700 w-5 h-5" />}
                      </div>
                      <span className="text-zinc-200 font-bold">{prod.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${prod.type === 'service' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                        {prod.type === 'service' ? <><Scissors size={12}/> Servicio</> : <><Box size={12}/> Físico</>}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-black">${prod.price}</td>
                    <td className="px-6 py-4 text-center font-medium">{prod.type === 'physical' ? prod.stock : '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" onClick={() => iniciarEdicion(prod)} className="bg-zinc-800 hover:bg-amber-600 text-zinc-300 hover:text-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                        <Edit2 size={16} className="mr-2"/> Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productos.length === 0 && (
              <div className="py-20 text-center text-zinc-500">No hay productos registrados aún.</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}