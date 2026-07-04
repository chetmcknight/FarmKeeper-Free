import { User, Crop, Animal, ScoutRecord, Farmhand } from '../types';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';

function getConfig() {
  let sheetId = localStorage.getItem('gs_sheet_id');
  let apiKey = localStorage.getItem('gs_api_key');
  let scriptUrl = localStorage.getItem('gs_script_url');

  if (!sheetId || !apiKey || !scriptUrl) {
    sheetId = sheetId || import.meta.env.VITE_GS_SHEET_ID || '';
    apiKey = apiKey || import.meta.env.VITE_GS_API_KEY || '';
    scriptUrl = scriptUrl || import.meta.env.VITE_GS_SCRIPT_URL || '';
    if (sheetId && apiKey && scriptUrl) {
      localStorage.setItem('gs_sheet_id', sheetId);
      localStorage.setItem('gs_api_key', apiKey);
      localStorage.setItem('gs_script_url', scriptUrl);
    }
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

  // Use POST with JSON body for reliable data transfer
  const url = scriptUrl + '?_=' + Date.now();

  const res = await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  // With no-cors, response is opaque — we can't read headers or body.
  // If no-cors fails, try GET with query params as fallback.
  if (res.type === 'opaque') {
    return await scriptPostGetFallback(body);
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('json')) {
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Google Sheets sync error');
    return data;
  }

  // If not JSON, try GET fallback
  return await scriptPostGetFallback(body);
}

// Fallback: send data via GET query params (works even with CORS restrictions)
async function scriptPostGetFallback(body: Record<string, any>): Promise<any> {
  const { scriptUrl } = getConfig();
  const params = new URLSearchParams();
  for (const [key, val] of Object.entries(body)) {
    params.set(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
  }
  const url = scriptUrl + '?' + params.toString();

  const res = await fetch(url);
  const text = await res.text();
  const ct = res.headers.get('content-type') || '';

  if (ct.includes('json')) {
    try {
      const data = JSON.parse(text);
      if (!data.success) throw new Error(data.error || 'Google Sheets sync error');
      return data;
    } catch (e) {
      throw new Error('Invalid JSON response from sync server');
    }
  }

  // Try to parse as JSON anyway — some servers return json without proper content-type
  try {
    const data = JSON.parse(text);
    if (data.success) return data;
    throw new Error(data.error || 'Google Sheets sync error');
  } catch {
    throw new Error('Sync server returned non-JSON. Check deployment and sheet access.');
  }
}

const USERS_COLS = ['id', 'email', 'name', 'imageUrl'];
const CROPS_COLS = ['id', 'name', 'variety', 'plantedDate', 'harvestDate', 'status', 'area', 'imageUrl', 'coverUrl', 'history_json'];
const ANIMALS_COLS = ['id', 'name', 'type', 'breed', 'birthDate', 'deathDate', 'status', 'weight', 'gender', 'imageUrl', 'coverUrl', 'medicalHistory_json'];
const FARMHANDS_COLS = ['id', 'name', 'role', 'phone', 'email', 'status', 'notes', 'startDate', 'imageUrl', 'coverUrl'];
const SCOUT_COLS = ['id', 'date', 'imageBase64', 'result_json'];

const USERS_RANGE = 'Users!A:Z';
const CROPS_RANGE = 'Crops!A:Z';
const ANIMALS_RANGE = 'Animals!A:Z';
const FARMHANDS_RANGE = 'Farmhands!A:Z';
const SCOUT_RANGE = 'ScoutHistory!A:Z';
const KNOWLEDGE_RANGE = 'KnowledgeBase!A:C';

function cropFromRow(row: string[]): Crop | null {
  const id = row[0] || '';
  if (!id) return null;
  return {
    id,
    userId: '',
    name: row[1] || '',
    variety: row[2] || '',
    plantedDate: row[3] || '',
    harvestDate: row[4] || '',
    status: (row[5] || 'Healthy') as Crop['status'],
    area: row[6] || '',
    imageUrl: row[7] || undefined,
    coverUrl: row[8] || undefined,
    history: row[9] ? JSON.parse(row[9]) : [],
  };
}

function animalFromRow(row: string[]): Animal | null {
  const id = row[0] || '';
  if (!id) return null;
  return {
    id,
    userId: '',
    name: row[1] || '',
    type: row[2] || '',
    breed: row[3] || '',
    birthDate: row[4] || '',
    deathDate: row[5] || undefined,
    status: (row[6] || 'Healthy') as Animal['status'],
    weight: row[7] || '',
    gender: (row[8] || 'Female') as 'Male' | 'Female',
    imageUrl: row[9] || undefined,
    coverUrl: row[10] || undefined,
    medicalHistory: row[11] ? JSON.parse(row[11]) : [],
  };
}

function farmhandFromRow(row: string[]): Farmhand | null {
  const id = row[0] || '';
  if (!id) return null;
  return {
    id,
    userId: '',
    name: row[1] || '',
    role: row[2] || '',
    phone: row[3] || '',
    email: row[4] || '',
    status: (row[5] || 'Active') as Farmhand['status'],
    notes: row[6] || '',
    startDate: row[7] || '',
    imageUrl: row[8] || undefined,
    coverUrl: row[9] || undefined,
  };
}

function scoutFromRow(row: string[]): ScoutRecord | null {
  const id = row[0] || '';
  if (!id) return null;
  return {
    id,
    userId: '',
    date: parseInt(row[1] || '0', 10),
    imageBase64: row[2] || '',
    result: row[3] ? JSON.parse(row[3]) : { diseaseName: '', confidence: '', description: '', treatment: [] },
  };
}

const IMAGE_FIELDS = new Set(['imageUrl', 'coverUrl', 'imageBase64']);

function stripImages(payload: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(payload)) {
    if (!IMAGE_FIELDS.has(key)) cleaned[key] = val;
  }
  return cleaned;
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
    const rows = await readRange(CROPS_RANGE);
    return rows.slice(1).map(cropFromRow).filter((c): c is Crop => c !== null);
  },

  async addCrop(crop: Omit<Crop, 'id' | 'userId'>): Promise<Crop> {
    const newCrop: Crop = { ...crop, id: (crop as any).id || Date.now().toString(), userId: '' };
    const payload = Object.fromEntries(CROPS_COLS.map(col => [col, col === 'history_json' ? JSON.stringify(newCrop.history) : (newCrop as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'append', entity: 'crop', ...stripImages(payload) });
    return newCrop;
  },

  async updateCrop(updated: Crop): Promise<Crop> {
    const payload = Object.fromEntries(CROPS_COLS.map(col => [col, col === 'history_json' ? JSON.stringify(updated.history) : (updated as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'update', entity: 'crop', ...stripImages(payload) });
    return updated;
  },

  async deleteCrop(id: string): Promise<void> {
    await scriptPost({ action: 'delete', entity: 'crop', id });
  },

  // Animals
  async getAnimals(): Promise<Animal[]> {
    const rows = await readRange(ANIMALS_RANGE);
    return rows.slice(1).map(animalFromRow).filter((a): a is Animal => a !== null);
  },

  async addAnimal(animal: Omit<Animal, 'id' | 'userId'>): Promise<Animal> {
    const newAnimal: Animal = { ...animal, id: (animal as any).id || Date.now().toString(), userId: '' };
    const payload = Object.fromEntries(ANIMALS_COLS.map(col => [col, col === 'medicalHistory_json' ? JSON.stringify(newAnimal.medicalHistory) : (newAnimal as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'append', entity: 'animal', ...stripImages(payload) });
    return newAnimal;
  },

  async updateAnimal(updated: Animal): Promise<Animal> {
    const payload = Object.fromEntries(ANIMALS_COLS.map(col => [col, col === 'medicalHistory_json' ? JSON.stringify(updated.medicalHistory) : (updated as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'update', entity: 'animal', ...stripImages(payload) });
    return updated;
  },

  async deleteAnimal(id: string): Promise<void> {
    await scriptPost({ action: 'delete', entity: 'animal', id });
  },

  // Farmhands
  async getFarmhands(): Promise<Farmhand[]> {
    const rows = await readRange(FARMHANDS_RANGE);
    return rows.slice(1).map(farmhandFromRow).filter((f): f is Farmhand => f !== null);
  },

  async addFarmhand(farmhand: Omit<Farmhand, 'id' | 'userId'>): Promise<Farmhand> {
    const newHand: Farmhand = { ...farmhand, id: (farmhand as any).id || Date.now().toString(), userId: '' };
    const payload = Object.fromEntries(FARMHANDS_COLS.map(col => [col, (newHand as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'append', entity: 'farmhand', ...stripImages(payload) });
    return newHand;
  },

  async updateFarmhand(updated: Farmhand): Promise<Farmhand> {
    const payload = Object.fromEntries(FARMHANDS_COLS.map(col => [col, (updated as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'update', entity: 'farmhand', ...stripImages(payload) });
    return updated;
  },

  async deleteFarmhand(id: string): Promise<void> {
    await scriptPost({ action: 'delete', entity: 'farmhand', id });
  },

  // Scout
  async getScoutHistory(): Promise<ScoutRecord[]> {
    const rows = await readRange(SCOUT_RANGE);
    return rows.slice(1).map(scoutFromRow).filter((s): s is ScoutRecord => s !== null);
  },

  async addScoutRecord(record: Omit<ScoutRecord, 'id' | 'userId'>): Promise<ScoutRecord> {
    const newRecord: ScoutRecord = { ...record, id: (record as any).id || Date.now().toString(), userId: '' };
    const payload = Object.fromEntries(SCOUT_COLS.map(col => [col, col === 'result_json' ? JSON.stringify(newRecord.result) : (newRecord as Record<string, any>)[col] || '']));
    await scriptPost({ action: 'append', entity: 'scout', ...stripImages(payload) });
    return newRecord;
  },

  async deleteScoutRecord(id: string): Promise<void> {
    await scriptPost({ action: 'delete', entity: 'scout', id });
  },

  // Knowledge Base
  async getKnowledgeBase(): Promise<string> {
    const rows = await readRange(KNOWLEDGE_RANGE);
    if (rows.length < 2) return '';
    const header = rows[0];
    const topicIdx = header.findIndex(h => h.toLowerCase().includes('topic') || h.toLowerCase().includes('title'));
    const contentIdx = header.findIndex(h => h.toLowerCase().includes('content') || h.toLowerCase().includes('answer'));
    const tagsIdx = header.findIndex(h => h.toLowerCase().includes('tag') || h.toLowerCase().includes('category'));

    const entries: string[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const topic = (topicIdx >= 0 ? row[topicIdx] : row[0] || '').trim();
      const content = (contentIdx >= 0 ? row[contentIdx] : row[1] || '').trim();
      const tags = tagsIdx >= 0 ? row[tagsIdx]?.trim() : '';
      if (!topic && !content) continue;
      const tagStr = tags ? ` (${tags})` : '';
      entries.push(`### ${topic}${tagStr}\n${content}`);
    }
    return entries.join('\n\n');
  },
};
