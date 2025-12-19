import { randomBytes } from 'crypto';
import { ApiKeyType } from './schema';
import { hash } from 'bcryptjs';

export const generateApiKey = async (keyType: ApiKeyType) => {
  const prefix = keyType === 'secret' ? 'sk_' : 'pk_';
  const randomPart = randomBytes(24).toString('base64url');
  const plainTextKey = `${prefix}_${randomPart}`;
  const keyHash = await hash(plainTextKey, 10);
  const keyPrefix = plainTextKey.slice(0, 12);

  return {
    keyHash,
    plainTextKey,
    keyPrefix,
  };
};
