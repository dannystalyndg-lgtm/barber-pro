"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Calendar, LogOut } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [citasPendientes, setCitasPendientes] = useState(0);

  // Las rutas de tu plataforma
  const menu = [
    { name: "Panel", icon: LayoutDashboard, path: "/dashboard" },
    { name: "POS", icon: ShoppingCart, path: "/dashboard/pos" },
    { name: "Inventario", icon: Package, path: "/dashboard/inventario" },
    { name: "Citas", icon: Calendar, path: "/dashboard/citas" },
  ];

  // Función para obtener la cantidad exacta de citas pendientes
  const cargarCitasPendientes = async () => {
    const { count, error } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    if (!error && count !== null) {
      setCitasPendientes(count);
    }
  };

  useEffect(() => {
    // Carga inicial
    cargarCitasPendientes();

    // Suscripción en Tiempo Real: Se actualiza automáticamente cuando un cliente reserva en la web
    const channel = supabase
      .channel("cambios_citas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          cargarCitasPendientes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen bg-zinc-950 flex-col md:flex-row overflow-hidden font-sans">
      
      {/* ========================================= */}
      {/* SIDEBAR PARA ESCRITORIO (Oculto en celulares) */}
      {/* ========================================= */}
      <aside className="hidden md:flex w-72 flex-col bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-800/60 shadow-2xl z-20 transition-all">
        <div className="p-8">
          <h1 className="text-3xl font-black bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent tracking-tighter">
            BARBER PRO
          </h1>
          <p className="text-zinc-500 text-xs font-medium mt-1 tracking-widest uppercase">
            Plataforma Todo en Uno
          </p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-2">
          {menu.map((item) => {
            const isActive = pathname === item.path;
            const esCitas = item.name === "Citas";
            
            return (
              <Link key={item.path} href={item.path} className="block relative">
                <span 
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-r from-amber-600/20 to-transparent text-amber-500 font-bold border-l-2 border-amber-500 shadow-sm' 
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100 font-medium'
                  }`}
                >
                  <item.icon size={22} className={isActive ? "stroke-[2.5]" : "stroke-[1.5]"} />
                  <span className="text-sm tracking-wide">{item.name}</span>

                  {/* Notificación (Burbuja roja) para Escritorio */}
                  {esCitas && citasPendientes > 0 && (
                    <span className="ml-auto flex items-center justify-center bg-red-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg shadow-red-500/20 animate-pulse">
                      {citasPendientes} Nuevas
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-zinc-800/60">
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-3 px-4 py-3.5 text-zinc-400 hover:text-red-400 font-medium transition-all duration-300 w-full rounded-xl hover:bg-red-500/10"
          >
            <LogOut size={20} className="stroke-[1.5]" />
            <span className="text-sm tracking-wide">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ========================================= */}
      {/* ÁREA CENTRAL DE TRABAJO */}
      {/* ========================================= */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0 relative custom-scrollbar bg-zinc-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-zinc-950 to-zinc-950 -z-10" />
        {children}
      </main>

      {/* ========================================= */}
      {/* BARRA INFERIOR PARA CELULARES (Oculta en escritorio) */}
      {/* ========================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-800/80 flex justify-around items-center p-2 z-50 pb-safe shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)]">
        {menu.map((item) => {
          const isActive = pathname === item.path;
          const esCitas = item.name === "Citas";

          return (
            <Link key={item.path} href={item.path} className="flex flex-col items-center gap-1 p-2 w-16 relative group">
              <span 
                className={`relative p-2 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-amber-500/10 text-amber-500 scale-110 shadow-inner' 
                    : 'text-zinc-500 group-hover:text-zinc-300'
                }`}
              >
                <item.icon size={24} className={isActive ? "stroke-[2.5]" : "stroke-[1.5]"} />
                
                {/* Notificación (Burbuja roja) para Celular */}
                {esCitas && citasPendientes > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-lg border-2 border-zinc-950 animate-pulse">
                    {citasPendientes}
                  </span>
                )}
              </span>
              <span 
                className={`text-[10px] tracking-wider transition-colors duration-300 ${
                  isActive ? 'text-amber-500 font-bold' : 'text-zinc-600 font-medium'
                }`}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
      
    </div>
  );
}