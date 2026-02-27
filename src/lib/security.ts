import 'server-only';

import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(nodeScrypt);

const HASH_PREFIX = 'scrypt';
const KEY_LENGTH = 64;

function safeStringCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export function isLegacyPlaintextPassword(storedPassword: string) {
  return !storedPassword.startsWith(`${HASH_PREFIX}$`);
}

export async function hashPassword(rawPassword: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = (await scrypt(rawPassword, salt, KEY_LENGTH)) as Buffer;
  return `${HASH_PREFIX}$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(rawPassword: string, storedPassword: string) {
  if (!storedPassword) {
    return false;
  }

  if (isLegacyPlaintextPassword(storedPassword)) {
    return safeStringCompare(rawPassword, storedPassword);
  }

  const [prefix, salt, expectedHash] = storedPassword.split('$');
  if (!prefix || !salt || !expectedHash || prefix !== HASH_PREFIX) {
    return false;
  }

  const derivedKey = (await scrypt(rawPassword, salt, KEY_LENGTH)) as Buffer;
  const expectedBuffer = Buffer.from(expectedHash, 'hex');

  if (derivedKey.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedBuffer);
}
