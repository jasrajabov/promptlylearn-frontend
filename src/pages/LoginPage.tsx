import React, { useState, useEffect } from "react";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Input,
  Button,
  VStack,
  Text,
  HStack,
  Link,
  Heading,
  Spinner,
  Separator,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { FaGithub, FaGoogle } from "react-icons/fa";
import type { User } from "../types";

const MotionBox = motion(Box);

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function AuthPage() {
  const { login, signup, user } = useUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const errorParam = params.get('error');

    if (token) {
      handleOAuthSuccess(token);
    }

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, []);

  const handleOAuthSuccess = async (accessToken: string) => {
    try {
      setLoading(true);
      setMessage("Logging in...");

      // Fetch user data with the access token
      // The refresh token is already set as a cookie by the backend
      const response = await fetch(`${BACKEND_URL}/authentication/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();

      // Create User object matching your UserContext structure
      // The token expires in 60 minutes (based on your backend)
      const expiresAt = Date.now() + 60 * 60 * 1000;

      const userObj: User = {
        name: userData.name,
        email: userData.email,
        token: accessToken,
        expires_at: expiresAt,
        membership_plan: userData.membership_plan,
        membership_status: userData.membership_status,
        id: userData.id,
        avatar_url: userData.avatar_url,
        credits: userData.credits,
        credits_reset_at: userData.credits_reset_at,
        membership_active_until: userData.membership_active_until,
        role: userData.role,
        status: userData.status,
        is_email_verified: userData.is_email_verified,
        suspended_at: userData.suspended_at,
        suspended_reason: userData.suspended_reason,
        suspended_by: userData.suspended_by,
        stripe_customer_id: userData.stripe_customer_id,
        total_credits_used: userData.total_credits_used,
        last_login_at: userData.last_login_at,
        login_count: userData.login_count,
        admin_notes: userData.admin_notes,
        total_courses: userData.total_courses,
        total_roadmaps: userData.total_roadmaps,
        completed_courses: userData.completed_courses,
        created_at: userData.created_at,
        updated_at: userData.updated_at,
        deleted_at: userData.deleted_at,
      };

      // Store user in localStorage (matching your UserContext pattern)
      localStorage.setItem("user", JSON.stringify(userObj));

      // Clean up URL
      window.history.replaceState({}, '', '/login');

      setMessage("Login successful!");

      // Reload to trigger UserContext to pick up the user from localStorage
      // This matches how your UserContext loads user on mount
      window.location.href = '/';

    } catch (err) {
      console.error('OAuth error:', err);
      setError("Authentication failed. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setOrganization("");
    setRole("");
    setError("");
    setMessage("");
  }, [activeTab]);

  const handleLogin = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await login(email, password);
      setMessage(`Welcome back, ${email}!`);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      await signup(name, email, password, { phone, organization, role });
      setMessage("Signup successful! You are now logged in.");
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'github') => {
    // Redirect to backend OAuth endpoint
    window.location.href = `${BACKEND_URL}/authentication/${provider}`;
  };

  const panelVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <Box maxW="md" mx="auto" mt={20} p={8} borderRadius="2xl" shadow="xl">
      <Heading size="lg" textAlign="center" mb={6}>
        {activeTab === "login" ? "Welcome Back" : "Create Account"}
      </Heading>

      <HStack justifyContent="center" mb={6}>
        <Link
          fontWeight={activeTab === "login" ? "bold" : "normal"}
          color={activeTab === "login" ? "teal.500" : "gray.500"}
          onClick={() => setActiveTab("login")}
          cursor="pointer"
        >
          Login
        </Link>
        <Text>|</Text>
        <Link
          fontWeight={activeTab === "signup" ? "bold" : "normal"}
          color={activeTab === "signup" ? "teal.500" : "gray.500"}
          onClick={() => setActiveTab("signup")}
          cursor="pointer"
        >
          Signup
        </Link>
      </HStack>

      {/* OAuth Buttons */}
      <VStack gap={3} mb={6}>
        <Button
          w="full"
          variant="outline"
          onClick={() => handleOAuthLogin('google')}
          colorScheme="red"
          size="lg"
          disabled={loading}
        >
          <FaGoogle />
          Continue with Google
        </Button>
        <Button
          w="full"
          variant="outline"
          onClick={() => handleOAuthLogin('github')}
          colorScheme="gray"
          size="lg"
          disabled={loading}
        >
          <FaGithub />
          Continue with GitHub
        </Button>
      </VStack>

      <HStack w="full" my={4}>
        <Separator flex="1" />
        <Text fontSize="sm" color="gray.500" px={3}>
          OR
        </Text>
        <Separator flex="1" />
      </HStack>

      <AnimatePresence mode="wait" initial={false}>
        {activeTab === "login" && (
          <MotionBox
            key="login"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <VStack gap={4}>
              <Input
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleLogin();
                }}
              />
              {error && <Text color="red.500">{error}</Text>}
              {message && <Text color="green.500">{message}</Text>}
              <Button
                colorScheme="teal"
                w="full"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "Login"}
              </Button>
            </VStack>
          </MotionBox>
        )}

        {activeTab === "signup" && (
          <MotionBox
            key="signup"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <VStack gap={4}>
              <Input
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
              <Input
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <Input
                placeholder="Phone Number (optional)"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
              <Input
                placeholder="Company/School (optional)"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                disabled={loading}
              />
              <Input
                placeholder="Role/Position (optional)"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              />
              {error && <Text color="red.500">{error}</Text>}
              {message && <Text color="green.500">{message}</Text>}
              <Button
                colorScheme="teal"
                w="full"
                onClick={handleSignup}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "Create Account"}
              </Button>
            </VStack>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}