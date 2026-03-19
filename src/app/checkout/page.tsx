"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Lock, User, UserX, Phone, Mail, ShieldCheck } from "lucide-react";

export default function CheckoutPage() {
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [voteCount, setVoteCount] = useState(1);
  const ticketPrice = 100; // CFA

  const totalAmount = voteCount * ticketPrice;

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto px-6">
        
        <Link href="/participants/1" className="inline-flex items-center space-x-2 text-foreground/60 hover:text-accent font-medium mb-10 transition-colors">
          <ArrowLeft size={20} />
          <span>Retour au profil</span>
        </Link>
        <div className="mb-10">
          <h1 className="text-4xl font-serif font-bold text-primary dark:text-white mb-4">Finalisation du Vote</h1>
          <p className="text-foreground/70">Sélectionnez le nombre de votes et choisissez votre mode d'identification pour procéder au paiement sécurisé.</p>
        </div>

        <div className="grid md:grid-cols-5 gap-10">
          
          <div className="md:col-span-3 space-y-8">
            <div className="bg-white dark:bg-[#111] p-8 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-bl-full -z-10"></div>
              
              <h2 className="text-2xl font-serif font-bold mb-8">Votre Identité</h2>
              <div className="flex space-x-4 mb-8">
                <button 
                  onClick={() => setIsAnonymous(false)}
                  className={`flex-1 py-4 px-4 rounded-xl font-medium border-2 transition-all flex flex-col items-center justify-center space-y-2 ${!isAnonymous ? 'border-primary bg-primary/5 dark:bg-primary/20 text-primary dark:text-white' : 'border-black/5 dark:border-white/10 text-foreground/50 hover:bg-black/5'}`}
                >
                  <User size={24} className={!isAnonymous ? "text-primary dark:text-white" : ""} />
                  <span>S'identifier</span>
                </button>
                <button 
                  onClick={() => setIsAnonymous(true)}
                  className={`flex-1 py-4 px-4 rounded-xl font-medium border-2 transition-all flex flex-col items-center justify-center space-y-2 ${isAnonymous ? 'border-accent bg-accent/5 text-accent' : 'border-black/5 dark:border-white/10 text-foreground/50 hover:bg-black/5'}`}
                >
                  <UserX size={24} className={isAnonymous ? "text-accent" : ""} />
                  <span>Rester Anonyme</span>
                </button>
              </div>

              {!isAnonymous ? (
                <form className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/70">Prénom <span className="text-accent/60 text-xs">(Optionnel)</span></label>
                      <input type="text" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Jean" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground/70">Nom <span className="text-accent/60 text-xs">(Optionnel)</span></label>
                      <input type="text" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="Dupont" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70">Téléphone Mobile Money</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-3.5 text-foreground/40" size={20} />
                      <input type="tel" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono" placeholder="+229 97 00 00 00" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/70">Email <span className="text-accent/60 text-xs">(Optionnel pour le reçu)</span></label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 text-foreground/40" size={20} />
                      <input type="email" className="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="jean@example.com" />
                    </div>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8 px-6 bg-accent/5 border border-accent/20 rounded-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <ShieldCheck className="mx-auto text-accent mb-4" size={48} />
                  <h3 className="text-lg font-bold text-foreground mb-2">Vote 100% Anonyme</h3>
                  <p className="text-foreground/70 text-sm">
                    Un code unique de type <span className="font-mono bg-black/10 dark:bg-white/10 px-2 py-0.5 rounded font-bold text-primary dark:text-white">VOTER-XXXX</span> vous sera attribué pour garantir l'intégrité du système tout en préservant votre identité.
                  </p>
                </div>
              )}
            </div>
          </div>          
          <div className="md:col-span-2">
            <div className="bg-primary text-white p-8 rounded-3xl shadow-xl sticky top-32">
              <h3 className="text-xl font-serif font-bold mb-6 border-b border-white/10 pb-4">Résumé</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-white/80">
                  <span>Candidat :</span>
                  <span className="font-medium text-white">Priscilla K.</span>
                </div>
                <div className="flex justify-between items-center text-white/80">
                  <span>Prix unitaire :</span>
                  <span className="font-medium text-white">{ticketPrice} FCFA</span>
                </div>
                
                <div className="py-4 border-y border-white/10 flex items-center justify-between">
                  <span className="text-white/80">Nombre de votes</span>
                  <div className="flex items-center space-x-4 bg-white/10 rounded-full px-2 py-1">
                    <button 
                      onClick={() => setVoteCount(Math.max(1, voteCount - 1))}
                      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center font-medium"
                    >-</button>
                    <span className="w-8 text-center font-bold text-lg">{voteCount}</span>
                    <button 
                      onClick={() => setVoteCount(voteCount + 1)}
                      className="w-8 h-8 rounded-full bg-accent text-primary hover:bg-accent/90 flex items-center justify-center font-medium"
                    >+</button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-2xl font-bold pt-2">
                  <span>Total :</span>
                  <span className="text-accent">{totalAmount.toLocaleString()} FCFA</span>
                </div>
              </div>

              <button className="w-full py-4 rounded-full bg-accent text-primary font-bold text-lg hover:bg-accent/90 transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl">
                <Lock size={18} />
                <span>Payer {totalAmount.toLocaleString()} FCFA</span>
              </button>
              
              <p className="text-center text-white/50 text-xs mt-6 flex justify-center items-center space-x-1">
                <span>Paiement sécurisé par</span>
                <span className="font-bold text-white/70">FedaPay / CinetPay</span>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
