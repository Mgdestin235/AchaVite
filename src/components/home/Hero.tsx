"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const SLIDES = [
  {
    title: "Les meilleures bonnes affaires à portée de main",
    subtitle: "Découvrez des milliers de produits à prix imbattables, livrés partout au Tchad.",
    cta: "Découvrir les offres",
    href: "/promotions",
    image: "https://picsum.photos/seed/hero-1/1200/800",
  },
  {
    title: "Nouveaux smartphones disponibles",
    subtitle: "Jusqu'à -30% sur une sélection de téléphones cette semaine.",
    cta: "Voir les téléphones",
    href: "/categorie/telephones",
    image: "https://picsum.photos/seed/hero-2/1200/800",
  },
  {
    title: "Mode & accessoires premium",
    subtitle: "Des styles tendance pour toute la famille, livrés rapidement.",
    cta: "Explorer la mode",
    href: "/categorie/mode",
    image: "https://picsum.photos/seed/hero-3/1200/800",
  },
];

export function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const slide = SLIDES[index];

  return (
    <section className="relative mx-auto mt-3 max-w-7xl overflow-hidden rounded-2xl bg-navy px-4 sm:mt-4 sm:px-6">
      <div className="relative flex min-h-[320px] items-center sm:min-h-[420px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <Image
              src={slide.image}
              alt=""
              fill
              priority={index === 0}
              className="object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/85 to-navy/20" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 max-w-xl py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="text-2xl font-extrabold leading-tight text-white sm:text-4xl">
                {slide.title}
              </h1>
              <p className="mt-3 text-sm text-white/80 sm:text-base">
                {slide.subtitle}
              </p>
              <Link
                href={slide.href}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange/30 transition-transform hover:scale-[1.03] active:scale-95"
              >
                {slide.cta}
                <ArrowRight size={18} />
              </Link>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-orange" : "w-1.5 bg-white/40"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
