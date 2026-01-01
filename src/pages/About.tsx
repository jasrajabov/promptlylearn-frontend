import React from "react";
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Image,
    Link,
    Button,
    List,
    ListItem,
} from "@chakra-ui/react";
import { FaGithub, FaEnvelope, FaCheckCircle } from "react-icons/fa";

import { useColorModeValue, useColorMode } from "../components/ui/color-mode";
import promptlyLeanrnLogoDark from "../assets/pl-logo-dark.png";
import promptlyLeanrnLogoLight from "../assets/pl-logo-light.png";

const AboutPage: React.FC = () => {
    // use public assets so bundler/path issues are avoided
    const logo = useColorModeValue(promptlyLeanrnLogoLight, promptlyLeanrnLogoDark);

    return (
        <Box maxW="1000px" mx="auto" px={6} py={10}>
            <Image src={logo} alt="AI Course Builder" align="center" height="200px" />
            <HStack gap={4} align="center" mb={6}>

                <VStack align="start" gap={0}>
                    <Heading size="lg">AI Course Builder</Heading>
                    <Text fontSize="sm" color="gray.500">Create & explore personalized learning roadmaps powered by AI</Text>
                </VStack>
            </HStack>

            <VStack align="stretch" gap={6}>
                <Box>
                    <Heading size="md" mb={2}>Our Mission</Heading>
                    <Text color="gray.600">
                        Help learners build practical, focused learning roadmaps and courses faster by combining AI generation
                        with human-curated structure. Learn more, build projects, and show your progress.
                    </Text>
                </Box>

                <Box>
                    <Heading size="md" mb={2}>What we offer</Heading>
                    <List.Root gap={2}>
                        <ListItem>
                            AI-generated roadmaps and course outlines
                        </ListItem>
                        <ListItem>
                            Interactive nodes with progress tracking and quizzes
                        </ListItem>
                        <ListItem>
                            Exportable learning plans and portfolio suggestions
                        </ListItem>
                    </List.Root>
                </Box>


                <Box>
                    <Heading size="md" mb={2}>Get in touch</Heading>
                    <HStack gap={4}>
                        <Link href="https://github.com/your-repo">
                            <Button variant="ghost">GitHub
                                <FaGithub />
                            </Button>
                        </Link>
                        <Link href="mailto:hello@example.com">
                            <Button variant="ghost">Email
                                <FaEnvelope />
                            </Button>
                        </Link>
                    </HStack>
                </Box>
            </VStack>
        </Box>
    );
};

export default AboutPage;