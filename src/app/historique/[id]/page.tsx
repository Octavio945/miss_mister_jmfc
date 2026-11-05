import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TransitionLink as Link } from "@/components/TransitionLink";
import { DrawLine, FadeIn, ParallaxImage, StaggerContainer, StaggerItem, TextReveal } from "@/components/AnimatedSection";
import Podium from "@/components/Podium";
import PhotoGallery from "@/components/PhotoGallery";
import { prisma } from "@/lib/prisma";
import { getCurrentEvent, getEditionYear, isEditionFinished } from "@/lib/event";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

/** Édition terminée uniquement : une édition en cours n'a pas encore d'historique. */
async function getFinishedEdition(id: string) {
  const [current, edition] = await Promise.all([
    getCurrentEvent(),
    prisma.votingEvent.findUnique({
      where: { id },
      include: {
        photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
        participants: { orderBy: { totalVotes: "desc" } },
      },
    }),
  ]);
  if (!edition || !isEditionFinished(edition, current?.id)) return null;
  return edition;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const edition = await getFinishedEdition((await params).id);
  if (!edition) return { title: "Édition introuvable — Miss & Mister JMFC" };
  return {
    title: `${edition.title} — Historique`,
    description: edition.description?.slice(0, 160) ?? `Lauréats, candidats et photos de ${edition.title}.`,
    openGraph: edition.photos[0] ? { images: [edition.photos[0].imageUrl] } : undefined,
  };
}

const formatDay = (date: Date) =>
  date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function EditionHistoryPage({ params }: Props) {
  const edition = await getFinishedEdition((await params).id);
  if (!edition) notFound();

  const misses = edition.participants.filter((p) => p.category === "MISS");
  const misters = edition.participants.filter((p) => p.category === "MISTER");
  const cover = edition.photos[0]?.imageUrl ?? misses[0]?.imageUrl ?? null;
  const totalVotes = edition.participants.reduce((sum, p) => sum + p.totalVotes, 0);

  return (
    <div className="bg-background min-h-screen pb-20">
      {/* Bandeau */}
      <section className="relative w-full min-h-[50vh] flex items-end overflow-hidden bg-primary">
        {cover && (
          <ParallaxImage src={cover} alt={edition.title} priority sizes="100vw" imageClassName="object-cover opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#0F172A]/60 to-transparent" />
        <div className="relative max-w-6xl mx-auto w-full px-6 pt-32 pb-12">
          <Link
            href="/historique"
            className="inline-flex items-center gap-2 text-white/70 hover:text-accent text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Toutes les éditions
          </Link>
          <p className="text-accent font-serif font-bold text-2xl">Édition {getEditionYear(edition)}</p>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mt-2">
            <TextReveal text={edition.title} delay={0.2} className="justify-start" />
          </h1>
          <p className="text-white/70 mt-3">
            Votes du {formatDay(edition.startDate)} au {formatDay(edition.endDate)} · {edition.participants.length} candidats ·{" "}
            {totalVotes.toLocaleString("fr-FR")} votes
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 space-y-20 pt-14">
        {/* Récit */}
        {edition.description && (
          <FadeIn direction="up">
            <p className="text-lg leading-relaxed text-foreground/80 max-w-3xl mx-auto whitespace-pre-line text-center">
              {edition.description}
            </p>
          </FadeIn>
        )}

        {/* Lauréats */}
        {edition.participants.length > 0 && (
          <section>
            <FadeIn direction="up">
              <h2 className="text-center text-3xl md:text-4xl font-serif font-bold text-primary dark:text-white mb-4">
                Les lauréats
              </h2>
              <DrawLine className="w-28 mx-auto mb-12" />
            </FadeIn>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-10">
              <FadeIn direction="up" delay={0.1}>
                <Podium title="Miss" candidates={misses} />
              </FadeIn>
              <FadeIn direction="up" delay={0.2}>
                <Podium title="Mister" candidates={misters} />
              </FadeIn>
            </div>
          </section>
        )}

        {/* Galerie */}
        {edition.photos.length > 0 && (
          <section>
            <FadeIn direction="up">
              <h2 className="text-center text-3xl md:text-4xl font-serif font-bold text-primary dark:text-white mb-4">
                En images
              </h2>
              <DrawLine className="w-28 mx-auto mb-10" />
            </FadeIn>
            <PhotoGallery
              title={edition.title}
              photos={edition.photos.map(({ id, imageUrl, caption }) => ({ id, imageUrl, caption }))}
            />
          </section>
        )}

        {/* Tous les candidats */}
        {edition.participants.length > 0 && (
          <section>
            <FadeIn direction="up">
              <h2 className="text-center text-3xl md:text-4xl font-serif font-bold text-primary dark:text-white mb-4">
                Les candidats
              </h2>
              <DrawLine className="w-28 mx-auto mb-10" />
            </FadeIn>
            <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4" delayOrder={0.06}>
              {[...misses, ...misters].map((p) => (
                <StaggerItem key={p.id}>
                  <Link href={`/participants/${p.id}`} data-cursor="Voir" className="group block">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-primary/10">
                      {p.imageUrl ? (
                        <Image
                          src={p.imageUrl}
                          alt={p.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 20vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-110 motion-reduce:transition-none"
                          unoptimized={p.imageUrl.includes("dicebear")}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary/30 text-5xl font-serif font-bold">
                          {p.name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-background/90 text-[10px] font-bold uppercase tracking-widest text-primary">
                        {p.category} N°{String(p.number).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="mt-2 font-serif font-bold text-sm text-primary dark:text-white truncate">{p.name.trim()}</p>
                    <p className="text-xs text-foreground/50">{p.totalVotes.toLocaleString("fr-FR")} votes</p>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </section>
        )}
      </div>
    </div>
  );
}
