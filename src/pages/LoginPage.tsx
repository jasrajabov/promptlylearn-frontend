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
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);

export default function AuthPage() {
  const { login, signup, user } = useUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
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
      await signup(name, email, password);
      setMessage("Signup successful! You are now logged in.");
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
        >
          Login
        </Link>
        <Text>|</Text>
        <Link
          fontWeight={activeTab === "signup" ? "bold" : "normal"}
          color={activeTab === "signup" ? "teal.500" : "gray.500"}
          onClick={() => setActiveTab("signup")}
        >
          Signup
        </Link>
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
              />
              {error && <Text color="red">{error}</Text>}
              {message && <Text color="green">{message}</Text>}
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
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
              />
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
              />
              {error && <Text color="red">{error}</Text>}
              {message && <Text color="green">{message}</Text>}
              <Button
                colorScheme="teal"
                w="full"
                onClick={handleSignup}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "Signup"}
              </Button>
            </VStack>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}
