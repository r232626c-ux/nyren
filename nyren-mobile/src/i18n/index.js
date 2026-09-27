import en from './en';

const strings = { en };
const locale = 'en';

export function t(key, params) {
  const s = (strings[locale] && strings[locale][key]) || key;
  if (!params) return s;
  return Object.keys(params).reduce((acc, k) => acc.replace(`{${k}}`, params[k]), s);
}

export default { t };
