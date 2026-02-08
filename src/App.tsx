import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Box, Spinner, Center } from "@chakra-ui/react";
import Header from "./components/Header";
import PremiumRoute from "./components/PremiumRoute";
import { Provider } from "./components/ui/provider";
import RequireAuth from "./pages/RequireAuth";
import { PWAInstallBanner } from './components/PWAInstallBanner';
import ResetPasswordForm from './components/ResetPasswordForm';



// Lazy load all pages
const HomePage = lazy(() => import("./pages/HomePage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const CourseTimeline = lazy(() => import("./pages/CoursePage"));
const UserCourses = lazy(() => import("./pages/UserCourses"));
const UserRoadmaps = lazy(() => import("./pages/UserRoadmaps"));
const TrackRoadmap = lazy(() => import("./pages/RoadmapPage"));
const UpgradePage = lazy(() => import("./pages/UpgradePage"));
const AboutPage = lazy(() => import("./pages/About"));
const UserInfoPage = lazy(() => import("./pages/UserInfo"));
const AdminPage = lazy(() => import("./pages/AdminPage"));


// Loading component
const PageLoader = () => (
  <Center h="calc(100vh - 80px)">
    <Spinner size="xl" color="teal.500" />
  </Center>
);

// 404 component (small, no need to lazy load)
const NotFound = () => (
  <Center h="calc(100vh - 80px)">
    <Box textAlign="center">
      <Box fontSize="6xl" fontWeight="bold" color="gray.300">404</Box>
      <Box fontSize="xl" color="gray.500">Page Not Found</Box>
    </Box>
  </Center>
);

const App: React.FC = () => {
  return (
    <Provider>
      <Box minH="100vh" bg="bg.canvas">
        <Header />
        <Box as="main" mt={4} px={4}>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage _mode="course" />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/reset-password" element={<ResetPasswordForm />} />

              <Route element={<RequireAuth />}>
                <Route path="/user-info" element={<UserInfoPage />} />
                <Route path="/course/:id/" element={<CourseTimeline />} />
                <Route path="/roadmap/:id/" element={<TrackRoadmap />} />
                <Route path="/my-courses" element={<UserCourses />} />
                <Route path="/my-roadmaps" element={<UserRoadmaps />} />
                <Route path="/admin" element={<AdminPage />} />
                {/* Premium routes */}
                <Route element={<PremiumRoute />}></Route>

                {/* Non-premium authenticated routes */}
                <Route path="/upgrade" element={<UpgradePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <PWAInstallBanner />
        </Box>
      </Box>
    </Provider>
  );
};

export default App;