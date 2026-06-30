import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type Language = 'id' | 'en';

type Dict = Record<string, string>;

const DICTS: Record<Language, Dict> = {
  id: {
    lang_label: 'Bahasa',
    lang_id: 'Indonesia',
    lang_en: 'English',

    pet_standard_label: 'Standar PET',
    pet_standard_temperate: 'Iklim Sedang',
    pet_standard_tropical: 'Tropis / Subtropis',

    time_produced: 'Waktu Produksi',
    wita: 'WITA (UTC+8)',
    today: 'Hari Ini',

    // a11y / controls
    sidebar_toggle_aria: 'Tampilkan/sembunyikan sidebar',
    time_prev_aria: 'Waktu sebelumnya',
    time_next_aria: 'Waktu berikutnya',
    play_aria: 'Putar',
    stop_aria: 'Berhenti',
    pet_info_aria: 'Informasi tentang PET',
    pet_view_legend_aria: 'Lihat legenda PET',
    faq_title: 'Pertanyaan Umum (FAQ)',
    language_select_aria: 'Pilih bahasa',
    pet_standard_aria: 'Pilih standar PET',
    time_slider_aria: 'Geser waktu prakiraan',

    // PWA install prompt
    pwa_install_title: 'Install Aplikasi',
    pwa_install_desc_default: 'Install aplikasi untuk akses lebih cepat dan pengalaman offline',
    pwa_install_desc_ios: 'Tambahkan ke Home Screen untuk akses lebih cepat',
    pwa_install_desc_other: 'Install aplikasi via menu browser untuk akses lebih cepat',
    pwa_install_action_install: 'Install',
    pwa_install_action_how: 'Cara Install',

    data_sources: 'Sumber Data',
    view_data_sources: 'Lihat sumber data',
    data_source_bmkg:
      'Data Prakiraan Cuaca Terbuka Badan Meteorologi Klimatologi dan Geofisika',
    data_source_big: 'Batas Administrasi Desa/Kelurahan Badan Informasi Geospasial',
    data_source_disparda: 'Daya Tarik Wisata Dinas Pariwisata Provinsi Bali',
    data_source_kemendagri:
      'Kode, Data Wilayah Administrasi Pemerintahan, dan Pulau Menteri Dalam Negeri',

    destinations_header: 'Destinasi Wisata',
    destinations_count_suffix: 'lokasi wisata di Bali',
    destinations_footer_hint: 'Klik destinasi untuk melihat detail',
    destinations_toggle: 'DESTINASI',
    destinations_search_placeholder: 'Cari destinasi...',
    destinations_group_toggle: 'Kelompokkan',
    destinations_grouped_by: 'Dikelompokkan',

    not_available: 'Belum tersedia',
    close: 'Tutup',

    thermal_comfort_title_line1:
      'Peta Prediksi Kenyamanan Termal Destinasi Wisata di Provinsi Bali',
    thermal_comfort_title_line2:
      'Berdasarkan Indeks Physiological Equivalent Temperature (PET)',

    popup_thermal_comfort: 'Kenyamanan Termal (PET)',
    popup_destinations_title: 'Destinasi Wisata',
    popup_select_destination_aria: 'Pilih destinasi wisata',
    popup_close_aria: 'Tutup',
    popup_prev_time_aria: 'Waktu sebelumnya',
    popup_next_time_aria: 'Waktu berikutnya',
    popup_no_forecast_title: 'Belum tersedia',
    popup_no_forecast_desc: 'Data prakiraan belum tersedia',
    popup_tab_current: 'Detail Cuaca',
    popup_tab_trend: 'Tren Kenyamanan',
    popup_weather_temp: 'Suhu Udara',
    popup_weather_humidity: 'Kelembapan',
    popup_weather_wind_speed: 'Kec. Angin',
    popup_weather_wind_dir: 'Arah Angin',
    popup_weather_condition: 'Kondisi',
    popup_weather_visibility: 'Jarak Pandang',
    popup_visitor_note_title: 'Saran untuk Wisatawan',

    notif_processing: 'Memproses...',
    notif_active: 'Notifikasi Aktif',
    notif_enable: 'Aktifkan Notifikasi',
    notif_blocked: 'Izin Notif Ditolak',
    notif_aria_disable: 'Matikan notifikasi',
    notif_aria_enable: 'Aktifkan notifikasi',
    notif_aria_blocked: 'Notifikasi diblokir oleh browser',

    toast_notif_disabled_title: 'Notifikasi Dimatikan',
    toast_notif_disabled_desc: 'Anda tidak akan menerima notifikasi prakiraan baru',
    toast_failed_title: 'Gagal',
    toast_failed_disable_desc: 'Gagal mematikan notifikasi',
    toast_perm_denied_title: 'Izin Ditolak',
    toast_perm_denied_desc: 'Silakan aktifkan izin notifikasi di pengaturan browser',
    toast_perm_required_desc: 'Notifikasi memerlukan izin untuk berfungsi',
    toast_notif_enabled_title: 'Notifikasi Diaktifkan',
    toast_notif_enabled_desc: 'Anda akan menerima notifikasi saat prakiraan baru tersedia',
    toast_failed_enable_desc: 'Gagal mengaktifkan notifikasi. Pastikan VAPID key sudah dikonfigurasi',
    toast_error_title: 'Error',
    toast_error_desc: 'Terjadi kesalahan saat mengubah pengaturan notifikasi',
  },
  en: {
    lang_label: 'Language',
    lang_id: 'Indonesian',
    lang_en: 'English',

    pet_standard_label: 'PET standard',
    pet_standard_temperate: 'Temperate',
    pet_standard_tropical: 'Tropical / Subtropical',

    time_produced: 'Produced at',
    wita: 'UTC+8 (WITA)',
    today: 'Today',

    // a11y / controls
    sidebar_toggle_aria: 'Toggle sidebar',
    time_prev_aria: 'Previous time',
    time_next_aria: 'Next time',
    play_aria: 'Play',
    stop_aria: 'Stop',
    pet_info_aria: 'About PET',
    pet_view_legend_aria: 'View PET legend',
    faq_title: 'Frequently Asked Questions (FAQ)',
    language_select_aria: 'Select language',
    pet_standard_aria: 'Select PET standard',
    time_slider_aria: 'Slide forecast time',

    // PWA install prompt
    pwa_install_title: 'Install app',
    pwa_install_desc_default: 'Install the app for faster access and offline experience',
    pwa_install_desc_ios: 'Add to Home Screen for faster access',
    pwa_install_desc_other: 'Install via your browser menu for faster access',
    pwa_install_action_install: 'Install',
    pwa_install_action_how: 'How to install',

    data_sources: 'Data sources',
    view_data_sources: 'View data sources',
    data_source_bmkg: 'Open weather forecast data from BMKG (Meteorology, Climatology, and Geophysics Agency)',
    data_source_big: 'Village/urban village administrative boundaries from BIG (Geospatial Information Agency)',
    data_source_disparda: 'Tourism attractions data from the Bali Provincial Tourism Office',
    data_source_kemendagri:
      'Codes, administrative areas data, and islands from the Ministry of Home Affairs',

    destinations_header: 'Tourism destinations',
    destinations_count_suffix: 'tourism locations in Bali',
    destinations_footer_hint: 'Click a destination to view details',
    destinations_toggle: 'DESTINATIONS',
    destinations_search_placeholder: 'Search destinations...',
    destinations_group_toggle: 'Group',
    destinations_grouped_by: 'Grouped',

    not_available: 'Not available',
    close: 'Close',

    thermal_comfort_title_line1:
      'Thermal Comfort Forecast Map for Tourism Destinations in Bali Province',
    thermal_comfort_title_line2:
      'Based on the Physiological Equivalent Temperature (PET) Index',

    popup_thermal_comfort: 'Thermal Comfort (PET)',
    popup_destinations_title: 'Tourism destination',
    popup_select_destination_aria: 'Select tourism destination',
    popup_close_aria: 'Close',
    popup_prev_time_aria: 'Previous time',
    popup_next_time_aria: 'Next time',
    popup_no_forecast_title: 'Not available',
    popup_no_forecast_desc: 'Forecast data is not available yet',
    popup_tab_current: 'Weather Details',
    popup_tab_trend: 'Comfort Trend',
    popup_weather_temp: 'Air temperature',
    popup_weather_humidity: 'Humidity',
    popup_weather_wind_speed: 'Wind speed',
    popup_weather_wind_dir: 'Wind direction',
    popup_weather_condition: 'Condition',
    popup_weather_visibility: 'Visibility',
    popup_visitor_note_title: 'Advice for visitors',

    notif_processing: 'Processing...',
    notif_active: 'Notifications on',
    notif_enable: 'Enable notifications',
    notif_blocked: 'Permission blocked',
    notif_aria_disable: 'Disable notifications',
    notif_aria_enable: 'Enable notifications',
    notif_aria_blocked: 'Notifications are blocked by the browser',

    toast_notif_disabled_title: 'Notifications disabled',
    toast_notif_disabled_desc: 'You will not receive new forecast notifications',
    toast_failed_title: 'Failed',
    toast_failed_disable_desc: 'Failed to disable notifications',
    toast_perm_denied_title: 'Permission denied',
    toast_perm_denied_desc: 'Please enable notification permission in your browser settings',
    toast_perm_required_desc: 'Notifications require permission to work',
    toast_notif_enabled_title: 'Notifications enabled',
    toast_notif_enabled_desc: 'You will receive notifications when a new forecast is available',
    toast_failed_enable_desc: 'Failed to enable notifications. Ensure the VAPID key is configured',
    toast_error_title: 'Error',
    toast_error_desc: 'An error occurred while changing notification settings',
  },
};

function getInitialLanguage(): Language {
  const raw = (localStorage.getItem('webgis_lang') || '').toLowerCase();
  if (raw === 'en') return 'en';
  return 'id';
}

type I18nContextValue = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof DICTS['id']) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, _setLang] = useState<Language>(() => getInitialLanguage());

  const setLang = useCallback((next: Language) => {
    _setLang(next);
    localStorage.setItem('webgis_lang', next);
  }, []);

  const t = useCallback(
    (key: keyof typeof DICTS['id']) => {
      const dict = DICTS[lang];
      return dict[key] ?? DICTS.id[key] ?? String(key);
    },
    [lang]
  );

  const value = useMemo<I18nContextValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

