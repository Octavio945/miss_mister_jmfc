import { TransitionLink as Link } from "@/components/TransitionLink";
import Image from "next/image";
import { ArrowLeft, ArrowRight, CheckCircle2, Trophy, Share2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VotePanel from "@/components/VotePanel";

export const dynamic = "force-dynamic";

export default async function ParticipantDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const participant = await prisma.participant.findUnique({
    where: { id },
    include: { event: true },
  });

  if (!participant) notFound();

  return (
    <div className="pt-24 pb-20 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-6">

        {/* Navigation */}
        <Link
          href="/participants"
          className="inline-flex items-center space-x-2 text-foreground/60 hover:text-accent font-medium mb-10 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Retour aux candidats</span>
        </Link>

        {/* Profile Layout */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* Image & Share */}
          <div className="space-y-6">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-white/5 bg-black/5 dark:bg-white/5">
              {participant.imageUrl ? (
                <Image
                  src={participant.imageUrl}
                  alt={participant.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                  unoptimized={participant.imageUrl.includes("dicebear")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary/20 text-9xl font-serif font-bold">
                  {participant.name.charAt(0)}
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-8">
                <div className="text-white">
                  <p className="text-accent font-bold tracking-widest uppercase text-sm mb-1">
                    {participant.category} N°{String(participant.number).padStart(2, "0")}
                  </p>
                  <h1 className="text-4xl font-serif font-bold">{participant.name}</h1>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                id="share-profile-btn"
                className="flex items-center space-x-2 px-6 py-3 rounded-full bg-white dark:bg-black border border-black/5 dark:border-white/10 hover:shadow-md transition-all"
              >
                <Share2 size={18} className="text-foreground/70" />
                <span className="font-medium">Partager le profil</span>
              </button>
            </div>
          </div>

          {/* Vote Panel (client component) */}
          <VotePanel participant={participant} eventActive={participant.event.isActive} />

        </div>
      </div>
    </div>
  );
}
