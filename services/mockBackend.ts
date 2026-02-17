import { User, Crop, Animal, ScoutRecord } from '../types';
import { supabase } from './supabaseClient';

const KEYS = {
  USER: 'farmhand_user',
  USERS_DB: 'farmhand_users_db',
  CROPS: 'farmhand_crops',
  ANIMALS: 'farmhand_animals',
  SCOUT_HISTORY: 'farmhand_scout_history',
};

// --- Local Storage Implementation (Fallback) ---
const localBackend = {
  async login(email: string, password?: string): Promise<User> {
    // Check registered users DB
    const usersDbJson = localStorage.getItem(KEYS.USERS_DB);
    const usersDb: User[] = usersDbJson ? JSON.parse(usersDbJson) : [];
    
    const foundUser = usersDb.find(u => u.email === email);
    
    if (foundUser) {
        // In a real app, check password here.
        localStorage.setItem(KEYS.USER, JSON.stringify(foundUser));
        return foundUser;
    }

    throw new Error("Invalid email or password. Please sign up if you don't have an account.");
  },

  async signup(email: string, password?: string, plan: 'free' | 'pro' = 'free'): Promise<User> {
    const usersDbJson = localStorage.getItem(KEYS.USERS_DB);
    const usersDb: User[] = usersDbJson ? JSON.parse(usersDbJson) : [];

    if (usersDb.some(u => u.email === email)) {
        throw new Error("Account already exists. Please log in.");
    }

    const newUser: User = {
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
      plan: plan,
    };

    // Save to DB
    usersDb.push(newUser);
    localStorage.setItem(KEYS.USERS_DB, JSON.stringify(usersDb));

    // Set active session
    localStorage.setItem(KEYS.USER, JSON.stringify(newUser));
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Update session
    const stored = localStorage.getItem(KEYS.USER);
    if (!stored) throw new Error("User not found");
    const user = JSON.parse(stored);
    const updatedUser = { ...user, ...updates };
    localStorage.setItem(KEYS.USER, JSON.stringify(updatedUser));

    // Update DB
    const usersDbJson = localStorage.getItem(KEYS.USERS_DB);
    if (usersDbJson) {
        let usersDb: User[] = JSON.parse(usersDbJson);
        usersDb = usersDb.map(u => u.id === id ? updatedUser : u);
        localStorage.setItem(KEYS.USERS_DB, JSON.stringify(usersDb));
    }

    return updatedUser;
  },

  async updatePassword(password: string): Promise<void> {
    // In the local mock, we don't actually store passwords securely, 
    // but we simulate the success delay.
    return new Promise(resolve => setTimeout(resolve, 500));
  },

  async logout() { 
      localStorage.removeItem(KEYS.USER); 
  },

  async deleteAccount() {
    const stored = localStorage.getItem(KEYS.USER);
    if (stored) {
        const user = JSON.parse(stored);
        
        // Remove from DB
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
  },

  async getCurrentUser(): Promise<User | null> {
    const stored = localStorage.getItem(KEYS.USER);
    return stored ? JSON.parse(stored) : null;
  },

  async upgradePlan(userId: string): Promise<User> {
    // Update session
    const stored = localStorage.getItem(KEYS.USER);
    if (!stored) throw new Error("User not found");
    const user = JSON.parse(stored);
    user.plan = 'pro';
    localStorage.setItem(KEYS.USER, JSON.stringify(user));

    // Update DB
    const usersDbJson = localStorage.getItem(KEYS.USERS_DB);
    if (usersDbJson) {
        let usersDb: User[] = JSON.parse(usersDbJson);
        usersDb = usersDb.map(u => u.id === userId ? user : u);
        localStorage.setItem(KEYS.USERS_DB, JSON.stringify(usersDb));
    }
    
    return user;
  },
  
  // Crops
  async getCrops(): Promise<Crop[]> {
    const stored = localStorage.getItem(KEYS.CROPS);
    return stored ? JSON.parse(stored) : [];
  },
  async addCrop(crop: Omit<Crop, 'id'>): Promise<Crop> {
    const crops = await this.getCrops();
    const newCrop: Crop = { ...crop, id: Date.now().toString() };
    const updated = [...crops, newCrop];
    localStorage.setItem(KEYS.CROPS, JSON.stringify(updated));
    return newCrop;
  },
  async updateCrop(updatedCrop: Crop): Promise<Crop> {
    const crops = await this.getCrops();
    const index = crops.findIndex(c => c.id === updatedCrop.id);
    if (index !== -1) {
      crops[index] = updatedCrop;
      localStorage.setItem(KEYS.CROPS, JSON.stringify(crops));
      return updatedCrop;
    }
    throw new Error("Crop not found");
  },
  async deleteCrop(id: string): Promise<void> {
    const crops = await this.getCrops();
    const updated = crops.filter(c => c.id !== id);
    localStorage.setItem(KEYS.CROPS, JSON.stringify(updated));
  },
  // Animals
  async getAnimals(): Promise<Animal[]> {
    const stored = localStorage.getItem(KEYS.ANIMALS);
    return stored ? JSON.parse(stored) : [];
  },
  async addAnimal(animal: Omit<Animal, 'id'>): Promise<Animal> {
    const animals = await this.getAnimals();
    const newAnimal: Animal = { ...animal, id: Date.now().toString() };
    const updated = [...animals, newAnimal];
    localStorage.setItem(KEYS.ANIMALS, JSON.stringify(updated));
    return newAnimal;
  },
  async updateAnimal(updatedAnimal: Animal): Promise<Animal> {
    const animals = await this.getAnimals();
    const index = animals.findIndex(a => a.id === updatedAnimal.id);
    if (index !== -1) {
      animals[index] = updatedAnimal;
      localStorage.setItem(KEYS.ANIMALS, JSON.stringify(animals));
      return updatedAnimal;
    }
    throw new Error("Animal not found");
  },
  async deleteAnimal(id: string): Promise<void> {
    const animals = await this.getAnimals();
    const updated = animals.filter(a => a.id !== id);
    localStorage.setItem(KEYS.ANIMALS, JSON.stringify(updated));
  },
  // Scout
  async getScoutHistory(): Promise<ScoutRecord[]> {
    const stored = localStorage.getItem(KEYS.SCOUT_HISTORY);
    return stored ? JSON.parse(stored) : [];
  },
  async addScoutRecord(record: Omit<ScoutRecord, 'id'>): Promise<ScoutRecord> {
    const history = await this.getScoutHistory();
    const newRecord = { ...record, id: Date.now().toString() };
    const updated = [newRecord, ...history].slice(0, 5);
    try {
        localStorage.setItem(KEYS.SCOUT_HISTORY, JSON.stringify(updated));
    } catch (e) { console.error("Quota exceeded"); }
    return newRecord;
  },
  async deleteScoutRecord(id: string): Promise<void> {
    const history = await this.getScoutHistory();
    const updated = history.filter(r => r.id !== id);
    localStorage.setItem(KEYS.SCOUT_HISTORY, JSON.stringify(updated));
  }
};

// --- Supabase Implementation ---
const supabaseBackend = {
  // Helpers
  mapUser(u: any): User {
      return {
          id: u.id,
          email: u.email,
          name: u.user_metadata?.name || u.email?.split('@')[0] || 'Farmer',
          plan: u.user_metadata?.plan || 'free'
      };
  },

  async login(email: string, password?: string): Promise<User> {
    if (!password) throw new Error("Password required for Supabase Auth");
    const { data, error } = await supabase!.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return this.mapUser(data.user);
  },

  async signup(email: string, password?: string, plan: 'free' | 'pro' = 'free'): Promise<User> {
    if (!password) throw new Error("Password required for Supabase Auth");
    const { data, error } = await supabase!.auth.signUp({ 
        email, 
        password,
        options: {
            data: {
                name: email.split('@')[0],
                plan: plan
            }
        }
    });
    if (error) throw error;
    if (!data.user) throw new Error("Signup failed. Please check your email for confirmation.");
    return this.mapUser(data.user);
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabase!.auth.updateUser({
        data: updates
    });
    if (error) throw error;
    return this.mapUser(data.user);
  },

  async updatePassword(password: string): Promise<void> {
    const { error } = await supabase!.auth.updateUser({ password: password });
    if (error) throw error;
  },

  async logout() { await supabase!.auth.signOut(); },
  
  async deleteAccount() {
      // NOTE: Supabase client cannot verify delete of the Auth user easily without an Edge Function or Service Key.
      // For this implementation, we will wipe the user's data rows.
      const userId = await this.getUserId();
      await supabase!.from('crops').delete().eq('userId', userId);
      await supabase!.from('animals').delete().eq('userId', userId);
      await supabase!.from('scout_history').delete().eq('userId', userId);
      await supabase!.auth.signOut();
  },

  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase!.auth.getUser();
    return data.user ? this.mapUser(data.user) : null;
  },

  async upgradePlan(userId: string): Promise<User> {
    // Update user metadata
    const { data, error } = await supabase!.auth.updateUser({
        data: { plan: 'pro' }
    });
    if (error) throw error;
    return this.mapUser(data.user);
  },

  async getUserId() {
     const { data } = await supabase!.auth.getUser();
     return data.user ? data.user.id : 'guest';
  },

  // Crops
  async getCrops(): Promise<Crop[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase!
      .from('crops')
      .select('*, history:field_records(*)')
      .eq('userId', userId);
    
    if (error) { console.error(error); return []; }
    return data || [];
  },

  async addCrop(crop: Omit<Crop, 'id'>): Promise<Crop> {
    const userId = await this.getUserId();
    const { history, ...cropData } = crop;
    
    // Insert Crop
    const { data: insertedCrop, error } = await supabase!
      .from('crops')
      .insert([{ ...cropData, userId }])
      .select()
      .single();
    
    if (error || !insertedCrop) throw new Error("Failed to add crop");

    // Insert History if any
    if (history && history.length > 0) {
      const historyWithId = history.map(h => ({ ...h, cropId: insertedCrop.id }));
      await supabase!.from('field_records').insert(historyWithId);
    }

    // Return full object
    return { ...insertedCrop, history: history || [] };
  },

  async updateCrop(updatedCrop: Crop): Promise<Crop> {
    const { history, ...cropData } = updatedCrop;
    
    // Update Crop Fields
    const { error } = await supabase!
        .from('crops')
        .update(cropData)
        .eq('id', updatedCrop.id);
    
    if (error) throw new Error("Failed to update crop");

    // Handle History (simplistic: delete all and re-insert for full sync)
    await supabase!.from('field_records').delete().eq('cropId', updatedCrop.id);
    
    // 2. Insert current
    if (history.length > 0) {
        const historyWithId = history.map(h => {
             const { id, ...rest } = h; 
             return { ...rest, cropId: updatedCrop.id };
        });
        await supabase!.from('field_records').insert(historyWithId);
    }

    return updatedCrop;
  },

  async deleteCrop(id: string): Promise<void> {
    await supabase!.from('crops').delete().eq('id', id);
  },

  // Animals
  async getAnimals(): Promise<Animal[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase!
      .from('animals')
      .select('*, medicalHistory:medical_records(*)')
      .eq('userId', userId);
      
    if (error) { console.error(error); return []; }
    return data || [];
  },

  async addAnimal(animal: Omit<Animal, 'id'>): Promise<Animal> {
    const userId = await this.getUserId();
    const { medicalHistory, ...animalData } = animal;

    const { data: insertedAnimal, error } = await supabase!
      .from('animals')
      .insert([{ ...animalData, userId }])
      .select()
      .single();

    if (error || !insertedAnimal) throw new Error("Failed to add animal");

    if (medicalHistory && medicalHistory.length > 0) {
       const historyWithId = medicalHistory.map(h => ({ ...h, animalId: insertedAnimal.id }));
       await supabase!.from('medical_records').insert(historyWithId);
    }

    return { ...insertedAnimal, medicalHistory: medicalHistory || [] };
  },

  async updateAnimal(updatedAnimal: Animal): Promise<Animal> {
    const { medicalHistory, ...animalData } = updatedAnimal;
    
    const { error } = await supabase!
        .from('animals')
        .update(animalData)
        .eq('id', updatedAnimal.id);
    
    if (error) throw new Error("Failed to update animal");

    await supabase!.from('medical_records').delete().eq('animalId', updatedAnimal.id);
    
    if (medicalHistory.length > 0) {
        const historyWithId = medicalHistory.map(h => {
            const { id, ...rest } = h;
            return { ...rest, animalId: updatedAnimal.id };
        });
        await supabase!.from('medical_records').insert(historyWithId);
    }

    return updatedAnimal;
  },

  async deleteAnimal(id: string): Promise<void> {
    await supabase!.from('animals').delete().eq('id', id);
  },

  // Scout History
  async getScoutHistory(): Promise<ScoutRecord[]> {
    const userId = await this.getUserId();
    const { data, error } = await supabase!
      .from('scout_history')
      .select('*')
      .eq('userId', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  },

  async addScoutRecord(record: Omit<ScoutRecord, 'id'>): Promise<ScoutRecord> {
    const userId = await this.getUserId();
    const { data, error } = await supabase!
        .from('scout_history')
        .insert([{ ...record, userId }])
        .select()
        .single();
    
    if (error || !data) throw new Error("Failed to save scout record");
    return data;
  },

  async deleteScoutRecord(id: string): Promise<void> {
    await supabase!.from('scout_history').delete().eq('id', id);
  }
};

const isSupabaseConfigured = !!supabase;
export const backend = isSupabaseConfigured ? supabaseBackend : localBackend;