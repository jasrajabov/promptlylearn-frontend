import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Grid,
  Card,
  Button,
  Input,
  Table,
  Badge,
  IconButton,
  Tabs,
  Stack,
  Flex,
  Select,
  Textarea,
  Spinner,
  createListCollection,
  Field,
} from "@chakra-ui/react";
import {
  Users,
  DollarSign,
  BookOpen,
  TrendingUp,
  Ban,
  CheckCircle,
  Trash2,
  Eye,
  X,
  Shield,
  CreditCard,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { useColorModeValue } from "../components/ui/color-mode";
import { toaster } from "../components/ui/toaster";

// Type Definitions
interface DashboardStats {
  total_users: number;
  active_users: number;
  suspended_users: number;
  premium_users: number;
  free_users: number;
  total_courses: number;
  completed_courses: number;
  failed_courses: number;
  generating_courses: number;
  total_roadmaps: number;
  completed_roadmaps: number;
  total_credits_issued: number;
  total_credits_used: number;
  new_users_today: number;
  new_users_this_week: number;
  new_users_this_month: number;
}

type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN";
type UserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";
type MembershipStatus = "ACTIVE" | "INACTIVE" | "CANCELED";

interface UserSummary {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  membership_plan: string;
  membership_status: MembershipStatus;
  credits: number;
  is_email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
}

interface UserDetail {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  is_email_verified: boolean;
  suspended_at: string | null;
  suspended_reason: string | null;
  suspended_by: string | null;
  membership_plan: string;
  membership_status: MembershipStatus;
  membership_active_until: string | null;
  stripe_customer_id: string | null;
  credits: number;
  credits_reset_at: string | null;
  total_credits_used: number;
  last_login_at: string | null;
  login_count: number;
  admin_notes: string | null;
  total_courses: number;
  total_roadmaps: number;
  completed_courses: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// API calls
const api = {
  getDashboardStats: async (admin: any): Promise<DashboardStats> => {
    const response = await fetch(`${VITE_BACKEND_URL}/admin/dashboard`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${admin.token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch stats");
    return await response.json();
  },

  getUsers: async (
    params: Record<string, any>,
  ): Promise<PaginatedResponse<UserSummary>> => {
    const queryParams = new URLSearchParams();
    if (params.search) queryParams.append("search", params.search);
    if (params.status && params.status !== "all") queryParams.append("status", params.status);
    if (params.role && params.role !== "all") queryParams.append("role", params.role);
    if (params.plan && params.plan !== "all") queryParams.append("membership_plan", params.plan);

    const url = `${VITE_BACKEND_URL}/admin/users?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch users");
    return await response.json();
  },

  getUserDetails: async (userId: string, admin: any): Promise<UserDetail> => {
    const response = await fetch(`${VITE_BACKEND_URL}/admin/users/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${admin.token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to fetch user details");
    return await response.json();
  },

  updateCredits: async (
    userId: string,
    credits: number,
    reason: string,
    admin: any,
  ) => {
    const response = await fetch(
      `${VITE_BACKEND_URL}/admin/users/${userId}/credits`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify({ credits, reason }),
      },
    );
    if (!response.ok) throw new Error("Failed to update credits");
    return await response.json();
  },

  suspendUser: async (
    userId: string,
    reason: string,
    duration_days: number | null,
    admin: any,
  ) => {
    const response = await fetch(
      `${VITE_BACKEND_URL}/admin/users/${userId}/suspend`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify({ reason, duration_days }),
      },
    );
    if (!response.ok) throw new Error("Failed to suspend user");
    return await response.json();
  },

  unsuspendUser: async (userId: string, admin: any) => {
    const response = await fetch(
      `${VITE_BACKEND_URL}/admin/users/${userId}/unsuspend`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
      },
    );
    if (!response.ok) throw new Error("Failed to unsuspend user");
    return await response.json();
  },

  updateRole: async (
    userId: string,
    role: UserRole,
    reason: string,
    admin: any,
  ) => {
    const response = await fetch(
      `${VITE_BACKEND_URL}/admin/users/${userId}/role`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify({ role, reason }),
      },
    );
    if (!response.ok) throw new Error("Failed to update role");
    return await response.json();
  },

  updateNotes: async (userId: string, notes: string, admin: any) => {
    const response = await fetch(
      `${VITE_BACKEND_URL}/admin/users/${userId}/notes`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify({ notes }),
      },
    );
    if (!response.ok) throw new Error("Failed to update notes");
    return await response.json();
  },

  deleteUser: async (userId: string, admin: any) => {
    const response = await fetch(`${VITE_BACKEND_URL}/admin/users/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${admin.token}`,
      },
    });
    if (!response.ok) throw new Error("Failed to delete user");
    return await response.json();
  },
};

// Stats Card Component - Mobile Optimized
interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}) => (
  <Card.Root>
    <Card.Body>
      <Flex justify="space-between" align="start">
        <Box flex="1" minW="0">
          <Text fontSize={{ base: "xs", md: "md" }} mb={1} >
            {title}
          </Text>
          <Heading size={{ base: "xl", md: "2xl" }} mb={1}>
            {value}
          </Heading>
          {subtitle && (
            <Text fontSize="xs" >
              {subtitle}
            </Text>
          )}
        </Box>
        <Box
          p={{ base: 2, md: 3 }}
          borderRadius="lg"
          flexShrink={0}
          ml={2}
        >
          <Icon
            size={20}
            style={{ color: `var(--chakra-colors-${color}-600)` }}
          />
        </Box>
      </Flex>
    </Card.Body>
  </Card.Root>
);

// Edit Credits Modal
interface EditCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSummary | null;
  onSuccess: () => void;
}

const EditCreditsModal: React.FC<EditCreditsModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [credits, setCredits] = useState(0);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { user: admin } = useUser();
  const bg = useColorModeValue("white", "gray.900");

  useEffect(() => {
    if (user) {
      setCredits(user.credits);
      setReason("");
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!reason.trim()) {
      toaster.create({ title: "Please provide a reason", type: "error" });
      return;
    }

    setLoading(true);
    try {
      await api.updateCredits(user.id, credits, reason, admin);
      toaster.create({
        title: "Credits updated successfully",
        type: "success",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toaster.create({
        title: "Failed to update credits",
        type: "error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.600"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
      onClick={onClose}
      px={4}
    >
      <Box
        bg={bg}
        borderRadius="lg"
        maxW="md"
        w="100%"
        p={{ base: 4, md: 6 }}
        onClick={(e) => e.stopPropagation()}
        maxH="90vh"
        overflowY="auto"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size={{ base: "md", md: "lg" }}>Edit Credits</Heading>
          <IconButton variant="ghost" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </Flex>

        <Stack gap={4}>
          <Box>
            <Text fontSize="sm" mb={2} wordBreak="break-word">
              User: {user.email}
            </Text>
            <Text fontSize="xs" color="gray.600">
              Current credits: {user.credits}
            </Text>
          </Box>

          <Field.Root>
            <Field.Label>New Credits Amount</Field.Label>
            <Input
              type="number"
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value))}
              min={0}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Reason for Change</Field.Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why credits are being adjusted..."
              rows={3}
            />
          </Field.Root>

          <Flex gap={2} justify="flex-end" flexWrap="wrap">
            <Button variant="outline" onClick={onClose} size={{ base: "sm", md: "md" }}>
              Cancel
            </Button>
            <Button
              colorPalette="blue"
              onClick={handleSubmit}
              loading={loading}
              size={{ base: "sm", md: "md" }}
            >
              Update Credits
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};

// Suspend User Modal
interface SuspendUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSummary | null;
  onSuccess: () => void;
}

const SuspendUserModal: React.FC<SuspendUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { user: admin } = useUser();
  const bg = useColorModeValue("white", "gray.900");

  useEffect(() => {
    if (user) {
      setReason("");
      setDuration("");
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!reason.trim() || reason.length < 10) {
      toaster.create({
        title: "Please provide a detailed reason (min 10 characters)",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const durationDays = duration ? Number(duration) : null;
      await api.suspendUser(user.id, reason, durationDays, admin);
      toaster.create({ title: "User suspended successfully", type: "success" });
      onSuccess();
      onClose();
    } catch (error: any) {
      toaster.create({
        title: "Failed to suspend user",
        type: "error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.600"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
      onClick={onClose}
      px={4}
    >
      <Box
        bg={bg}
        borderRadius="lg"
        maxW="md"
        w="100%"
        p={{ base: 4, md: 6 }}
        onClick={(e) => e.stopPropagation()}
        maxH="90vh"
        overflowY="auto"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size={{ base: "md", md: "lg" }} color="red.600">
            Suspend User
          </Heading>
          <IconButton variant="ghost" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </Flex>

        <Stack gap={4}>
          <Box>
            <Text fontSize="sm" mb={2} wordBreak="break-word">
              User: {user.email}
            </Text>
            <Text fontSize="xs" color="red.600">
              This will prevent the user from accessing their account.
            </Text>
          </Box>

          <Field.Root>
            <Field.Label>Reason for Suspension</Field.Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a detailed reason for suspension..."
              rows={4}
            />
          </Field.Root>

          <Field.Root>
            <Field.Label>Duration (days)</Field.Label>
            <Field.HelperText>
              Leave empty for indefinite suspension
            </Field.HelperText>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Optional"
              min={1}
            />
          </Field.Root>

          <Flex gap={2} justify="flex-end" flexWrap="wrap">
            <Button variant="outline" onClick={onClose} size={{ base: "sm", md: "md" }}>
              Cancel
            </Button>
            <Button
              colorPalette="red"
              onClick={handleSubmit}
              loading={loading}
              size={{ base: "sm", md: "md" }}
            >
              Suspend User
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};

// Update Role Modal
interface UpdateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserSummary | null;
  onSuccess: () => void;
}

const UpdateRoleModal: React.FC<UpdateRoleModalProps> = ({
  isOpen,
  onClose,
  user,
  onSuccess,
}) => {
  const [role, setRole] = useState<UserRole>("USER");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { user: admin } = useUser();
  const bg = useColorModeValue("white", "gray.900");

  const roleCollection = createListCollection({
    items: [
      { label: "User", value: "USER" },
      { label: "Admin", value: "ADMIN" },
      { label: "Super Admin", value: "SUPER_ADMIN" },
    ],
  });

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setReason("");
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!reason.trim()) {
      toaster.create({ title: "Please provide a reason", type: "error" });
      return;
    }

    setLoading(true);
    try {
      await api.updateRole(user.id, role, reason, admin);
      toaster.create({ title: "Role updated successfully", type: "success" });
      onSuccess();
      onClose();
    } catch (error: any) {
      toaster.create({
        title: "Failed to update role",
        type: "error",
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.600"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
      onClick={onClose}
      px={4}
    >
      <Box
        bg={bg}
        borderRadius="lg"
        maxW="md"
        w="100%"
        p={{ base: 4, md: 6 }}
        onClick={(e) => e.stopPropagation()}
        maxH="90vh"
        overflowY="auto"
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size={{ base: "md", md: "lg" }}>Update Role</Heading>
          <IconButton variant="ghost" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </Flex>

        <Stack gap={4}>
          <Box>
            <Text fontSize="sm" mb={2} wordBreak="break-word">
              User: {user.email}
            </Text>
            <Text fontSize="xs" color="gray.600">
              Current role: {user.role}
            </Text>
          </Box>

          <Field.Root>
            <Field.Label>New Role</Field.Label>
            <Select.Root
              collection={roleCollection}
              value={[role]}
              onValueChange={(e) => setRole(e.value[0] as UserRole)}
            >
              <Select.Trigger>
                <Select.ValueText placeholder="Select role" />
              </Select.Trigger>
              <Select.Content>
                {roleCollection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Field.Root>

          <Field.Root>
            <Field.Label>Reason for Change</Field.Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why the role is being changed..."
              rows={3}
            />
          </Field.Root>

          <Flex gap={2} justify="flex-end" flexWrap="wrap">
            <Button variant="outline" onClick={onClose} size={{ base: "sm", md: "md" }}>
              Cancel
            </Button>
            <Button
              colorPalette="purple"
              onClick={handleSubmit}
              loading={loading}
              size={{ base: "sm", md: "md" }}
            >
              Update Role
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};

// User Details Modal - Mobile Optimized
interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const { user: admin } = useUser();
  const bg = useColorModeValue("white", "gray.900");

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      api
        .getUserDetails(userId, admin)
        .then((data) => {
          setUser(data);
          setNotes(data.admin_notes || "");
          setLoading(false);
        })
        .catch((error) => {
          toaster.create({
            title: "Failed to load user details",
            type: "error",
            description: error.message
          });
          setLoading(false);
        });
    }
  }, [isOpen, userId]);

  const handleSaveNotes = async () => {
    if (!user) return;
    setSavingNotes(true);
    try {
      await api.updateNotes(user.id, notes, admin);
      toaster.create({ title: "Notes saved successfully", type: "success" });
    } catch (error: any) {
      toaster.create({
        title: "Failed to save notes",
        type: "error",
        description: error.message
      });
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.600"
      display={isOpen ? "flex" : "none"}
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
      onClick={onClose}
      p={{ base: 2, md: 4 }}
    >
      <Box
        bg={bg}
        borderRadius="lg"
        maxW="4xl"
        w="100%"
        maxH="90vh"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        onClick={(e) => e.stopPropagation()}
      >
        <Flex
          justify="space-between"
          align="center"
          p={{ base: 4, md: 6 }}
          borderBottom="1px"
          borderColor="gray.200"
          flexShrink={0}
        >
          <Heading size={{ base: "md", md: "lg" }}>User Details</Heading>
          <IconButton variant="ghost" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </Flex>

        <Box p={{ base: 4, md: 6 }} overflowY="auto" flex="1">
          {loading ? (
            <Flex justify="center" py={8}>
              <Spinner size="xl" />
            </Flex>
          ) : user ? (
            <Tabs.Root
              value={activeTab}
              onValueChange={(e) => setActiveTab(e.value)}
            >
              <Tabs.List overflowX="auto" flexWrap="nowrap">
                <Tabs.Trigger value="overview" fontSize={{ base: "sm", md: "md" }}>
                  Overview
                </Tabs.Trigger>
                <Tabs.Trigger value="credits" fontSize={{ base: "sm", md: "md" }}>
                  Credits
                </Tabs.Trigger>
                <Tabs.Trigger value="membership" fontSize={{ base: "sm", md: "md" }}>
                  Membership
                </Tabs.Trigger>
                <Tabs.Trigger value="activity" fontSize={{ base: "sm", md: "md" }}>
                  Activity
                </Tabs.Trigger>
                <Tabs.Trigger value="notes" fontSize={{ base: "sm", md: "md" }}>
                  Notes
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="overview" pt={4}>
                <Stack gap={4}>
                  <Grid
                    templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                    gap={4}
                  >
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Name
                      </Text>
                      <Text fontWeight="medium" wordBreak="break-word">
                        {user.name || "N/A"}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Email
                      </Text>
                      <Text fontWeight="medium" wordBreak="break-word">
                        {user.email}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Role
                      </Text>
                      <Badge colorPalette="blue">{user.role}</Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Status
                      </Text>
                      <Badge
                        colorPalette={
                          user.status === "ACTIVE" ? "green" : "red"
                        }
                      >
                        {user.status}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Total Courses
                      </Text>
                      <Text fontWeight="medium">{user.total_courses}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Completed Courses
                      </Text>
                      <Text fontWeight="medium">{user.completed_courses}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Total Roadmaps
                      </Text>
                      <Text fontWeight="medium">{user.total_roadmaps}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Login Count
                      </Text>
                      <Text fontWeight="medium">{user.login_count}</Text>
                    </Box>
                  </Grid>
                </Stack>
              </Tabs.Content>

              <Tabs.Content value="credits" pt={4}>
                <Stack gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Current Credits
                    </Text>
                    <Heading size={{ base: "lg", md: "xl" }}>{user.credits}</Heading>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Total Credits Used
                    </Text>
                    <Text fontSize="lg" fontWeight="medium">
                      {user.total_credits_used}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Credits Reset At
                    </Text>
                    <Text fontSize={{ base: "sm", md: "md" }}>
                      {user.credits_reset_at
                        ? new Date(user.credits_reset_at).toLocaleString()
                        : "N/A"}
                    </Text>
                  </Box>
                </Stack>
              </Tabs.Content>

              <Tabs.Content value="membership" pt={4}>
                <Stack gap={4}>
                  <Grid
                    templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
                    gap={4}
                  >
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Plan
                      </Text>
                      <Badge
                        colorPalette={
                          user.membership_plan === "premium" ? "purple" : "gray"
                        }
                        size="lg"
                      >
                        {user.membership_plan}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Status
                      </Text>
                      <Badge
                        colorPalette={
                          user.membership_status === "ACTIVE" ? "green" : "gray"
                        }
                        size="lg"
                      >
                        {user.membership_status}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Active Until
                      </Text>
                      <Text fontSize={{ base: "sm", md: "md" }}>
                        {user.membership_active_until
                          ? new Date(
                            user.membership_active_until,
                          ).toLocaleDateString()
                          : "N/A"}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Stripe Customer ID
                      </Text>
                      <Text fontSize="sm" fontFamily="mono" wordBreak="break-all">
                        {user.stripe_customer_id || "N/A"}
                      </Text>
                    </Box>
                  </Grid>
                </Stack>
              </Tabs.Content>

              <Tabs.Content value="activity" pt={4}>
                <Stack gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Last Login
                    </Text>
                    <Text fontSize={{ base: "sm", md: "md" }}>
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString()
                        : "Never"}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Created At
                    </Text>
                    <Text fontSize={{ base: "sm", md: "md" }}>
                      {new Date(user.created_at).toLocaleString()}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Updated At
                    </Text>
                    <Text fontSize={{ base: "sm", md: "md" }}>
                      {new Date(user.updated_at).toLocaleString()}
                    </Text>
                  </Box>
                </Stack>
              </Tabs.Content>

              <Tabs.Content value="notes" pt={4}>
                <Stack gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      Admin Notes
                    </Text>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={6}
                      placeholder="Add notes about this user..."
                    />
                  </Box>
                  <Button
                    colorPalette="blue"
                    onClick={handleSaveNotes}
                    loading={savingNotes}
                    size={{ base: "sm", md: "md" }}
                  >
                    Save Notes
                  </Button>
                </Stack>
              </Tabs.Content>
            </Tabs.Root>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
};

// Main Admin Dashboard Component
const AdminPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<keyof UserSummary | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const { user: admin } = useUser();

  const statusCollection = createListCollection({
    items: [
      { label: "All Status", value: "all" },
      { label: "Active", value: "ACTIVE" },
      { label: "Suspended", value: "SUSPENDED" },
    ],
  });

  const roleCollection = createListCollection({
    items: [
      { label: "All Roles", value: "all" },
      { label: "User", value: "USER" },
      { label: "Admin", value: "ADMIN" },
      { label: "Super Admin", value: "SUPER_ADMIN" },
    ],
  });

  const planCollection = createListCollection({
    items: [
      { label: "All Plans", value: "all" },
      { label: "Free", value: "free" },
      { label: "Premium", value: "premium" },
    ],
  });

  const loadData = async (showRefreshToast = false) => {
    const isRefresh = showRefreshToast;
    if (isRefresh) setRefreshing(true);

    try {
      const [statsData, usersData] = await Promise.all([
        api.getDashboardStats(admin),
        api.getUsers({
          token: admin?.token,
          search: searchTerm,
          status: statusFilter,
          role: roleFilter,
          plan: planFilter
        }),
      ]);
      setStats(statsData);
      setUsers(usersData.items);

      if (isRefresh) {
        toaster.create({
          title: "Dashboard refreshed",
          type: "success",
          duration: 2000
        });
      }
    } catch (error: any) {
      toaster.create({
        title: "Failed to load data",
        type: "error",
        description: error.message
      });
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!loading) {
        loadData();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, roleFilter, planFilter]);

  // Filtered and sorted users
  const filteredAndSortedUsers = useMemo(() => {
    const result = [...users];

    if (sortBy) {
      result.sort((a, b) => {
        const aVal = a[sortBy];
        const bVal = b[sortBy];

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        if (typeof aVal === "number" && typeof bVal === "number") {
          return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
        }

        return 0;
      });
    }

    return result;
  }, [users, sortBy, sortDirection]);

  const handleSort = (column: keyof UserSummary) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId);
    setIsDetailsModalOpen(true);
  };

  const handleEditCredits = (user: UserSummary) => {
    setSelectedUser(user);
    setIsCreditsModalOpen(true);
  };

  const handleSuspendUser = (user: UserSummary) => {
    setSelectedUser(user);
    setIsSuspendModalOpen(true);
  };

  const handleUnsuspendUser = async (userId: string) => {
    try {
      await api.unsuspendUser(userId, admin);
      toaster.create({
        title: "User unsuspended successfully",
        type: "success",
      });
      loadData();
    } catch (error: any) {
      toaster.create({
        title: "Failed to unsuspend user",
        type: "error",
        description: error.message
      });
    }
  };

  const handleUpdateRole = (user: UserSummary) => {
    setSelectedUser(user);
    setIsRoleModalOpen(true);
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (
      !confirm(
        `Are you sure you want to delete user: ${email}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await api.deleteUser(userId, admin);
      toaster.create({ title: "User deleted successfully", type: "success" });
      loadData();
    } catch (error: any) {
      toaster.create({
        title: "Failed to delete user",
        type: "error",
        description: error.message
      });
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Email", "Role", "Status", "Plan", "Credits", "Last Login", "Created"];
    const rows = filteredAndSortedUsers.map(user => [
      user.name || "N/A",
      user.email,
      user.role,
      user.status,
      user.membership_plan,
      user.credits,
      user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never",
      new Date(user.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toaster.create({
      title: "Users exported successfully",
      type: "success"
    });
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box minH="100vh">
      {/* Header - Mobile Optimized */}
      <Box
        borderBottom="1px"
        borderColor="gray.200"
        px={{ base: 4, md: 8 }}
        py={{ base: 3, md: 4 }}
        // bg={useColorModeValue("white", "gray.800")}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Container maxW="7xl">
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <Heading size={{ base: "lg", md: "xl" }}>Admin Dashboard</Heading>
            <Flex gap={2} align="center">
              <IconButton
                size={{ base: "sm", md: "md" }}
                variant="outline"
                onClick={() => loadData(true)}
                loading={refreshing}
                title="Refresh dashboard"
              >
                <RefreshCw size={18} />
              </IconButton>
              <Badge colorPalette="purple" size={{ base: "md", md: "lg" }}>
                {admin?.role || "Admin"}
              </Badge>
            </Flex>
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" py={{ base: 4, md: 8 }}>
        <Stack gap={{ base: 6, md: 8 }}>
          {/* Stats Grid - Mobile Optimized */}
          {stats && (
            <Box>
              <Heading size={{ base: "md", md: "lg" }} mb={4}>
                Overview
              </Heading>
              <Grid
                templateColumns={{
                  base: "1fr",
                  sm: "repeat(2, 1fr)",
                  lg: "repeat(4, 1fr)"
                }}
                gap={4}
              >
                <StatCard
                  title="Total Users"
                  value={stats.total_users.toLocaleString()}
                  subtitle={`${stats.active_users} active`}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Premium Users"
                  value={stats.premium_users.toLocaleString()}
                  subtitle={`${stats.free_users} free users`}
                  icon={TrendingUp}
                  color="purple"
                />
                <StatCard
                  title="Total Courses"
                  value={stats.total_courses.toLocaleString()}
                  subtitle={`${stats.completed_courses} completed`}
                  icon={BookOpen}
                  color="green"
                />
                <StatCard
                  title="Credits Used"
                  value={stats.total_credits_used.toLocaleString()}
                  subtitle={`of ${stats.total_credits_issued.toLocaleString()} issued`}
                  icon={DollarSign}
                  color="orange"
                />
              </Grid>
            </Box>
          )}

          {/* New Users Stats - Mobile Optimized */}
          {stats && (
            <Card.Root>
              <Card.Body>
                <Heading size={{ base: "sm", md: "md" }} mb={4}>
                  New Users
                </Heading>
                <Grid
                  templateColumns={{ base: "repeat(3, 1fr)" }}
                  gap={{ base: 1, md: 1 }}
                >
                  <Box textAlign="center">
                    <Text
                      fontSize={{ base: "2xl", md: "3xl" }}
                      fontWeight="bold"
                      color="blue.600"
                    >
                      {stats.new_users_today}
                    </Text>
                    <Text fontSize={{ base: "xs", md: "sm" }} >
                      Today
                    </Text>
                  </Box>
                  <Box textAlign="center">
                    <Text
                      fontSize={{ base: "2xl", md: "3xl" }}
                      fontWeight="bold"
                      color="blue.600"
                    >
                      {stats.new_users_this_week}
                    </Text>
                    <Text fontSize={{ base: "xs", md: "sm" }}>
                      This Week
                    </Text>
                  </Box>
                  <Box textAlign="center">
                    <Text
                      fontSize={{ base: "2xl", md: "3xl" }}
                      fontWeight="bold"
                      color="blue.600"
                    >
                      {stats.new_users_this_month}
                    </Text>
                    <Text fontSize={{ base: "xs", md: "sm" }} >
                      This Month
                    </Text>
                  </Box>
                </Grid>
              </Card.Body>
            </Card.Root>
          )}

          {/* User Management - Mobile Optimized */}
          <Box>
            <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
              <Heading size={{ base: "md", md: "lg" }}>User Management</Heading>
              <Flex gap={2}>
                <Button
                  size={{ base: "sm", md: "md" }}
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  display={{ base: "flex", md: "none" }}
                >
                  <Filter size={16} />
                </Button>
                <Button
                  size={{ base: "sm", md: "md" }}
                  variant="outline"
                  onClick={exportToCSV}
                  display={{ base: "none", sm: "flex" }}
                >
                  <Download size={16} />
                  <Text ml={2} display={{ base: "none", md: "inline" }}>Export</Text>
                </Button>
              </Flex>
            </Flex>

            {/* Search and Filters - Mobile Optimized */}
            <Stack gap={3} mb={4}>
              <Flex gap={2} flexWrap="wrap">
                <Box flex="1" minW={{ base: "100%", md: "250px" }}>
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size={{ base: "sm", md: "md" }}
                  />
                </Box>
                <Flex
                  gap={2}
                  display={{ base: showFilters ? "flex" : "none", md: "flex" }}
                  w={{ base: "100%", md: "auto" }}
                  flexWrap="wrap"
                >
                  <Select.Root
                    collection={statusCollection}
                    value={[statusFilter]}
                    onValueChange={(e) => setStatusFilter(e.value[0])}
                    size={{ base: "sm", md: "md" }}
                    w={{ base: "100%", sm: "auto" }}
                  >
                    <Select.Trigger minW="140px">
                      <Select.ValueText placeholder="Select status" />
                    </Select.Trigger>
                    <Select.Content>
                      {statusCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>

                  <Select.Root
                    collection={roleCollection}
                    value={[roleFilter]}
                    onValueChange={(e) => setRoleFilter(e.value[0])}
                    size={{ base: "sm", md: "md" }}
                    w={{ base: "100%", sm: "auto" }}
                  >
                    <Select.Trigger minW="140px">
                      <Select.ValueText placeholder="Select role" />
                    </Select.Trigger>
                    <Select.Content>
                      {roleCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>

                  <Select.Root
                    collection={planCollection}
                    value={[planFilter]}
                    onValueChange={(e) => setPlanFilter(e.value[0])}
                    size={{ base: "sm", md: "md" }}
                    w={{ base: "100%", sm: "auto" }}
                  >
                    <Select.Trigger minW="140px">
                      <Select.ValueText placeholder="Select plan" />
                    </Select.Trigger>
                    <Select.Content>
                      {planCollection.items.map((item) => (
                        <Select.Item key={item.value} item={item}>
                          {item.label}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Flex>
              </Flex>

              <Text fontSize="sm" color="gray.600">
                Showing {filteredAndSortedUsers.length} user{filteredAndSortedUsers.length !== 1 ? "s" : ""}
              </Text>
            </Stack>

            {/* Desktop Table */}
            <Card.Root display={{ base: "none", lg: "block" }}>
              <Box overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader
                        cursor="pointer"
                        onClick={() => handleSort("name")}
                      >
                        <Flex align="center" gap={1}>
                          Name
                          {sortBy === "name" && (
                            sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                          )}
                        </Flex>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader
                        cursor="pointer"
                        onClick={() => handleSort("email")}
                      >
                        <Flex align="center" gap={1}>
                          Email
                          {sortBy === "email" && (
                            sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                          )}
                        </Flex>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>Role</Table.ColumnHeader>
                      <Table.ColumnHeader>Status</Table.ColumnHeader>
                      <Table.ColumnHeader>Plan</Table.ColumnHeader>
                      <Table.ColumnHeader
                        cursor="pointer"
                        onClick={() => handleSort("credits")}
                      >
                        <Flex align="center" gap={1}>
                          Credits
                          {sortBy === "credits" && (
                            sortDirection === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                          )}
                        </Flex>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader>Last Login</Table.ColumnHeader>
                      <Table.ColumnHeader>Actions</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {filteredAndSortedUsers.map((user) => (
                      <Table.Row key={user.id}>
                        <Table.Cell fontWeight="medium">
                          {user.name || "N/A"}
                        </Table.Cell>
                        <Table.Cell>{user.email}</Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette="blue" size="sm">
                            {user.role}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            colorPalette={
                              user.status === "ACTIVE" ? "green" : "red"
                            }
                            size="sm"
                          >
                            {user.status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge
                            colorPalette={
                              user.membership_plan === "premium"
                                ? "purple"
                                : "gray"
                            }
                            size="sm"
                          >
                            {user.membership_plan}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>{user.credits}</Table.Cell>
                        <Table.Cell fontSize="xs">
                          {user.last_login_at
                            ? new Date(user.last_login_at).toLocaleDateString()
                            : "Never"}
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap={1}>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewUser(user.id)}
                              title="View Details"
                            >
                              <Eye size={16} />
                            </IconButton>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditCredits(user)}
                              title="Edit Credits"
                            >
                              <CreditCard size={16} />
                            </IconButton>
                            <IconButton
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateRole(user)}
                              title="Update Role"
                            >
                              <Shield size={16} />
                            </IconButton>
                            {user.status === "SUSPENDED" ? (
                              <IconButton
                                size="sm"
                                variant="ghost"
                                colorPalette="green"
                                onClick={() => handleUnsuspendUser(user.id)}
                                title="Unsuspend"
                              >
                                <CheckCircle size={16} />
                              </IconButton>
                            ) : (
                              <IconButton
                                size="sm"
                                variant="ghost"
                                colorPalette="orange"
                                onClick={() => handleSuspendUser(user)}
                                title="Suspend"
                              >
                                <Ban size={16} />
                              </IconButton>
                            )}
                            <IconButton
                              size="sm"
                              variant="ghost"
                              colorPalette="red"
                              onClick={() =>
                                handleDeleteUser(user.id, user.email)
                              }
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Card.Root>

            {/* Mobile Card View */}
            <Stack gap={3} display={{ base: "flex", lg: "none" }}>
              {filteredAndSortedUsers.map((user) => (
                <Card.Root key={user.id}>
                  <Card.Body>
                    <Stack gap={3}>
                      <Flex justify="space-between" align="start">
                        <Box flex="1" minW="0">
                          <Text fontWeight="bold" fontSize="md" mb={1} >
                            {user.name || "N/A"}
                          </Text>
                          <Text fontSize="sm" color="gray.600" >
                            {user.email}
                          </Text>
                        </Box>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewUser(user.id)}
                          flexShrink={0}
                          ml={2}
                        >
                          <Eye size={16} />
                        </IconButton>
                      </Flex>

                      <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                        <Box>
                          <Text fontSize="xs" color="gray.600" mb={1}>Role</Text>
                          <Badge colorPalette="blue" size="sm">{user.role}</Badge>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600" mb={1}>Status</Text>
                          <Badge
                            colorPalette={user.status === "ACTIVE" ? "green" : "red"}
                            size="sm"
                          >
                            {user.status}
                          </Badge>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600" mb={1}>Plan</Text>
                          <Badge
                            colorPalette={
                              user.membership_plan === "premium" ? "purple" : "gray"
                            }
                            size="sm"
                          >
                            {user.membership_plan}
                          </Badge>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="gray.600" mb={1}>Credits</Text>
                          <Text fontSize="sm" fontWeight="medium">{user.credits}</Text>
                        </Box>
                      </Grid>

                      <Flex gap={2} flexWrap="wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCredits(user)}
                          flex="1"
                          minW="120px"
                        >
                          <CreditCard size={14} />
                          <Text ml={1}>Credits</Text>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateRole(user)}
                          flex="1"
                          minW="120px"
                        >
                          <Shield size={14} />
                          <Text ml={1}>Role</Text>
                        </Button>
                        {user.status === "SUSPENDED" ? (
                          <Button
                            size="sm"
                            colorPalette="green"
                            variant="outline"
                            onClick={() => handleUnsuspendUser(user.id)}
                            flex="1"
                            minW="120px"
                          >
                            <CheckCircle size={14} />
                            <Text ml={1}>Unsuspend</Text>
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            colorPalette="orange"
                            variant="outline"
                            onClick={() => handleSuspendUser(user)}
                            flex="1"
                            minW="120px"
                          >
                            <Ban size={14} />
                            <Text ml={1}>Suspend</Text>
                          </Button>
                        )}
                        <IconButton
                          size="sm"
                          colorPalette="red"
                          variant="outline"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </Flex>
                    </Stack>
                  </Card.Body>
                </Card.Root>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Container>

      {/* Modals */}
      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        userId={selectedUserId}
      />

      <EditCreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        user={selectedUser}
        onSuccess={loadData}
      />

      <SuspendUserModal
        isOpen={isSuspendModalOpen}
        onClose={() => setIsSuspendModalOpen(false)}
        user={selectedUser}
        onSuccess={loadData}
      />

      <UpdateRoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        user={selectedUser}
        onSuccess={loadData}
      />
    </Box>
  );
};

export default AdminPage;