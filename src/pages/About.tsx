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
    Container,
} from "@chakra-ui/react";
import { FaGithub, FaEnvelope, FaCheckCircle } from "react-icons/fa";

import { useColorModeValue, useColorMode } from "../components/ui/color-mode";
import promptlyLeanrnLogoDark from "../assets/pl-logo-dark.png";
import promptlyLeanrnLogoLight from "../assets/pl-logo-light.png";

const AboutPage: React.FC = () => {
    const logo = useColorModeValue(promptlyLeanrnLogoLight, promptlyLeanrnLogoDark);

    return (
        <Box minH="100vh" py={12}>
            <Container maxW="1200px" px={6}>
                {/* Hero Section */}
                <VStack gap={8} mb={12} textAlign="center">
                    <Image
                        src={logo}
                        alt="AI Course Builder Logo"
                        height="180px"
                        objectFit="contain"
                    />
                    <VStack gap={3}>
                        <Heading size="2xl" fontWeight="bold">
                            AI Course Builder
                        </Heading>
                        <Text fontSize="xl" maxW="700px">
                            Empowering learners to create personalized, AI-driven learning roadmaps
                            that accelerate skill development and career growth
                        </Text>
                    </VStack>
                </VStack>

                {/* Main Content */}
                <VStack align="stretch" gap={10}>
                    {/* Mission Section */}
                    <Box p={8} borderRadius="lg" borderWidth="1px" borderColor="gray.200">
                        <Heading size="lg" mb={4} color="teal.600">
                            Our Mission
                        </Heading>
                        <Text fontSize="lg" lineHeight="tall" >
                            We believe that effective learning requires both structure and personalization.
                            Our platform combines the power of artificial intelligence with thoughtfully
                            designed learning frameworks to help individuals create tailored educational
                            pathways. Whether you're switching careers, deepening expertise, or exploring
                            new interests, we provide the tools to transform your learning goals into
                            actionable, measurable progress.
                        </Text>
                    </Box>

                    {/* Features Section */}
                    <Box p={8} borderRadius="lg" borderWidth="1px" borderColor="gray.200">
                        <Heading size="lg" mb={6} color="teal.600">
                            Platform Features
                        </Heading>
                        <List.Root gap={4} fontSize="md">
                            <ListItem display="flex" alignItems="start" gap={3}>
                                <Box color="teal.500" mt={1}>
                                    <FaCheckCircle />
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" mb={1}>
                                        AI-Powered Course Generation
                                    </Text>
                                    <Text >
                                        Generate comprehensive learning roadmaps and structured course
                                        outlines tailored to your specific goals and skill level
                                    </Text>
                                </Box>
                            </ListItem>
                            <ListItem display="flex" alignItems="start" gap={3}>
                                <Box color="teal.500" mt={1}>
                                    <FaCheckCircle />
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" mb={1}>
                                        Interactive Learning Experience
                                    </Text>
                                    <Text >
                                        Navigate through interactive learning nodes with built-in progress
                                        tracking, knowledge assessments, and comprehension quizzes
                                    </Text>
                                </Box>
                            </ListItem>
                            <ListItem display="flex" alignItems="start" gap={3}>
                                <Box color="teal.500" mt={1}>
                                    <FaCheckCircle />
                                </Box>
                                <Box>
                                    <Text fontWeight="semibold" mb={1}>
                                        Portfolio Development
                                    </Text>
                                    <Text >
                                        Export your learning achievements, create shareable roadmaps,
                                        and receive portfolio project suggestions to showcase your skills
                                    </Text>
                                </Box>
                            </ListItem>
                        </List.Root>
                    </Box>

                    {/* Contact Section */}
                    <Box p={8} borderRadius="lg" borderWidth="1px" borderColor="gray.200">
                        <Heading size="lg" mb={4} color="teal.600">
                            Connect With Us
                        </Heading>
                        <Text fontSize="md" mb={6}>
                            We're committed to continuous improvement and value your feedback.
                            Reach out to collaborate, report issues, or share your success stories.
                        </Text>
                        <HStack gap={4} flexWrap="wrap">
                            <Link href="https://github.com/your-repo">
                                <Button
                                    colorScheme="gray"
                                    variant="outline"
                                    size="lg"
                                >
                                    <FaGithub />
                                    View on GitHub
                                </Button>
                            </Link>
                            <Link href="mailto:hello@example.com">
                                <Button
                                    colorScheme="teal"
                                    size="lg"
                                >
                                    <FaEnvelope />
                                    Contact Us
                                </Button>
                            </Link>
                        </HStack>
                    </Box>
                </VStack>

                {/* Footer */}
                <Box mt={16} pt={8} borderTop="1px" borderColor="gray.200" textAlign="center">
                    <Text fontSize="sm" >
                        © {new Date().getFullYear()} AI Course Builder. Transforming education through intelligent technology.
                    </Text>
                </Box>
            </Container>
        </Box>
    );
};

export default AboutPage;