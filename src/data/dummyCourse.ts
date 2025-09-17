import type { Course } from "../types";

export const dummyCourse: Course = {
  id: "course-1",
  title: "Python for Beginners",
  description:
    "This course will introduce you to the world of Python programming. It is designed for beginners with no prior coding experience and will guide you through the basics of Python.",
  modules: [
    {
      title: "Introduction to Python",
      lessons: [
        {
          title: "Getting Started with Python",
          content:
            "In this lesson, you'll learn how to print a simple 'Hello, World!' message using Python.",
          codeExample: "print('Hello, World!')",
          expectedOutput: "Hello, World!",
          interactiveElements: [
            {
              type: "exercise",
              question: "Write a Python code to print 'Hello, Python!'",
            },
          ],
          id: "",
        },
        {
          title: "Python Variables and Data Types",
          content:
            "This lesson will introduce you to Python variables and different data types like integers, strings, and floats.",
          codeExample: "x = 5\ny = 'John'\nprint(x)\nprint(y)",
          expectedOutput: "5\nJohn",
          interactiveElements: [
            {
              type: "quiz",
              question:
                "What is the output of the following code?\nx = 10\ny = 'Python'\nprint(y)",
            },
          ],
          id: "",
        },
      ],
      id: "",
    },
    {
      title: "Python Operators and Control Flow",
      lessons: [
        {
          title: "Python Operators",
          content:
            "Python provides various operators such as arithmetic, relational, logical, etc. This lesson will introduce these operators.",
          codeExample:
            "x = 10\ny = 5\nprint('Sum:', x + y)\nprint('Difference:', x - y)",
          expectedOutput: "Sum: 15\nDifference: 5",
          interactiveElements: [
            {
              type: "exercise",
              question:
                "Write a Python code to multiply two numbers '5' and '6'.",
            },
          ],
          id: "",
        },
        {
          title: "Python Control Flow",
          content:
            "Control flow in Python involves conditional statements, looping statements, etc. In this lesson, you'll learn about 'if' conditionals.",
          codeExample: "x = 10\nif x > 5:\n    print('x is greater than 5')",
          expectedOutput: "x is greater than 5",
          interactiveElements: [
            {
              type: "quiz",
              question:
                "What is the output of the following code?\nx = 5\nif x < 10:\n    print('x is less than 10')",
            },
          ],
          id: "",
        },
      ],
      id: "",
    },
    {
      title: "Python Functions and Modules",
      lessons: [
        {
          title: "Python Functions",
          content:
            "A function is a block of code that only runs when it is called. This lesson will guide you on how to define and call a function in Python.",
          codeExample:
            "def greet(name):\n    print('Hello,', name)\n\n\ngreet('John')",
          expectedOutput: "Hello, John",
          interactiveElements: [
            {
              type: "exercise",
              question:
                "Write a Python function 'add' that takes two numbers as parameters and prints their sum.",
            },
          ],
          id: "",
        },
        {
          title: "Python Modules",
          content:
            "A module is a file containing Python definitions and statements. Python modules have a filename and end with the extension '.py'.",
          codeExample: "import math\nprint(math.pi)",
          expectedOutput: "3.141592653589793",
          interactiveElements: [
            {
              type: "quiz",
              question:
                "What is the output of the following code?\nimport math\nprint(math.sqrt(16))",
            },
          ],
          id: "",
        },
      ],
      id: "",
    },
  ],
};
