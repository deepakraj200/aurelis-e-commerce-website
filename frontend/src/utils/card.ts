export const formatCardNumber = (value: string) =>
  value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();

export const formatExpiry = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export const luhnCheck = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    double = !double;
  }
  return sum % 10 === 0;
};

export const expiryValid = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;
  const expiry = new Date(year, month, 0, 23, 59, 59);
  return expiry.getTime() > Date.now();
};

export const validateTestCard = (card: {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
}) => {
  if (!luhnCheck(card.number)) return 'Enter a valid card number (test card: 4242 4242 4242 4242).';
  if (!card.name.trim()) return 'Enter the name on the card.';
  if (!expiryValid(card.expiry)) return 'Enter a valid future expiry date, such as 12/34.';
  if (!/^\d{3,4}$/.test(card.cvc)) return 'Enter a valid CVC.';
  return null;
};
