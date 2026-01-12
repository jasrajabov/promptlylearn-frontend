import React, { useState } from "react";
import {
  Box,
  Button,
  VStack,
  Input,
  Heading,
  HStack,
  Tabs,
  RadioGroup,
  Text,
  Spinner,
  Alert,
  Textarea,
  Card,
  Badge,
} from "@chakra-ui/react";
import { Fade, SlideFade } from "@chakra-ui/transition";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { fetchWithTimeout } from "../utils/dbUtils";
import {
  Sparkles,
  Zap,
  Rocket,
  BookOpen,
  Code,
  Computer
} from "lucide-react";
import { useColorModeValue } from "../components/ui/color-mode";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const levelItems = [
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
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

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const accentColor = useColorModeValue("teal.600", "teal.400");

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
      console.log("Request body:", body);
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
        600000
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
    <Box maxW="800px" mx="auto" mt={16} px={4} pb={12}>
      {/* HEADER */}
      <Box textAlign="center" mb={10}>
        <HStack justify="center" mb={3}>
          <Sparkles size={36} color={accentColor} />
          <Heading fontSize={{ base: "3xl", md: "5xl" }} fontWeight="bold" letterSpacing="-1px">
            Learn Anything. Faster.
          </Heading>
        </HStack>
        <Text fontSize="lg" color={mutedText}>
          Generate a personalized course or roadmap in seconds with AI
        </Text>
      </Box>

      {/* MAIN CONTENT */}
      <VStack gap={6} w="100%">
        {/* MAIN INPUT */}
        <Input
          placeholder="What do you want to learn? (e.g. TypeScript, Blockchain, UX Design)"
          value={topic}
          size="lg"
          onChange={(e) => setTopic(e.target.value)}
          height="60px"
          borderRadius="xl"
          borderWidth="2px"
          borderColor={borderColor}
          _focus={{
            borderColor: accentColor,
            shadow: "0 0 0 1px var(--chakra-colors-teal-500)",
          }}
          px={6}
          fontSize="md"
          w="100%"
        />

        {/* TABS */}
        <Card.Root w="100%" background="transparent" borderRadius="xl" borderWidth="2px" borderColor={accentColor}>
          <Card.Body p={6}>
            <Tabs.Root
              value={mode}
              onValueChange={(details) =>
                setMode(details.value as "course" | "roadmap")
              }
              size="md"

            >
              <Tabs.List justifyContent="center" gap={3} border="0" mb={5} flexWrap="wrap">
                <Tabs.Trigger
                  value="course"
                  px={6}
                  py={3}
                  borderRadius="lg"
                  transition="all 0.2s"
                  color={useColorModeValue("black", "white")}
                  _selected={{
                    // bg: useColorModeValue("teal.50", "teal.900/30"),
                    // color: accentColor,
                    fontWeight: "bold",
                  }}
                >
                  <HStack gap={2}>
                    <Box color={useColorModeValue("yellow.700", "yellow.400")}>
                      <BookOpen size={18} />
                    </Box>
                    <Text>Course</Text>
                  </HStack>
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="roadmap"
                  px={6}
                  py={3}
                  borderRadius="lg"
                  transition="all 0.2s"
                  color={useColorModeValue("black", "white")}

                  _selected={{
                    // bg: useColorModeValue("teal.50", "teal.900/30"),
                    // color: accentColor,
                    fontWeight: "bold",
                  }}
                >
                  <HStack gap={2}>
                    <Box color={useColorModeValue("green.700", "green.400")}>
                      <Rocket size={18} />
                    </Box>

                    <Text>Learning Track</Text>
                  </HStack>
                </Tabs.Trigger>

                {/* Coming Soon Tabs */}
                <Button
                  px={6}
                  py={3}
                  borderRadius="lg"
                  variant="ghost"
                  disabled
                  opacity={0.6}
                  cursor="not-allowed"
                  size="md"
                  position="relative"
                >
                  <HStack gap={2}>

                    <Box color={useColorModeValue("purple.700", "purple.400")}>
                      <Code size={18} />
                    </Box>
                    <Text >Code Playground</Text>
                  </HStack>
                  <Badge
                    position="absolute"
                    top="-8px"
                    right="-8px"
                    colorPalette="purple"
                    variant="solid"
                    size="xs"
                    borderRadius="full"
                    fontSize="2xs"
                  >
                    Soon
                  </Badge>
                </Button>
                {/* Coming Soon Tabs */}
                <Button
                  px={6}
                  py={3}
                  borderRadius="lg"
                  variant="ghost"
                  disabled
                  opacity={0.6}
                  cursor="not-allowed"
                  size="md"
                  position="relative"
                >
                  <HStack gap={2}>
                    <Box color={useColorModeValue("orange.700", "orange.500")}>
                      <Computer size={18} />
                    </Box>
                    <Text>Interview Prep</Text>
                  </HStack>
                  <Badge
                    position="absolute"
                    top="-8px"
                    right="-8px"
                    colorPalette="purple"
                    variant="solid"
                    size="xs"
                    borderRadius="full"
                    fontSize="2xs"
                  >
                    Soon
                  </Badge>
                </Button>
              </Tabs.List>

              {/* COURSE SETTINGS */}
              <Tabs.Content value="course">
                <SlideFade in={mode === "course"} offsetY="10px">
                  <VStack gap={4}>
                    <Box w="100%">
                      <Text fontWeight="medium" mb={3} color={mutedText} fontSize="sm" textAlign="center">
                        Select difficulty level
                      </Text>
                      <RadioGroup.Root
                        defaultValue={level}
                        onValueChange={(details) => setLevel(details.value as any)}
                      >
                        <HStack gap={6} justify="center">
                          {levelItems.map((item) => (
                            <RadioGroup.Item key={item.value} value={item.value}>
                              <RadioGroup.ItemHiddenInput />
                              <RadioGroup.ItemIndicator>
                                <Box w={3} h={3} bg="teal.500" borderRadius="full" />
                              </RadioGroup.ItemIndicator>
                              <RadioGroup.ItemText fontSize="sm">{item.label}</RadioGroup.ItemText>
                            </RadioGroup.Item>
                          ))}
                        </HStack>
                      </RadioGroup.Root>
                    </Box>
                  </VStack>
                </SlideFade>
              </Tabs.Content>

              {/* ROADMAP TEXT */}
              <Tabs.Content value="roadmap">
                <Fade in={mode === "roadmap"}>
                  <Box
                    p={4}
                    bg={useColorModeValue("blue.50", "blue.900/20")}
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor={useColorModeValue("teal.200", "teal.700")}
                  >
                    <Text textAlign="center" color={mutedText} fontSize="sm">
                      A guided learning roadmap will be generated based on your topic
                    </Text>
                  </Box>
                </Fade>
              </Tabs.Content>
            </Tabs.Root>
          </Card.Body>
        </Card.Root>

        {/* CUSTOM PROMPT INPUT - TOGGLE */}
        <Box w="100%" display="flex" justifyContent="center">
          {!showAdvanced ? (
            <Button
              onClick={() => setShowAdvanced(true)}
              variant="outline"
              size="sm"
              borderRadius="lg"
              px={4}
              py={2}
              borderWidth="1px"
              borderColor={borderColor}
              transition="all 0.2s"
              _hover={{
                bg: useColorModeValue("gray.50", "gray.750"),
                borderColor: accentColor,
              }}
            >
              <HStack gap={1.5}>
                <Sparkles size={14} />
                <Text fontSize="xs" fontWeight="medium">
                  Additional Instructions (Optional)
                </Text>
              </HStack>
            </Button>
          ) : (
            <Box w="100%">
              <Textarea
                placeholder="Add specific requirements or preferences...
e.g., 'Focus on practical projects', 'Include video resources', 'Emphasize real-world applications'"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                size="md"
                rows={3}
                borderRadius="lg"
                borderWidth="2px"
                borderColor={borderColor}
                _focus={{
                  borderColor: accentColor,
                  shadow: "0 0 0 1px var(--chakra-colors-teal-500)",
                }}
              />
              <HStack mt={2} justify="space-between" align="center">
                <Text fontSize="xs" color={mutedText}>
                  Help the AI understand your learning goals better
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => setShowAdvanced(false)}
                  colorPalette="red"
                >
                  Remove
                </Button>
              </HStack>
            </Box>
          )}
        </Box>

        {/* GENERATE BUTTON */}
        <Button
          colorPalette="teal"
          size="lg"
          width="100%"
          maxW="400px"
          height="56px"
          borderRadius="xl"
          onClick={handleGenerate}
          disabled={!topic || loading}
          fontSize="md"
          fontWeight="semibold"
        >
          {loading ? (
            <>
              <Spinner size="sm" mr={2} /> Generating...
            </>
          ) : (
            <>
              <Zap size={20} />
              Generate {mode === "course" ? "Course" : "Roadmap"}
            </>
          )}
        </Button>

        {/* ERROR */}
        {error && (
          <Alert.Root status="error" borderRadius="lg" w="100%">
            <Alert.Indicator />
            <Alert.Title>{error}</Alert.Title>
          </Alert.Root>
        )}
      </VStack>
    </Box>
  );
};

export default HomePage;