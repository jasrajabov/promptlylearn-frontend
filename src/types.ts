export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  fullyGenerated: boolean;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  quiz?: [];
  status:
    | "not-generated"
    | "not-started"
    | "loading"
    | "generated"
    | "in-progress"
    | "complete";
  estimatedTime?: number; // in minutes
}

export type InteractiveElement = {
  type: "quiz" | "exercise";
  question: string;
};

export type ClarificationBlock = {
  question: string;
  answer: string;
};

export type ContentBlock = {
  content: string;
  code: string | null;
  expectedOutput: string | null;
  codeLanguage: string | null;
  outputLanguage: string | null;
  clarifications?: ClarificationBlock[];
};

export type Lesson = {
  id: string;
  title: string;
  status: "not-started" | "in-progress" | "complete";
  content?: ContentBlock[];
  isProgrammingLesson: boolean;
  quiz?: [];
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
  lessonName: string;
  content: string;
}
