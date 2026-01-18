import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Box,
  Button,
  VStack,
  Text,
  HStack,
  Spinner,
  Icon,
  Card,
} from "@chakra-ui/react";
import { CheckCircle, Lock, AlertCircle, Sparkles } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useColorModeValue } from "../components/ui/color-mode";

interface CheckoutFormProps {
  setPaymentInfo: (p: { [key: string]: any }) => void;
  onPaymentSuccess?: () => void;
  amount?: number;
  interval?: string;
}

export function CheckoutForm({
  setPaymentInfo,
  onPaymentSuccess,
  amount = 29,
  interval = "month",
}: CheckoutFormProps): React.ReactElement {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pollingStatus, setPollingStatus] = useState<string>("");
  const { user, refreshUser } = useUser();

  const cardBg = useColorModeValue("white", "gray.950");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const mutedText = useColorModeValue("gray.600", "gray.400");
  const accentColor = useColorModeValue("teal.600", "teal.400");
  const errorBg = useColorModeValue("red.50", "rgba(239, 68, 68, 0.1)");
  const errorBorder = useColorModeValue("red.200", "red.800");
  const errorText = useColorModeValue("red.800", "red.300");
  const infoBg = useColorModeValue("blue.50", "rgba(59, 130, 246, 0.1)");
  const infoBorder = useColorModeValue("blue.200", "blue.800");
  const infoText = useColorModeValue("blue.800", "blue.300");
  const successBg = useColorModeValue("green.50", "rgba(16, 185, 129, 0.1)");
  const successBorder = useColorModeValue("green.200", "green.800");

  useEffect(() => {
    if (!stripe) return;

    const clientSecret = new URLSearchParams(window.location.search).get(
      "payment_intent_client_secret",
    );

    if (!clientSecret) return;

    setLoading(true);
    setPollingStatus("Verifying payment...");

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      if (!paymentIntent) {
        setError("Payment verification failed");
        setLoading(false);
        return;
      }

      switch (paymentIntent.status) {
        case "succeeded":
          setPaymentInfo({
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            paidAt: paymentIntent.created,
          });
          setSuccess(true);
          waitForMembershipUpdate().then((activated) => {
            if (activated) {
              onPaymentSuccess?.();
            }
            setLoading(false);
            window.history.replaceState({}, document.title, window.location.pathname);
          });
          break;
        case "processing":
          setPollingStatus("Your payment is processing...");
          setLoading(false);
          break;
        case "requires_payment_method":
          setError("Payment failed. Please try another card.");
          setLoading(false);
          window.history.replaceState({}, document.title, window.location.pathname);
          break;
        default:
          setError("Something went wrong with your payment.");
          setLoading(false);
          break;
      }
    });
  }, [stripe]);

  const waitForMembershipUpdate = async (maxAttempts = 10, interval = 1500) => {
    for (let i = 0; i < maxAttempts; i++) {
      setPollingStatus(`Activating membership... (${i + 1}/${maxAttempts})`);
      const freshUser = await refreshUser();
      if (freshUser?.membership_status === "ACTIVE") {
        setPollingStatus("Membership activated!");
        return true;
      }
      if (i < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    }
    setPollingStatus("");
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Payment system not ready. Please refresh the page.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Submit the form to validate fields
      const { error: submitError } = await elements.submit();

      if (submitError) {
        setError(submitError.message || "Payment validation failed");
        setLoading(false);
        return;
      }

      const returnUrl = `${window.location.origin}${window.location.pathname}?payment_complete=true`;

      const intentResult = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
        },
        redirect: "if_required",
      });

      if (intentResult.error) {
        setError(intentResult.error.message || "Payment failed");
        setLoading(false);
        return;
      }

      setPaymentInfo({
        paymentIntentId: intentResult.paymentIntent?.id,
        amount: intentResult.paymentIntent?.amount,
        currency: intentResult.paymentIntent?.currency,
        status: intentResult.paymentIntent?.status,
        paidAt: intentResult.paymentIntent?.created,
      });

      setSuccess(true);
      const membershipActivated = await waitForMembershipUpdate();
      if (membershipActivated) {
        onPaymentSuccess?.();
      }
      setLoading(false);
    } catch (err) {
      console.error("Payment error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
      setPollingStatus("");
    }
  };

  if (success && user?.membership_status === "ACTIVE") {
    return (
      <Box w="full">
        <Card.Root
          bg={successBg}
          borderWidth="2px"
          borderColor={successBorder}
          borderRadius="xl"
          boxShadow="0 8px 24px rgba(16, 185, 129, 0.2)"
        >
          <Card.Body p={8}>
            <VStack gap={6}>
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
                  <CheckCircle size={48} color="white" />
                </Box>
                <Box position="absolute" top="-2" right="-2" p={1.5} bg="yellow.400" borderRadius="full">
                  <Sparkles size={16} color="white" />
                </Box>
              </Box>
              <VStack gap={3} textAlign="center">
                <Text fontSize="2xl" fontWeight="900" lineHeight="1.2">
                  Welcome to Premium! 🎉
                </Text>
                <Text color={mutedText} fontSize="md" maxW="400px">
                  Your subscription is now active!
                </Text>
              </VStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Box>
    );
  }

  return (
    <Box w="full">
      <form onSubmit={handleSubmit}>
        <VStack gap={5} align="stretch">
          <VStack gap={2} textAlign="center">
            <Text fontSize="lg" fontWeight="bold">
              Payment Details
            </Text>
            <Text fontSize="sm" color={mutedText}>
              Enter your card information securely
            </Text>
          </VStack>

          {/* Payment Element - This is where you type card details */}
          <Box
            p={5}
            borderWidth="2px"
            borderColor={borderColor}
            borderRadius="xl"
            bg={cardBg}
            _hover={{ borderColor: accentColor }}
            transition="all 0.2s"
          >
            <PaymentElement
              options={{
                layout: "tabs",
              }}
            />
          </Box>

          {error && (
            <Card.Root bg={errorBg} borderWidth="2px" borderColor={errorBorder} borderRadius="lg">
              <Card.Body p={4}>
                <HStack gap={3} align="start">
                  <Icon fontSize="lg" color={errorText} mt={0.5}>
                    <AlertCircle />
                  </Icon>
                  <VStack gap={1} align="start" flex={1}>
                    <Text fontSize="sm" fontWeight="bold" color={errorText}>
                      Payment Failed
                    </Text>
                    <Text fontSize="xs" color={errorText} lineHeight="1.5">
                      {error}
                    </Text>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>
          )}

          {pollingStatus && (
            <Card.Root bg={infoBg} borderWidth="2px" borderColor={infoBorder} borderRadius="lg">
              <Card.Body p={4}>
                <HStack gap={3}>
                  <Spinner size="sm" color={infoText} />
                  <VStack gap={0.5} align="start" flex={1}>
                    <Text fontSize="sm" fontWeight="bold" color={infoText}>
                      {pollingStatus}
                    </Text>
                    <Text fontSize="xs" color={infoText}>
                      This may take a few moments...
                    </Text>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>
          )}

          <Button
            type="submit"
            colorPalette="teal"
            size="lg"
            w="full"
            height="56px"
            borderRadius="xl"
            disabled={!stripe || !elements || loading}
            fontSize="md"
            fontWeight="700"
            bgGradient="linear(to-r, teal.500, cyan.500)"
            boxShadow="0 4px 14px rgba(20, 184, 166, 0.25)"
            _hover={{
              bgGradient: "linear(to-r, teal.600, cyan.600)",
              transform: "translateY(-2px)",
              boxShadow: "0 8px 24px rgba(20, 184, 166, 0.35)",
            }}
            _active={{
              transform: "translateY(0px)",
              boxShadow: "0 4px 14px rgba(20, 184, 166, 0.25)",
            }}
            _disabled={{
              opacity: 0.6,
              cursor: "not-allowed",
              transform: "none",
              boxShadow: "none",
            }}
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            {loading ? (
              <HStack gap={2}>
                <Spinner size="sm" />
                <Text>Processing...</Text>
              </HStack>
            ) : (
              <HStack gap={2}>
                <Lock size={18} />
                <Text>Pay ${amount}/{interval}</Text>
              </HStack>
            )}
          </Button>

          <HStack gap={2} justify="center" p={3} bg={useColorModeValue("gray.50", "gray.900")} borderRadius="lg" w="full">
            <Icon fontSize="md" color="green.500">
              <Lock />
            </Icon>
            <VStack gap={0} align="start" flex={1}>
              <Text fontSize="xs" fontWeight="bold">
                Secure Payment
              </Text>
              <Text fontSize="2xs" color={mutedText}>
                Encrypted and PCI compliant
              </Text>
            </VStack>
          </HStack>

          <VStack gap={1.5} w="full">
            <Text fontSize="2xs" color={mutedText} textAlign="center">
              By subscribing, you agree to automatic billing.
            </Text>
            <Text fontSize="2xs" color={mutedText} textAlign="center">
              Cancel anytime from your account settings.
            </Text>
          </VStack>
        </VStack>
      </form>
    </Box>
  );
}