export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  fullyGenerated: boolean;
  status: Status;
}

export type Status = "NOT_GENERATED" | "LOADING" | "IN_PROGRESS" | "COMPLETED";

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  quiz?: [];
  status: Status;
  estimatedTime?: number; // in minutes
}

export type ClarificationAnswer = {
  text: string;
  code: string;
  code_language: string | null;
  output: string;
};

export type ClarificationBlock = {
  question: string;
  answers: ClarificationAnswer[];
};

export type ContentBlock = {
  id: string;
  title: string | null;
  content: string;
  code: string | null;
  expected_output: string | null;
  code_language: string | null;
  output_language: string | null;
  clarifications?: ClarificationBlock[];
  loading?: boolean;
};

export interface Quiz {
  questions: [
    {
      question: string;
      options: string[];
      correct_option_index: number;
    }
  ];
}

export type Lesson = {
  id: string;
  title: string;
  status: Status;
  content: string;
  is_programming_lesson: boolean;
};

export interface Progress {
  completedLessons: Record<string, boolean>;
  completedModules: Record<string, boolean>;
}

interface CourseRendererProps {
  course: Course;
  currentModuleIndex: number;
  currentLessonIndex: number;
  onLessonChange: (moduleIndex: number, lessonIndex: number) => void;
  onLessonComplete?: (moduleId: string, lessonId: string) => void;
}
export type { CourseRendererProps };

export interface ClarifyLessonRequest {
  question: string;
  content_block_id: string;
  content: string;
}

export interface GenerateQuizRequest {
  lessonName: string;
  content: string[];
}
