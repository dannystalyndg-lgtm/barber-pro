"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingCart, Package, Calendar, LogOut } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Las rutas de tu plataforma
  const menu = [
    { name: "Panel", icon: LayoutDashboard, path: "/dashboard" },
    { name: "POS", icon: ShoppingCart, path: "/dashboard/pos" },
    { name: "Inventario", icon: Package, path: "/dashboard/inventario" },
    { name: "Citas", icon: Calendar, path: "/dashboard/citas" }, // Este será nuestro próximo módulo
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex h-screen bg-zinc-950 flex-col md:flex-row overflow-hidden">
      
      {/* SIDEBAR PARA ESCRITORIO (Oculto en celulares) */}
      <aside className="hidden md:flex w-64 flex-col bg-zinc-900 border-r border-zinc-800 shadow-2xl z-20">
        <div className="p-6">
          <h1 className="text-2xl font-black text-amber-500 tracking-tighter">BARBER PRO</h1>
          <p className="text-zinc-500 text-xs mt-1">Plataforma Todo en Uno</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menu.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <span className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-amber-600/10 text-amber-500 font-medium' : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'}`}>
                  <item.icon size={20} className={isActive ? "stroke-2" : "stroke-[1.5]"} />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-red-500 transition-colors w-full rounded-lg hover:bg-red-950/30">
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ÁREA CENTRAL DE TRABAJO (Donde se cargan tus páginas) */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 relative custom-scrollbar">
        {children}
      </main>

      {/* BARRA INFERIOR PARA CELULARES (Oculta en escritorio) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 flex justify-around items-center p-2 z-50 pb-safe">
        {menu.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path} className="flex flex-col items-center gap-1 p-2 w-16">
              <span className={`p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-amber-600/20 text-amber-500 scale-110' : 'text-zinc-400'}`}>
                <item.icon size={22} className={isActive ? "stroke-2" : "stroke-[1.5]"} />
              </span>
              <span className={`text-[10px] tracking-wide transition-colors ${isActive ? 'text-amber-500 font-bold' : 'text-zinc-500'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
      
    </div>
  );
}