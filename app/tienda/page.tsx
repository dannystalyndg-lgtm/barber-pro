"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export default function TiendaPublicaPage() {
  const [seccion, setSeccion] = useState<"tienda" | "citas">("tienda");
  
  // Estados Tienda
  const [productos, setProductos] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  const [nombreCliente, setNombreCliente] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Estados Citas
  const [barberos, setBarberos] = useState<any[]>([]);
  
  // Lista oficial de servicios con su respectivo precio
  const serviciosDisponibles = [
    { id: "serv-1", name: "Corte de cabello", price: 10.00 },
    { id: "serv-2", name: "Corte de cabello más barba", price: 15.00 },
    { id: "serv-3", name: "Corte de cabello más ceja más barba", price: 18.00 },
    { id: "serv-4", name: "Pintado de cabello", price: 20.00 },
  ];
  
  const [barberoElegido, setBarberoElegido] = useState<any>(null);
  const [servicioCita, setServicioCita] = useState<any>(null);
  const [nombreCita, setNombreCita] = useState("");
  const [fechaCita, setFechaCita] = useState("");
  const [enviando, setEnviando] = useState(false);

  const TELEFONO_GERENTE = "593999999999"; // Reemplaza con el número real del gerente

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

  const modificarCantidad = (id: string, delta: number) => {
    setCarrito(carrito.map(item => {
      if (item.id === id) {
        const nuevaCantidad = item.cantidad + delta;
        return nuevaCantidad < 1 ? item : { ...item, cantidad: nuevaCantidad };
      }
      return item;
    }));
  };

  const removerDelCarrito = (id: string) => {
    setCarrito(carrito.filter(item => item.id !== id));
  };

  const totalVenta = carrito.reduce((total, item) => total + (item.price * item.cantidad), 0);

  // Enviar Pedido Tienda a WhatsApp del Gerente
  const enviarPedidoWhatsApp = () => {
    if (!nombreCliente.trim()) {
      alert("Por favor ingresa tu nombre.");
      return;
    }
    if (carrito.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }

    let mensaje = `*NUEVO PEDIDO / COMPRA WEB*\n\n`;
    mensaje += `- Cliente: ${nombreCliente}\n\nProductos:\n`;
    carrito.forEach((item) => {
      mensaje += `* ${item.cantidad}x ${item.name} ($${(item.price * item.cantidad).toFixed(2)})\n`;
    });
    mensaje += `\nTotal: $${totalVenta.toFixed(2)}`;

    window.open(`https://wa.me/${TELEFONO_GERENTE}?text=${encodeURIComponent(mensaje)}`, "_blank");
  };

  // Guardar en Supabase con estado 'pending' y enviar al WhatsApp del Barbero
  const enviarCitaWhatsApp = async () => {
    if (enviando) return;
    if (!nombreCita.trim() || !barberoElegido || !servicioCita || !fechaCita) {
      alert("Por favor completa todos los campos para agendar la cita.");
      return;
    }

    setEnviando(true);

    // 1. Guardar automáticamente la cita en Supabase con estado 'pending'
    const { error } = await supabase.from("appointments").insert([
      {
        client_name: nombreCita,
        barber_id: barberoElegido.id,
        service_name: servicioCita.name,
        service_price: servicioCita.price,
        appointment_date: fechaCita,
        status: "pending"
      }
    ]);

    if (error) {
      console.error("Error de Supabase:", error);
      alert("Error al registrar la cita: " + error.message);
      setEnviando(false);
      return;
    }

    // 2. Armar el mensaje de WhatsApp limpio
    let mensaje = `*SOLICITUD DE CITA PROFESIONAL*\n\n`;
    mensaje += `• Cliente: ${nombreCita}\n`;
    mensaje += `• Barbero: ${barberoElegido.name}\n`;
    mensaje += `• Servicio: ${servicioCita.name} ($${servicioCita.price.toFixed(2)})\n`;
    mensaje += `• Fecha y Hora: ${new Date(fechaCita).toLocaleString()}\n\n`;
    mensaje += `Hola ${barberoElegido.name}, acabo de solicitar esta cita desde la web. Quedo a la espera de confirmación.`;

    const numeroDestino = barberoElegido.phone || TELEFONO_GERENTE;
    window.open(`https://wa.me/${numeroDestino}?text=${encodeURIComponent(mensaje)}`, "_blank");
    
    // Limpiar formulario
    setNombreCita("");
    setFechaCita("");
    setBarberoElegido(null);
    setServicioCita(null);
    setEnviando(false);
  };

  const productosFiltrados = productos.filter(p => p.name.toLowerCase().includes(busqueda.toLowerCase()));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8">
      {/* Cabecera y Selector de Pestañas */}
      <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-amber-500 tracking-tight">BARBER PRO</h1>
          <p className="text-zinc-400 mt-1">Tienda oficial y portal de reservas</p>
        </div>
        
        <div className="flex bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
          <button 
            onClick={() => setSeccion("tienda")}
            className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${seccion === "tienda" ? "bg-amber-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"}`}
          >
            🛒 Tienda & Productos
          </button>
          <button 
            onClick={() => setSeccion("citas")}
            className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${seccion === "citas" ? "bg-amber-600 text-white shadow-lg" : "text-zinc-400 hover:text-white"}`}
          >
            📅 Agendar Cita
          </button>
        </div>
      </header>

      {/* SECCIÓN 1: TIENDA */}
      {seccion === "tienda" && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <Input 
              placeholder="🔍 Buscar productos o servicios..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white"
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {productosFiltrados.map((prod) => (
                <div 
                  key={prod.id}
                  onClick={() => agregarAlCarrito(prod)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-amber-500 transition-all flex gap-4 items-center"
                >
                  {prod.image_url ? (
                    <img src={prod.image_url} alt={prod.name} className="w-20 h-20 object-cover rounded-lg border border-zinc-800" />
                  ) : (
                    <div className="w-20 h-20 bg-zinc-800 rounded-lg flex items-center justify-center text-[10px] text-zinc-500">Sin foto</div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-200 text-sm leading-tight">{prod.name}</h3>
                    <p className="text-lg font-black text-emerald-400 mt-2">${prod.price}</p>
                    <span className="text-xs text-amber-500 font-medium">Agregar al carrito +</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="lg:col-span-5 bg-zinc-900 border-zinc-800 h-fit shadow-2xl">
            <CardHeader className="border-b border-zinc-800 pb-3">
              <CardTitle className="text-zinc-200 text-lg">Tu Carrito de Compra</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-medium">Tu Nombre *</label>
                <Input 
                  placeholder="Ej: Carlos Mendoza" 
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 text-white mt-1"
                />
              </div>

              <div className="border-t border-zinc-800 pt-4 max-h-60 overflow-y-auto space-y-2">
                {carrito.length === 0 ? (
                  <p className="text-center text-zinc-600 py-6 text-sm">El carrito está vacío.</p>
                ) : (
                  carrito.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-zinc-950 p-2.5 rounded border border-zinc-800">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{item.name}</p>
                        <p className="text-xs text-amber-500">${(item.cantidad * item.price).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => modificarCantidad(item.id, -1)} className="px-2 bg-zinc-800 rounded text-sm">-</button>
                        <span className="text-sm font-bold">{item.cantidad}</span>
                        <button onClick={() => modificarCantidad(item.id, 1)} className="px-2 bg-zinc-800 rounded text-sm">+</button>
                        <button onClick={() => removerDelCarrito(item.id)} className="text-red-500 font-bold ml-1">×</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-zinc-800 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-zinc-400">Total a Pagar:</span>
                  <span className="text-2xl font-black text-emerald-400">${totalVenta.toFixed(2)}</span>
                </div>
                <Button 
                  onClick={enviarPedidoWhatsApp}
                  disabled={carrito.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 text-base shadow-lg"
                >
                  💬 Enviar Pedido a WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SECCIÓN 2: AGENDAR CITA CON BARBERO */}
      {seccion === "citas" && (
        <div className="max-w-2xl mx-auto">
          <Card className="bg-zinc-900 border-zinc-800 shadow-2xl">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-2xl text-amber-500">Agendar Cita con tu Barbero</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div>
                <label className="text-sm text-zinc-300 font-medium">1. Elige tu Barbero Preferido *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                  {barberos.map((b) => (
                    <div 
                      key={b.id}
                      onClick={() => setBarberoElegido(b)}
                      className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${barberoElegido?.id === b.id ? 'bg-amber-600/20 border-amber-500 text-amber-400 font-bold' : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'}`}
                    >
                      {b.name}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-zinc-300 font-medium">2. Elige el Servicio *</label>
                <select 
                  value={servicioCita?.id || ""}
                  onChange={(e) => {
                    const encontrado = serviciosDisponibles.find(s => s.id === e.target.value);
                    setServicioCita(encontrado || null);
                  }}
                  className="w-full h-12 mt-2 px-3 rounded-md bg-zinc-950 border border-zinc-700 text-sm text-white"
                >
                  <option value="">-- Selecciona un servicio --</option>
                  {serviciosDisponibles.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} (${s.price.toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-300 font-medium">Tu Nombre *</label>
                  <Input 
                    value={nombreCita}
                    onChange={(e) => setNombreCita(e.target.value)}
                    placeholder="Ej: Andrés López"
                    className="bg-zinc-950 border-zinc-700 text-white mt-2 h-12"
                  />
                </div>
                <div>
                  <label className="text-sm text-zinc-300 font-medium">Fecha y Hora *</label>
                  <Input 
                    type="datetime-local"
                    value={fechaCita}
                    onChange={(e) => setFechaCita(e.target.value)}
                    className="bg-zinc-950 border-zinc-700 text-white mt-2 h-12"
                  />
                </div>
              </div>

              <Button 
                onClick={enviarCitaWhatsApp}
                disabled={enviando}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-14 text-lg shadow-xl mt-4"
              >
                {enviando ? "Procesando cita..." : "📅 Coordinar Cita por WhatsApp con el Barbero"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}