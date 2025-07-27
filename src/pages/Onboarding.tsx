import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { dbService } from "@/lib/storage/indexedDB";
import { UserIdentity } from "@/lib/security/config";
import React from "react"; // Added missing import for React

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

const generateAccessCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const generateSalt = (): string => {
  const salt = generateRandomBytes(32);
  return arrayBufferToBase64(salt);
};

const generateKeyPair = async (): Promise<{ publicKey: string; privateKey: string }> => {
  try {
    console.log('Creating Ed25519 key pair...');
    
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'Ed25519',
        namedCurve: 'Ed25519'
      },
      true,
      ['sign', 'verify']
    );

    console.log('Key pair created, exporting keys...');
    
    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    console.log('Keys exported successfully');

    return {
      publicKey: arrayBufferToBase64(publicKeyBuffer),
      privateKey: arrayBufferToBase64(privateKeyBuffer)
    };
  } catch (error) {
    console.error('Error in generateKeyPair:', error);
    throw new Error(`Failed to generate key pair: ${error.message}`);
  }
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'select' | 'generate' | 'access'>('select');
  const [accessCode, setAccessCode] = useState("");
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccessing, setIsAccessing] = useState(false);
  // Estado para el Drop Seed (salt)
  const [dropSeed, setDropSeed] = useState<string>("");
  // Nuevo estado para el Drop Seed en el acceso
  const [accessDropSeed, setAccessDropSeed] = useState<string>("");

  // Generate identity when user clicks generate
  const handleGenerateIdentity = async () => {
    console.log('🔵 BUTTON CLICKED - handleGenerateIdentity called');
    try {
      console.log('=== GENERATION START ===');
      setIsGenerating(true);
      
      // Generate access code (like wallet seed)
      const code = generateAccessCode();
      setAccessCode(code);
      
      // Generate salt for key derivation
      const salt = generateSalt();
      setDropSeed(salt);
      
      // Generate Ed25519 key pair
      const keyPair = await generateKeyPair();
      
      // Create user identity
      const identity: UserIdentity = {
        id: crypto.randomUUID(),
        publicKey: keyPair.publicKey,
        avatar: "🤖", // Default avatar
        nodeId: `NODE_${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}`,
        createdAt: Date.now(),
        lastActive: Date.now()
      };
      
      setUserIdentity(identity);
      
      // Initialize encrypted database
      console.log('Initializing database...');
      await dbService.init(code, salt);
      console.log('Database initialized successfully');
      
      // Store identity in encrypted database
      console.log('Storing identity...');
      try {
        await dbService.put('identity', identity);
        console.log('✅ Identity stored successfully');
      } catch (e) {
        console.error('❌ Error storing identity:', e);
      }
      
      // Store security config
      console.log('Storing security config...');
      try {
        await dbService.put('settings', {
          id: 'security',
          accessCode: code,
          salt: salt,
          level: 'basic',
          createdAt: Date.now()
        });
        console.log('✅ Security config stored successfully');
      } catch (e) {
        console.error('❌ Error storing security config:', e);
      }
      
      // Verify that data was stored correctly
      console.log('Verifying stored data...');
      const verifySettings = await dbService.getRawData('settings', 'security');
      console.log('Verification - Raw settings:', verifySettings);
      const verifyIdentity = await dbService.getRawData('identity', identity.id);
      console.log('Verification - Raw identity:', verifyIdentity);
      
      if (verifySettings && verifyIdentity) {
        console.log('✓ Data verification successful');
      } else {
        console.log('❌ Data verification failed - data not found');
        console.log('Settings found:', !!verifySettings);
        console.log('Identity found:', !!verifyIdentity);
      }
      
      setStep(2);
    } catch (error) {
      console.error('Error generating identity:', error);
      alert(`Error generating identity: ${error.message}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Access existing identity with access code
  const handleAccessIdentity = async () => {
    console.log('=== ACCESS FUNCTION CALLED ===');
    console.log('Access code:', accessCode);
    console.log('Drop Seed:', accessDropSeed);
    try {
      setIsAccessing(true);
      if (!accessCode.trim()) {
        throw new Error('Access code is required');
      }
      if (!accessDropSeed.trim()) {
        throw new Error('Drop Seed is required');
      }
      // Usar el Drop Seed ingresado para inicializar la base de datos
      await dbService.init(accessCode.trim(), accessDropSeed.trim());
      // Obtener la identidad
      const identities = await dbService.getAll('identity');
      console.log('Found identities:', identities.length);
      if (identities.length === 0) {
        throw new Error('No identity found with this access code and drop seed');
      }
      const identity = identities[0];
      setUserIdentity(identity);
      setAccessCode(accessCode.trim());
      setDropSeed(accessDropSeed.trim());
      alert('Identity accessed successfully! Welcome back.');
      navigate("/dashboard");
    } catch (error) {
      console.error('=== ACCESS ATTEMPT FAILED ===');
      console.error('Error:', error.message);
      alert(`Error accessing identity: ${error.message}. Please check your access code and drop seed.`);
    } finally {
      setIsAccessing(false);
    }
  };

  if (step === 1) {
    // Selection mode - choose between generate or access
    if (mode === 'select') {
      return (
        <div className="min-h-screen bg-background text-foreground font-mono flex flex-col items-center justify-center p-8">
          <div className="max-w-2xl w-full space-y-8">
            <div className="text-center">
              <h1 className="text-2xl text-primary font-bold mb-8">
                [ IDENTITY PROTOCOL ]
              </h1>
            </div>

            <Card className="bg-card border-2 border-primary p-8">
              <div className="text-center space-y-6">
                <div className="text-accent text-6xl mb-6">🔐</div>
                
                <h2 className="text-xl text-foreground">
                  CHOOSE YOUR ACTION
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                  <Button
                    variant="info"
                    size="lg"
                    onClick={() => setMode('generate')}
                    className="text-lg px-6 py-4 h-auto"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">⚡</div>
                      <div className="font-bold">GENERATE NEW IDENTITY</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Create anonymous identity
                      </div>
                    </div>
                  </Button>
                  
                  <Button
                    variant="terminal"
                    size="lg"
                    onClick={() => setMode('access')}
                    className="text-lg px-6 py-4 h-auto"
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">🔑</div>
                      <div className="font-bold">ACCESS EXISTING</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Use access code
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    // Generate mode
    if (mode === 'generate') {
      return (
        <div className="min-h-screen bg-background text-foreground font-mono flex flex-col items-center justify-center p-8">
          <div className="max-w-2xl w-full space-y-8">
            <div className="text-center">
              <h1 className="text-2xl text-primary font-bold mb-8">
                [ IDENTITY GENERATION PROTOCOL ]
              </h1>
            </div>

            <Card className="bg-card border-2 border-primary p-8">
              <div className="text-center space-y-6">
                <div className="text-accent text-6xl mb-6">⚡</div>
                
                <h2 className="text-xl text-foreground">
                  GENERATE YOUR ANONYMOUS IDENTITY
                </h2>
                
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>&gt; CRYPTOGRAPHICALLY SECURE</p>
                  <p>&gt; ZERO PERSONAL DATA REQUIRED</p>
                  <p>&gt; UNTRACEABLE BY DESIGN</p>
                  <p>&gt; ENCRYPTED LOCAL STORAGE</p>
                </div>
                
                <div className="flex gap-4 justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setMode('select')}
                    className="px-4 py-2"
                  >
                    &lt; BACK
                  </Button>
                  
                  <Button
                    variant="info"
                    size="lg"
                    onClick={() => {
                      console.log('🔴 BUTTON CLICKED - onClick fired');
                      handleGenerateIdentity();
                    }}
                    disabled={isGenerating}
                    className="text-lg px-8 py-3"
                  >
                    {isGenerating ? 'GENERATING...' : '> GENERATE IDENTITY'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    // Access mode
    if (mode === 'access') {
      return (
        <div className="min-h-screen bg-background text-foreground font-mono flex flex-col items-center justify-center p-8">
          <div className="max-w-2xl w-full space-y-8">
            <div className="text-center">
              <h1 className="text-2xl text-primary font-bold mb-8">
                [ IDENTITY ACCESS PROTOCOL ]
              </h1>
            </div>
            <Card className="bg-card border-2 border-primary p-8">
              <div className="text-center space-y-6">
                <div className="text-accent text-6xl mb-6">🔑</div>
                <h2 className="text-xl text-foreground">
                  ACCESS YOUR IDENTITY
                </h2>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>&gt; ENTER YOUR ACCESS CODE</p>
                  <p>&gt; ENTER YOUR DROP SEED</p>
                  <p>&gt; DECRYPT YOUR DATA</p>
                  <p>&gt; RESTORE YOUR IDENTITY</p>
                </div>
                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2 text-left">
                      ACCESS CODE:
                    </label>
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      placeholder="Enter your 12-character access code"
                      className="w-full bg-muted border border-border p-3 font-mono text-sm text-foreground"
                      maxLength={12}
                    />
                  </div>
                  {/* Nuevo campo para el Drop Seed */}
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2 text-left">
                      DROP SEED:
                    </label>
                    <input
                      type="text"
                      value={accessDropSeed}
                      onChange={(e) => setAccessDropSeed(e.target.value)}
                      placeholder="Paste your Drop Seed here"
                      className="w-full bg-muted border border-border p-3 font-mono text-xs text-foreground"
                    />
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setMode('select')}
                      className="px-4 py-2"
                    >
                      &lt; BACK
                    </Button>
                    <Button
                      variant="terminal"
                      size="lg"
                      onClick={handleAccessIdentity}
                      className="text-lg px-8 py-3"
                    >
                      &gt; ACCESS IDENTITY
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-2xl text-primary font-bold mb-8">
            [ IDENTITY GENERATED ]
          </h1>
        </div>

        <Card className="bg-card border-2 border-primary p-8">
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-6xl mb-4">{userIdentity?.avatar}</div>
              <h2 className="text-lg text-accent font-bold">{userIdentity?.nodeId}</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">ACCESS CODE (SAVE SECURELY):</label>
                <div className="bg-muted border border-border p-3 font-mono text-sm break-all">
                  {accessCode}
                </div>
                <p className="text-xs text-destructive mt-2">
                  ⚠️ THIS IS YOUR ONLY WAY TO ACCESS YOUR DATA
                </p>
              </div>
              {/* NUEVO: Mostrar el Drop Seed (salt) */}
              <div>
                <label className="block text-sm text-muted-foreground mb-2">DROP SEED (SAVE SECURELY):</label>
                <div className="bg-muted border border-border p-3 font-mono text-xs break-all">
                  {dropSeed || <span className="text-muted-foreground">Generating...</span>}
                </div>
                <p className="text-xs text-destructive mt-2">
                  ⚠️ THIS IS YOUR ONLY WAY TO DECRYPT YOUR DATA
                </p>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-2">PUBLIC KEY:</label>
                <div className="bg-muted border border-border p-3 font-mono text-sm break-all">
                  {userIdentity?.publicKey}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-2">NODE ID:</label>
                <div className="bg-muted border border-border p-3 font-mono text-sm">
                  {userIdentity?.nodeId}
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="text-sm text-destructive">
                ⚠️ SAVE YOUR ACCESS CODE SECURELY
              </div>
              <div className="text-xs text-muted-foreground">
                <p>• WRITE IT DOWN ON PAPER</p>
                <p>• STORE IT IN A PASSWORD MANAGER</p>
                <p>• NEVER SHARE IT WITH ANYONE</p>
                <p>• LOST CODE = LOST DATA</p>
              </div>
              
              <Button
                variant="terminal"
                size="lg"
                onClick={() => navigate("/dashboard")}
                className="text-lg px-8 py-3"
              >
                &gt; CONTINUE TO DROPNET
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;