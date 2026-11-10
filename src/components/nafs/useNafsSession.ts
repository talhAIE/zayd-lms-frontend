import { createContext, useContext, useMemo } from 'react';
import { useAppSelector } from '@/redux/hooks';
import type { NafsOwner } from '@/services/nafsService';

export function useNafsOwner() {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const id = user?.id,
    username = user?.username;
  const allowed = isAuthenticated && user?.role === 'student';
  return useMemo(
    () => (allowed && id && username ? { id, username } : null),
    [allowed, id, username],
  );
}
export const NafsContext = createContext<NafsOwner | null>(null);
export function useNafsSession() {
  const owner = useContext(NafsContext);
  if (!owner) throw new Error('NAFS requires a student session');
  return owner;
}
