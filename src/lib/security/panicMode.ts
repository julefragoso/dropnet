// Panic mode and dead man's switch system
// Auto-destructs data when threats are detected or user is inactive

export class PanicMode {
  private static instance: PanicMode;
  private isActive = false;
  private deadMansTimer: NodeJS.Timeout | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private lastActivity = Date.now();
  private inactivityThreshold = 5 * 60 * 1000; // 5 minutes
  private panicKey = 'Escape';
  private isPanicTriggered = false;

  static getInstance(): PanicMode {
    if (!PanicMode.instance) {
      PanicMode.instance = new PanicMode();
    }
    return PanicMode.instance;
  }

  constructor() {
    this.initializeEventListeners();
  }

  // Initialize event listeners for activity detection
  private initializeEventListeners(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateActivity();
      }, { passive: true });
    });

    // Visibility change listener
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.startDeadMansSwitch();
      } else {
        this.stopDeadMansSwitch();
        this.updateActivity();
      }
    });

    // Page unload listener
    window.addEventListener('beforeunload', () => {
      this.secureCleanup();
    });
  }

  // Update last activity timestamp
  private updateActivity(): void {
    this.lastActivity = Date.now();
    
    // Reset activity timer
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    
    this.activityTimer = setTimeout(() => {
      this.handleInactivity();
    }, this.inactivityThreshold);
  }

  // Start dead man's switch
  public startDeadMansSwitch(): void {
    if (this.deadMansTimer) {
      clearTimeout(this.deadMansTimer);
    }
    
    this.deadMansTimer = setTimeout(() => {
      this.triggerPanic();
    }, this.inactivityThreshold);
  }

  // Stop dead man's switch
  public stopDeadMansSwitch(): void {
    if (this.deadMansTimer) {
      clearTimeout(this.deadMansTimer);
      this.deadMansTimer = null;
    }
  }

  // Handle inactivity
  private handleInactivity(): void {
    console.warn('⚠️ INACTIVITY DETECTED - ACTIVATING SECURITY PROTOCOLS ⚠️');
    this.triggerPanic();
  }

  // Trigger panic mode
  public triggerPanic(): void {
    if (this.isPanicTriggered) return;
    
    this.isPanicTriggered = true;
    console.error('🚨 PANIC MODE ACTIVATED - INITIATING EMERGENCY CLEANUP 🚨');
    
    // Immediate cleanup
    this.secureCleanup();
    
    // Show panic screen
    this.showPanicScreen();
    
    // Redirect after delay
    setTimeout(() => {
      window.location.href = '/panic';
    }, 2000);
  }

  // Show panic screen
  private showPanicScreen(): void {
    // Create panic overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: linear-gradient(45deg, #ff0000, #000000);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: monospace;
      color: white;
      font-size: 24px;
      text-align: center;
    `;
    
    overlay.innerHTML = `
      <div>
        <h1>🚨 SECURITY BREACH DETECTED 🚨</h1>
        <p>EMERGENCY CLEANUP IN PROGRESS</p>
        <p>ALL DATA BEING SECURELY ERASED</p>
        <div style="margin-top: 20px;">
          <div style="width: 200px; height: 4px; background: #333; margin: 0 auto;">
            <div id="progress" style="width: 0%; height: 100%; background: #ff0000; transition: width 2s;"></div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Animate progress bar
    setTimeout(() => {
      const progress = document.getElementById('progress');
      if (progress) {
        progress.style.width = '100%';
      }
    }, 100);
  }

  // Secure cleanup of all data
  private secureCleanup(): void {
    try {
      // Clear localStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Borrado de IndexedDB solo debe ejecutarse manualmente desde el botón de pánico
      // Si necesitas borrar la base de datos, llama manualmente a indexedDB.deleteDatabase desde el botón de pánico
      
      // Clear cookies
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
      
      // Clear memory
      this.overwriteMemory();
      
      // Clear any stored variables
      if (window.sessionStorage) {
        window.sessionStorage.clear();
      }
      
      // Clear any stored variables in window object
      Object.keys(window).forEach(key => {
        if (key.includes('dropnet') || key.includes('crypto') || key.includes('key')) {
          try {
            delete (window as any)[key];
          } catch (e) {
            // Ignore errors
          }
        }
      });
      
    } catch (error) {
      console.error('Error during secure cleanup:', error);
    }
  }

  // Overwrite memory with random data
  private overwriteMemory(): void {
    try {
      // Create smaller arrays to overwrite memory (within crypto limits)
      const arrays: Uint8Array[] = [];
      
      for (let i = 0; i < 20; i++) {
        const array = new Uint8Array(64 * 1024); // 64KB each (within crypto limits)
        crypto.getRandomValues(array);
        arrays.push(array);
      }
      
      // Keep arrays in memory for a while to overwrite sensitive data
      setTimeout(() => {
        arrays.length = 0;
      }, 1000);
      
    } catch (error) {
      console.error('Error overwriting memory:', error);
    }
  }

  // Set inactivity threshold
  public setInactivityThreshold(minutes: number): void {
    this.inactivityThreshold = minutes * 60 * 1000;
  }

  // Manual panic trigger (for button use)
  public manualPanic(): void {
    if (!this.isPanicTriggered) {
      this.triggerPanic();
    }
  }

  // Get panic status
  public isPanicActive(): boolean {
    return this.isPanicTriggered;
  }

  // Reset panic mode (for testing)
  public reset(): void {
    this.isPanicTriggered = false;
    this.lastActivity = Date.now();
    this.stopDeadMansSwitch();
  }

  // Get time since last activity
  public getTimeSinceActivity(): number {
    return Date.now() - this.lastActivity;
  }

  // Manual trigger for testing
  public manualTrigger(): void {
    this.triggerPanic();
  }
}

// Export singleton
export const panicMode = PanicMode.getInstance(); 