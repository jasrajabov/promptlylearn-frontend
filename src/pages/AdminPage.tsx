import React, { useState, useEffect } from "react";
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
  Edit,
  Ban,
  CheckCircle,
  Trash2,
  Eye,
  X,
  Shield,
  CreditCard,
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
    return await response.json();
  },

  getUsers: async (
    params: Record<string, any>,
  ): Promise<PaginatedResponse<UserSummary>> => {
    const response = await fetch(`${VITE_BACKEND_URL}/admin/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.token}`,
      },
    });
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
    return await response.json();
  },
};

// Stats Card Component
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
        <Box>
          <Text fontSize="sm" color="gray.600" mb={1}>
            {title}
          </Text>
          <Heading size="2xl" mb={1}>
            {value}
          </Heading>
          {subtitle && (
            <Text fontSize="xs" color="gray.500">
              {subtitle}
            </Text>
          )}
        </Box>
        <Box p={3} bg={`${color}.100`} borderRadius="lg">
          <Icon
            size={24}
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
    console.log("Submitting credit update:", { credits, reason });
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
    } catch (error) {
      toaster.create({ title: "Failed to update credits", type: "error" });
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
    >
      <Box
        bg={bg}
        borderRadius="lg"
        maxW="md"
        w="90%"
        p={6}
        onClick={(e) => e.stopPropagation()}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="lg">Edit Credits</Heading>
          <IconButton variant="ghost" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </Flex>

        <Stack gap={4}>
          <Box>
            <Text fontSize="sm" mb={2}>
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

          <Flex gap={2} justify="flex-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorPalette="blue"
              onClick={() => handleSubmit()}
              loading={loading}
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
    } catch (error) {
      toaster.create({ title: "Failed to suspend user", type: "error" });
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
    >
      <Box
        bg={bg}
        borderRadius="lg"
        maxW="md"
        w="90%"
        p={6}
        onClick={(e) => e.stopPropagation()}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="lg" color="red.600">
            Suspend User
          </Heading>
          <IconButton variant="ghost" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </Flex>

        <Stack gap={4}>
          <Box>
            <Text fontSize="sm" mb={2}>
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

          <Flex gap={2} justify="flex-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button colorPalette="red" onClick={handleSubmit} loading={loading}>
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
    } catch (error) {
      toaster.create({ title: "Failed to update role", type: "error" });
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
    >
      <Box
        bg={bg}
        borderRadius="lg"
        maxW="md"
        w="90%"
        p={6}
        onClick={(e) => e.stopPropagation()}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="lg">Update Role</Heading>
          <IconButton variant="ghost" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </Flex>

        <Stack gap={4}>
          <Box>
            <Text fontSize="sm" mb={2}>
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

          <Flex gap={2} justify="flex-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorPalette="purple"
              onClick={handleSubmit}
              loading={loading}
            >
              Update Role
            </Button>
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
};

// User Details Modal
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
      api.getUserDetails(userId, admin).then((data) => {
        setUser(data);
        setNotes(data.admin_notes || "");
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
    } catch (error) {
      toaster.create({ title: "Failed to save notes", type: "error" });
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
    >
      <Box
        bg={bg}
        borderRadius="lg"
        maxW="4xl"
        w="90%"
        maxH="90vh"
        overflow="auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Flex
          justify="space-between"
          align="center"
          p={6}
          borderBottom="1px"
          borderColor="gray.200"
        >
          <Heading size="lg">User Details</Heading>
          <IconButton variant="ghost" size="sm" onClick={onClose}>
            <X />
          </IconButton>
        </Flex>

        <Box p={6}>
          {loading ? (
            <Flex justify="center" py={8}>
              <Spinner size="xl" />
            </Flex>
          ) : user ? (
            <Tabs.Root
              value={activeTab}
              onValueChange={(e) => setActiveTab(e.value)}
            >
              <Tabs.List>
                <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
                <Tabs.Trigger value="credits">Credits</Tabs.Trigger>
                <Tabs.Trigger value="membership">Membership</Tabs.Trigger>
                <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
                <Tabs.Trigger value="notes">Notes</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="overview" pt={4}>
                <Stack gap={4}>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Name
                      </Text>
                      <Text fontWeight="medium">{user.name || "N/A"}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600" mb={1}>
                        Email
                      </Text>
                      <Text fontWeight="medium">{user.email}</Text>
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
                    <Heading size="xl">{user.credits}</Heading>
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
                    <Text>
                      {user.credits_reset_at
                        ? new Date(user.credits_reset_at).toLocaleString()
                        : "N/A"}
                    </Text>
                  </Box>
                </Stack>
              </Tabs.Content>

              <Tabs.Content value="membership" pt={4}>
                <Stack gap={4}>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
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
                      <Text>
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
                      <Text fontSize="sm" fontFamily="mono">
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
                    <Text>
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleString()
                        : "Never"}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Created At
                    </Text>
                    <Text>{new Date(user.created_at).toLocaleString()}</Text>
                  </Box>
                  <Box>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Updated At
                    </Text>
                    <Text>{new Date(user.updated_at).toLocaleString()}</Text>
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
const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);

  const { user: admin } = useUser();

  const statusCollection = createListCollection({
    items: [
      { label: "All Status", value: "all" },
      { label: "Active", value: "ACTIVE" },
      { label: "Suspended", value: "SUSPENDED" },
    ],
  });

  const loadData = async () => {
    try {
      const [statsData, usersData] = await Promise.all([
        api.getDashboardStats(admin),
        api.getUsers({ token: admin?.token }),
      ]);
      setStats(statsData);
      setUsers(usersData.items);
    } catch (error) {
      toaster.create({ title: "Failed to load data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
    } catch (error) {
      toaster.create({ title: "Failed to unsuspend user", type: "error" });
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
    } catch (error) {
      toaster.create({ title: "Failed to delete user", type: "error" });
    }
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
      <Box borderBottom="1px" borderColor="gray.200" px={8} py={4}>
        <Container maxW="7xl">
          <Flex justify="space-between" align="center">
            <Heading size="xl">Admin Dashboard</Heading>
            <Badge colorPalette="purple" size="lg">
              {admin?.role || "Admin"}
            </Badge>
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" py={8}>
        <Stack gap={8}>
          {/* Stats Grid */}
          {stats && (
            <Box>
              <Heading size="lg" mb={4}>
                Overview
              </Heading>
              <Grid
                templateColumns="repeat(auto-fit, minmax(250px, 1fr))"
                gap={4}
              >
                <StatCard
                  title="Total Users"
                  value={stats.total_users}
                  subtitle={`${stats.active_users} active`}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Premium Users"
                  value={stats.premium_users}
                  subtitle={`${stats.free_users} free users`}
                  icon={TrendingUp}
                  color="purple"
                />
                <StatCard
                  title="Total Courses"
                  value={stats.total_courses}
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

          {/* New Users Stats */}
          {stats && (
            <Card.Root>
              <Card.Body>
                <Heading size="md" mb={4}>
                  New Users
                </Heading>
                <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                  <Box textAlign="center">
                    <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                      {stats.new_users_today}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      Today
                    </Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                      {stats.new_users_this_week}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      This Week
                    </Text>
                  </Box>
                  <Box textAlign="center">
                    <Text fontSize="3xl" fontWeight="bold" color="blue.600">
                      {stats.new_users_this_month}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      This Month
                    </Text>
                  </Box>
                </Grid>
              </Card.Body>
            </Card.Root>
          )}

          {/* User Management */}
          <Box>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="lg">User Management</Heading>
              <Flex gap={2}>
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  w="300px"
                />
                <Select.Root
                  collection={statusCollection}
                  value={[statusFilter]}
                  onValueChange={(e) => setStatusFilter(e.value[0])}
                  w="150px"
                >
                  <Select.Trigger>
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
              </Flex>
            </Flex>

            <Card.Root>
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>Name</Table.ColumnHeader>
                    <Table.ColumnHeader>Email</Table.ColumnHeader>
                    <Table.ColumnHeader>Role</Table.ColumnHeader>
                    <Table.ColumnHeader>Status</Table.ColumnHeader>
                    <Table.ColumnHeader>Plan</Table.ColumnHeader>
                    <Table.ColumnHeader>Credits</Table.ColumnHeader>
                    <Table.ColumnHeader>Last Login</Table.ColumnHeader>
                    <Table.ColumnHeader>Actions</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {users.map((user) => (
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
            </Card.Root>
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

export default AdminDashboard;
