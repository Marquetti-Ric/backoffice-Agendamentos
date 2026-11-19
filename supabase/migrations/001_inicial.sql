-- Backoffice de agendamentos white-label: esquema multiempresa.
-- Cada linha de dados pertence a uma empresa (empresa_id). O acesso é controlado por RLS:
-- membros veem só a própria empresa; administradores da plataforma veem todas.

create extension if not exists pgcrypto;

-- ---------- tabelas ----------
create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  plano text not null default 'gratis',
  ativa boolean not null default true,
  marca jsonb not null default '{}'::jsonb,
  cfg jsonb not null default '{"abre":"08:00","fecha":"21:00","passo":15}'::jsonb,
  salas text[] not null default array['Sala 1','Sala 2']::text[],
  app jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now()
);

create table public.admins_plataforma (
  user_id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

create table public.membros (
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  papel text not null check (papel in ('dono','gestor','recepcao','profissional')),
  profissional_id uuid,
  criado_em timestamptz not null default now(),
  primary key (empresa_id, user_id)
);

create table public.convites (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  email text not null,
  papel text not null check (papel in ('dono','gestor','recepcao','profissional')),
  profissional_id uuid,
  aceito_em timestamptz,
  criado_em timestamptz not null default now(),
  unique (empresa_id, email)
);

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  n text not null,
  c text not null default '#7d8a55',
  ordem int not null default 0
);

create table public.servicos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  pilar uuid references public.categorias(id) on delete set null,
  dur int not null default 60 check (dur > 0),
  preco numeric(10,2) not null default 0,
  intervalo int not null default 0,
  sala text,
  ativo boolean not null default true,
  app boolean not null default true,
  descricao text not null default ''
);

create table public.profissionais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  funcao text not null default '',
  cor text not null default '#7d8a55',
  dias int[] not null default array[1,2,3,4,5],
  ini text not null default '09:00' check (ini ~ '^\d\d:\d\d$'),
  fim text not null default '18:00' check (fim ~ '^\d\d:\d\d$'),
  servicos uuid[] not null default '{}',
  ativo boolean not null default true
);

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  tel text not null default '',
  email text not null default '',
  origem text not null default 'Balcão',
  desde date not null default current_date,
  pref jsonb not null default '{}'::jsonb,
  obs text not null default '',
  whatsapp_ok boolean -- null = não informado, false = pediu para não receber
);

create table public.reservas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  cliente uuid references public.clientes(id) on delete set null,
  servico uuid references public.servicos(id) on delete set null,
  pro uuid references public.profissionais(id) on delete set null,
  sala text,
  data date not null,
  hora text not null check (hora ~ '^\d\d:\d\d$'),
  status text not null default 'confirmada' check (status in ('pendente','confirmada','checkin','concluida','cancelada','falta')),
  origem text not null default 'Balcão',
  preco numeric(10,2) not null default 0,
  obs text not null default '',
  lembrete_enviado_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.membros add foreign key (profissional_id) references public.profissionais(id) on delete set null;
alter table public.convites add foreign key (profissional_id) references public.profissionais(id) on delete set null;
create index on public.membros(user_id);
create index on public.convites(lower(email));
create index on public.categorias(empresa_id);
create index on public.servicos(empresa_id);
create index on public.profissionais(empresa_id);
create index on public.clientes(empresa_id);
create index on public.reservas(empresa_id, data);

-- ---------- funções de acesso ----------
create or replace function public.e_admin_plataforma() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins_plataforma where user_id = auth.uid());
$$;

create or replace function public.papel_na(emp uuid) returns text
language sql stable security definer set search_path = public as $$
  select papel from membros where empresa_id = emp and user_id = auth.uid();
$$;

create or replace function public.meu_profissional(emp uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select profissional_id from membros where empresa_id = emp and user_id = auth.uid() and papel = 'profissional';
$$;

create or replace function public.pode_ver(emp uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.e_admin_plataforma() or public.papel_na(emp) is not null;
$$;

create or replace function public.pode_operar(emp uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.e_admin_plataforma() or public.papel_na(emp) in ('dono','gestor','recepcao');
$$;

create or replace function public.pode_gerir(emp uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.e_admin_plataforma() or public.papel_na(emp) in ('dono','gestor');
$$;

-- ---------- RLS ----------
alter table public.empresas enable row level security;
alter table public.admins_plataforma enable row level security;
alter table public.membros enable row level security;
alter table public.convites enable row level security;
alter table public.categorias enable row level security;
alter table public.servicos enable row level security;
alter table public.profissionais enable row level security;
alter table public.clientes enable row level security;
alter table public.reservas enable row level security;

create policy empresas_ler on public.empresas for select using (pode_ver(id));
create policy empresas_editar on public.empresas for update using (pode_gerir(id)) with check (pode_gerir(id));
create policy empresas_admin on public.empresas for all using (e_admin_plataforma()) with check (e_admin_plataforma());

create policy admins_ler on public.admins_plataforma for select using (user_id = auth.uid() or e_admin_plataforma());

create policy membros_ler on public.membros for select using (user_id = auth.uid() or pode_ver(empresa_id));
create policy membros_gerir on public.membros for all using (pode_gerir(empresa_id) and (papel <> 'dono' or e_admin_plataforma() or papel_na(empresa_id) = 'dono'))
  with check (pode_gerir(empresa_id) and (papel <> 'dono' or e_admin_plataforma() or papel_na(empresa_id) = 'dono'));

create policy convites_ler on public.convites for select using (pode_gerir(empresa_id));
create policy convites_gerir on public.convites for all using (pode_gerir(empresa_id) and (papel <> 'dono' or e_admin_plataforma() or papel_na(empresa_id) = 'dono'))
  with check (pode_gerir(empresa_id) and (papel <> 'dono' or e_admin_plataforma() or papel_na(empresa_id) = 'dono'));

-- cadastros: todos da empresa leem, dono/gestor alteram
create policy categorias_ler on public.categorias for select using (pode_ver(empresa_id));
create policy categorias_gerir on public.categorias for all using (pode_gerir(empresa_id)) with check (pode_gerir(empresa_id));
create policy servicos_ler on public.servicos for select using (pode_ver(empresa_id));
create policy servicos_gerir on public.servicos for all using (pode_gerir(empresa_id)) with check (pode_gerir(empresa_id));
create policy profissionais_ler on public.profissionais for select using (pode_ver(empresa_id));
create policy profissionais_gerir on public.profissionais for all using (pode_gerir(empresa_id)) with check (pode_gerir(empresa_id));

-- operação: recepção também cria e altera clientes e reservas; profissional só atualiza reservas
create policy clientes_ler on public.clientes for select using (pode_ver(empresa_id));
create policy clientes_operar on public.clientes for all using (pode_operar(empresa_id)) with check (pode_operar(empresa_id));
-- profissional vê e atualiza só os próprios atendimentos
create policy reservas_ler on public.reservas for select using (pode_operar(empresa_id) or (pro is not null and pro = meu_profissional(empresa_id)));
create policy reservas_operar on public.reservas for all using (pode_operar(empresa_id)) with check (pode_operar(empresa_id));
create policy reservas_profissional on public.reservas for update
  using (pro is not null and pro = meu_profissional(empresa_id))
  with check (pro is not null and pro = meu_profissional(empresa_id));

-- só a plataforma muda plano, status, endereço e app de uma empresa
create or replace function public.proteger_empresa() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not e_admin_plataforma() then
    new.plano := old.plano; new.ativa := old.ativa; new.slug := old.slug; new.app := old.app;
  end if;
  return new;
end $$;
create trigger empresas_proteger before update on public.empresas for each row execute function public.proteger_empresa();

create or replace function public.tocar_reserva() returns trigger language plpgsql as $$
begin new.atualizado_em := now(); return new; end $$;
create trigger reservas_tocar before update on public.reservas for each row execute function public.tocar_reserva();

-- ---------- convites viram acesso ----------
create or replace function public.aceitar_convites() returns int
language plpgsql security definer set search_path = public as $$
declare n int; mail text;
begin
  select lower(email) into mail from auth.users where id = auth.uid();
  if mail is null then return 0; end if;
  insert into membros (empresa_id, user_id, email, papel, profissional_id)
    select c.empresa_id, auth.uid(), mail, c.papel, c.profissional_id from convites c
    where lower(c.email) = mail and c.aceito_em is null
  on conflict (empresa_id, user_id) do update set papel = excluded.papel, profissional_id = excluded.profissional_id;
  get diagnostics n = row_count;
  update convites set aceito_em = now() where lower(email) = mail and aceito_em is null;
  return n;
end $$;

-- ---------- plataforma ----------
-- O primeiro usuário que chamar esta função vira administrador da plataforma. Depois disso ela não faz nada.
create or replace function public.reivindicar_plataforma() returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or exists (select 1 from admins_plataforma) then return false; end if;
  insert into admins_plataforma(user_id) values (auth.uid());
  return true;
end $$;

create or replace function public.plataforma_livre() returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from admins_plataforma);
$$;

create or replace function public.criar_empresa(p_nome text, p_slug text, p_email_dono text, p_marca jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare emp uuid;
begin
  if not e_admin_plataforma() then raise exception 'Somente o administrador da plataforma cria empresas'; end if;
  insert into empresas(nome, slug, marca) values (p_nome, p_slug, p_marca) returning id into emp;
  insert into categorias(empresa_id, n, c, ordem) values
    (emp,'Corpo','#b49f8c',0),(emp,'Mente','#748479',1),(emp,'Estética','#7c9aa2',2);
  if coalesce(p_email_dono,'') <> '' then
    insert into convites(empresa_id, email, papel) values (emp, lower(trim(p_email_dono)), 'dono');
  end if;
  return emp;
end $$;

-- resumo para o painel da plataforma
create or replace function public.resumo_empresas()
returns table(id uuid, nome text, slug text, plano text, ativa boolean, criado_em timestamptz, membros bigint, convites_pendentes bigint, reservas_30d bigint, clientes bigint)
language sql stable security definer set search_path = public as $$
  select e.id, e.nome, e.slug, e.plano, e.ativa, e.criado_em,
    (select count(*) from membros m where m.empresa_id = e.id),
    (select count(*) from convites c where c.empresa_id = e.id and c.aceito_em is null),
    (select count(*) from reservas r where r.empresa_id = e.id and r.data >= current_date - 30),
    (select count(*) from clientes c where c.empresa_id = e.id)
  from empresas e
  where e_admin_plataforma()
  order by e.criado_em;
$$;

revoke execute on function public.criar_empresa(text,text,text,jsonb) from anon;
revoke execute on function public.resumo_empresas() from anon;
revoke execute on function public.reivindicar_plataforma() from anon;
