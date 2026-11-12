-- 12: private orders, one-use scan grants, and cashier-first processing.
-- Apply before deploying the matching web application. No existing order is marked paid.
begin;
alter table public.cafe_tables add column if not exists order_mode text not null default 'dine_in' check(order_mode in ('dine_in','takeaway'));
update public.cafe_tables set order_mode='takeaway' where id='TKW-01';
drop index if exists public.one_active_order_per_table;
create index if not exists active_orders_by_table on public.orders(table_id,status);
create table if not exists public.order_scan_tickets (
 token_hash text primary key, browser_hash text not null, source_id text not null references public.cafe_tables(id),
 expires_at timestamptz not null, used_order_id uuid references public.orders(id), request_key uuid, payload_hash text
);
alter table public.order_scan_tickets enable row level security;
revoke all on public.order_scan_tickets from public,anon,authenticated;
grant all on public.order_scan_tickets to service_role;
create index if not exists scan_ticket_expiry on public.order_scan_tickets(expires_at);
create or replace function public.cafesite_require_paid() returns trigger language plpgsql set search_path=public as $$
begin
 if new.status in ('preparing','ready','completed') and new.payment_status<>'paid' and (tg_op='INSERT' or new.status is distinct from old.status) then raise exception 'Konfirmasi pembayaran sebelum memproses pesanan.'; end if;
 return new;
end $$;
drop trigger if exists require_paid_before_processing on public.orders;
create trigger require_paid_before_processing before insert or update of status on public.orders for each row execute function public.cafesite_require_paid();
create or replace function public.cafesite_checkout(input jsonb) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare order_id uuid; line jsonb; item menu_items; amount bigint:=0; qty integer; table_row cafe_tables; ticket_row order_scan_tickets; customer_phone text:=input->>'phone'; request_key uuid:=(input->>'idempotencyKey')::uuid;
begin
 select * into ticket_row from order_scan_tickets where token_hash=input->>'ticketHash' for update;
 if not found or ticket_row.browser_hash is distinct from input->>'browserHash' then raise exception 'Scan QR baru dari browser ini sebelum memesan.'; end if;
 if ticket_row.used_order_id is not null then
  if ticket_row.request_key is distinct from request_key or ticket_row.payload_hash is distinct from input->>'payloadHash' then raise exception 'Scan QR baru untuk pesanan baru.'; end if;
  return cafesite_order_document(ticket_row.used_order_id);
 end if;
 if ticket_row.expires_at<=clock_timestamp() then raise exception 'Tiket scan kedaluwarsa. Scan QR lagi; keranjang tetap tersimpan.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(request_key::text,0));
 select id into order_id from orders where idempotency_key=request_key;
 if found then raise exception 'Kunci pengiriman sudah digunakan. Scan QR lagi.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(customer_phone,1));
 if (select count(*) from orders where phone=customer_phone and created_at>now()-interval '10 minutes')>=5 then raise exception 'Terlalu banyak pesanan. Tunggu beberapa menit atau hubungi kasir.'; end if;
 select * into table_row from cafe_tables where id=ticket_row.source_id for update;
 if not found then raise exception 'Meja tidak ditemukan.'; end if;
 if table_row.order_mode='dine_in' and table_row.status='dirty' then raise exception 'Meja perlu disiapkan staf.'; end if;
 insert into orders(idempotency_key,customer_name,phone,fulfillment,table_id,source)
 values(request_key,input->>'customerName',customer_phone,table_row.order_mode,case when table_row.order_mode='dine_in' then table_row.id end,'website') returning id into order_id;
 for line in select * from jsonb_array_elements(input->'items') loop
  select * into item from menu_items where id=line->>'menuItemId' for share;
  if not found or not item.is_available then raise exception 'Salah satu menu tidak tersedia. Perbarui keranjang.'; end if;
  qty:=(line->>'quantity')::integer;
  insert into order_items(order_id,menu_item_id,name,unit_price,quantity,notes) values(order_id,item.id,item.data->>'name',(item.data->>'price')::bigint,qty,coalesce(line->>'notes',''));
  amount:=amount+(item.data->>'price')::bigint*qty;
 end loop;
 update orders set total=amount where id=order_id;
 update order_scan_tickets set used_order_id=order_id,request_key=(input->>'idempotencyKey')::uuid,payload_hash=input->>'payloadHash' where token_hash=ticket_row.token_hash;
 if table_row.order_mode='dine_in' then update cafe_tables set status='occupied' where id=table_row.id; end if;
 return cafesite_order_document(order_id);
end $$;

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
 if next_status in ('preparing','ready','completed') and current_order.payment_status<>'paid' and not paid then raise exception 'Konfirmasi pembayaran kasir sebelum memproses pesanan.'; end if;
 if paid and current_order.payment_status='paid' then raise exception 'Pembayaran sudah dikonfirmasi. Muat ulang pesanan.'; end if;
 stamp:=greatest(clock_timestamp(),current_order.updated_at+interval '1 millisecond');
 update orders set status=coalesce(next_status,status),payment_status=case when paid then 'paid' else payment_status end,paid_amount=case when paid then total else paid_amount end,updated_at=stamp where id=current_order.id;
 insert into order_milestones(order_id,paid_at,completed_at) values(current_order.id,case when paid then stamp end,case when next_status='completed' then stamp end)
 on conflict(order_id) do update set paid_at=coalesce(order_milestones.paid_at,excluded.paid_at),completed_at=coalesce(order_milestones.completed_at,excluded.completed_at);
 if next_status in ('completed','cancelled') and current_order.table_id is not null then update cafe_tables set status='dirty' where id=current_order.table_id and not exists(select 1 from orders where table_id=current_order.table_id and status in ('waiting','preparing','ready')); end if;
 return jsonb_build_object('order',cafesite_order_document(current_order.id));
end $$;


create or replace function public.cafesite_edit_customer_order(input jsonb) returns jsonb
language plpgsql security invoker set search_path=public as $$
declare current_order orders; line jsonb; item menu_items; amount bigint:=0; qty integer;
begin
 select * into current_order from orders where id=(input->>'id')::uuid for update;
 if not found then raise exception 'Pesanan tidak ditemukan.'; end if;
 if current_order.status<>'waiting' or current_order.payment_status<>'unpaid' or current_order.updated_at is distinct from (input->>'expectedUpdatedAt')::timestamptz then raise exception 'Pesanan sudah berubah atau dibayar. Muat ulang rincian terbaru.'; end if;
 if jsonb_array_length(input->'items') not between 1 and 30 then raise exception 'Jumlah menu tidak valid.'; end if;
 delete from order_items where order_id=current_order.id;
 for line in select * from jsonb_array_elements(input->'items') loop
  select * into item from menu_items where id=line->>'menuItemId' for share;
  if not found or not item.is_available then raise exception 'Salah satu menu sudah habis. Sesuaikan pesanan.'; end if;
  qty:=(line->>'quantity')::integer;
  if qty not between 1 and 20 then raise exception 'Jumlah tidak valid.'; end if;
  insert into order_items(order_id,menu_item_id,name,unit_price,quantity,notes) values(current_order.id,item.id,item.data->>'name',(item.data->>'price')::bigint,qty,coalesce(line->>'notes',''));
  amount:=amount+(item.data->>'price')::bigint*qty;
 end loop;
 update orders set total=amount,updated_at=greatest(clock_timestamp(),current_order.updated_at+interval '1 millisecond') where id=current_order.id;
 return cafesite_order_document(current_order.id);
end $$;
revoke all on function public.cafesite_checkout(jsonb) from public,anon,authenticated;
grant execute on function public.cafesite_checkout(jsonb) to service_role;
revoke all on function public.cafesite_edit_customer_order(jsonb) from public,anon,authenticated;
grant execute on function public.cafesite_edit_customer_order(jsonb) to service_role;
commit;
notify pgrst, 'reload schema';
