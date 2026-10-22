import { createContext, useContext, useState, type ReactNode } from 'react';
import { can, isRole, type Capability, type Role } from './index';
import { DEMO_ROLES } from './index';
import { usePortfolio } from '../store/PortfolioContext';
import { TODAY } from '../data/demo';

const STORAGE_KEY = 'aps-demo-role';
type RoleContextValue = { role: Role; setRole: (role: Role) => void; can: (capability: Capability) => boolean };
const RoleContext = createContext<RoleContextValue | null>(null);

function initialRole(): Role {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return isRole(stored) ? stored : 'teacher';
  } catch {
    return 'teacher';
  }
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const { dispatch } = usePortfolio();
  const [role, setCurrentRole] = useState<Role>(initialRole);
  const setRole = (next: Role) => {
    const previous = role;
    setCurrentRole(next);
    if (previous !== next) {
      const actorRole = DEMO_ROLES.find((item) => item.role === previous)!;
      dispatch({ type: 'roleSwitched', from: previous, to: next, actor: { role: previous, name: actorRole.name }, at: `${TODAY}T00:00:00.000Z` });
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Role switching still works for this page if storage is unavailable.
    }
  };
  return <RoleContext.Provider value={{ role, setRole, can: (capability) => can(role, capability) }}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleContextValue {
  const value = useContext(RoleContext);
  if (!value) throw new Error('useRole must be used inside RoleProvider');
  return value;
}
