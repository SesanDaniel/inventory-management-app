import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');

const TOKEN_STORAGE_KEY = 'sheettracker_auth_token';
const TOKEN_MAX_AGE_MS = 55 * 60 * 1000; // Google access tokens last ~60 min

let isSigningIn = false;
let cachedAccessToken: string | null = null;

function saveTokenToStorage(token: string) {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ token, savedAt: Date.now() }));
  } catch (e) { console.error('Failed to persist auth token:', e); }
}

function loadTokenFromStorage(): string | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const { token, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > TOKEN_MAX_AGE_MS) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      return null;
    }
    return token;
  } catch (e) { return null; }
}

function clearTokenFromStorage() {
  try { localStorage.removeItem(TOKEN_STORAGE_KEY); } catch (e) {}
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        return;
      }
      const storedToken = loadTokenFromStorage();
      if (storedToken) {
        cachedAccessToken = storedToken;
        if (onAuthSuccess) onAuthSuccess(user, storedToken);
        return;
      }
      if (onAuthFailure) onAuthFailure();
    } else {
      cachedAccessToken = null;
      clearTokenFromStorage();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) throw new Error('Failed to get access token from Firebase Auth');

    cachedAccessToken = credential.accessToken;
    saveTokenToStorage(cachedAccessToken);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => cachedAccessToken;

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  clearTokenFromStorage();
};
