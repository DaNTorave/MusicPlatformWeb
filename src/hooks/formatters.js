// Соответствие серверных типов русскоязычным названиям
const ENTITY_TYPE_LABELS = {
  TRACK: 'сингл',
  ALBUM: 'альбом',
  ARTIST: 'исполнитель',
};

// Функция преобразования типа с сервера в читаемый вид
export function formatEntityType(type) {
  if (!type) return '';
  const normalizedKey = String(type).trim().toUpperCase();
  return ENTITY_TYPE_LABELS[normalizedKey] || type;
}