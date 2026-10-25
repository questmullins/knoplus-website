const encoder = new TextEncoder();
const hex = bytes => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2,'0')).join('');
export const randomToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));
export const digest = async value => hex(await crypto.subtle.digest('SHA-256', encoder.encode(value)));
export async function passwordHash(password, salt = randomToken()) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:encoder.encode(salt),iterations:100000}, key, 256);
  return salt + ':' + hex(bits);
}
export async function verifyPassword(password, stored) {
  const result = await passwordHash(password, stored.split(':')[0]);
  let difference = result.length ^ stored.length;
  for (let i = 0; i < result.length; i++) difference |= result.charCodeAt(i) ^ (stored.charCodeAt(i) || 0);
  return difference === 0;
}
export const cookie = (value, seconds = 43200) => '__Host-kno_client=' + value + '; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=' + seconds;
export async function sessionUser(request, db) {
  const token = request.headers.get('cookie')?.match(/(?:^|;\s*)__Host-kno_client=([a-f0-9]{64})(?:;|$)/)?.[1];
  if (!token) return null;
  return db.prepare('SELECT u.id,u.email,u.role FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=? AND s.expires>? AND u.disabled=0').bind(await digest(token),Date.now()).first();
}
export async function rateLimit(db, key, max) {
  const now = Date.now();
  const result = await db.prepare('INSERT INTO limits(key,count,expires) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires<? THEN 1 ELSE count+1 END, expires=CASE WHEN expires<? THEN excluded.expires ELSE expires END RETURNING count').bind(await digest(key),now+900000,now,now).first();
  return result.count <= max;
}
