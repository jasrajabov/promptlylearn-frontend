import React, { useEffect, useMemo, useState } from "react";
import { Box, Spinner, VStack, Text } from "@chakra-ui/react";
import { useUser } from "../contexts/UserContext";
import OpenAIStreamingMarkdown from "./OpenAiMarkdownStream";
import type { Course } from "../types";
import fetchWithTimeout from "../utils/dbUtils";
import "./markdown-enhanced.css";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface LessonCardProps {
  courseState: Course;
  setCourseState: React.Dispatch<React.SetStateAction<Course>>;
  lessonIndex: number;
  moduleIndex: number;
  isGeneratingLesson: boolean;
  setIsGeneratingLesson: (isGenerating: boolean) => void;
  lessonGenerationTriggered: boolean;
  setLessonGenerationTriggered: (triggered: boolean) => void;
  onAskAI?: (selectedText: string) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({
  courseState,
  lessonIndex,
  moduleIndex,
  isGeneratingLesson,
  setIsGeneratingLesson,
  lessonGenerationTriggered,
  setLessonGenerationTriggered,
  onAskAI,
}) => {
  const lesson = courseState.modules[moduleIndex].lessons[lessonIndex];
  const { user } = useUser();
  const [lessonContent, setLessonContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

      if (!dbRes.ok) {
        throw new Error(`DB check failed with status: ${dbRes.status}`);
      }

      const dbData = await dbRes.json();
      setLessonContent(dbData.content);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching lesson:", err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLesson();
  }, [lesson.id]);

  const requestBody = useMemo(
    () => ({
      course_id: courseState.id,
      module_id: courseState.modules[moduleIndex].id,
      lesson_id: lesson.id,
      token: user?.token,
    }),
    [
      courseState.id,
      courseState.modules[moduleIndex].id,
      lesson.id,
      user?.token,
    ],
  );

  if (!lesson) return <Box>No lesson selected</Box>;

  if (isLoading)
    return (
      <Box
        w="100%"
        minH="240px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Spinner size="xl" />
      </Box>
    );

  return (
    <Box>
      <OpenAIStreamingMarkdown
        key={lesson.id}
        apiUrl={`${BACKEND_URL}/course/generate-lesson-stream`}
        body={requestBody}
        content={lessonContent || undefined}
        isGenerating={isGeneratingLesson}
        setIsGenerating={setIsGeneratingLesson}
        shouldStartGeneration={lessonGenerationTriggered}
        onGenerationComplete={() => setLessonGenerationTriggered(false)}
        onAskAI={onAskAI}
      />
    </Box>
  );
};

export default LessonCard;