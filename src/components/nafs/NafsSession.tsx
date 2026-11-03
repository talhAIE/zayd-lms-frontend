import { Navigate, Outlet } from 'react-router-dom';
import { NafsContext, useNafsOwner } from './useNafsSession';
export function NafsStudentSession() {
  const owner = useNafsOwner();
  if (!owner) return <Navigate to="/login" replace />;
  return (
    <NafsContext.Provider key={`${owner.id}:${owner.username}`} value={owner}>
      <Outlet />
    </NafsContext.Provider>
  );
}
