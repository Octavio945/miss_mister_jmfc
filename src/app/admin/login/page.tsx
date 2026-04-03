"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Mot de passe incorrect.");
      }
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>

      {/* Bouton retour accueil */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-accent transition-colors font-medium group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span>Retour à l&apos;accueil</span>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8 bg-white dark:bg-[#111] p-6 sm:p-10 rounded-3xl shadow-xl border border-black/5 dark:border-white/10 relative z-10">
        
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <ShieldCheck size={32} className="text-primary" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-primary dark:text-white">
            Espace Sécurisé
          </h2>
          <p className="text-foreground/60 text-sm">
            Veuillez entrer le mot de passe administrateur pour accéder au tableau de bord.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Mot de passe Administrateur
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 hover:text-foreground transition-colors p-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full h-12 rounded-xl bg-primary text-white flex items-center justify-center space-x-2 font-medium hover:bg-primary/90 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : "Accéder au Dashboard"}
          </button>
        </form>

      </div>
    </div>
  );
}
