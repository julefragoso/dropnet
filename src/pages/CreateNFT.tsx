import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const CreateNFT = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [dropAtLocation, setDropAtLocation] = useState(false);
  
  const handleCreate = () => {
    alert("NFT created and signed successfully");
    navigate("/collection");
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl text-primary font-bold">
            [ NFT CREATION TERMINAL ]
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate("/dashboard")}
          >
            &lt; BACK
          </Button>
        </div>

        <Card className="bg-card border-2 border-primary p-8">
          <div className="space-y-6">
            <div className="text-center text-accent text-4xl mb-6">🎨</div>
            
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                NFT TITLE:
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Anonymous Creation #001"
                className="bg-muted border-border text-foreground font-mono"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                DESCRIPTION:
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your digital asset..."
                rows={3}
                className="bg-muted border-border text-foreground font-mono resize-none"
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                CONTENT (TEXT/IMAGE/AUDIO):
              </label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter content, paste image URL, or describe audio..."
                rows={6}
                className="bg-muted border-border text-foreground font-mono resize-none"
              />
            </div>

            <Card className="bg-muted border border-border p-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="dropLocation"
                  checked={dropAtLocation}
                  onChange={(e) => setDropAtLocation(e.target.checked)}
                  className="w-4 h-4 text-accent bg-background border-border rounded"
                />
                <label htmlFor="dropLocation" className="text-sm text-foreground cursor-pointer">
                  DROP AT CURRENT LOCATION (GEOTAG)
                </label>
              </div>
            </Card>

            <div className="text-sm text-muted-foreground space-y-2">
              <p>&gt; NFT WILL BE CRYPTOGRAPHICALLY SIGNED</p>
              <p>&gt; OWNERSHIP PROOF STORED LOCALLY</p>
              <p>&gt; OPTIONAL BLOCKCHAIN EXPORT IN ONLINE MODE</p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="terminal"
                onClick={handleCreate}
                disabled={!title || !content}
                className="flex-1"
              >
                &gt; SIGN AND SAVE NFT
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setTitle("");
                  setDescription("");
                  setContent("");
                  setDropAtLocation(false);
                }}
              >
                CLEAR
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreateNFT;