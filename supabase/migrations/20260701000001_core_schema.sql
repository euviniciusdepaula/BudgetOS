-- BudgetOS — schema do core do MVP
--
-- Modelo single-user: não há Supabase Auth. O acesso é protegido na
-- aplicação por uma chave de acesso (apenas o hash SHA-256 é persistido
-- em vault.access_key_hash). RLS fica habilitado com política aberta
-- para o papel anon — a segurança efetiva é a chave do Vault + as
-- chaves do projeto Supabase.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- vault — identidade única do usuário
-- investment_goal: meta mínima mensal de investimento definida no onboarding;
-- copiada para months.reserved_investment na abertura de cada mês.
-- ---------------------------------------------------------------------------
create table public.vault (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  access_key_hash text not null,
  investment_goal numeric(12, 2) not null default 0 check (investment_goal >= 0),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- months — um registro por mês financeiro
-- available_balance = bank_balance - reserved_fixed_expenses - reserved_investment
-- (mantido pela camada de serviços; o banco garante apenas unicidade e formato)
-- ---------------------------------------------------------------------------
create table public.months (
  id uuid primary key default gen_random_uuid(),
  month smallint not null check (month between 1 and 12),
  year smallint not null check (year between 2000 and 2200),
  starting_balance numeric(12, 2) not null default 0,
  salary numeric(12, 2) not null default 0,
  extra_income numeric(12, 2) not null default 0,
  bank_balance numeric(12, 2) not null default 0,
  reserved_fixed_expenses numeric(12, 2) not null default 0,
  reserved_investment numeric(12, 2) not null default 0,
  available_balance numeric(12, 2) not null default 0,
  closed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (year, month)
);

-- ---------------------------------------------------------------------------
-- fixed_expenses — gastos fixos recorrentes (aluguel, assinaturas, ...)
-- ---------------------------------------------------------------------------
create table public.fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  due_day smallint not null check (due_day between 1 and 31),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- fixed_expense_payments — marca "pago" de um gasto fixo dentro de um mês.
-- amount é congelado no momento do pagamento (o gasto fixo pode mudar depois).
-- ---------------------------------------------------------------------------
create table public.fixed_expense_payments (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.months (id) on delete cascade,
  fixed_expense_id uuid not null references public.fixed_expenses (id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  paid_at timestamptz not null default now(),
  unique (month_id, fixed_expense_id)
);

-- ---------------------------------------------------------------------------
-- categories — planejamento padrão (nunca alterado pelo fluxo mensal)
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  emoji text not null default '💸',
  name text not null,
  default_limit numeric(12, 2) not null default 0 check (default_limit >= 0),
  color text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- monthly_category_budgets — orçamento da categoria APENAS naquele mês.
-- planned_limit: cópia de categories.default_limit na abertura do mês.
-- current_limit: limite vigente (futuras redistribuições via budgetAllocator).
-- remaining é derivado — coluna gerada, sempre consistente.
-- ---------------------------------------------------------------------------
create table public.monthly_category_budgets (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.months (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  planned_limit numeric(12, 2) not null default 0,
  current_limit numeric(12, 2) not null default 0,
  spent numeric(12, 2) not null default 0,
  remaining numeric(12, 2) generated always as (current_limit - spent) stored,
  unique (month_id, category_id)
);

-- ---------------------------------------------------------------------------
-- transactions — lançamentos
-- ---------------------------------------------------------------------------
create type public.transaction_type as enum ('expense', 'income', 'adjustment', 'investment');
create type public.transaction_source as enum ('manual', 'ai', 'simulation');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.months (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  type public.transaction_type not null,
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  source public.transaction_source not null default 'manual',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- balance_adjustments — ajustes que alteram apenas o saldo bancário.
-- amount é sempre positivo; o sinal do efeito vem do type
-- (entry soma, exit subtrai, correction/transfer usam signed_amount na app).
-- ---------------------------------------------------------------------------
create type public.adjustment_type as enum ('entry', 'exit', 'correction', 'transfer');

create table public.balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.months (id) on delete cascade,
  type public.adjustment_type not null,
  amount numeric(12, 2) not null,
  description text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- investments — aportes efetivados dentro de um mês
-- ---------------------------------------------------------------------------
create table public.investments (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.months (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  description text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- ai_conversations — histórico do campo de IA
-- ---------------------------------------------------------------------------
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  month_id uuid references public.months (id) on delete set null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------------
create index idx_transactions_month on public.transactions (month_id);
create index idx_transactions_category on public.transactions (category_id);
create index idx_transactions_date on public.transactions (date desc);
create index idx_budgets_month on public.monthly_category_budgets (month_id);
create index idx_adjustments_month on public.balance_adjustments (month_id);
create index idx_investments_month on public.investments (month_id);
create index idx_payments_month on public.fixed_expense_payments (month_id);
create index idx_categories_sort on public.categories (sort_order);
create index idx_ai_conversations_created on public.ai_conversations (created_at desc);

-- ---------------------------------------------------------------------------
-- RLS — habilitado em todas as tabelas com política aberta para anon
-- (não há Supabase Auth neste projeto; ver comentário no topo).
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'vault', 'months', 'fixed_expenses', 'fixed_expense_payments',
    'categories', 'monthly_category_budgets', 'transactions',
    'balance_adjustments', 'investments', 'ai_conversations'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "single_user_full_access" on public.%I for all to anon, authenticated using (true) with check (true)',
      t
    );
  end loop;
end;
$$;
