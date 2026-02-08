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
  Card,
  Icon,
  IconButton,
  Dialog,
  Image
} from "@chakra-ui/react";
import { useColorModeValue } from "../components/ui/color-mode";
import { motion, AnimatePresence } from "framer-motion";
import { FaGithub, FaGoogle } from "react-icons/fa";
import {
  CheckCircle,
  AlertCircle,
  Mail,
  User as UserIcon,
  Lock,
  Phone,
  Building,
  Briefcase,
  Eye,
  EyeOff
} from "lucide-react";
import type { User } from "../types";
import promptlyLeanrnLogoDark from "../assets/promptlylearn_logo_dark.svg";
import promptlyLeanrnLogoLight from "../assets/promptlylearn_logo_light.svg";

const MotionBox = motion(Box);
const MotionCard = motion(Card.Root);

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
}

export default function AuthPage() {
  const { login, signup, user } = useUser();
  const navigate = useNavigate();

  // All color mode hooks MUST be at the top before any conditional logic
  const cardBg = useColorModeValue("white", "gray.950");
  const inputBg = useColorModeValue("white", "gray.900");
  const borderColor = useColorModeValue("gray.300", "gray.600");
  const focusBorderColor = useColorModeValue("teal.500", "teal.400");
  const errorBorderColor = useColorModeValue("red.500", "red.400");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const iconColor = useColorModeValue("gray.400", "gray.500");
  const cardBorderColor = useColorModeValue("gray.200", "gray.800");
  const tabBg = useColorModeValue("gray.100", "gray.800");
  const googleHoverBg = useColorModeValue("gray.100", "gray.800");
  const googleHoverBorder = useColorModeValue("gray.400", "gray.500");
  const githubHoverBg = useColorModeValue("gray.100", "gray.800");
  const githubHoverBorder = useColorModeValue("gray.400", "gray.500");
  const errorAlertBg = useColorModeValue("red.50", "rgba(239, 68, 68, 0.1)");
  const errorAlertBorder = useColorModeValue("red.200", "red.800");
  const errorAlertIconColor = useColorModeValue("red.500", "red.400");
  const errorAlertTextColor = useColorModeValue("red.800", "red.300");
  const successAlertBg = useColorModeValue("green.50", "rgba(16, 185, 129, 0.1)");
  const successAlertBorder = useColorModeValue("green.200", "green.800");
  const successAlertIconColor = useColorModeValue("green.500", "green.400");
  const successAlertTextColor = useColorModeValue("green.800", "green.300");
  const linkColor = useColorModeValue("teal.600", "teal.400");
  const strengthBarBg = useColorModeValue("gray.200", "gray.800");

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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Forgot Password State
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");

  const logo = useColorModeValue(
    promptlyLeanrnLogoLight,
    promptlyLeanrnLogoDark,
  );

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);


  /**
   * Fetch user data with exponential backoff retry logic
   * Handles transient network failures that cause intermittent OAuth issues
   */
  const fetchUserDataWithRetry = async (
    accessToken: string,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<any> => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${BACKEND_URL}/authentication/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Server error ${response.status}`);
        }

        return await response.json();

      } catch (err) {
        // If this is the last attempt, throw the error
        if (attempt === maxRetries - 1) {
          throw new Error(
            `Failed to fetch user data after ${maxRetries} attempts. Please try logging in again.`
          );
        }

        // Exponential backoff: wait longer between each retry
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error("Failed to fetch user data");
  };

  const handleOAuthSuccess = async (accessToken: string) => {
    try {
      setLoading(true);
      setMessage("Logging you in...");
      setError("");

      // Fetch user data with retry logic - this fixes intermittent failures
      const userData = await fetchUserDataWithRetry(accessToken, 3, 1000);

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

      localStorage.setItem("user", JSON.stringify(userObj));

      // Clean URL before redirect
      window.history.replaceState({}, "", "/login");

      setMessage("Login successful! Redirecting...");

      // Small delay to show success message
      setTimeout(() => {
        window.location.href = "/";
      }, 500);

    } catch (err) {
      console.error("OAuth error:", err);
      const errorMessage = err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
      setLoading(false);

      // Clean URL on error
      window.history.replaceState({}, "", "/login");
    }
  };

  // Enhanced OAuth callback handler
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");
      const errorParam = params.get("error");

      // Handle error first
      if (errorParam) {
        const errorMessage = decodeURIComponent(errorParam);

        // Map backend errors to user-friendly messages
        const errorMap: Record<string, string> = {
          'Email not provided by Google': 'Could not get your email from Google. Please ensure email access is granted.',
          'Failed to get user information from Google': 'Google authentication failed. Please try again.',
          'Invalid response from Google': 'Invalid response from Google. Please try again.',
          'No verified email found in GitHub account': 'No verified email found in your GitHub account. Please verify your email on GitHub first.',
          'Failed to authenticate with GitHub': 'GitHub authentication failed. Please try again.',
          'Failed to fetch GitHub profile': 'Could not fetch your GitHub profile. Please try again.',
          'Failed to fetch GitHub email': 'Could not fetch your email from GitHub. Please try again.',
          'Invalid response from GitHub': 'Invalid response from GitHub. Please try again.',
          'Network error connecting to GitHub': 'Network error. Please check your connection and try again.',
          'Authentication failed': 'Authentication failed. Please try again.',
          'Failed to create or update user': 'Server error. Please try again or contact support.',
        };

        const userFriendlyError = errorMap[errorMessage] || errorMessage || 'Authentication failed. Please try again.';

        setError(userFriendlyError);
        setLoading(false);

        // Clean URL
        window.history.replaceState({}, "", "/login");
        return;
      }

      // Handle successful OAuth with token
      if (token) {
        await handleOAuthSuccess(token);
      }
    };

    handleOAuthCallback();
  }, []);

  const handleOAuthLogin = (provider: "google" | "github") => {
    // Prevent multiple simultaneous OAuth attempts
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");
      setMessage(`Redirecting to ${provider === 'google' ? 'Google' : 'GitHub'}...`);

      // Add a small delay to show the loading message
      setTimeout(() => {
        window.location.href = `${BACKEND_URL}/authentication/${provider}`;
      }, 300);

    } catch (err) {
      console.error("OAuth initiation error:", err);
      setError("Failed to initiate login. Please try again.");
      setLoading(false);
    }
  };

  // ==================== END OAUTH HANDLING ====================

  useEffect(() => {
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setOrganization("");
    setRole("");
    setError("");
    setMessage("");
    setValidationErrors({});
    setTouched({});
  }, [activeTab]);

  // Real-time validation
  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case "name":
        if (activeTab === "signup") {
          if (!value.trim()) return "Name is required";
          if (value.trim().length < 2) return "Name must be at least 2 characters";
        }
        break;
      case "email":
        if (!value.trim()) return "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email address";
        break;
      case "password":
        if (!value.trim()) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        if (activeTab === "signup" && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return "Password must contain uppercase, lowercase, and number";
        }
        break;
    }
    return undefined;
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const value = field === "name" ? name : field === "email" ? email : password;
    const error = validateField(field, value);
    setValidationErrors({ ...validationErrors, [field]: error });
  };

  const handleFieldChange = (field: string, value: string) => {
    if (field === "name") setName(value);
    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);

    if (touched[field]) {
      const error = validateField(field, value);
      setValidationErrors({ ...validationErrors, [field]: error });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    if (activeTab === "signup") {
      errors.name = validateField("name", name);
    }
    errors.email = validateField("email", email);
    errors.password = validateField("password", password);

    setValidationErrors(errors);
    setTouched({ name: true, email: true, password: true });

    return !Object.values(errors).some(error => error !== undefined);
  };

  const handleLogin = async () => {
    setError("");
    setMessage("");

    if (!validateForm()) {
      setError("Please fix the errors above");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      setMessage(`Welcome back!`);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError("");
    setMessage("");

    if (!validateForm()) {
      setError("Please fix the errors above");
      return;
    }

    setLoading(true);
    try {
      const personal_info = {
        phone: phone,
        organization: organization,
        role: role
      }
      await signup(name, email, password, personal_info);
      setMessage("Account created successfully!");
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async () => {
    setForgotPasswordError("");
    setForgotPasswordMessage("");

    if (!forgotPasswordEmail.trim()) {
      setForgotPasswordError("Please enter your email address");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotPasswordEmail)) {
      setForgotPasswordError("Please enter a valid email address");
      return;
    }

    setForgotPasswordLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/authentication/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send reset email');
      }

      setForgotPasswordMessage(data.message);
      setForgotPasswordEmail("");

    } catch (err) {
      setForgotPasswordError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const panelVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  };

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: "", color: "gray.300" };
    if (pwd.length < 8) return { strength: 25, label: "Weak", color: "red.500" };

    let strength = 25;
    if (/[a-z]/.test(pwd)) strength += 15;
    if (/[A-Z]/.test(pwd)) strength += 15;
    if (/\d/.test(pwd)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 15;
    if (pwd.length >= 12) strength += 15;

    if (strength < 50) return { strength, label: "Weak", color: "red.500" };
    if (strength < 75) return { strength, label: "Good", color: "yellow.500" };
    return { strength, label: "Strong", color: "green.500" };
  };

  const passwordStrength = activeTab === "signup" ? getPasswordStrength(password) : null;

  return (
    <>
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        py={8}
        px={4}
      >
        <MotionCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 } as any}
          maxW="480px"
          w="full"
          shadow="2xl"
          borderRadius="2xl"
          borderWidth="1px"
          borderColor={cardBorderColor}
          overflow="hidden"
          bg={cardBg}
        >
          <Card.Body p={8}>
            {/* Header */}
            <VStack gap={4} mb={8}>
              <Image
                src={logo}
                alt="PromptlyLearn Logo"
                height="100px"
                objectFit="contain"
                mb={2}
              />
              <VStack gap={1}>
                <Heading size="xl" textAlign="center" fontWeight="900">
                  {activeTab === "login" ? "Welcome Back" : "Get Started"}
                </Heading>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  {activeTab === "login"
                    ? "Sign in to continue your learning journey"
                    : "Create your account to start learning"}
                </Text>
              </VStack>
            </VStack>

            {/* Tab Switcher */}
            <HStack
              justifyContent="center"
              mb={6}
              p={1}
              bg={tabBg}
              borderRadius="lg"
              gap={1}
            >
              <Button
                flex={1}
                variant={activeTab === "login" ? "solid" : "ghost"}
                colorScheme={activeTab === "login" ? "teal" : "gray"}
                onClick={() => setActiveTab("login")}
                size="sm"
                borderRadius="md"
                fontWeight="semibold"
              >
                Login
              </Button>
              <Button
                flex={1}
                variant={activeTab === "signup" ? "solid" : "ghost"}
                colorScheme={activeTab === "signup" ? "teal" : "gray"}
                onClick={() => setActiveTab("signup")}
                size="sm"
                borderRadius="md"
                fontWeight="semibold"
              >
                Sign Up
              </Button>
            </HStack>

            {/* OAuth Buttons - UPDATED WITH LOADING STATES */}
            <VStack gap={3} mb={6}>
              <Button
                w="full"
                variant="outline"
                onClick={() => handleOAuthLogin("google")}
                size="lg"
                disabled={loading}
                borderRadius="lg"
                fontWeight="semibold"
                h="48px"
                _hover={{
                  bg: googleHoverBg,
                  borderColor: googleHoverBorder
                }}
              >
                {loading && message?.includes('Google') ? (
                  <>
                    <Spinner size="sm" mr={2} />
                    Connecting to Google...
                  </>
                ) : (
                  <>
                    <FaGoogle />
                    Continue with Google
                  </>
                )}
              </Button>
              <Button
                w="full"
                variant="outline"
                onClick={() => handleOAuthLogin("github")}
                size="lg"
                disabled={loading}
                borderRadius="lg"
                fontWeight="semibold"
                h="48px"
                _hover={{
                  bg: githubHoverBg,
                  borderColor: githubHoverBorder
                }}
              >
                {loading && message?.includes('GitHub') ? (
                  <>
                    <Spinner size="sm" mr={2} />
                    Connecting to GitHub...
                  </>
                ) : (
                  <>
                    <FaGithub />
                    Continue with GitHub
                  </>
                )}
              </Button>
            </VStack>

            <HStack w="full" my={6}>
              <Separator flex="1" />
              <Text fontSize="xs" color="gray.500" px={3} fontWeight="medium">
                OR CONTINUE WITH EMAIL
              </Text>
              <Separator flex="1" />
            </HStack>

            {/* Alert Messages */}
            <AnimatePresence mode="wait">
              {error && (
                <MotionBox
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  mb={4}
                >
                  <HStack
                    p={3}
                    bg={errorAlertBg}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={errorAlertBorder}
                    gap={2}
                  >
                    <Icon color={errorAlertIconColor} flexShrink={0}>
                      <AlertCircle size={18} />
                    </Icon>
                    <Text fontSize="sm" color={errorAlertTextColor} fontWeight="medium">
                      {error}
                    </Text>
                  </HStack>
                </MotionBox>
              )}

              {message && (
                <MotionBox
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  mb={4}
                >
                  <HStack
                    p={3}
                    bg={successAlertBg}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={successAlertBorder}
                    gap={2}
                  >
                    <Icon color={successAlertIconColor} flexShrink={0}>
                      <CheckCircle size={18} />
                    </Icon>
                    <Text fontSize="sm" color={successAlertTextColor} fontWeight="medium">
                      {message}
                    </Text>
                  </HStack>
                </MotionBox>
              )}
            </AnimatePresence>

            {/* Forms */}
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
                    <VStack align="stretch" gap={1.5} w="full">
                      <HStack>
                        <Text fontSize="sm" fontWeight="semibold">
                          Email
                        </Text>
                        <Text fontSize="sm" color="red.500">*</Text>
                      </HStack>
                      <HStack
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={touched.email && validationErrors.email ? errorBorderColor : borderColor}
                        _focusWithin={{
                          borderColor: focusBorderColor,
                          shadow: `0 0 0 1px ${focusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        h="48px"
                        px={3}
                        transition="all 0.2s"
                      >
                        <Icon color={iconColor} flexShrink={0}>
                          <Mail size={18} />
                        </Icon>
                        <Input
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => handleFieldChange("email", e.target.value)}
                          onBlur={() => handleBlur("email")}
                          disabled={loading}
                          border="none"
                          outline="none"
                          h="full"
                          px={2}
                          bg="transparent"
                          _focus={{ border: "none", boxShadow: "none", bg: "transparent", outline: "none" }}
                          _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                          _focusVisible={{ outline: "none", boxShadow: "none" }}
                          css={{
                            "&:-webkit-autofill": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                              WebkitTextFillColor: "inherit !important",
                              transition: "background-color 5000s ease-in-out 0s",
                            },
                            "&:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                            },
                          }}
                        />
                      </HStack>
                      {touched.email && validationErrors.email && (
                        <Text fontSize="xs" color={errorBorderColor} mt={0.5}>
                          {validationErrors.email}
                        </Text>
                      )}
                    </VStack>

                    <VStack align="stretch" gap={1.5} w="full">
                      <HStack>
                        <Text fontSize="sm" fontWeight="semibold">
                          Password
                        </Text>
                        <Text fontSize="sm" color="red.500">*</Text>
                      </HStack>
                      <HStack
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={touched.password && validationErrors.password ? errorBorderColor : borderColor}
                        _focusWithin={{
                          borderColor: focusBorderColor,
                          shadow: `0 0 0 1px ${focusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        h="48px"
                        px={3}
                        transition="all 0.2s"
                      >
                        <Icon color={iconColor} flexShrink={0}>
                          <Lock size={18} />
                        </Icon>
                        <Input
                          placeholder="Enter your password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => handleFieldChange("password", e.target.value)}
                          onBlur={() => handleBlur("password")}
                          disabled={loading}
                          onKeyDown={handleKeyDown}
                          border="none"
                          outline="none"
                          h="full"
                          px={2}
                          bg="transparent"
                          _focus={{ border: "none", boxShadow: "none", bg: "transparent", outline: "none" }}
                          _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                          _focusVisible={{ outline: "none", boxShadow: "none" }}
                          css={{
                            "&:-webkit-autofill": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                              WebkitTextFillColor: "inherit !important",
                              transition: "background-color 5000s ease-in-out 0s",
                            },
                            "&:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                            },
                          }}
                        />
                        <IconButton
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          onClick={() => setShowPassword(!showPassword)}
                          variant="ghost"
                          size="sm"
                          minW="auto"
                          h="auto"
                          p={1}
                        >
                          <Icon color={iconColor}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </Icon>
                        </IconButton>
                      </HStack>
                      {touched.password && validationErrors.password && (
                        <Text fontSize="xs" color={errorBorderColor} mt={0.5}>
                          {validationErrors.password}
                        </Text>
                      )}
                    </VStack>

                    <HStack w="full" justify="flex-end">
                      <Link
                        fontSize="sm"
                        color={linkColor}
                        fontWeight="medium"
                        onClick={() => setShowForgotPassword(true)}
                        cursor="pointer"
                      >
                        Forgot password?
                      </Link>
                    </HStack>

                    <Button
                      colorScheme="teal"
                      w="full"
                      onClick={handleLogin}
                      disabled={loading || !email || !password}
                      size="lg"
                      h="48px"
                      borderRadius="lg"
                      fontWeight="bold"
                      bgGradient="linear(to-r, teal.500, cyan.500)"
                      _hover={{ bgGradient: "linear(to-r, teal.600, cyan.600)" }}
                      _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                      mt={2}
                    >
                      {loading ? <Spinner size="sm" /> : "Sign In"}
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
                    <VStack align="stretch" gap={1.5} w="full">
                      <HStack>
                        <Text fontSize="sm" fontWeight="semibold">
                          Full Name
                        </Text>
                        <Text fontSize="sm" color="red.500">*</Text>
                      </HStack>
                      <HStack
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={touched.name && validationErrors.name ? errorBorderColor : borderColor}
                        _focusWithin={{
                          borderColor: focusBorderColor,
                          shadow: `0 0 0 1px ${focusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        h="48px"
                        px={3}
                        transition="all 0.2s"
                      >
                        <Icon color={iconColor} flexShrink={0}>
                          <UserIcon size={18} />
                        </Icon>
                        <Input
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => handleFieldChange("name", e.target.value)}
                          onBlur={() => handleBlur("name")}
                          disabled={loading}
                          border="none"
                          outline="none"
                          h="full"
                          px={2}
                          bg="transparent"
                          _focus={{ border: "none", boxShadow: "none", bg: "transparent", outline: "none" }}
                          _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                          _focusVisible={{ outline: "none", boxShadow: "none" }}
                          css={{
                            "&:-webkit-autofill": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                              WebkitTextFillColor: "inherit !important",
                              transition: "background-color 5000s ease-in-out 0s",
                            },
                            "&:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                            },
                          }}
                        />
                      </HStack>
                      {touched.name && validationErrors.name && (
                        <Text fontSize="xs" color={errorBorderColor} mt={0.5}>
                          {validationErrors.name}
                        </Text>
                      )}
                    </VStack>

                    <VStack align="stretch" gap={1.5} w="full">
                      <HStack>
                        <Text fontSize="sm" fontWeight="semibold">
                          Email
                        </Text>
                        <Text fontSize="sm" color="red.500">*</Text>
                      </HStack>
                      <HStack
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={touched.email && validationErrors.email ? errorBorderColor : borderColor}
                        _focusWithin={{
                          borderColor: focusBorderColor,
                          shadow: `0 0 0 1px ${focusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        h="48px"
                        px={3}
                        transition="all 0.2s"
                      >
                        <Icon color={iconColor} flexShrink={0}>
                          <Mail size={18} />
                        </Icon>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          value={email}
                          onChange={(e) => handleFieldChange("email", e.target.value)}
                          onBlur={() => handleBlur("email")}
                          disabled={loading}
                          border="none"
                          outline="none"
                          h="full"
                          px={2}
                          bg="transparent"
                          _focus={{ border: "none", boxShadow: "none", bg: "transparent", outline: "none" }}
                          _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                          _focusVisible={{ outline: "none", boxShadow: "none" }}
                          css={{
                            "&:-webkit-autofill": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                              WebkitTextFillColor: "inherit !important",
                              transition: "background-color 5000s ease-in-out 0s",
                            },
                            "&:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                            },
                          }}
                        />
                      </HStack>
                      {touched.email && validationErrors.email && (
                        <Text fontSize="xs" color={errorBorderColor} mt={0.5}>
                          {validationErrors.email}
                        </Text>
                      )}
                    </VStack>

                    <VStack align="stretch" gap={1.5} w="full">
                      <HStack>
                        <Text fontSize="sm" fontWeight="semibold">
                          Password
                        </Text>
                        <Text fontSize="sm" color="red.500">*</Text>
                      </HStack>
                      <VStack gap={2} align="stretch">
                        <HStack
                          borderWidth="1px"
                          borderRadius="lg"
                          borderColor={touched.password && validationErrors.password ? errorBorderColor : borderColor}
                          _focusWithin={{
                            borderColor: focusBorderColor,
                            shadow: `0 0 0 1px ${focusBorderColor}`,
                            bg: inputBg
                          }}
                          bg={inputBg}
                          h="48px"
                          px={3}
                          transition="all 0.2s"
                        >
                          <Icon color={iconColor} flexShrink={0}>
                            <Lock size={18} />
                          </Icon>
                          <Input
                            placeholder="At least 8 characters"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => handleFieldChange("password", e.target.value)}
                            onBlur={() => handleBlur("password")}
                            disabled={loading}
                            border="none"
                            outline="none"
                            h="full"
                            px={2}
                            bg="transparent"
                            _focus={{ border: "none", boxShadow: "none", bg: "transparent", outline: "none" }}
                            _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                            _focusVisible={{ outline: "none", boxShadow: "none" }}
                            css={{
                              "&:-webkit-autofill": {
                                WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                                WebkitTextFillColor: "inherit !important",
                                transition: "background-color 5000s ease-in-out 0s",
                              },
                              "&:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                                WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                              },
                            }}
                          />
                          <IconButton
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            onClick={() => setShowPassword(!showPassword)}
                            variant="ghost"
                            size="sm"
                            minW="auto"
                            h="auto"
                            p={1}
                          >
                            <Icon color={iconColor}>
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </Icon>
                          </IconButton>
                        </HStack>

                        {password && passwordStrength && (
                          <Box>
                            <HStack justify="space-between" mb={1}>
                              <Text fontSize="xs" color={mutedText}>Password strength:</Text>
                              <Text fontSize="xs" fontWeight="bold" color={passwordStrength.color}>
                                {passwordStrength.label}
                              </Text>
                            </HStack>
                            <Box h="2" bg={strengthBarBg} borderRadius="full" overflow="hidden">
                              <Box
                                h="full"
                                bg={passwordStrength.color}
                                w={`${passwordStrength.strength}%`}
                                transition="all 0.3s"
                              />
                            </Box>
                          </Box>
                        )}
                      </VStack>
                      {touched.password && validationErrors.password && (
                        <Text fontSize="xs" color={errorBorderColor} mt={0.5}>
                          {validationErrors.password}
                        </Text>
                      )}
                    </VStack>

                    <Separator my={2} />

                    <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase">
                      Optional Information
                    </Text>

                    <VStack align="stretch" gap={1.5} w="full">
                      <Text fontSize="sm" fontWeight="semibold">
                        Phone Number
                      </Text>
                      <HStack
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={borderColor}
                        _focusWithin={{
                          borderColor: focusBorderColor,
                          shadow: `0 0 0 1px ${focusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        h="48px"
                        px={3}
                        transition="all 0.2s"
                      >
                        <Icon color={iconColor} flexShrink={0}>
                          <Phone size={18} />
                        </Icon>
                        <Input
                          placeholder="(555) 123-4567"
                          type="tel"
                          value={phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^\d\s\-()+ ]/g, '');
                            setPhone(value);
                          }}
                          disabled={loading}
                          border="none"
                          outline="none"
                          h="full"
                          px={2}
                          bg="transparent"
                          _focus={{ border: "none", boxShadow: "none", bg: "transparent", outline: "none" }}
                          _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                          _focusVisible={{ outline: "none", boxShadow: "none" }}
                          css={{
                            "&:-webkit-autofill": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                              WebkitTextFillColor: "inherit !important",
                              transition: "background-color 5000s ease-in-out 0s",
                            },
                            "&:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                            },
                          }}
                        />
                      </HStack>
                    </VStack>

                    <VStack align="stretch" gap={1.5} w="full">
                      <Text fontSize="sm" fontWeight="semibold">
                        Company/School
                      </Text>
                      <HStack
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={borderColor}
                        _focusWithin={{
                          borderColor: focusBorderColor,
                          shadow: `0 0 0 1px ${focusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        h="48px"
                        px={3}
                        transition="all 0.2s"
                      >
                        <Icon color={iconColor} flexShrink={0}>
                          <Building size={18} />
                        </Icon>
                        <Input
                          placeholder="Acme Inc."
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                          disabled={loading}
                          border="none"
                          outline="none"
                          h="full"
                          px={2}
                          bg="transparent"
                          _focus={{ border: "none", boxShadow: "none", bg: "transparent", outline: "none" }}
                          _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                          _focusVisible={{ outline: "none", boxShadow: "none" }}
                          css={{
                            "&:-webkit-autofill": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                              WebkitTextFillColor: "inherit !important",
                              transition: "background-color 5000s ease-in-out 0s",
                            },
                            "&:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                            },
                          }}
                        />
                      </HStack>
                    </VStack>

                    <VStack align="stretch" gap={1.5} w="full">
                      <Text fontSize="sm" fontWeight="semibold">
                        Role/Position
                      </Text>
                      <HStack
                        borderWidth="1px"
                        borderRadius="lg"
                        borderColor={borderColor}
                        _focusWithin={{
                          borderColor: focusBorderColor,
                          shadow: `0 0 0 1px ${focusBorderColor}`,
                          bg: inputBg
                        }}
                        bg={inputBg}
                        h="48px"
                        px={3}
                        transition="all 0.2s"
                      >
                        <Icon color={iconColor} flexShrink={0}>
                          <Briefcase size={18} />
                        </Icon>
                        <Input
                          placeholder="Software Engineer"
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          disabled={loading}
                          border="none"
                          outline="none"
                          h="full"
                          px={2}
                          bg="transparent"
                          _focus={{ border: "none", boxShadow: "none", bg: "transparent", outline: "none" }}
                          _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                          _focusVisible={{ outline: "none", boxShadow: "none" }}
                          css={{
                            "&:-webkit-autofill": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                              WebkitTextFillColor: "inherit !important",
                              transition: "background-color 5000s ease-in-out 0s",
                            },
                            "&:-webkit-autofill:hover, &:-webkit-autofill:focus": {
                              WebkitBoxShadow: `0 0 0 1000px ${inputBg} inset !important`,
                            },
                          }}
                        />
                      </HStack>
                    </VStack>

                    <Button
                      colorScheme="teal"
                      w="full"
                      onClick={handleSignup}
                      disabled={loading || !name || !email || !password}
                      size="lg"
                      h="48px"
                      borderRadius="lg"
                      fontWeight="bold"
                      bgGradient="linear(to-r, teal.500, cyan.500)"
                      _hover={{ bgGradient: "linear(to-r, teal.600, cyan.600)" }}
                      _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                      mt={2}
                    >
                      {loading ? <Spinner size="sm" /> : "Create Account"}
                    </Button>

                    <Text fontSize="xs" color={mutedText} textAlign="center" px={4}>
                      By signing up, you agree to our{" "}
                      <Link
                        color={linkColor}
                        fontWeight="medium"
                        onClick={() => setShowTerms(true)}
                        cursor="pointer"
                      >
                        Terms of Service
                      </Link>
                      {" "}and{" "}
                      <Link
                        color={linkColor}
                        fontWeight="medium"
                        onClick={() => setShowPrivacy(true)}
                        cursor="pointer"
                      >
                        Privacy Policy
                      </Link>
                    </Text>
                  </VStack>
                </MotionBox>
              )}
            </AnimatePresence>
          </Card.Body>
        </MotionCard>
      </Box>

      {/* Forgot Password Modal */}
      <Dialog.Root
        open={showForgotPassword}
        onOpenChange={(e) => {
          setShowForgotPassword(e.open);
          if (!e.open) {
            setForgotPasswordEmail("");
            setForgotPasswordError("");
            setForgotPasswordMessage("");
          }
        }}
      >
        <Dialog.Backdrop pointerEvents="none" />
        <Dialog.Positioner pointerEvents="none">
          <Dialog.Content maxW="md" mx={4} pointerEvents="auto">
            <Dialog.Header>
              <Dialog.Title>Reset Password</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body pb={6} pointerEvents="auto">
              <VStack gap={4} align="stretch">
                <Text fontSize="sm" color={mutedText}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>

                {/* Success Message */}
                {forgotPasswordMessage && (
                  <HStack
                    p={3}
                    bg={successAlertBg}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={successAlertBorder}
                    gap={2}
                  >
                    <Icon color={successAlertIconColor} flexShrink={0}>
                      <CheckCircle size={18} />
                    </Icon>
                    <Text fontSize="sm" color={successAlertTextColor} fontWeight="medium">
                      {forgotPasswordMessage}
                    </Text>
                  </HStack>
                )}

                {/* Error Message */}
                {forgotPasswordError && (
                  <HStack
                    p={3}
                    bg={errorAlertBg}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={errorAlertBorder}
                    gap={2}
                  >
                    <Icon color={errorAlertIconColor} flexShrink={0}>
                      <AlertCircle size={18} />
                    </Icon>
                    <Text fontSize="sm" color={errorAlertTextColor} fontWeight="medium">
                      {forgotPasswordError}
                    </Text>
                  </HStack>
                )}

                <VStack align="stretch" gap={1.5}>
                  <Text fontSize="sm" fontWeight="semibold">
                    Email
                  </Text>
                  <HStack
                    borderWidth="1px"
                    borderRadius="lg"
                    borderColor={borderColor}
                    _focusWithin={{
                      borderColor: focusBorderColor,
                      shadow: `0 0 0 1px ${focusBorderColor}`,
                    }}
                    bg={inputBg}
                    h="48px"
                    px={3}
                  >
                    <Icon color={iconColor} flexShrink={0}>
                      <Mail size={18} />
                    </Icon>
                    <Input
                      placeholder="you@example.com"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      disabled={forgotPasswordLoading}
                      border="none"
                      outline="none"
                      h="full"
                      px={2}
                      bg="transparent"
                      _focus={{ border: "none", boxShadow: "none", bg: "transparent", outline: "none" }}
                      _disabled={{ opacity: 0.6, cursor: "not-allowed" }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !forgotPasswordLoading) {
                          handleForgotPassword();
                        }
                      }}
                    />
                  </HStack>
                </VStack>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer gap={3} pointerEvents="auto" zIndex={9999}>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForgotPassword(false);
                }}
                pointerEvents="auto"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="solid"
                onClick={() => {
                  handleForgotPassword();
                }}
                pointerEvents="auto"
                bg="teal.500"
                color="white"
                _hover={{ bg: "teal.600" }}
              >
                Send Reset Link
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Terms of Service Modal */}
      <Dialog.Root
        open={showTerms}
        onOpenChange={(e) => setShowTerms(e.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="2xl" mx={4}>
            <Dialog.Header>
              <Dialog.Title>Terms of Service</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body pb={6}>
              <VStack gap={4} align="stretch" maxH="400px" overflowY="auto" pr={2}>
                <Text fontSize="sm">
                  <strong>Last Updated:</strong> January 2026
                </Text>

                <Box>
                  <Heading size="sm" mb={2}>1. Acceptance of Terms</Heading>
                  <Text fontSize="sm" color={mutedText}>
                    By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.
                  </Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>2. Use License</Heading>
                  <Text fontSize="sm" color={mutedText}>
                    Permission is granted to temporarily use the materials on our platform for personal, non-commercial transitory viewing only.
                  </Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>3. User Accounts</Heading>
                  <Text fontSize="sm" color={mutedText}>
                    You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
                  </Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>4. Prohibited Uses</Heading>
                  <Text fontSize="sm" color={mutedText}>
                    You may not use our service for any illegal or unauthorized purpose. You must not violate any laws in your jurisdiction.
                  </Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>5. Termination</Heading>
                  <Text fontSize="sm" color={mutedText}>
                    We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                  </Text>
                </Box>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={() => setShowTerms(false)} colorScheme="teal">
                Close
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>

      {/* Privacy Policy Modal */}
      <Dialog.Root
        open={showPrivacy}
        onOpenChange={(e) => setShowPrivacy(e.open)}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="2xl" mx={4}>
            <Dialog.Header>
              <Dialog.Title>Privacy Policy</Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger />
            <Dialog.Body pb={6}>
              <VStack gap={4} align="stretch" maxH="400px" overflowY="auto" pr={2}>
                <Text fontSize="sm">
                  <strong>Last Updated:</strong> January 2026
                </Text>

                <Box>
                  <Heading size="sm" mb={2}>1. Information We Collect</Heading>
                  <Text fontSize="sm" color={mutedText}>
                    We collect information you provide directly to us, including name, email address, and any optional information you choose to provide.
                  </Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>2. How We Use Your Information</Heading>
                  <Text fontSize="sm" color={mutedText}>
                    We use the information we collect to provide, maintain, and improve our services, to communicate with you, and to monitor and analyze trends and usage.
                  </Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>3. Information Sharing</Heading>
                  <Text fontSize="sm" color={mutedText}>
                    We do not share your personal information with third parties except as described in this privacy policy or with your consent.
                  </Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>4. Data Security</Heading>
                  <Text fontSize="sm" color={mutedText}>
                    We take reasonable measures to help protect your personal information from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction.
                  </Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>5. Your Rights</Heading>
                  <Text fontSize="sm" color={mutedText}>
                    You have the right to access, update, or delete your personal information at any time. You may also opt out of receiving promotional communications from us.
                  </Text>
                </Box>

                <Box>
                  <Heading size="sm" mb={2}>6. Cookies</Heading>
                  <Text fontSize="sm" color={mutedText}>
                    We use cookies and similar tracking technologies to track activity on our service and hold certain information to improve your experience.
                  </Text>
                </Box>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button onClick={() => setShowPrivacy(false)} colorScheme="teal">
                Close
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}