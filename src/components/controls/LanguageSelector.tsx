import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useI18n } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import { Languages } from 'lucide-react';

export default function LanguageSelector() {
  const { lang, setLang, t } = useI18n();

  return (
    <Select
      value={lang}
      onValueChange={(v) => {
        if (v === 'id' || v === 'en') setLang(v satisfies Language);
      }}
    >
      <SelectTrigger className="h-7 w-[110px] px-2 text-[10px] sm:text-xs">
        <div className="flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5 text-muted-foreground" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="id">{t('lang_id')}</SelectItem>
        <SelectItem value="en">{t('lang_en')}</SelectItem>
      </SelectContent>
    </Select>
  );
}

