// Premium Logo Showcase - View all professional designs
import { Box, Container, Heading, Text, VStack, Grid, Card, HStack, Badge } from "@chakra-ui/react";
import { useColorModeValue } from "../components/ui/color-mode";
import {
    NeuralLogo,
    GeometricLogo,
    RocketLogo,
    LightbulbLogo,
    TargetLogo,
    TrendLogo,
} from "../components/Logo";

export default function PremiumLogoShowcase() {
    const cardBg = useColorModeValue("white", "gray.950");
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const mutedText = useColorModeValue("gray.600", "gray.400");

    const logos = [
        {
            name: "Neural Network",
            component: NeuralLogo,
            description: "AI-focused, modern, tech-forward. Perfect for emphasizing AI capabilities.",
            keywords: ["AI", "Modern", "Tech", "Sophisticated"],
            mood: "🧠 Intelligent & Cutting-edge",
        },
        {
            name: "Geometric Hexagon",
            component: GeometricLogo,
            description: "Clean, professional, sophisticated. Minimal design for serious brands.",
            keywords: ["Professional", "Clean", "Minimal", "Corporate"],
            mood: "💼 Professional & Trustworthy",
        },
        {
            name: "Rocket Launch",
            component: RocketLogo,
            description: "Dynamic, energetic, achievement-focused. Shows growth and momentum.",
            keywords: ["Growth", "Energy", "Achievement", "Dynamic"],
            mood: "🚀 Fast & Ambitious",
        },
        {
            name: "Lightbulb Moment",
            component: LightbulbLogo,
            description: "Creative, inspiring, innovation-focused. Represents ideas and discovery.",
            keywords: ["Creative", "Ideas", "Innovation", "Inspiration"],
            mood: "💡 Innovative & Creative",
        },
        {
            name: "Target Precision",
            component: TargetLogo,
            description: "Goal-oriented, focused, precise. Perfect for achievement-based learning.",
            keywords: ["Focus", "Goals", "Precision", "Achievement"],
            mood: "🎯 Focused & Precise",
        },
        {
            name: "Upward Trend",
            component: TrendLogo,
            description: "Growth-focused, data-driven. Shows progress and improvement.",
            keywords: ["Progress", "Growth", "Success", "Data"],
            mood: "📈 Growing & Improving",
        },
    ];

    return (
        <Box minH="100vh" py={12}>
            <Container maxW="1400px">
                <VStack gap={12} align="stretch">
                    {/* Header */}
                    <VStack gap={4} textAlign="center">
                        <Badge colorPalette="teal" variant="solid" px={3} py={1} borderRadius="full">
                            Premium Collection
                        </Badge>
                        <Heading size="3xl" fontWeight="900">
                            Professional Logo Designs
                        </Heading>
                        <Text color={mutedText} fontSize="lg" maxW="600px">
                            6 unique, hand-crafted logo designs. Each conveys a different brand personality.
                        </Text>
                    </VStack>

                    {/* Logo Grid */}
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={8}>
                        {logos.map((logo, index) => (
                            <Card.Root
                                key={index}
                                bg={cardBg}
                                borderWidth="2px"
                                borderColor={borderColor}
                                borderRadius="2xl"
                                overflow="hidden"
                                boxShadow="0 4px 12px rgba(0, 0, 0, 0.08)"
                                transition="all 0.3s"
                                _hover={{
                                    borderColor: useColorModeValue("teal.400", "teal.500"),
                                    boxShadow: "0 8px 24px rgba(20, 184, 166, 0.15)",
                                    transform: "translateY(-2px)",
                                }}
                            >
                                <Card.Body p={8}>
                                    <VStack gap={6} align="stretch">
                                        {/* Header */}
                                        <VStack gap={2} align="start">
                                            <HStack justify="space-between" w="full">
                                                <Text fontSize="lg" fontWeight="bold">
                                                    {logo.name}
                                                </Text>
                                                <Text fontSize="sm" color={mutedText}>
                                                    {logo.mood}
                                                </Text>
                                            </HStack>
                                            <Text fontSize="sm" color={mutedText} lineHeight="1.6">
                                                {logo.description}
                                            </Text>
                                        </VStack>

                                        {/* Keywords */}
                                        <HStack gap={2} wrap="wrap">
                                            {logo.keywords.map((keyword, i) => (
                                                <Badge
                                                    key={i}
                                                    size="sm"
                                                    colorPalette="teal"
                                                    variant="subtle"
                                                    borderRadius="md"
                                                >
                                                    {keyword}
                                                </Badge>
                                            ))}
                                        </HStack>

                                        {/* Logo Previews */}
                                        <VStack gap={5} align="stretch">
                                            {/* Full Logo - Large */}
                                            <Box
                                                p={6}
                                                bg={useColorModeValue("gray.50", "gray.900")}
                                                borderRadius="xl"
                                                display="flex"
                                                justifyContent="center"
                                            >
                                                <logo.component size="xl" variant="default" />
                                            </Box>

                                            {/* Sizes */}
                                            <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                                                <Box
                                                    p={4}
                                                    bg={useColorModeValue("gray.50", "gray.900")}
                                                    borderRadius="lg"
                                                    display="flex"
                                                    flexDirection="column"
                                                    alignItems="center"
                                                    gap={2}
                                                >
                                                    <logo.component size="lg" variant="default" />
                                                    <Text fontSize="2xs" color={mutedText}>Large</Text>
                                                </Box>

                                                <Box
                                                    p={4}
                                                    bg={useColorModeValue("gray.50", "gray.900")}
                                                    borderRadius="lg"
                                                    display="flex"
                                                    flexDirection="column"
                                                    alignItems="center"
                                                    gap={2}
                                                >
                                                    <logo.component size="md" variant="default" />
                                                    <Text fontSize="2xs" color={mutedText}>Medium</Text>
                                                </Box>

                                                <Box
                                                    p={4}
                                                    bg={useColorModeValue("gray.50", "gray.900")}
                                                    borderRadius="lg"
                                                    display="flex"
                                                    flexDirection="column"
                                                    alignItems="center"
                                                    gap={2}
                                                >
                                                    <logo.component size="sm" variant="default" />
                                                    <Text fontSize="2xs" color={mutedText}>Small</Text>
                                                </Box>
                                            </Grid>

                                            {/* Icon Only */}
                                            <Box
                                                p={4}
                                                bg={useColorModeValue("gray.50", "gray.900")}
                                                borderRadius="lg"
                                                display="flex"
                                                alignItems="center"
                                                gap={3}
                                            >
                                                <logo.component size="md" variant="icon" />
                                                <VStack gap={0} align="start">
                                                    <Text fontSize="xs" fontWeight="bold">Icon Version</Text>
                                                    <Text fontSize="2xs" color={mutedText}>
                                                        For favicons & app icons
                                                    </Text>
                                                </VStack>
                                            </Box>
                                        </VStack>

                                        {/* Usage Code */}
                                        <Box
                                            p={3}
                                            bg={useColorModeValue("gray.900", "gray.800")}
                                            borderRadius="lg"
                                            fontFamily="mono"
                                        >
                                            <Text fontSize="2xs" color="green.400">
                                                {`<${logo.component.name} size="lg" />`}
                                            </Text>
                                        </Box>
                                    </VStack>
                                </Card.Body>
                            </Card.Root>
                        ))}
                    </Grid>

                    {/* Comparison Section */}
                    <Card.Root bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="2xl">
                        <Card.Body p={8}>
                            <VStack gap={6} align="stretch">
                                <Heading size="xl" fontWeight="bold">
                                    Side-by-Side Comparison
                                </Heading>

                                <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                                    <VStack gap={3}>
                                        <NeuralLogo size="lg" />
                                        <Text fontSize="xs" color={mutedText} textAlign="center">Neural Network</Text>
                                    </VStack>

                                    <VStack gap={3}>
                                        <GeometricLogo size="lg" />
                                        <Text fontSize="xs" color={mutedText} textAlign="center">Geometric</Text>
                                    </VStack>

                                    <VStack gap={3}>
                                        <RocketLogo size="lg" />
                                        <Text fontSize="xs" color={mutedText} textAlign="center">Rocket</Text>
                                    </VStack>

                                    <VStack gap={3}>
                                        <LightbulbLogo size="lg" />
                                        <Text fontSize="xs" color={mutedText} textAlign="center">Lightbulb</Text>
                                    </VStack>

                                    <VStack gap={3}>
                                        <TargetLogo size="lg" />
                                        <Text fontSize="xs" color={mutedText} textAlign="center">Target</Text>
                                    </VStack>

                                    <VStack gap={3}>
                                        <TrendLogo size="lg" />
                                        <Text fontSize="xs" color={mutedText} textAlign="center">Trend</Text>
                                    </VStack>
                                </Grid>
                            </VStack>
                        </Card.Body>
                    </Card.Root>

                    {/* Recommendations */}
                    <Card.Root
                        bg={useColorModeValue("blue.50", "rgba(59, 130, 246, 0.1)")}
                        borderWidth="2px"
                        borderColor={useColorModeValue("blue.200", "blue.800")}
                        borderRadius="2xl"
                    >
                        <Card.Body p={8}>
                            <VStack gap={4} align="stretch">
                                <Heading size="lg">💡 Which Logo Should You Choose?</Heading>

                                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                                    <Box>
                                        <Text fontSize="sm" fontWeight="bold" mb={2}>🧠 Choose Neural Network if:</Text>
                                        <VStack gap={1} align="start">
                                            <Text fontSize="xs" color={mutedText}>• You want to emphasize AI technology</Text>
                                            <Text fontSize="xs" color={mutedText}>• Your audience is tech-savvy</Text>
                                            <Text fontSize="xs" color={mutedText}>• You want a modern, futuristic feel</Text>
                                        </VStack>
                                    </Box>

                                    <Box>
                                        <Text fontSize="sm" fontWeight="bold" mb={2}>💼 Choose Geometric if:</Text>
                                        <VStack gap={1} align="start">
                                            <Text fontSize="xs" color={mutedText}>• You want a professional, corporate look</Text>
                                            <Text fontSize="xs" color={mutedText}>• You prefer minimal, clean design</Text>
                                            <Text fontSize="xs" color={mutedText}>• You're targeting enterprise/B2B</Text>
                                        </VStack>
                                    </Box>

                                    <Box>
                                        <Text fontSize="sm" fontWeight="bold" mb={2}>🚀 Choose Rocket if:</Text>
                                        <VStack gap={1} align="start">
                                            <Text fontSize="xs" color={mutedText}>• You want to convey speed and growth</Text>
                                            <Text fontSize="xs" color={mutedText}>• Your brand is energetic and ambitious</Text>
                                            <Text fontSize="xs" color={mutedText}>• You're targeting motivated learners</Text>
                                        </VStack>
                                    </Box>

                                    <Box>
                                        <Text fontSize="sm" fontWeight="bold" mb={2}>💡 Choose Lightbulb if:</Text>
                                        <VStack gap={1} align="start">
                                            <Text fontSize="xs" color={mutedText}>• You want to emphasize innovation</Text>
                                            <Text fontSize="xs" color={mutedText}>• Your brand is creative and inspiring</Text>
                                            <Text fontSize="xs" color={mutedText}>• You focus on discovery and ideas</Text>
                                        </VStack>
                                    </Box>

                                    <Box>
                                        <Text fontSize="sm" fontWeight="bold" mb={2}>🎯 Choose Target if:</Text>
                                        <VStack gap={1} align="start">
                                            <Text fontSize="xs" color={mutedText}>• You emphasize goal achievement</Text>
                                            <Text fontSize="xs" color={mutedText}>• Your brand is focused and precise</Text>
                                            <Text fontSize="xs" color={mutedText}>• You want a professional, serious tone</Text>
                                        </VStack>
                                    </Box>

                                    <Box>
                                        <Text fontSize="sm" fontWeight="bold" mb={2}>📈 Choose Trend if:</Text>
                                        <VStack gap={1} align="start">
                                            <Text fontSize="xs" color={mutedText}>• You focus on progress and improvement</Text>
                                            <Text fontSize="xs" color={mutedText}>• Your brand is data-driven</Text>
                                            <Text fontSize="xs" color={mutedText}>• You want to show measurable results</Text>
                                        </VStack>
                                    </Box>
                                </Grid>
                            </VStack>
                        </Card.Body>
                    </Card.Root>
                </VStack>
            </Container>
        </Box>
    );
}