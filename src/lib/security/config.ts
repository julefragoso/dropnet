// Security configuration for DropNet
// Handles encryption levels, key derivation, and security constants

export const SECURITY_CONFIG = {
  // Code generation
  ACCESS_CODE_LENGTH: 24,
  ACCESS_CODE_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
  
  // Encryption
  ENCRYPTION_ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  SALT_LENGTH: 32,
  IV_LENGTH: 12,
  
  // Key derivation
  PBKDF2_ITERATIONS: 100000,
  PBKDF2_ALGORITHM: 'PBKDF2',
  
  // Storage
  DB_NAME: 'DropNetDB',
  DB_VERSION: 1,
  
  // Security levels
  SECURITY_LEVELS: {
    BASIC: 'basic',      // Encrypted IndexedDB
    PARANOID: 'paranoid', // Memory only, no persistence
    MINIMAL: 'minimal'    // Essential data only
  }
} as const;

// Types for security
export interface SecurityConfig {
  level: typeof SECURITY_CONFIG.SECURITY_LEVELS[keyof typeof SECURITY_CONFIG.SECURITY_LEVELS];
  accessCode: string;
  salt: string;
  createdAt: number;
}

export interface EncryptedData {
  data: string;        // Base64 encrypted data
  iv: string;          // Base64 initialization vector
  salt: string;        // Base64 salt
  version: number;     // Encryption version
}

export interface UserIdentity {
  id: string;
  publicKey: string;
  avatar: string;
  nodeId: string;
  createdAt: number;
  lastActive: number;
}

// Database schema
export const DB_SCHEMAS = {
  identity: 'identity',
  nfts: 'nfts',
  messages: 'messages',
  dropSpots: 'dropSpots',
  settings: 'settings',
  pendingMessages: 'pendingMessages',
  conversations: 'conversations'
} as const;

export type DBSchema = typeof DB_SCHEMAS[keyof typeof DB_SCHEMAS]; 