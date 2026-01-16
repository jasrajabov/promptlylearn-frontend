import { Box, Card, Flex, Text, VStack, HStack } from "@chakra-ui/react";
import { FaInfo, FaCheckCircle, FaCalendar } from "react-icons/fa";
import { useUser } from "../contexts/UserContext";
import { useEffect } from "react";

type CancelSubscriptionResponse = {
  status: boolean;
  message: string;
  subscription_id: string;
  cancel_at: number;
  current_period_end: boolean;
};

export default function CancellationConfirmation({
  cancellationResponse,
}: {
  cancellationResponse: CancelSubscriptionResponse;
}) {
  const { refreshUser } = useUser();

  // useEffect(() => {
  //     (async () => {
  //         await refreshUser();
  //     })();
  // }, [refreshUser]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const daysRemaining = Math.ceil(
    (cancellationResponse.cancel_at * 1000 - Date.now()) /
      (1000 * 60 * 60 * 24),
  );
  console.log("cancellationResponse:", cancellationResponse);

  return (
    <Card.Root
      maxW="2xl"
      mx="auto"
      borderWidth="1px"
      borderColor="gray.200"
      _dark={{ borderColor: "gray.700", bg: "gray.800" }}
    >
      <Card.Body p={6}>
        <Flex gap={4} align="flex-start">
          <Box
            flexShrink={0}
            w={10}
            h={10}
            borderRadius="lg"
            bg="teal.50"
            _dark={{ bg: "teal.900/30" }}
            borderWidth="1px"
            borderColor="teal.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <FaInfo color="teal.600" />
          </Box>

          <VStack align="stretch" flex={1} gap={4}>
            <Box>
              <Text
                fontSize="lg"
                fontWeight="semibold"
                color="gray.900"
                _dark={{ color: "gray.100" }}
                mb={1.5}
              >
                Subscription Cancelled
              </Text>
              <Text
                fontSize="sm"
                color="gray.600"
                _dark={{ color: "gray.400" }}
                lineHeight="relaxed"
              >
                Your subscription has been successfully cancelled. You'll
                continue to have access to all premium features until the end of
                your current billing period.
              </Text>
            </Box>

            <Card.Root
              bg="gray.50"
              _dark={{ bg: "gray.900/50" }}
              borderWidth="1px"
              borderColor="gray.200"
            >
              <Card.Body p={4}>
                <VStack gap={3} align="stretch">
                  <HStack gap={3}>
                    <FaCheckCircle color="teal.600" />
                    <Box flex={1}>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color="gray.900"
                        _dark={{ color: "gray.100" }}
                      >
                        Premium Access Active
                      </Text>
                      <Text
                        fontSize="sm"
                        color="gray.600"
                        _dark={{ color: "gray.400" }}
                      >
                        {daysRemaining} {daysRemaining === 1 ? "day" : "days"}{" "}
                        remaining
                      </Text>
                    </Box>
                  </HStack>

                  <HStack gap={3}>
                    <FaCalendar color="teal.600" />
                    <Box flex={1}>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color="gray.900"
                        _dark={{ color: "gray.100" }}
                      >
                        Access Until
                      </Text>
                      <Text
                        fontSize="sm"
                        color="gray.600"
                        _dark={{ color: "gray.400" }}
                      >
                        {formatDate(cancellationResponse.cancel_at)}
                      </Text>
                    </Box>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>

            <Card.Root
              bg="teal.50"
              _dark={{ bg: "teal.900/20" }}
              borderWidth="1px"
              borderColor="teal.200"
            >
              <Card.Body p={4}>
                <Text
                  fontSize="sm"
                  color="teal.900"
                  _dark={{ color: "teal.100" }}
                >
                  <Text as="span" fontWeight="medium">
                    Changed your mind?
                  </Text>{" "}
                  You can reactivate your subscription at any time before{" "}
                  {formatDate(cancellationResponse.cancel_at)}.
                </Text>
              </Card.Body>
            </Card.Root>

            <Text fontSize="xs" color="gray.500">
              Subscription ID: {cancellationResponse.subscription_id}
            </Text>
          </VStack>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
}
