import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { nftService } from "@/lib/nft/nftService";
import { NFTCreationData, NFTAttribute, NFT_CATEGORIES, NFT_VISIBILITY } from "@/lib/nft/types";
import { useCrypto } from "@/hooks/useCrypto";
import { dbService } from "@/lib/storage/indexedDB";

const CreateNFT = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<NFTCreationData>({
    name: '',
    description: '',
    imageFile: null as any,
    attributes: [],
    visibility: 'public',
    tags: [],
    category: 'art'
  });

  // Crypto and user data
  const { generateKeyPair } = useCrypto();
  const [userIdentity, setUserIdentity] = useState<any>(null);

  // Load user identity on mount
  useEffect(() => {
    const loadIdentity = async () => {
      try {
        const identity = await dbService.get('identity', 'current');
        setUserIdentity(identity);
      } catch (error) {
        console.error('Error loading identity:', error);
      }
    };
    loadIdentity();
  }, []);

  const handleInputChange = (field: keyof NFTCreationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange('imageFile', file);
    }
  };

  const handleTagInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && event.currentTarget.value.trim()) {
      const newTag = event.currentTarget.value.trim();
      if (!formData.tags.includes(newTag) && formData.tags.length < 10) {
        handleInputChange('tags', [...formData.tags, newTag]);
        event.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
  };

  const addAttribute = () => {
    if (formData.attributes.length < 20) {
      handleInputChange('attributes', [
        ...formData.attributes,
        { trait_type: '', value: '' }
      ]);
    }
  };

  const updateAttribute = (index: number, field: keyof NFTAttribute, value: string) => {
    const newAttributes = [...formData.attributes];
    newAttributes[index] = { ...newAttributes[index], [field]: value };
    handleInputChange('attributes', newAttributes);
  };

  const removeAttribute = (index: number) => {
    handleInputChange('attributes', formData.attributes.filter((_, i) => i !== index));
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.imageFile) errors.push('Image is required');
    if (formData.tags.length === 0) errors.push('At least one tag is required');
    
    return errors;
  };

  const handleCreateNFT = async () => {
    try {
      setIsCreating(true);
      setError(null);

      // Validate form
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        setError(validationErrors.join(', '));
        return;
      }

      // Get user identity and keys
      if (!userIdentity) {
        setError('User identity not found. Please complete onboarding first.');
        return;
      }

      // Generate new key pair for this NFT
      const keyPair = await generateKeyPair();

      // Create NFT
      const nft = await nftService.createNFT(
        formData,
        userIdentity.id,
        keyPair.privateKey,
        keyPair.publicKey
      );

      console.log('NFT created successfully:', nft);
      navigate('/collection');
      
    } catch (error) {
      console.error('Error creating NFT:', error);
      setError(error instanceof Error ? error.message : 'Failed to create NFT');
    } finally {
      setIsCreating(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background text-foreground font-mono p-4 sm:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl text-primary font-bold mb-4">
              [ NFT CREATION PROTOCOL ]
            </h1>
          </div>

          <Card className="bg-card border-2 border-primary p-8">
            <div className="space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm text-muted-foreground mb-2">NFT NAME:</label>
                <Input 
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="font-mono"
                  placeholder="Enter NFT name..."
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-2">DESCRIPTION:</label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="font-mono"
                  placeholder="Enter NFT description..."
                  rows={4}
                  maxLength={1000}
                />
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">CATEGORY:</label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NFT_CATEGORIES).map(([key, value]) => (
                      <SelectItem key={value} value={value}>
                        {key.charAt(0) + key.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">TAGS:</label>
                <Input 
                  onKeyDown={handleTagInput}
                  className="font-mono"
                  placeholder="Press Enter to add tags..."
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-muted-foreground mb-2">IMAGE:</label>
                <div className="border-2 border-dashed border-border p-8 text-center">
                  {formData.imageFile ? (
                    <div>
                      <img 
                        src={URL.createObjectURL(formData.imageFile)} 
                        alt="Preview" 
                        className="w-32 h-32 mx-auto object-cover rounded"
                      />
                      <p className="text-sm text-muted-foreground mt-2">{formData.imageFile.name}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-4">🖼️</div>
                      <p className="text-muted-foreground">Click to upload image</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <Button variant="outline" className="mt-2">Choose Image</Button>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-muted-foreground mb-2">VISIBILITY:</label>
                <Select value={formData.visibility} onValueChange={(value) => handleInputChange('visibility', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NFT_VISIBILITY).map(([key, value]) => (
                      <SelectItem key={value} value={value}>
                        {key.charAt(0) + key.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                variant="info"
                size="lg"
                onClick={() => setStep(2)}
                className="w-full text-lg"
                disabled={!formData.name || !formData.imageFile}
              >
                &gt; CONTINUE TO PREVIEW
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl text-primary font-bold mb-4">
            [ NFT PREVIEW ]
          </h1>
        </div>

        <Card className="bg-card border-2 border-primary p-8">
          <div className="space-y-6">
            {error && (
              <div className="bg-destructive/10 border border-destructive text-destructive p-3 rounded">
                {error}
              </div>
            )}

            <div className="text-center">
              <img 
                src={formData.imageFile ? URL.createObjectURL(formData.imageFile) : ''} 
                alt="NFT Preview" 
                className="w-64 h-64 mx-auto object-cover rounded-lg border-2 border-border"
              />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-primary mb-2">{formData.name}</h2>
              <p className="text-muted-foreground">{formData.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">CREATOR:</div>
                <div className="font-bold">{userIdentity?.nodeId || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">CATEGORY:</div>
                <div className="font-bold">{formData.category.toUpperCase()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">VISIBILITY:</div>
                <div className="font-bold">{formData.visibility.toUpperCase()}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">SIGNATURE:</div>
                <div className="font-mono text-xs text-accent">Will be generated</div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                &lt; BACK
              </Button>
              <Button
                variant="terminal"
                onClick={handleCreateNFT}
                className="flex-1"
                disabled={isCreating}
              >
                {isCreating ? 'CREATING...' : '> CREATE NFT'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreateNFT;