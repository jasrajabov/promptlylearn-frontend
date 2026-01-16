import { useState } from "react";
import {
  Button,
  Box,
  VStack,
  Spinner,
  Text,
  Dialog,
  Checkbox,
  Textarea,
} from "@chakra-ui/react";
import { useUser } from "../contexts/UserContext";
import CancellationConfirmation from "./CancellationConfirmation";

type CancelSubscriptionResponse = {
  status: boolean;
  message: string;
  subscription_id: string;
  cancel_at: number;
  current_period_end: boolean;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type CancellationHandlerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancellationSuccess: boolean;
  setCancellationSuccess: (success: boolean) => void;
};

const CANCELLATION_REASONS = [
  "Too expensive",
  "Not using it enough",
  "Missing features I need",
  "Found a better alternative",
  "Technical issues",
  "Temporary break",
  "Other",
];

export default function CancellationHandler({
  open,
  onOpenChange,
  cancellationSuccess,
  setCancellationSuccess,
}: CancellationHandlerProps) {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [cancellationResponse, setCancellationResponse] =
    useState<CancelSubscriptionResponse | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [showReasonStep, setShowReasonStep] = useState(false);

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    );
  };

  const handleCancelSubscription = async () => {
    if (!user) return alert("You must be logged in");

    try {
      setLoading(true);

      // Prepare cancellation reasons
      const reasons = [...selectedReasons];
      if (selectedReasons.includes("Other") && otherReason.trim()) {
        reasons.push(`Other: ${otherReason.trim()}`);
      }

      const res = await fetch(`${BACKEND_URL}/payment/cancel-subscription`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          cancellation_reasons: reasons.length > 0 ? reasons : null,
          feedback: otherReason.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to cancel subscription");
      const data = await res.json();
      setCancellationResponse(data);
      // Reset reason step
      setShowReasonStep(false);
    } catch (err) {
      console.error(err);
      alert("Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    if (cancellationResponse) {
      // User is closing after successful cancellation
      setCancellationSuccess(true);
    }
    // Reset all state
    setCancellationResponse(null);
    setShowReasonStep(false);
    setSelectedReasons([]);
    setOtherReason("");
    setLoading(false);
    onOpenChange(false);
  };

  const handleProceedToCancel = () => {
    setShowReasonStep(true);
  };

  const handleBackToConfirm = () => {
    setShowReasonStep(false);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) {
          handleCloseDialog();
        }
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          {loading ? (
            <Dialog.Body>
              <VStack minH="400px" justify="center" align="center" gap={4}>
                <Spinner size="xl" color="teal.500" />
                <Text color="gray.600" _dark={{ color: "gray.400" }}>
                  Processing your request...
                </Text>
              </VStack>
            </Dialog.Body>
          ) : cancellationResponse ? (
            <>
              <Dialog.Header>
                <Dialog.Title>Subscription Cancelled</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack gap={6} align="stretch">
                  <CancellationConfirmation
                    cancellationResponse={cancellationResponse}
                  />
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  variant="solid"
                  colorScheme="teal"
                  onClick={handleCloseDialog}
                >
                  Close
                </Button>
              </Dialog.Footer>
            </>
          ) : showReasonStep ? (
            <>
              <Dialog.Header>
                <Dialog.Title>Help Us Improve</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack align="stretch" gap={4}>
                  <Text
                    fontSize="sm"
                    color="gray.600"
                    _dark={{ color: "gray.400" }}
                  >
                    We'd love to know why you're cancelling. Your feedback helps
                    us improve PromptlyLearn for everyone.
                  </Text>

                  <Box>
                    <Text fontSize="sm" fontWeight="semibold" mb={3}>
                      What's your main reason for cancelling? (Select all that
                      apply)
                    </Text>
                    <VStack align="stretch" gap={2}>
                      {CANCELLATION_REASONS.map((reason) => (
                        <Checkbox.Root
                          key={reason}
                          checked={selectedReasons.includes(reason)}
                          onCheckedChange={() => handleReasonToggle(reason)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label>{reason}</Checkbox.Label>
                        </Checkbox.Root>
                      ))}
                    </VStack>
                  </Box>

                  {selectedReasons.includes("Other") && (
                    <Box>
                      <Text fontSize="sm" fontWeight="semibold" mb={2}>
                        Please tell us more:
                      </Text>
                      <Textarea
                        placeholder="Your feedback is valuable to us..."
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        rows={3}
                      />
                    </Box>
                  )}

                  <Box
                    bg="teal.50"
                    _dark={{ bg: "teal.900/20" }}
                    p={4}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="teal.200"
                  >
                    <Text
                      fontSize="sm"
                      color="teal.900"
                      _dark={{ color: "teal.100" }}
                    >
                      <Text as="span" fontWeight="semibold">
                        Note:
                      </Text>{" "}
                      You'll retain access to premium features until the end of
                      your current billing period.
                    </Text>
                  </Box>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  onClick={handleBackToConfirm}
                  variant="outline"
                  colorScheme="gray"
                >
                  Back
                </Button>
                <Button colorScheme="red" onClick={handleCancelSubscription}>
                  Confirm Cancellation
                </Button>
              </Dialog.Footer>
            </>
          ) : (
            <>
              <Dialog.Header>
                <Dialog.Title>Cancel Subscription?</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <VStack align="stretch" gap={4}>
                  <Text>
                    Are you sure you want to cancel your premium subscription?
                  </Text>
                  <Box
                    bg="yellow.50"
                    _dark={{ bg: "yellow.900/20" }}
                    p={4}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="yellow.200"
                  >
                    <Text
                      fontSize="sm"
                      fontWeight="semibold"
                      mb={2}
                      color="yellow.900"
                      _dark={{ color: "yellow.100" }}
                    >
                      You'll lose access to:
                    </Text>
                    <VStack
                      align="stretch"
                      fontSize="sm"
                      color="yellow.800"
                      _dark={{ color: "yellow.200" }}
                      gap={1}
                    >
                      <Text>• Unlimited AI-generated courses</Text>
                      <Text>• Advanced customization options</Text>
                      <Text>• Priority customer support</Text>
                      <Text>• Early access to new features</Text>
                    </VStack>
                  </Box>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <Button
                    onClick={handleCloseDialog}
                    variant="outline"
                    colorScheme="gray"
                  >
                    Keep Subscription
                  </Button>
                </Dialog.ActionTrigger>
                <Button colorScheme="red" onClick={handleProceedToCancel}>
                  Continue to Cancel
                </Button>
              </Dialog.Footer>
            </>
          )}
          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
