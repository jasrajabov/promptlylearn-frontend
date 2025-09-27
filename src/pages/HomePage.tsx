// HomePage.tsx
import { useState } from "react";
import {
  Box,
  Button,
  VStack,
  Input,
  Heading,
  HStack,
  Tabs,
  RadioGroup
} from "@chakra-ui/react";
import { Spinner } from '@chakra-ui/react';
import { SlideFade } from "@chakra-ui/transition";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";

// --- helper function ---
const fetchWithTimeout = (url: string, options: RequestInit, timeout = 600000) =>
  new Promise<Response>((resolve, reject) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    fetch(url, { ...options, signal: controller.signal })
      .then((res) => {
        clearTimeout(id);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(id);
        reject(err);
      });
  });

// Level options
const levelItems = [
  { label: "Beginner 🚀", value: "beginner" },
  { label: "Intermediate 💡", value: "intermediate" },
  { label: "Advanced 🧠", value: "advanced" },
];

const HomePage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("beginner");
  const [mode, setMode] = useState<"course" | "roadmap">("course");
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
          ? "http://localhost:8000/generate-course-outline"
          : "http://localhost:8000/generate-roadmap";

      const response = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${user.token}`
          },
          body: JSON.stringify({ topic, level }),
        },
        600000
      );

      if (!response.ok) throw new Error("Failed to generate");

      const data = await response.json();

      if (mode === "course") {
        navigate(`/course/${data.id}`, { state: { course: data } });
      } else {
        navigate(`/roadmap/${data.id}`, { state: { roadmap: data } });
      }
    } catch (err: any) {
      console.error("Error generating:", err);
      setError("Generation timed out or failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="600px" mx="auto" mt={20} textAlign="center">
      <Heading
        mb={6}
        fontWeight="semibold"
        letterSpacing="-0.5px"
        fontSize="3xl"
        color="teal.600"
      >
        What do you want to learn today?
      </Heading>

      <VStack gap={4}>
        {/* Search box */}
        <Input
          placeholder="e.g. Learn TypeScript basics"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          size="lg"
          bg="gray.50"
          _dark={{ bg: "gray.700" }}
          borderRadius="md"
          _selection={{ bg: "teal.200", color: "black" }}
        />

        {/* Mode switch (Course / Roadmap) using new Tabs API */}
        <Tabs.Root
          value={mode}
          onValueChange={(details) => setMode(details.value as "course" | "roadmap")}
        >
          <Tabs.List justifyContent="center">
            <Tabs.Trigger value="course">📘 Course</Tabs.Trigger>
            <Tabs.Trigger value="roadmap">🗺️ Roadmap</Tabs.Trigger>
            <Tabs.Indicator />
          </Tabs.List>

          {/* Course content */}
          <Tabs.Content value="course">
            <SlideFade in={mode === "course"} offsetY="10px">
              <RadioGroup.Root
                defaultValue={level}
                onValueChange={(val) => setLevel(val as unknown as "beginner" | "intermediate" | "advanced")}
              >
                <HStack gap={6} justify="center" mt={4}>
                  {levelItems.map((item) => (
                    <RadioGroup.Item key={item.value} value={item.value}>
                      <RadioGroup.ItemHiddenInput />
                      <RadioGroup.ItemIndicator>
                        <Box
                          w={4}
                          h={4}
                          bg="teal.500"
                          borderRadius="full"
                        />
                      </RadioGroup.ItemIndicator>
                      <RadioGroup.ItemText>{item.label}</RadioGroup.ItemText>
                    </RadioGroup.Item>
                  ))}
                </HStack>
              </RadioGroup.Root>
            </SlideFade>
          </Tabs.Content>

          {/* Roadmap content */}
          <Tabs.Content value="roadmap">
            <Box mt={4} color="gray.600">
              Roadmap will be generated based on your topic.
            </Box>
          </Tabs.Content>
        </Tabs.Root>

        {/* Generate button */}
        <Button
          colorScheme="teal"
          size="lg"
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

        {error && <Box color="red.500">{error}</Box>}
      </VStack>
    </Box>
  );
};

export default HomePage;
