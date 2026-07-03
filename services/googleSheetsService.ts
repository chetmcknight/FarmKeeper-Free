import { User, Crop, Animal, ScoutRecord, Farmhand } from '../types';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

function getConfig() {
  let sheetId = localStorage.getItem('gs_sheet_id');
  let apiKey = localStorage.getItem('gs_api_key');
  let scriptUrl = localStorage.getItem('gs_script_url');

  if (!sheetId || !apiKey || !scriptUrl) {
    try {
      const env = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
      sheetId = sheetId || env.VITE_GS_SHEET_ID || '';
      apiKey = apiKey || env.VITE_GS_API_KEY || '';
      scriptUrl = scriptUrl || env.VITE_GS_SCRIPT_URL || '';
      if (sheetId && apiKey && scriptUrl) {
        localStorage.setItem('gs_sheet_id', sheetId);
        localStorage.setItem('gs_api_key', apiKey);
        localStorage.setItem('gs_script_url', scriptUrl);
      }
    } catch {}
  }

  return { sheetId: sheetId || '', apiKey: apiKey || '', scriptUrl: scriptUrl || '' };
}

async function readRange(range: string): Promise<string[][]> {
  const { sheetId, apiKey } = getConfig();
  if (!sheetId || !apiKey) throw new Error('Google Sheets not configured');

  const url = `${SHEETS_API}/${sheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to read sheet: ${res.statusText}`);
  const data = await res.json();
  return data.values || [];
}

async function scriptPost(body: Record<string, any>): Promise<any> {
  const { scriptUrl } = getConfig();
  if (!scriptUrl) throw new Error('Google Sheets sync not configured. Set VITE_GS_SCRIPT_URL.');

  // Use GET with query params to avoid CORS issues with Apps Script
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(body)) {
    params.set(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
  }
  const url = scriptUrl + '?' + params.toString();

  const res = await fetch(url);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('json')) {
    const text = await res.text();
    throw new Error('Sync server returned an error. Check that your Apps Script is deployed and set to "Anyone" access.');
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Google Sheets sync error');
  return data;
}

const USERS_COLS = ['id', 'email', 'name', 'imageUrl'];
const CROPS_COLS = ['id', 'userId', 'name', 'variety', 'plantedDate', 'harvestDate', 'status', 'area', 'imageUrl', 'coverUrl', 'history_json'];
const ANIMALS_COLS = ['id', 'userId', 'name', 'type', 'breed', 'birthDate', 'deathDate', 'status', 'weight', 'gender', 'imageUrl', 'coverUrl', 'medicalHistory_json'];
const FARMHANDS_COLS = ['id', 'userId', 'name', 'role', 'phone', 'email', 'status', 'notes', 'startDate', 'imageUrl', 'coverUrl'];
const SCOUT_COLS = ['id', 'userId', 'date', 'imageBase64', 'result_json'];

const USERS_RANGE = 'Users!A:Z';
const CROPS_RANGE = 'Crops!A:Z';
const ANIMALS_RANGE = 'Animals!A:Z';
const FARMHANDS_RANGE = 'Farmhands!A:Z';
const SCOUT_RANGE = 'ScoutHistory!A:Z';

function cropFromRow(row: string[]): Crop | null {
  const id = row[0] || '';
  if (!id) return null;
  return {
    id,
    userId: row[1] || '',
    name: row[2] || '',
    variety: row[3] || '',
    plantedDate: row[4] || '',
    harvestDate: row[5] || '',
    status: (row[6] || 'Healthy') as Crop['status'],
    area: row[7] || '',
    imageUrl: row[8] || undefined,
    coverUrl: row[9] || undefined,
    history: row[10] ? JSON.parse(row[10]) : [],
  };
}

function animalFromRow(row: string[]): Animal | null {
  const id = row[0] || '';
  if (!id) return null;
  return {
    id,
    userId: row[1] || '',
    name: row[2] || '',
    type: row[3] || '',
    breed: row[4] || '',
    birthDate: row[5] || '',
    deathDate: row[6] || undefined,
    status: (row[7] || 'Healthy') as Animal['status'],
    weight: row[8] || '',
    gender: (row[9] || 'Female') as 'Male' | 'Female',
    imageUrl: row[10] || undefined,
    coverUrl: row[11] || undefined,
    medicalHistory: row[12] ? JSON.parse(row[12]) : [],
  };
}

function farmhandFromRow(row: string[]): Farmhand | null {
  const id = row[0] || '';
  if (!id) return null;
  return {
    id,
    userId: row[1] || '',
    name: row[2] || '',
    role: row[3] || '',
    phone: row[4] || '',
    email: row[5] || '',
    status: (row[6] || 'Active') as Farmhand['status'],
    notes: row[7] || '',
    startDate: row[8] || '',
    imageUrl: row[9] || undefined,
    coverUrl: row[10] || undefined,
  };
}

function scoutFromRow(row: string[]): ScoutRecord | null {
  const id = row[0] || '';
  if (!id) return null;
  return {
    id,
    userId: row[1] || '',
    date: parseInt(row[2] || '0', 10),
    imageBase64: row[3] || '',
    result: row[4] ? JSON.parse(row[4]) : { diseaseName: '', confidence: '', description: '', treatment: [] },
  };
}

function toSheetRow(obj: Record<string, any>, columns: string[]): string[] {
  return columns.map(col => {
    const val = obj[col];
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  });
}

function userFromRow(row: string[]): User | null {
  const id = row[0] || '';
  if (!id) return null;
  return {
    id,
    email: row[1] || '',
    name: row[2] || '',
    imageUrl: row[3] || undefined,
  };
}

function currentUserId(): string {
  const stored = localStorage.getItem('farmhand_user');
  if (!stored) return '';
  try { return JSON.parse(stored).id || ''; } catch { return ''; }
}

export const sheetsBackend = {
  async login(email: string, _password?: string): Promise<User> {
    const rows = await readRange(USERS_RANGE);
    const users = rows.slice(1).map(userFromRow).filter((u): u is User => u !== null);
    const found = users.find(u => u.email === email);
    if (!found) throw new Error('No account found with that email. Please sign up first.');
    localStorage.setItem('farmhand_user', JSON.stringify(found));
    return found;
  },

  async signup(email: string, _password?: string): Promise<User> {
    const rows = await readRange(USERS_RANGE);
    const users = rows.slice(1).map(userFromRow).filter((u): u is User => u !== null);
    if (users.some(u => u.email === email)) throw new Error('Account already exists. Please log in.');

    const newUser: User = {
      id: 'u_' + Math.random().toString(36).substr(2, 9),
      email,
      name: email.split('@')[0],
    };
    const payload = Object.fromEntries(USERS_COLS.map(col => [col, (newUser as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'append', entity: 'user', ...payload });
    localStorage.setItem('farmhand_user', JSON.stringify(newUser));
    return newUser;
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const stored = localStorage.getItem('farmhand_user');
    const current = stored ? JSON.parse(stored) : {};
    const merged = { ...current, ...updates };
    await scriptPost({ action: 'update', entity: 'user', id, ...merged });
    localStorage.setItem('farmhand_user', JSON.stringify(merged));
    return merged as User;
  },

  async updatePassword(_password: string): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, 500));
  },

  async logout() {
    localStorage.removeItem('farmhand_user');
  },

  async deleteAccount() {
    localStorage.removeItem('farmhand_user');
  },

  async getCurrentUser(): Promise<User | null> {
    const stored = localStorage.getItem('farmhand_user');
    return stored ? JSON.parse(stored) : null;
  },

  // Crops
  async getCrops(): Promise<Crop[]> {
    const uid = currentUserId();
    const rows = await readRange(CROPS_RANGE);
    return rows.slice(1).map(cropFromRow).filter((c): c is Crop => c !== null && (!c.userId || c.userId === uid));
  },

  async addCrop(crop: Omit<Crop, 'id' | 'userId'>): Promise<Crop> {
    const newCrop: Crop = { ...crop, id: Date.now().toString(), userId: currentUserId() };
    const payload = Object.fromEntries(CROPS_COLS.map(col => [col, col === 'history_json' ? JSON.stringify(newCrop.history) : (newCrop as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'append', entity: 'crop', ...payload });
    return newCrop;
  },

  async updateCrop(updated: Crop): Promise<Crop> {
    const payload = Object.fromEntries(CROPS_COLS.map(col => [col, col === 'history_json' ? JSON.stringify(updated.history) : (updated as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'update', entity: 'crop', ...payload });
    return updated;
  },

  async deleteCrop(id: string): Promise<void> {
    await scriptPost({ action: 'delete', entity: 'crop', id });
  },

  // Animals
  async getAnimals(): Promise<Animal[]> {
    const uid = currentUserId();
    const rows = await readRange(ANIMALS_RANGE);
    return rows.slice(1).map(animalFromRow).filter((a): a is Animal => a !== null && (!a.userId || a.userId === uid));
  },

  async addAnimal(animal: Omit<Animal, 'id' | 'userId'>): Promise<Animal> {
    const newAnimal: Animal = { ...animal, id: Date.now().toString(), userId: currentUserId() };
    const payload = Object.fromEntries(ANIMALS_COLS.map(col => [col, col === 'medicalHistory_json' ? JSON.stringify(newAnimal.medicalHistory) : (newAnimal as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'append', entity: 'animal', ...payload });
    return newAnimal;
  },

  async updateAnimal(updated: Animal): Promise<Animal> {
    const payload = Object.fromEntries(ANIMALS_COLS.map(col => [col, col === 'medicalHistory_json' ? JSON.stringify(updated.medicalHistory) : (updated as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'update', entity: 'animal', ...payload });
    return updated;
  },

  async deleteAnimal(id: string): Promise<void> {
    await scriptPost({ action: 'delete', entity: 'animal', id });
  },

  // Farmhands
  async getFarmhands(): Promise<Farmhand[]> {
    const uid = currentUserId();
    const rows = await readRange(FARMHANDS_RANGE);
    return rows.slice(1).map(farmhandFromRow).filter((f): f is Farmhand => f !== null && (!f.userId || f.userId === uid));
  },

  async addFarmhand(farmhand: Omit<Farmhand, 'id' | 'userId'>): Promise<Farmhand> {
    const newHand: Farmhand = { ...farmhand, id: Date.now().toString(), userId: currentUserId() };
    const payload = Object.fromEntries(FARMHANDS_COLS.map(col => [col, (newHand as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'append', entity: 'farmhand', ...payload });
    return newHand;
  },

  async updateFarmhand(updated: Farmhand): Promise<Farmhand> {
    const payload = Object.fromEntries(FARMHANDS_COLS.map(col => [col, (updated as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'update', entity: 'farmhand', ...payload });
    return updated;
  },

  async deleteFarmhand(id: string): Promise<void> {
    await scriptPost({ action: 'delete', entity: 'farmhand', id });
  },

  // Scout
  async getScoutHistory(): Promise<ScoutRecord[]> {
    const uid = currentUserId();
    const rows = await readRange(SCOUT_RANGE);
    return rows.slice(1).map(scoutFromRow).filter((s): s is ScoutRecord => s !== null && (!s.userId || s.userId === uid));
  },

  async addScoutRecord(record: Omit<ScoutRecord, 'id' | 'userId'>): Promise<ScoutRecord> {
    const newRecord: ScoutRecord = { ...record, id: Date.now().toString(), userId: currentUserId() };
    const payload = Object.fromEntries(SCOUT_COLS.map(col => [col, col === 'result_json' ? JSON.stringify(newRecord.result) : (newRecord as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'append', entity: 'scout', ...payload });
    return newRecord;
  },

  async deleteScoutRecord(id: string): Promise<void> {
    await scriptPost({ action: 'delete', entity: 'scout', id });
  },
};
