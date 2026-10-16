import bcrypt from "bcryptjs";

const COST = 10;

/** Restituisce l'hash bcrypt di un PIN o di una password. */
export async function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

/** Confronta un segreto in chiaro con il suo hash bcrypt. */
export async function verifySecret(plain: string, hash: string): Promise<boolean> {
  if (!isHashed(hash)) return false;
  return bcrypt.compare(plain, hash);
}

/** True se la stringa è già un hash bcrypt ($2a$, $2b$, $2y$). */
export function isHashed(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$/.test(value);
}

/** Genera un PIN numerico casuale di 6 cifre (crittograficamente sicuro). */
export function generatePin(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 900000;
  return String(100000 + n);
}
