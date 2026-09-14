"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const PHOTOS = [
  { src: "/images/impact/femme-robinet-enfants.png", alt: "Une mère puise de l'eau potable pendant que ses enfants regardent" },
  { src: "/images/impact/eau-insalubre.png", alt: "Un verre d'eau insalubre, non traitée" },
  { src: "/images/impact/femme-enceinte-famille.png", alt: "Une femme enceinte entourée de sa famille" },
  { src: "/images/impact/jeune-homme-eau.png", alt: "Un jeune homme boit de l'eau potable" },
  { src: "/images/impact/hopital-urgence.png", alt: "Une équipe médicale prend en charge un patient" },
  { src: "/images/impact/marche-vue-aerienne.png", alt: "Vue aérienne d'un marché communautaire" },
  { src: "/images/impact/enfant-lavage-mains.png", alt: "Un enfant se lave les mains à une fontaine" },
  { src: "/images/impact/femme-eau-potable-enfants.png", alt: "Une mère verse de l'eau potable pour ses enfants" },
  { src: "/images/impact/protection-aliments.png", alt: "Des aliments protégés et couverts" },
  { src: "/images/impact/benevoles-nettoyage.png", alt: "Des bénévoles nettoient les rues du quartier" },
  { src: "/images/impact/communaute-drapeau-tchad.png", alt: "Une communauté réunie devant le drapeau du Tchad" },
  { src: "/images/impact/equipe-medicale-coucher-soleil.png", alt: "Une équipe médicale et la communauté au coucher du soleil" },
] as const;

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function ImpactGallery() {
  return (
    <div className="mt-10">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-navy">Notre impact sur le terrain</h2>
          <span className="mt-1.5 block h-1 w-10 rounded-full bg-orange" />
        </div>
        <span className="text-xs text-gray-400">Eau • Santé • Communauté</span>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
        className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
      >
        {PHOTOS.map((photo) => (
          <motion.div
            key={photo.src}
            variants={item}
            className="group relative aspect-square overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-1 ring-black/5"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
