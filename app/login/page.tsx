"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Scissors, Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    if (res?.error) {
      setError("E-mail ou senha incorretos.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[hsl(224,71%,18%)] to-[hsl(221,83%,35%)] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Scissors className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">FlowBarberHub</h1>
          <p className="text-sm text-white/60">Entre na sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white p-7 shadow-2xl space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">E-mail</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com" required autoComplete="email"
              className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Senha</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required autoComplete="current-password"
                className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Não tem conta?{" "}
            <Link href="/#planos" className="font-medium text-primary hover:underline">
              Comece grátis
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
