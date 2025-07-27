// Memory protection and obfuscation system
// Makes data unreadable in memory and protects against memory dumps

export class MemoryProtection {
  private static instance: MemoryProtection;
  private scrambleKey: Uint8Array;
  private memoryPools: Uint8Array[] = [];

  static getInstance(): MemoryProtection {
    if (!MemoryProtection.instance) {
      MemoryProtection.instance = new MemoryProtection();
    }
    return MemoryProtection.instance;
  }

  constructor() {
    // Generate random scramble key
    this.scrambleKey = new Uint8Array(32);
    crypto.getRandomValues(this.scrambleKey);
    
    // Initialize memory pools for obfuscation
    this.initializeMemoryPools();
  }

  // Initialize memory pools with random data
  private initializeMemoryPools(): void {
    for (let i = 0; i < 5; i++) {
      const pool = new Uint8Array(64 * 1024); // 64KB each (within crypto limits)
      crypto.getRandomValues(pool);
      this.memoryPools.push(pool);
    }
  }

  // Scramble data in memory
  public scrambleData(data: string): Uint8Array {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(data);
    const scrambled = new Uint8Array(bytes.length);
    
    // XOR with scramble key (cycling through key)
    for (let i = 0; i < bytes.length; i++) {
      const keyByte = this.scrambleKey[i % this.scrambleKey.length];
      scrambled[i] = bytes[i] ^ keyByte ^ 0xFF; // Double XOR for extra obfuscation
    }
    
    return scrambled;
  }

  // Unscramble data from memory
  public unscrambleData(scrambled: Uint8Array): string {
    const unscrambled = new Uint8Array(scrambled.length);
    
    // Reverse XOR operation
    for (let i = 0; i < scrambled.length; i++) {
      const keyByte = this.scrambleKey[i % this.scrambleKey.length];
      unscrambled[i] = scrambled[i] ^ keyByte ^ 0xFF;
    }
    
    const decoder = new TextDecoder();
    return decoder.decode(unscrambled);
  }

  // Obfuscate sensitive strings
  public obfuscateString(str: string): string {
    const bytes = new TextEncoder().encode(str);
    const obfuscated: number[] = [];
    
    for (let i = 0; i < bytes.length; i++) {
      // Multiple layers of obfuscation
      let byte = bytes[i];
      byte = byte ^ 0xAA; // XOR with pattern
      byte = byte + 0x10; // Add offset
      byte = byte ^ 0x55; // XOR with another pattern
      obfuscated.push(byte);
    }
    
    return btoa(String.fromCharCode(...obfuscated));
  }

  // Deobfuscate strings
  public deobfuscateString(obfuscated: string): string {
    const bytes = new Uint8Array(atob(obfuscated).split('').map(c => c.charCodeAt(0)));
    const deobfuscated: number[] = [];
    
    for (let i = 0; i < bytes.length; i++) {
      let byte = bytes[i];
      byte = byte ^ 0x55; // Reverse XOR
      byte = byte - 0x10; // Reverse offset
      byte = byte ^ 0xAA; // Reverse XOR
      deobfuscated.push(byte);
    }
    
    return new TextDecoder().decode(new Uint8Array(deobfuscated));
  }

  // Create decoy data in memory
  public createDecoyData(): void {
    const decoyStrings = [
      'fake_password_123',
      'dummy_private_key',
      'test_secret_key',
      'mock_access_code',
      'fake_encryption_key'
    ];
    
    decoyStrings.forEach(str => {
      const scrambled = this.scrambleData(str);
      // Store in memory pools to confuse analysis
      this.memoryPools.push(scrambled);
    });
  }

  // Overwrite sensitive data in memory
  public overwriteData(data: Uint8Array): void {
    if (!data) return;
    
    // Fill with random data
    crypto.getRandomValues(data);
    
    // Fill with zeros
    data.fill(0);
    
    // Fill with alternating pattern
    for (let i = 0; i < data.length; i++) {
      data[i] = i % 2 === 0 ? 0xFF : 0x00;
    }
    
    // Final random fill
    crypto.getRandomValues(data);
  }

  // Secure memory cleanup
  public secureCleanup(): void {
    // Overwrite all memory pools
    this.memoryPools.forEach(pool => {
      this.overwriteData(pool);
    });
    
    // Clear scramble key
    this.overwriteData(this.scrambleKey);
    
    // Clear arrays
    this.memoryPools.length = 0;
  }

  // Get memory usage for obfuscation
  public getMemoryUsage(): number {
    let total = 0;
    this.memoryPools.forEach(pool => {
      total += pool.length;
    });
    return total;
  }

  // Rotate memory pools
  public rotateMemoryPools(): void {
    // Remove oldest pool
    if (this.memoryPools.length > 0) {
      const oldPool = this.memoryPools.shift();
      if (oldPool) {
        this.overwriteData(oldPool);
      }
    }
    
    // Add new pool
    const newPool = new Uint8Array(64 * 1024); // 64KB (within crypto limits)
    crypto.getRandomValues(newPool);
    this.memoryPools.push(newPool);
  }
}

// Export singleton
export const memoryProtection = MemoryProtection.getInstance(); 