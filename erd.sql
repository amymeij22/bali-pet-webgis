// WebGIS Thermal Comfort Forecast - Database ERD
// Format: dbdiagram.io (https://dbdiagram.io)
// Generated from: db/schema.sql + db/push_notifications.sql
// 
// Cara menggunakan:
// 1. Buka https://dbdiagram.io
// 2. Copy-paste seluruh isi file ini ke editor
// 3. Klik "Generate" untuk melihat ERD diagram

// =====================================================
// Table: thermal_categories
// Lookup table untuk 9 kategori termal PET
// =====================================================
Table thermal_categories {
  id uuid [primary key]
  category_key varchar(20) [unique, not null]
  category_name varchar(100) [not null]
  created_at timestamptz
  
  Note: 'Lookup table untuk 9 kategori termal: very_hot, hot, warm, slight_warm, neutral, slight_cool, cool, cold, very_cold'
}

// =====================================================
// Table: villages
// Master data desa/kelurahan dengan kode KDEPUM
// =====================================================
Table villages {
  id uuid [primary key]
  village_name varchar(100) [unique, not null]
  kdepum_code varchar(20) [unique, not null]
  created_at timestamptz [not null]
  updated_at timestamptz [not null]
  
  Note: 'Master data desa/kelurahan. kdepum_code digunakan untuk mapping ke GeoJSON file statis. Satu desa bisa memiliki multiple destinasi wisata.'
}

// =====================================================
// Table: destinations
// Master data 49 destinasi wisata
// =====================================================
Table destinations {
  id uuid [primary key]
  village_id uuid [not null, ref: > villages.id]
  destination_name varchar(120) [not null]
  created_at timestamptz [not null]
  updated_at timestamptz [not null]
  
  Note: 'Master data 49 destinasi wisata. Relasi one-to-many dengan villages (satu desa bisa punya multiple destinasi). Unique constraint: (village_id, destination_name). ON DELETE CASCADE.'
}

// =====================================================
// Table: forecast_batches
// Batch produksi data prakiraan
// =====================================================
Table forecast_batches {
  id uuid [primary key]
  produced_at timestamptz [unique, not null]
  is_latest boolean [not null, default: false]
  forecast_start timestamptz [not null]
  forecast_end timestamptz [not null]
  created_at timestamptz [not null]
  
  Note: 'Batch produksi data. Hanya satu batch dengan is_latest = TRUE pada satu waktu (enforced via unique partial index dan trigger).'
}

// =====================================================
// Table: weather_forecasts
// Data prediksi cuaca & PET per desa, per waktu
// =====================================================
Table weather_forecasts {
  id uuid [primary key]
  village_id uuid [not null, ref: > villages.id]
  batch_id uuid [not null, ref: > forecast_batches.id]
  forecast_time timestamptz [not null]
  
  // Parameter cuaca
  temperature numeric(4,1) [not null]
  humidity numeric(4,1) [not null]
  wind_speed numeric(5,2) [not null]
  wind_direction varchar(10) [not null]
  weather_condition varchar(100) [not null]
  visibility varchar(50) [not null]
  
  // PET value
  pet_value numeric(5,2) [not null]
  
  // Kategori termal (dual reference untuk 2 standar)
  temperate_thermal_category uuid [ref: - thermal_categories.id]
  sub_tropic_thermal_category uuid [ref: - thermal_categories.id]
  
  created_at timestamptz [not null]
  
  Note: 'Data forecast per desa (village_id), bukan per destinasi. Jika satu desa punya multiple destinasi, semua destinasi menggunakan forecast yang sama. Unique constraint: (village_id, batch_id, forecast_time). Check constraint: humidity >= 0 AND humidity <= 100. ON DELETE CASCADE untuk village_id dan batch_id.'
}

// =====================================================
// Table: push_subscriptions
// Web Push subscriptions untuk notifikasi batch baru
// =====================================================
Table push_subscriptions {
  id uuid [primary key]
  endpoint text [unique, not null]
  p256dh text [not null]
  auth text [not null]
  user_agent text
  is_active boolean [not null, default: true]
  last_notified_batch_id uuid [ref: - forecast_batches.id]
  last_notified_at timestamptz
  created_at timestamptz [not null]
  updated_at timestamptz [not null]
  
  Note: 'Web Push API subscriptions. Setiap user yang enable notification akan punya entry di sini. Edge Function send-push-notification akan mengirim notifikasi ke semua active subscriptions saat batch baru tersedia. ON DELETE SET NULL untuk last_notified_batch_id.'
}

// =====================================================
// Relationship Notes
// =====================================================
// 1. villages (1) -> destinations (many): One-to-many
//    - Satu desa bisa memiliki multiple destinasi wisata
//    - Foreign key: destinations.village_id -> villages.id (ON DELETE CASCADE)
//
// 2. villages (1) -> weather_forecasts (many): One-to-many
//    - Forecast disimpan per desa, bukan per destinasi
//    - Foreign key: weather_forecasts.village_id -> villages.id (ON DELETE CASCADE)
//
// 3. forecast_batches (1) -> weather_forecasts (many): One-to-many
//    - Satu batch memiliki banyak forecast (per desa, per waktu)
//    - Foreign key: weather_forecasts.batch_id -> forecast_batches.id (ON DELETE CASCADE)
//
// 4. thermal_categories (1) -> weather_forecasts (many): One-to-many (dual reference)
//    - Setiap forecast memiliki 2 referensi kategori (temperate & tropis/subtropis)
//    - Foreign key: weather_forecasts.temperate_thermal_category -> thermal_categories.id (ON DELETE SET NULL)
//    - Foreign key: weather_forecasts.sub_tropic_thermal_category -> thermal_categories.id (ON DELETE SET NULL)
//
// 5. forecast_batches (1) -> push_subscriptions (many): One-to-many (optional)
//    - Tracking batch terakhir yang di-notify ke setiap subscription
//    - Foreign key: push_subscriptions.last_notified_batch_id -> forecast_batches.id (ON DELETE SET NULL)
