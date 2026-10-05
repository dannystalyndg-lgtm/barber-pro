"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

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
    // 1. Cargar ventas y barberos por separado para evitar errores de relación en Supabase
    const { data: ventas, error: errVentas } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: barbs, error: errBarbs } = await supabase
      .from("barbers")
      .select("*");

    if (errVentas) console.error("Error al cargar ventas:", errVentas);
    if (errBarbs) console.error("Error al cargar barberos:", errBarbs);

    // Crear un mapa para relacionar el ID del barbero con su nombre de forma segura
    const barberoMap = new Map();
    if (barbs) {
      barbs.forEach((b) => barberoMap.set(b.id, b.name));
    }

    if (ventas) {
      const ventasConBarbero = ventas.map((v) => ({
        ...v,
        barber_name: barberoMap.get(v.barber_id) || "Barbero general",
      }));
      setVentasRaw(ventasConBarbero);
    }

    // 2. Contar citas
    const { count: citasCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true });
    if (citasCount !== null) setCitasPendientes(citasCount);

    // 3. Contar productos en inventario
    const { count: prodCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });
    if (prodCount !== null) setInventarioTotal(prodCount);
  };

  // Filtrar ventas según el período seleccionado
  const ventasFiltradas = ventasRaw.filter((v) => {
    if (!v.created_at) return false;
    const fechaVentaStr = v.created_at.split("T")[0];
    const fechaVenta = new Date(fechaVentaStr + "T00:00:00");
    const ahora = new Date();
    const hoyStr = ahora.toISOString().split("T")[0];
    const hoyDate = new Date(hoyStr + "T00:00:00");

    if (periodo === "hoy") {
      return fechaVentaStr === hoyStr;
    } 
    else if (periodo === "quincenal") {
      const hace15Dias = new Date(hoyDate);
      hace15Dias.setDate(hoyDate.getDate() - 15);
      return fechaVenta >= hace15Dias && fechaVenta <= hoyDate;
    } 
    else if (periodo === "mensual") {
      return (
        fechaVenta.getMonth() === ahora.getMonth() &&
        fechaVenta.getFullYear() === ahora.getFullYear()
      );
    } 
    else if (periodo === "anual") {
      return fechaVenta.getFullYear() === ahora.getFullYear();
    } 
    else if (periodo === "personalizado") {
      if (!fechaDesde || !fechaHasta) return true;
      const desde = new Date(fechaDesde);
      const hasta = new Date(fechaHasta);
      return fechaVenta >= desde && fechaVenta <= hasta;
    }

    return true;
  });

  const totalVentasCalculado = ventasFiltradas.reduce((acc, v) => acc + Number(v.total || v.total_amount || 0), 0);

  return (
    <div className="p-4 md:p-8 text-zinc-100 space-y-6">
      <header>
        <h1 className="text-3xl font-black text-amber-500">Resumen General</h1>
        <p className="text-zinc-400 mt-1">Control de ingresos, qué se vendió, citas e inventario en tiempo real</p>
      </header>

      {/* BARRA DE FILTROS DE VENTAS */}
      <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-zinc-200 text-lg">Filtrar Ingresos por Período</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => setPeriodo("hoy")}
              className={`text-xs ${periodo === "hoy" ? "bg-amber-600 hover:bg-amber-500 text-white font-bold" : "bg-zinc-950 border border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}
            >
              Diario (Hoy)
            </Button>
            <Button
              onClick={() => setPeriodo("quincenal")}
              className={`text-xs ${periodo === "quincenal" ? "bg-amber-600 hover:bg-amber-500 text-white font-bold" : "bg-zinc-950 border border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}
            >
              Quincenal (15 días)
            </Button>
            <Button
              onClick={() => setPeriodo("mensual")}
              className={`text-xs ${periodo === "mensual" ? "bg-amber-600 hover:bg-amber-500 text-white font-bold" : "bg-zinc-950 border border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}
            >
              Mensual
            </Button>
            <Button
              onClick={() => setPeriodo("anual")}
              className={`text-xs ${periodo === "anual" ? "bg-amber-600 hover:bg-amber-500 text-white font-bold" : "bg-zinc-950 border border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}
            >
              Anual
            </Button>
            <Button
              onClick={() => setPeriodo("personalizado")}
              className={`text-xs ${periodo === "personalizado" ? "bg-amber-600 hover:bg-amber-500 text-white font-bold" : "bg-zinc-950 border border-zinc-700 text-zinc-300 hover:bg-zinc-800"}`}
            >
              Rango Personalizado
            </Button>
          </div>

          {periodo === "personalizado" && (
            <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t border-zinc-800 items-end">
              <div className="flex-1 w-full">
                <Label className="text-zinc-400 text-xs">Desde:</Label>
                <Input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 text-white mt-1"
                />
              </div>
              <div className="flex-1 w-full">
                <Label className="text-zinc-400 text-xs">Hasta:</Label>
                <Input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="bg-zinc-950 border-zinc-700 text-white mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm font-medium capitalize">
              Ventas ({periodo})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-emerald-400">${totalVentasCalculado.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm font-medium">Citas Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-amber-500">{citasPendientes}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-zinc-400 text-sm font-medium">Productos en Inventario</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-black text-blue-400">{inventarioTotal}</p>
          </CardContent>
        </Card>
      </div>

      {/* TABLA DE DETALLE DE VENTAS (QUÉ SE VENDIÓ) */}
      <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
        <CardHeader>
          <CardTitle className="text-zinc-200 text-lg">Detalle de Ventas Realizadas ({ventasFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-sm text-left text-zinc-400">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Atendió (Barbero)</th>
                  <th className="px-4 py-3">Qué se Vendió (Productos / Servicios)</th>
                  <th className="px-4 py-3">Método de Pago</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {ventasFiltradas.map((v) => (
                  <tr key={v.id} className="hover:bg-zinc-950/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {v.created_at ? new Date(v.created_at).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 font-medium">
                      {v.barber_name}
                    </td>
                    <td className="px-4 py-3 text-zinc-200">
                      {v.items_summary || "Venta general"}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <span className="px-2 py-0.5 rounded text-xs bg-zinc-800 text-zinc-300 font-medium border border-zinc-700">
                        {v.payment_method || "Efectivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-400 font-bold">
                      ${Number(v.total || v.total_amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {ventasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                      No hay registros de ventas en este período. Realiza una venta en el POS para verla aquí.
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