"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent } from "../../components/ui/card";
// Agregamos el ícono Trash2 a las importaciones
import { ShoppingCart, Plus, Minus, X, Store, Calendar as CalendarIcon, Search, CheckCircle2, Trash2 } from "lucide-react";

export default function TiendaPublicaPage() {
  const [seccion, setSeccion] = useState<"tienda" | "citas">("tienda");
  
  // Estados Tienda
  const [productos, setProductos] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [nombreCliente, setNombreCliente] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [isCartModalOpen, setIsCartModalOpen] = useState(false); // Para el carrito en celular

  // Estados Citas
  const [barberos, setBarberos] = useState<any[]>([]);
  
  // Lista oficial de servicios
  const serviciosDisponibles = [
    { id: "serv-1", name: "Corte de cabello", price: 10.00 },
    { id: "serv-2", name: "Corte de cabello más barba", price: 15.00 },
    { id: "serv-3", name: "Corte + Ceja + Barba", price: 18.00 },
    { id: "serv-4", name: "Pintado de cabello", price: 20.00 },
  ];
  
  const [barberoElegido, setBarberoElegido] = useState<any>(null);
  const [servicioCita, setServicioCita] = useState<any>(null);
  const [nombreCita, setNombreCita] = useState("");
  const [fechaCita, setFechaCita] = useState("");
  const [enviando, setEnviando] = useState(false);

  const TELEFONO_GERENTE = "593999999999"; // Reemplaza con el tuyo

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: prods } = await supabase.from("products").select("*");
      if (prods) setProductos(prods);

      const { data: barbs } = await supabase.from("barbers").select("*");
      if (barbs) setBarberos(barbs);
    };
    cargarDatos();
  }, []);

  const agregarAlCarrito = (producto: any) => {
    const itemExistente = carrito.find(item => item.id === producto.id);
    if (itemExistente) {
      setCarrito(carrito.map(item => 
        item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
      ));
    } else {
      setCarrito([...carrito, { ...producto, cantidad: 1 }]);
    }
  };

  const removerDelCarrito = (id: string) => {
    const nuevoCarrito = carrito.filter(item => item.id !== id);
    setCarrito(nuevoCarrito);
    // Si borramos el último producto en el celular, cerramos la pestaña flotante
    if (nuevoCarrito.length === 0) setIsCartModalOpen(false); 
  };

  const modificarCantidad = (id: string, delta: number) => {
    const itemActual = carrito.find(item => item.id === id);
    
    // Si la cantidad llega a 0, eliminamos el producto automáticamente
    if (itemActual && itemActual.cantidad + delta < 1) {
      removerDelCarrito(id);
    } else {
      setCarrito(carrito.map(item => 
        item.id === id ? { ...item, cantidad: item.cantidad + delta } : item
      ));
    }
  };

  const totalVenta = carrito.reduce((total, item) => total + (item.price * item.cantidad), 0);
  const cantidadItemsCarrito = carrito.reduce((total, item) => total + item.cantidad, 0);

  const enviarPedidoWhatsApp = () => {
    if (!nombreCliente.trim()) {
      alert("Por favor ingresa tu nombre.");
      return;
    }
    if (carrito.length === 0) return;

    let mensaje = `*NUEVO PEDIDO / COMPRA WEB*\n\n`;
    mensaje += `- Cliente: ${nombreCliente}\n\nProductos:\n`;
    carrito.forEach((item) => {
      mensaje += `* ${item.cantidad}x ${item.name} ($${(item.price * item.cantidad).toFixed(2)})\n`;
    });
    mensaje += `\nTotal: $${totalVenta.toFixed(2)}`;

    window.open(`https://wa.me/${TELEFONO_GERENTE}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  const enviarCitaWhatsApp = async () => {
    if (enviando) return;
    if (!nombreCita.trim() || !barberoElegido || !servicioCita || !fechaCita) {
      alert("Por favor completa todos los campos para agendar la cita.");
      return;
    }

    setEnviando(true);
    const { error } = await supabase.from("appointments").insert([{
      client_name: nombreCita,
      barber_id: barberoElegido.id,
      service_name: servicioCita.name,
      service_price: servicioCita.price,
      appointment_date: fechaCita,
      status: "pending"
    }]);

    if (error) {
      alert("Error al registrar la cita: " + error.message);
      setEnviando(false);
      return;
    }

    let mensaje = `*SOLICITUD DE CITA PROFESIONAL*\n\n`;
    mensaje += `• Cliente: ${nombreCita}\n`;
    mensaje += `• Barbero: ${barberoElegido.name}\n`;
    mensaje += `• Servicio: ${servicioCita.name} ($${servicioCita.price.toFixed(2)})\n`;
    mensaje += `• Fecha y Hora: ${new Date(fechaCita).toLocaleString()}\n\n`;
    mensaje += `Hola ${barberoElegido.name}, acabo de solicitar esta cita desde la web. Quedo a la espera de confirmación.`;

    const numeroDestino = barberoElegido.phone || TELEFONO_GERENTE;
    window.open(`https://wa.me/${numeroDestino}?text=${encodeURIComponent(mensaje)}`, "_blank");
    
    setNombreCita(""); setFechaCita(""); setBarberoElegido(null); setServicioCita(null); setEnviando(false);
  };

  const productosFiltrados = productos.filter(p => p.name.toLowerCase().includes(busqueda.toLowerCase()));

  // Componente reutilizable del Carrito (Para usarlo en Desktop y en el Modal de Celular)
  const RenderCarritoUI = () => (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-zinc-100 mb-6 flex items-center gap-2">
        <ShoppingCart size={24} className="text-amber-500" /> 
        Tu Pedido
      </h2>
      
      <div className="space-y-1 mb-6">
        <label className="text-xs text-zinc-400 font-medium ml-1">¿Quién retira el pedido? *</label>
        <Input 
          placeholder="Ej: Carlos Mendoza" 
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
          className="bg-zinc-950 border-zinc-800 text-white h-12 rounded-xl focus:ring-amber-500/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {carrito.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 opacity-50">
            <ShoppingCart size={40} className="mb-2" />
            <p className="text-zinc-400 text-sm">Tu carrito está vacío</p>
          </div>
        ) : (
          carrito.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800/50">
              <div className="flex-1 pr-2">
                <p className="text-sm font-bold text-zinc-200 line-clamp-1">{item.name}</p>
                <p className="text-xs text-emerald-400 font-medium">${(item.cantidad * item.price).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                {/* BOTÓN BASURERO NUEVO */}
                <button 
                  onClick={() => removerDelCarrito(item.id)} 
                  className="bg-red-500/10 text-red-500 hover:bg-red-500/20 p-1.5 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
                
                <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-2 py-1 border border-zinc-800">
                  <button onClick={() => modificarCantidad(item.id, -1)} className="text-zinc-400 hover:text-white p-1">
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{item.cantidad}</span>
                  <button onClick={() => modificarCantidad(item.id, 1)} className="text-zinc-400 hover:text-white p-1">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-6 mt-4 border-t border-zinc-800/80">
        <div className="flex justify-between items-end mb-6">
          <span className="text-zinc-400 text-sm">Total a pagar</span>
          <span className="text-3xl font-black text-emerald-400">${totalVenta.toFixed(2)}</span>
        </div>
        <Button 
          onClick={enviarPedidoWhatsApp}
          disabled={carrito.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-14 text-base rounded-2xl shadow-[0_0_20px_rgba(5,150,105,0.2)] transition-all active:scale-95"
        >
          Enviar Pedido por WhatsApp
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-24 md:pb-8 selection:bg-amber-500/30">
      
      {/* ================= HEADER STICKY ================= */}
      <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900/50 pt-4 pb-4 px-4 md:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent tracking-tighter">BARBER PRO</h1>
            <p className="text-zinc-500 text-xs tracking-widest uppercase mt-0.5 font-medium">Tienda & Reservas</p>
          </div>
          
          {/* Segmented Control (Pestañas nativas) */}
          <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 w-full md:w-auto shadow-inner">
            <button 
              onClick={() => setSeccion("tienda")}
              className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${seccion === "tienda" ? "bg-zinc-800 text-amber-500 shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <Store size={18} /> Tienda
            </button>
            <button 
              onClick={() => setSeccion("citas")}
              className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${seccion === "citas" ? "bg-zinc-800 text-amber-500 shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <CalendarIcon size={18} /> Citas
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-8 mt-4">
        
        {/* ================= SECCIÓN 1: TIENDA ================= */}
        {seccion === "tienda" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Lista de Productos */}
            <div className="lg:col-span-8 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <Input 
                  placeholder="Buscar productos o servicios..." 
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="bg-zinc-900/50 border-zinc-800 text-white pl-12 h-14 rounded-2xl text-lg focus:ring-amber-500/30"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {productosFiltrados.map((prod) => {
                  const enCarrito = carrito.find(item => item.id === prod.id);
                  return (
                    <div key={prod.id} className="group relative bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-4 flex gap-4 items-center hover:bg-zinc-900 transition-all overflow-hidden">
                      {/* Imagen con diseño moderno */}
                      <div className="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800/50 shadow-inner">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-zinc-600 font-medium">
                            <Store size={24} className="mb-1 opacity-20" />
                            Sin foto
                          </div>
                        )}
                      </div>
                      
                      {/* Info del producto */}
                      <div className="flex-1 py-1">
                        <h3 className="font-bold text-zinc-100 text-sm leading-tight pr-2">{prod.name}</h3>
                        <p className="text-xl font-black text-emerald-400 mt-2">${prod.price}</p>
                        
                        <div className="mt-3 flex items-center justify-between">
                          {enCarrito ? (
                            <div className="flex items-center gap-2">
                               <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                                 Agregado ({enCarrito.cantidad})
                               </span>
                            </div>
                          ) : (
                            <button 
                              onClick={() => agregarAlCarrito(prod)}
                              className="text-xs font-bold bg-amber-500/10 text-amber-500 px-4 py-2 rounded-full hover:bg-amber-500 hover:text-white transition-colors flex items-center gap-1"
                            >
                              Agregar <Plus size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Carrito en Desktop (Se oculta en celular) */}
            <div className="hidden lg:block lg:col-span-4">
              <div className="sticky top-28 bg-zinc-900/40 backdrop-blur-md border border-zinc-800/60 rounded-3xl p-6 h-[calc(100vh-140px)] shadow-2xl">
                <RenderCarritoUI />
              </div>
            </div>
          </div>
        )}

        {/* ================= SECCIÓN 2: CITAS ================= */}
        {seccion === "citas" && (
          <div className="max-w-xl mx-auto">
            <Card className="bg-zinc-900/40 backdrop-blur-md border-zinc-800/60 shadow-2xl rounded-3xl overflow-hidden">
              <CardContent className="p-6 md:p-8 space-y-8">
                
                {/* Paso 1 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-zinc-950 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs">1</span>
                    <label className="text-base text-zinc-100 font-bold">Elige tu Barbero</label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {barberos.map((b) => (
                      <div 
                        key={b.id}
                        onClick={() => setBarberoElegido(b)}
                        className={`p-4 rounded-2xl border-2 text-center cursor-pointer transition-all duration-300 ${barberoElegido?.id === b.id ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-zinc-950 border-transparent text-zinc-400 hover:bg-zinc-900'}`}
                      >
                        <div className="w-12 h-12 mx-auto bg-zinc-800 rounded-full mb-2 overflow-hidden flex items-center justify-center">
                           <span className="text-xl">🧔🏻‍♂️️</span>
                        </div>
                        <span className="font-bold text-sm block">{b.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paso 2 */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500 text-zinc-950 w-6 h-6 rounded-full flex items-center justify-center font-black text-xs">2</span>
                    <label className="text-base text-zinc-100 font-bold">Servicio y Fecha</label>
                  </div>
                  <div className="space-y-4 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
                    <div>
                      <label className="text-xs text-zinc-500 font-medium ml-1">Servicio *</label>
                      <select 
                        value={servicioCita?.id || ""}
                        onChange={(e) => {
                          const encontrado = serviciosDisponibles.find(s => s.id === e.target.value);
                          setServicioCita(encontrado || null);
                        }}
                        className="w-full h-12 mt-1 px-4 rounded-xl bg-zinc-900 border-none text-sm text-white focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="">-- Toca para seleccionar --</option>
                        {serviciosDisponibles.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} (${s.price.toFixed(2)})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-500 font-medium ml-1">Tu Nombre *</label>
                        <Input 
                          value={nombreCita}
                          onChange={(e) => setNombreCita(e.target.value)}
                          placeholder="Ej: Andrés López"
                          className="bg-zinc-900 border-none text-white mt-1 h-12 rounded-xl focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-500 font-medium ml-1">Fecha y Hora *</label>
                        <Input 
                          type="datetime-local"
                          value={fechaCita}
                          onChange={(e) => setFechaCita(e.target.value)}
                          className="bg-zinc-900 border-none text-white mt-1 h-12 rounded-xl focus:ring-1 focus:ring-amber-500 block w-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={enviarCitaWhatsApp}
                  disabled={enviando}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-14 text-base rounded-2xl shadow-[0_0_20px_rgba(5,150,105,0.2)] mt-6 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {enviando ? "Procesando..." : <><CheckCircle2 size={20} /> Solicitar Cita por WhatsApp</>}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* ================= BOTÓN FLOTANTE DEL CARRITO (Solo Celulares) ================= */}
      {seccion === "tienda" && cantidadItemsCarrito > 0 && (
        <button 
          onClick={() => setIsCartModalOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-40 bg-emerald-500 text-white p-4 rounded-full shadow-[0_10px_25px_rgba(5,150,105,0.5)] active:scale-90 transition-transform"
        >
          <ShoppingCart size={24} />
          <span className="absolute -top-2 -right-2 bg-red-600 border-2 border-zinc-950 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full animate-bounce">
            {cantidadItemsCarrito}
          </span>
        </button>
      )}

      {/* ================= MODAL DEL CARRITO (Solo Celulares) ================= */}
      {isCartModalOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-zinc-900 h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col relative">
            
            <button 
              onClick={() => setIsCartModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <div className="flex-1 overflow-y-auto p-6 pt-12">
              <RenderCarritoUI />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}