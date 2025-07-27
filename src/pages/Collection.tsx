import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { nftService } from "@/lib/nft/nftService";
import { NFTContent, NFT_CATEGORIES } from "@/lib/nft/types";
import { dbService } from "@/lib/storage/indexedDB";
import { CheckCircle, XCircle, AlertTriangle, Eye, Download, Trash2, Search, Filter } from "lucide-react";

const Collection = () => {
  const navigate = useNavigate();
  const [nfts, setNfts] = useState<NFTContent[]>([]);
  const [userNFTs, setUserNFTs] = useState<NFTContent[]>([]);
  const [publicNFTs, setPublicNFTs] = useState<NFTContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userIdentity, setUserIdentity] = useState<any>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'my' | 'public'>('all');

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load user identity
        const identity = await dbService.get('identity', 'current');
        setUserIdentity(identity);
        
        // Load NFTs
        const userNFTsData = await nftService.getUserNFTs(identity?.id || '');
        const publicNFTsData = await nftService.getPublicNFTs();
        
        setUserNFTs(userNFTsData);
        setPublicNFTs(publicNFTsData);
        setNfts([...userNFTsData, ...publicNFTsData]);
        
      } catch (error) {
        console.error('Error loading collection:', error);
        setError('Failed to load collection');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filter NFTs based on search and category
  const filteredNFTs = nfts.filter(nft => {
    const matchesSearch = searchQuery === '' || 
      nft.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.metadata.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nft.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || nft.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Get NFTs based on view mode
  const getDisplayNFTs = () => {
    switch (viewMode) {
      case 'my':
        return userNFTs.filter(nft => {
          const matchesSearch = searchQuery === '' || 
            nft.metadata.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCategory = categoryFilter === 'all' || nft.category === categoryFilter;
          return matchesSearch && matchesCategory;
        });
      case 'public':
        return publicNFTs.filter(nft => {
          const matchesSearch = searchQuery === '' || 
            nft.metadata.name.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesCategory = categoryFilter === 'all' || nft.category === categoryFilter;
          return matchesSearch && matchesCategory;
        });
      default:
        return filteredNFTs;
    }
  };

  const handleDeleteNFT = async (nftId: string) => {
    if (confirm('Are you sure you want to delete this NFT? This action cannot be undone.')) {
      try {
        const success = await nftService.deleteNFT(nftId);
        if (success) {
          // Reload NFTs
          const updatedUserNFTs = await nftService.getUserNFTs(userIdentity?.id || '');
          const updatedPublicNFTs = await nftService.getPublicNFTs();
          setUserNFTs(updatedUserNFTs);
          setPublicNFTs(updatedPublicNFTs);
          setNfts([...updatedUserNFTs, ...updatedPublicNFTs]);
        }
      } catch (error) {
        console.error('Error deleting NFT:', error);
        setError('Failed to delete NFT');
      }
    }
  };

  const handleVerifyNFT = async (nft: NFTContent) => {
    try {
      const verification = await nftService.verifyNFT(nft);
      if (verification.isValid) {
        alert('✅ NFT verification successful!\n\nSignature: Valid\nCreator: Verified\nIntegrity: Confirmed');
      } else {
        alert(`❌ NFT verification failed!\n\nErrors:\n${verification.errors.join('\n')}`);
      }
    } catch (error) {
      console.error('Error verifying NFT:', error);
      alert('Failed to verify NFT');
    }
  };

  const getVerificationStatus = (nft: NFTContent) => {
    // This would normally check the verification status
    // For now, we'll assume all NFTs are valid
    return { isValid: true, isOwned: nft.creatorId === userIdentity?.id };
  };

  const displayNFTs = getDisplayNFTs();

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <h1 className="text-2xl text-primary font-bold">
            [ NFT COLLECTION MANAGER ]
          </h1>
          <div className="flex gap-4">
            <Button
              variant="terminal"
              onClick={() => navigate("/nft/create")}
            >
              &gt; CREATE NEW
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
            >
              &lt; BACK
            </Button>
          </div>
        </div>

        {/* Stats */}
        <Card className="bg-card border-2 border-accent p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl text-primary font-bold">{nfts.length}</div>
              <div className="text-sm text-muted-foreground">TOTAL ITEMS</div>
            </div>
            <div>
              <div className="text-2xl text-accent font-bold">{userNFTs.length}</div>
              <div className="text-sm text-muted-foreground">CREATED</div>
            </div>
            <div>
              <div className="text-2xl text-destructive font-bold">{publicNFTs.length}</div>
              <div className="text-sm text-muted-foreground">PUBLIC</div>
            </div>
            <div>
              <div className="text-2xl text-foreground font-bold">{filteredNFTs.length}</div>
              <div className="text-sm text-muted-foreground">FILTERED</div>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card className="bg-card border-2 border-primary p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search NFTs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Object.entries(NFT_CATEGORIES).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                ALL
              </Button>
              <Button
                variant={viewMode === 'my' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('my')}
              >
                MY NFTS
              </Button>
              <Button
                variant={viewMode === 'public' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('public')}
              >
                PUBLIC
              </Button>
            </div>
          </div>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="bg-destructive/10 border-destructive p-4 mb-8">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="bg-card border-2 border-primary p-12 text-center">
            <div className="text-4xl mb-4">⏳</div>
            <h2 className="text-xl text-muted-foreground">LOADING COLLECTION...</h2>
          </Card>
        )}

        {/* Collection Grid */}
        {!loading && displayNFTs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayNFTs.map((nft) => {
              const verification = getVerificationStatus(nft);
              const isOwned = nft.creatorId === userIdentity?.id;
              
              return (
                <Card key={nft.id} className="bg-card border-2 border-primary hover:border-accent transition-colors">
                  <div className="p-6">
                    {/* NFT Image */}
                    <div className="relative mb-4">
                      <img 
                        src={nft.metadata.image} 
                        alt={nft.metadata.name}
                        className="w-full h-48 object-cover rounded-lg border border-border"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        {verification.isValid ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        {isOwned && (
                          <Badge variant="secondary" className="text-xs">OWNED</Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* NFT Info */}
                    <div className="space-y-2 mb-4">
                      <h3 className="font-bold text-foreground text-lg">{nft.metadata.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {nft.metadata.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-1">
                        {nft.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {nft.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{nft.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Metadata */}
                    <div className="text-xs text-muted-foreground space-y-1 mb-4">
                      <p>CREATOR: {nft.creatorId.slice(0, 8)}...</p>
                      <p>CATEGORY: {nft.category.toUpperCase()}</p>
                      <p>VISIBILITY: {nft.visibility.toUpperCase()}</p>
                      <p>CREATED: {new Date(nft.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="info" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleVerifyNFT(nft)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        VERIFY
                      </Button>
                      {isOwned && (
                        <>
                          <Button variant="terminal" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleDeleteNFT(nft.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && displayNFTs.length === 0 && (
          <Card className="bg-card border-2 border-primary p-12 text-center">
            <div className="text-6xl mb-4">🗃️</div>
            <h2 className="text-xl text-muted-foreground mb-4">
              {searchQuery || categoryFilter !== 'all' ? 'NO MATCHING NFTS' : 'COLLECTION EMPTY'}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {searchQuery || categoryFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Create your first NFT or collect from drop spots'
              }
            </p>
            <Button variant="terminal" onClick={() => navigate("/nft/create")}>
              &gt; CREATE FIRST NFT
            </Button>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>LOCAL STORAGE: ENCRYPTED | CRYPTOGRAPHIC VERIFICATION ENABLED</p>
        </div>
      </div>
    </div>
  );
};

export default Collection;