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
  // Check if this user already has a family stored
  const existing = loadFamilyForUser(userId);
  if (existing) return;

  // No stored family — create one
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