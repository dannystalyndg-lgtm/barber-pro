"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { TrendingUp, CalendarDays, Package, Calendar, Receipt, DollarSign, Activity } from "lucide-react";

export default function DashboardPage() {
  const [ventasRaw, setVentasRaw] = useState<any[]>([]);
  const [citasPendientes, setCitasPendientes] = useState(0);
  const [inventarioTotal, setInventarioTotal] = useState(0);

  // Estados para los filtros de período
  const [periodo, setPeriodo] = useState<"hoy" | "quincenal" | "mensual" | "anual" | "personalizado">("hoy");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  useEffect(() => {
    cargarDatosDashboard();
  }, []);

  const cargarDatosDashboard = async () => {
    const { data: ventas, error: errVentas } = await supabase.from("sales").select("*").order("created_at", { ascending: false });
    const { data: barbs, error: errBarbs } = await supabase.from("barbers").select("*");

    if (errVentas) console.error("Error al cargar ventas:", errVentas);
    if (errBarbs) console.error("Error al cargar barberos:", errBarbs);

    const barberoMap = new Map();
    if (barbs) barbs.forEach((b) => barberoMap.set(b.id, b.name));

    if (ventas) {
      const ventasConBarbero = ventas.map((v) => ({
        ...v,
        barber_name: barberoMap.get(v.barber_id) || "Barbero general",
      }));
      setVentasRaw(ventasConBarbero);
    }

    const { count: citasCount } = await supabase.from("appointments").select("*", { count: "exact", head: true });
    if (citasCount !== null) setCitasPendientes(citasCount);

    const { count: prodCount } = await supabase.from("products").select("*", { count: "exact", head: true });
    if (prodCount !== null) setInventarioTotal(prodCount);
  };

  const ventasFiltradas = ventasRaw.filter((v) => {
    if (!v.created_at) return false;
    const fechaVentaStr = v.created_at.split("T")[0];
    const fechaVenta = new Date(fechaVentaStr + "T00:00:00");
    const ahora = new Date();
    const hoyStr = ahora.toISOString().split("T")[0];
    const hoyDate = new Date(hoyStr + "T00:00:00");

    if (periodo === "hoy") return fechaVentaStr === hoyStr;
    if (periodo === "quincenal") {
      const hace15Dias = new Date(hoyDate);
      hace15Dias.setDate(hoyDate.getDate() - 15);
      return fechaVenta >= hace15Dias && fechaVenta <= hoyDate;
    } 
    if (periodo === "mensual") return fechaVenta.getMonth() === ahora.getMonth() && fechaVenta.getFullYear() === ahora.getFullYear();
    if (periodo === "anual") return fechaVenta.getFullYear() === ahora.getFullYear();
    if (periodo === "personalizado") {
      if (!fechaDesde || !fechaHasta) return true;
      const desde = new Date(fechaDesde);
      const hasta = new Date(fechaHasta);
      return fechaVenta >= desde && fechaVenta <= hasta;
    }
    return true;
  });

  const totalVentasCalculado = ventasFiltradas.reduce((acc, v) => acc + Number(v.total || v.total_amount || 0), 0);

  return (
    <div className="p-4 md:p-8 text-zinc-100 space-y-6 max-w-7xl mx-auto pb-24 md:pb-8">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 backdrop-blur-xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-amber-500 flex items-center gap-3 tracking-tight">
            <Activity className="w-8 h-8 text-amber-500" /> Resumen General
          </h1>
          <p className="text-zinc-400 mt-1 text-sm font-medium">Control de ingresos, ventas y métricas en tiempo real</p>
        </div>
      </header>

      {/* ================= BARRA DE FILTROS ================= */}
      <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800/60 p-4 rounded-3xl shadow-xl">
        <div className="flex items-center gap-2 mb-3 px-2">
          <CalendarDays className="text-zinc-400 w-4 h-4" />
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Período de Análisis</h2>
        </div>
        <div className="flex overflow-x-auto gap-2 pb-2 custom-scrollbar">
          {[
            { id: "hoy", label: "Hoy" },
            { id: "quincenal", label: "15 Días" },
            { id: "mensual", label: "Este Mes" },
            { id: "anual", label: "Este Año" },
            { id: "personalizado", label: "Rango..." }
          ].map((op) => (
            <button
              key={op.id}
              onClick={() => setPeriodo(op.id as any)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${periodo === op.id ? "bg-amber-600 text-white shadow-lg shadow-amber-900/20" : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"}`}
            >
              {op.label}
            </button>
          ))}
        </div>

        {periodo === "personalizado" && (
          <div className="flex flex-col sm:flex-row gap-4 pt-4 mt-2 border-t border-zinc-800/60 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
              <Label className="text-zinc-500 text-[10px] uppercase font-bold ml-1">Desde fecha:</Label>
              <Input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="bg-zinc-950 border-none text-white mt-1 h-12 rounded-xl focus:ring-1 focus:ring-amber-500" />
            </div>
            <div className="flex-1">
              <Label className="text-zinc-500 text-[10px] uppercase font-bold ml-1">Hasta fecha:</Label>
              <Input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="bg-zinc-950 border-none text-white mt-1 h-12 rounded-xl focus:ring-1 focus:ring-amber-500" />
            </div>
          </div>
        )}
      </div>

      {/* ================= TARJETAS DE MÉTRICAS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Ventas */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-zinc-900/60 border border-emerald-900/30 p-6 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-emerald-500/20 p-2 rounded-xl"><DollarSign className="text-emerald-400 w-6 h-6" /></div>
          <p className="text-emerald-400/80 text-xs font-bold uppercase tracking-wider mb-2">Ingresos ({periodo})</p>
          <p className="text-4xl md:text-5xl font-black text-white">${totalVentasCalculado.toFixed(2)}</p>
        </div>

        {/* Citas */}
        <div className="bg-gradient-to-br from-amber-900/40 to-zinc-900/60 border border-amber-900/30 p-6 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-amber-500/20 p-2 rounded-xl"><Calendar className="text-amber-400 w-6 h-6" /></div>
          <p className="text-amber-400/80 text-xs font-bold uppercase tracking-wider mb-2">Citas Activas</p>
          <p className="text-4xl md:text-5xl font-black text-white">{citasPendientes}</p>
        </div>

        {/* Inventario */}
        <div className="bg-gradient-to-br from-blue-900/40 to-zinc-900/60 border border-blue-900/30 p-6 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-blue-500/20 p-2 rounded-xl"><Package className="text-blue-400 w-6 h-6" /></div>
          <p className="text-blue-400/80 text-xs font-bold uppercase tracking-wider mb-2">Total Catálogo</p>
          <p className="text-4xl md:text-5xl font-black text-white">{inventarioTotal}</p>
        </div>
      </div>

      {/* ================= HISTORIAL DE VENTAS ================= */}
      <Card className="bg-zinc-900/60 backdrop-blur-xl border-zinc-800/60 shadow-2xl rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800/50 flex items-center gap-3">
          <Receipt className="text-zinc-400 w-5 h-5" />
          <h2 className="text-lg font-bold text-zinc-100">Transacciones ({ventasFiltradas.length})</h2>
        </div>
        
        <CardContent className="p-0">
          
          {/* Vista Móvil (Tarjetas) */}
          <div className="grid grid-cols-1 divide-y divide-zinc-800/50 md:hidden">
            {ventasFiltradas.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">No hay ventas en este período.</div>
            ) : (
              ventasFiltradas.map((v) => (
                <div key={v.id} className="p-5 space-y-3 bg-zinc-950/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase">{v.created_at ? new Date(v.created_at).toLocaleString([], {dateStyle:'short', timeStyle:'short'}) : "—"}</p>
                      <p className="text-sm font-bold text-zinc-200 mt-0.5">{v.items_summary || "Venta general"}</p>
                    </div>
                    <span className="text-lg font-black text-emerald-400">${Number(v.total || v.total_amount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-900/80 p-2 rounded-lg border border-zinc-800">
                    <span className="text-xs text-zinc-400"><span className="text-zinc-500">Por:</span> {v.barber_name}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-1 bg-zinc-950 rounded text-zinc-300 border border-zinc-800">{v.payment_method || "Efectivo"}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Vista Escritorio (Tabla) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left text-zinc-400">
              <thead className="text-[10px] text-zinc-500 uppercase font-black bg-zinc-950/80">
                <tr>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Atendió</th>
                  <th className="px-6 py-4">Detalle de Venta</th>
                  <th className="px-6 py-4">Método</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {ventasFiltradas.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-medium text-zinc-500">
                      {v.created_at ? new Date(v.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-bold flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">🧔🏻‍♂️</div>
                      {v.barber_name}
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {v.items_summary || "Venta general"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 rounded-md text-[10px] font-bold uppercase bg-zinc-900 text-zinc-300 border border-zinc-700">
                        {v.payment_method || "Efectivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-emerald-400 font-black text-base">
                      ${Number(v.total || v.total_amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {ventasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-zinc-500">
                      No hay registros de ventas en el período seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}