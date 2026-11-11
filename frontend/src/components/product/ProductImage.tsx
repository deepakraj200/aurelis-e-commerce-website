import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import { resolveImage } from '@/utils/format';

export const ProductImage = ({
  src,
  alt,
  className,
  imgClassName,
  priority,
}: {
  src?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
}) => {
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn('relative h-full w-full overflow-hidden bg-[#161618]', className)}>
      {!failed && src ? (
        <img
          src={resolveImage(src)}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover', imgClassName)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_30%_20%,#2b2a27,#111113_70%)] text-white/25">
          <ImageOff className="h-6 w-6" strokeWidth={1.2} />
          <span className="text-[10px] uppercase tracking-[0.2em]">Aurelis</span>
        </div>
      )}
    </div>
  );
};
