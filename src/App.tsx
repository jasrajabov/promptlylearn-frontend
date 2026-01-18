import React from "react";
import { Routes, Route } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import Header from "./components/Header";
import PremiumRoute from "./components/PremiumRoute";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import CourseTimeline from "./pages/CoursePage";
import { Provider } from "./components/ui/provider";
import UserCourses from "./pages/UserCourses";
import UserRoadmaps from "./pages/UserRoadmaps";
import TrackRoadmap from "./pages/RoadmapPage";
import UpgradePage from "./pages/UpgradePage";
import AboutPage from "./pages/About";
import RequireAuth from "./pages/RequireAuth";
import UserInfoPage from "./pages/UserInfo";
import AdminDashboard from "./pages/AdminPage";
import LogoShowcase from "./pages/ShowCase"

const App: React.FC = () => {
  return (
    <Provider>
      <Box minH="100vh" bg="bg.canvas">
        <Header />
        <Box as="main" mt={4} px={4}>
          <Routes>
            <Route path="/" element={<HomePage _mode="course" />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/about" element={<AboutPage />} />

            <Route element={<RequireAuth />}>
              <Route path="/user-info" element={<UserInfoPage />} />
              <Route path="/course/:id/" element={<CourseTimeline />} />
              <Route path="/roadmap/:id/" element={<TrackRoadmap />} />
              <Route path="/my-courses" element={<UserCourses />} />
              <Route path="/my-roadmaps" element={<UserRoadmaps />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/showcase" element={<LogoShowcase />} />
              {/* Premium routes */}
              <Route element={<PremiumRoute />}></Route>

              {/* Non-premium authenticated routes */}
              <Route path="/upgrade" element={<UpgradePage />} />
            </Route>
            <Route path="*" element={<div>404 Not Found</div>} />
          </Routes>
        </Box>
      </Box>
    </Provider>
  );
};

export default App;
