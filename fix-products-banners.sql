-- TI Gadget Zone: fix Product + Slider/Banner setup
-- Run this ONCE in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Required columns (safe if they already exist)
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists category_id uuid;
alter table public.products add column if not exists description text not null default '';
alter table public.products add column if not exists specifications jsonb not null default '{}'::jsonb;
alter table public.products add column if not exists main_image_url text;
alter table public.products add column if not exists gallery_urls text[] not null default '{}';
alter table public.products add column if not exists purchase_price numeric(10,2) not null default 0;
alter table public.products add column if not exists selling_price numeric(10,2) not null default 0;
alter table public.products add column if not exists compare_at_price numeric(10,2);
alter table public.products add column if not exists stock integer not null default 0;
alter table public.products add column if not exists featured boolean not null default false;
alter table public.products add column if not exists active boolean not null default true;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();

alter table public.banners add column if not exists image_url text;
alter table public.banners add column if not exists title text not null default '';
alter table public.banners add column if not exists subtitle text not null default '';
alter table public.banners add column if not exists link_url text not null default '';
alter table public.banners add column if not exists sort_order integer not null default 0;
alter table public.banners add column if not exists active boolean not null default true;
alter table public.banners add column if not exists created_at timestamptz not null default now();

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_name text not null,
  color_hex text not null default '#7c3aed',
  image_url text,
  purchase_price numeric(10,2),
  selling_price numeric(10,2),
  stock integer not null default 0,
  sort_order integer not null default 0
);

-- Public catalog read + admin write.
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.banners enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select using (active = true or public.is_admin());
drop policy if exists products_admin_all on public.products;
create policy products_admin_all on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists variants_public_read on public.product_variants;
create policy variants_public_read on public.product_variants for select using (exists(select 1 from public.products p where p.id=product_id and (p.active=true or public.is_admin())));
drop policy if exists variants_admin_all on public.product_variants;
create policy variants_admin_all on public.product_variants for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists banners_public_read on public.banners;
create policy banners_public_read on public.banners for select using (active=true or public.is_admin());
drop policy if exists banners_admin_all on public.banners;
create policy banners_admin_all on public.banners for all using (public.is_admin()) with check (public.is_admin());

-- Storage buckets.
insert into storage.buckets (id,name,public) values ('product-images','product-images',true)
on conflict (id) do update set public=true;
insert into storage.buckets (id,name,public) values ('banners','banners',true)
on conflict (id) do update set public=true;

-- Storage read policies.
drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects for select using (bucket_id='product-images');
drop policy if exists banners_public_read on storage.objects;
create policy banners_public_read on storage.objects for select using (bucket_id='banners');

-- Storage admin write policies.
drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects for insert to authenticated
with check (bucket_id='product-images' and public.is_admin());
drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects for update to authenticated
using (bucket_id='product-images' and public.is_admin())
with check (bucket_id='product-images' and public.is_admin());
drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects for delete to authenticated
using (bucket_id='product-images' and public.is_admin());

drop policy if exists banners_admin_insert on storage.objects;
create policy banners_admin_insert on storage.objects for insert to authenticated
with check (bucket_id='banners' and public.is_admin());
drop policy if exists banners_admin_update on storage.objects;
create policy banners_admin_update on storage.objects for update to authenticated
using (bucket_id='banners' and public.is_admin())
with check (bucket_id='banners' and public.is_admin());
drop policy if exists banners_admin_delete on storage.objects;
create policy banners_admin_delete on storage.objects for delete to authenticated
using (bucket_id='banners' and public.is_admin());


-- Ensure color records have all fields used by the admin/store.
alter table public.product_variants add column if not exists color_hex text not null default '#7c3aed';
alter table public.product_variants add column if not exists image_url text;
alter table public.product_variants add column if not exists purchase_price numeric(10,2);
alter table public.product_variants add column if not exists selling_price numeric(10,2);
alter table public.product_variants add column if not exists stock integer not null default 0;
alter table public.product_variants add column if not exists sort_order integer not null default 0;

-- Storage policies for the two public image buckets.
-- Admin users can upload, replace and delete; everyone can read the images.
drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects
for select using (bucket_id='product-images');

drop policy if exists banners_public_read on storage.objects;
create policy banners_public_read on storage.objects
for select using (bucket_id='banners');

drop policy if exists product_images_admin_insert on storage.objects;
create policy product_images_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id='product-images' and public.is_admin());

drop policy if exists product_images_admin_update on storage.objects;
create policy product_images_admin_update on storage.objects
for update to authenticated
using (bucket_id='product-images' and public.is_admin())
with check (bucket_id='product-images' and public.is_admin());

drop policy if exists product_images_admin_delete on storage.objects;
create policy product_images_admin_delete on storage.objects
for delete to authenticated
using (bucket_id='product-images' and public.is_admin());

drop policy if exists banners_admin_insert on storage.objects;
create policy banners_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id='banners' and public.is_admin());

drop policy if exists banners_admin_update on storage.objects;
create policy banners_admin_update on storage.objects
for update to authenticated
using (bucket_id='banners' and public.is_admin())
with check (bucket_id='banners' and public.is_admin());

drop policy if exists banners_admin_delete on storage.objects;
create policy banners_admin_delete on storage.objects
for delete to authenticated
using (bucket_id='banners' and public.is_admin());
