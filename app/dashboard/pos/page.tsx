"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { ShoppingCart, Plus, Minus, Search, Trash2, X, User, CreditCard, CheckCircle2 } from "lucide-react";

export default function POSPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [barberos, setBarberos] = useState<any[]>([]);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState<string>("Efectivo");
  const [carrito, setCarrito] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "service" | "physical">("todos");
  const [procesando, setProcesando] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  useEffect(() => {
    cargarDatosPOS();
  }, []);

  const cargarDatosPOS = async () => {
    const { data: prods } = await supabase.from("products").select("*");
    if (prods) setProductos(prods);

    const { data: barbs } = await supabase.from("barbers").select("*");
    if (barbs) {
      setBarberos(barbs);
      if (barbs.length > 0) setBarberoSeleccionado(barbs[0].id);
    }
  };

  const agregarAlCarrito = (item: any) => {
    const itemExistente = carrito.find((i) => i.id === item.id);
    if (itemExistente) {
      setCarrito(carrito.map((i) => i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i));
    } else {
      setCarrito([...carrito, { ...item, cantidad: 1 }]);
    }
  };

  const modificarCantidad = (id: string, delta: number) => {
    setCarrito(carrito.map((i) => {
      if (i.id === id) {
        const nuevaCantidad = i.cantidad + delta;
        return nuevaCantidad <= 0 ? null : { ...i, cantidad: nuevaCantidad };
      }
      return i;
    }).filter(Boolean) as any[]);
  };

  const limpiarTicket = () => {
    setCarrito([]);
    setIsCartModalOpen(false);
  };

  const totalVenta = carrito.reduce((acc, item) => acc + item.price * item.cantidad, 0);
  const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);

  const cobrarTicket = async () => {
    if (carrito.length === 0) return alert("El ticket está vacío.");
    if (!barberoSeleccionado) return alert("Por favor selecciona el barbero que atiende la venta.");

    setProcesando(true);
    const resumenItems = carrito.map(i => `${i.cantidad}x ${i.name}`).join(", ");

    const { error } = await supabase.from("sales").insert([{
      barber_id: barberoSeleccionado,
      total: totalVenta,
      total_amount: totalVenta,
      payment_method: metodoPago,
      items_summary: resumenItems,
    }]);

    if (error) {
      alert("Hubo un error al guardar la venta: " + error.message);
      setProcesando(false);
      return;
    }

    alert(`¡Venta cobrada con éxito!\nTotal: $${totalVenta.toFixed(2)}\nMétodo: ${metodoPago}`);
    limpiarTicket();
    setProcesando(false);
  };

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = p.name.toLowerCase().includes(busqueda.toLowerCase());
    if (filtroTipo === "service") return coincideBusqueda && p.type === "service";
    if (filtroTipo === "physical") return coincideBusqueda && p.type === "physical";
    return coincideBusqueda;
  });

  // UI del Ticket reutilizable
  const RenderTicketUI = () => (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <ShoppingCart className="text-amber-500" /> Ticket
        </h2>
        {carrito.length > 0 && (
          <button onClick={limpiarTicket} className="text-xs text-red-500 bg-red-500/10 px-3 py-1.5 rounded-full font-bold">
            Vaciar
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {carrito.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 opacity-50">
            <ShoppingCart size={40} className="mb-2" />
            <p className="text-sm">Agrega productos al ticket</p>
          </div>
        ) : (
          carrito.map((item) => (
            <div key={item.id} className="flex justify-between items-center bg-zinc-950/80 p-3 rounded-2xl border border-zinc-800/50">
              <div className="flex-1 pr-2">
                <p className="text-sm font-bold text-zinc-200 line-clamp-1">{item.name}</p>
                <p className="text-xs text-emerald-400 font-medium">${(item.price * item.cantidad).toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-2 py-1 border border-zinc-800">
                  <button onClick={() => modificarCantidad(item.id, -1)} className="text-zinc-400 p-1"><Minus size={14} /></button>
                  <span className="text-sm font-bold w-4 text-center">{item.cantidad}</span>
                  <button onClick={() => modificarCantidad(item.id, 1)} className="text-zinc-400 p-1"><Plus size={14} /></button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pt-6 mt-4 border-t border-zinc-800/80 space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-zinc-400 text-sm font-medium">Total a cobrar:</span>
          <span className="text-4xl font-black text-emerald-400">${totalVenta.toFixed(2)}</span>
        </div>
        <Button onClick={cobrarTicket} disabled={carrito.length === 0 || procesando} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-14 rounded-2xl text-base shadow-[0_0_20px_rgba(5,150,105,0.2)]">
          {procesando ? "Procesando..." : `COBRAR CON ${metodoPago.toUpperCase()}`}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 min-h-screen bg-zinc-950 text-zinc-100 pb-24 md:pb-8">
      
      {/* ================= HEADER & CONFIGURACIÓN ================= */}
      <header className="mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-amber-500 tracking-tight">POS Terminal</h1>
          <p className="text-zinc-400 text-sm mt-1">Punto de venta rápido</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
          {/* Selector Barbero */}
          <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-2xl border border-zinc-800 w-full sm:w-auto flex-1">
            <div className="bg-amber-500/10 p-2 rounded-xl"><User size={18} className="text-amber-500"/></div>
            <div className="flex-1 pr-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase block">Atiende</span>
              <select value={barberoSeleccionado} onChange={(e) => setBarberoSeleccionado(e.target.value)} className="bg-transparent border-none text-white text-sm font-bold w-full focus:ring-0 p-0 appearance-none">
                {barberos.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
          </div>

          {/* Selector Pago */}
          <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-2xl border border-zinc-800 w-full sm:w-auto flex-1">
            <div className="bg-emerald-500/10 p-2 rounded-xl"><CreditCard size={18} className="text-emerald-500"/></div>
            <div className="flex-1 pr-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase block">Método Pago</span>
              <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)} className="bg-transparent border-none text-white text-sm font-bold w-full focus:ring-0 p-0 appearance-none">
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transfer. / Yape</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* ================= CONTENIDO PRINCIPAL ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Catálogo de POS */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
              <Input placeholder="Buscar servicio o producto..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="bg-zinc-900/50 border-zinc-800 text-white pl-12 h-14 rounded-2xl focus:ring-amber-500/50" />
            </div>
            <div className="flex gap-2 w-full sm:w-auto bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shrink-0">
              {["todos", "service", "physical"].map((tipo) => (
                <button
                  key={tipo} onClick={() => setFiltroTipo(tipo as any)}
                  className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${filtroTipo === tipo ? "bg-zinc-800 text-amber-500 shadow-md" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  {tipo === 'todos' ? 'Todos' : tipo === 'service' ? 'Servicios' : 'Físicos'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
            {productosFiltrados.map((item) => (
              <div key={item.id} onClick={() => agregarAlCarrito(item)} className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-3 cursor-pointer hover:bg-zinc-800/80 hover:border-amber-500/50 transition-all flex flex-col group relative overflow-hidden text-center items-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden mb-3 shadow-inner">
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600">N/A</div>}
                </div>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase mb-1 ${item.type === 'service' ? 'text-amber-500' : 'text-blue-400'}`}>
                  {item.type === 'service' ? 'Servicio' : 'Físico'}
                </span>
                <h3 className="font-bold text-zinc-200 text-xs leading-tight mb-2 flex-1">{item.name}</h3>
                <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg w-full">${Number(item.price).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Escritorio (Oculto en celular) */}
        <div className="hidden lg:block lg:col-span-4">
          <div className="sticky top-4 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/60 shadow-2xl rounded-3xl p-6 h-[calc(100vh-140px)]">
            <RenderTicketUI />
          </div>
        </div>
      </div>

      {/* ================= BOTÓN FLOTANTE TICKET (Celulares) ================= */}
      {totalItems > 0 && (
        <button onClick={() => setIsCartModalOpen(true)} className="lg:hidden fixed bottom-24 right-6 z-40 bg-emerald-500 text-white p-4 rounded-full shadow-[0_10px_25px_rgba(5,150,105,0.5)] active:scale-90 transition-transform">
          <ShoppingCart size={24} />
          <span className="absolute -top-2 -right-2 bg-red-600 border-2 border-zinc-950 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full animate-bounce">
            {totalItems}
          </span>
        </button>
      )}

      {/* ================= MODAL DEL TICKET (Celulares) ================= */}
      {isCartModalOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-zinc-900 h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col relative pb-safe">
            <button onClick={() => setIsCartModalOpen(false)} className="absolute top-4 right-4 p-2 bg-zinc-800 rounded-full text-zinc-400 hover:text-white">
              <X size={20} />
            </button>
            <div className="flex-1 overflow-y-auto p-6 pt-12">
              <RenderTicketUI />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}