import { useState } from "react";
import {
  Button,
  Input,
  VStack,
  Text,
  Box,
  HStack,
  Dialog,
  Field,
} from "@chakra-ui/react";
import { toaster as toast } from "./ui/toaster";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useColorModeValue } from "./ui/color-mode";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleteSuccess: () => void;
  userToken: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function DeleteAccountDialog({
  open,
  onOpenChange,
  onDeleteSuccess,
  userToken,
}: DeleteAccountDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const dangerBg = useColorModeValue("red.50", "red.950");
  const dangerBorder = useColorModeValue("red.200", "red.800");

  const handleDelete = async () => {
    if (!password || confirmText.toUpperCase() !== "DELETE") {
      toast.create({
        title: "Validation Error",
        description: "Please enter your password and type DELETE to confirm",
        type: "error",
        duration: 3000,
      });
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`${BACKEND_URL}/user/me/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          password,
          confirm_text: confirmText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.create({
          title: "Account Deleted",
          description:
            "Your account has been permanently deleted. A confirmation email has been sent.",
          type: "success",
          duration: 5000,
        });
        onOpenChange(false);
        onDeleteSuccess();
      } else {
        toast.create({
          title: "Delete Failed",
          description: data.detail || "Failed to delete account",
          type: "error",
          duration: 4000,
        });
      }
    } catch (error) {
      toast.create({
        title: "Error",
        description: "An error occurred while deleting your account",
        type: "error",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setPassword("");
      setConfirmText("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open && !isDeleting) {
          handleClose();
        }
      }}
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>
              <HStack gap={2}>
                <AlertTriangle size={20} color="red" />
                <Text>Delete Account</Text>
              </HStack>
            </Dialog.Title>
          </Dialog.Header>

          <Dialog.Body>
            <VStack gap={4} align="stretch">
              <Box
                p={3}
                borderRadius="md"
                bg={dangerBg}
                borderWidth="1px"
                borderColor={dangerBorder}
              >
                <HStack gap={2} mb={2}>
                  <AlertTriangle size={16} color="red" />
                  <Text fontWeight="bold" fontSize="sm" color="red.600">
                    Warning: This action is permanent
                  </Text>
                </HStack>
                <Text fontSize="sm" lineHeight="1.6">
                  Deleting your account will permanently remove:
                </Text>
                <VStack align="start" mt={2} pl={4} gap={1}>
                  <Text fontSize="xs">• All your courses and roadmaps</Text>
                  <Text fontSize="xs">
                    • Your personal information and profile
                  </Text>
                  <Text fontSize="xs">
                    • Your premium membership and subscription (if active)
                  </Text>
                  <Text fontSize="xs">• All learning progress and data</Text>
                </VStack>
                <Box
                  mt={3}
                  p={2}
                  bg="orange.50"
                  _dark={{ bg: "orange.900/20" }}
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="orange.200"
                >
                  <Text fontSize="xs" fontWeight="semibold">
                    ⚠️ Active subscriptions will be cancelled immediately and
                    you will not be charged again.
                  </Text>
                </Box>
              </Box>

              <Field.Root>
                <Field.Label>Your Password</Field.Label>
                <Input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isDeleting}
                />
              </Field.Root>

              <Field.Root>
                <Field.Label>Type DELETE to confirm</Field.Label>
                <Input
                  placeholder="DELETE"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={isDeleting}
                />
              </Field.Root>

              <Text fontSize="xs">
                This action cannot be undone. A confirmation email will be sent
                to your email address.
              </Text>
            </VStack>
          </Dialog.Body>

          <Dialog.Footer>
            <Dialog.ActionTrigger asChild>
              <Button
                onClick={handleClose}
                variant="outline"
                colorScheme="gray"
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </Dialog.ActionTrigger>
            <Button
              colorScheme="red"
              onClick={handleDelete}
              loading={isDeleting}
              disabled={!password || confirmText.toUpperCase() !== "DELETE"}
            >
              <Trash2 size={16} />
              Delete Account
            </Button>
          </Dialog.Footer>

          <Dialog.CloseTrigger />
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
