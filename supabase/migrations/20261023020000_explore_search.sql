-- Explore (build kit Part 5): public search over listed items, FR-SR-01.
--
-- 1. The launch categories gain Electronics and Camping and Outdoor
--    (MASTER-PLAN decision 4). Categories become readable by everyone, so the
--    Explore chips and filters can list them.
-- 2. search_listings() is the only way signed-out visitors read items. It
--    returns public, unarchived items with what a renter may see before a
--    booking: name, category, town, price, deposit, photo and free units. Never
--    the business name, phone or address (build kit rule 8, FR-PV-01).
--    Free units come from the item's calendar (bookings that hold stock, plus
--    the item's turnaround days), the same rule as item_availability().

insert into public.categories (slug, name, sort_order) values
  ('electronics', 'Electronics', 40),
  ('camping-outdoor', 'Camping and Outdoor', 50)
on conflict (slug) do nothing;

-- Signed-in people could already read them (20261006000000_phase1_core.sql).
create policy "visitors read categories" on public.categories
  for select to anon using (true);
grant select on public.categories to anon;

create function public.search_listings(
  p_q text default null,
  p_town text default null,
  p_from date default null,
  p_to date default null,
  p_category text default null,
  p_max_price numeric default null,
  p_only_free boolean default false,
  p_sort text default 'recommended',
  p_limit integer default 12,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  -- Typed words, with LIKE's wildcards made literal.
  v_q text := nullif(replace(replace(replace(trim(p_q), '\', '\\'), '%', '\%'), '_', '\_'), '');
  v_town text := nullif(trim(p_town), '');
  v_limit integer := least(greatest(coalesce(p_limit, 12), 1), 48);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_result jsonb;
begin
  if (p_from is null) <> (p_to is null) then
    raise exception 'Choose both dates';
  end if;
  if p_to < p_from or p_to - p_from > 90 then
    raise exception 'Choose dates at most 90 days apart';
  end if;

  with matches as (
    select
      i.id, i.name, i.category, c.name as category_name, i.daily_price, i.deposit,
      i.photo_path, i.created_at,
      -- The searched town when the business serves it, otherwise its first town.
      coalesce(
        (select t from unnest(b.towns) as t where lower(t) = lower(v_town) limit 1),
        b.towns[1]
      ) as town,
      case when p_from is null then null else
        (i.quantity_owned - i.units_out_of_service) - coalesce((
          select max(bu.booked)
          from public._booked_units(array[i.id], p_from, p_to + i.turnaround_days) bu
        ), 0)
      end as free_units
    from public.items i
    join public.businesses b on b.id = i.business_id
    join public.categories c on c.slug = i.category
    where i.is_public
      and not i.archived
      and (p_category is null or i.category = p_category)
      and (p_max_price is null or i.daily_price <= p_max_price)
      and (v_town is null or exists (select 1 from unnest(b.towns) as t where lower(t) = lower(v_town)))
      and (v_q is null
           or i.name ilike '%' || v_q || '%'
           or i.description ilike '%' || v_q || '%'
           or c.name ilike '%' || v_q || '%')
  ),
  kept as (
    select * from matches
    where not (p_only_free and coalesce(free_units, 0) < 1)
  )
  select jsonb_build_object(
    'total', (select count(*) from kept),
    'items', coalesce((
      select jsonb_agg(to_jsonb(page) - 'ord' order by page.ord)
      from (
        select k.id, k.name, k.category, k.category_name, k.daily_price, k.deposit,
               k.photo_path, k.town,
               -- Null when no dates were searched; never below 0.
               case when k.free_units is not null then greatest(k.free_units, 0) end as free_units,
               row_number() over (order by
                 case when p_sort = 'price_asc' then k.daily_price end asc nulls last,
                 case when p_sort = 'price_desc' then k.daily_price end desc nulls last,
                 -- Recommended: free on the searched dates first, then newest.
                 case when p_sort = 'recommended' then (coalesce(k.free_units, 1) > 0) end desc nulls last,
                 k.created_at desc,
                 k.id
               ) as ord
        from kept k
        order by ord
        limit v_limit offset v_offset
      ) page
    ), '[]'::jsonb)
  )
  into v_result;

  return v_result;
end;
$$;

revoke execute on function public.search_listings(text, text, date, date, text, numeric, boolean, text, integer, integer) from public;
grant execute on function public.search_listings(text, text, date, date, text, numeric, boolean, text, integer, integer) to anon, authenticated;
