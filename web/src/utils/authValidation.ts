export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 256;
}

export function validatePassword(password: string): boolean {
  return password.length >= 8;
}
