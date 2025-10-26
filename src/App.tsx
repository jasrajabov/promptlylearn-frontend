import React from "react";
import { Routes, Route } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import CourseTimeline from "./pages/CoursePage";
import { Provider } from "./components/ui/provider"
import UserCourses from "./pages/UserCourses";

const App: React.FC = () => {

  return (
    <Provider>
      <Box minH="100vh">
        <Header />

        <Box as="main" mt={4} px={4}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/course/:id/" element={<CourseTimeline />} />
            <Route path="/my-courses" element={<UserCourses />} />
          </Routes>
        </Box>
      </Box>
    </Provider>
  );
};

export default App;
