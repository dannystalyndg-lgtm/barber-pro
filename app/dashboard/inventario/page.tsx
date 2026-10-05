"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

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
      // Si seleccionó un archivo nuevo, lo subimos a Supabase Storage
      if (archivoImagen) {
        const fileExt = archivoImagen.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("productos")
          .upload(filePath, archivoImagen, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicURLData } = supabase.storage
          .from("productos")
          .getPublicUrl(filePath);

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
        const { error } = await supabase
          .from("products")
          .update(datosProducto)
          .eq("id", editandoId);

        if (error) throw error;
        alert("¡Producto y foto actualizados con éxito!");
      } else {
        const { error } = await supabase.from("products").insert([datosProducto]);
        if (error) throw error;
        alert("¡Producto creado con éxito!");
      }

      limpiarFormulario();
      cargarProductos();
    } catch (error: any) {
      console.error(error);
      alert("Error al subir la imagen o guardar: " + (error.message || "Error desconocido"));
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
    setEditandoId(null);
    setNombre("");
    setPrecio("");
    setStock("");
    setArchivoImagen(null);
    setImagenActualUrl("");
    setTipo("physical");
  };

  return (
    <div className="p-4 md:p-8 text-zinc-100">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-amber-500">Gestión de Inventario y Fotos</h1>
        <p className="text-zinc-400">Sube fotos reales desde tu dispositivo y gestiona tu catálogo.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario */}
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-1 h-fit shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-zinc-200">
              {editandoId ? "Editar Ítem" : "Nuevo Ítem"}
            </CardTitle>
            {editandoId && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={limpiarFormulario}
                className="text-xs bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
              >
                Cancelar
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={guardarProducto} className="space-y-4">
              <div>
                <Label className="text-zinc-400">Nombre</Label>
                <Input required value={nombre} onChange={e => setNombre(e.target.value)} className="bg-zinc-950 border-zinc-700 text-white mt-1" placeholder="Ej: Cera Mate Gorilla" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-zinc-400">Precio ($)</Label>
                  <Input required type="number" step="0.01" value={precio} onChange={e => setPrecio(e.target.value)} className="bg-zinc-950 border-zinc-700 text-white mt-1" placeholder="0.00" />
                </div>
                <div>
                  <Label className="text-zinc-400">Tipo</Label>
                  <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full h-10 mt-1 px-3 rounded-md bg-zinc-950 border border-zinc-700 text-sm text-white">
                    <option value="physical">Producto Físico</option>
                    <option value="service">Servicio</option>
                  </select>
                </div>
              </div>
              {tipo === "physical" && (
                <div>
                  <Label className="text-zinc-400">Stock</Label>
                  <Input required type="number" value={stock} onChange={e => setStock(e.target.value)} className="bg-zinc-950 border-zinc-700 text-white mt-1" placeholder="Cantidad" />
                </div>
              )}
              
              <div>
                <Label className="text-zinc-400">Foto del Producto</Label>
                {/* Input nativo de archivo para evitar bloqueos de UI */}
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => {
                    if (e.target.files && e.target.files[0]) {
                      setArchivoImagen(e.target.files[0]);
                    }
                  }} 
                  className="w-full mt-1 text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-700 cursor-pointer bg-zinc-950 border border-zinc-700 rounded-md p-1" 
                />
                {imagenActualUrl && !archivoImagen && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-zinc-400">Foto actual:</span>
                    <img src={imagenActualUrl} alt="Miniatura" className="w-8 h-8 object-cover rounded border border-zinc-700" />
                  </div>
                )}
              </div>

              <Button type="submit" disabled={cargando} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold mt-4">
                {cargando ? "Subiendo imagen y guardando..." : editandoId ? "Actualizar Ítem" : "Guardar Ítem"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Tabla del Catálogo */}
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2 shadow-xl">
          <CardHeader>
            <CardTitle className="text-zinc-200">Catálogo Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-zinc-800">
              <table className="w-full text-sm text-left text-zinc-400">
                <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50">
                  <tr>
                    <th className="px-4 py-4">Foto</th>
                    <th className="px-4 py-4">Nombre</th>
                    <th className="px-4 py-4">Tipo</th>
                    <th className="px-4 py-4">Precio</th>
                    <th className="px-4 py-4 text-center">Stock</th>
                    <th className="px-4 py-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {productos.map((prod) => (
                    <tr key={prod.id} className="hover:bg-zinc-950/50 transition-colors">
                      <td className="px-4 py-4">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-12 h-12 object-cover rounded-md border border-zinc-700 shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 bg-zinc-800 rounded-md flex items-center justify-center text-[10px] text-zinc-500">Sin foto</div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-zinc-200 font-medium">{prod.name}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${prod.type === 'physical' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'}`}>
                          {prod.type === 'physical' ? 'FÍSICO' : 'SERVICIO'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-emerald-400 font-medium">${prod.price}</td>
                      <td className="px-4 py-4 text-center text-zinc-300">{prod.type === 'physical' ? prod.stock : '—'}</td>
                      <td className="px-4 py-4 text-center">
                        <Button 
                          size="sm" 
                          onClick={() => iniciarEdicion(prod)}
                          className="bg-amber-600/20 text-amber-400 hover:bg-amber-600 hover:text-white border border-amber-500/30 text-xs"
                        >
                          Editar / Foto
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {productos.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                        No hay productos registrados aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}