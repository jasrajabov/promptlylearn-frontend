import React from "react";
import {
    Box,
    Heading,
    Text,
    VStack,
    HStack,
    Image,
    Button,
    Container,
    SimpleGrid,
    Card,
    Link,
} from "@chakra-ui/react";
import {
    Github,
    Mail,
    CheckCircle2,
    Sparkles,
    Target,
    TrendingUp,
    BookOpen,
    Zap,
    Users,
    Award,
    Rocket,
    Brain,
} from "lucide-react";
import { motion } from "framer-motion";

import { useColorModeValue } from "../components/ui/color-mode";
import promptlyLeanrnLogoDark from "../assets/pl-logo-dark.png";
import promptlyLeanrnLogoLight from "../assets/pl-logo-light.png";

const MotionBox = motion(Box);
const MotionCard = motion(Card.Root);

const AboutPage: React.FC = () => {
    const logo = useColorModeValue(promptlyLeanrnLogoLight, promptlyLeanrnLogoDark);
    const accentColor = useColorModeValue("teal.600", "teal.400");
    const cardBg = useColorModeValue("white", "gray.800");
    const borderColor = useColorModeValue("gray.200", "gray.700");

    const features = [
        {
            icon: Brain,
            title: "AI-Powered Course Generation",
            description:
                "Generate comprehensive learning roadmaps and structured course outlines tailored to your specific goals and skill level using advanced AI technology.",
            color: "purple.500",
        },
        {
            icon: Target,
            title: "Interactive Learning Experience",
            description:
                "Navigate through interactive learning nodes with built-in progress tracking, knowledge assessments, and comprehension quizzes that adapt to your pace.",
            color: "blue.500",
        },
        {
            icon: Award,
            title: "Portfolio Development",
            description:
                "Export your learning achievements, create shareable roadmaps, and receive portfolio project suggestions to showcase your skills to employers.",
            color: "green.500",
        },
        {
            icon: Zap,
            title: "Adaptive Learning Paths",
            description:
                "Our AI continuously adjusts your learning journey based on your progress, ensuring optimal challenge levels and maximizing retention.",
            color: "orange.500",
        },
        {
            icon: Users,
            title: "Community Insights",
            description:
                "Learn from the collective wisdom of thousands of learners who have walked similar paths and achieved their goals.",
            color: "pink.500",
        },
        {
            icon: Rocket,
            title: "Career Acceleration",
            description:
                "Bridge skill gaps faster with targeted learning modules designed to meet real-world industry demands and job requirements.",
            color: "cyan.500",
        },
    ];


    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 },
        },
    };

    return (
        <Box minH="100vh" py={12}>
            <Container maxW="1200px" px={6}>
                {/* Hero Section */}
                <MotionBox
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <VStack gap={8} mb={16} textAlign="center">
                        <Image
                            src={logo}
                            alt="AI Course Builder Logo"
                            height="180px"
                            objectFit="contain"
                        />
                        <VStack gap={4}>
                            <Text fontSize="xl" maxW="700px" >
                                Empowering learners to create personalized, AI-driven learning
                                roadmaps that accelerate skill development and career growth
                            </Text>
                        </VStack>
                    </VStack>
                </MotionBox>

                {/* Stats Section
                <MotionBox
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    mb={16}
                >
                    <SimpleGrid columns={{ base: 2, md: 4 }} gap={6}>
                        {stats.map((stat, index) => (
                            <MotionCard
                                key={index}
                                variants={itemVariants}
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                            >
                                <Card.Body textAlign="center" p={6}>
                                    <VStack gap={3}>
                                        <Box color={accentColor}>
                                            <stat.icon size={32} />
                                        </Box>
                                        <Text fontSize="3xl" fontWeight="bold">
                                            {stat.value}
                                        </Text>
                                        <Text fontSize="sm" color="gray.600">
                                            {stat.label}
                                        </Text>
                                    </VStack>
                                </Card.Body>
                            </MotionCard>
                        ))}
                    </SimpleGrid>
                </MotionBox> */}

                <VStack align="stretch" gap={16}>
                    {/* Mission Section */}
                    <MotionBox
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <Card.Root borderColor={borderColor}>
                            <Card.Body p={10}>
                                <HStack gap={4} mb={6}>
                                    <Box color={accentColor}>
                                        <Sparkles size={32} />
                                    </Box>
                                    <Heading size="xl" color={accentColor}>
                                        Our Mission
                                    </Heading>
                                </HStack>
                                <Text fontSize="lg" lineHeight="tall">
                                    We believe that effective learning requires both structure and
                                    personalization. Our platform combines the power of artificial
                                    intelligence with thoughtfully designed learning frameworks to help
                                    individuals create tailored educational pathways. Whether you're
                                    switching careers, deepening expertise, or exploring new interests,
                                    we provide the tools to transform your learning goals into
                                    actionable, measurable progress.
                                </Text>
                            </Card.Body>
                        </Card.Root>
                    </MotionBox>

                    {/* Features Grid */}
                    <Box>
                        <Heading size="xl" mb={8} textAlign="center" color={accentColor}>
                            Platform Features
                        </Heading>
                        <MotionBox
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                        >
                            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
                                {features.map((feature, index) => (
                                    <MotionCard
                                        key={index}
                                        variants={itemVariants}
                                        whileHover={{ y: -8 }}
                                        transition={{ duration: 0.3 }}
                                        borderColor={borderColor}
                                        _hover={{ boxShadow: "xl" }}
                                    >
                                        <Card.Body p={6}>
                                            <VStack align="start" gap={4}>
                                                <Box color={feature.color}>
                                                    <feature.icon size={40} />
                                                </Box>
                                                <Heading size="lg">{feature.title}</Heading>
                                                <Text lineHeight="tall">
                                                    {feature.description}
                                                </Text>
                                            </VStack>
                                        </Card.Body>
                                    </MotionCard>
                                ))}
                            </SimpleGrid>
                        </MotionBox>
                    </Box>

                    {/* Contact Section */}
                    <MotionBox
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <Card.Root
                            borderColor={borderColor}
                            textAlign="center"
                        >
                            <Card.Body p={10}>
                                <VStack gap={6}>
                                    <Box color={accentColor}>
                                        <Mail size={48} />
                                    </Box>
                                    <Heading size="xl" color={accentColor}>
                                        Connect With Us
                                    </Heading>
                                    <Text fontSize="md" maxW="600px" color="gray.600">
                                        We're committed to continuous improvement and value your
                                        feedback. Reach out to collaborate, report issues, or share
                                        your success stories.
                                    </Text>
                                    <HStack gap={4} flexWrap="wrap" justify="center">
                                        <Link href="https://github.com/your-repo">
                                            <Button
                                                size="lg"
                                                variant="outline"
                                                colorScheme="gray"
                                            >
                                                <Github size={20} />
                                                View on GitHub
                                            </Button>
                                        </Link>
                                        <Link href="mailto:hello@example.com">
                                            <Button
                                                size="lg"
                                                colorScheme="teal"
                                            >
                                                <Mail size={20} />
                                                Contact Us
                                            </Button>
                                        </Link>
                                    </HStack>
                                </VStack>
                            </Card.Body>
                        </Card.Root>
                    </MotionBox>
                </VStack>

                {/* Footer */}
                <MotionBox
                    mt={16}
                    pt={8}
                    borderTop="1px"
                    borderColor={borderColor}
                    textAlign="center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <Text fontSize="sm" color="gray.600">
                        © {new Date().getFullYear()} AI Course Builder. Transforming education
                        through intelligent technology.
                    </Text>
                </MotionBox>
            </Container>
        </Box>
    );
};

export default AboutPage;