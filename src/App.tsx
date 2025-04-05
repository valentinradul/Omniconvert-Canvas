
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import IdeasPage from "./pages/IdeasPage";
import IdeaDetailsPage from "./pages/IdeaDetailsPage";
import CreateHypothesisPage from "./pages/CreateHypothesisPage";
import HypothesesPage from "./pages/HypothesesPage";
import HypothesisDetailsPage from "./pages/HypothesisDetailsPage";
import CreateExperimentPage from "./pages/CreateExperimentPage";
import ExperimentsPage from "./pages/ExperimentsPage";
import ExperimentDetailsPage from "./pages/ExperimentDetailsPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="ideas" element={<IdeasPage />} />
              <Route path="idea-details/:ideaId" element={<IdeaDetailsPage />} />
              <Route path="create-hypothesis/:ideaId" element={<CreateHypothesisPage />} />
              <Route path="hypotheses" element={<HypothesesPage />} />
              <Route path="hypothesis-details/:hypothesisId" element={<HypothesisDetailsPage />} />
              <Route path="create-experiment/:hypothesisId" element={<CreateExperimentPage />} />
              <Route path="experiments" element={<ExperimentsPage />} />
              <Route path="experiment-details/:experimentId" element={<ExperimentDetailsPage />} />
              <Route path="departments" element={<DepartmentsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
