import React, { use, useState } from "react";
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
} from "@chakra-ui/react";
import { Fade, SlideFade } from "@chakra-ui/transition";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { fetchWithTimeout } from "../utils/dbUtils";


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
  const [level, setLevel] = useState("beginner");
  const [mode, setMode] = useState<"course" | "roadmap">(_mode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        mode === "course" ? { topic, level } : { roadmap_name: topic };

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
    <Box maxW="700px" mx="auto" mt={24} px={4}>
      {/* HEADER */}
      <Box textAlign="center" mb={10}>
        <Heading fontSize="4xl" fontWeight="bold" letterSpacing="-1px">
          Learn Anything. Faster.
        </Heading>
        <Text fontSize="md" mt={2} color="gray.600">
          Generate a personalized course or roadmap in seconds.
        </Text>
      </Box>

      <VStack gap={8} w="100%">

        {/* INPUT — GOOGLE STYLE */}
        <Input
          placeholder="What do you want to learn? (e.g. TypeScript, Blockchain, UX Design)"
          value={topic}
          size="lg"
          onChange={(e) => setTopic(e.target.value)}
          height="56px"
          borderRadius="full"
          borderColor="teal.300"
          px={6}
          fontSize="lg"
        />

        {/* TABS */}
        <Tabs.Root
          value={mode}
          onValueChange={(details) =>
            setMode(details.value as "course" | "roadmap")
          }
          size="md"
        >
          <Tabs.List justifyContent="center" gap={6} border="0">
            <Tabs.Trigger
              value="course"
              px={4}
              py={2}
              _selected={{
                borderBottom: "2px solid teal",
                color: "teal.600",
                fontWeight: "semibold",
              }}
            >
              Course
            </Tabs.Trigger>
            <Tabs.Trigger
              value="roadmap"
              px={4}
              py={2}
              _selected={{
                borderBottom: "2px solid teal",
                color: "teal.600",
                fontWeight: "semibold",
              }}
            >
              Roadmap
            </Tabs.Trigger>
          </Tabs.List>

          {/* COURSE SETTINGS */}
          <Tabs.Content value="course">
            <SlideFade in={mode === "course"} offsetY="10px">
              <Text fontWeight="medium" mb={3} color="gray.700" textAlign="center">
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
                      <RadioGroup.ItemText>{item.label}</RadioGroup.ItemText>
                    </RadioGroup.Item>
                  ))}
                </HStack>
              </RadioGroup.Root>
            </SlideFade>
          </Tabs.Content>

          {/* ROADMAP TEXT */}
          <Tabs.Content value="roadmap">
            <Fade in={mode === "roadmap"}>
              <Text mt={2} textAlign="center" color="gray.600">
                A guided learning roadmap will be generated based on your topic.
              </Text>
            </Fade>
          </Tabs.Content>
        </Tabs.Root>

        {/* GENERATE BUTTON */}
        <Button
          colorScheme="teal"
          size="sm"
          variant="ghost"
          borderRadius="10px"
          px={10}
          // height="52px"
          border={"1px solid"}
          onClick={handleGenerate}
          disabled={!topic || loading}
        >
          {loading ? (
            <>
              <Spinner size="sm" mr={2} /> Generating...
            </>
          ) : (
            `Generate ${mode === "course" ? "Course" : "Roadmap"}`
          )}
        </Button>

        {/* ERROR */}
        {error && (
          <Alert.Root status="error" borderRadius="md" maxW="600px">
            {error}
          </Alert.Root>
        )}
      </VStack>
    </Box>
  );
};

export default HomePage;
