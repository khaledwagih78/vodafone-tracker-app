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

-- ==================== النسخة التجريبية والتفعيل ====================
-- كل مستخدم جديد يبدأ بفترة تجريبية 14 يوم. بعد انتهائها، التطبيق يطلب التفعيل
-- (is_active = true) - وده بتعمله إنت يدويًا من Table Editor في Supabase
-- لأي عميل دفع، بدون نظام دفع تلقائي دلوقتي.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  trial_ends_at timestamptz not null default (now() + interval '14 days'),
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
-- لا توجد سياسة update للمستخدم نفسه => مايقدرش يمدد تجربته أو يفعّل نفسه بنفسه

-- ==================== صلاحيات لوحة تحكم المالك (خالد) ====================
-- خالد بس (UID ده) يقدر يشوف ويفعّل كل المستخدمين من صفحة /admin جوه التطبيق
create policy "profiles_admin_select_all" on public.profiles
  for select using (auth.uid() = '0e0567cb-0148-4989-8510-77ee1ac88199'::uuid);
create policy "profiles_admin_update_all" on public.profiles
  for update using (auth.uid() = '0e0567cb-0148-4989-8510-77ee1ac88199'::uuid);
