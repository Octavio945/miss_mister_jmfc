"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, CreditCard, LogOut, ChevronLeft, X, Settings } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setShowLogoutModal(false);
    router.push("/admin/login");
    router.refresh();
  };

  const menuItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Vue d'ensemble" },
    { href: "/admin/participants", icon: Users, label: "Candidats" },
    { href: "/admin/transactions", icon: CreditCard, label: "Transactions" },
    { href: "/admin/settings", icon: Settings, label: "Paramètres" },
  ];

  // Si on est sur la page de connexion, on ne montre pas la sidebar Admin
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-black/5 dark:bg-[#0a0a0a] flex flex-col md:flex-row">
      
      {/* Sidebar Desktop / Navbar Mobile */}
      <aside className="w-full md:w-64 bg-white dark:bg-[#111] border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10 flex flex-col z-20 sticky top-0 md:h-screen shadow-sm">
        <div className="p-6">
          <Link href="/" className="inline-flex items-center space-x-2 text-foreground/60 hover:text-primary transition-colors text-sm font-medium mb-6">
            <ChevronLeft size={16} />
            <span>Retour au site</span>
          </Link>
          <h2 className="text-2xl font-serif font-bold text-primary dark:text-white">
            Admin Panel
          </h2>
          <p className="text-xs text-foreground/50 mt-1 uppercase tracking-widest">JMFC 2026</p>
        </div>

        <nav className="flex-1 px-4 pb-4 overflow-y-auto space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (pathname !== '/admin' && item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-black/10 dark:border-white/10">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden w-full max-w-full">
        {children}
      </main>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111] rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/5 dark:border-white/10 scale-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold text-primary dark:text-white">
                Déconnexion
              </h3>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="text-foreground/50 hover:text-foreground transition-colors p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-foreground/70 mb-8">
              Êtes-vous sûr de vouloir vous déconnecter de l'espace administrateur ? Vous devrez saisir à nouveau le mot de passe pour y accéder.
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 rounded-xl font-medium border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleLogout}
                className="flex-[2] px-4 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors shadow-md"
              >
                Oui, me déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
