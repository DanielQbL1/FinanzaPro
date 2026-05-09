# Supabase Schema Setup

1. **Desactivar Verificación de Correo**: 
   En tu panel de Supabase, ve a **Authentication** > **Settings** > **Email Auth** y desactiva la opción **Confirm email**. Esto permite que los usuarios entren directamente tras registrarse.

2. **Ejecutar SQL**:
   Corre el siguiente código en el **SQL Editor** de Supabase para crear las tablas y políticas de seguridad.

```sql
-- Profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  currency text default '$',
  theme text default 'dark',
  updated_at timestamp with time zone default now()
);

-- Transactions table
create table transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount numeric not null,
  category text not null,
  date timestamp with time zone not null,
  type text check (type in ('income', 'expense')) not null,
  description text,
  created_at timestamp with time zone default now()
);

-- Recurring Payments table
create table recurring_payments (
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

-- Budgets table
create table budgets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null,
  amount numeric not null,
  month text not null,
  created_at timestamp with time zone default now(),
  unique(user_id, category, month)
);

-- Savings table
create table savings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  target_amount numeric not null,
  current_amount numeric default 0,
  deadline text,
  category text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table transactions enable row level security;
alter table recurring_payments enable row level security;
alter table budgets enable row level security;
alter table savings enable row level security;

-- Policies
create policy "Users can see their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

create policy "Users can manage their own transactions" on transactions for all using (auth.uid() = user_id);
create policy "Users can manage their own recurring payments" on recurring_payments for all using (auth.uid() = user_id);
create policy "Users can manage their own budgets" on budgets for all using (auth.uid() = user_id);
create policy "Users can manage their own savings" on savings for all using (auth.uid() = user_id);
```
