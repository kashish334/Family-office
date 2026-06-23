import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, getToken, setToken, clearToken, getFamilyId, setFamilyId } from '../services/api';

interface User { id: string; email: string; full_name: string; role: string; }
interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

// Store family_id per user so it survives logout/login
function getUserFamilyKey(userId: string) {
  return `family_id_${userId}`;
}

function loadFamilyForUser(userId: string) {
  const stored = localStorage.getItem(getUserFamilyKey(userId));
  if (stored) {
    setFamilyId(stored); // sync to the key api.ts reads
    return stored;
  }
  return null;
}

function saveFamilyForUser(userId: string, familyId: string) {
  localStorage.setItem(getUserFamilyKey(userId), familyId);
  setFamilyId(familyId);
}

async function ensureFamily(userId: string) {
  // Check if this user already has a family stored locally for this browser
  const existing = loadFamilyForUser(userId);
  if (existing) return;

  // Ask the backend which families (if any) this user already belongs to —
  // this covers the case where the user was invited as a member of someone
  // else's family and is logging in for the first time on this device.
  try {
    const memberships = await api.families.mine();
    if (memberships.length > 0) {
      // Prefer a family where the user is admin, else just take the first one.
      const admin = memberships.find(m => m.role === 'admin');
      saveFamilyForUser(userId, (admin || memberships[0]).family_id);
      return;
    }
  } catch (e: any) {
    console.error('Could not fetch existing family memberships:', e);
  }

  // No memberships anywhere — this is a brand-new user, create their own family.
  try {
    const f = await api.families.create('My Family');
    saveFamilyForUser(userId, f.id);
  } catch (e: any) {
    console.error('Could not create family:', e);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (getToken()) {
      api.auth.me()
        .then(async (me) => {
          setUser(me);
          await ensureFamily(me.id);
        })
        .catch(() => {
          clearToken();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    setToken(res.access_token);
    const me = await api.auth.me();
    setUser(me);
    await ensureFamily(me.id); // uses stored family if exists
  };

  const logout = () => {
    clearToken();
    // DO NOT clear family_id — we keep it so data persists on next login
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}