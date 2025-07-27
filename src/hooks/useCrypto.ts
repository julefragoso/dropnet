import { useState, useCallback } from 'react';
import { SECURITY_CONFIG, EncryptedData } from '@/lib/security/config';
import { threatDetection } from '@/lib/security/threatDetection';
import { memoryProtection } from '@/lib/security/memoryProtection';
import { panicMode } from '@/lib/security/panicMode';

// Utility functions for crypto operations
const generateRandomBytes = (length: number): Uint8Array => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const useCrypto = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate random access code
  const generateAccessCode = useCallback((): string => {
    let result = '';
    const chars = SECURITY_CONFIG.ACCESS_CODE_CHARS;
    const charsLength = chars.length;
    
    for (let i = 0; i < SECURITY_CONFIG.ACCESS_CODE_LENGTH; i++) {
      result += chars.charAt(Math.floor(Math.random() * charsLength));
    }
    
    return result;
  }, []);

  // Generate salt
  const generateSalt = useCallback((): string => {
    const salt = generateRandomBytes(SECURITY_CONFIG.SALT_LENGTH);
    return arrayBufferToBase64(salt);
  }, []);

  // Derive key from access code
  const deriveKey = useCallback(async (accessCode: string, salt: string): Promise<CryptoKey> => {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(accessCode),
      { name: SECURITY_CONFIG.PBKDF2_ALGORITHM },
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: SECURITY_CONFIG.PBKDF2_ALGORITHM,
        salt: base64ToArrayBuffer(salt),
        iterations: SECURITY_CONFIG.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: SECURITY_CONFIG.ENCRYPTION_ALGORITHM, length: SECURITY_CONFIG.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }, []);

  // Encrypt data
  const encrypt = useCallback(async (data: string, accessCode: string, salt: string): Promise<EncryptedData> => {
    try {
      setIsGenerating(true);
      
      // Check for threats before encryption
      if (threatDetection.checkThreats()) {
        panicMode.triggerPanic();
        throw new Error('Security threat detected');
      }
      
      // Scramble data in memory before encryption
      const scrambledData = memoryProtection.scrambleData(data);
      const dataToEncrypt = memoryProtection.unscrambleData(scrambledData);
      
      const key = await deriveKey(accessCode, salt);
      const iv = generateRandomBytes(SECURITY_CONFIG.IV_LENGTH);
      const encoder = new TextEncoder();
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: SECURITY_CONFIG.ENCRYPTION_ALGORITHM,
          iv: iv
        },
        key,
        encoder.encode(dataToEncrypt)
      );

      // Overwrite scrambled data
      memoryProtection.overwriteData(scrambledData);

      return {
        data: arrayBufferToBase64(encryptedBuffer),
        iv: arrayBufferToBase64(iv),
        salt: salt,
        version: 1
      };
    } finally {
      setIsGenerating(false);
    }
  }, [deriveKey]);

  // Decrypt data
  const decrypt = useCallback(async (encryptedData: EncryptedData, accessCode: string): Promise<string> => {
    try {
      setIsGenerating(true);
      
      // Check for threats before decryption
      if (threatDetection.checkThreats()) {
        panicMode.triggerPanic();
        throw new Error('Security threat detected');
      }
      
      const key = await deriveKey(accessCode, encryptedData.salt);
      const iv = base64ToArrayBuffer(encryptedData.iv);
      const encryptedBuffer = base64ToArrayBuffer(encryptedData.data);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: SECURITY_CONFIG.ENCRYPTION_ALGORITHM,
          iv: iv
        },
        key,
        encryptedBuffer
      );

      const decoder = new TextDecoder();
      const decryptedData = decoder.decode(decryptedBuffer);
      
      // Scramble decrypted data in memory
      const scrambledData = memoryProtection.scrambleData(decryptedData);
      const result = memoryProtection.unscrambleData(scrambledData);
      
      // Overwrite scrambled data after use
      setTimeout(() => {
        memoryProtection.overwriteData(scrambledData);
      }, 1000);
      
      return result;
    } finally {
      setIsGenerating(false);
    }
  }, [deriveKey]);

  // Generate Ed25519 key pair for identity
  const generateKeyPair = useCallback(async (): Promise<{ publicKey: string; privateKey: string }> => {
    try {
      setIsGenerating(true);
      
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'Ed25519',
          namedCurve: 'Ed25519'
        },
        true,
        ['sign', 'verify']
      );

      const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      return {
        publicKey: arrayBufferToBase64(publicKeyBuffer),
        privateKey: arrayBufferToBase64(privateKeyBuffer)
      };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Sign data with private key
  const signData = useCallback(async (data: string, privateKeyBase64: string): Promise<string> => {
    try {
      setIsGenerating(true);
      
      const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        { name: 'Ed25519', namedCurve: 'Ed25519' },
        false,
        ['sign']
      );

      const encoder = new TextEncoder();
      const signature = await crypto.subtle.sign(
        { name: 'Ed25519' },
        privateKey,
        encoder.encode(data)
      );

      return arrayBufferToBase64(signature);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Verify signature with public key
  const verifySignature = useCallback(async (data: string, signature: string, publicKeyBase64: string): Promise<boolean> => {
    try {
      const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
      const publicKey = await crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        { name: 'Ed25519', namedCurve: 'Ed25519' },
        false,
        ['verify']
      );

      const encoder = new TextEncoder();
      const signatureBuffer = base64ToArrayBuffer(signature);
      
      return await crypto.subtle.verify(
        { name: 'Ed25519' },
        publicKey,
        signatureBuffer,
        encoder.encode(data)
      );
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }, []);

  return {
    isGenerating,
    generateAccessCode,
    generateSalt,
    deriveKey,
    encrypt,
    decrypt,
    generateKeyPair,
    signData,
    verifySignature
  };
}; 