import React, { useEffect, useMemo, useState } from "react";
import { Box, Spinner } from "@chakra-ui/react";
import { useUser } from "../contexts/UserContext";
import OpenAIStreamingMarkdown from "./OpenAiMarkdownStream";
import type { Course } from "../types";
import fetchWithTimeout from "../utils/dbUtils";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface LessonCardProps {
    courseState: Course;
    setCourseState: React.Dispatch<React.SetStateAction<Course>>;
    lessonIndex: number;
    moduleIndex: number;
}

const LessonCard: React.FC<LessonCardProps> = ({ courseState, lessonIndex, moduleIndex }) => {
    const lesson = courseState.modules[moduleIndex].lessons[lessonIndex];
    const { user } = useUser();
    const [lessonContent, setLessonContent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);


    console.log("lessonIndex", lessonIndex, "moduleIndex", moduleIndex);
    console.log("lessonid:", lesson.id);


    const fetchLesson = async () => {
        setIsLoading(true);
        try {
            console.log("Fetching lesson content for lesson ID:", lesson.id);
            const dbRes = await fetchWithTimeout(`${BACKEND_URL}/course/lessons/${lesson.id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${user?.token}`,
                },
            });

            if (!dbRes.ok) {
                throw new Error(`DB check failed with status: ${dbRes.status}`);
            }

            const dbData = await dbRes.json();
            setIsLoading(false);
            setLessonContent(dbData.content);



        } catch (err) {
            console.error("Error fetching lesson or initiating stream:", err);
        }
    }

    useEffect(() => {

        fetchLesson();
    }, [lesson.id]);


    const requestBody = useMemo(() => ({
        course_id: courseState.id,
        module_id: courseState.modules[moduleIndex].id,
        lesson_id: lesson.id,
        token: user?.token,
    }), [
        courseState.id,
        courseState.modules[moduleIndex].id,
        lesson.id,
        user?.token
    ]);

    if (!lesson) return <Box>No lesson selected</Box>;
    if (isLoading) return (
        <Box w="100%" minH="240px" display="flex" alignItems="center" justifyContent="center">
            <Spinner size="xl" />
        </Box>
    );

    return (
        <Box>
            <OpenAIStreamingMarkdown
                key={lesson.id}
                apiUrl={`${BACKEND_URL}/generate-lesson-markdown-stream`}
                body={requestBody}
                content={lessonContent || undefined}
            />

        </Box>
    );
};

export default LessonCard;
