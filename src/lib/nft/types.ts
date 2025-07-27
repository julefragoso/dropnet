// NFT types and structures for DropNet
// Real NFTs with cryptographic signatures and verification

export interface NFTMetadata {
  name: string;
  description: string;
  image: string; // Base64 or IPFS hash
  attributes: NFTAttribute[];
  external_url?: string;
  animation_url?: string;
  background_color?: string;
  youtube_url?: string;
}

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date';
  max_value?: number;
}

export interface NFTSignature {
  signature: string;        // Ed25519 signature
  publicKey: string;        // Creator's public key
  timestamp: number;        // Creation timestamp
  version: string;          // Signature version
}

export interface NFTContent {
  id: string;               // Unique NFT ID
  creatorId: string;        // Creator's node ID
  metadata: NFTMetadata;    // NFT metadata
  signature: NFTSignature;  // Digital signature
  createdAt: number;        // Creation timestamp
  updatedAt: number;        // Last update timestamp
  blockchainHash?: string;  // Optional blockchain hash
  ipfsHash?: string;        // Optional IPFS hash
  location?: {              // Optional geolocation
    latitude: number;
    longitude: number;
    radius: number;         // Visibility radius in meters
  };
  visibility: 'public' | 'private' | 'location'; // Visibility settings
  tags: string[];           // Search tags
  category: string;         // NFT category
}

export interface NFTCreationData {
  name: string;
  description: string;
  imageFile: File;
  attributes: NFTAttribute[];
  visibility: 'public' | 'private' | 'location';
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  tags: string[];
  category: string;
}

export interface NFTVerificationResult {
  isValid: boolean;
  creatorVerified: boolean;
  signatureValid: boolean;
  timestampValid: boolean;
  contentIntegrity: boolean;
  errors: string[];
}

// NFT Categories
export const NFT_CATEGORIES = {
  ART: 'art',
  MUSIC: 'music',
  PHOTO: 'photo',
  VIDEO: 'video',
  DOCUMENT: 'document',
  COLLECTIBLE: 'collectible',
  GAME: 'game',
  OTHER: 'other'
} as const;

export type NFTCategory = typeof NFT_CATEGORIES[keyof typeof NFT_CATEGORIES];

// NFT Visibility settings
export const NFT_VISIBILITY = {
  PUBLIC: 'public',      // Visible to everyone
  PRIVATE: 'private',    // Only visible to creator
  LOCATION: 'location'   // Only visible in specific location
} as const;

export type NFTVisibility = typeof NFT_VISIBILITY[keyof typeof NFT_VISIBILITY];

// NFT validation rules
export const NFT_VALIDATION = {
  MAX_NAME_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_TAGS: 10,
  MAX_TAG_LENGTH: 20,
  MAX_ATTRIBUTES: 20,
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  SUPPORTED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm']
} as const; 