type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
type MembershipStatus = "ACTIVE" | "INACTIVE" | "CANCELED";

export type User = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  is_email_verified: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  suspended_by: string | null;
  membership_plan: string;
  membership_status: MembershipStatus;
  membership_active_until: string | null;
  stripe_customer_id: string | null;
  credits: number;
  credits_reset_at: string | null;
  total_credits_used: number;
  last_login_at: string | null;
  login_count: number;
  admin_notes: string | null;
  total_courses: number;
  total_roadmaps: number;
  completed_courses: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  token: string;
  expires_at: number;
  avatar_url: string | null;
};

export interface Course {
  id: string;
  title: string;
  description: string;
  modules: Module[];
  status: Status;
  task_id: string;
  created_at: string;
  updated_at: string;
}

export type Status =
  | "NOT_GENERATED"
  | "LOADING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "GENERATING";

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
      explanation: string;
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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}
