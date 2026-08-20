--
-- 20260101_initial_schema.sql
-- Base schema for MooveFretes, reverse-engineered from the app's Supabase
-- queries (src/**) since the original table-creation SQL was never
-- committed as a migration. Dated before the existing 20260427_* migrations
-- so it runs first and they can layer their ALTER TABLE / trigger / RLS
-- changes on top exactly as they were written.
--

create extension if not exists pgcrypto;

-- =========================================================================
-- profiles — one row per auth.users, shared by all user types
-- =========================================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_type text not null,
  name text not null,
  email text not null,
  phone text,
  avatar_url text,
  rating numeric,
  total_freights integer default 0,
  completed_freights integer default 0,
  is_online boolean default false,
  last_seen timestamptz,
  total_ratings integer default 0,
  total_distance_km numeric,
  total_earnings numeric,
  push_token text,
  city text,
  state text,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- companies
-- =========================================================================
create table companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text not null,
  company_type text not null,
  cnpj text,
  phone text,
  email text,
  logo text,
  address jsonb,
  verified boolean not null default false,
  description text,
  website text,
  rating numeric,
  active_freights integer default 0,
  completed_freights integer default 0,
  review_count integer default 0,
  created_at timestamptz not null default now()
);
create index companies_user_id_idx on companies(user_id);

-- =========================================================================
-- drivers
-- =========================================================================
create table drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  cpf text,
  cnh text,
  cnh_category text,
  cnh_expiry date,
  rntrc text,
  profile_image text,
  rating numeric default 0,
  completed_trips integer default 0,
  vehicle_type text,
  vehicle_plate text,
  vehicle_model text,
  vehicle_year text,
  vehicle_capacity numeric,
  vehicle_types text[],
  body_types text[],
  current_location jsonb,
  available boolean default true,
  availability_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index drivers_user_id_idx on drivers(user_id);
create index drivers_available_idx on drivers(available);

-- =========================================================================
-- freights
-- =========================================================================
create table freights (
  id uuid primary key default gen_random_uuid(),
  title text,
  freight_code text,
  description text,
  status text not null default 'draft',
  origin_city text,
  origin_state text,
  origin_address text,
  destination_city text,
  destination_state text,
  destination_address text,
  cargo_type text,
  weight_kg numeric,
  vehicle_types text[],
  body_types text[],
  value_estimate numeric,
  distance_km numeric,
  pickup_date timestamptz,
  delivery_date timestamptz,
  deadline_date timestamptz,
  scheduled_date timestamptz,
  accepted_driver_id uuid,
  accepted_driver_name text,
  publisher_id uuid not null references auth.users(id) on delete cascade,
  publisher_phone text,
  created_by text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index freights_publisher_id_idx on freights(publisher_id);
create index freights_status_idx on freights(status);

-- =========================================================================
-- conversations
-- =========================================================================
create table conversations (
  id uuid primary key default gen_random_uuid(),
  participant1_id uuid not null references auth.users(id) on delete cascade,
  participant2_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid,
  freight_id uuid references freights(id) on delete set null,
  origin_city text,
  origin_state text,
  destination_city text,
  destination_state text,
  metadata jsonb,
  is_pinned boolean default false,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);
create index conversations_participant1_idx on conversations(participant1_id);
create index conversations_participant2_idx on conversations(participant2_id);

-- =========================================================================
-- messages
-- =========================================================================
create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  message_type text,
  attachments jsonb,
  created_at timestamptz not null default now()
);
create index messages_conversation_id_idx on messages(conversation_id);

-- =========================================================================
-- notifications
-- =========================================================================
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  is_read boolean not null default false,
  related_id text,
  created_at timestamptz not null default now()
);
create index notifications_user_id_idx on notifications(user_id);

-- =========================================================================
-- ratings — freight/driver ratings between users
-- =========================================================================
create table ratings (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null references auth.users(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  freight_id uuid references freights(id) on delete set null,
  overall_rating numeric not null,
  punctuality_rating numeric,
  communication_rating numeric,
  professionalism_rating numeric,
  comment text,
  created_at timestamptz not null default now()
);
create index ratings_target_id_idx on ratings(target_id);

-- =========================================================================
-- company_ratings — ratings targeted at a company (defined in app types,
-- not yet queried by this codebase, kept for parity with the type)
-- =========================================================================
create table company_ratings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  evaluator_id uuid not null references auth.users(id) on delete cascade,
  evaluator_name text,
  evaluator_type text,
  overall_rating numeric not null,
  punctuality_rating numeric,
  communication_rating numeric,
  professionalism_rating numeric,
  comment text,
  created_at timestamptz not null default now()
);
create index company_ratings_company_id_idx on company_ratings(company_id);

-- =========================================================================
-- preferred_routes — driver's preferred lanes (defined in app types, not
-- yet queried by this codebase, kept for parity with the Driver type)
-- =========================================================================
create table preferred_routes (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references drivers(id) on delete cascade,
  origin jsonb not null,
  destination jsonb not null,
  priority text not null default 'medium',
  is_active boolean not null default true,
  vehicle_types text[],
  capacity_kg numeric,
  preferred_cargo_types text[],
  price_per_km numeric,
  minimum_value numeric,
  accepts_partial_load boolean,
  views_count integer default 0,
  contacts_count integer default 0,
  created_at timestamptz not null default now()
);
create index preferred_routes_driver_id_idx on preferred_routes(driver_id);

-- =========================================================================
-- profile_views — write-only view tracking for UserProfileModal
-- =========================================================================
create table profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references auth.users(id) on delete cascade,
  target_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index profile_views_target_id_idx on profile_views(target_id);

-- =========================================================================
-- collaborators — company staff who can be set as freight contacts
-- =========================================================================
create table collaborators (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
create index collaborators_company_id_idx on collaborators(company_id);

-- =========================================================================
-- company_saved_contacts — reusable contacts a company can attach to freights
-- =========================================================================
create table company_saved_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  created_by uuid references auth.users(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index company_saved_contacts_company_id_idx on company_saved_contacts(company_id);

-- =========================================================================
-- freight_responsible_contacts — contacts attached to a specific freight
-- =========================================================================
create table freight_responsible_contacts (
  id uuid primary key default gen_random_uuid(),
  freight_id uuid not null references freights(id) on delete cascade,
  contact_name text not null,
  contact_email text,
  contact_phone text,
  is_main_contact boolean not null default false,
  source text not null default 'manual',
  source_id uuid,
  created_at timestamptz not null default now()
);
create index freight_responsible_contacts_freight_id_idx on freight_responsible_contacts(freight_id);

-- =========================================================================
-- Storage buckets (public read — app builds public URLs directly)
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('chat-attachments', 'chat-attachments', true)
on conflict (id) do nothing;

-- =========================================================================
-- RLS for tables not covered by 20260427_rls_policies.sql
-- (profiles/companies/freights/drivers/conversations/messages/
-- notifications/ratings are enabled + policied by that migration, which
-- runs after this one)
-- =========================================================================
alter table company_ratings enable row level security;
alter table preferred_routes enable row level security;
alter table profile_views enable row level security;
alter table collaborators enable row level security;
alter table company_saved_contacts enable row level security;
alter table freight_responsible_contacts enable row level security;

create policy "Company ratings viewable by everyone" on company_ratings for select using (true);
create policy "Users can create company ratings" on company_ratings for insert with check (auth.uid() = evaluator_id);

create policy "Preferred routes viewable by everyone" on preferred_routes for select using (true);
create policy "Drivers manage own preferred routes" on preferred_routes for all using (
  exists (select 1 from drivers where drivers.id = preferred_routes.driver_id and drivers.user_id = auth.uid())
);

create policy "Users can log profile views" on profile_views for insert with check (auth.uid() = viewer_id);
create policy "Users can view who viewed their profile" on profile_views for select using (auth.uid() = target_id);

create policy "Collaborators viewable by own company" on collaborators for select using (
  exists (select 1 from companies where companies.id = collaborators.company_id and companies.user_id = auth.uid())
);
create policy "Companies manage own collaborators" on collaborators for all using (
  exists (select 1 from companies where companies.id = collaborators.company_id and companies.user_id = auth.uid())
);

create policy "Saved contacts viewable by own company" on company_saved_contacts for select using (
  exists (select 1 from companies where companies.id = company_saved_contacts.company_id and companies.user_id = auth.uid())
);
create policy "Companies manage own saved contacts" on company_saved_contacts for all using (
  exists (select 1 from companies where companies.id = company_saved_contacts.company_id and companies.user_id = auth.uid())
);

create policy "Freight contacts viewable by everyone" on freight_responsible_contacts for select using (true);
create policy "Freight owners manage contacts" on freight_responsible_contacts for all using (
  exists (select 1 from freights where freights.id = freight_responsible_contacts.freight_id and freights.publisher_id = auth.uid())
);
