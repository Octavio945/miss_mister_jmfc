"use client";

import { useState } from "react";
import { Share2, Check, Link2 } from "lucide-react";

interface ShareButtonProps {
  participantName: string;
  participantId: string;
}

export default function ShareButton({ participantName, participantId }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/participants/${participantId}`;
    const shareData = {
      title: `${participantName} — Miss & Mister JMFC 2026`,
      text: `Soutenez ${participantName} au concours Miss & Mister JMFC ! Votez dès maintenant 🎉`,
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Dismissed or unsupported — fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {}
    }
  };

  return (
    <div className="relative">
      <button
        id="share-profile-btn"
        onClick={handleShare}
        className="flex items-center space-x-2 px-6 py-3 rounded-full bg-white dark:bg-black border border-black/10 dark:border-white/10 hover:shadow-md hover:border-accent/40 transition-all duration-300 group"
      >
        {copied ? (
          <>
            <Check size={18} className="text-green-500" />
            <span className="font-medium text-green-600 dark:text-green-400">Lien copié !</span>
          </>
        ) : (
          <>
            <Share2 size={18} className="text-foreground/70 group-hover:text-accent transition-colors" />
            <span className="font-medium group-hover:text-accent transition-colors">Partager le profil</span>
          </>
        )}
      </button>

      {/* Tooltip discret */}
      {!navigator?.share && !copied && (
        <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-foreground/40 whitespace-nowrap">
          <Link2 size={10} className="inline mr-1" />
          Copie le lien
        </p>
      )}
    </div>
  );
}
