// components/InteractiveElementComponent.tsx
import { Box, Text, VStack, Input, Button } from "@chakra-ui/react";
import { useState } from "react";

interface InteractiveElement {
    type: "quiz" | "exercise";
    question: string;
}

interface Props {
    element: InteractiveElement;
}

const InteractiveElementComponent: React.FC<Props> = ({ element }) => {
    const [answer, setAnswer] = useState("");

    const handleSubmit = () => {
        alert(`Your answer: ${answer}`);
        setAnswer("");
    };

    return (
        <Box p={3} borderWidth="1px" borderRadius="md" w="100%">
            <Text fontWeight="bold" mb={2}>
                {element.type === "quiz" ? "Quiz:" : "Exercise:"} {element.question}
            </Text>

            {element.type === "exercise" ? (
                <VStack gap={2} align="stretch">
                    <Input
                        placeholder="Type your answer here..."
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                    />
                    <Button colorScheme="teal" onClick={handleSubmit}>
                        Submit
                    </Button>
                </VStack>
            ) : (
                // For quizzes, you could later add multiple choice options
                <Text>Answer: {answer || "(Enter your answer above)"}</Text>
            )}
        </Box>
    );
};

export default InteractiveElementComponent;
