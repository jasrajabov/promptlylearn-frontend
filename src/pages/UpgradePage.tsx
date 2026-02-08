// /src/pages/UpgradePage.tsx
// Route this to /upgrade

import React, { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Icon,
  Badge,
  Grid,
  Spinner,
  Button,
} from "@chakra-ui/react";
import { useColorModeValue } from "../components/ui/color-mode";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Check,
  Sparkles,
  AlertCircle,
  Calendar,
  CalendarRange,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { CheckoutForm } from "../components/CheckoutForm";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

const MotionCard = motion(Card.Root);
const monthtlyPriceId = import.meta.env.VITE_STRIPE_MONTHLY_PRICE_ID
const yearlyPriceId = import.meta.env.VITE_STRIPE_YEARLY_PRICE_ID

const PRODUCTS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "forever",
    priceId: null,
    icon: Sparkles,
    badge: "CURRENT",
    isCurrent: true,
    features: [
      "5 courses/month",
      "Basic AI features",
      "Community support",
    ],
  },
  {
    id: "monthly",
    name: "Monthly",
    price: 9,
    interval: "month",
    priceId: monthtlyPriceId,
    icon: Calendar,
    badge: null,
    isCurrent: false,
    features: [
      "Unlimited courses",
      "Advanced AI",
      "Deeper course contents",
      "Priority support",
      "Early access to all future features",
      "No ads",
    ],
  },
  {
    id: "yearly",
    name: "Yearly",
    price: 90,
    interval: "year",
    priceId: yearlyPriceId,
    icon: CalendarRange,
    badge: "SAVE 17%",
    savings: "$18",
    isCurrent: false,
    features: [
      "Everything in Monthly",
      "2 months free",
      "Best value",
    ],
  },
];

export default function UpgradePage() {
  const [selectedProduct, setSelectedProduct] = useState<typeof PRODUCTS[0] | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { user } = useUser();
  const navigate = useNavigate();

  const cardBg = useColorModeValue("white", "gray.950");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const accentColor = useColorModeValue("teal.600", "teal.400");
  const highlightBg = useColorModeValue("teal.50", "rgba(20, 184, 166, 0.1)");
  const gradientText = useColorModeValue(
    "linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #06B6D4 100%)",
    "linear-gradient(135deg, #14B8A6 0%, #2DD4BF 50%, #5EEAD4 100%)",
  );

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleProductSelect = async (product: typeof PRODUCTS[0]) => {
    if (product.isCurrent || !product.priceId) return;

    setSelectedProduct(product);
    setLoading(true);
    setError(null);
    setClientSecret("");

    try {
      const response = await fetch(`${BACKEND_URL}/payment/create-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          price_id: product.priceId,
        }),
      });

      if (!response.ok) throw new Error("Failed to create subscription");

      const data = await response.json();
      setClientSecret(data.client_secret);
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to initialize payment. Please try again.");
      setSelectedProduct(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" py={8}>
      <Container maxW="1200px" px={{ base: 4, md: 6 }}>
        {/* Back Button */}
        <Button
          onClick={() => navigate(-1)}
          variant="solid"
          size="sm"
          mb={6}
        >
          <ArrowLeft size={16} />
          Back
        </Button>

        {/* Header */}
        <VStack gap={3} mb={8} textAlign="center">
          <HStack gap={2} justify="center">
            <Icon fontSize="xl" color={accentColor}>
              <Sparkles />
            </Icon>
            <Heading
              fontSize={{ base: "2xl", md: "4xl" }}
              fontWeight="900"
              bgGradient={gradientText}
              bgClip="text"
              lineHeight="1.2"
            >
              Upgrade to Premium
            </Heading>
          </HStack>
          <Text fontSize="sm" color={mutedText} maxW="500px">
            {selectedProduct ? "Complete your subscription" : "Choose your plan"}
          </Text>
        </VStack>

        {!selectedProduct ? (
          /* Plan Selection */
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} maxW="1000px" mx="auto">
            {PRODUCTS.map((product) => (
              <MotionCard
                key={product.id}
                bg={product.isCurrent ? useColorModeValue("gray.50", "gray.900") : cardBg}
                borderWidth="2px"
                borderColor={product.isCurrent ? borderColor : borderColor}
                borderRadius="xl"
                overflow="hidden"
                opacity={product.isCurrent ? 0.7 : 1}
                whileHover={!product.isCurrent ? { y: -4, boxShadow: "0 8px 24px rgba(20, 184, 166, 0.15)" } : {}}
                transition={{ duration: 0.2 } as any}
                position="relative"
              >
                {product.badge && (
                  <Badge
                    position="absolute"
                    top={3}
                    right={3}
                    colorPalette={product.isCurrent ? "gray" : "teal"}
                    variant="solid"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                    fontSize="2xs"
                    fontWeight="bold"
                  >
                    {product.badge}
                  </Badge>
                )}

                <Card.Body p={5}>
                  <VStack gap={4} align="stretch" h="full">
                    <Box
                      p={2}
                      bg={product.isCurrent ? useColorModeValue("gray.100", "gray.800") : highlightBg}
                      borderRadius="lg"
                      w="fit-content"
                    >
                      <Icon fontSize="xl" color={product.isCurrent ? mutedText : accentColor}>
                        <product.icon />
                      </Icon>
                    </Box>

                    <VStack gap={1} align="start">
                      <Heading size="md" fontWeight="bold">
                        {product.name}
                      </Heading>
                      <HStack align="baseline" gap={1}>
                        <Heading size="2xl" fontWeight="900">
                          ${product.price}
                        </Heading>
                        <Text fontSize="sm" color={mutedText}>
                          /{product.interval}
                        </Text>
                      </HStack>
                      {product.savings && (
                        <Text fontSize="xs" fontWeight="bold" color="green.500">
                          Save {product.savings}
                        </Text>
                      )}
                    </VStack>

                    <Box h="1px" bg={borderColor} />

                    <VStack gap={2} align="stretch" flex="1">
                      {product.features.map((feature, i) => (
                        <HStack key={i} gap={2}>
                          <Box
                            p={0.5}
                            bg={product.isCurrent ? mutedText : accentColor}
                            borderRadius="full"
                          >
                            <Check size={10} color="white" />
                          </Box>
                          <Text fontSize="xs" fontWeight="medium">
                            {feature}
                          </Text>
                        </HStack>
                      ))}
                    </VStack>

                    {!product.isCurrent ? (
                      <Button
                        onClick={() => handleProductSelect(product)}
                        colorPalette="teal"
                        size="md"
                        w="full"
                        borderRadius="lg"
                        bgGradient={product.id === "yearly" ? "linear(to-r, teal.500, cyan.500)" : undefined}
                        mt="auto"
                      >
                        Get Started
                      </Button>
                    ) : (
                      <Box
                        w="full"
                        py={2.5}
                        borderRadius="lg"
                        borderWidth="2px"
                        borderColor={borderColor}
                        textAlign="center"
                        bg={useColorModeValue("gray.100", "gray.800")}
                        mt="auto"
                      >
                        <Text fontSize="xs" fontWeight="bold" color={mutedText}>
                          Current Plan
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Card.Body>
              </MotionCard>
            ))}
          </Grid>
        ) : showConfirmation ? (
          /* Confirmation Screen */
          <Box maxW="600px" mx="auto">
            <Card.Root
              bg={useColorModeValue("green.50", "rgba(16, 185, 129, 0.1)")}
              borderWidth="2px"
              borderColor={useColorModeValue("green.200", "green.800")}
              borderRadius="xl"
              boxShadow="0 8px 24px rgba(16, 185, 129, 0.2)"
            >
              <Card.Body p={8}>
                <VStack gap={6}>
                  {/* Success Icon */}
                  <Box position="relative">
                    <Box
                      w={24}
                      h={24}
                      bg="green.500"
                      rounded="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      boxShadow="0 8px 32px rgba(16, 185, 129, 0.4)"
                    >
                      <Check size={48} color="white" strokeWidth={3} />
                    </Box>
                    <Box
                      position="absolute"
                      top="-2"
                      right="-2"
                      p={1.5}
                      bg="yellow.400"
                      borderRadius="full"
                    >
                      <Sparkles size={16} color="white" />
                    </Box>
                  </Box>

                  {/* Success Message */}
                  <VStack gap={3} textAlign="center">
                    <Heading size="xl" fontWeight="900" lineHeight="1.2">
                      Welcome to Premium! 🎉
                    </Heading>
                    <Text color={mutedText} fontSize="md" maxW="400px">
                      Your subscription is now active. You now have unlimited access to all premium features!
                    </Text>
                  </VStack>

                  {/* Subscription Details */}
                  <Card.Root
                    bg={cardBg}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                    w="full"
                  >
                    <Card.Body p={4}>
                      <VStack gap={3} align="stretch">
                        <HStack justify="space-between">
                          <VStack gap={0.5} align="start">
                            <Text fontSize="xs" color={mutedText} fontWeight="medium">
                              Plan
                            </Text>
                            <Text fontSize="sm" fontWeight="bold" textTransform="capitalize">
                              {selectedProduct.name}
                            </Text>
                          </VStack>
                          <VStack gap={0.5} align="start">
                            <Text fontSize="xs" color={mutedText} fontWeight="medium">
                              Price
                            </Text>
                            <Text fontSize="sm" fontWeight="bold">
                              ${selectedProduct.price}/{selectedProduct.interval}
                            </Text>
                          </VStack>
                        </HStack>

                        <Box h="1px" bg={borderColor} />

                        <HStack justify="space-between">
                          <VStack gap={0.5} align="start">
                            <Text fontSize="xs" color={mutedText} fontWeight="medium">
                              Status
                            </Text>
                            <HStack gap={1}>
                              <Box w={2} h={2} bg="green.500" borderRadius="full" />
                              <Text fontSize="sm" fontWeight="bold" color="green.600">
                                Active
                              </Text>
                            </HStack>
                          </VStack>
                          <VStack gap={0.5} align="start">
                            <Text fontSize="xs" color={mutedText} fontWeight="medium">
                              Billing
                            </Text>
                            <Text fontSize="sm" fontWeight="bold">
                              {selectedProduct.interval === "month" ? "Monthly" : "Yearly"}
                            </Text>
                          </VStack>
                        </HStack>
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  {/* What's Next */}
                  <Card.Root
                    bg={highlightBg}
                    borderWidth="1px"
                    borderColor={accentColor}
                    borderRadius="lg"
                    w="full"
                  >
                    <Card.Body p={4}>
                      <VStack gap={2.5} align="stretch">
                        <Text fontSize="xs" fontWeight="bold" color={accentColor} textTransform="uppercase">
                          What's Next?
                        </Text>
                        <VStack gap={2} align="stretch">
                          <HStack gap={2}>
                            <Check size={14} color={accentColor} />
                            <Text fontSize="xs">Start creating unlimited courses</Text>
                          </HStack>
                          <HStack gap={2}>
                            <Check size={14} color={accentColor} />
                            <Text fontSize="xs">Access advanced AI features</Text>
                          </HStack>
                          <HStack gap={2}>
                            <Check size={14} color={accentColor} />
                            <Text fontSize="xs">Get priority support</Text>
                          </HStack>
                        </VStack>
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  {/* Action Buttons */}
                  <VStack gap={2} w="full">
                    <Button
                      onClick={() => navigate("/my-courses")}
                      colorPalette="teal"
                      size="lg"
                      w="full"
                      borderRadius="lg"
                      bgGradient="linear(to-r, teal.500, cyan.500)"
                    >
                      Start Creating Courses
                    </Button>
                    <Button
                      onClick={() => navigate("/user-info")}
                      variant="ghost"
                      size="sm"
                      w="full"
                    >
                      View Account Settings
                    </Button>
                  </VStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          </Box>
        ) : (
          /* Payment View */
          <Grid templateColumns={{ base: "1fr", lg: "5fr 7fr" }} gap={6} maxW="1000px" mx="auto">
            {/* Order Summary */}
            <VStack gap={4} align="stretch">
              <Card.Root
                bg={highlightBg}
                borderWidth="2px"
                borderColor={accentColor}
                borderRadius="xl"
              >
                <Card.Body p={4}>
                  <VStack gap={3} align="stretch">
                    <Text fontSize="xs" fontWeight="bold" color={accentColor} textTransform="uppercase">
                      Selected Plan
                    </Text>
                    <Heading size="md">{selectedProduct.name}</Heading>

                    <Box h="1px" bg={borderColor} />

                    <HStack justify="space-between">
                      <Text fontSize="sm" color={mutedText}>
                        {selectedProduct.interval === "month" ? "Monthly" : "Yearly"}
                      </Text>
                      <Text fontSize="md" fontWeight="bold">
                        ${selectedProduct.price}
                      </Text>
                    </HStack>

                    {selectedProduct.savings && (
                      <HStack justify="space-between" p={2} bg={cardBg} borderRadius="md">
                        <Text fontSize="xs" color="green.600" fontWeight="medium">
                          You save
                        </Text>
                        <Text fontSize="xs" fontWeight="bold" color="green.600">
                          {selectedProduct.savings}
                        </Text>
                      </HStack>
                    )}

                    <Box h="1px" bg={borderColor} />

                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="bold">
                        Total
                      </Text>
                      <Heading size="lg" color={accentColor}>
                        ${selectedProduct.price}
                      </Heading>
                    </HStack>

                    <Button onClick={() => setSelectedProduct(null)} variant="ghost" size="sm">
                      ← Change Plan
                    </Button>
                  </VStack>
                </Card.Body>
              </Card.Root>

              <Card.Root bg={cardBg} borderWidth="1px" borderColor={borderColor} borderRadius="xl">
                <Card.Body p={4}>
                  <VStack gap={2} align="stretch">
                    <Text fontSize="xs" fontWeight="bold" textTransform="uppercase" color={mutedText}>
                      Includes
                    </Text>
                    {selectedProduct.features.map((feature, i) => (
                      <HStack key={i} gap={2}>
                        <Check size={12} color={accentColor} />
                        <Text fontSize="xs">{feature}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Card.Body>
              </Card.Root>
            </VStack>

            {/* Payment Form */}
            <Card.Root
              bg={cardBg}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="xl"
            >
              <Card.Body p={6}>
                {loading ? (
                  <VStack gap={4} py={6}>
                    <Spinner size="lg" color={accentColor} />
                    <Text fontSize="sm" fontWeight="medium">
                      Setting up payment...
                    </Text>
                  </VStack>
                ) : error ? (
                  <VStack gap={4} py={6}>
                    <Icon fontSize="2xl" color="red.500">
                      <AlertCircle />
                    </Icon>
                    <Text fontSize="sm" color="red.500">
                      {error}
                    </Text>
                    <HStack gap={2}>
                      <Button onClick={() => setSelectedProduct(null)} variant="outline" size="sm">
                        Back
                      </Button>
                      <Button onClick={() => handleProductSelect(selectedProduct)} size="sm">
                        Retry
                      </Button>
                    </HStack>
                  </VStack>
                ) : clientSecret ? (
                  <Elements
                    stripe={stripePromise}
                    options={{
                      clientSecret,
                      appearance: {
                        theme: useColorModeValue("stripe", "night") as "stripe" | "night",
                        variables: {
                          colorPrimary: "#0D9488",
                          colorBackground: cardBg,
                          colorText: useColorModeValue("#1a202c", "#e2e8f0"),
                          colorDanger: "#EF4444",
                          borderRadius: "8px",
                        },
                      },
                    }}
                  >
                    <CheckoutForm
                      setPaymentInfo={() => { }}
                      amount={selectedProduct.price}
                      interval={selectedProduct.interval}
                      onPaymentSuccess={() => {
                        setShowConfirmation(true);
                      }}
                    />
                  </Elements>
                ) : null}
              </Card.Body>
            </Card.Root>
          </Grid>
        )}

        {/* Trust Badge */}
        <HStack
          gap={2}
          justify="center"
          p={3}
          bg={useColorModeValue("gray.50", "gray.900")}
          borderRadius="lg"
          maxW="500px"
          mx="auto"
          mt={6}
        >
          <Icon fontSize="md" color="green.500">
            <Shield />
          </Icon>
          <Text fontSize="xs" color={mutedText}>
            Secure payment • Cancel anytime • 7-day money-back guarantee
          </Text>
        </HStack>
      </Container>
    </Box>
  );
}