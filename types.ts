
export enum Page {
  DASHBOARD = 'DASHBOARD',
  SCOUT = 'SCOUT',
  CROPS = 'CROPS',
  ANIMALS = 'ANIMALS',
  FARMHANDS = 'FARMHANDS',
  ADVISOR = 'ADVISOR',
  SETTINGS = 'SETTINGS',
}

export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl?: string;
}

export interface FieldRecord {
  id: string;
  date: string;
  type: 'Planting' | 'Fertilizer' | 'Spraying' | 'Irrigation' | 'Scouting' | 'Harvest' | 'Note';
  title: string;
  notes: string;
  technician?: string;
  product?: string; // Name of seed, chemical, or fertilizer
  quantity?: string; // Amount applied or yield harvested
}

export interface Crop {
  id: string;
  userId: string;
  name: string;
  variety: string;
  plantedDate: string;
  harvestDate: string;
  status: 'Healthy' | 'Needs Attention' | 'Harvest Ready' | 'Harvested';
  area: string;
  history: FieldRecord[];
  imageUrl?: string;
  coverUrl?: string;
}

export interface MedicalRecord {
  id: string;
  date: string;
  type: 'Vaccination' | 'Illness' | 'Injury' | 'Checkup' | 'Surgery' | 'General';
  title: string;
  notes: string;
  veterinarian?: string;
  caretaker?: string;
  treatment?: string;
  cost?: string;
  weight?: string;
}

export interface Animal {
  id: string;
  userId: string;
  name: string;
  type: string;
  breed: string;
  birthDate: string; // ISO Date string
  deathDate?: string; // ISO Date string
  status: 'Healthy' | 'Sick' | 'Vet Check Required' | 'Pregnant' | 'Lactating' | 'Deceased';
  weight: string;
  gender: 'Male' | 'Female';
  medicalHistory: MedicalRecord[];
  imageUrl?: string;
  coverUrl?: string;
}

export interface Farmhand {
  id: string;
  userId: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: 'Active' | 'Seasonal' | 'Inactive';
  notes: string;
  startDate: string;
  imageUrl?: string;
  coverUrl?: string;
}

export interface Task {
  id: string;
  title: string;
  status: 'Pending' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
  timestamp: number;
  sources?: Array<{
    title?: string;
    uri: string;
  }>;
}

export interface DiagnosisResult {
  diseaseName: string;
  confidence: string;
  description: string;
  treatment: string[];
}

export interface ScoutRecord {
  id: string;
  userId: string;
  date: number;
  imageBase64: string;
  result: DiagnosisResult;
}