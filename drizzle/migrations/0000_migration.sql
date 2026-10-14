
create type public.app_role as enum ('admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
grant execute on function public.has_role(uuid, public.app_role) to authenticated, anon;

create policy "users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  price numeric(10,2) not null check (price >= 0),
  promo_price numeric(10,2) check (promo_price is null or promo_price >= 0),
  available boolean not null default true,
  featured boolean not null default false,
  is_new boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  storage_path text,
  sort_order int not null default 0
);
create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  kind text not null check (kind in ('color','size','shade')),
  value text not null,
  sort_order int not null default 0
);
create table public.store_settings (
  id int primary key default 1 check (id = 1),
  store_name text not null default 'Bella Gatta',
  logo_url text,
  banner_url text,
  banner_title text,
  banner_subtitle text,
  instagram_handle text not null default 'gattabella_',
  whatsapp_number text not null default '5511949369601' check (whatsapp_number ~ '^[1-9][0-9]{11,13}$'),
  updated_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['categories','products','product_images','product_options','store_settings'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check (public.has_role(auth.uid(), ''admin''))', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using (public.has_role(auth.uid(), ''admin'')) with check (public.has_role(auth.uid(), ''admin''))', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(), ''admin''))', t);
  end loop;
end $$;

create index on public.products(category_id);
create index on public.product_images(product_id);
create index on public.product_options(product_id);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();
create trigger settings_touch before update on public.store_settings for each row execute function public.touch_updated_at();

insert into public.store_settings (id) values (1);
insert into public.categories (name, slug, description, sort_order) values
 ('Roupas femininas','roupas','Peças para todos os momentos',1),
 ('Lingerie','lingerie','Conforto e delicadeza',2),
 ('Maquiagens','maquiagens','Cores para realçar sua beleza',3);

create policy "admin read assets" on storage.objects for select to authenticated
  using (bucket_id in ('product-images','store-assets') and public.has_role(auth.uid(),'admin'));
create policy "admin upload assets" on storage.objects for insert to authenticated
  with check (bucket_id in ('product-images','store-assets') and public.has_role(auth.uid(),'admin'));
create policy "admin update assets" on storage.objects for update to authenticated
  using (bucket_id in ('product-images','store-assets') and public.has_role(auth.uid(),'admin'));
create policy "admin delete assets" on storage.objects for delete to authenticated
  using (bucket_id in ('product-images','store-assets') and public.has_role(auth.uid(),'admin'));
