import React, { useState } from "react";
import {
    Box,
    Button,
    Heading,
    Text,
    VStack,
    HStack,
    Icon,
} from "@chakra-ui/react";
import { FaCheck, FaTimes } from "react-icons/fa";

interface QuizQuestion {
    question: string;
    options: string[];
    correctOptionIndex: number;
}

interface ModuleQuizProps {
    quiz: QuizQuestion[];
    setShowQuiz: (show: boolean) => void;
    onQuizSubmit?: () => void;
}

const ModuleQuiz: React.FC<ModuleQuizProps> = ({ quiz, setShowQuiz, onQuizSubmit }) => {
    const [selectedAnswers, setSelectedAnswers] = useState<(number)[]>(
        Array(quiz.length).fill(null)
    );
    const [submitted, setSubmitted] = useState(false);
    console.log(quiz);
    const handleSelect = (qIdx: number, oIdx: number) => {
        if (!submitted) {
            const newAnswers = [...selectedAnswers];
            newAnswers[qIdx] = oIdx;
            setSelectedAnswers(newAnswers);
        }
    };

    const handleSubmit = () => {
        setSubmitted(true);
        if (onQuizSubmit) onQuizSubmit();
    };
    const handleClose = () => {
        setShowQuiz(false);
    };

    const score = selectedAnswers.reduce((acc, ans, idx) => {
        if (ans === quiz[idx].correctOptionIndex) return acc + 1;
        return acc;
    }, 0);

    return (
        <Box
            mt={6}
            w="full"
            p={4}
            borderRadius="md"
            bg="gray.50"
            _dark={{ bg: "gray.700" }}
        >
            <Heading size="md" mb={4}>
                Module Quiz
            </Heading>

            {quiz.map((q, qIdx) => (
                <Box
                    key={qIdx}
                    mb={4}
                    p={3}
                    borderRadius="md"
                    bg="white"
                    _dark={{ bg: "gray.800" }}
                    shadow="sm"
                    transition="transform 0.1s"
                    _hover={{ transform: !submitted ? "scale(1.01)" : undefined }}
                >
                    <Text fontWeight="semibold" mb={2}>
                        Q{qIdx + 1}: {q.question}
                    </Text>

                    <VStack align="start" gap={2}>
                        {q.options.map((option, oIdx) => {
                            const isSelected = selectedAnswers[qIdx] === oIdx;
                            const isCorrect = q.correctOptionIndex === oIdx;
                            const showResult = submitted && (isSelected || isCorrect);

                            let bgColor;
                            if (submitted) {
                                if (isCorrect) bgColor = "green.300";
                                else if (isSelected && !isCorrect) bgColor = "red.300";
                            } else if (isSelected) {
                                bgColor = "blue.200";
                            }

                            return (
                                <Button
                                    key={oIdx}
                                    w="full"
                                    justifyContent="flex-start"
                                    bg={bgColor}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSelect(qIdx, oIdx)}
                                    disabled={submitted}
                                    _hover={{ bg: !submitted ? "blue.300" : undefined }}
                                    borderColor={showResult ? "transparent" : undefined}
                                >
                                    <HStack w="full" justifyContent="space-between">
                                        <Text>{option}</Text>
                                        {showResult && (
                                            <Icon
                                                as={isCorrect ? FaCheck : FaTimes}
                                                color={isCorrect ? "green.600" : "red.600"}
                                            />
                                        )}
                                    </HStack>
                                </Button>
                            );
                        })}
                    </VStack>
                </Box>
            ))}

            {!submitted ? (
                <Button mt={4} colorScheme="teal" onClick={handleSubmit}>
                    Submit Quiz
                </Button>
            ) : (
                <>
                    <Text mt={4} fontWeight="bold" fontSize="lg">
                        You scored {score} out of {quiz.length}
                    </Text>
                    <Button mt={4} colorScheme="teal" onClick={handleClose}>
                        Close
                    </Button>
                </>
            )}
        </Box>
    );
};

export default ModuleQuiz;
