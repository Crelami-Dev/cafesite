-- Run after tahap_1 through tahap_4 (also compatible with the older 01 schema).
-- Never exposes password hashes, sessions, or order PII to anon/authenticated roles.
begin;
alter table public.orders alter column user_id drop not null;
alter table public.orders add column if not exists source text not null default 'website';
create table if not exists public.admin_sessions (token_hash text primary key, account_id text not null, expires_at bigint not null, owner_version text);
create table if not exists public.login_attempts (key text primary key, attempts integer not null, expires_at bigint not null);
create table if not exists public.order_milestones (order_id uuid primary key references public.orders(id) on delete cascade, paid_at timestamptz, completed_at timestamptz, estimated integer not null default 0);
create table if not exists public.cafesite_backups (id text primary key, snapshot jsonb not null, updated_at timestamptz not null default now());
create unique index if not exists staff_email_unique on public.staff_accounts(lower(email));
insert into public.order_milestones(order_id,paid_at,completed_at,estimated)
select id,case when payment_status='paid' then updated_at end,case when status='completed' then updated_at end,1 from public.orders
where payment_status='paid' or status='completed' on conflict do nothing;

-- Replace the incorrectly PUBLIC "Service role" policies from the previous scripts.
do $$ declare t text; p record; begin
 foreach t in array array['content','menu_items','floors','cafe_tables','orders','order_items','staff_accounts','staff_permissions','admin_sessions','login_attempts','order_milestones','cafesite_backups'] loop
  execute format('alter table public.%I enable row level security',t);
  for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
   execute format('drop policy %I on public.%I',p.policyname,t);
  end loop;
  execute format('revoke all on public.%I from anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  if t=any(array['content','menu_items','floors','cafe_tables']) then
   execute format('grant select on public.%I to anon,authenticated',t);
   execute format('create policy public_read on public.%I for select to anon,authenticated using(true)',t);
  end if;
 end loop;
end $$;
grant usage,select on sequence public.order_queue_seq to service_role;

create or replace function public.cafesite_order_document(order_uuid uuid) returns jsonb
language sql stable security invoker set search_path=public as $$
 select to_jsonb(o)-'idempotency_key' || jsonb_build_object('items',coalesce((select jsonb_agg(to_jsonb(i)-'order_id' order by i.id) from order_items i where i.order_id=o.id),'[]'::jsonb)) from orders o where o.id=order_uuid;
$$;

create or replace function public.cafesite_update_order(input jsonb) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare current_order orders; next_status text:=input->>'status'; paid boolean:=coalesce((input->>'markPaid')::boolean,false); stamp timestamptz;
begin
 select * into current_order from orders where id=(input->>'id')::uuid for update;
 if not found then raise exception 'Pesanan tidak ditemukan.'; end if;
 if input ? 'expectedUpdatedAt' and (input->>'expectedUpdatedAt')::timestamptz<>current_order.updated_at then raise exception 'Pesanan telah diperbarui staf lain. Muat ulang sebelum melanjutkan.'; end if;
 if paid and (current_order.status in ('completed','cancelled') or next_status='cancelled') then raise exception 'Pembayaran tidak dapat diproses pada pesanan ini.'; end if;
 if next_status is not null and next_status<>current_order.status then
  if not ((current_order.status='waiting' and next_status in ('preparing','cancelled')) or (current_order.status='preparing' and next_status='ready') or (current_order.status='ready' and next_status='completed')) then raise exception 'Urutan status tidak valid.'; end if;
  if next_status='cancelled' and current_order.payment_status='paid' then raise exception 'Pesanan sudah dibayar; hubungi pemilik untuk pengembalian.'; end if;
  if next_status='completed' and current_order.payment_status<>'paid' and not paid then raise exception 'Konfirmasi pembayaran kasir dahulu.'; end if;
 end if;
 stamp:=greatest(clock_timestamp(),current_order.updated_at+interval '1 millisecond');
 update orders set status=coalesce(next_status,status),payment_status=case when paid then 'paid' else payment_status end,paid_amount=case when paid then total else paid_amount end,updated_at=stamp where id=current_order.id;
 insert into order_milestones(order_id,paid_at,completed_at) values(current_order.id,case when paid then stamp end,case when next_status='completed' then stamp end)
 on conflict(order_id) do update set paid_at=coalesce(order_milestones.paid_at,excluded.paid_at),completed_at=coalesce(order_milestones.completed_at,excluded.completed_at);
 if next_status in ('completed','cancelled') and current_order.table_id is not null then update cafe_tables set status='dirty' where id=current_order.table_id; end if;
 return jsonb_build_object('order',cafesite_order_document(current_order.id));
end $$;

create or replace function public.cafesite_manage(resource text,input jsonb) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare row_value jsonb; floor_row floors; table_row cafe_tables;
begin
 if resource='menu-reorder' then
  for row_value in select * from jsonb_array_elements(input->'reorder') loop
   update menu_items set sort_order=(row_value->>'sort_order')::integer where id=row_value->>'id';
  end loop;
 elsif resource='tables' then
  -- Serialize with checkout, so an occupied table cannot be marked available by a stale form.
  perform 1 from cafe_tables where id=input->>'id' for update;
  if input->>'status'<>'occupied' and exists(select 1 from orders where table_id=input->>'id' and status in ('waiting','preparing','ready')) then raise exception 'Meja masih memiliki pesanan aktif.'; end if;
  table_row:=jsonb_populate_record(null::cafe_tables,input);
  insert into cafe_tables(id,floor_id,label,x,y,status) values(table_row.id,table_row.floor_id,table_row.label,10,10,table_row.status)
  on conflict(id) do update set floor_id=excluded.floor_id,label=excluded.label,status=excluded.status;
 elsif resource='floors' then
  floor_row:=jsonb_populate_record(null::floors,input);
  insert into floors(id,name,sort_order) values(floor_row.id,floor_row.name,floor_row.sort_order)
  on conflict(id) do update set name=excluded.name,sort_order=excluded.sort_order;
 else raise exception 'Aksi tidak tersedia.';
 end if;
 return jsonb_build_object('ok',true);
end $$;

create or replace function public.cafesite_save_staff(input jsonb,permissions jsonb,revoke_sessions boolean) returns void
language plpgsql security invoker set search_path=public as $$
declare staff staff_accounts; begin
 staff:=jsonb_populate_record(null::staff_accounts,input);
 insert into staff_accounts(id,name,email,password_hash,salt,enabled,must_change_password,created_at)
 values(staff.id,staff.name,lower(staff.email),staff.password_hash,staff.salt,staff.enabled,staff.must_change_password,staff.created_at)
 on conflict(id) do update set name=excluded.name,email=excluded.email,password_hash=excluded.password_hash,salt=excluded.salt,enabled=excluded.enabled,must_change_password=excluded.must_change_password;
 delete from staff_permissions where account_id=staff.id;
 insert into staff_permissions(account_id,module) select staff.id,value from jsonb_array_elements_text(permissions) on conflict do nothing;
 if revoke_sessions then delete from admin_sessions where account_id=staff.id; end if;
end $$;
create or replace function public.cafesite_change_password(account text,expected_hash text,new_hash text,new_salt text) returns void
language plpgsql security invoker set search_path=public as $$ begin
 update staff_accounts set password_hash=new_hash,salt=new_salt,must_change_password=0 where id=account and enabled=1 and password_hash=expected_hash;
 if not found then raise exception 'Akun telah berubah. Masuk kembali dan ulangi.'; end if;
 delete from admin_sessions where account_id=account;
end $$;
create or replace function public.cafesite_login_attempt(attempt_key text) returns integer
language plpgsql security invoker set search_path=public as $$
declare n integer; stamp bigint:=(extract(epoch from clock_timestamp())*1000)::bigint; begin
 insert into login_attempts(key,attempts,expires_at) values(attempt_key,1,stamp+900000)
 on conflict(key) do update set attempts=case when login_attempts.expires_at<stamp then 1 else login_attempts.attempts+1 end,expires_at=case when login_attempts.expires_at<stamp then stamp+900000 else login_attempts.expires_at end returning attempts into n;
 return n;
end $$;

create or replace function public.cafesite_report(start_at timestamptz,end_at timestamptz) returns jsonb
language sql stable security invoker set search_path=public as $$
 with paid as (select o.*,coalesce(m.paid_at,o.updated_at) as payment_time,case when m.estimated=1 or m.paid_at is null then 1 else 0 end as estimated from orders o left join order_milestones m on m.order_id=o.id where o.payment_status='paid' and o.status<>'cancelled' and coalesce(m.paid_at,o.updated_at)>=start_at and coalesce(m.paid_at,o.updated_at)<end_at),
 days as(select to_char(payment_time at time zone 'Asia/Jakarta','YYYY-MM-DD') as day,sum(paid_amount) as revenue,count(*) as count from paid group by day order by day),
 items as(select i.name,sum(i.quantity) as quantity,sum(i.quantity*i.unit_price) as revenue from order_items i join paid p on p.id=i.order_id group by i.menu_item_id,i.name order by quantity desc limit 10)
 select jsonb_build_object('revenue',coalesce(sum(paid_amount),0),'paidOrders',count(*),'average',coalesce(round(avg(paid_amount)),0),'estimated',coalesce(sum(estimated),0),'orderCount',(select count(*) from orders where created_at>=start_at and created_at<end_at),'daily',coalesce((select jsonb_agg(days) from days),'[]'::jsonb),'topItems',coalesce((select jsonb_agg(items) from items),'[]'::jsonb)) from paid;
$$;

-- Guest checkout uses the same signed QR / order-token contract as the local app.
create or replace function public.cafesite_checkout(input jsonb) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare order_id uuid; line jsonb; item menu_items; amount bigint:=0; qty integer; table_row cafe_tables; customer_phone text:=input->>'phone'; request_key uuid:=(input->>'idempotencyKey')::uuid;
begin
 perform pg_advisory_xact_lock(hashtextextended(request_key::text,0));
 select id into order_id from orders where idempotency_key=request_key;
 if found then return cafesite_order_document(order_id); end if;
 perform pg_advisory_xact_lock(hashtextextended(customer_phone,1));
 if (select count(*) from orders where phone=customer_phone and created_at>now()-interval '10 minutes')>=5 then raise exception 'Terlalu banyak pesanan. Tunggu beberapa menit atau hubungi kasir.'; end if;
 select * into table_row from cafe_tables where id=input->>'tableCode' for update;
 if not found then raise exception 'Meja tidak ditemukan.'; end if;
 if input->>'fulfillment'='dine_in' and (table_row.status<>'available' or exists(select 1 from orders where table_id=table_row.id and status in ('waiting','preparing','ready'))) then raise exception 'Meja belum tersedia. Hubungi kasir.'; end if;
 insert into orders(idempotency_key,customer_name,phone,fulfillment,table_id,source)
 values(request_key,input->>'customerName',customer_phone,input->>'fulfillment',case when input->>'fulfillment'='dine_in' then table_row.id end,'website') returning id into order_id;
 for line in select * from jsonb_array_elements(input->'items') loop
  select * into item from menu_items where id=line->>'menuItemId' for share;
  if not found or not item.is_available then raise exception 'Salah satu menu tidak tersedia. Perbarui keranjang.'; end if;
  qty:=(line->>'quantity')::integer;
  insert into order_items(order_id,menu_item_id,name,unit_price,quantity,notes) values(order_id,item.id,item.data->>'name',(item.data->>'price')::bigint,qty,coalesce(line->>'notes',''));
  amount:=amount+(item.data->>'price')::bigint*qty;
 end loop;
 update orders set total=amount where id=order_id;
 if input->>'fulfillment'='dine_in' then update cafe_tables set status='occupied' where id=table_row.id; end if;
 return cafesite_order_document(order_id);
end $$;

-- Explicit function grants: new Postgres functions otherwise default to PUBLIC execute.
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'cafesite_%' loop
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('cafe-assets','cafe-assets',true,5242880,array['image/jpeg','image/png','image/webp','image/avif']) on conflict(id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
commit;
