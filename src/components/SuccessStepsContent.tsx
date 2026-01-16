import { Box, Text, VStack } from "@chakra-ui/react";
import { useEffect } from "react";
import { useUser } from "../contexts/UserContext";

function SuccessStepsContent() {
  const { user, refreshUser } = useUser();
  useEffect(() => {
    refreshUser();
  }, []);
  return (
    <VStack gap={4} align="center" mt={8}>
      <Box
        boxSize="100px"
        bg="green.100"
        borderRadius="full"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize="48px" color="green.500">
          ✓
        </Text>
      </Box>
      <VStack gap={2} align="center">
        <Text fontSize="2xl" fontWeight="bold">
          Subscription Successful!
        </Text>
        <Box maxW="400px" textAlign="center">
          <Text color="gray.600">
            Thank you for subscribing! You can now access all premium features.
          </Text>
        </Box>
      </VStack>
    </VStack>
  );
}

export default SuccessStepsContent;
