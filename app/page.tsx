"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Mail, Lock, Scissors, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Credenciales incorrectas. Verifica tu acceso.");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-zinc-950 overflow-hidden font-sans">
      
      {/* Fondo Premium */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950"></div>
        {/* Elementos decorativos desenfocados */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-amber-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-600/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo / Encabezado */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-amber-900/20 mb-4 transform rotate-3">
            <Scissors className="text-zinc-950 w-8 h-8 -rotate-12" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
            BARBER PRO
          </h1>
          <p className="text-zinc-400 text-sm font-medium mt-2 tracking-widest uppercase">
            Workspace Administrativo
          </p>
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/60 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-400 text-xs font-bold uppercase ml-1">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@barberia.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-zinc-950/80 border-zinc-800 text-zinc-100 h-14 pl-12 rounded-xl focus:ring-1 focus:ring-amber-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-400 text-xs font-bold uppercase ml-1">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-5 h-5" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-950/80 border-zinc-800 text-zinc-100 h-14 pl-12 rounded-xl focus:ring-1 focus:ring-amber-500 transition-all"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl animate-in fade-in slide-in-from-top-2">
                <p className="text-red-400 text-sm font-bold text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black h-14 text-base rounded-xl shadow-lg shadow-amber-900/20 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Conectando...</>
              ) : (
                "Ingresar al Sistema"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-zinc-600 text-xs mt-8 font-medium">
          &copy; {new Date().getFullYear()} Barber Pro. Sistema de gestión autorizado.
        </p>
      </div>
    </div>
  );
}