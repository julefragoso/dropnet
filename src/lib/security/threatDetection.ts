// Threat detection and anti-debugging system
// Protects against debugging, analysis, and malicious environments

export class ThreatDetection {
  private static instance: ThreatDetection;
  private isCompromised = false;
  private lastCheck = 0;
  private checkInterval = 1000; // 1 second

  static getInstance(): ThreatDetection {
    if (!ThreatDetection.instance) {
      ThreatDetection.instance = new ThreatDetection();
    }
    return ThreatDetection.instance;
  }

  // Anti-debugging techniques
  private detectDebugger(): boolean {
    const start = performance.now();
    
    // Technique 1: Performance timing
    debugger;
    const end = performance.now();
    
    if (end - start > 100) {
      return true; // Debugger detected
    }

    // Technique 2: Console timing
    const consoleStart = performance.now();
    console.log('%c', 'color: transparent');
    const consoleEnd = performance.now();
    
    if (consoleEnd - consoleStart > 50) {
      return true; // Console manipulation detected
    }

    // Technique 3: Function constructor timing
    const funcStart = performance.now();
    new Function('debugger')();
    const funcEnd = performance.now();
    
    if (funcEnd - funcStart > 50) {
      return true; // Function debugging detected
    }

    return false;
  }

  // Detect suspicious environment
  private detectSuspiciousEnvironment(): boolean {
    const checks = [
      // Browser automation
      navigator.webdriver,
      (window as any).navigator?.webdriver,
      
      // Developer tools
      window.outerHeight !== window.innerHeight,
      window.outerWidth !== window.innerWidth,
      
      // Extensions and add-ons
      (window as any).chrome?.runtime,
      (window as any).browser?.runtime,
      
      // Debugging tools
      (window as any).Firebug?.chrome?.isInitialized,
      (window.console as any)?.profiles,
      
      // Virtual machines
      navigator.userAgent.includes('VirtualBox'),
      navigator.userAgent.includes('VMware'),
      navigator.userAgent.includes('QEMU'),
      
      // Headless browsers
      navigator.userAgent.includes('Headless'),
      navigator.userAgent.includes('PhantomJS'),
      
      // Testing frameworks
      (window as any).__selenium_evaluate,
      (window as any).__webdriver_evaluate,
      (window as any).__driver_evaluate,
      (window as any).__fxdriver_evaluate,
      
      // Memory analysis
      (window.performance as any)?.memory?.usedJSHeapSize > 100000000, // > 100MB
    ];

    return checks.some(Boolean);
  }

  // Detect code injection
  private detectCodeInjection(): boolean {
    // Check for modified crypto functions
    const originalSubtle = window.crypto.subtle;
    const originalGetRandomValues = window.crypto.getRandomValues;
    
    if (originalSubtle !== window.crypto.subtle) {
      return true;
    }
    
    if (originalGetRandomValues !== window.crypto.getRandomValues) {
      return true;
    }

    // Check for modified ArrayBuffer
    const testArray = new Uint8Array(10);
    crypto.getRandomValues(testArray);
    
    // If all values are the same, something is wrong
    const firstValue = testArray[0];
    return testArray.every(val => val === firstValue);
  }

  // Detect timing attacks
  private detectTimingAnomalies(): boolean {
    const measurements: number[] = [];
    
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      crypto.getRandomValues(new Uint8Array(1000));
      const end = performance.now();
      measurements.push(end - start);
    }
    
    // Check for consistent timing (indicates simulation)
    const avg = measurements.reduce((a, b) => a + b) / measurements.length;
    const variance = measurements.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / measurements.length;
    
    return variance < 0.1; // Too consistent = suspicious
  }

  // Main threat detection
  public checkThreats(): boolean {
    const now = Date.now();
    if (now - this.lastCheck < this.checkInterval) {
      return this.isCompromised;
    }
    
    this.lastCheck = now;

    const threats = [
      this.detectDebugger(),
      this.detectSuspiciousEnvironment(),
      this.detectCodeInjection(),
      this.detectTimingAnomalies()
    ];

    this.isCompromised = threats.some(Boolean);
    
    if (this.isCompromised) {
      this.handleThreat();
    }

    return this.isCompromised;
  }

  // Handle detected threats
  private handleThreat(): void {
    console.warn('🚨 SECURITY THREAT DETECTED - INITIATING LOCKDOWN 🚨');
    
    // Clear sensitive data from memory
    this.clearSensitiveData();
    
    // Overwrite memory with random data
    this.overwriteMemory();
    
    // Redirect to safe page
    setTimeout(() => {
      window.location.href = '/security-violation';
    }, 100);
  }

  // Clear sensitive data
  private clearSensitiveData(): void {
    // Clear localStorage
    localStorage.clear();
    sessionStorage.clear();
    
    // Borrado de IndexedDB desactivado: solo debe ejecutarse manualmente desde el botón de pánico
    // Si necesitas borrar la base de datos, llama manualmente a indexedDB.deleteDatabase desde el botón de pánico
    
    // Clear cookies
    document.cookie.split(";").forEach(cookie => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    });
  }

  // Overwrite memory with random data
  private overwriteMemory(): void {
    // Create large arrays to overwrite memory
    const arrays: Uint8Array[] = [];
    
    for (let i = 0; i < 10; i++) {
      const array = new Uint8Array(1024 * 1024); // 1MB each
      crypto.getRandomValues(array);
      arrays.push(array);
    }
    
    // Keep arrays in memory for a while
    setTimeout(() => {
      arrays.length = 0;
    }, 1000);
  }

  // Get threat status
  public isThreatDetected(): boolean {
    return this.isCompromised;
  }

  // Reset threat detection (for testing)
  public reset(): void {
    this.isCompromised = false;
    this.lastCheck = 0;
  }
}

// Export singleton
export const threatDetection = ThreatDetection.getInstance(); 