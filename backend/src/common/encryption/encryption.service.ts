import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits

  private getKey(): Buffer {
    const rawKey = process.env.AES_256_KEY;
    if (!rawKey || rawKey.length < 64) {
      throw new Error('AES_256_KEY inválida: deve ter 64 caracteres hex (32 bytes).');
    }
    return Buffer.from(rawKey, 'hex');
  }

  /**
   * Criptografa um valor com AES-256-GCM.
   * Retorna string no formato: iv:authTag:ciphertext (tudo em hex)
   */
  encrypt(plaintext: string): string {
    const key = this.getKey();
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, key, iv) as any;

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  /**
   * Decriptografa um valor criptografado com AES-256-GCM.
   */
  decrypt(encryptedValue: string): string {
    const key = this.getKey();
    const [ivHex, authTagHex, ciphertext] = encryptedValue.split(':');

    if (!ivHex || !authTagHex || !ciphertext) {
      throw new Error('Formato inválido de dado criptografado.');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(this.algorithm, key, iv) as any;
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Criptografa dados com uma chave mestra (ALE - Application Level Encryption)
   * Útil para o "Vault" onde os dados são ilegíveis mesmo com acesso ao DB.
   */
  encryptWithVaultKey(plaintext: string, vaultKeyHex?: string): string {
    const key = vaultKeyHex 
      ? Buffer.from(vaultKeyHex, 'hex') 
      : Buffer.from(process.env.MASTER_VAULT_KEY || '', 'hex');

    if (key.length !== 32) {
      throw new Error('MASTER_VAULT_KEY inválida para ALE: deve ter 32 bytes.');
    }

    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, key, iv) as any;

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decryptWithVaultKey(encryptedValue: string, vaultKeyHex?: string): string {
    const key = vaultKeyHex 
      ? Buffer.from(vaultKeyHex, 'hex') 
      : Buffer.from(process.env.MASTER_VAULT_KEY || '', 'hex');

    const [version, ivHex, authTagHex, ciphertext] = encryptedValue.split(':');
    
    if (version !== 'v1') {
      // Fallback para descriptografia normal se não for v1
      return this.decrypt(encryptedValue);
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv(this.algorithm, key, iv) as any;
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  isEncrypted(value: string): boolean {
    const parts = value.split(':');
    return (parts.length === 3 || parts.length === 4) && parts[1]?.length === 32;
  }
}
