import { Box, Card, Text, VStack, HStack, Button, Icon } from "@chakra-ui/react";
import { CheckCircle, Calendar, Info, RotateCcw, Sparkles } from "lucide-react";
import { useColorModeValue } from "../components/ui/color-mode";
import { motion } from "framer-motion";

const MotionBox = motion(Box);

type CancelSubscriptionResponse = {
  status: boolean;
  message: string;
  subscription_id: string;
  cancel_at: number;
  current_period_end: boolean;
};

export default function CancellationConfirmation({
  cancellationResponse,
  onReactivate,
}: {
  cancellationResponse: CancelSubscriptionResponse;
  onReactivate?: () => void;
}) {
  const cardBg = useColorModeValue("white", "gray.950");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const infoBg = useColorModeValue("orange.50", "rgba(251, 146, 60, 0.1)");
  const infoBorder = useColorModeValue("orange.200", "orange.800");
  const infoText = useColorModeValue("orange.900", "orange.200");
  const highlightBg = useColorModeValue("teal.50", "rgba(20, 184, 166, 0.1)");
  const highlightBorder = useColorModeValue("teal.200", "teal.800");
  const accentColor = useColorModeValue("teal.600", "teal.400");

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const daysRemaining = Math.ceil(
    (cancellationResponse.cancel_at * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 } as any}
      maxW="600px"
      mx="auto"
    >
      <Card.Root
        bg={cardBg}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="xl"
        boxShadow="0 4px 12px rgba(0, 0, 0, 0.08)"
      >
        <Card.Body p={6}>
          <VStack gap={5} align="stretch">
            {/* Header with Icon */}
            <HStack gap={3}>
              <Box
                p={2.5}
                bg={infoBg}
                borderRadius="lg"
                borderWidth="1px"
                borderColor={infoBorder}
              >
                <Icon fontSize="xl" color={infoText}>
                  <Info />
                </Icon>
              </Box>
              <VStack gap={0.5} align="start" flex={1}>
                <Text fontSize="lg" fontWeight="bold" lineHeight="1.2">
                  Subscription Cancelled
                </Text>
                <Text fontSize="sm" color={mutedText}>
                  You'll keep premium access until your period ends
                </Text>
              </VStack>
            </HStack>

            {/* Access Details Card */}
            <Card.Root
              bg={highlightBg}
              borderWidth="2px"
              borderColor={highlightBorder}
              borderRadius="lg"
            >
              <Card.Body p={4}>
                <VStack gap={3} align="stretch">
                  {/* Premium Access Active */}
                  <HStack gap={3}>
                    <Box
                      p={2}
                      bg={useColorModeValue("teal.100", "rgba(20, 184, 166, 0.2)")}
                      borderRadius="lg"
                    >
                      <Icon fontSize="lg" color={accentColor}>
                        <CheckCircle />
                      </Icon>
                    </Box>
                    <VStack gap={0.5} align="start" flex={1}>
                      <Text fontSize="sm" fontWeight="bold">
                        Premium Access Active
                      </Text>
                      <Text fontSize="xs" color={mutedText}>
                        {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining
                      </Text>
                    </VStack>
                  </HStack>

                  <Box h="1px" bg={borderColor} />

                  {/* Access Until Date */}
                  <HStack gap={3}>
                    <Box
                      p={2}
                      bg={useColorModeValue("teal.100", "rgba(20, 184, 166, 0.2)")}
                      borderRadius="lg"
                    >
                      <Icon fontSize="lg" color={accentColor}>
                        <Calendar />
                      </Icon>
                    </Box>
                    <VStack gap={0.5} align="start" flex={1}>
                      <Text fontSize="sm" fontWeight="bold">
                        Access Until
                      </Text>
                      <Text fontSize="xs" color={mutedText}>
                        {formatDate(cancellationResponse.cancel_at)}
                      </Text>
                    </VStack>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Changed Your Mind Notice */}
            <Card.Root
              bg={useColorModeValue("blue.50", "rgba(59, 130, 246, 0.1)")}
              borderWidth="1px"
              borderColor={useColorModeValue("blue.200", "blue.800")}
              borderRadius="lg"
            >
              <Card.Body p={4}>
                <VStack gap={3} align="stretch">
                  <HStack gap={2}>
                    <Icon fontSize="md" color={useColorModeValue("blue.700", "blue.300")}>
                      <RotateCcw />
                    </Icon>
                    <Text fontSize="sm" fontWeight="bold" color={useColorModeValue("blue.900", "blue.200")}>
                      Changed your mind?
                    </Text>
                  </HStack>
                  <Text fontSize="xs" color={useColorModeValue("blue.800", "blue.300")} lineHeight="1.5">
                    You can reactivate your subscription anytime before{" "}
                    <Text as="span" fontWeight="bold">
                      {formatDate(cancellationResponse.cancel_at)}
                    </Text>
                    . All your data and settings will be preserved.
                  </Text>

                  {onReactivate && (
                    <Button
                      onClick={onReactivate}
                      colorPalette="blue"
                      size="sm"
                      variant="outline"
                      w="full"
                      borderRadius="lg"
                    >
                      <Icon fontSize="sm">
                        <RotateCcw />
                      </Icon>
                      Reactivate Subscription
                    </Button>
                  )}
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* What Happens Next */}
            <Card.Root
              bg={useColorModeValue("gray.50", "gray.900")}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
            >
              <Card.Body p={4}>
                <VStack gap={2.5} align="stretch">
                  <HStack gap={2}>
                    <Icon fontSize="sm" color={accentColor}>
                      <Sparkles />
                    </Icon>
                    <Text fontSize="xs" fontWeight="bold" color={mutedText} textTransform="uppercase">
                      What Happens Next
                    </Text>
                  </HStack>
                  <VStack gap={2} align="stretch">
                    <HStack gap={2}>
                      <Box w={1.5} h={1.5} bg={accentColor} borderRadius="full" />
                      <Text fontSize="xs" color={mutedText}>
                        You'll keep full access until {formatDate(cancellationResponse.cancel_at)}
                      </Text>
                    </HStack>
                    <HStack gap={2}>
                      <Box w={1.5} h={1.5} bg={accentColor} borderRadius="full" />
                      <Text fontSize="xs" color={mutedText}>
                        After that, you'll be moved to the free plan
                      </Text>
                    </HStack>
                    <HStack gap={2}>
                      <Box w={1.5} h={1.5} bg={accentColor} borderRadius="full" />
                      <Text fontSize="xs" color={mutedText}>
                        No further charges will be made
                      </Text>
                    </HStack>
                  </VStack>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Subscription ID */}
            <Box
              p={2.5}
              bg={useColorModeValue("gray.50", "gray.900")}
              borderRadius="md"
              borderWidth="1px"
              borderColor={borderColor}
            >
              <HStack justify="space-between">
                <Text fontSize="2xs" color={mutedText} fontWeight="medium" textTransform="uppercase">
                  Subscription ID
                </Text>
                <Text fontSize="2xs" fontFamily="mono" color={mutedText}>
                  {cancellationResponse.subscription_id}
                </Text>
              </HStack>
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>
    </MotionBox>
  );
}