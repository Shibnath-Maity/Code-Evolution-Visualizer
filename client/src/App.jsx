import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Board from "./pages/Board";
import Repositories from "./pages/Repositories";
import Commits from "./pages/Commits";
import Contributors from "./pages/Contributors";
import Hotspots from "./pages/Hotspots";
import Timeline from "./pages/Timeline";
import AIInsights from "./pages/AIInsights";
import Setting from "./pages/Setting";
import AppLayout from "./Layout/AppLayout";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public landing page */}
        <Route path="/" element={<Home />} />

        {/* Application pages */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Board />} />
          <Route path="/repositories" element={<Repositories />} />
          <Route path="/commits" element={<Commits />} />
          <Route path="/contributors" element={<Contributors />} />
          <Route path="/hotspots" element={<Hotspots />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/ai-insights" element={<AIInsights />} />
          <Route path="/settings" element={<Setting />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;