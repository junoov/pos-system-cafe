const encoder = new TextEncoder();

export const SESSION_COOKIE_NAME = 'session_token';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type SessionPayload = {
  uid: number;
  exp: number;
};

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  const encoded = btoa(binary);
  return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (secret?.trim()) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET harus diisi pada environment production.');
  }

  return 'dev-only-session-secret-change-me';
}

async function importSigningKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function signValue(value: string) {
  const key = await importSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSessionToken(userId: number) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    uid: userId,
    exp: now + SESSION_MAX_AGE_SECONDS,
  };

  const payloadString = JSON.stringify(payload);
  const payloadBase64 = bytesToBase64Url(encoder.encode(payloadString));
  const signature = await signValue(payloadBase64);

  return `${payloadBase64}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const [payloadBase64, providedSignature] = token.split('.');

  if (!payloadBase64 || !providedSignature) {
    return null;
  }

  const key = await importSigningKey();
  const signatureBytes = base64UrlToBytes(providedSignature);
  const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(payloadBase64));

  if (!valid) {
    return null;
  }

  try {
    const payloadBytes = base64UrlToBytes(payloadBase64);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const parsed = JSON.parse(payloadJson) as Partial<SessionPayload>;

    const uid = Number(parsed.uid);
    const exp = Number(parsed.exp);

    if (!Number.isInteger(uid) || uid <= 0) {
      return null;
    }

    if (!Number.isInteger(exp) || exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { uid, exp };
  } catch {
    return null;
  }
}
