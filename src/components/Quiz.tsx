import React, { useState } from "react";
import {
    Box,
    Button,
    Heading,
    Text,
    VStack,
    HStack,
    Icon,
    Card,
    CardHeader,
    CardBody,
    Progress,
} from "@chakra-ui/react";
import { FaCheck, FaTimes } from "react-icons/fa";
import type { Quiz } from "../types";
import { useColorModeValue } from "./ui/color-mode";

interface ModuleQuizProps {
    quiz: Quiz;
    setShowQuiz: (show: boolean) => void;
    onQuizSubmit?: () => void;
}

const ModuleQuiz: React.FC<ModuleQuizProps> = ({
    quiz,
    setShowQuiz,
    onQuizSubmit,
}) => {
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
        Array(quiz.questions.length).fill(null)
    );
    const [currentQ, setCurrentQ] = useState(0);
    const [submitted, setSubmitted] = useState(false);

    const handleSelect = (oIdx: number) => {
        if (!submitted) {
            const newAnswers = [...selectedAnswers];
            newAnswers[currentQ] = oIdx;
            setSelectedAnswers(newAnswers);
        }
    };

    const handleSubmit = () => {
        setSubmitted(true);
        // if (onQuizSubmit) onQuizSubmit();
    };

    const handleClose = () => {
        setShowQuiz(false);
    };

    const score = selectedAnswers.reduce((acc: number, ans, idx) => {
        if (ans === quiz.questions[idx].correctOptionIndex) return acc + 1;
        return acc;
    }, 0);

    const progressValue = ((currentQ + 1) / quiz.questions.length) * 100;

    const currentQuestion = quiz.questions[currentQ];

    if (!submitted) {
        // Per-question navigation view
        return (
            <Box mt={6} w="full">
                <Heading size="md" mb={4}>
                    Module Quiz
                </Heading>

                {/* Progress */}
                <Progress.Root value={progressValue} size="sm" mb={6} rounded="full">
                    <Progress.Track>
                        <Progress.Range />
                    </Progress.Track>
                </Progress.Root>

                <Card.Root shadow="sm" borderRadius="lg">
                    <CardHeader>
                        <Text fontWeight="semibold" color={useColorModeValue("teal.800", "teal.500")}>
                            Q{currentQ + 1}: {currentQuestion.question}
                        </Text>
                    </CardHeader>
                    <CardBody>
                        <VStack align="start" gap={3}>
                            {currentQuestion.options.map((option, oIdx) => {
                                const isSelected = selectedAnswers[currentQ] === oIdx;
                                const bgColor = isSelected
                                    ? useColorModeValue("blue.100", "blue.700")
                                    : "transparent";
                                return (
                                    <Button
                                        key={oIdx}
                                        w="full"
                                        justifyContent="flex-start"
                                        bg={bgColor}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleSelect(oIdx)}
                                    >
                                        {option}
                                    </Button>
                                );
                            })}
                        </VStack>
                    </CardBody>
                </Card.Root>

                {/* Navigation */}
                <HStack mt={6} justify="">
                    <Button
                        onClick={() => setCurrentQ((q) => q - 1)}
                        disabled={currentQ === 0}
                    >
                        Previous
                    </Button>

                    {currentQ < quiz.questions.length - 1 ? (
                        <Button
                            onClick={() => setCurrentQ((q) => q + 1)}
                            colorScheme="teal"
                            disabled={selectedAnswers[currentQ] === null}
                        >
                            Next
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            colorScheme="teal"
                            disabled={selectedAnswers[currentQ] === null}
                        >
                            Submit Quiz
                        </Button>
                    )}
                    <Button colorScheme="teal" onClick={handleClose}>
                        Close
                    </Button>
                </HStack>

            </Box>
        );
    }

    // Review mode (all questions with correct/incorrect)
    return (
        <Box mt={6} w="full">
            <Heading size="md" mb={4} textAlign="center">
                Quiz Review
            </Heading>

            <Text fontWeight="bold" fontSize="lg" mb={6} textAlign="center">
                You scored {score} out of {quiz.questions.length}
            </Text>

            <VStack gap={6} align="stretch">
                {quiz.questions.map((q, qIdx) => (
                    <Card.Root key={qIdx} shadow="sm" borderRadius="lg">
                        <CardHeader>
                            <Text fontWeight="semibold">
                                Q{qIdx + 1}: {q.question}
                            </Text>
                        </CardHeader>
                        <CardBody>
                            <VStack align="start" gap={3}>
                                {q.options.map((option, oIdx) => {
                                    const isSelected = selectedAnswers[qIdx] === oIdx;
                                    const isCorrect = q.correctOptionIndex === oIdx;

                                    let bg = useColorModeValue("transparent", "transparent");
                                    if (isCorrect) bg = useColorModeValue("green.100", "green.700");
                                    else if (isSelected && !isCorrect)
                                        bg = useColorModeValue("red.100", "red.700");

                                    return (
                                        <HStack
                                            key={oIdx}
                                            p={2}
                                            borderRadius="md"
                                            bg={bg}
                                            justifyContent="space-between"
                                        >
                                            <Text>{option}</Text>
                                            {isCorrect && <Icon as={FaCheck} color="green.500" />}
                                            {isSelected && !isCorrect && <Icon as={FaTimes} color="red.500" />}
                                        </HStack>
                                    );
                                })}
                            </VStack>
                        </CardBody>
                    </Card.Root>
                ))}
            </VStack>
            <Button mt={6} colorScheme="teal" onClick={handleClose}>
                Close
            </Button>

        </Box>
    );
};

export default ModuleQuiz;
