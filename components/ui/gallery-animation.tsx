'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

export interface FeatureItem {
  num: string;
  label: string;
  desc: string;
  src: string;
  alt: string;
}

interface FeatureGalleryProps {
  features: FeatureItem[];
  className?: string;
}

const FeatureGallery: React.FC<FeatureGalleryProps> = ({ features, className = '' }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Split into two rows of 3
  const row1 = features.slice(0, 3);
  const row2 = features.slice(3, 6);

  const getFlex = (rowIndex: number, itemIndex: number) => {
    const globalIndex = rowIndex * 3 + itemIndex;
    if (hoveredIndex === null) return 1;
    return hoveredIndex === globalIndex ? 2.5 : 0.65;
  };

  const openImage = (index: number) => setSelectedIndex(index);
  const closeImage = () => setSelectedIndex(null);

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null)
      setSelectedIndex((selectedIndex + 1) % features.length);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIndex !== null)
      setSelectedIndex((selectedIndex - 1 + features.length) % features.length);
  };

  const GalleryRow = ({ items, rowIndex }: { items: FeatureItem[]; rowIndex: number }) => (
    <div className="flex gap-3 h-[420px] w-full">
      {items.map((feature, itemIndex) => {
        const globalIndex = rowIndex * 3 + itemIndex;
        const isHovered = hoveredIndex === globalIndex;
        return (
          <motion.article
            key={feature.num}
            className="relative cursor-pointer overflow-hidden border-4 border-black bg-black"
            style={{ flex: 1 }}
            animate={{ flex: getFlex(rowIndex, itemIndex) }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            onMouseEnter={() => setHoveredIndex(globalIndex)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => openImage(globalIndex)}
          >
            {/* Screenshot */}
            <img
              src={feature.src}
              alt={feature.alt}
              className="w-full h-full object-cover object-top"
              style={{ display: 'block' }}
            />

            {/* Base darkening when not hovered */}
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.25) 40%, transparent 70%)' }}
              animate={{ opacity: isHovered ? 1 : 0.6 }}
              transition={{ duration: 0.35 }}
            />

            {/* Label — always visible but larger on hover */}
            <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
              <motion.span
                className="block text-[11px] font-black uppercase tracking-[0.4em] text-[#FF3000]"
                animate={{ opacity: 1 }}
              >
                {feature.num}
              </motion.span>
              <motion.h3
                className="mt-1 font-black uppercase tracking-widest leading-tight overflow-hidden whitespace-nowrap"
                animate={{ fontSize: isHovered ? '1.35rem' : '0.95rem' }}
                transition={{ duration: 0.35 }}
              >
                {feature.label}
              </motion.h3>
              <motion.p
                className="mt-1.5 font-bold uppercase tracking-widest text-white/70 overflow-hidden"
                animate={{
                  maxHeight: isHovered ? '60px' : '0px',
                  opacity: isHovered ? 1 : 0,
                  fontSize: '0.72rem',
                }}
                transition={{ duration: 0.35 }}
              >
                {feature.desc}
              </motion.p>
            </div>
          </motion.article>
        );
      })}
    </div>
  );

  return (
    <div className={className}>
      <div className="flex flex-col gap-3">
        <GalleryRow items={row1} rowIndex={0} />
        <GalleryRow items={row2} rowIndex={1} />
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
            onClick={closeImage}
          >
            {/* Close */}
            <button
              className="absolute right-5 top-5 z-10 border-2 border-white/30 bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
              onClick={closeImage}
            >
              <X className="h-5 w-5" />
            </button>

            {/* Prev */}
            <button
              className="absolute left-5 top-1/2 z-10 -translate-y-1/2 border-2 border-white/30 bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              onClick={goPrev}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Image */}
            <motion.div
              className="relative max-h-[88vh] max-w-6xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={selectedIndex}
                src={features[selectedIndex].src}
                alt={features[selectedIndex].alt}
                className="w-full h-full object-contain border-4 border-white/10"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.25 }}
              />
              {/* Label overlay inside lightbox */}
              <div className="absolute bottom-4 left-4">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF3000]">
                  {features[selectedIndex].num}
                </span>
                <h4 className="mt-0.5 text-xl font-black uppercase tracking-widest text-white">
                  {features[selectedIndex].label}
                </h4>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/60">
                  {features[selectedIndex].desc}
                </p>
              </div>
            </motion.div>

            {/* Next */}
            <button
              className="absolute right-5 top-1/2 z-10 -translate-y-1/2 border-2 border-white/30 bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
              onClick={goNext}
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 border-2 border-white/20 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white">
              {selectedIndex + 1} / {features.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeatureGallery;
