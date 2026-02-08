import React, { useState } from "react";
import {
  Box,
  Button,
  VStack,
  Input,
  Heading,
  HStack,
  Text,
  Spinner,
  Alert,
  Textarea,
  Card,
  SimpleGrid,
  Container,
  Grid,
} from "@chakra-ui/react";
import { SlideFade, ScaleFade } from "@chakra-ui/transition";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { fetchWithTimeout } from "../utils/dbUtils";
import {
  Rocket,
  BookOpen,
  ArrowRight,
  Sprout,
  Zap,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { useColorModeValue } from "../components/ui/color-mode";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const levelItems = [
  {
    label: "Beginner",
    value: "beginner",
    description: "Start from the fundamentals",
    icon: Sprout,
    color: "#10B981",
  },
  {
    label: "Intermediate",
    value: "intermediate",
    description: "Expand your knowledge",
    icon: Rocket,
    color: "#3B82F6",
  },
  {
    label: "Advanced",
    value: "advanced",
    description: "Master the subject",
    icon: Zap,
    color: "#8B5CF6",
  },
];


interface HomePageProps {
  _mode: "course" | "roadmap";
}

const HomePage: React.FC<HomePageProps> = ({ _mode = "course" }) => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [topic, setTopic] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [level, setLevel] = useState("beginner");
  const [mode, setMode] = useState<"course" | "roadmap">(_mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Theme colors
  const cardBg = useColorModeValue("white", "gray.950");
  const borderColor = useColorModeValue("gray.200", "gray.800");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const bodyText = useColorModeValue("gray.900", "gray.50");
  const accentColor = useColorModeValue("#0F766E", "#14B8A6");
  const accentHover = useColorModeValue("#0D9488", "#2DD4BF");

  const gradientText = useColorModeValue(
    "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
    "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
  );

  const handleGenerate = async () => {
    if (!user) {
      navigate("/login", { state: { returnTo: location.pathname } });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const endpoint =
        mode === "course"
          ? `${BACKEND_URL}/course/generate-course-outline`
          : `${BACKEND_URL}/roadmap/generate-roadmap`;

      const body =
        mode === "course"
          ? { topic, level, custom_prompt: customPrompt, roadmap_name: null }
          : { roadmap_name: topic, custom_prompt: customPrompt };

      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(body),
        },
        600000,
      );

      if (!response.ok) throw new Error("Failed to generate");

      if (mode === "course") navigate("/my-courses");
      else navigate("/my-roadmaps");
    } catch (err) {
      console.error("Generation error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" position="relative">
      {/* Subtle background gradient */}
      <Box
        position="absolute"
        top="0"
        left="50%"
        transform="translateX(-50%)"
        width="100%"
        height="600px"
        bgGradient={useColorModeValue(
          "radial(ellipse at top, rgba(20, 184, 166, 0.05) 0%, transparent 60%)",
          "radial(ellipse at top, rgba(20, 184, 166, 0.08) 0%, transparent 60%)"
        )}
        pointerEvents="none"
        zIndex={0}
      />

      <Container
        maxW="1100px"
        py={{ base: 8, md: 20 }}
        px={{ base: 4, md: 6 }}
        position="relative"
        zIndex={1}
      >
        {/* Hero Section */}
        <VStack gap={{ base: 6, md: 12 }} mb={{ base: 8, md: 16 }}>
          <VStack gap={{ base: 3, md: 5 }} textAlign="center" maxW="800px">
            {/* Badge */}
            <HStack
              gap={2}
              px={{ base: 2.5, md: 3 }}
              py={{ base: 1, md: 1.5 }}
              bg={useColorModeValue("purple.50", "rgba(20, 184, 166, 0.1)")}
              borderRadius="full"
              display="inline-flex"

            >
              <Box
                w={2}
                h={2}
                bg="blue.600"
                borderRadius="full"
                animation="pulse 2s ease-in-out infinite"
              />
              <Text
                fontSize={{ base: "2xs", md: "xs" }}
                fontWeight="600"
                color={useColorModeValue("blue.700", "blue.500")}
                letterSpacing="0.5px"
              >
                AI-Powered Learning Platform
              </Text>
            </HStack>

            {/* Main Heading */}
            <Heading
              as="h1"
              fontSize={{ base: "2rem", sm: "2.5rem", md: "4rem", lg: "4.5rem" }}
              fontWeight="700"
              lineHeight="1.1"
              letterSpacing="-0.02em"
              bgGradient={gradientText}
              bgClip="text"
              px={{ base: 2, md: 0 }}
            >
              Learn Anything. Faster.
            </Heading>

            {/* Subtitle */}
            <Text
              fontSize={{ base: "md", md: "xl" }}
              color={mutedText}
              maxW="600px"
              lineHeight="1.7"
              fontWeight="400"
              px={{ base: 2, md: 0 }}
            >
              Create personalized learning paths powered by AI. From beginner to
              expert, get a curriculum designed for your goals.
            </Text>
          </VStack>

          {/* Main Card */}
          <Card.Root
            maxW="720px"
            w="100%"
            bg={cardBg}
            borderRadius={{ base: "xl", md: "2xl" }}
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow={useColorModeValue(
              "0 4px 24px rgba(0, 0, 0, 0.06)",
              "0 4px 24px rgba(0, 0, 0, 0.3)"
            )}
          >
            <Card.Body p={{ base: 4, md: 8 }}>
              <VStack gap={{ base: 5, md: 7 }} w="100%">
                {/* Topic Input */}
                <VStack gap={3} w="100%" align="start">
                  <HStack justify="space-between" w="100%">
                    <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="600" color={bodyText}>
                      What do you want to learn?
                    </Text>
                    {topic && (
                      <HStack gap={1.5} color="teal.500">
                        <CheckCircle2 size={14} />
                        <Text fontSize="xs" fontWeight="500">
                          Ready
                        </Text>
                      </HStack>
                    )}
                  </HStack>

                  <Input
                    placeholder="e.g., Python Programming"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    height={{ base: "48px", md: "56px" }}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={topic ? accentColor : borderColor}
                    bg={cardBg}
                    fontSize={{ base: "15px", md: "md" }}
                    fontWeight="400"
                    px={{ base: 3, md: 4 }}
                    _focus={{
                      borderColor: accentColor,
                      boxShadow: `0 0 0 3px ${useColorModeValue("rgba(15, 118, 110, 0.1)", "rgba(20, 184, 166, 0.15)")}`,
                      outline: "none",
                    }}
                    _placeholder={{
                      color: mutedText,
                      fontSize: { base: "14px", md: "md" }
                    }}
                    transition="all 0.2s"
                  />
                </VStack>

                {/* Format Selection */}
                <VStack gap={3} w="100%" align="start">
                  <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="600" color={bodyText}>
                    Choose format
                  </Text>

                  <Grid templateColumns="repeat(2, 1fr)" gap={{ base: 2, md: 3 }} w="100%">
                    <Box
                      onClick={() => setMode("course")}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ transform: "translateY(-2px)" }}
                      h="100%"
                      display="flex"
                    >
                      <Box
                        p={{ base: 3, md: 5 }}
                        borderRadius="lg"
                        borderWidth="1.5px"
                        borderColor={
                          mode === "course" ? accentColor : borderColor
                        }
                        bg={mode === "course" ? useColorModeValue("teal.50", "rgba(20, 184, 166, 0.05)") : cardBg}
                        transition="all 0.2s"
                        w="100%"
                        display="flex"
                        flexDirection="column"
                      >
                        <VStack align="start" gap={{ base: 2, md: 3 }} flex="1">
                          <HStack justify="space-between" w="100%">
                            <Box
                              p={{ base: 2, md: 2.5 }}
                              bg={useColorModeValue("blue.100", "rgba(59, 130, 246, 0.15)")}
                              borderRadius="md"
                            >
                              <BookOpen size={18} color="#3B82F6" />
                            </Box>
                            {mode === "course" && (
                              <CheckCircle2 size={16} color={accentColor} />
                            )}
                          </HStack>

                          <VStack align="start" gap={1} flex="1">
                            <Text fontWeight="600" fontSize={{ base: "sm", md: "md" }} color={bodyText}>
                              Course
                            </Text>
                            <Text fontSize={{ base: "xs", md: "sm" }} color={mutedText} lineHeight="1.5">
                              Lessons & projects
                            </Text>
                          </VStack>
                        </VStack>
                      </Box>
                    </Box>

                    <Box
                      onClick={() => setMode("roadmap")}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ transform: "translateY(-2px)" }}
                      h="100%"
                      display="flex"
                    >
                      <Box
                        p={{ base: 3, md: 5 }}
                        borderRadius="lg"
                        borderWidth="1.5px"
                        borderColor={
                          mode === "roadmap" ? accentColor : borderColor
                        }
                        bg={mode === "roadmap" ? useColorModeValue("teal.50", "rgba(20, 184, 166, 0.05)") : cardBg}
                        transition="all 0.2s"
                        w="100%"
                        display="flex"
                        flexDirection="column"
                      >
                        <VStack align="start" gap={{ base: 2, md: 3 }} flex="1">
                          <HStack justify="space-between" w="100%">
                            <Box
                              p={{ base: 2, md: 2.5 }}
                              bg={useColorModeValue("purple.100", "rgba(139, 92, 246, 0.15)")}
                              borderRadius="md"
                            >
                              <Rocket size={18} color="#8B5CF6" />
                            </Box>
                            {mode === "roadmap" && (
                              <CheckCircle2 size={16} color={accentColor} />
                            )}
                          </HStack>

                          <VStack align="start" gap={1} flex="1">
                            <Text fontWeight="600" fontSize={{ base: "sm", md: "md" }} color={bodyText}>
                              Roadmap
                            </Text>
                            <Text fontSize={{ base: "xs", md: "sm" }} color={mutedText} lineHeight="1.5">
                              Path to expertise
                            </Text>
                          </VStack>
                        </VStack>
                      </Box>
                    </Box>
                  </Grid>
                </VStack>

                {/* Skill Level */}
                {mode === "course" && (
                  <SlideFade in={mode === "course"} offsetY="10px">
                    <VStack gap={3} w="100%" align="start">
                      <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="600" color={bodyText}>
                        Your current level
                      </Text>

                      <SimpleGrid columns={3} gap={{ base: 2, md: 3 }} w="100%">
                        {levelItems.map((item) => (
                          <Box
                            key={item.value}
                            onClick={() => setLevel(item.value)}
                            cursor="pointer"
                            transition="all 0.2s"
                            _hover={{ transform: "translateY(-2px)" }}
                            h="100%"
                            display="flex"
                          >
                            <Box
                              p={{ base: 3, md: 4 }}
                              borderRadius="lg"
                              borderWidth="1.5px"
                              borderColor={
                                level === item.value ? accentColor : borderColor
                              }
                              bg={level === item.value ? useColorModeValue("teal.50", "rgba(20, 184, 166, 0.05)") : cardBg}
                              transition="all 0.2s"
                              position="relative"
                              w="100%"
                              display="flex"
                            >
                              <VStack gap={{ base: 1.5, md: 2.5 }} align="center" w="100%" flex="1">
                                <item.icon size={22} color={item.color} />
                                <VStack gap={0.5} flex="1" justify="center">
                                  <Text
                                    fontWeight="600"
                                    fontSize={{ base: "xs", md: "sm" }}
                                    color={bodyText}
                                  >
                                    {item.label}
                                  </Text>
                                  <Text
                                    fontSize="2xs"
                                    color={mutedText}
                                    textAlign="center"
                                    display={{ base: "none", sm: "block" }}
                                  >
                                    {item.description}
                                  </Text>
                                </VStack>
                              </VStack>

                              {level === item.value && (
                                <Box
                                  position="absolute"
                                  top={2}
                                  right={2}
                                >
                                  <CheckCircle2 size={12} color={accentColor} />
                                </Box>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </VStack>
                  </SlideFade>
                )}

                {/* Custom Instructions */}
                <Box w="100%">
                  {!showAdvanced ? (
                    <Button
                      onClick={() => setShowAdvanced(true)}
                      variant="ghost"
                      size={{ base: "md", md: "md" }}
                      w="100%"
                      h={{ base: "44px", md: "48px" }}
                      borderRadius="lg"
                      color={mutedText}
                      borderWidth="1px"
                      borderColor={borderColor}
                      borderStyle="dashed"
                      _hover={{
                        bg: useColorModeValue("gray.50", "gray.800"),
                        borderColor: accentColor,
                        color: accentColor,
                      }}
                      transition="all 0.2s"
                    >
                      <HStack gap={2}>
                        <Sparkles size={14} />
                        <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="500">
                          Add custom instructions
                        </Text>
                      </HStack>
                    </Button>
                  ) : (
                    <ScaleFade in={showAdvanced}>
                      <VStack gap={3} w="100%" align="start">
                        <HStack justify="space-between" w="100%">
                          <Text fontSize={{ base: "xs", md: "sm" }} fontWeight="600" color={bodyText}>
                            Custom instructions
                          </Text>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => {
                              setShowAdvanced(false);
                              setCustomPrompt("");
                            }}
                            color={mutedText}
                            _hover={{ color: "red.500" }}
                          >
                            Remove
                          </Button>
                        </HStack>

                        <Textarea
                          placeholder="Add specific requirements...&#10;&#10;Examples:&#10;• Focus on hands-on projects&#10;• Include real-world examples"
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          size="md"
                          rows={4}
                          borderRadius="lg"
                          borderWidth="1px"
                          borderColor={borderColor}
                          fontSize={{ base: "13px", md: "sm" }}
                          _focus={{
                            borderColor: accentColor,
                            boxShadow: `0 0 0 3px ${useColorModeValue("rgba(15, 118, 110, 0.1)", "rgba(20, 184, 166, 0.15)")}`,
                          }}
                          resize="vertical"
                          lineHeight="1.6"
                        />
                      </VStack>
                    </ScaleFade>
                  )}
                </Box>

                {/* Generate Button */}
                <Button
                  size={{ base: "md", md: "lg" }}
                  w="100%"
                  h={{ base: "48px", md: "56px" }}
                  borderRadius="lg"
                  onClick={handleGenerate}
                  disabled={!topic || loading}
                  bg={accentColor}
                  color="white"
                  fontSize={{ base: "sm", md: "md" }}
                  fontWeight="600"
                  _hover={{
                    bg: accentHover,
                    transform: !topic || loading ? "none" : "translateY(-1px)",
                  }}
                  _active={{
                    transform: "translateY(0)",
                  }}
                  _disabled={{
                    opacity: 0.5,
                    cursor: "not-allowed",
                  }}
                  boxShadow={
                    !topic || loading
                      ? "none"
                      : useColorModeValue(
                        "0 4px 12px rgba(15, 118, 110, 0.25)",
                        "0 4px 12px rgba(20, 184, 166, 0.3)"
                      )
                  }
                  transition="all 0.2s"
                >
                  {loading ? (
                    <HStack gap={3}>
                      <Spinner size="sm" />
                      <Text>Generating...</Text>
                    </HStack>
                  ) : (
                    <HStack gap={2}>
                      <Text>
                        Create {mode === "course" ? "Course" : "Roadmap"}
                      </Text>
                      <ArrowRight size={16} />
                    </HStack>
                  )}
                </Button>

                {/* Error Alert */}
                {error && (
                  <ScaleFade in={!!error}>
                    <Alert.Root status="error" borderRadius="lg">
                      <Alert.Indicator />
                      <Alert.Title fontSize={{ base: "xs", md: "sm" }}>{error}</Alert.Title>
                    </Alert.Root>
                  </ScaleFade>
                )}
              </VStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Container>

      {/* Animations */}
      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </Box>
  );
};

export default HomePage;