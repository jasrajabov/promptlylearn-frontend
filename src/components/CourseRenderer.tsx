import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Tag,
  Text,
} from "@chakra-ui/react";
import type { Course, Module } from "../types";
import LessonCard from "./LessonCard";
import { HiChevronRight } from "react-icons/hi";
import ModuleQuiz from "./Quiz";

interface CourseRendererProps {
  course: Course;
  module: Module;
  currentModuleIndex: number;
  currentLessonIndex: number;
  showQuiz: boolean;
  onLessonChange: (lessonIndex: number, moduleIndex: number) => void;
  setShowQuiz: (show: boolean) => void;
  onModuleComplete?: (nextModuleIndex: number) => void;
}

const CourseRenderer: React.FC<CourseRendererProps> = ({
  course,
  module,
  currentModuleIndex,
  currentLessonIndex,
  onLessonChange,
  showQuiz,
  setShowQuiz,
  onModuleComplete,
}) => {
  const [moduleComplete, setModuleComplete] = useState(module.status === "complete");
  const contentRef = useRef<HTMLDivElement | null>(null);

  const lesson = module.lessons[currentLessonIndex];
  const nextLesson =
    currentLessonIndex < module.lessons.length - 1
      ? module.lessons[currentLessonIndex + 1]
      : null;

  // Scroll content to top when lesson changes
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentLessonIndex, module.id]);

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      onLessonChange(currentLessonIndex - 1, currentModuleIndex);
    }
  };

  const handleCompleteLesson = () => {
    if (currentLessonIndex < module.lessons.length - 1) {
      lesson.status = "complete";
      onLessonChange(currentLessonIndex + 1, currentModuleIndex);
    } else {
      module.status = "complete";
      setModuleComplete(true);
      setShowQuiz(true);
    }
  };

  const handleQuizSubmit = () => {
    module.status = "complete";
    setModuleComplete(true);
    setShowQuiz(false);

    if (onModuleComplete && currentModuleIndex < course.modules.length - 1) {
      onModuleComplete(currentModuleIndex + 1);
    }
  };

  return (
    <Box
      ref={contentRef}
      w="100%"
      maxH="80vh"
      overflowY="auto"
      p={{ base: 4, md: 6 }}
      borderLeft="1px solid"
      borderColor="gray.200"
    >
      <VStack align="start" gap={6}>
        {/* Module Info */}
        <VStack align="start" gap={2}>
          <Heading size="md">{course.title}</Heading>
          <Heading size="lg">
            Module {currentModuleIndex + 1}: {module.title}
          </Heading>
        </VStack>

        {/* Lesson Progress */}
        {!showQuiz && (
          <Text fontSize="sm" color="gray.500">
            Lesson {currentLessonIndex + 1} of {module.lessons.length}
          </Text>
        )}

        <HStack fontSize="sm" align="center">
          <Text>Module Status:</Text>
          <Tag.Root
            fontWeight="bold"
            color="white"
            bg={
              module.status === "complete"
                ? "green.500"
                : module.status === "in-progress"
                  ? "blue.500"
                  : "gray.500"
            }
          >
            {module.status}
          </Tag.Root>
        </HStack>

        {/* Current Lesson */}
        {!showQuiz && <LessonCard lesson={lesson} />}

        {/* Upcoming Lesson Preview */}
        {!showQuiz && nextLesson && (
          <Box
            w="full"
            p={4}
            borderRadius="lg"
            bg="gray.50"
            _dark={{ bg: "gray.700" }}
            boxShadow="sm"
            cursor="pointer"
            _hover={{ bg: "blue.50", _dark: { bg: "blue.900" } }}
            onClick={() => onLessonChange(currentLessonIndex + 1, currentModuleIndex)}
            transition="background 0.2s ease"
          >
            <Text fontSize="sm" color="gray.500" mb={1}>
              Upcoming Lesson
            </Text>
            <HStack justify="space-between" align="center">
              <Heading size="sm" color="blue.600" _dark={{ color: "blue.300" }}>
                {nextLesson.title}
              </Heading>
              <HiChevronRight color="blue.400" />
            </HStack>
          </Box>
        )}

        {/* Quiz */}
        {showQuiz && module.quiz && (
          <ModuleQuiz
            quiz={module.quiz}
            setShowQuiz={setShowQuiz}
            onQuizSubmit={handleQuizSubmit}
          />
        )}

        {/* Navigation Buttons */}
        {!showQuiz && (
          <HStack w="full" justify="space-between" flexWrap="wrap">
            <Button onClick={handlePrevLesson} disabled={currentLessonIndex === 0}>
              Previous
            </Button>
            <Button onClick={handleCompleteLesson}>
              {currentLessonIndex === module.lessons.length - 1 && !moduleComplete
                ? "Complete Module"
                : "Complete Lesson"}
            </Button>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default CourseRenderer;
