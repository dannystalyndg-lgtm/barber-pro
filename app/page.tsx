"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

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
      setError("Credenciales incorrectas. Intenta de nuevo.");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <CardTitle className="text-4xl font-black tracking-tighter text-amber-500">
            BARBER PRO
          </CardTitle>
          <CardDescription className="text-zinc-400 text-md">
            Panel Administrativo y Punto de Venta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 text-left">
              <Label htmlFor="email" className="text-zinc-300 font-medium">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@barberia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-950 border-zinc-700 text-zinc-100 focus-visible:ring-amber-500 h-12"
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-zinc-300 font-medium">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-zinc-950 border-zinc-700 text-zinc-100 focus-visible:ring-amber-500 h-12"
                required
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-950/50 border border-red-900 rounded-md">
                <p className="text-red-500 text-sm font-medium text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-zinc-50 font-bold h-12 text-lg transition-colors"
            >
              {loading ? "Verificando identidad..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}