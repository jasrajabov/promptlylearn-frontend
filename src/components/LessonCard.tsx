import React, { useEffect, useState } from "react";
import { Box, VStack, Text, Spinner } from "@chakra-ui/react";
import { useUser } from "../contexts/UserContext";
import OpenAIStreamingMarkdown from "./OpenAiMarkdownStream";
import type { Course } from "../types";
import fetchWithTimeout from "../utils/dbUtils";
import { useColorModeValue } from "./ui/color-mode";
import "./markdown-enhanced.css";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const FONT_DEFAULT = 16;

interface LessonCardProps {
  courseState: Course;
  setCourseState: React.Dispatch<React.SetStateAction<Course>>;
  lessonIndex: number;
  moduleIndex: number;
  lessonKey: string;
  /** Is this lesson currently queued or streaming? */
  isGenerating: boolean;
  /** AI Buddy callback */
  onAskAI?: (selectedText: string) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({
  courseState,
  lessonIndex,
  moduleIndex,
  lessonKey,
  isGenerating,
  onAskAI,
}) => {
  const lesson = courseState.modules[moduleIndex].lessons[lessonIndex];
  const { user } = useUser();
  const [lessonContent, setLessonContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fontSize, setFontSize] = useState(FONT_DEFAULT);

  const mutedTextColor = useColorModeValue("gray.600", "gray.400");

  // Fetch existing content from DB once when the lesson changes
  useEffect(() => {
    let cancelled = false;
    const fetchLesson = async () => {
      setIsLoading(true);
      try {
        const dbRes = await fetchWithTimeout(
          `${BACKEND_URL}/course/lessons/${lesson.id}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user?.token}`,
            },
          },
        );
        if (!dbRes.ok) throw new Error(`DB check failed with status: ${dbRes.status}`);
        const dbData = await dbRes.json();
        if (!cancelled) setLessonContent(dbData.content);
      } catch (err) {
        console.error("Error fetching lesson:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchLesson();
    return () => { cancelled = true; };
  }, [lesson.id, user?.token]);

  if (!lesson) {
    return (
      <Box p={8} textAlign="center">
        <Text color={mutedTextColor}>No lesson selected</Text>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box w="100%" minH={{ base: "200px", md: "300px" }} display="flex" alignItems="center" justifyContent="center">
        <VStack gap={3}>
          <Spinner size="xl" />
          <Text fontSize="sm" color={mutedTextColor} fontWeight="medium">Loading lesson content…</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box>
      {/* Lesson content */}
      <Box
        className="lesson-content-container"
        css={{
          "-webkit-font-smoothing": "antialiased",
          "-moz-osx-font-smoothing": "grayscale",
        }}
      >
        <OpenAIStreamingMarkdown
          key={lesson.id}
          content={lessonContent || undefined}
          lessonKey={lessonKey}
          isGenerating={isGenerating}
          onAskAI={onAskAI}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
        />
      </Box>
    </Box>
  );
};

export default LessonCard;