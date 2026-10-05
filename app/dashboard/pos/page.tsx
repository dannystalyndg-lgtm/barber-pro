"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

export default function POSPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [barberos, setBarberos] = useState<any[]>([]);
  const [barberoSeleccionado, setBarberoSeleccionado] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState<string>("Efectivo");
  const [carrito, setCarrito] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"todos" | "service" | "physical">("todos");
  const [procesando, setProcesando] = useState(false);

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
      setCarrito(
        carrito.map((i) =>
          i.id === item.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      );
    } else {
      setCarrito([...carrito, { ...item, cantidad: 1 }]);
    }
  };

  const modificarCantidad = (id: string, delta: number) => {
    setCarrito(
      carrito
        .map((i) => {
          if (i.id === id) {
            const nuevaCantidad = i.cantidad + delta;
            return nuevaCantidad <= 0 ? null : { ...i, cantidad: nuevaCantidad };
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const limpiarTicket = () => {
    setCarrito([]);
  };

  const totalVenta = carrito.reduce(
    (acc, item) => acc + item.price * item.cantidad,
    0
  );

  const cobrarTicket = async () => {
    if (carrito.length === 0) {
      alert("El ticket está vacío.");
      return;
    }
    if (!barberoSeleccionado) {
      alert("Por favor selecciona el barbero que atiende la venta.");
      return;
    }

    setProcesando(true);

    const resumenItems = carrito.map(i => `${i.cantidad}x ${i.name}`).join(", ");

    // Enviamos ambos campos (total y total_amount) para cubrir cualquier estructura previa de Supabase
    const { error } = await supabase.from("sales").insert([
      {
        barber_id: barberoSeleccionado,
        total: totalVenta,
        total_amount: totalVenta,
        payment_method: metodoPago,
        items_summary: resumenItems,
      }
    ]);

    if (error) {
      console.error("Error al registrar la venta:", error);
      alert("Hubo un error al guardar la venta: " + error.message);
      setProcesando(false);
      return;
    }

    alert(`¡Venta cobrada y registrada con éxito!\nTotal: $${totalVenta.toFixed(2)}\nMétodo: ${metodoPago}`);
    
    setCarrito([]);
    setProcesando(false);
  };

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = p.name.toLowerCase().includes(busqueda.toLowerCase());
    if (filtroTipo === "service") return coincideBusqueda && p.type === "service";
    if (filtroTipo === "physical") return coincideBusqueda && p.type === "physical";
    return coincideBusqueda;
  });

  return (
    <div className="p-4 md:p-8 min-h-screen bg-zinc-950 text-zinc-100">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-amber-500 tracking-tight">Terminal de Venta (POS)</h1>
          <p className="text-zinc-400 text-sm">Selecciona servicios o productos, asigna el barbero, elige el método de pago y cobra.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Atiende:</span>
            <select
              value={barberoSeleccionado}
              onChange={(e) => setBarberoSeleccionado(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              {barberos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-xl">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Pago:</span>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value)}
              className="bg-zinc-950 border border-zinc-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
            </select>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
            <Input
              placeholder="🔍 Buscar servicio o producto..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="bg-zinc-950 border-zinc-700 text-white w-full sm:max-w-xs"
            />
            
            <div className="flex gap-1.5 w-full sm:w-auto">
              <Button
                onClick={() => setFiltroTipo("todos")}
                variant={filtroTipo === "todos" ? "default" : "outline"}
                className={`flex-1 sm:flex-none text-xs ${filtroTipo === "todos" ? "bg-amber-600 hover:bg-amber-500 text-white font-bold" : "bg-zinc-950 border-zinc-700 text-zinc-300"}`}
              >
                Todos
              </Button>
              <Button
                onClick={() => setFiltroTipo("service")}
                variant={filtroTipo === "service" ? "default" : "outline"}
                className={`flex-1 sm:flex-none text-xs ${filtroTipo === "service" ? "bg-amber-600 hover:bg-amber-500 text-white font-bold" : "bg-zinc-950 border-zinc-700 text-zinc-300"}`}
              >
                Servicios
              </Button>
              <Button
                onClick={() => setFiltroTipo("physical")}
                variant={filtroTipo === "physical" ? "default" : "outline"}
                className={`flex-1 sm:flex-none text-xs ${filtroTipo === "physical" ? "bg-amber-600 hover:bg-amber-500 text-white font-bold" : "bg-zinc-950 border-zinc-700 text-zinc-300"}`}
              >
                Físicos
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[65vh] overflow-y-auto pr-1">
            {productosFiltrados.map((item) => (
              <div
                key={item.id}
                onClick={() => agregarAlCarrito(item)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/5 transition-all flex flex-col justify-between group"
              >
                <div className="flex gap-3 items-start">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded-lg border border-zinc-800 flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center text-[10px] text-zinc-500 flex-shrink-0">Sin foto</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${item.type === 'service' ? 'bg-amber-950 text-amber-400 border border-amber-800/50' : 'bg-blue-950 text-blue-400 border border-blue-800/50'}`}>
                      {item.type === 'service' ? 'Servicio' : 'Físico'}
                    </span>
                    <h3 className="font-semibold text-zinc-200 text-sm truncate group-hover:text-amber-400 transition-colors">{item.name}</h3>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-3 border-t border-zinc-800/60">
                  <span className="text-lg font-black text-emerald-400">${Number(item.price).toFixed(2)}</span>
                  <span className="text-xs bg-amber-600/20 text-amber-400 font-semibold px-2.5 py-1 rounded-md group-hover:bg-amber-600 group-hover:text-white transition-all">+ Agregar</span>
                </div>
              </div>
            ))}

            {productosFiltrados.length === 0 && (
              <div className="col-span-full py-16 text-center text-zinc-600 bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                No se encontraron servicios o productos en el inventario.
              </div>
            )}
          </div>
        </div>

        <Card className="lg:col-span-4 bg-zinc-900 border-zinc-800 shadow-2xl flex flex-col justify-between h-[75vh]">
          <CardHeader className="border-b border-zinc-800 pb-3 flex flex-row justify-between items-center">
            <CardTitle className="text-zinc-200 text-lg">Ticket de Venta</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">{carrito.reduce((acc, i) => acc + i.cantidad, 0)} items</span>
              {carrito.length > 0 && (
                <button onClick={limpiarTicket} className="text-xs text-red-400 hover:text-red-300 underline ml-2">
                  Limpiar
                </button>
              )}
            </div>
          </CardHeader>

          <CardContent className="pt-4 flex-1 overflow-y-auto space-y-3">
            {carrito.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 py-12">
                <span className="text-4xl mb-2">🛒</span>
                <p className="text-sm">Agrega productos o servicios al ticket</p>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-zinc-950 p-3 rounded-xl border border-zinc-800/80">
                  <div className="flex-1 pr-2">
                    <p className="text-sm font-semibold text-zinc-200 leading-tight">{item.name}</p>
                    <p className="text-xs text-amber-500 font-medium mt-0.5">${(item.price * item.cantidad).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                    <button onClick={() => modificarCantidad(item.id, -1)} className="w-5 h-5 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-bold text-zinc-300">-</button>
                    <span className="text-xs font-bold w-4 text-center">{item.cantidad}</span>
                    <button onClick={() => modificarCantidad(item.id, 1)} className="w-5 h-5 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 rounded text-xs font-bold text-zinc-300">+</button>
                  </div>
                </div>
              ))
            )}
          </CardContent>

          <div className="border-t border-zinc-800 p-4 bg-zinc-950/60 rounded-b-xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">Total a Cobrar:</span>
              <span className="text-3xl font-black text-emerald-400">${totalVenta.toFixed(2)}</span>
            </div>
            <Button
              onClick={cobrarTicket}
              disabled={carrito.length === 0 || procesando}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black h-12 text-base shadow-lg shadow-emerald-900/20"
            >
              {procesando ? "Procesando..." : `💳 COBRAR CON ${metodoPago.toUpperCase()}`}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}