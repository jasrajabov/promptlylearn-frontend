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
  Badge
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
    description: "Just starting out",
    icon: Sprout,
    color: "#10B981", // Green
  },
  {
    label: "Intermediate",
    value: "intermediate",
    description: "Some experience",
    icon: Rocket,
    color: "#3B82F6", // Blue
  },
  {
    label: "Advanced",
    value: "advanced",
    description: "Deep expertise",
    icon: Zap,
    color: "#F59E0B", // Orange
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
  const accentColor = useColorModeValue("teal.600", "teal.400");
  const highlightBg = useColorModeValue("teal.50", "rgba(20, 184, 166, 0.1)");
  const gradientText = useColorModeValue(
    "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
    "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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
        ease: [0.4, 0, 0.2, 1] as const,
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
    <Box minH="100vh" position="relative">
      {/* Subtle modern background glow */}
      <Box
        position="absolute"
        top="0"
        left="50%"
        transform="translateX(-50%)"
        width="800px"
        height="400px"
        bgGradient="radial(teal.400, transparent)"
        opacity={0.05}
        filter="blur(100px)"
        pointerEvents="none"
      />

      <Container
        maxW="1400px"
        py={{ base: 12, md: 20 }}
        px={{ base: 4, md: 8 }}
      >
        <MotionBox
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* HERO SECTION */}
          <MotionBox variants={itemVariants} textAlign="center" mb={16}>
            <VStack gap={6}>
              {/* Main Heading */}
              <VStack gap={3}>
                <Heading
                  fontSize={{ base: "4xl", md: "6xl" }}
                  fontWeight="900"
                  bgGradient={gradientText}
                  bgClip="text"
                  lineHeight="1.15"
                  letterSpacing="-0.04em"
                  maxW="1000px"
                >
                  Learn Anything. Faster.
                </Heading>
                <Text
                  fontSize={{ base: "lg", md: "xl" }}
                  maxW="600px"
                  lineHeight="1.6"
                  color={mutedText}
                >
                  Generate personalized learning paths in seconds.
                </Text>
              </VStack>
            </VStack>
          </MotionBox>

          {/* MAIN GENERATOR CARD */}
          <MotionCard
            variants={itemVariants}
            maxW="800px"
            mx="auto"
            mb={20}
            backdropFilter="blur(20px)"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.08)"
            overflow="hidden"
            whileHover={{ boxShadow: "0 12px 48px rgba(0, 0, 0, 0.12)" }}
            transition={{ duration: 0.3 } as any}
          >
            <Card.Body p={{ base: 6, md: 10 }}>
              <VStack gap={6} w="100%">
                {/* Topic Input - Enhanced & Compact */}
                <Box w="100%">
                  <HStack mb={2} justify="space-between" align="center">
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      color={accentColor}
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Topic
                    </Text>
                    <Text fontSize="2xs" color={mutedText}>
                      What would you like to learn?
                    </Text>
                  </HStack>
                  <Box position="relative">
                    <Input
                      placeholder="e.g. Machine Learning, Photography, Spanish..."
                      value={topic}
                      size="lg"
                      onChange={(e) => setTopic(e.target.value)}
                      height="56px"
                      borderRadius="xl"
                      borderWidth="2px"
                      borderColor={topic ? accentColor : borderColor}
                      bg={cardBg}
                      _focus={{
                        borderColor: accentColor,
                        boxShadow: `0 0 0 3px ${useColorModeValue("rgba(20, 184, 166, 0.1)", "rgba(20, 184, 166, 0.2)")}`,
                        outline: "none",
                      }}
                      _hover={{
                        borderColor: useColorModeValue("gray.300", "gray.600"),
                      }}
                      px={5}
                      fontSize="md"
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
                        bg={highlightBg}
                        borderRadius="lg"
                      >
                        <Text fontSize="sm">✓</Text>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Divider */}
                <Box w="100%" h="1px" bg={borderColor} />

                {/* Mode Tabs - Enhanced & Compact */}
                <Box w="100%">
                  <HStack mb={2} justify="space-between" align="center">
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      color={accentColor}
                      textTransform="uppercase"
                      letterSpacing="wider"
                    >
                      Format
                    </Text>
                  </HStack>
                  <SimpleGrid
                    columns={{ base: 2, md: 4 }}
                    gap={2.5}
                    w="100%"
                  >
                    {/* Main tabs */}
                    <Box
                      onClick={() => setMode("course")}
                      px={3}
                      py={2.5}
                      borderRadius="lg"
                      borderWidth="1.5px"
                      borderColor={
                        mode === "course" ? accentColor : borderColor
                      }
                      bg={mode === "course" ? highlightBg : cardBg}
                      cursor="pointer"
                      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      position="relative"
                      transform={
                        mode === "course" ? "translateY(-1px)" : "none"
                      }
                      boxShadow={
                        mode === "course"
                          ? "0 3px 10px rgba(20, 184, 166, 0.15)"
                          : "none"
                      }
                      _hover={{
                        borderColor:
                          mode === "course"
                            ? accentColor
                            : useColorModeValue("gray.300", "gray.600"),
                        transform: "translateY(-1px)",
                      }}
                    >
                      <HStack gap={2} justify="center">
                        <BookOpen size={16} color="#F59E0B" />
                        <Text fontWeight="600" fontSize="xs">
                          Course
                        </Text>
                      </HStack>
                    </Box>

                    <Box
                      onClick={() => setMode("roadmap")}
                      px={3}
                      py={2.5}
                      borderRadius="lg"
                      borderWidth="1.5px"
                      borderColor={
                        mode === "roadmap" ? accentColor : borderColor
                      }
                      bg={mode === "roadmap" ? highlightBg : cardBg}
                      cursor="pointer"
                      transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                      position="relative"
                      transform={
                        mode === "roadmap" ? "translateY(-1px)" : "none"
                      }
                      boxShadow={
                        mode === "roadmap"
                          ? "0 3px 10px rgba(20, 184, 166, 0.15)"
                          : "none"
                      }
                      _hover={{
                        borderColor:
                          mode === "roadmap"
                            ? accentColor
                            : useColorModeValue("gray.300", "gray.600"),
                        transform: "translateY(-1px)",
                      }}
                    >
                      <HStack gap={2} justify="center">
                        <Rocket size={16} color="#10B981" />
                        <Text fontWeight="600" fontSize="xs">
                          Track
                        </Text>
                      </HStack>
                    </Box>

                    {/* Coming Soon buttons */}
                    <Box
                      px={3}
                      py={2.5}
                      borderRadius="lg"
                      borderWidth="1.5px"
                      borderColor={borderColor}
                      bg={useColorModeValue("gray.50", "gray.800")}
                      opacity={0.6}
                      cursor="not-allowed"
                      position="relative"
                    >
                      <HStack gap={2} justify="center">
                        <Code size={16} color="#8B5CF6" />
                        <Text fontWeight="600" fontSize="xs">
                          Playground
                        </Text>
                      </HStack>
                      <Badge
                        position="absolute"
                        top="-6px"
                        right="-6px"
                        bg="purple.500"
                        borderRadius="full"
                        fontWeight="700"
                        lineHeight="1"
                      >
                        Soon
                      </Badge>
                    </Box>

                    <Box
                      px={3}
                      py={2.5}
                      borderRadius="lg"
                      borderWidth="1.5px"
                      borderColor={borderColor}
                      bg={useColorModeValue("gray.50", "gray.800")}
                      opacity={0.6}
                      cursor="not-allowed"
                      position="relative"
                    >
                      <HStack gap={2} justify="center">
                        <Computer size={16} />
                        <Text fontWeight="600" fontSize="xs">
                          Interview
                        </Text>
                      </HStack>
                      <Badge
                        position="absolute"
                        top="-6px"
                        right="-6px"
                        bg="purple.500"
                        borderRadius="full"
                        fontWeight="700"
                        lineHeight="1"
                      >
                        Soon
                      </Badge>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Course/Roadmap Content - More Compact */}
                {mode === "course" && (
                  <Box w="100%">
                    <Box w="100%" h="1px" bg={borderColor} mb={4} />
                    <HStack mb={2} justify="space-between" align="center">
                      <Text
                        fontSize="2xs"
                        fontWeight="700"
                        color={accentColor}
                        textTransform="uppercase"
                        letterSpacing="wider"
                      >
                        Skill Level
                      </Text>
                    </HStack>
                    <SlideFade in={mode === "course"} offsetY="15px">
                      <Box>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                          {levelItems.map((item) => (
                            <Box
                              key={item.value}
                              p={4}
                              borderRadius="lg"
                              bg={level === item.value ? highlightBg : cardBg}
                              borderWidth="2px"
                              borderColor={
                                level === item.value ? accentColor : borderColor
                              }
                              cursor="pointer"
                              onClick={() => setLevel(item.value)}
                              transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                              position="relative"
                              _hover={{
                                borderColor: accentColor,
                                transform: "translateY(-2px)",
                                boxShadow:
                                  level === item.value
                                    ? "0 8px 20px rgba(20, 184, 166, 0.2)"
                                    : "0 4px 12px rgba(0, 0, 0, 0.06)",
                              }}
                              _active={{
                                transform: "scale(0.98)",
                              }}
                            >
                              <VStack gap={2} align="center">
                                <item.icon size={28} color={item.color} />

                                <Text fontWeight="700" fontSize="sm">
                                  {item.label}
                                </Text>
                                <Text
                                  fontSize="2xs"
                                  color={mutedText}
                                  textAlign="center"
                                >
                                  {item.description}
                                </Text>
                              </VStack>
                            </Box>
                          ))}
                        </SimpleGrid>
                      </Box>
                    </SlideFade>
                  </Box>
                )}

                {mode === "roadmap" && (
                  <Box w="100%">
                    <Box w="100%" h="1px" bg={borderColor} mb={4} />
                    <Fade in={mode === "roadmap"}>
                      <Box
                        p={5}
                        bg={highlightBg}
                        borderRadius="lg"
                        borderWidth="2px"
                        borderColor={accentColor}
                        boxShadow="0 3px 10px rgba(20, 184, 166, 0.08)"
                      >
                        <VStack gap={2.5}>
                          <Box
                            p={2.5}
                            bg={useColorModeValue(
                              "teal.100",
                              "rgba(20, 184, 166, 0.2)",
                            )}
                            borderRadius="lg"
                          >
                            <Rocket size={24} color="#14B8A6" />
                          </Box>
                          <Text fontWeight="700" color={accentColor} fontSize="sm">
                            Complete Learning Path
                          </Text>
                          <Text
                            textAlign="center"
                            color={mutedText}
                            fontSize="xs"
                            maxW="400px"
                            lineHeight="1.5"
                          >
                            Get a comprehensive roadmap from fundamentals to
                            mastery with structured milestones
                          </Text>
                        </VStack>
                      </Box>
                    </Fade>
                  </Box>
                )}

                {/* Custom Prompt - More Compact */}
                <Box w="100%">
                  <Box w="100%" h="1px" bg={borderColor} mb={4} />
                  {!showAdvanced ? (
                    <Button
                      onClick={() => setShowAdvanced(true)}
                      variant="ghost"
                      size="sm"
                      borderRadius="lg"
                      w="100%"
                      py={4}
                      color={mutedText}
                      borderWidth="1.5px"
                      borderColor="transparent"
                      _hover={{
                        bg: highlightBg,
                        color: accentColor,
                        borderColor: accentColor,
                      }}
                      transition="all 0.2s"
                    >
                      <HStack gap={2}>
                        <Text fontSize="xs" fontWeight="600">
                          + Custom instructions (optional)
                        </Text>
                      </HStack>
                    </Button>
                  ) : (
                    <ScaleFade in={showAdvanced}>
                      <Box>
                        <HStack justify="space-between" mb={2}>
                          <Text
                            fontSize="2xs"
                            fontWeight="700"
                            color={accentColor}
                            textTransform="uppercase"
                            letterSpacing="wider"
                          >
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
                            px={2}
                            py={1}
                          >
                            <Text fontSize="2xs" fontWeight="600">
                              Remove
                            </Text>
                          </Button>
                        </HStack>
                        <Textarea
                          placeholder="Add specific requirements...&#10;• Focus on practical projects&#10;• Include video tutorials&#10;• Emphasize real-world applications"
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
                            boxShadow: `0 0 0 3px ${useColorModeValue("rgba(20, 184, 166, 0.1)", "rgba(20, 184, 166, 0.2)")}`,
                          }}
                          _hover={{
                            borderColor: useColorModeValue(
                              "gray.300",
                              "gray.600",
                            ),
                          }}
                          transition="all 0.2s"
                          resize="none"
                          lineHeight="1.5"
                        />
                        <Text fontSize="2xs" color={mutedText} mt={1.5}>
                          Customize your learning path with specific goals
                        </Text>
                      </Box>
                    </ScaleFade>
                  )}
                </Box>

                {/* Generate Button - Slightly Smaller */}
                <Box w="100%" pt={2}>
                  <Button
                    colorPalette="teal"
                    size="lg"
                    width="100%"
                    height="56px"
                    borderRadius="xl"
                    onClick={handleGenerate}
                    disabled={!topic || loading}
                    fontSize="sm"
                    fontWeight="700"
                    bgGradient="linear(to-r, teal.500, cyan.500)"
                    boxShadow="0 4px 14px rgba(20, 184, 166, 0.2)"
                    _hover={{
                      bgGradient: "linear(to-r, teal.600, cyan.600)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 8px 24px rgba(20, 184, 166, 0.3)",
                    }}
                    _active={{
                      transform: "translateY(0px)",
                      boxShadow: "0 4px 14px rgba(20, 184, 166, 0.2)",
                    }}
                    _disabled={{
                      opacity: 0.6,
                      cursor: "not-allowed",
                      transform: "none",
                      boxShadow: "none",
                    }}
                    transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                  >
                    {loading ? (
                      <HStack gap={2}>
                        <Spinner size="sm" />
                        <Text>
                          Generating your{" "}
                          {mode === "course" ? "course" : "roadmap"}...
                        </Text>
                      </HStack>
                    ) : (
                      <HStack gap={2}>
                        <Text>
                          Generate{" "}
                          {mode === "course" ? "Course" : "Learning Track"}
                        </Text>
                        <ArrowRight size={18} />
                      </HStack>
                    )}
                  </Button>
                </Box>

                {/* Error */}
                {error && (
                  <ScaleFade in={!!error}>
                    <Alert.Root status="error" borderRadius="xl" w="100%">
                      <Alert.Indicator />
                      <Alert.Title>{error}</Alert.Title>
                    </Alert.Root>
                  </ScaleFade>
                )}
              </VStack>
            </Card.Body>
          </MotionCard>
        </MotionBox>
      </Container >
    </Box >
  );
};

export default HomePage;