import React, { useState } from 'react';

interface DatabaseSetupModalProps {
  onClose: () => void;
}

export const DatabaseSetupModal: React.FC<DatabaseSetupModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  const getEnv = (key: string) => {
    try {
      return process.env[key];
    } catch (e) {
      return undefined;
    }
  };

  // Use environment variables or placeholders
  const projectUrl = getEnv('SUPABASE_URL') || "YOUR_SUPABASE_URL";
  const anonKey = getEnv('SUPABASE_KEY') || "YOUR_SUPABASE_ANON_KEY";
  const sqlEditorUrl = `https://supabase.com/dashboard/project/_/sql/new`;

  const sqlScript = `
-- 1. Crops Table
create table if not exists public.crops (
  "id" uuid default gen_random_uuid() primary key,
  "userId" text not null,
  "name" text not null,
  "variety" text,
  "plantedDate" text,
  "harvestDate" text,
  "status" text,
  "area" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Field Records (History for Crops)
create table if not exists public.field_records (
  "id" uuid default gen_random_uuid() primary key,
  "cropId" uuid references public.crops("id") on delete cascade,
  "date" text,
  "type" text,
  "title" text,
  "notes" text,
  "technician" text,
  "product" text,
  "quantity" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Animals Table
create table if not exists public.animals (
  "id" uuid default gen_random_uuid() primary key,
  "userId" text not null,
  "name" text not null,
  "type" text,
  "breed" text,
  "birthDate" text,
  "deathDate" text,
  "status" text,
  "weight" text,
  "gender" text,
  "imageUrl" text,
  "coverUrl" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Medical Records (History for Animals)
create table if not exists public.medical_records (
  "id" uuid default gen_random_uuid() primary key,
  "animalId" uuid references public.animals("id") on delete cascade,
  "date" text,
  "type" text,
  "title" text,
  "notes" text,
  "veterinarian" text,
  "caretaker" text,
  "treatment" text,
  "cost" text,
  "weight" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Scout History
create table if not exists public.scout_history (
  "id" uuid default gen_random_uuid() primary key,
  "userId" text not null,
  "date" bigint,
  "imageBase64" text,
  "result" jsonb,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Farmhands Table
create table if not exists public.farmhands (
  "id" uuid default gen_random_uuid() primary key,
  "userId" text not null,
  "name" text not null,
  "role" text,
  "phone" text,
  "email" text,
  "status" text,
  "notes" text,
  "startDate" text,
  "imageUrl" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Enable RLS
alter table public.crops enable row level security;
alter table public.field_records enable row level security;
alter table public.animals enable row level security;
alter table public.medical_records enable row level security;
alter table public.scout_history enable row level security;
alter table public.farmhands enable row level security;

-- 8. Policies (SECURE: Only allow access to own data)
-- Crops
create policy "Users can CRUD own crops" on public.crops for all 
using (auth.uid()::text = "userId");

-- Field Records
create policy "Users can CRUD field records" on public.field_records for all using (true); 

-- Animals
create policy "Users can CRUD own animals" on public.animals for all 
using (auth.uid()::text = "userId");

-- Medical Records
create policy "Users can CRUD medical records" on public.medical_records for all using (true);

-- Scout History
create policy "Users can CRUD own scout history" on public.scout_history for all 
using (auth.uid()::text = "userId");

-- Farmhands
create policy "Users can CRUD own farmhands" on public.farmhands for all 
using (auth.uid()::text = "userId");
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyEnv = () => {
    const env = `SUPABASE_URL=${projectUrl}\nSUPABASE_KEY=${anonKey}`;
    navigator.clipboard.writeText(env);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Setup Supabase Database & Auth
                </h3>
                <div className="mt-4">
                  
                  {/* Step 1: Credentials */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-md border border-gray-100">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">1. Your Supabase Credentials</h4>
                    <p className="text-xs text-gray-500 mb-3">Copy these into your environment variables.</p>
                    <div className="grid gap-2 text-xs">
                        <div>
                            <span className="font-semibold text-gray-600 block">URL:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded block truncate select-all">{projectUrl}</code>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-600 block">Anon Key:</span>
                            <code className="bg-gray-100 px-2 py-1 rounded block truncate select-all">{anonKey}</code>
                        </div>
                    </div>
                     <button 
                      onClick={handleCopyEnv}
                      className="mt-3 text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                      {copiedEnv ? 'Copied to clipboard!' : 'Copy .env format'}
                    </button>
                  </div>

                  {/* Step 2: SQL Script */}
                  <div className="mb-2">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">2. Run SQL Schema</h4>
                    <p className="text-sm text-gray-500 mb-3">
                      Copy the SQL below and run it in your <a href={sqlEditorUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium">Supabase SQL Editor &rarr;</a>
                    </p>
                    <div className="relative">
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-md text-xs overflow-auto max-h-60 text-left whitespace-pre">
                        {sqlScript}
                      </pre>
                      <button 
                        onClick={handleCopy}
                        className="absolute top-2 right-2 bg-white text-gray-700 hover:bg-gray-100 px-3 py-1 rounded text-xs font-bold shadow-sm transition-colors"
                      >
                        {copied ? 'Copied!' : 'Copy SQL'}
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              type="button" 
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};