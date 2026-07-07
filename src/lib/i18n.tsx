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
    faq_q1: 'Apa itu kenyamanan termal?',
    faq_a1: 'Kenyamanan termal adalah tingkat "nyaman atau tidaknya" tubuh saat berada di luar ruang, yang dipengaruhi oleh suhu udara, kelembapan, angin, dan radiasi matahari. Di lingkungan terbuka seperti pantai atau taman, radiasi matahari sering membuat kondisi terasa lebih panas dibanding sekadar angka suhu udara.',
    faq_q2: 'Apa itu indeks PET dan bagaimana membacanya?',
    faq_a2: 'PET (Physiological Equivalent Temperature) adalah indeks biometeorologi dalam satuan °C yang merangkum pengaruh suhu, kelembapan, angin, dan radiasi menjadi "suhu ekuivalen" yang merepresentasikan beban panas yang dirasakan tubuh. Semakin tinggi nilai PET, umumnya semakin besar potensi stres panas; sebaliknya nilai rendah menunjukkan kondisi lebih sejuk/dingin.',
    faq_q3: 'Kenapa ada pilihan standar "Temperate" dan "(Sub)Tropis"?',
    faq_a3: 'Standar klasifikasi berbeda karena tingkat adaptasi (aklimatisasi) terhadap panas bisa berbeda antar kelompok. Pilihan Temperate cenderung lebih konservatif (lebih cepat memberi sinyal panas) dan dapat relevan bagi wisatawan dari iklim sedang, sedangkan (Sub)Tropis lebih representatif bagi pengguna yang terbiasa iklim panas-lembap. Mengganti standar akan mengubah legenda dan pewarnaan peta.',
    faq_q4: 'Bagaimana cara menggunakan peta dan slider waktu?',
    faq_a4: 'Peta menampilkan poligon wilayah dengan warna sesuai kelas PET pada waktu yang dipilih. Gunakan slider waktu untuk melihat perubahan prediksi setiap 3 jam hingga beberapa hari ke depan; saat waktu berubah, warna peta dan nilai pada lokasi ikut diperbarui sesuai prakiraan pada waktu tersebut.',
    faq_q5: 'Apa isi pop-up saat saya klik suatu lokasi?',
    faq_a5: 'Pop-up menampilkan nilai PET, kelas kenyamanan termal, dan parameter cuaca pendukung (misalnya suhu udara, kelembapan, angin, kondisi cuaca) untuk waktu prakiraan yang sedang dipilih. Informasi ini membantu memahami "kenapa" suatu lokasi tampak lebih panas/sejuk pada peta.',
    faq_q6: 'Seberapa sering data diperbarui dan apa itu "waktu produksi"?',
    faq_a6: 'BMKG memperbarui data prakiraan dua kali sehari. Karena data baru tidak selalu langsung tersedia, sistem memeriksanya beberapa kali agar tidak melewatkan pembaruan. "Waktu produksi" adalah waktu saat BMKG membuat paket prakiraan tersebut, bukan waktu sistem mengambil datanya.',
    faq_q7: 'Apakah informasi ini bisa dijadikan acuan medis atau rekomendasi aktivitas?',
    faq_a7: 'Tidak. Informasi pada WebGIS bersifat informatif dan interpretatif untuk membantu memahami kondisi termal lingkungan, bukan diagnosis medis maupun rekomendasi perilaku spesifik. Kondisi kenyamanan tiap orang dapat berbeda, sehingga keputusan aktivitas tetap disesuaikan dengan kondisi dan kebutuhan masing-masing.',
    faq_q8: 'Apa fungsi PWA dan notifikasi?',
    faq_a8: 'PWA memungkinkan WebGIS digunakan lebih praktis di perangkat pengguna seperti aplikasi. Notifikasi bersifat opsional (opt-in) dan hanya memberi tahu saat prediksi/batch terbaru tersedia, agar Anda tidak perlu mengecek manual.',
    faq_q9: 'Mengapa warna atau tingkat kenyamanan di setiap lokasi bisa berbeda?',
    faq_a9: 'Setiap lokasi memiliki kondisi prakiraan cuaca yang berbeda, seperti suhu, kelembapan, kecepatan angin, dan radiasi matahari. Perbedaan tersebut menghasilkan nilai PET yang berbeda sehingga tingkat kenyamanan termalnya juga dapat berbeda.',
    faq_q10: 'Mengapa nilai PET bisa lebih tinggi daripada suhu udara?',
    faq_a10: 'PET tidak hanya mempertimbangkan suhu udara, tetapi juga kelembapan, angin, dan radiasi matahari. Karena itu, nilai PET dapat lebih tinggi atau lebih rendah daripada suhu udara yang sebenarnya.',
    faq_q11: 'Mengapa data yang ditampilkan berbeda dengan kondisi cuaca yang saya rasakan saat ini?',
    faq_a11: 'Informasi yang ditampilkan berasal dari data prakiraan BMKG. Kondisi cuaca di lapangan dapat berbeda karena perubahan atmosfer yang terjadi setelah prakiraan dibuat.',
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
    faq_q1: 'What is thermal comfort?',
    faq_a1: 'Thermal comfort is the level of "comfort or discomfort" of the body when outdoors, influenced by air temperature, humidity, wind, and solar radiation. In open environments like beaches or parks, solar radiation often makes conditions feel hotter than just the air temperature reading.',
    faq_q2: 'What is the PET index and how to read it?',
    faq_a2: 'PET (Physiological Equivalent Temperature) is a biometeorological index in °C that summarizes the effects of temperature, humidity, wind, and radiation into an "equivalent temperature" representing the thermal load felt by the body. The higher the PET value, generally the greater the potential for heat stress; conversely, low values indicate cooler/colder conditions.',
    faq_q3: 'Why are there "Temperate" and "(Sub)Tropical" standard options?',
    faq_a3: 'Classification standards differ because the level of adaptation (acclimatization) to heat can vary between groups. The Temperate option tends to be more conservative (signaling heat faster) and can be relevant for tourists from temperate climates, while (Sub)Tropical is more representative of users accustomed to warm-humid climates. Changing the standard will alter the legend and map coloring.',
    faq_q4: 'How do I use the map and time slider?',
    faq_a4: 'The map displays region polygons colored according to the PET class at the selected time. Use the time slider to view forecast changes every 3 hours up to several days ahead; as the time changes, the map colors and values at locations are updated according to the forecast for that time.',
    faq_q5: 'What is inside the pop-up when I click a location?',
    faq_a5: 'The pop-up displays the PET value, thermal comfort class, and supporting weather parameters (e.g., air temperature, humidity, wind, weather conditions) for the currently selected forecast time. This information helps explain "why" a location appears hotter/cooler on the map.',
    faq_q6: 'How often is the data updated and what is "production time"?',
    faq_a6: 'BMKG updates forecast data twice a day. Since new data is not always immediately available, the system checks it multiple times to ensure updates are not missed. "Production time" is the time when BMKG generated the forecast package, not the time the system fetched the data.',
    faq_q7: 'Can this information be used as a medical reference or activity recommendation?',
    faq_a7: 'No. The information on WebGIS is informative and interpretative to help understand environmental thermal conditions, not a medical diagnosis or specific behavioral recommendation. Each person\'s comfort condition may differ, so activity decisions should still be adjusted to individual conditions and needs.',
    faq_q8: 'What is the function of the PWA and notifications?',
    faq_a8: 'The PWA allows WebGIS to be used more conveniently on users\' devices like an app. Notifications are optional (opt-in) and only alert you when the latest prediction/batch is available, so you do not need to check manually.',
    faq_q9: 'Why does the color or comfort level differ at each location?',
    faq_a9: 'Each location has different forecast weather conditions, such as temperature, humidity, wind speed, and solar radiation. These differences result in different PET values, which can lead to different thermal comfort levels.',
    faq_q10: 'Why can the PET value be higher than the air temperature?',
    faq_a10: 'PET considers not only air temperature, but also humidity, wind, and solar radiation. Therefore, the PET value can be higher or lower than the actual air temperature.',
    faq_q11: 'Why is the displayed data different from the weather conditions I feel right now?',
    faq_a11: 'The displayed information comes from BMKG forecast data. Actual weather conditions on the ground may differ due to atmospheric changes occurring after the forecast was generated.',
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

