create or replace function public.create_sale_with_items(
  p_customer_id bigint,
  p_total_price numeric,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_id bigint;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  insert into public.sales (customer_id, total_price)
  values (p_customer_id, p_total_price)
  returning id into v_sale_id;

  insert into public.sale_items (
    sale_id,
    product_id,
    quantity,
    width,
    height,
    description,
    item_total,
    price_per_unit,
    cost_price
  )
  select
    v_sale_id,
    item.product_id,
    item.quantity,
    item.width,
    item.height,
    item.description,
    item.item_total,
    item.price_per_unit,
    item.cost_price
  from jsonb_to_recordset(p_items) as item(
    product_id bigint,
    quantity numeric,
    width numeric,
    height numeric,
    description text,
    item_total numeric,
    price_per_unit numeric,
    cost_price numeric
  );

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'total_price', p_total_price
  );
end;
$$;

create or replace function public.update_sale_with_items(
  p_sale_id bigint,
  p_customer_id bigint,
  p_total_price numeric,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    raise exception 'Admin access required';
  end if;

  if not exists (
    select 1
    from public.sales
    where id = p_sale_id
  ) then
    raise exception 'Sale not found';
  end if;

  update public.sales
  set customer_id = p_customer_id,
      total_price = p_total_price
  where id = p_sale_id;

  delete from public.sale_items
  where sale_id = p_sale_id;

  insert into public.sale_items (
    sale_id,
    product_id,
    quantity,
    width,
    height,
    description,
    item_total,
    price_per_unit,
    cost_price
  )
  select
    p_sale_id,
    item.product_id,
    item.quantity,
    item.width,
    item.height,
    item.description,
    item.item_total,
    item.price_per_unit,
    item.cost_price
  from jsonb_to_recordset(p_items) as item(
    product_id bigint,
    quantity numeric,
    width numeric,
    height numeric,
    description text,
    item_total numeric,
    price_per_unit numeric,
    cost_price numeric
  );

  return jsonb_build_object(
    'sale_id', p_sale_id,
    'total_price', p_total_price
  );
end;
$$;

grant execute on function public.create_sale_with_items(bigint, numeric, jsonb) to authenticated;
grant execute on function public.update_sale_with_items(bigint, bigint, numeric, jsonb) to authenticated;
