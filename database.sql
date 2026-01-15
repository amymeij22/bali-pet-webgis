create table public.forecast_batches (
  id uuid not null default gen_random_uuid (),
  produced_at timestamp with time zone not null,
  is_latest boolean not null default false,
  forecast_start timestamp with time zone not null,
  forecast_end timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  constraint forecast_batches_pkey primary key (id),
  constraint forecast_batches_produced_at_key unique (produced_at)
) TABLESPACE pg_default;

create unique INDEX IF not exists only_one_latest on public.forecast_batches using btree (is_latest) TABLESPACE pg_default
where
  is_latest;

create index IF not exists idx_batches_produced_at on public.forecast_batches using btree (produced_at desc) TABLESPACE pg_default;

create trigger forecast_batches_set_latest_on_insert BEFORE INSERT on forecast_batches for EACH row
execute FUNCTION forecast_batches_set_latest ();

create trigger forecast_batches_set_latest_on_update BEFORE
update OF is_latest on forecast_batches for EACH row
execute FUNCTION forecast_batches_set_latest ();

create view public.latest_batch as
select
  id,
  produced_at,
  forecast_start,
  forecast_end
from
  forecast_batches
where
  is_latest = true;

create table public.thermal_categories (
  id uuid not null default gen_random_uuid (),
  category_key character varying(20) not null,
  category_name character varying(100) not null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint thermal_categories_pkey primary key (id),
  constraint thermal_categories_category_key_key unique (category_key)
) TABLESPACE pg_default;

create table public.villages (
  id uuid not null default gen_random_uuid (),
  village_name character varying(100) not null,
  destination_name character varying(120) null,
  kdepum_code character varying(20) not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint villages_pkey primary key (id),
  constraint villages_kdepum_code_key unique (kdepum_code),
  constraint villages_village_name_key unique (village_name)
) TABLESPACE pg_default;

create trigger villages_set_updated_at BEFORE
update on villages for EACH row
execute FUNCTION set_updated_at ();

create table public.weather_forecasts (
  id uuid not null default gen_random_uuid (),
  village_id uuid not null,
  batch_id uuid not null,
  forecast_time timestamp with time zone not null,
  temperature numeric(4, 1) not null,
  humidity numeric(4, 1) not null,
  wind_speed numeric(5, 2) not null,
  wind_direction character varying(10) not null,
  weather_condition character varying(100) not null,
  visibility character varying(50) not null,
  pet_value numeric(5, 2) not null,
  temperate_thermal_category uuid null,
  sub_tropic_thermal_category uuid null,
  created_at timestamp with time zone not null default now(),
  constraint weather_forecasts_pkey primary key (id),
  constraint uniq_village_batch_time unique (village_id, batch_id, forecast_time),
  constraint weather_forecasts_batch_id_fkey foreign KEY (batch_id) references forecast_batches (id) on delete CASCADE,
  constraint weather_forecasts_sub_tropic_thermal_category_fkey foreign KEY (sub_tropic_thermal_category) references thermal_categories (id) on delete set null,
  constraint weather_forecasts_temperate_thermal_category_fkey foreign KEY (temperate_thermal_category) references thermal_categories (id) on delete set null,
  constraint weather_forecasts_village_id_fkey foreign KEY (village_id) references villages (id) on delete CASCADE,
  constraint humidity_range check (
    (
      (humidity >= (0)::numeric)
      and (humidity <= (100)::numeric)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_forecasts_batch_time on public.weather_forecasts using btree (batch_id, forecast_time) TABLESPACE pg_default;

create index IF not exists idx_forecasts_village_batch on public.weather_forecasts using btree (village_id, batch_id) TABLESPACE pg_default;