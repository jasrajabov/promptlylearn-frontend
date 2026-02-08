import React, { useState } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Progress,
  Badge,
  Separator,
} from "@chakra-ui/react";
import {
  FaLightbulb,
  FaArrowLeft,
  FaArrowRight,
  FaTrophy,
} from "react-icons/fa";
import { CheckCircle, XCircle, Award, Clock } from "lucide-react";
import type { Quiz } from "../types";
import { useColorModeValue } from "./ui/color-mode";
import { motion, AnimatePresence } from "framer-motion";

const MotionBox = motion(Box);
const MotionCard = motion(Card.Root);

interface ModuleQuizProps {
  quiz: Quiz;
  setShowQuiz: (show: boolean) => void;
}

const ModuleQuiz: React.FC<ModuleQuizProps> = ({ quiz, setShowQuiz }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
    Array(quiz.questions?.length || 0).fill(null),
  );
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [explanationVisible, setExplanationVisible] = useState<boolean[]>(
    quiz.questions.map(() => false),
  );

  // Color mode values
  const cardBg = useColorModeValue("white", "gray.950");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const accentColor = useColorModeValue("teal.600", "teal.400");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const selectedBg = useColorModeValue("teal.50", "teal.900/30");
  const selectedBorder = useColorModeValue("teal.500", "teal.400");
  const correctBg = useColorModeValue("green.50", "green.900/30");
  const correctBorder = useColorModeValue("green.500", "green.400");
  const incorrectBg = useColorModeValue("red.50", "red.900/30");
  const incorrectBorder = useColorModeValue("red.500", "red.400");
  const hoverBg = useColorModeValue("gray.50", "gray.750");


  if (!quiz?.questions?.length) return null;

  const handleSelect = (oIdx: number) => {
    if (!submitted) {
      const newAnswers = [...selectedAnswers];
      newAnswers[currentQ] = oIdx;
      setSelectedAnswers(newAnswers);
    }
  };

  const handleSubmit = () => {
    const totalScore = quiz.questions.reduce((acc, q, idx) => {
      return acc + (selectedAnswers[idx] === q.correct_option_index ? 1 : 0);
    }, 0);
    setScore(totalScore);
    setSubmitted(true);
  };
  const handleClose = () => {
    setShowQuiz(false);
  };
  const progressValue = ((currentQ + 1) / quiz.questions.length) * 100;
  const currentQuestion = quiz.questions[currentQ];
  const answeredCount = selectedAnswers.filter((a) => a !== null).length;
  const scorePercentage =
    score !== null ? (score / quiz.questions.length) * 100 : 0;

  const getScoreColor = () => {
    if (scorePercentage >= 80) return "green";
    if (scorePercentage >= 60) return "yellow";
    return "red";
  };

  return (
    <Box width="100%" maxW="900px" mx="auto" mt={3} mb={6}>
      <AnimatePresence mode="wait">
        {!submitted ? (
          <MotionBox
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <HStack justify="space-between" align="center" mb={3}>
              <VStack align="start" gap={0.5}>
                <Heading size="md">Module Quiz</Heading>
                <Text fontSize="xs" color={mutedText}>
                  {answeredCount} of {quiz.questions.length} questions answered
                </Text>
              </VStack>
              <Badge
                colorPalette="teal"
                variant="subtle"
                px={2.5}
                py={1}
                borderRadius="full"
                fontSize="xs"
              >
                <HStack gap={1}>
                  <Clock size={12} />
                  <Text fontWeight="semibold">
                    {currentQ + 1}/{quiz.questions.length}
                  </Text>
                </HStack>
              </Badge>
            </HStack>

            {/* Progress Bar */}
            <Box mb={4}>
              <Progress.Root value={progressValue} size="sm" rounded="full">
                <Progress.Track bg={useColorModeValue("gray.200", "gray.700")}>
                  <Progress.Range bg={accentColor} />
                </Progress.Track>
              </Progress.Root>
            </Box>

            {/* Question Card */}
            <MotionCard
              key={currentQ}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              shadow="md"
            >
              <Card.Header
                p={4}
                borderBottomWidth="1px"
                borderColor={borderColor}
              >
                <HStack gap={1.5} mb={1.5}>
                  <Badge
                    colorPalette="blue"
                    variant="solid"
                    size="sm"
                    borderRadius="full"
                  >
                    Question {currentQ + 1}
                  </Badge>
                  {selectedAnswers[currentQ] !== null && (
                    <Badge colorPalette="green" variant="subtle" size="sm">
                      <CheckCircle size={10} />
                      Answered
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="md" fontWeight="semibold" lineHeight="tall">
                  {currentQuestion.question}
                </Text>
              </Card.Header>

              <Card.Body p={4}>
                <VStack align="stretch" gap={2.5}>
                  {currentQuestion.options.map((option, oIdx) => {
                    const isSelected = selectedAnswers[currentQ] === oIdx;
                    return (
                      <Box
                        key={oIdx}
                        as="button"
                        onClick={() => handleSelect(oIdx)}
                        p={3}
                        borderRadius="md"
                        borderWidth="2px"
                        borderColor={isSelected ? selectedBorder : borderColor}
                        bg={isSelected ? selectedBg : "transparent"}
                        transition="all 0.2s"
                        _hover={{
                          borderColor: isSelected
                            ? selectedBorder
                            : accentColor,
                          bg: isSelected ? selectedBg : hoverBg,
                          transform: "translateY(-1px)",
                          shadow: "sm",
                        }}
                        _active={{
                          transform: "translateY(0)",
                        }}
                        textAlign="left"
                        cursor="pointer"
                      >
                        <HStack justify="space-between">
                          <HStack gap={2.5}>
                            <Box
                              w="20px"
                              h="20px"
                              borderRadius="full"
                              borderWidth="2px"
                              borderColor={
                                isSelected ? selectedBorder : borderColor
                              }
                              bg={isSelected ? selectedBorder : "transparent"}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              transition="all 0.2s"
                            >
                              {isSelected && (
                                <Box
                                  w="8px"
                                  h="8px"
                                  borderRadius="full"
                                  bg="white"
                                />
                              )}
                            </Box>
                            <Text
                              fontSize="sm"
                              fontWeight={isSelected ? "semibold" : "medium"}
                            >
                              {option}
                            </Text>
                          </HStack>
                          {isSelected && (
                            <CheckCircle size={16} color={selectedBorder} />
                          )}
                        </HStack>
                      </Box>
                    );
                  })}
                </VStack>
              </Card.Body>
            </MotionCard>

            {/* Navigation */}
            <HStack mt={4} justify="space-between">
              <Button
                onClick={() => setCurrentQ((q) => q - 1)}
                disabled={currentQ === 0}
                variant="outline"
                size="sm"
              >
                <FaArrowLeft size={12} />
                Previous
              </Button>

              <HStack gap={2}>
                {currentQ < quiz.questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQ((q) => q + 1)}
                    colorPalette="teal"
                    disabled={selectedAnswers[currentQ] === null}
                    size="sm"
                  >
                    <FaArrowRight size={12} />
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    colorPalette="teal"
                    disabled={selectedAnswers.some((a) => a === null)}
                    size="sm"
                  >
                    <FaTrophy size={12} />
                    Submit Quiz
                  </Button>
                )}
                <Button variant="ghost" onClick={handleClose} size="sm">
                  Close
                </Button>
              </HStack>
            </HStack>
          </MotionBox>
        ) : (
          <MotionBox
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Results Header */}
            <Card.Root
              bg={cardBg}
              borderWidth="2px"
              borderColor={useColorModeValue(
                `${getScoreColor()}.200`,
                `${getScoreColor()}.700`,
              )}
              shadow="lg"
              mb={4}
            >
              <Card.Body p={5}>
                <VStack gap={3}>
                  <Box
                    w="60px"
                    h="60px"
                    borderRadius="full"
                    bg={useColorModeValue(
                      `${getScoreColor()}.100`,
                      `${getScoreColor()}.900/30`,
                    )}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {scorePercentage >= 80 ? (
                      <Award
                        size={32}
                        color={useColorModeValue(
                          `${getScoreColor()}.600`,
                          `${getScoreColor()}.400`,
                        )}
                      />
                    ) : (
                      <FaTrophy
                        size={32}
                        color={useColorModeValue(
                          `${getScoreColor()}.600`,
                          `${getScoreColor()}.400`,
                        )}
                      />
                    )}
                  </Box>

                  <VStack gap={0.5}>
                    <Heading size="lg">Quiz Complete!</Heading>
                    <Text fontSize="sm" color={mutedText}>
                      Here's how you performed
                    </Text>
                  </VStack>

                  <HStack gap={4}>
                    <VStack gap={0}>
                      <Text
                        fontSize="3xl"
                        fontWeight="bold"
                        color={accentColor}
                      >
                        {score}
                      </Text>
                      <Text fontSize="xs" color={mutedText}>
                        Correct
                      </Text>
                    </VStack>

                    <Separator orientation="vertical" h="50px" />

                    <VStack gap={0}>
                      <Text fontSize="3xl" fontWeight="bold" color={mutedText}>
                        {quiz.questions.length}
                      </Text>
                      <Text fontSize="xs" color={mutedText}>
                        Total
                      </Text>
                    </VStack>

                    <Separator orientation="vertical" h="50px" />

                    <VStack gap={0}>
                      <Text
                        fontSize="3xl"
                        fontWeight="bold"
                        color={useColorModeValue(
                          `${getScoreColor()}.600`,
                          `${getScoreColor()}.400`,
                        )}
                      >
                        {Math.round(scorePercentage)}%
                      </Text>
                      <Text fontSize="xs" color={mutedText}>
                        Score
                      </Text>
                    </VStack>
                  </HStack>

                  <Badge
                    colorPalette={getScoreColor()}
                    variant="solid"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    {scorePercentage >= 80
                      ? "Excellent Work!"
                      : scorePercentage >= 60
                        ? "Good Job!"
                        : "Keep Practicing!"}
                  </Badge>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Review Section */}
            <Heading size="sm" mb={3}>
              Answer Review
            </Heading>

            <VStack gap={3} align="stretch">
              {quiz.questions.map((q, qIdx) => {
                const isCorrect =
                  selectedAnswers[qIdx] === q.correct_option_index;
                return (
                  <Card.Root
                    key={qIdx}
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderLeftWidth="4px"
                    borderLeftColor={
                      isCorrect ? correctBorder : incorrectBorder
                    }
                  >
                    <Card.Header
                      p={3}
                      borderBottomWidth="1px"
                      borderColor={borderColor}
                    >
                      <HStack justify="space-between">
                        <HStack gap={1.5}>
                          <Badge
                            colorPalette="blue"
                            variant="solid"
                            size="sm"
                            borderRadius="full"
                          >
                            Q{qIdx + 1}
                          </Badge>
                          <Text fontWeight="semibold" fontSize="sm">
                            {q.question}
                          </Text>
                        </HStack>
                        {isCorrect ? (
                          <Badge colorPalette="green" variant="solid" size="sm">
                            <CheckCircle size={10} />
                            Correct
                          </Badge>
                        ) : (
                          <Badge colorPalette="red" variant="solid" size="sm">
                            <XCircle size={10} />
                            Incorrect
                          </Badge>
                        )}
                      </HStack>
                    </Card.Header>

                    <Card.Body p={3}>
                      <VStack align="stretch" gap={2}>
                        {q.options.map((option, oIdx) => {
                          const isSelected = selectedAnswers[qIdx] === oIdx;
                          const isCorrectOption =
                            q.correct_option_index === oIdx;

                          let bg = "transparent";
                          let borderColorValue = borderColor;
                          let icon = null;

                          if (isCorrectOption) {
                            bg = correctBg;
                            borderColorValue = correctBorder;
                            icon = <CheckCircle size={14} color="green" />;
                          } else if (isSelected && !isCorrectOption) {
                            bg = incorrectBg;
                            borderColorValue = incorrectBorder;
                            icon = <XCircle size={14} color="red" />;
                          }

                          return (
                            <HStack
                              key={oIdx}
                              p={2.5}
                              borderRadius="md"
                              bg={bg}
                              borderWidth="1px"
                              borderColor={borderColorValue}
                              justify="space-between"
                            >
                              <Text
                                fontSize="xs"
                                fontWeight={
                                  isCorrectOption || isSelected
                                    ? "semibold"
                                    : "normal"
                                }
                              >
                                {option}
                              </Text>
                              {icon}
                            </HStack>
                          );
                        })}
                      </VStack>

                      {/* Explanation */}
                      <Box mt={2}>
                        <Button
                          onClick={() => {
                            const next = [...explanationVisible];
                            next[qIdx] = !next[qIdx];
                            setExplanationVisible(next);
                          }}
                          size="xs"
                          variant="ghost"
                          colorPalette="teal"
                        >
                          <FaLightbulb size={10} />
                          {explanationVisible[qIdx]
                            ? "Hide Explanation"
                            : "Show Explanation"}
                        </Button>

                        <AnimatePresence>
                          {explanationVisible[qIdx] && (
                            <MotionBox
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <Box
                                mt={2}
                                p={2.5}
                                borderRadius="md"
                                bg={useColorModeValue("blue.50", "blue.900/20")}
                                borderWidth="1px"
                                borderColor={useColorModeValue(
                                  "blue.200",
                                  "blue.700",
                                )}
                              >
                                <HStack gap={1.5} mb={1}>
                                  <FaLightbulb color={accentColor} size={12} />
                                  <Text
                                    fontSize="2xs"
                                    fontWeight="semibold"
                                    textTransform="uppercase"
                                    color={accentColor}
                                  >
                                    Explanation
                                  </Text>
                                </HStack>
                                <Text fontSize="xs" lineHeight="tall">
                                  {q.explanation}
                                </Text>
                              </Box>
                            </MotionBox>
                          )}
                        </AnimatePresence>
                      </Box>
                    </Card.Body>
                  </Card.Root>
                );
              })}
            </VStack>

            <HStack mt={4} justify="center">
              <Button
                variant="solid"
                colorPalette="teal"
                onClick={handleClose}
                size="sm"
              >
                Close Review
              </Button>
            </HStack>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default ModuleQuiz;
