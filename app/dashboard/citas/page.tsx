"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

export default function CitasDashboardPage() {
  const [citas, setCitas] = useState<any[]>([]);

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

  // Filtrar únicamente las citas pendientes (sin los filtros de fecha)
  const citasPendientes = citas.filter((cita) => {
    const estado = cita.status || "pending";
    return estado === "pending";
  });

  return (
    <div className="p-4 md:p-8 text-zinc-100 space-y-6 max-w-7xl mx-auto">
      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-black text-amber-500">Historial y Control de Citas</h1>
        <p className="text-sm md:text-base text-zinc-400">
          Acepta reservas para sumarlas a las ventas o recházalas para descartarlas de la agenda activa.
        </p>
      </header>

      <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
        <CardHeader className="flex flex-row justify-between items-center border-b border-zinc-800/50 pb-4">
          <CardTitle className="text-zinc-200 text-lg md:text-xl">
            Agenda Activa ({citasPendientes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 p-2 md:p-6">
          
          {citasPendientes.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 bg-zinc-950/30 rounded-lg border border-dashed border-zinc-800">
              No hay citas pendientes en este momento.
            </div>
          ) : (
            <>
              {/* ========================================= */}
              {/* VISTA MÓVIL (Tarjetas apiladas)             */}
              {/* ========================================= */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {citasPendientes.map((cita) => {
                  const precioFinal = obtenerPrecio(cita);
                  return (
                    <div key={cita.id} className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-4 space-y-4">
                      
                      {/* Cabecera de la tarjeta móvil */}
                      <div className="flex justify-between items-start border-b border-zinc-800 pb-3">
                        <div>
                          <p className="text-zinc-500 text-xs mb-1">
                            {cita.created_at ? new Date(cita.created_at).toLocaleDateString() : "—"}
                          </p>
                          <h3 className="text-zinc-100 font-bold text-lg leading-tight">
                            {cita.client_name || "Cliente web"}
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-900/40 text-amber-400 border border-amber-700/50 uppercase">
                          Pendiente
                        </span>
                      </div>

                      {/* Detalles del servicio */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-zinc-500 text-xs">Barbero</p>
                          <p className="text-zinc-300 font-medium">{cita.barbers?.name || "Sin asignar"}</p>
                        </div>
                        <div>
                          <p className="text-zinc-500 text-xs">Fecha Cita</p>
                          <p className="text-amber-400 font-medium">
                            {new Date(cita.appointment_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                        <div className="col-span-2 bg-zinc-900 p-3 rounded flex justify-between items-center">
                          <span className="font-semibold text-zinc-200">{cita.service_name || "Servicio general"}</span>
                          <span className="text-emerald-400 font-bold">${precioFinal.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Botones de acción móviles */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => cambiarEstadoCita(cita, "accepted")}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5"
                        >
                          Aceptar
                        </Button>
                        <Button
                          onClick={() => cambiarEstadoCita(cita, "rejected")}
                          className="flex-1 bg-red-600/90 hover:bg-red-500 text-white font-bold py-5"
                        >
                          Rechazar
                        </Button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* ========================================= */}
              {/* VISTA ESCRITORIO (Tabla tradicional)        */}
              {/* ========================================= */}
              <div className="hidden md:block overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-sm text-left text-zinc-400">
                  <thead className="text-xs text-zinc-500 uppercase bg-zinc-950/80 border-b border-zinc-800">
                    <tr>
                      <th className="px-4 py-4 font-semibold">Generado</th>
                      <th className="px-4 py-4 font-semibold">Cliente</th>
                      <th className="px-4 py-4 font-semibold">Barbero</th>
                      <th className="px-4 py-4 font-semibold">Servicio y Valor</th>
                      <th className="px-4 py-4 font-semibold">Fecha Programada</th>
                      <th className="px-4 py-4 font-semibold text-center">Estado / Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-zinc-950/30">
                    {citasPendientes.map((cita) => {
                      const precioFinal = obtenerPrecio(cita);
                      return (
                        <tr key={cita.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-4 text-xs text-zinc-500 whitespace-nowrap">
                            {cita.created_at ? new Date(cita.created_at).toLocaleString() : "—"}
                          </td>
                          <td className="px-4 py-4 text-zinc-200 font-medium whitespace-nowrap">
                            {cita.client_name || "Cliente web"}
                          </td>
                          <td className="px-4 py-4 text-zinc-300">
                            {cita.barbers?.name || "Sin asignar"}
                          </td>
                          <td className="px-4 py-4 text-zinc-300">
                            <div className="font-semibold text-zinc-200">{cita.service_name || "Servicio general"}</div>
                            <div className="text-emerald-400 font-bold text-xs mt-1">
                              ${precioFinal.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-amber-400 font-medium whitespace-nowrap">
                            {new Date(cita.appointment_date).toLocaleString()}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col items-center gap-2">
                              <span className="px-2.5 py-1 rounded text-[10px] font-bold bg-amber-900/40 text-amber-400 border border-amber-700/50 uppercase tracking-wider">
                                Pendiente
                              </span>
                              <div className="flex gap-2 mt-1">
                                <Button
                                  onClick={() => cambiarEstadoCita(cita, "accepted")}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1 h-8 font-bold shadow transition-transform active:scale-95"
                                >
                                  Aceptar
                                </Button>
                                <Button
                                  onClick={() => cambiarEstadoCita(cita, "rejected")}
                                  className="bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1 h-8 font-bold shadow transition-transform active:scale-95"
                                >
                                  Rechazar
                                </Button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}