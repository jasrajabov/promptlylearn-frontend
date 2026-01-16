import React, { useState } from "react";
import {
  Flex,
  HStack,
  VStack,
  Button,
  Avatar,
  Menu,
  Portal,
  Circle,
  Image,
  Box,
  Text,
  useBreakpointValue,
  Float,
  Collapsible,
  Separator,
  IconButton,
} from "@chakra-ui/react";
import {
  FaSun,
  FaMoon,
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useColorModeValue, useColorMode } from "../components/ui/color-mode";
import promptlyLeanrnLogoDark from "../assets/promptlylearn-teal-v1.svg";
import promptlyLeanrnLogoLight from "../assets/promptlylearn-teal-light.svg";
import { FaSignInAlt } from "react-icons/fa";
import { type User } from "../types";
import { Badge } from "@chakra-ui/react";
import { HiStar } from "react-icons/hi";
import { BiSolidCoinStack } from "react-icons/bi";
import { BookOpen, Map, Shield } from "lucide-react";

const NavItem: React.FC<{
  label: string;
  onClick: () => void;
  active?: boolean;
  icon?: React.ReactNode;
}> = ({ label, onClick, active = false, icon }) => {
  const hoverBg = useColorModeValue("gray.100", "gray.900");
  const activeBg = useColorModeValue("teal.50", "teal.900/30");
  const activeColor = useColorModeValue("teal.600", "teal.300");
  const textColor = useColorModeValue("gray.700", "gray.200");

  return (
    <Button
      size="sm"
      variant="ghost"
      fontWeight={active ? "semibold" : "medium"}
      onClick={onClick}
      bg={"transparent"}
      color={active ? activeColor : textColor}
      _hover={{ bg: hoverBg }}
      borderRadius="md"
      justifyContent="flex-start"
      px={3}
    >
      <HStack gap={2}>
        {icon}
        <Text fontWeight={active ? "bold" : "medium"}>{label}</Text>
      </HStack>
    </Button>
  );
};

const Header: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const currentUser = user as User | undefined;
  const logo = useColorModeValue(
    promptlyLeanrnLogoLight,
    promptlyLeanrnLogoDark,
  );
  const bg = useColorModeValue("white", "black");
  const border = useColorModeValue("gray.200", "gray.700");
  const mobileBg = useColorModeValue("gray.50", "gray.850");
  const cardBg = useColorModeValue("white", "gray.800");
  const subTextColor = useColorModeValue("gray.600", "gray.400");

  const isMobile = useBreakpointValue({ base: true, md: false });

  // Check if user is admin (adjust property name based on your User type)
  const isAdmin =
    (currentUser as any)?.isAdmin ||
    (currentUser as any)?.role === "ADMIN" ||
    (currentUser as any)?.role === "SUPER_ADMIN";
  console.log("user", currentUser, "isAdmin", isAdmin);

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={100}
      borderBottom="1px solid"
      borderColor={border}
      boxShadow="sm"
      bg={bg}
    >
      <Flex
        maxW="1280px"
        mx="auto"
        px={{ base: 4, md: 6 }}
        py={3}
        align="center"
        justify="space-between"
      >
        {/* Left: Logo & Nav */}
        <HStack gap={{ base: 2, md: 6 }}>
          <Image
            src={logo}
            alt="AI Course Builder"
            height={{ base: "34px", md: "38px" }}
            onClick={() => handleNavClick("/")}
            cursor="pointer"
            transition="all 0.2s"
            _hover={{ transform: "scale(1.05)", opacity: 0.8 }}
          />

          {!isMobile && (
            <HStack gap={0} ml={2}>
              <NavItem
                label="Home"
                onClick={() => handleNavClick("/")}
                active={isActive("/")}
              />
              <NavItem
                label="About"
                onClick={() => handleNavClick("/about")}
                active={isActive("/about")}
              />
              {currentUser?.token && (
                <>
                  <NavItem
                    label="Courses"
                    onClick={() => handleNavClick("/my-courses")}
                    active={isActive("/my-courses")}
                  />
                  <NavItem
                    label="Tracks"
                    onClick={() => handleNavClick("/my-roadmaps")}
                    active={isActive("/my-roadmaps")}
                  />
                  {isAdmin && (
                    <NavItem
                      label="Admin"
                      onClick={() => handleNavClick("/admin")}
                      active={isActive("/admin")}
                      icon={<Shield size={14} />}
                    />
                  )}
                </>
              )}
            </HStack>
          )}
        </HStack>

        {/* Right: User Actions */}
        <HStack gap={2}>
          {!isMobile && (
            <>
              {currentUser ? (
                <HStack gap={2}>
                  {/* Credits Badge - only show for free (non-admin) users */}
                  {currentUser.membership_plan === "free" && !isAdmin && (
                    <Badge
                      colorPalette="gray"
                      variant="outline"
                      px={2.5}
                      py={1}
                      borderRadius="md"
                      fontSize="xs"
                      fontWeight="medium"
                    >
                      <HStack gap={1.5}>
                        <BiSolidCoinStack size={13} />
                        <Text>{currentUser.credits ?? 0}</Text>
                      </HStack>
                    </Badge>
                  )}

                  {/* Membership Badge */}
                  <Badge
                    colorPalette={
                      isAdmin
                        ? "red"
                        : currentUser.membership_plan === "premium"
                          ? "purple"
                          : "teal"
                    }
                    variant="subtle"
                    px={2.5}
                    py={1}
                    borderRadius="md"
                    fontSize="xs"
                    fontWeight="semibold"
                  >
                    <HStack gap={1.5}>
                      {isAdmin ? (
                        <>
                          <Shield size={13} />
                          <Text>Admin</Text>
                        </>
                      ) : currentUser.membership_plan === "premium" ? (
                        <>
                          <HiStar size={13} />
                          <Text>Premium</Text>
                        </>
                      ) : (
                        <Text>Free</Text>
                      )}
                    </HStack>
                  </Badge>

                  {/* User Menu */}
                  <Menu.Root positioning={{ placement: "bottom-end" }}>
                    <Menu.Trigger asChild>
                      <Box
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{ opacity: 0.8 }}
                      >
                        <Avatar.Root
                          size="sm"
                          borderWidth="2px"
                          borderColor="transparent"
                          _hover={{ borderColor: "teal.400" }}
                        >
                          <Avatar.Fallback fontSize="xs">
                            {currentUser?.name?.[0] ?? "?"}
                          </Avatar.Fallback>
                          <Avatar.Image
                            src={currentUser?.avatar_url || undefined}
                          />
                          <Float placement="bottom-end" offsetX="0" offsetY="0">
                            <Circle
                              bg="green.400"
                              size="10px"
                              outline="2px solid"
                              outlineColor={bg}
                            />
                          </Float>
                        </Avatar.Root>
                      </Box>
                    </Menu.Trigger>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content minW="200px">
                          <Box
                            px={3}
                            py={2}
                            borderBottomWidth="1px"
                            borderColor={border}
                          >
                            <Text fontSize="sm" fontWeight="semibold">
                              {currentUser.name}
                            </Text>
                            <Text fontSize="xs" color={subTextColor}>
                              {currentUser.email}
                            </Text>
                          </Box>
                          <Menu.Item
                            value="profile"
                            onClick={() => navigate("/user-info")}
                          >
                            <HStack gap={2}>
                              <FaUser size={14} />
                              <Text>My Profile</Text>
                            </HStack>
                          </Menu.Item>
                          {isAdmin && (
                            <Menu.Item
                              value="admin"
                              onClick={() => navigate("/admin")}
                            >
                              <HStack gap={2}>
                                <Shield size={14} />
                                <Text>Admin Panel</Text>
                              </HStack>
                            </Menu.Item>
                          )}
                          <Menu.Separator />
                          <Menu.Item
                            value="logout"
                            onClick={logout}
                            color="red.500"
                          >
                            <HStack gap={2}>
                              <FaSignOutAlt size={14} />
                              <Text>Logout</Text>
                            </HStack>
                          </Menu.Item>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                </HStack>
              ) : (
                <Button
                  size="sm"
                  outline="ghost"
                  onClick={() => navigate("/login")}
                  fontWeight="medium"
                >
                  <HStack gap={2}>
                    <FaSignInAlt size={13} />
                    <Text>Login</Text>
                  </HStack>
                </Button>
              )}

              {/* Theme Toggle */}
              <IconButton
                size="sm"
                variant="ghost"
                onClick={toggleColorMode}
                aria-label="Toggle theme"
              >
                {colorMode === "light" ? (
                  <FaMoon size={14} />
                ) : (
                  <FaSun size={14} />
                )}
              </IconButton>
            </>
          )}

          {/* Mobile Hamburger */}
          {isMobile && (
            <IconButton
              size="sm"
              variant="ghost"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
            </IconButton>
          )}
        </HStack>
      </Flex>

      {/* Mobile Menu */}
      {isMobile && (
        <Collapsible.Root open={isMobileMenuOpen}>
          <Collapsible.Content>
            <VStack
              px={4}
              py={4}
              gap={3}
              align="stretch"
              bg={mobileBg}
              borderTop="1px solid"
              borderColor={border}
            >
              {/* User Section */}
              {currentUser ? (
                <>
                  {/* User Info Card */}
                  <Box
                    p={4}
                    bg={cardBg}
                    borderRadius="xl"
                    borderWidth="1px"
                    borderColor={border}
                    boxShadow="sm"
                  >
                    <HStack gap={3} mb={3}>
                      <Avatar.Root size="lg">
                        <Avatar.Fallback fontSize="md">
                          {currentUser?.name?.[0] ?? "?"}
                        </Avatar.Fallback>
                        <Avatar.Image
                          src={currentUser?.avatar_url || undefined}
                        />
                      </Avatar.Root>
                      <VStack gap={0.5} align="start" flex={1}>
                        <Text fontSize="md" fontWeight="bold">
                          {currentUser?.name}
                        </Text>
                        <Text fontSize="xs" color={subTextColor}>
                          {currentUser?.email}
                        </Text>
                      </VStack>
                    </HStack>

                    <HStack gap={2} justify="space-between">
                      <Badge
                        size="sm"
                        colorPalette={
                          isAdmin
                            ? "red"
                            : currentUser.membership_plan === "premium"
                              ? "purple"
                              : "teal"
                        }
                        variant="subtle"
                        px={3}
                        py={1}
                      >
                        <HStack gap={1.5}>
                          {isAdmin ? (
                            <>
                              <Shield size={14} />
                              <Text fontWeight="semibold">Admin</Text>
                            </>
                          ) : currentUser.membership_plan === "premium" ? (
                            <>
                              <HiStar size={14} />
                              <Text fontWeight="semibold">Premium</Text>
                            </>
                          ) : (
                            <Text fontWeight="semibold">Free Plan</Text>
                          )}
                        </HStack>
                      </Badge>

                      {currentUser.membership_plan === "free" && !isAdmin && (
                        <Badge
                          size="sm"
                          colorPalette="gray"
                          variant="outline"
                          px={3}
                          py={1}
                        >
                          <HStack gap={1.5}>
                            <BiSolidCoinStack size={14} />
                            <Text fontWeight="bold">
                              {currentUser.credits ?? 0}
                            </Text>
                          </HStack>
                        </Badge>
                      )}
                    </HStack>
                  </Box>

                  <Separator />
                </>
              ) : null}

              {/* Navigation Links */}
              <VStack gap={1} align="stretch">
                <NavItem
                  label="Home"
                  onClick={() => handleNavClick("/")}
                  active={isActive("/")}
                />
                <NavItem
                  label="About"
                  onClick={() => handleNavClick("/about")}
                  active={isActive("/about")}
                />
                {currentUser?.token && (
                  <>
                    <NavItem
                      label="My Courses"
                      onClick={() => handleNavClick("/my-courses")}
                      active={isActive("/my-courses")}
                      icon={<BookOpen size={16} />}
                    />
                    <NavItem
                      label="My Tracks"
                      onClick={() => handleNavClick("/my-roadmaps")}
                      active={isActive("/my-roadmaps")}
                      icon={<Map size={16} />}
                    />
                    {isAdmin && (
                      <NavItem
                        label="Admin Panel"
                        onClick={() => handleNavClick("/admin")}
                        active={isActive("/admin")}
                        icon={<Shield size={16} />}
                      />
                    )}
                  </>
                )}
              </VStack>

              {currentUser && <Separator />}

              {/* User Actions */}
              {currentUser ? (
                <VStack gap={1} align="stretch">
                  <NavItem
                    label="My Profile"
                    onClick={() => handleNavClick("/user-info")}
                    icon={<FaUser size={14} />}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    colorPalette="red"
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    justifyContent="flex-start"
                    px={3}
                  >
                    <HStack gap={2}>
                      <FaSignOutAlt size={14} />
                      <Text>Logout</Text>
                    </HStack>
                  </Button>
                </VStack>
              ) : (
                <Button
                  size="md"
                  onClick={() => handleNavClick("/login")}
                  w="full"
                  outline="ghost"
                >
                  <HStack gap={2}>
                    <FaSignInAlt />
                    <Text>Login</Text>
                  </HStack>
                </Button>
              )}

              <Separator />

              {/* Theme Toggle */}
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleColorMode}
                justifyContent="flex-start"
                px={3}
              >
                <HStack gap={2}>
                  {colorMode === "light" ? (
                    <FaMoon size={14} />
                  ) : (
                    <FaSun size={14} />
                  )}
                  <Text>{colorMode === "light" ? "Dark" : "Light"} Mode</Text>
                </HStack>
              </Button>
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      )}
    </Box>
  );
};

export default Header;
