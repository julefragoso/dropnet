import { SECURITY_CONFIG, DB_SCHEMAS, EncryptedData } from '@/lib/security/config';

// Database interface
interface DropNetDB extends IDBDatabase {
  // Add custom properties if needed
}

// Storage service class
export class IndexedDBService {
  private db: DropNetDB | null = null;
  private accessCode: string = '';
  private salt: string = '';

  // Initialize database
  async init(accessCode: string, salt: string): Promise<void> {
    // Create a unique database name for each identity
    const uniqueDbName = `${SECURITY_CONFIG.DB_NAME}_${accessCode}`;
    
    console.log('Initializing database with:', {
      accessCode: accessCode.substring(0, 4) + '...',
      salt: salt.substring(0, 4) + '...',
      dbName: uniqueDbName,
      dbVersion: SECURITY_CONFIG.DB_VERSION
    });
    
    // Cierra la base de datos previa si existe
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    this.accessCode = accessCode;
    this.salt = salt;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(uniqueDbName, SECURITY_CONFIG.DB_VERSION);

      request.onerror = () => {
        console.error('Database initialization error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result as DropNetDB;
        console.log('Database initialized successfully');
        console.log('Available object stores:', this.db.objectStoreNames);
        resolve();
      };

      request.onupgradeneeded = (event) => {
        console.log('Database upgrade needed, creating object stores...');
        const db = (event.target as IDBOpenDBRequest).result as DropNetDB;
        
        // Create object stores
        Object.values(DB_SCHEMAS).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            console.log('Creating object store:', storeName);
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };
    });
  }

  // Validate access code and get salt
  async validateAccessCode(accessCode: string): Promise<string | null> {
    try {
      console.log('🔍 Validating access code:', accessCode.substring(0, 4) + '...');
      
      // Try different salt combinations to find the correct one
      // This is a fallback approach when we don't know the salt
      
      // First, try with empty salt
      console.log('🔄 Trying with empty salt...');
      try {
        await this.init(accessCode, '');
        const allSettings = await this.getAllRawData('settings');
        console.log('Settings found with empty salt:', allSettings.length);
        
        if (allSettings.length > 0) {
          const securitySettings = allSettings.find(setting => setting.id === 'security');
          if (securitySettings && securitySettings.salt) {
            console.log('✅ Found salt in settings with empty salt approach');
            return securitySettings.salt;
          }
        }
      } catch (error) {
        console.log('❌ Empty salt approach failed:', error.message);
      }
      
      // If empty salt didn't work, try with some common salt patterns
      console.log('🔄 Trying with common salt patterns...');
      
      // Try with a default salt (this is a fallback)
      const defaultSalt = 'default_salt_for_access_code_validation';
      try {
        await this.init(accessCode, defaultSalt);
        const allSettings = await this.getAllRawData('settings');
        console.log('Settings found with default salt:', allSettings.length);
        
        if (allSettings.length > 0) {
          const securitySettings = allSettings.find(setting => setting.id === 'security');
          if (securitySettings && securitySettings.salt) {
            console.log('✅ Found salt in settings with default salt approach');
            return securitySettings.salt;
          }
        }
      } catch (error) {
        console.log('❌ Default salt approach failed:', error.message);
      }
      
      // If we still haven't found it, try to brute force with the access code as salt
      console.log('🔄 Trying with access code as salt...');
      try {
        await this.init(accessCode, accessCode);
        const allSettings = await this.getAllRawData('settings');
        console.log('Settings found with access code as salt:', allSettings.length);
        
        if (allSettings.length > 0) {
          const securitySettings = allSettings.find(setting => setting.id === 'security');
          if (securitySettings && securitySettings.salt) {
            console.log('✅ Found salt in settings with access code as salt approach');
            return securitySettings.salt;
          }
        }
      } catch (error) {
        console.log('❌ Access code as salt approach failed:', error.message);
      }
      
      console.log('❌ All salt approaches failed');
      return null;
      
    } catch (error) {
      console.log('❌ Validation error:', error);
      return null;
    }
  }

  // Get raw encrypted data without decryption
  async getRawData(storeName: string, id: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log(`🔍 Getting raw data from ${storeName} with id: ${id}`);
      
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => {
          console.log(`📄 Raw data result for ${storeName}:`, request.result);
          if (request.result) {
            console.log(`🔑 Salt in raw data:`, request.result.salt ? request.result.salt.substring(0, 8) + '...' : 'none');
            console.log(`🔐 Encrypted data exists:`, !!request.result.encryptedData);
          }
          resolve(request.result);
        };
        request.onerror = () => {
          console.error(`❌ Error getting raw data from ${storeName}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('❌ Error in getRawData:', error);
      throw error;
    }
  }

  // Get all raw encrypted data without decryption
  async getAllRawData(storeName: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log(`🔍 Getting all raw data from ${storeName}...`);
      
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result || [];
          console.log(`📄 Found ${results.length} raw items in ${storeName}`);
          
          results.forEach((item, index) => {
            console.log(`📦 Raw item ${index}:`, {
              id: item.id,
              hasSalt: !!item.salt,
              saltPreview: item.salt ? item.salt.substring(0, 8) + '...' : 'none',
              hasEncryptedData: !!item.encryptedData
            });
          });
          
          resolve(results);
        };
        request.onerror = () => {
          console.error(`❌ Error getting all raw data from ${storeName}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('❌ Error in getAllRawData:', error);
      throw error;
    }
  }

  // Encrypt data before storing
  private async encryptData(data: any): Promise<EncryptedData> {
    try {
      const dataString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(this.accessCode),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: this.base64ToArrayBuffer(this.salt),
          iterations: SECURITY_CONFIG.PBKDF2_ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(dataString)
      );

      return {
        data: this.arrayBufferToBase64(encryptedBuffer),
        iv: this.arrayBufferToBase64(iv),
        salt: this.salt,
        version: 1
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  // Decrypt data after retrieving
  private async decryptData(encryptedData: EncryptedData): Promise<any> {
    try {
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(this.accessCode),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );

      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: this.base64ToArrayBuffer(this.salt), // Use the salt from initialization
          iterations: SECURITY_CONFIG.PBKDF2_ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      const iv = this.base64ToArrayBuffer(encryptedData.iv);
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData.data);
      
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedBuffer
      );

      const decryptedString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  // Utility functions
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // CRUD Operations

  // Create/Update
  async put(storeName: string, data: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log(`💾 Storing data in ${storeName} with id: ${data.id}`);
      console.log(`🔑 Current salt:`, this.salt ? this.salt.substring(0, 8) + '...' : 'none');
      
      // Encrypt data before creating transaction
      const encryptedData = await this.encryptData(data);
      console.log(`🔐 Data encrypted successfully`);

      const storeData = {
        id: data.id,
        encryptedData,
        salt: this.salt, // Store salt separately for access
        timestamp: Date.now()
      };
      
      console.log(`📦 Store data structure:`, {
        id: storeData.id,
        hasEncryptedData: !!storeData.encryptedData,
        hasSalt: !!storeData.salt,
        saltPreview: storeData.salt ? storeData.salt.substring(0, 8) + '...' : 'none'
      });

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const request = store.put(storeData);

        request.onsuccess = () => {
          console.log(`✅ Data stored successfully in ${storeName}`);
          resolve();
        };
        request.onerror = () => {
          console.error(`❌ Error storing data in ${storeName}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('❌ Error in put operation:', error);
      throw error;
    }
  }

  // Read
  async get(storeName: string, id: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    console.log(`🔍 Getting data from ${storeName} with id: ${id}`);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        console.log(`🔍 Request result for ${storeName}:${id}:`, request.result);
        
        if (request.result) {
          console.log(`🔐 Decrypting data for ${storeName}:${id}...`);
          // Decrypt data after retrieving
          this.decryptData(request.result.encryptedData)
            .then(decryptedData => {
              console.log(`✅ Successfully decrypted data for ${storeName}:${id}:`, decryptedData);
              resolve(decryptedData);
            })
            .catch(decryptError => {
              console.error(`❌ Decryption failed for ${storeName}:${id}:`, decryptError);
              reject(decryptError);
            });
        } else {
          console.log(`⚠️ No data found for ${storeName}:${id}`);
          resolve(null);
        }
      };
      request.onerror = () => {
        console.error(`❌ Error getting data from ${storeName}:${id}:`, request.error);
        reject(request.error);
      };
    });
  }

  // Read all
  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log(`Getting all data from ${storeName}...`);
      
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
          const results = request.result || [];
          console.log(`Found ${results.length} items in ${storeName}`);
          
          if (results.length === 0) {
            console.log('No items found, returning empty array');
            resolve([]);
            return;
          }
          
          // Decrypt all data
          Promise.all(results.map(item => this.decryptData(item.encryptedData)))
            .then(resolve)
            .catch(reject);
        };
        request.onerror = () => {
          console.error(`Error getting all data from ${storeName}:`, request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  }

  // Delete
  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all data
  async clear(storeName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get database size
  async getSize(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    let totalSize = 0;
    
    for (const storeName of Object.values(DB_SCHEMAS)) {
      const data = await this.getAll(storeName);
      totalSize += data.length;
    }

    return totalSize;
  }

  // Close database
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // List all available identities
  async listAllIdentities(): Promise<Array<{accessCode: string, hasData: boolean}>> {
    try {
      console.log('🔍 Listing all available identities...');
      
      // Get all database names from IndexedDB
      const databases = await indexedDB.databases();
      const dropnetDatabases = databases.filter(db => 
        db.name && db.name.startsWith(SECURITY_CONFIG.DB_NAME)
      );
      
      console.log('Found DropNet databases:', dropnetDatabases.length);
      
      const identities: Array<{accessCode: string, hasData: boolean}> = [];
      
      for (const dbInfo of dropnetDatabases) {
        if (dbInfo.name) {
          // Extract access code from database name
          const accessCode = dbInfo.name.replace(`${SECURITY_CONFIG.DB_NAME}_`, '');
          
          // Try to check if this database has any data
          try {
            // Temporarily initialize with this access code
            const tempService = new IndexedDBService();
            await tempService.init(accessCode, '');
            const identityData = await tempService.getAllRawData('identity');
            tempService.close();
            
            identities.push({
              accessCode,
              hasData: identityData.length > 0
            });
          } catch (error) {
            console.log(`Could not access database for ${accessCode}:`, error.message);
          }
        }
      }
      
      console.log('Available identities:', identities);
      return identities;
      
    } catch (error) {
      console.error('Error listing identities:', error);
      return [];
    }
  }

  // Check if database is initialized
  isInitialized(): boolean {
    return this.db !== null;
  }
}

// Export singleton instance
export const dbService = new IndexedDBService(); 