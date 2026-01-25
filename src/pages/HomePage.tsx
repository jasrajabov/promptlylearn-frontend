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
  Badge,
} from "@chakra-ui/react";
import { Fade, SlideFade, ScaleFade } from "@chakra-ui/transition";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { fetchWithTimeout } from "../utils/dbUtils";
import {
  Rocket,
  BookOpen,
  ArrowRight,
  Code,
  Computer,
  Sprout,
  Zap,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useColorModeValue } from "../components/ui/color-mode";
import { motion } from "framer-motion";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const MotionBox = motion(Box);
const MotionCard = motion(Card.Root);

const levelItems = [
  {
    label: "Beginner",
    value: "beginner",
    description: "Start from basics",
    icon: Sprout,
    color: "#10B981",
  },
  {
    label: "Intermediate",
    value: "intermediate",
    description: "Build knowledge",
    icon: Rocket,
    color: "#3B82F6",
  },
  {
    label: "Advanced",
    value: "advanced",
    description: "Master it",
    icon: Zap,
    color: "#F59E0B",
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

  const cardBg = useColorModeValue("white", "gray.950");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const bodyText = useColorModeValue("gray.700", "gray.300");
  const accentColor = useColorModeValue("teal.600", "teal.400");
  const highlightBg = useColorModeValue("teal.50", "rgba(20, 184, 166, 0.08)");
  const gradientText = useColorModeValue(
    "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
    "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1] as const,
      },
    },
  };

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
          ? { topic, level, custom_prompt: customPrompt }
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
    <Box minH="100vh" position="relative" overflowX="hidden">
      {/* Background glow */}
      <Box
        position="absolute"
        top="-10%"
        left="50%"
        transform="translateX(-50%)"
        width={{ base: "400px", md: "800px" }}
        height={{ base: "300px", md: "500px" }}
        bgGradient="radial(circle at center, teal.400 0%, transparent 70%)"
        opacity={useColorModeValue(0.05, 0.03)}
        filter="blur(80px)"
        pointerEvents="none"
        zIndex={0}
      />

      <Container
        maxW="900px"
        py={{ base: 6, md: 12 }}
        px={{ base: 4, md: 6 }}
        position="relative"
        zIndex={1}
      >
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* HERO - Compact */}
          <MotionBox variants={itemVariants} textAlign="center" mb={{ base: 6, md: 10 }}>
            <VStack gap={{ base: 3, md: 4 }}>
              {/* Badge */}
              <HStack
                gap={2}
                justify="center"
                px={3}
                py={1.5}
                bg={highlightBg}
                borderRadius="full"
                borderWidth="1px"
                borderColor={useColorModeValue("teal.200", "teal.800")}
                display="inline-flex"
              >
                <Sparkles size={12} color="#14B8A6" />
                <Text
                  fontSize="2xs"
                  fontWeight="600"
                  color={accentColor}
                  letterSpacing="wide"
                >
                  AI-Powered Learning
                </Text>
              </HStack>

              {/* Heading */}
              <Heading
                fontSize={{ base: "3xl", sm: "4xl", md: "5xl", lg: "6xl" }}
                fontWeight="800"
                bgGradient={gradientText}
                bgClip="text"
                lineHeight="1.1"
                letterSpacing="-0.02em"
                maxW="700px"
              >
                Learn Anything. Faster.
              </Heading>

              {/* Subtitle */}
              <Text
                fontSize={{ base: "sm", md: "md" }}
                maxW="500px"
                lineHeight="1.5"
                color={mutedText}
                px={{ base: 2, md: 0 }}
              >
                AI-powered courses & roadmaps, personalized for you
              </Text>
            </VStack>
          </MotionBox>

          {/* MAIN CARD - Compact */}
          <MotionCard
            variants={itemVariants}
            maxW="700px"
            mx="auto"
            mb={{ base: 8, md: 12 }}
            bg={cardBg}
            borderRadius={{ base: "2xl", md: "3xl" }}
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow={useColorModeValue(
              "0 10px 40px -12px rgba(0, 0, 0, 0.1)",
              "0 10px 40px -12px rgba(0, 0, 0, 0.3)"
            )}
            overflow="hidden"
          >
            <Card.Body p={{ base: 5, md: 7 }}>
              <VStack gap={{ base: 4, md: 5 }} w="100%">
                {/* Topic Input */}
                <Box w="100%">
                  <Text
                    fontSize="xs"
                    fontWeight="600"
                    color={bodyText}
                    mb={2}
                  >
                    What do you want to learn?
                  </Text>

                  <Box position="relative" w="100%">
                    <Input
                      placeholder="e.g., React, Machine Learning, GenAI..."
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      height={{ base: "48px", md: "52px" }}
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor={topic ? accentColor : borderColor}
                      bg={cardBg}
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: `0 0 0 3px ${useColorModeValue("rgba(20, 184, 166, 0.12)", "rgba(20, 184, 166, 0.15)")}`,
                        outline: "none",
                      }}
                      px={4}
                      fontSize="sm"
                      fontWeight="500"
                      transition="all 0.2s"
                    />
                    {topic && (
                      <Box
                        position="absolute"
                        right={3}
                        top="50%"
                        transform="translateY(-50%)"
                        p={1.5}
                        bg={accentColor}
                        borderRadius="lg"
                        color="white"
                      >
                        <CheckCircle2 size={14} />
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Divider */}
                <Box w="100%" h="1px" bg={borderColor} />

                {/* Mode Selection */}
                <Box w="100%">
                  <Text fontSize="xs" fontWeight="600" color={bodyText} mb={2}>
                    Choose format
                  </Text>

                  <SimpleGrid columns={2} gap={3} w="100%">
                    {/* Course */}
                    <Box
                      onClick={() => setMode("course")}
                      p={{ base: 3, md: 4 }}
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor={mode === "course" ? accentColor : borderColor}
                      bg={mode === "course" ? highlightBg : cardBg}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{
                        borderColor: accentColor,
                        transform: "translateY(-2px)",
                      }}
                      _active={{
                        transform: "scale(0.98)",
                      }}
                    >
                      <VStack align="start" gap={2}>
                        <HStack justify="space-between" w="100%">
                          <Box
                            p={2}
                            bg={useColorModeValue("orange.50", "rgba(251, 146, 60, 0.1)")}
                            borderRadius="lg"
                          >
                            <BookOpen size={18} color="#F59E0B" />
                          </Box>
                          {mode === "course" && (
                            <Box p={0.5} bg={accentColor} borderRadius="full" color="white">
                              <CheckCircle2 size={12} />
                            </Box>
                          )}
                        </HStack>
                        <VStack align="start" gap={0}>
                          <Text fontWeight="700" fontSize="md" color={bodyText}>
                            Course
                          </Text>
                          <Text fontSize="2xs" color={mutedText}>
                            Lessons & exercises
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>

                    {/* Roadmap */}
                    <Box
                      onClick={() => setMode("roadmap")}
                      p={{ base: 3, md: 4 }}
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor={mode === "roadmap" ? accentColor : borderColor}
                      bg={mode === "roadmap" ? highlightBg : cardBg}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{
                        borderColor: accentColor,
                        transform: "translateY(-2px)",
                      }}
                      _active={{
                        transform: "scale(0.98)",
                      }}
                    >
                      <VStack align="start" gap={2}>
                        <HStack justify="space-between" w="100%">
                          <Box
                            p={2}
                            bg={useColorModeValue("green.50", "rgba(16, 185, 129, 0.1)")}
                            borderRadius="lg"
                          >
                            <Rocket size={18} color="#10B981" />
                          </Box>
                          {mode === "roadmap" && (
                            <Box p={0.5} bg={accentColor} borderRadius="full" color="white">
                              <CheckCircle2 size={12} />
                            </Box>
                          )}
                        </HStack>
                        <VStack align="start" gap={0}>
                          <Text fontWeight="700" fontSize="md" color={bodyText}>
                            Learning Track
                          </Text>
                          <Text fontSize="2xs" color={mutedText}>
                            Complete path
                          </Text>
                        </VStack>
                      </VStack>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Skill Level (Course only) */}
                {mode === "course" && (
                  <Box w="100%">
                    <Box w="100%" h="1px" bg={borderColor} mb={4} />

                    <SlideFade in={mode === "course"} offsetY="15px">
                      <VStack align="start" gap={3} w="100%">
                        <Text fontSize="xs" fontWeight="600" color={bodyText}>
                          Select skill level
                        </Text>

                        <SimpleGrid columns={3} gap={2} w="100%">
                          {levelItems.map((item) => (
                            <Box
                              key={item.value}
                              p={3}
                              borderRadius="xl"
                              bg={level === item.value ? highlightBg : cardBg}
                              borderWidth="2px"
                              borderColor={level === item.value ? accentColor : borderColor}
                              cursor="pointer"
                              onClick={() => setLevel(item.value)}
                              transition="all 0.2s"
                              _hover={{
                                borderColor: accentColor,
                                transform: "translateY(-2px)",
                              }}
                              _active={{
                                transform: "scale(0.98)",
                              }}
                              position="relative"
                            >
                              <VStack gap={1.5} align="center">
                                <item.icon size={20} color={item.color} />
                                <Text fontWeight="700" fontSize="2xs" color={bodyText}>
                                  {item.label}
                                </Text>
                                {/* <Text fontSize="3xs" color={mutedText} textAlign="center" display={{ base: "none", sm: "block" }}>
                                  {item.description}
                                </Text> */}

                                {level === item.value && (
                                  <Box
                                    position="absolute"
                                    top={2}
                                    right={2}
                                    p={0.5}
                                    bg={accentColor}
                                    borderRadius="full"
                                    color="white"
                                  >
                                    <CheckCircle2 size={10} />
                                  </Box>
                                )}
                              </VStack>
                            </Box>
                          ))}
                        </SimpleGrid>
                      </VStack>
                    </SlideFade>
                  </Box>
                )}

                {/* Roadmap Info */}
                {mode === "roadmap" && (
                  <Box w="100%">
                    <Box w="100%" h="1px" bg={borderColor} mb={4} />

                    <Fade in={mode === "roadmap"}>
                      <Box
                        p={5}
                        bg={highlightBg}
                        borderRadius="xl"
                        borderWidth="2px"
                        borderColor={useColorModeValue("teal.200", "teal.800")}
                      >
                        <VStack gap={3}>
                          <Box
                            p={3}
                            bgGradient="linear(to-br, green.400, emerald.600)"
                            borderRadius="xl"
                            color="white"
                          >
                            <Rocket size={24} />
                          </Box>
                          <VStack gap={1}>
                            <Text fontWeight="700" color={accentColor} fontSize="sm">
                              Complete Learning Path
                            </Text>
                            <Text textAlign="center" color={mutedText} fontSize="xs" lineHeight="1.5">
                              Structured roadmap from beginner to expert
                            </Text>
                          </VStack>
                        </VStack>
                      </Box>
                    </Fade>
                  </Box>
                )}

                {/* Custom Prompt */}
                <Box w="100%">
                  <Box w="100%" h="1px" bg={borderColor} mb={3} />

                  {!showAdvanced ? (
                    <Button
                      onClick={() => setShowAdvanced(true)}
                      variant="ghost"
                      size="sm"
                      borderRadius="lg"
                      w="100%"
                      py={3}
                      color={mutedText}
                      borderWidth="1px"
                      borderColor="transparent"
                      _hover={{
                        bg: highlightBg,
                        color: accentColor,
                        borderColor: accentColor,
                      }}
                    >
                      <HStack gap={1.5}>
                        <Sparkles size={14} />
                        <Text fontSize="xs" fontWeight="600">
                          Add custom instructions
                        </Text>
                      </HStack>
                    </Button>
                  ) : (
                    <ScaleFade in={showAdvanced}>
                      <VStack align="start" gap={2} w="100%">
                        <HStack justify="space-between" w="100%">
                          <Text fontSize="xs" fontWeight="600" color={bodyText}>
                            Custom Instructions
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
                            <Text fontSize="2xs">Remove</Text>
                          </Button>
                        </HStack>
                        <Textarea
                          placeholder="Add requirements...&#10;• Focus on projects&#10;• Include videos"
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          size="sm"
                          rows={4}
                          borderRadius="lg"
                          borderWidth="2px"
                          borderColor={borderColor}
                          bg={cardBg}
                          fontSize="xs"
                          _focus={{
                            borderColor: accentColor,
                            boxShadow: `0 0 0 3px ${useColorModeValue("rgba(20, 184, 166, 0.1)", "rgba(20, 184, 166, 0.15)")}`,
                          }}
                          resize="vertical"
                          lineHeight="1.5"
                        />
                      </VStack>
                    </ScaleFade>
                  )}
                </Box>

                {/* Generate Button */}
                <Box w="100%" pt={2}>
                  <Button
                    colorPalette="teal"
                    size="lg"
                    width="100%"
                    height={{ base: "52px", md: "56px" }}
                    borderRadius="xl"
                    onClick={handleGenerate}
                    disabled={!topic || loading}
                    fontSize="sm"
                    fontWeight="700"
                    bgGradient="linear(to-r, teal.500, cyan.500)"
                    boxShadow="0 4px 14px rgba(20, 184, 166, 0.3)"
                    _hover={{
                      bgGradient: "linear(to-r, teal.600, cyan.600)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(20, 184, 166, 0.4)",
                    }}
                    _active={{
                      transform: "translateY(0)",
                    }}
                    _disabled={{
                      opacity: 0.5,
                      cursor: "not-allowed",
                      transform: "none",
                    }}
                    transition="all 0.2s"
                  >
                    {loading ? (
                      <HStack gap={2}>
                        <Spinner size="sm" />
                        <Text>Generating...</Text>
                      </HStack>
                    ) : (
                      <HStack gap={2}>
                        <Sparkles size={16} />
                        <Text>
                          Generate {mode === "course" ? "Course" : "Track"}
                        </Text>
                        <ArrowRight size={16} />
                      </HStack>
                    )}
                  </Button>
                </Box>

                {/* Error */}
                {error && (
                  <ScaleFade in={!!error}>
                    <Alert.Root status="error" borderRadius="xl" w="100%">
                      <Alert.Indicator />
                      <Alert.Title fontSize="sm">{error}</Alert.Title>
                    </Alert.Root>
                  </ScaleFade>
                )}
              </VStack>
            </Card.Body>
          </MotionCard>
        </MotionBox>
      </Container>
    </Box >
  );
};

export default HomePage;