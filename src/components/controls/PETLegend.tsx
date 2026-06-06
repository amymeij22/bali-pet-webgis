import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Info } from 'lucide-react';
import {
  PET_COLORS,
  PET_RANGES,
} from '@/lib/pet';
import type { PETStandard, ThermalCategory } from '@/lib/pet';
import { useI18n } from '@/lib/i18n';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface PETLegendProps {
  standard: PETStandard;
  onStandardChange: (standard: PETStandard) => void;
}

const CATEGORY_ORDER: ThermalCategory[] = [
  'very_hot',
  'hot',
  'warm',
  'slight_warm',
  'neutral',
  'slight_cool',
  'cool',
  'cold',
  'very_cold',
];

export default function PETLegend({ standard, onStandardChange }: PETLegendProps) {
  const { lang, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const ranges = PET_RANGES[standard];

  const LegendContent = () => (
    <>
      {/* Header with Standard Selector */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-semibold text-foreground">{t('pet_standard_label')}</span>
          <button
            onClick={() => setIsInfoOpen(true)}
            className="p-1 rounded-full hover:bg-secondary/50 transition-colors"
            aria-label={t('pet_info_aria')}
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground hover:text-foreground transition-colors" />
          </button>
        </div>
      </div>

      {/* Standard Selector */}
      <Select value={standard} onValueChange={(v) => onStandardChange(v as PETStandard)}>
        <SelectTrigger className="w-full h-8 text-xs mb-3">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tropical">{t('pet_standard_tropical')}</SelectItem>
          <SelectItem value="temperate">{t('pet_standard_temperate')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Legend Items */}
      <div className="space-y-1">
        {CATEGORY_ORDER.map((category) => {
          const range = ranges[category];
          const color = PET_COLORS[category];

          return (
            <div key={category} className="legend-item">
              <div
                className="legend-color"
                style={{ backgroundColor: color }}
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs truncate block">
                  {lang === 'en' ? range.label : range.labelId}
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] text-muted-foreground font-mono whitespace-nowrap">
                {range.min === -999 ? (
                  `< ${range.max}`
                ) : range.max === 999 ? (
                  `> ${range.min}`
                ) : (
                  `${range.min} - ${range.max}`
                )}
                °C
              </span>
            </div>
          );
        })}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: Always visible */}
      <motion.div
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 0.15, duration: 0.14, ease: 'easeOut' }}
        className="hidden md:block fixed right-4 top-4 z-30 map-control w-[200px] pointer-events-auto"
      >
        <LegendContent />
      </motion.div>

      {/* Mobile: Overlay button */}
      <motion.button
        initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
        animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={reduceMotion ? { duration: 0 } : { delay: 0.15, duration: 0.12, ease: 'easeOut' }}
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed left-4 bottom-16 z-30 w-10 h-10 rounded-full glass-panel flex items-center justify-center"
        aria-label={t('pet_view_legend_aria')}
      >
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <span className="text-[8px] font-bold text-primary-foreground">PET</span>
        </div>
      </motion.button>

      {/* Mobile: Overlay modal */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.14, ease: 'easeOut' }}
            className="md:hidden fixed inset-0 z-50 flex items-start justify-end p-4 pt-28"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsMobileOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={reduceMotion ? { duration: 0 } : { duration: 0.14, ease: 'easeOut' }}
              className="relative z-10 map-control w-[200px]"
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute -top-2 -right-2 p-1.5 rounded-full bg-card border border-border shadow-sm hover:bg-secondary/50 transition-colors"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
              <LegendContent />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Popup - Centered Modal */}
      <AnimatePresence>
        {isInfoOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsInfoOpen(false);
            }}
            role="presentation"
            aria-modal="true"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setIsInfoOpen(false)}
            />

            {/* Popup Content */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
              animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 30 }}
              className="relative z-10 glass-panel rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] flex flex-col mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsInfoOpen(false)}
                className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-secondary/50 transition-colors z-10"
                  aria-label={t('close')}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>

              {/* Header */}
              <div className="px-2 sm:px-4 mb-4 flex-shrink-0">
                <h3 className="text-base sm:text-lg font-semibold text-foreground text-center">
                  {t('faq_title')}
                </h3>
              </div>

              {/* Scrollable Content */}
              <div className="px-2 sm:px-4 overflow-y-auto flex-1">
                <Accordion type="single" collapsible className="w-full space-y-0">
                  <AccordionItem value="item-1" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {'Apa itu kenyamanan termal?'}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {'Kenyamanan termal adalah tingkat "nyaman atau tidaknya" tubuh saat berada di luar ruang, yang dipengaruhi oleh suhu udara, kelembapan, angin, dan radiasi matahari. Di lingkungan terbuka seperti pantai atau taman, radiasi matahari sering membuat kondisi terasa lebih panas dibanding sekadar angka suhu udara.'}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {'Apa itu indeks PET dan bagaimana membacanya?'}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {'PET (Physiological Equivalent Temperature) adalah indeks biometeorologi dalam satuan °C yang merangkum pengaruh suhu, kelembapan, angin, dan radiasi menjadi "suhu ekuivalen" yang merepresentasikan beban panas yang dirasakan tubuh. Semakin tinggi nilai PET, umumnya semakin besar potensi stres panas; sebaliknya nilai rendah menunjukkan kondisi lebih sejuk/dingin.'}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {'Kenapa ada pilihan standar "Temperate" dan "(Sub)Tropis"?'}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {'Standar klasifikasi berbeda karena tingkat adaptasi (aklimatisasi) terhadap panas bisa berbeda antar kelompok. Pilihan Temperate cenderung lebih konservatif (lebih cepat memberi sinyal panas) dan dapat relevan bagi wisatawan dari iklim sedang, sedangkan (Sub)Tropis lebih representatif bagi pengguna yang terbiasa iklim panas-lembap. Mengganti standar akan mengubah legenda dan pewarnaan peta.'}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {'Bagaimana cara menggunakan peta dan slider waktu?'}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {'Peta menampilkan poligon wilayah dengan warna sesuai kelas PET pada waktu yang dipilih. Gunakan slider waktu untuk melihat perubahan prediksi setiap 3 jam hingga beberapa hari ke depan; saat waktu berubah, warna peta dan nilai pada lokasi ikut diperbarui sesuai prakiraan pada waktu tersebut.'}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {'Apa isi pop-up saat saya klik suatu lokasi?'}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {'Pop-up menampilkan nilai PET, kelas kenyamanan termal, dan parameter cuaca pendukung (misalnya suhu udara, kelembapan, angin, kondisi cuaca) untuk waktu prakiraan yang sedang dipilih. Informasi ini membantu memahami "kenapa" suatu lokasi tampak lebih panas/sejuk pada peta.'}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {'Seberapa sering data diperbarui dan apa itu "waktu produksi"?'}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {'Data diperbarui secara berkala mengikuti pembaruan prakiraan BMKG, lalu diproses menjadi satu "batch" (paket prediksi terbaru). WebGIS menampilkan waktu produksi terbaru sehingga informasi yang Anda lihat merupakan hasil pemrosesan prakiraan paling mutakhir pada saat itu.'}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-7" className="border-b border-border/50">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {'Apakah informasi ini bisa dijadikan acuan medis atau rekomendasi aktivitas?'}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {'Tidak. Informasi pada WebGIS bersifat informatif dan interpretatif untuk membantu memahami kondisi termal lingkungan, bukan diagnosis medis maupun rekomendasi perilaku spesifik. Kondisi kenyamanan tiap orang dapat berbeda, sehingga keputusan aktivitas tetap disesuaikan dengan kondisi dan kebutuhan masing-masing.'}
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-8" className="border-b-0">
                    <AccordionTrigger className="text-xs sm:text-sm font-medium text-left py-3">
                      {'Apa fungsi PWA dan notifikasi?'}
                    </AccordionTrigger>
                    <AccordionContent className="text-xs sm:text-sm leading-relaxed text-justify pb-3">
                      {'PWA memungkinkan WebGIS digunakan lebih praktis di perangkat pengguna seperti aplikasi. Notifikasi bersifat opsional (opt-in) dan hanya memberi tahu saat prediksi/batch terbaru tersedia, agar Anda tidak perlu mengecek manual.'}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
