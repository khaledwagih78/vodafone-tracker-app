-- شغّل هذا الملف مرة واحدة في Supabase SQL Editor

create table public.lines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  number text not null,
  code text,
  display_name text,
  balance numeric not null default 0,
  monthly_limit numeric not null default 200000,
  remaining_withdraw numeric not null default 200000,
  remaining_deposit numeric not null default 200000,
  last_reset_month text not null default to_char(now(), 'YYYY-MM'),
  created_at timestamptz not null default now()
);

create index lines_user_id_idx on public.lines(user_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  line_id uuid not null references public.lines(id) on delete cascade,
  type text not null check (type in ('سحب', 'إيداع', 'ضبط رصيد')),
  amount numeric not null,
  note text default '-',
  created_at timestamptz not null default now()
);

create index transactions_user_id_idx on public.transactions(user_id);
create index transactions_line_id_idx on public.transactions(line_id);

alter table public.lines enable row level security;
alter table public.transactions enable row level security;

create policy "lines_select_own" on public.lines
  for select using (auth.uid() = user_id);
create policy "lines_insert_own" on public.lines
  for insert with check (auth.uid() = user_id);
create policy "lines_update_own" on public.lines
  for update using (auth.uid() = user_id);
create policy "lines_delete_own" on public.lines
  for delete using (auth.uid() = user_id);

create policy "tx_select_own" on public.transactions
  for select using (auth.uid() = user_id);
create policy "tx_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
-- لا توجد سياسة update/delete على المعاملات => سجل غير قابل للتعديل

-- ==================== هجرة لمشروع شغّل الـ schema القديم بالفعل ====================
-- شغّل السطرين دول بس لو جدول lines عندك أصلاً فيه عمود "remaining" القديم (المشترك)
-- alter table public.lines rename column remaining to remaining_withdraw;
-- alter table public.lines add column remaining_deposit numeric not null default 200000;
