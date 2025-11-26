import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Tag,
  Text,
  Spinner,
} from "@chakra-ui/react";
import type { Course, Module, Status } from "../types";
import LessonCard from "./LessonCard";
import { HiChevronRight } from "react-icons/hi";
import ModuleQuiz from "./Quiz";
import fetchWithTimeout, { updateCourseStatusDb, updateLessonStatusDb, updateModulStatusDb } from "../utils/dbUtils";
import type { Quiz } from "../types";
import { useUser } from "../contexts/UserContext";
import { MdOutlineDoneAll, MdOutlineRemoveDone } from "react-icons/md";
import { GiChoice } from "react-icons/gi";




interface CourseRendererProps {
  courseState: Course;
  currentModuleIndex: number;
  currentLessonIndex: number;
  showQuiz: boolean;
  onLessonChange: (lessonIndex: number, moduleIndex: number) => void;
  setShowQuiz: (show: boolean) => void;
  onModuleComplete?: (nextModuleIndex: number) => void;
  setCourseState: React.Dispatch<React.SetStateAction<Course>>;
}

const CourseRenderer: React.FC<CourseRendererProps> = ({
  courseState,
  currentModuleIndex,
  currentLessonIndex,
  onLessonChange,
  showQuiz,
  setShowQuiz,
  onModuleComplete,
  setCourseState,
}) => {

  const { user } = useUser();
  const module = courseState.modules[currentModuleIndex];
  const lesson = module.lessons[currentLessonIndex];
  const nextLesson = module.lessons[currentLessonIndex + 1];
  const contentRef = useRef<HTMLDivElement>(null);

  const moduleComplete = module.status === "COMPLETED";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const nextModule =
    currentModuleIndex < courseState.modules.length - 1
      ? courseState.modules[currentModuleIndex + 1]
      : null;

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentLessonIndex, module.id]);

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      onLessonChange(currentLessonIndex - 1, currentModuleIndex);
    }
  };


  const handleUpdateStatus = () => {
    const currentLessonStatus = lesson.status as Status;

    let courseIdForDb: string | null = null;
    let moduleIdForDb: string | null = null;
    let moduleNewStatus: Status | null = null;
    let courseNewStatus: Status | null = null;
    let newLessonStatus: Status = currentLessonStatus === "COMPLETED" ? "IN_PROGRESS" : "COMPLETED";

    setCourseState((prev) => {
      courseIdForDb = prev.id;
      const updatedModules = [...prev.modules];
      const updatedModule = { ...updatedModules[currentModuleIndex] };

      // toggle current lesson status
      updatedModule.lessons = updatedModule.lessons.map((l, i) =>
        i === currentLessonIndex ? { ...l, status: newLessonStatus } : l
      );

      // compute module status from the updated lessons
      const allLessonsComplete = updatedModule.lessons.every((l) => l.status === "COMPLETED");
      const anyLessonStarted = updatedModule.lessons.some((l) => l.status === "IN_PROGRESS" || l.status === "COMPLETED");
      updatedModule.status = allLessonsComplete ? ("COMPLETED" as Status) : (anyLessonStarted ? ("IN_PROGRESS" as Status) : ("NOT_GENERATED" as Status));

      moduleIdForDb = updatedModule.id;
      moduleNewStatus = updatedModule.status;

      updatedModules[currentModuleIndex] = updatedModule;

      // compute course completeness from the UPDATED modules array
      const courseComplete = updatedModules.every((m) => m.status === "COMPLETED");
      const anyModuleInProgress = updatedModules.some((m) => m.status === "IN_PROGRESS");
      courseNewStatus = courseComplete ? ("COMPLETED" as Status) : (anyModuleInProgress ? ("IN_PROGRESS" as Status) : ("NOT_GENERATED" as Status));

      return {
        ...prev,
        modules: updatedModules,
        status: courseNewStatus,
      };
    });

    // persist changes to DB (do side-effects after updater)
    updateLessonStatusDb(user, lesson.id, newLessonStatus);
    if (moduleIdForDb && moduleNewStatus) {
      updateModulStatusDb(user, moduleIdForDb, moduleNewStatus);
    }
    if (courseIdForDb && courseNewStatus) {
      updateCourseStatusDb(user, courseIdForDb, courseNewStatus);
    }
  };




  const handleGenerateQuiz = () => {
    console.log("Generating quiz for lesson:", lesson);
    setLoadingQuiz(true);
    fetchWithTimeout("http://localhost:8000/generate-quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lesson_name: lesson.title,
        content: [],
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          // Update the course state with the new quiz
          setQuiz(data);
          setShowQuiz(true);

        }
        setLoadingQuiz(false);
      });
  };

  return (
    <Box ref={contentRef} wordWrap="break-word" w="100%" overflowY="auto" p={{ base: 4, md: 6 }}>
      <VStack align="start" gap={6}>
        {/* Header */}
        <VStack align="start" gap={2}>
          <Heading size="lg">
            Module {currentModuleIndex + 1}: {module.title}
          </Heading>
        </VStack>

        {!showQuiz && (
          <HStack w="full" justify="flex-start" align="center">
            <Text fontSize="sm" color="gray.500">
              Lesson {currentLessonIndex + 1} of {module.lessons.length}
            </Text>
            {
              <Button size="sm" variant="ghost" onClick={handleUpdateStatus}>
                {lesson.status === "COMPLETED" ? <MdOutlineRemoveDone /> : <MdOutlineDoneAll />}
                {lesson.status === "COMPLETED" ? "Incomplete" : "Complete"}
              </Button>
            }
            {loadingQuiz ? (
              <>
                <Spinner />
                <Text>Generating Quiz...</Text>
              </>
            ) : (

              <Button size="sm" variant="ghost" onClick={handleGenerateQuiz}>Generate Quiz
                <GiChoice />
              </Button>
            )}
          </HStack>
        )}


        {!showQuiz && <LessonCard
          courseState={courseState}
          setCourseState={setCourseState}
          lessonIndex={currentLessonIndex}
          moduleIndex={currentModuleIndex}
        />}

        {/* Upcoming Module Preview */}
        {!showQuiz && moduleComplete && nextModule && (
          <Box
            w="full"
            p={4}
            borderRadius="lg"
            bg="gray.50"
            _dark={{ bg: "gray.700" }}
            boxShadow="sm"
            cursor="pointer"
            _hover={{ bg: "blue.50", _dark: { bg: "blue.900" } }}
            onClick={() => onLessonChange(0, currentModuleIndex + 1)} // jump to first lesson of next module
            transition="background 0.2s ease"
          >
            <Text fontSize="sm" color="gray.500" mb={1}>
              Upcoming Module
            </Text>
            <HStack justify="space-between" align="center">
              <Heading size="sm" color="blue.600" _dark={{ color: "blue.300" }}>
                {nextModule.title}
              </Heading>
              <HiChevronRight color="blue.400" />
            </HStack>
          </Box>
        )}


        {showQuiz && quiz && (
          <ModuleQuiz quiz={quiz} setShowQuiz={setShowQuiz} />
        )}

        {!showQuiz && (
          <HStack w="full" justify="space-between" flexWrap="wrap">
            <Button variant="subtle" onClick={handlePrevLesson} disabled={currentLessonIndex === 0}>
              Previous
            </Button>

            {!showQuiz && lesson.status === "COMPLETED" && nextLesson && (
              <Box
                role="button"
                tabIndex={0}
                onClick={() => onLessonChange(currentLessonIndex + 1, currentModuleIndex)}
                p={4}
                borderRadius="lg"
                bg="gray.50"
                _dark={{ bg: "gray.700" }}
                _hover={{ bg: "blue.50", _dark: { bg: "blue.900" } }}
              >
                <Text fontSize="sm" color="gray.500" mb={1}>
                  Next Lesson
                </Text>
                <HStack justify="space-between">
                  <Heading size="sm">{nextLesson.title}</Heading>
                  <HiChevronRight />
                </HStack>
              </Box>
            )}
          </HStack>
        )}
      </VStack>
    </Box>
  );
};
export default CourseRenderer;