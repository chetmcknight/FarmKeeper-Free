import { User, Crop, Animal, ScoutRecord, Farmhand } from '../types';
import { sheetsBackend } from './googleSheetsService';

const KEYS = {
  USER: 'farmhand_user',
  USERS_DB: 'farmhand_users_db',
  CROPS: 'farmhand_crops',
  ANIMALS: 'farmhand_animals',
  SCOUT_HISTORY: 'farmhand_scout_history',
  FARMHANDS: 'farmhand_workers',
};

function currentUserId(): string {
  const stored = localStorage.getItem(KEYS.USER);
  if (!stored) return '';
  try { return JSON.parse(stored).id || ''; } catch { return ''; }
}

const localBackend = {
  async login(email: string, password?: string): Promise<User> {
    const usersDbJson = localStorage.getItem(KEYS.USERS_DB);
    let usersDb: User[] = usersDbJson ? JSON.parse(usersDbJson) : [];
    
    const foundUser = usersDb.find(u => u.email === email);
    
    if (foundUser) {
        localStorage.setItem(KEYS.USER, JSON.stringify(foundUser));
        return foundUser;
    }

    throw new Error("Invalid email or password. Please sign up if you don't have an account.");
  },

  async signup(email: string, password?: string): Promise<User> {
    const usersDbJson = localStorage.getItem(KEYS.USERS_DB);
    const usersDb: User[] = usersDbJson ? JSON.parse(usersDbJson) : [];

    if (usersDb.some(u => u.email === email)) {
        throw new Error("Account already exists. Please log in.");
    }

    const newUser: User = {
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
    };

    usersDb.push(newUser);
    localStorage.setItem(KEYS.USERS_DB, JSON.stringify(usersDb));
    localStorage.setItem(KEYS.USER, JSON.stringify(newUser));
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const stored = localStorage.getItem(KEYS.USER);
    if (!stored) throw new Error("User not found");
    const user = JSON.parse(stored);
    const updatedUser = { ...user, ...updates };
    localStorage.setItem(KEYS.USER, JSON.stringify(updatedUser));

    const usersDbJson = localStorage.getItem(KEYS.USERS_DB);
    if (usersDbJson) {
        let usersDb: User[] = JSON.parse(usersDbJson);
        usersDb = usersDb.map(u => u.id === id ? updatedUser : u);
        localStorage.setItem(KEYS.USERS_DB, JSON.stringify(usersDb));
    }

    return updatedUser;
  },

  async updatePassword(password: string): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500));
  },

  async logout() { 
      localStorage.removeItem(KEYS.USER); 
  },

  async deleteAccount() {
    const stored = localStorage.getItem(KEYS.USER);
    if (stored) {
        const user = JSON.parse(stored);
        const usersDbJson = localStorage.getItem(KEYS.USERS_DB);
        if (usersDbJson) {
            let usersDb: User[] = JSON.parse(usersDbJson);
            usersDb = usersDb.filter(u => u.id !== user.id);
            localStorage.setItem(KEYS.USERS_DB, JSON.stringify(usersDb));
        }
    }

    localStorage.removeItem(KEYS.USER);
    localStorage.removeItem(KEYS.CROPS);
    localStorage.removeItem(KEYS.ANIMALS);
    localStorage.removeItem(KEYS.SCOUT_HISTORY);
    localStorage.removeItem(KEYS.FARMHANDS);
  },

  async getCurrentUser(): Promise<User | null> {
    const stored = localStorage.getItem(KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  },
  
  // Crops
  async getCrops(): Promise<Crop[]> {
    const uid = currentUserId();
    const stored = localStorage.getItem(KEYS.CROPS);
    const all: Crop[] = stored ? JSON.parse(stored) : [];
    return all.filter(c => !c.userId || c.userId === uid);
  },
  async addCrop(crop: Omit<Crop, 'id' | 'userId'>): Promise<Crop> {
    const uid = currentUserId();
    const stored = localStorage.getItem(KEYS.CROPS);
    const all: Crop[] = stored ? JSON.parse(stored) : [];
    const newCrop: Crop = { ...crop, id: Date.now().toString(), userId: uid };
    localStorage.setItem(KEYS.CROPS, JSON.stringify([...all, newCrop]));
    return newCrop;
  },
  async updateCrop(updatedCrop: Crop): Promise<Crop> {
    const stored = localStorage.getItem(KEYS.CROPS);
    const all: Crop[] = stored ? JSON.parse(stored) : [];
    const index = all.findIndex(c => c.id === updatedCrop.id);
    if (index !== -1) {
      all[index] = updatedCrop;
      localStorage.setItem(KEYS.CROPS, JSON.stringify(all));
      return updatedCrop;
    }
    throw new Error("Crop not found");
  },
  async deleteCrop(id: string): Promise<void> {
    const stored = localStorage.getItem(KEYS.CROPS);
    const all: Crop[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem(KEYS.CROPS, JSON.stringify(all.filter(c => c.id !== id)));
  },
  // Animals
  async getAnimals(): Promise<Animal[]> {
    const uid = currentUserId();
    const stored = localStorage.getItem(KEYS.ANIMALS);
    const all: Animal[] = stored ? JSON.parse(stored) : [];
    return all.filter(a => !a.userId || a.userId === uid);
  },
  async addAnimal(animal: Omit<Animal, 'id' | 'userId'>): Promise<Animal> {
    const uid = currentUserId();
    const stored = localStorage.getItem(KEYS.ANIMALS);
    const all: Animal[] = stored ? JSON.parse(stored) : [];
    const newAnimal: Animal = { ...animal, id: Date.now().toString(), userId: uid };
    localStorage.setItem(KEYS.ANIMALS, JSON.stringify([...all, newAnimal]));
    return newAnimal;
  },
  async updateAnimal(updatedAnimal: Animal): Promise<Animal> {
    const stored = localStorage.getItem(KEYS.ANIMALS);
    const all: Animal[] = stored ? JSON.parse(stored) : [];
    const index = all.findIndex(a => a.id === updatedAnimal.id);
    if (index !== -1) {
      all[index] = updatedAnimal;
      localStorage.setItem(KEYS.ANIMALS, JSON.stringify(all));
      return updatedAnimal;
    }
    throw new Error("Animal not found");
  },
  async deleteAnimal(id: string): Promise<void> {
    const stored = localStorage.getItem(KEYS.ANIMALS);
    const all: Animal[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem(KEYS.ANIMALS, JSON.stringify(all.filter(a => a.id !== id)));
  },
  // Farmhands
  async getFarmhands(): Promise<Farmhand[]> {
    const uid = currentUserId();
    const stored = localStorage.getItem(KEYS.FARMHANDS);
    const all: Farmhand[] = stored ? JSON.parse(stored) : [];
    return all.filter(f => !f.userId || f.userId === uid);
  },
  async addFarmhand(farmhand: Omit<Farmhand, 'id' | 'userId'>): Promise<Farmhand> {
    const uid = currentUserId();
    const stored = localStorage.getItem(KEYS.FARMHANDS);
    const all: Farmhand[] = stored ? JSON.parse(stored) : [];
    const newHand: Farmhand = { ...farmhand, id: Date.now().toString(), userId: uid };
    localStorage.setItem(KEYS.FARMHANDS, JSON.stringify([...all, newHand]));
    return newHand;
  },
  async updateFarmhand(updatedHand: Farmhand): Promise<Farmhand> {
    const stored = localStorage.getItem(KEYS.FARMHANDS);
    const all: Farmhand[] = stored ? JSON.parse(stored) : [];
    const index = all.findIndex(h => h.id === updatedHand.id);
    if (index !== -1) {
      all[index] = updatedHand;
      localStorage.setItem(KEYS.FARMHANDS, JSON.stringify(all));
      return updatedHand;
    }
    throw new Error("Farmhand not found");
  },
  async deleteFarmhand(id: string): Promise<void> {
    const stored = localStorage.getItem(KEYS.FARMHANDS);
    const all: Farmhand[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem(KEYS.FARMHANDS, JSON.stringify(all.filter(h => h.id !== id)));
  },
  // Scout
  async getScoutHistory(): Promise<ScoutRecord[]> {
    const uid = currentUserId();
    const stored = localStorage.getItem(KEYS.SCOUT_HISTORY);
    const all: ScoutRecord[] = stored ? JSON.parse(stored) : [];
    return all.filter(s => !s.userId || s.userId === uid);
  },
  async addScoutRecord(record: Omit<ScoutRecord, 'id' | 'userId'>): Promise<ScoutRecord> {
    const uid = currentUserId();
    const stored = localStorage.getItem(KEYS.SCOUT_HISTORY);
    const all: ScoutRecord[] = stored ? JSON.parse(stored) : [];
    const newRecord = { ...record, id: Date.now().toString(), userId: uid };
    const updated = [newRecord, ...all].slice(0, 5);
    localStorage.setItem(KEYS.SCOUT_HISTORY, JSON.stringify(updated));
    return newRecord;
  },
  async deleteScoutRecord(id: string): Promise<void> {
    const stored = localStorage.getItem(KEYS.SCOUT_HISTORY);
    const all: ScoutRecord[] = stored ? JSON.parse(stored) : [];
    localStorage.setItem(KEYS.SCOUT_HISTORY, JSON.stringify(all.filter(r => r.id !== id)));
  }
};

function isSheetsConfigured() {
  if (typeof window === 'undefined') return false;

  const sheetId = localStorage.getItem('gs_sheet_id') || import.meta.env.VITE_GS_SHEET_ID || '';
  const apiKey = localStorage.getItem('gs_api_key') || import.meta.env.VITE_GS_API_KEY || '';
  const scriptUrl = localStorage.getItem('gs_script_url') || import.meta.env.VITE_GS_SCRIPT_URL || '';

  if (sheetId && apiKey && scriptUrl) {
    localStorage.setItem('gs_sheet_id', sheetId);
    localStorage.setItem('gs_api_key', apiKey);
    localStorage.setItem('gs_script_url', scriptUrl);
    return true;
  }

  return false;
}

const sheetsConfigured = isSheetsConfigured();

// Wrap sheets backend: localStorage first (instant), then background-sync to sheets.
function sheetsWithFallback(): typeof localBackend {
  const proxy = {} as typeof localBackend;
  const authMethods = new Set(['login', 'signup', 'getCurrentUser', 'logout', 'deleteAccount', 'updatePassword']);
  const createMethods = new Set(['addCrop', 'addAnimal', 'addFarmhand', 'addScoutRecord']);
  const readKeyMap: Record<string, string> = {
    getCrops: KEYS.CROPS,
    getAnimals: KEYS.ANIMALS,
    getFarmhands: KEYS.FARMHANDS,
    getScoutHistory: KEYS.SCOUT_HISTORY,
  };

  for (const key of Object.keys(localBackend) as (keyof typeof localBackend)[]) {
    proxy[key] = async (...args: any[]) => {
      if (authMethods.has(key as string)) {
        return await (sheetsBackend as any)[key](...args);
      }

      try {
        const result = await (localBackend as any)[key](...args);

        // Background sync: for creates, pass the local result (with generated id);
        // otherwise pass through original args
        const syncArgs = createMethods.has(key as string) ? [result] : args;
        (sheetsBackend as any)[key](...syncArgs).then((sheetsResult: any) => {
          // Cache fresh sheets data back to localStorage for reads
          const sheetsKey = readKeyMap[key as string];
          if (sheetsKey && sheetsResult && Array.isArray(sheetsResult) && sheetsResult.length > 0) {
            try { localStorage.setItem(sheetsKey, JSON.stringify(sheetsResult)); } catch {}
          }
        }).catch((e: any) => {
          console.warn(`Sheets background sync "${String(key)}" failed:`, e?.message || e);
        });

        return result;
      } catch (localError) {
        console.warn(`LocalStorage "${String(key)}" failed, trying sheets:`, localError);
        return await (sheetsBackend as any)[key](...args);
      }
    };
  }
  return proxy;
}

export const backend = sheetsConfigured ? sheetsWithFallback() : localBackend;
