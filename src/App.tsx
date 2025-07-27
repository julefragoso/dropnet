import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import Messages from "./pages/Messages";
import ComposeMessage from "./pages/ComposeMessage";
import CreateNFT from "./pages/CreateNFT";
import DropSpots from "./pages/DropSpots";
import Collection from "./pages/Collection";
import P2PExchange from "./pages/P2PExchange";
import Panic from "./pages/Panic";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/compose" element={<ComposeMessage />} />
          <Route path="/nft/create" element={<CreateNFT />} />
          <Route path="/drops" element={<DropSpots />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/p2p" element={<P2PExchange />} />
          <Route path="/files" element={<Dashboard />} />
          <Route path="/settings" element={<Dashboard />} />
          <Route path="/panic" element={<Panic />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
