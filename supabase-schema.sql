-- ============================================================
--  RAPIDOYA — Schema completo para Supabase
--  Ejecutar en: Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1. PERFILES DE USUARIO
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  phone text,
  role text not null check (role in ('client', 'restaurant', 'delivery')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Ver perfil propio" on public.profiles for select using (auth.uid() = id);
create policy "Editar perfil propio" on public.profiles for update using (auth.uid() = id);
create policy "Insertar perfil propio" on public.profiles for insert with check (auth.uid() = id);
-- Permitir leer perfiles para joins internos
create policy "Leer perfiles publicamente" on public.profiles for select using (true);

-- 2. RESTAURANTES
create table public.restaurants (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  category text not null default 'General',
  description text,
  phone text,
  address text,
  image text default '🍽️',
  rating numeric default 5.0,
  delivery_time text default '25-35 min',
  active boolean default true,
  created_at timestamptz default now()
);
alter table public.restaurants enable row level security;
create policy "Ver restaurantes activos" on public.restaurants for select using (true);
create policy "Dueño gestiona su restaurante" on public.restaurants for all using (auth.uid() = owner_id);
create policy "Insertar restaurante propio" on public.restaurants for insert with check (auth.uid() = owner_id);

-- 3. MENU ITEMS
create table public.menu_items (
  id uuid default gen_random_uuid() primary key,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric not null,
  image text default '🍽️',
  available boolean default true,
  created_at timestamptz default now()
);
alter table public.restaurants enable row level security;
create policy "Ver menu items" on public.menu_items for select using (true);
create policy "Dueño gestiona menu" on public.menu_items for all using (
  auth.uid() = (select owner_id from public.restaurants where id = restaurant_id)
);
create policy "Insertar menu item" on public.menu_items for insert with check (
  auth.uid() = (select owner_id from public.restaurants where id = restaurant_id)
);

-- 4. PEDIDOS
create table public.orders (
  id text primary key default 'PED-' || substr(gen_random_uuid()::text, 1, 6),
  client_id uuid references public.profiles(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete cascade,
  delivery_id uuid references public.profiles(id),
  items jsonb not null default '[]',
  total numeric not null,
  delivery_fee numeric default 500,
  address text not null,
  pay_method text default 'Efectivo' check (pay_method in ('Efectivo', 'Débito')),
  status text default 'pending' check (status in ('pending','accepted','preparing','ready','picked','delivering','delivered','rejected')),
  prep_time integer default 25,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.orders enable row level security;
create policy "Cliente ve sus pedidos" on public.orders for select using (auth.uid() = client_id);
create policy "Restaurante ve sus pedidos" on public.orders for select using (
  auth.uid() = (select owner_id from public.restaurants where id = restaurant_id)
);
create policy "Repartidor ve pedidos listos" on public.orders for select using (
  status = 'ready' or auth.uid() = delivery_id
);
create policy "Cliente crea pedidos" on public.orders for insert with check (auth.uid() = client_id);
create policy "Actualizar pedido" on public.orders for update using (
  auth.uid() = client_id or
  auth.uid() = (select owner_id from public.restaurants where id = restaurant_id) or
  auth.uid() = delivery_id or
  (select role from public.profiles where id = auth.uid()) = 'delivery'
);

-- 5. FUNCIÓN: actualizar updated_at automáticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger orders_updated_at
  before update on public.orders
  for each row execute procedure public.handle_updated_at();

-- 6. FUNCIÓN: crear perfil automáticamente al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Usuario'),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'client')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 7. HABILITAR REALTIME para pedidos
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.menu_items;
