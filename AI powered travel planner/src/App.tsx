import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Archive from "./pages/Archive";
import SmartVoiceGuide from "./components/dashboard/AIVoiceGuide";
import ChennaiRouteMap from "./pages/ChennaiRouteMap";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/plan" element={<Index />} />
          {/* Archive, Profile, Settings show animated 404 (coming soon) */}
          <Route path="/archive" element={<Archive />} />
          <Route path="/profile" element={<NotFound />} />
          <Route path="/settings" element={<NotFound />} />
          <Route path="/chennai" element={<ChennaiRouteMap />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <SmartVoiceGuide />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
