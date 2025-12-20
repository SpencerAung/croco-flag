export function sanitizeUser<T extends { passwordHash?: string }>(user: T) {
  const { passwordHash, ...rest } = user;
  return rest;
}
