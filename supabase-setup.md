# Supabase Schema Setup

1. **Configuración de Autenticación**: 
   En tu panel de Supabase, ve a **Authentication** > **Settings** > **Email Auth**:
   - Asegúrate de que **Enable Email Signup** esté **ACTIVADO** (en verde).
   - Desactiva la opción **Confirm email** (en gris). Esto permitirá crear cuentas al instante.

2. **Ejecutar SQL**:
   Corre el siguiente código en el **SQL Editor** de Supabase. Este código usa `IF NOT EXISTS` para que no te dé error si ya habías creado las tablas.

```sql
-- 1. Tablas principales (con seguridad contra errores de existencia)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  currency text default '$',
  theme text default 'dark',
  updated_at timestamp with time zone default now()
);

create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount numeric not null,
  category text not null,
  date timestamp with time zone not null,
  type text check (type in ('income', 'expense')) not null,
  description text,
  created_at timestamp with time zone default now()
);

create table if not exists public.recurring_payments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric not null,
  category text not null,
  frequency text not null,
  due_date text not null,
  is_paid boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists public.budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null,
  amount numeric not null,
  month text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, category, month)
);

create table if not exists public.savings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline text,
  category text,
  created_at timestamp with time zone default now()
);

-- 2. Habilitar Seguridad (RLS)
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_payments enable row level security;
alter table public.budgets enable row level security;
alter table public.savings enable row level security;

-- 3. Políticas de acceso (con comprobación para evitar errores)
do $$ 
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own profile') then
    create policy "Users can manage their own profile" on public.profiles for all using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own transactions') then
    create policy "Users can manage their own transactions" on public.transactions for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own recurring payments') then
    create policy "Users can manage their own recurring payments" on public.recurring_payments for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own budgets') then
    create policy "Users can manage their own budgets" on public.budgets for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Users can manage their own savings') then
    create policy "Users can manage their own savings" on public.savings for all using (auth.uid() = user_id);
  end if;
end $$;

-- 4. Función y Trigger para creación automática de perfil
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, currency, theme)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'currency', '$'),
    coalesce(new.raw_user_meta_data->>'theme', 'dark')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```
