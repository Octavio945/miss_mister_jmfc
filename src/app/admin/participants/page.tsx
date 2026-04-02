import { prisma } from "@/lib/prisma";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function AdminParticipants() {
  const event = await prisma.votingEvent.findFirst({
    where: { isActive: true },
  });

  const participants = event
    ? await prisma.participant.findMany({
        where: { eventId: event.id },
        orderBy: [{ category: "asc" }, { number: "asc" }],
      })
    : [];

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary dark:text-white">Candidats</h1>
          <p className="text-foreground/60 mt-1">Gérez la liste des participants à l&apos;événement.</p>
        </div>
        <button className="px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors pointer-events-none opacity-50">
          + Ajouter un candidat (Bientôt)
        </button>
      </div>

      <div className="bg-white dark:bg-[#111] rounded-3xl shadow-sm border border-black/5 dark:border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/5 dark:bg-white/5 text-sm uppercase tracking-wider text-foreground/60">
              <tr>
                <th className="px-6 py-4 font-medium">Profil</th>
                <th className="px-6 py-4 font-medium">Catégorie</th>
                <th className="px-6 py-4 font-medium text-right">Votes Validés</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {participants.map((p) => (
                <tr key={p.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden relative bg-black/5">
                        {p.imageUrl && (
                          <Image
                            src={p.imageUrl}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized={p.imageUrl.includes("dicebear")}
                          />
                        )}
                      </div>
                      <div className="font-bold text-primary dark:text-white">{p.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-primary/10 text-primary dark:bg-white/10 dark:text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                      {p.category} {p.number}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-accent text-lg">
                    {p.totalVotes.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm text-foreground/60 hover:text-primary transition-colors pointer-events-none opacity-50">
                      Modifier
                    </button>
                  </td>
                </tr>
              ))}
              {participants.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-foreground/60">
                    Aucun candidat trouvé pour l&apos;événement actif.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
