import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export const SearchBar = ({
  className,
  autoFocus,
  onSubmitted,
  large,
  initialQuery = '',
}: {
  className?: string;
  autoFocus?: boolean;
  onSubmitted?: () => void;
  large?: boolean;
  initialQuery?: string;
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey) return;
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : '/shop');
    setQuery('');
    onSubmitted?.();
  };

  return (
    <form onSubmit={submit} className={cn('group relative w-full', className)} role="search">
      <Search
        className={cn(
          'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35 transition group-focus-within:text-accent',
          large ? 'h-5 w-5' : 'h-4 w-4'
        )}
      />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search the collection"
        aria-label="Search products"
        className={cn(
          'w-full rounded-full border border-white/[0.08] bg-white/[0.045] pl-11 pr-16 text-pearl placeholder:text-white/30 transition-all duration-300 focus:border-accent/35 focus:bg-white/[0.07] focus:ring-2 focus:ring-accent/10',
          large ? 'h-14 text-[15px]' : 'h-10 text-[12px]'
        )}
      />
      {query ? (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-white/35 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        !large && (
          <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-medium text-white/25 lg:block">
            /
          </kbd>
        )
      )}
    </form>
  );
};
