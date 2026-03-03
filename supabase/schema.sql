-- 1. Crops Table
create table if not exists public.crops (
  "id" uuid default gen_random_uuid() primary key,
  "userId" text not null, -- Stores the auth ID
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
  "imageUrl" text, -- Storing base64 text for demo simplicity (use Storage buckets for prod)
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
  "date" bigint, -- Storing timestamp as number/bigint
  "imageBase64" text,
  "result" jsonb, -- Storing the JSON diagnosis result
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

-- 7. Enable RLS (Recommended for prod)
alter table public.crops enable row level security;
alter table public.field_records enable row level security;
alter table public.animals enable row level security;
alter table public.medical_records enable row level security;
alter table public.scout_history enable row level security;
alter table public.farmhands enable row level security;

-- Policy example (Open for all for prototype if userId matches)
-- In a real app, ensure you add "using (auth.uid()::text = userId)"
create policy "Enable all access for users" on public.crops for all using (true);
create policy "Enable all access for users" on public.field_records for all using (true);
create policy "Enable all access for users" on public.animals for all using (true);
create policy "Enable all access for users" on public.medical_records for all using (true);
create policy "Enable all access for users" on public.scout_history for all using (true);
create policy "Enable all access for users" on public.farmhands for all using (true);
