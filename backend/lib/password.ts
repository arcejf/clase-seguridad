import bcrypt from 'bcrypt';

// Único lugar del proyecto que sabe de bcrypt: el resto solo llama a
// hash()/verify(), así el algoritmo se puede cambiar acá el día de mañana.

// Cost factor: más alto = más lento de fuerza-bruta-ar, pero más lento
// también en cada login. 12 es un piso razonable en 2026.
const SALT_ROUNDS = 12;

/**
 * bcrypt guarda el salt *dentro* del propio hash, no hay que administrarlo
 * aparte. Por eso hashear la misma contraseña dos veces da resultados
 * DISTINTOS, evitando rainbow tables precomputadas contra la tabla de usuarios.
 */
export function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

/**
 * bcrypt.compare es a tiempo aproximadamente constante; nunca comparar
 * hashes con `===`.
 */
export function verifyPassword(plainTextPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}
