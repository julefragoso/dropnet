import { 
  NFTContent, 
  NFTCreationData, 
  NFTMetadata, 
  NFTSignature, 
  NFTVerificationResult,
  NFT_VALIDATION 
} from './types';
import { dbService } from '@/lib/storage/indexedDB';
import { threatDetection } from '@/lib/security/threatDetection';
import { memoryProtection } from '@/lib/security/memoryProtection';

// Utility functions for crypto operations (without hooks)
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

export class NFTService {
  private static instance: NFTService;

  static getInstance(): NFTService {
    if (!NFTService.instance) {
      NFTService.instance = new NFTService();
    }
    return NFTService.instance;
  }

  // Convert file to base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/...;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Validate NFT creation data
  private validateNFTData(data: NFTCreationData): string[] {
    const errors: string[] = [];

    // Validate name
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    } else if (data.name.length > NFT_VALIDATION.MAX_NAME_LENGTH) {
      errors.push(`Name must be less than ${NFT_VALIDATION.MAX_NAME_LENGTH} characters`);
    }

    // Validate description
    if (data.description.length > NFT_VALIDATION.MAX_DESCRIPTION_LENGTH) {
      errors.push(`Description must be less than ${NFT_VALIDATION.MAX_DESCRIPTION_LENGTH} characters`);
    }

    // Validate image file
    if (!data.imageFile) {
      errors.push('Image file is required');
    } else {
      if (data.imageFile.size > NFT_VALIDATION.MAX_IMAGE_SIZE) {
        errors.push(`Image file must be less than ${NFT_VALIDATION.MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
      }
      if (!NFT_VALIDATION.SUPPORTED_IMAGE_TYPES.includes(data.imageFile.type as any)) {
        errors.push('Unsupported image format. Use JPEG, PNG, GIF, or WebP');
      }
    }

    // Validate attributes
    if (data.attributes.length > NFT_VALIDATION.MAX_ATTRIBUTES) {
      errors.push(`Maximum ${NFT_VALIDATION.MAX_ATTRIBUTES} attributes allowed`);
    }

    // Validate tags
    if (data.tags.length > NFT_VALIDATION.MAX_TAGS) {
      errors.push(`Maximum ${NFT_VALIDATION.MAX_TAGS} tags allowed`);
    }
    data.tags.forEach(tag => {
      if (tag.length > NFT_VALIDATION.MAX_TAG_LENGTH) {
        errors.push(`Tag "${tag}" must be less than ${NFT_VALIDATION.MAX_TAG_LENGTH} characters`);
      }
    });

    return errors;
  }

  // Create NFT metadata
  private createMetadata(data: NFTCreationData, imageBase64: string): NFTMetadata {
    return {
      name: data.name.trim(),
      description: data.description.trim(),
      image: `data:${data.imageFile.type};base64,${imageBase64}`,
      attributes: data.attributes,
      background_color: '#000000'
    };
  }

  // Sign data with private key
  private async signData(data: string, privateKeyBase64: string): Promise<string> {
    try {
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
    } catch (error) {
      console.error('Error signing data:', error);
      throw new Error('Failed to sign data');
    }
  }

  // Verify signature with public key
  private async verifySignature(data: string, signature: string, publicKeyBase64: string): Promise<boolean> {
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
  }

  // Sign NFT content
  private async signNFT(metadata: NFTMetadata, creatorId: string, privateKey: string): Promise<NFTSignature> {
    // Create content to sign
    const contentToSign = JSON.stringify({
      metadata,
      creatorId,
      timestamp: Date.now()
    });

    // Sign the content
    const signature = await this.signData(contentToSign, privateKey);

    return {
      signature,
      publicKey: '', // Will be filled by the calling function
      timestamp: Date.now(),
      version: '1.0'
    };
  }

  // Create NFT
  async createNFT(data: NFTCreationData, creatorId: string, privateKey: string, publicKey: string): Promise<NFTContent> {
    try {
      // Check for security threats
      if (threatDetection.checkThreats()) {
        throw new Error('Security threat detected during NFT creation');
      }

      // Validate input data
      const validationErrors = this.validateNFTData(data);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Convert image to base64
      const imageBase64 = await this.fileToBase64(data.imageFile);

      // Create metadata
      const metadata = this.createMetadata(data, imageBase64);

      // Sign the NFT
      const signature = await this.signNFT(metadata, creatorId, privateKey);
      signature.publicKey = publicKey;

      // Create NFT content
      const nft: NFTContent = {
        id: crypto.randomUUID(),
        creatorId,
        metadata,
        signature,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        visibility: data.visibility,
        location: data.location,
        tags: data.tags,
        category: data.category
      };

      // Store in encrypted database
      await dbService.put('nfts', nft);

      // Clear sensitive data from memory
      memoryProtection.overwriteData(new TextEncoder().encode(imageBase64));

      return nft;
    } catch (error) {
      console.error('Error creating NFT:', error);
      throw error;
    }
  }

  // Verify NFT signature
  async verifyNFT(nft: NFTContent): Promise<NFTVerificationResult> {
    const result: NFTVerificationResult = {
      isValid: false,
      creatorVerified: false,
      signatureValid: false,
      timestampValid: false,
      contentIntegrity: false,
      errors: []
    };

    try {
      // Check for security threats
      if (threatDetection.checkThreats()) {
        result.errors.push('Security threat detected during verification');
        return result;
      }

      // Verify timestamp (not too old, not in future)
      const now = Date.now();
      const timeDiff = Math.abs(now - nft.signature.timestamp);
      const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
      
      if (nft.signature.timestamp > now) {
        result.errors.push('NFT timestamp is in the future');
      } else if (timeDiff > maxAge) {
        result.errors.push('NFT is too old (more than 1 year)');
      } else {
        result.timestampValid = true;
      }

      // Verify signature
      const contentToVerify = JSON.stringify({
        metadata: nft.metadata,
        creatorId: nft.creatorId,
        timestamp: nft.signature.timestamp
      });

      const signatureValid = await this.verifySignature(
        contentToVerify,
        nft.signature.signature,
        nft.signature.publicKey
      );

      if (signatureValid) {
        result.signatureValid = true;
      } else {
        result.errors.push('Invalid digital signature');
      }

      // Verify content integrity
      if (nft.metadata && nft.metadata.name && nft.metadata.image) {
        result.contentIntegrity = true;
      } else {
        result.errors.push('Invalid NFT content structure');
      }

      // Overall validation
      result.isValid = result.timestampValid && result.signatureValid && result.contentIntegrity;
      result.creatorVerified = result.signatureValid; // If signature is valid, creator is verified

    } catch (error) {
      result.errors.push(`Verification error: ${error}`);
    }

    return result;
  }

  // Get all NFTs for a user
  async getUserNFTs(creatorId: string): Promise<NFTContent[]> {
    try {
      const allNFTs = await dbService.getAll('nfts');
      return allNFTs.filter(nft => nft.creatorId === creatorId);
    } catch (error) {
      console.error('Error getting user NFTs:', error);
      return [];
    }
  }

  // Get public NFTs
  async getPublicNFTs(): Promise<NFTContent[]> {
    try {
      const allNFTs = await dbService.getAll('nfts');
      return allNFTs.filter(nft => nft.visibility === 'public');
    } catch (error) {
      console.error('Error getting public NFTs:', error);
      return [];
    }
  }

  // Get NFT by ID
  async getNFTById(id: string): Promise<NFTContent | null> {
    try {
      return await dbService.get('nfts', id);
    } catch (error) {
      console.error('Error getting NFT by ID:', error);
      return null;
    }
  }

  // Update NFT
  async updateNFT(id: string, updates: Partial<NFTContent>, privateKey: string): Promise<NFTContent | null> {
    try {
      const existingNFT = await this.getNFTById(id);
      if (!existingNFT) {
        throw new Error('NFT not found');
      }

      // Create updated NFT
      const updatedNFT: NFTContent = {
        ...existingNFT,
        ...updates,
        updatedAt: Date.now()
      };

      // Re-sign the updated NFT
      const contentToSign = JSON.stringify({
        metadata: updatedNFT.metadata,
        creatorId: updatedNFT.creatorId,
        timestamp: Date.now()
      });

      const newSignature = await this.signData(contentToSign, privateKey);
      updatedNFT.signature = {
        ...updatedNFT.signature,
        signature: newSignature,
        timestamp: Date.now()
      };

      // Store updated NFT
      await dbService.put('nfts', updatedNFT);

      return updatedNFT;
    } catch (error) {
      console.error('Error updating NFT:', error);
      return null;
    }
  }

  // Delete NFT
  async deleteNFT(id: string): Promise<boolean> {
    try {
      await dbService.delete('nfts', id);
      return true;
    } catch (error) {
      console.error('Error deleting NFT:', error);
      return false;
    }
  }

  // Search NFTs
  async searchNFTs(query: string, category?: string): Promise<NFTContent[]> {
    try {
      const allNFTs = await dbService.getAll('nfts');
      const publicNFTs = allNFTs.filter(nft => nft.visibility === 'public');

      return publicNFTs.filter(nft => {
        const matchesQuery = query.toLowerCase();
        const matchesName = nft.metadata.name.toLowerCase().includes(matchesQuery);
        const matchesDescription = nft.metadata.description.toLowerCase().includes(matchesQuery);
        const matchesTags = nft.tags.some(tag => tag.toLowerCase().includes(matchesQuery));
        const matchesCategory = !category || nft.category === category;

        return (matchesName || matchesDescription || matchesTags) && matchesCategory;
      });
    } catch (error) {
      console.error('Error searching NFTs:', error);
      return [];
    }
  }
}

// Export singleton
export const nftService = NFTService.getInstance(); 