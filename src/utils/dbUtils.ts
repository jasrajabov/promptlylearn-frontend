import type { Module, Status } from "../types";
import type { User } from "../types";

export const fetchWithTimeout = (
  url: string,
  options: RequestInit,
  timeout = 600000
) =>
  new Promise<Response>((resolve, reject) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    console.log("url:", url, "options:", options);
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

export default fetchWithTimeout;

const updateLessonStatusDb = async (
  user: User | undefined,
  lessonId: string,
  status: Status
) => {
  if (!user) {
    console.log("User not logged in");
    return;
  }

  try {
    const response = await fetchWithTimeout(
      `http://localhost:8000/course/lessons/${lessonId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status }),
      },
      60000
    );

    if (!response.ok) {
      throw new Error("Failed to update lesson status");
    }

    const data = await response.json();
    console.log("Lesson status updated:", data);
    return data;
  } catch (error) {
    console.error("Error updating lesson status:", error);
  }
};

const updateModulStatusDb = async (
  user: User | undefined,
  moduleId: string,
  status: Status
) => {
  if (!user) {
    console.log("User not logged in");
    return;
  }

  try {
    const response = await fetchWithTimeout(
      `http://localhost:8000/course/modules/${moduleId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status }),
      },
      60000
    );

    if (!response.ok) {
      throw new Error("Failed to update module status");
    }

    const data = await response.json();
    console.log("Module status updated:", data);
    return data;
  } catch (error) {
    console.error("Error updating module status:", error);
  }
};

export { updateLessonStatusDb, updateModulStatusDb };

export const updateCourseStatusDb = async (
  user: User | undefined,
  courseId: string,
  status: Status
) => {
  if (!user) {
    console.log("User not logged in");
    return;
  }

  try {
    const response = await fetchWithTimeout(
      `http://localhost:8000/course/${courseId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ status }),
      },
      60000
    );

    if (!response.ok) {
      throw new Error("Failed to update course status");
    }

    const data = await response.json();
    console.log("Course status updated:", data);
    return data;
  } catch (error) {
    console.error("Error updating course status:", error);
  }
};
