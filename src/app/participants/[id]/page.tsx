import { TransitionLink as Link } from "@/components/TransitionLink";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import VotePanel from "@/components/VotePanel";
import ShareButton from "@/components/ShareButton";
import { ClipReveal, FadeIn, ParallaxImage, TextReveal } from "@/components/AnimatedSection";

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
        <FadeIn direction="right" className="mb-10">
          <Link
            href="/participants"
            className="group inline-flex items-center space-x-2 text-foreground/60 hover:text-accent font-medium transition-colors"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span>Retour aux candidats</span>
          </Link>
        </FadeIn>

        {/* Profile Layout */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* Image & Share */}
          <div className="space-y-6">
            <ClipReveal className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-white/5 bg-black/5 dark:bg-white/5">
              {participant.imageUrl ? (
                  <ParallaxImage
                    src={participant.imageUrl}
                    alt={participant.name}
                    sizes="(max-width: 768px) 100vw, 50vw"
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
                  <h1 className="text-4xl font-serif font-bold">
                    <TextReveal text={participant.name.trim()} delay={0.7} className="justify-start" />
                  </h1>
                </div>
              </div>
            </ClipReveal>

            <FadeIn delay={0.5} className="flex justify-center space-x-4">
              <ShareButton
                participantName={participant.name}
                participantId={participant.id}
              />
            </FadeIn>

            {/* Description / À propos */}
            {participant.description && participant.description.trim().length > 0 && (
              <FadeIn delay={0.2}>
              <div className="bg-white dark:bg-[#111] rounded-3xl border border-black/5 dark:border-white/10 p-6 shadow-sm space-y-3">
                <h2 className="text-sm font-bold tracking-[0.2em] uppercase text-accent flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-accent" />
                  À propos
                </h2>
                <p className="text-foreground/70 leading-relaxed text-base whitespace-pre-line">
                  {participant.description}
                </p>
              </div>
              </FadeIn>
            )}
          </div>

          {/* Vote Panel (client component) */}
          <VotePanel 
            participant={participant} 
            eventActive={
              participant.event.isActive && 
              new Date() >= new Date(participant.event.startDate) && 
              new Date() <= new Date(participant.event.endDate)
            } 
            votePrice={participant.event.votePrice ?? 100}
          />

        </div>
      </div>
    </div>
  );
}
