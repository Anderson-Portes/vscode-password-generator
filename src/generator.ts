export interface PasswordOptions {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
  excludeAmbiguous: boolean;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const AMBIGUOUS = /[0OIl1]/g;

export function generatePassword(options: PasswordOptions): string {
  let charset = '';

  if (options.includeUppercase) { charset += UPPERCASE; }
  if (options.includeLowercase) { charset += LOWERCASE; }
  if (options.includeNumbers)   { charset += NUMBERS; }
  if (options.includeSymbols)   { charset += SYMBOLS; }

  if (!charset) {
    throw new Error('At least one character set must be selected.');
  }

  if (options.excludeAmbiguous) {
    charset = charset.replace(AMBIGUOUS, '');
  }

  // Ensure at least one char from each selected set
  const required: string[] = [];
  if (options.includeUppercase) { required.push(pickRandom(options.excludeAmbiguous ? UPPERCASE.replace(AMBIGUOUS, '') : UPPERCASE)); }
  if (options.includeLowercase) { required.push(pickRandom(options.excludeAmbiguous ? LOWERCASE.replace(AMBIGUOUS, '') : LOWERCASE)); }
  if (options.includeNumbers)   { required.push(pickRandom(options.excludeAmbiguous ? NUMBERS.replace(AMBIGUOUS, '') : NUMBERS)); }
  if (options.includeSymbols)   { required.push(pickRandom(SYMBOLS)); }

  const remaining = options.length - required.length;
  const passwordChars = [...required];

  for (let i = 0; i < remaining; i++) {
    passwordChars.push(pickRandom(charset));
  }

  return shuffle(passwordChars).join('');
}

function pickRandom(str: string): string {
  return str[Math.floor(Math.random() * str.length)];
}

function shuffle(arr: string[]): string[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
