import { useEffect } from 'react';

export const useDocumentTitle = (title: string) => {
  useEffect(() => {
    document.title = title ? `${title} — AURELIS` : 'AURELIS — Technology, refined.';
    return () => {
      document.title = 'AURELIS — Technology, refined.';
    };
  }, [title]);
};
