const emailComPattern = /^[^\s@]+@[^\s@]+\.com$/i;

export function onlyDigits(value: string, maxLength = 10) {
  return value.replace(/\D/g, '').slice(0, maxLength);
}

export function onlyDecimal(value: string) {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '');
  const [whole = '', ...decimalParts] = normalized.split('.');
  return decimalParts.length ? `${whole}.${decimalParts.join('')}` : whole;
}

export function isValidPhone(value: string) {
  return /^\d{10}$/.test(value);
}

export function isComEmail(value: string) {
  return emailComPattern.test(value.trim());
}
