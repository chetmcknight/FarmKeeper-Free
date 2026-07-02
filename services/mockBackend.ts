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
  // Farmhands
  async getFarmhands(): Promise<Farmhand[]> {
    const stored = localStorage.getItem(KEYS.FARMHANDS);
    return stored ? JSON.parse(stored) : [];
  },
  async addFarmhand(farmhand: Omit<Farmhand, 'id'>): Promise<Farmhand> {
    const hands = await this.getFarmhands();
    const newHand: Farmhand = { ...farmhand, id: Date.now().toString() };
    const updated = [...hands, newHand];
    localStorage.setItem(KEYS.FARMHANDS, JSON.stringify(updated));
    return newHand;
  },
  async updateFarmhand(updatedHand: Farmhand): Promise<Farmhand> {
    const hands = await this.getFarmhands();
    const index = hands.findIndex(h => h.id === updatedHand.id);
    if (index !== -1) {
      hands[index] = updatedHand;
      localStorage.setItem(KEYS.FARMHANDS, JSON.stringify(hands));
      return updatedHand;
    }
    throw new Error("Farmhand not found");
  },
  async deleteFarmhand(id: string): Promise<void> {
    const hands = await this.getFarmhands();
    const updated = hands.filter(h => h.id !== id);
    localStorage.setItem(KEYS.FARMHANDS, JSON.stringify(updated));
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
    localStorage.setItem(KEYS.SCOUT_HISTORY, JSON.stringify(updated));
    return newRecord;
  },
  async deleteScoutRecord(id: string): Promise<void> {
    const history = await this.getScoutHistory();
    const updated = history.filter(r => r.id !== id);
    localStorage.setItem(KEYS.SCOUT_HISTORY, JSON.stringify(updated));
  }
};

const isSheetsConfigured = !!(typeof window !== 'undefined' && localStorage.getItem('gs_sheet_id') && localStorage.getItem('gs_api_key'));

export const backend = isSheetsConfigured ? sheetsBackend : localBackend;
