import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, getToken, setToken, clearToken, setFamilyId } from '../services/api';

interface User { id: string; email: string; full_name: string; role: string; }
interface AuthCtx {
  user: User | null;
  loading: boolean;
  familyReady: boolean;
  needsFamilySetup: boolean;
  createFamily: (name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

function getUserFamilyKey(userId: string) { return `family_id_${userId}`; }

function loadFamilyForUser(userId: string) {
  const stored = localStorage.getItem(getUserFamilyKey(userId));
  if (stored) { setFamilyId(stored); return stored; }
  return null;
}

function saveFamilyForUser(userId: string, familyId: string) {
  localStorage.setItem(getUserFamilyKey(userId), familyId);
  setFamilyId(familyId);
}

// Returns true if user already has a family (cached or from backend invite).
// Returns false only for a brand-new user who has never created/joined one.
async function resolveFamily(userId: string): Promise<boolean> {
  // 1. Locally cached — existing user, all their data is intact
  if (loadFamilyForUser(userId)) return true;

  // 2. Check backend — invited into someone else's family on another device
  try {
    const memberships = await api.families.mine();
    if (memberships.length > 0) {
      const admin = memberships.find(m => m.role === 'admin');
      saveFamilyForUser(userId, (admin || memberships[0]).family_id);
      return true;
    }
  } catch (e) {
    console.error('Could not fetch family memberships:', e);
  }

  // 3. Genuinely new user — needs to pick a name for their family
  return false;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [familyReady, setFamilyReady] = useState(false);
  const [needsFamilySetup, setNeedsFamilySetup] = useState(false);

  useEffect(() => {
    if (getToken()) {
      api.auth.me()
        .then(async (me) => {
          setUser(me);
          const has = await resolveFamily(me.id);
          setFamilyReady(has);
          setNeedsFamilySetup(!has);
        })
        .catch(() => clearToken())
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
    const has = await resolveFamily(me.id);
    setFamilyReady(has);
    setNeedsFamilySetup(!has);
  };

  const createFamily = async (name: string) => {
    if (!user) return;
    const f = await api.families.create(name.trim() || 'My Family');
    saveFamilyForUser(user.id, f.id);
    setFamilyReady(true);
    setNeedsFamilySetup(false);
  };

  const logout = () => {
    clearToken();
    setUser(null);
    setFamilyReady(false);
    setNeedsFamilySetup(false);
    // intentionally keep family_id_<userId> in localStorage so data stays on next login
  };

  return (
    <AuthContext.Provider value={{ user, loading, familyReady, needsFamilySetup, createFamily, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}