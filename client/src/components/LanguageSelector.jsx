import { Select } from 'antd';
import { LANGS, useLang } from '../i18n';

export default function LanguageSelector({ size = 'small' }) {
  const { lang, setLang } = useLang();
  return (
    <Select
      size={size}
      value={lang}
      onChange={setLang}
      options={LANGS}
      popupMatchSelectWidth={false}
      style={{ minWidth: 72 }}
    />
  );
}
