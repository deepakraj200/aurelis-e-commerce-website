import { Link } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { buttonStyles } from '@/components/ui/Button';

export const NotFoundPage = () => {
  useDocumentTitle('Page not found');

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-[28vw] font-semibold leading-none tracking-[-0.08em] text-white/[0.025]">404</span>
      </div>
      <div className="relative">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-accent/70">
          <Compass className="h-6 w-6" strokeWidth={1.4} />
        </span>
        <p className="eyebrow mt-7">A quiet detour</p>
        <h1 className="mt-3 text-[40px] leading-none tracking-[-0.05em] text-pearl sm:text-[56px]">
          This page has moved on.
        </h1>
        <p className="mx-auto mt-5 max-w-md text-[13px] leading-relaxed text-white/38">
          The address you followed does not exist — or the piece it pointed to has found a new home. Let us guide you
          back to something worth seeing.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/" className={buttonStyles('primary', 'md')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back home
          </Link>
          <Link to="/shop" className={buttonStyles('outline', 'md')}>Explore the collection</Link>
        </div>
      </div>
    </div>
  );
};
