import React, { useEffect, useState } from "react";
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
import { useUser } from "../contexts/UserContext";


interface ModuleQuizProps {
    quiz: Quiz;
    setShowQuiz: (show: boolean) => void;
}

const ModuleQuiz: React.FC<ModuleQuizProps> = ({
    quiz,
    setShowQuiz,
}) => {
    const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(
        Array(quiz.questions?.length || 0).fill(null)
    );
    console.log("Quiz component quiz prop:", quiz);
    const [currentQ, setCurrentQ] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState<number | null>(null);
    const [explanationVisible, setExplanationVisible] = useState<boolean[]>(quiz.questions.map(() => false));

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
        // if (onQuizSubmit) onQuizSubmit(totalScore);
    };

    const handleClose = () => {
        setShowQuiz(false);
    };

    const progressValue = ((currentQ + 1) / quiz.questions.length) * 100;
    const currentQuestion = quiz.questions[currentQ];

    return (
        <Box alignContent="center" alignItems="center" width="100%" maxW="70%" justifyContent="center" mt={6}>
            {!submitted ? (
                <>
                    <Heading size="md" mb={4}>
                        Module Quiz
                    </Heading>

                    <Progress.Root value={progressValue} size="sm" mb={6} rounded="full">
                        <Progress.Track>
                            <Progress.Range />
                        </Progress.Track>
                    </Progress.Root>

                    <Card.Root shadow="sm" borderRadius="lg" w="100%">
                        <CardHeader>
                            <Text
                                fontWeight="semibold"
                                color={useColorModeValue("teal.800", "teal.500")}
                            >
                                Question {currentQ + 1}: {currentQuestion.question}
                            </Text>
                        </CardHeader>
                        <CardBody>
                            <VStack align="start" gap={3} w="100%">
                                {currentQuestion.options.map((option, oIdx) => {
                                    const isSelected = selectedAnswers[currentQ] === oIdx;
                                    const bgColor = isSelected
                                        ? useColorModeValue("blue.100", "blue.700")
                                        : "transparent";
                                    return (
                                        <Button
                                            key={oIdx}
                                            w="100%"
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

                    <HStack mt={6} justify="space-between">
                        <Button
                            onClick={() => setCurrentQ((q) => q - 1)}
                            disabled={currentQ === 0}
                            variant={"ghost"}
                        >
                            Previous
                        </Button>

                        {currentQ < quiz.questions.length - 1 ? (
                            <Button
                                onClick={() => setCurrentQ((q) => q + 1)}
                                colorScheme="teal"
                                disabled={selectedAnswers[currentQ] === null}
                                variant={"ghost"}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                colorScheme="teal"
                                disabled={selectedAnswers[currentQ] === null}
                                variant={"ghost"}
                            >
                                Submit Quiz
                            </Button>
                        )}
                        <Button colorScheme="teal" variant="ghost" onClick={handleClose}>
                            Close
                        </Button>
                    </HStack>
                </>
            ) : (
                <>
                    <Heading size="md" mb={4} textAlign="center">
                        Quiz Review
                    </Heading>
                    <Text
                        fontWeight="bold"
                        fontSize="lg"
                        mb={6}
                        textAlign="center"
                        color={useColorModeValue("teal.700", "teal.300")}
                    >
                        You scored {score} out of {quiz.questions.length}
                    </Text>

                    <VStack gap={6} align="stretch" w="100%">
                        {quiz.questions.map((q, qIdx) => (
                            <Card.Root key={qIdx} shadow="sm" borderRadius="lg" w="100%">
                                <CardHeader>
                                    <Text fontWeight="semibold" fontSize={"lg"}>
                                        Question: {qIdx + 1}: {q.question}
                                    </Text>
                                </CardHeader>
                                <CardBody>
                                    <VStack align="start" gap={3} w="100%">
                                        {q.options.map((option, oIdx) => {
                                            const isSelected = selectedAnswers[qIdx] === oIdx;
                                            const isCorrect = q.correct_option_index === oIdx;
                                            let bg = "transparent";

                                            if (isCorrect)
                                                bg = useColorModeValue("green.100", "green.700");
                                            else if (isSelected && !isCorrect)
                                                bg = useColorModeValue("red.100", "red.700");

                                            return (
                                                <>
                                                    <HStack
                                                        key={oIdx}
                                                        p={2}
                                                        borderRadius="md"
                                                        bg={bg}
                                                        justifyContent="space-between"
                                                        w="100%"
                                                    >
                                                        <Text>{option}</Text>
                                                        {isCorrect && (
                                                            <Icon as={FaCheck} color="green.500" />
                                                        )}
                                                        {isSelected && !isCorrect && (
                                                            <Icon as={FaTimes} color="red.500" />
                                                        )}
                                                    </HStack>

                                                </>

                                            );
                                        })}
                                    </VStack>
                                    <Button
                                        onClick={() => {
                                            const next = [...explanationVisible];
                                            next[qIdx] = !next[qIdx];
                                            setExplanationVisible(next);
                                        }}
                                        size="sm"
                                        width="15%"
                                        variant="ghost"
                                        mt={4}
                                    >
                                        {explanationVisible[qIdx] ? "Hide Explanation" : "Show Explanation"}
                                    </Button>
                                    {explanationVisible[qIdx] && (
                                        <Text mt={4} fontStyle="italic" fontSize="sm" color={useColorModeValue("teal.700", "teal.300")}>
                                            Explanation: {q.explanation}
                                        </Text>
                                    )}
                                </CardBody>
                            </Card.Root>
                        ))}
                    </VStack>
                    <Button mt={6} variant="ghost" onClick={handleClose}>
                        Close
                    </Button>
                </>
            )
            }
        </Box >
    );
};

export default ModuleQuiz;
