import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import { ProductImage } from './ProductImage';

export const ProductGallery = ({
  images,
  name,
  badge,
}: {
  images: string[];
  name: string;
  badge?: string;
}) => {
  const [active, setActive] = useState(0);
  const gallery = images.length ? images : [''];

  return (
    <div className="flex flex-col gap-3 md:flex-row">
      {gallery.length > 1 && (
        <div className="order-2 flex gap-2.5 overflow-x-auto no-scrollbar md:order-1 md:w-[86px] md:flex-col md:overflow-visible">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`View ${name} image ${index + 1}`}
              className={cn(
                'relative aspect-square w-[72px] shrink-0 overflow-hidden rounded-2xl border transition duration-300 md:w-full',
                active === index
                  ? 'border-accent/70 shadow-[0_0_24px_-8px_rgba(199,161,122,0.5)]'
                  : 'border-white/[0.08] opacity-55 hover:opacity-90'
              )}
            >
              <ProductImage src={image} alt="" />
            </button>
          ))}
        </div>
      )}

      <div className="order-1 relative flex-1 overflow-hidden rounded-[28px] border border-white/[0.08] product-well md:order-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="aspect-square w-full sm:aspect-[4/4.2]"
          >
            <ProductImage src={gallery[active]} alt={`${name} — image ${active + 1}`} priority />
          </motion.div>
        </AnimatePresence>
        {badge && (
          <span className="absolute left-5 top-5 rounded-full bg-ink/70 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/85 backdrop-blur-xl">
            {badge}
          </span>
        )}
        <div className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-ink/55 px-3 py-1 text-[10px] tabular-nums text-white/60 backdrop-blur-md">
          {active + 1} / {gallery.length}
        </div>
      </div>
    </div>
  );
};
