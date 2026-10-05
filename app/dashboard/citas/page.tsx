"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

export default function CitasDashboardPage() {
  const [citas, setCitas] = useState<any[]>([]);

  // Estados para filtros de fechas
  const [filtroDesde, setFiltroDesde] = useState("");
  const [filtroHasta, setFiltroHasta] = useState("");

  const cargarDatos = async () => {
    const { data: citasData, error } = await supabase
      .from("appointments")
      .select(`
        *,
        barbers:barber_id (name)
      `)
      .order("appointment_date", { ascending: true });
    
    if (error) {
      console.error("Error al cargar citas:", error);
    }
    if (citasData) {
      setCitas(citasData);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Función para Aceptar o Rechazar una cita con manejo de errores robusto
  const cambiarEstadoCita = async (cita: any, nuevoEstado: string) => {
    // 1. Actualizar el estado en Supabase
    const { error: errorUpdate } = await supabase
      .from("appointments")
      .update({ status: nuevoEstado })
      .eq("id", cita.id);

    if (errorUpdate) {
      console.error("Error al actualizar estado:", errorUpdate);
      alert("Error de Supabase al actualizar: " + errorUpdate.message);
      return;
    }

    // 2. Si se acepta, registrar automáticamente en la tabla de ventas
    if (nuevoEstado === "accepted") {
      const precioServicio = Number(cita.service_price || 10);
      const resumenVenta = `Cita Web: ${cita.service_name || "Servicio"} (${cita.client_name})`;

      const { error: errorVenta } = await supabase.from("sales").insert([
        {
          barber_id: cita.barber_id,
          total: precioServicio,
          total_amount: precioServicio,
          payment_method: "Efectivo (Cita)",
          items_summary: resumenVenta,
        }
      ]);

      if (errorVenta) {
        console.error("Error al registrar la venta:", errorVenta);
        alert("La cita se aceptó pero hubo un error al sumar la venta: " + errorVenta.message);
      } else {
        alert(`¡Cita aceptada con éxito! Se han sumado $${precioServicio.toFixed(2)} a las ventas.`);
      }
    } else if (nuevoEstado === "rejected") {
      alert("Cita rechazada y descartada de la agenda activa.");
    }

    // 3. Recargar la lista inmediatamente para que desaparezca de la agenda activa
    await cargarDatos();
  };

  const obtenerPrecio = (cita: any) => {
    if (cita.service_price !== null && cita.service_price !== undefined && !isNaN(cita.service_price)) {
      return Number(cita.service_price);
    }
    const nombre = cita.service_name?.toLowerCase() || "";
    if (nombre.includes("más ceja más barba")) return 18.00;
    if (nombre.includes("más barba")) return 15.00;
    if (nombre.includes("pintado")) return 20.00;
    if (nombre.includes("corte")) return 10.00;
    return 0.00;
  };

  // Filtrar únicamente las citas pendientes
  const citasPendientes = citas.filter((cita) => {
    const estado = cita.status || "pending";
    if (estado !== "pending") return false;

    if (!cita.created_at) return true;
    const fechaCreacionSoloDia = cita.created_at.split("T")[0];

    if (filtroDesde && fechaCreacionSoloDia < filtroDesde) return false;
    if (filtroHasta && fechaCreacionSoloDia > filtroHasta) return false;

    return true;
  });

  return (
    <div className="p-4 md:p-8 text-zinc-100 space-y-6">
      <header>
        <h1 className="text-3xl font-black text-amber-500">Historial y Control de Citas</h1>
        <p className="text-zinc-400">Acepta reservas para sumarlas a las ventas o recházalas para descartarlas de la agenda activa.</p>
      </header>

      {/* FILTROS DE FECHAS */}
      <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-zinc-200 text-lg">Filtrar Citas por Fecha de Creación</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <Label className="text-zinc-400 text-xs">Desde la fecha:</Label>
            <Input 
              type="date" 
              value={filtroDesde} 
              onChange={e => setFiltroDesde(e.target.value)} 
              className="bg-zinc-950 border-zinc-700 text-white mt-1" 
            />
          </div>
          <div className="flex-1 w-full">
            <Label className="text-zinc-400 text-xs">Hasta la fecha:</Label>
            <Input 
              type="date" 
              value={filtroHasta} 
              onChange={e => setFiltroHasta(e.target.value)} 
              className="bg-zinc-950 border-zinc-700 text-white mt-1" 
            />
          </div>
          <Button 
            onClick={() => { setFiltroDesde(""); setFiltroHasta(""); }}
            variant="outline"
            className="bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700 w-full sm:w-auto"
          >
            Limpiar Filtros
          </Button>
        </CardContent>
      </Card>

      {/* Tabla de Agenda Activa (Solo Pendientes) */}
      <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="text-zinc-200">Agenda Activa ({citasPendientes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-sm text-left text-zinc-400">
              <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-4">Generado</th>
                  <th className="px-4 py-4">Cliente</th>
                  <th className="px-4 py-4">Barbero</th>
                  <th className="px-4 py-4">Servicio y Valor</th>
                  <th className="px-4 py-4">Fecha Programada</th>
                  <th className="px-4 py-4 text-center">Estado / Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {citasPendientes.map((cita) => {
                  const precioFinal = obtenerPrecio(cita);
                  return (
                    <tr key={cita.id} className="hover:bg-zinc-950/50 transition-colors">
                      <td className="px-4 py-4 text-xs text-zinc-500">
                        {cita.created_at ? new Date(cita.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-4 py-4 text-zinc-200 font-medium">{cita.client_name || "Cliente web"}</td>
                      <td className="px-4 py-4 text-zinc-300">{cita.barbers?.name || "Sin asignar"}</td>
                      <td className="px-4 py-4 text-zinc-300">
                        <div className="font-semibold text-zinc-200">{cita.service_name || "Servicio general"}</div>
                        <div className="text-emerald-400 font-bold text-xs mt-0.5">
                          ${precioFinal.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-amber-400 font-medium">{new Date(cita.appointment_date).toLocaleString()}</td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className="px-2.5 py-1 rounded text-xs font-bold bg-amber-900/40 text-amber-400 border border-amber-700/50">
                            PENDIENTE
                          </span>
                          <div className="flex gap-1.5 mt-1">
                            <Button
                              onClick={() => cambiarEstadoCita(cita, "accepted")}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2.5 py-1 h-7 font-bold shadow"
                            >
                              Aceptar
                            </Button>
                            <Button
                              onClick={() => cambiarEstadoCita(cita, "rejected")}
                              className="bg-red-600 hover:bg-red-500 text-white text-[10px] px-2.5 py-1 h-7 font-bold shadow"
                            >
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {citasPendientes.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                      No hay citas pendientes en este momento.
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