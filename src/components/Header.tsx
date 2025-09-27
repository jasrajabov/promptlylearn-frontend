import React from "react";
import { Flex, HStack, Button, Avatar, Menu } from "@chakra-ui/react";
import { FaHome, FaSignInAlt, FaSun, FaMoon } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useColorMode } from "./ui/color-mode";

const Header: React.FC = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const { user, logout } = useUser();
  const navigate = useNavigate();
  console.log("Header user:", user);
  return (
    <Flex justify="space-between" p={2} w="100%" align="center">
      <HStack gap={2}>
        <Button size="sm" variant="ghost" onClick={() => navigate("/")}>
          <HStack gap={2}>
            <FaHome />
            <span>Home</span>
          </HStack>
        </Button>
        <Button size="sm" variant="ghost" onClick={() => navigate("/my-courses")}>
          <HStack gap={2}>
            <span>My Courses</span>
          </HStack>
        </Button>
      </HStack>

      <HStack gap={3}>
        {user ? (
          <Menu.Root>
            <Menu.Trigger asChild>
              <Button variant="ghost">
                <HStack gap={2}>
                  <Avatar.Root>
                    <Avatar.Image src={user.avatarUrl || undefined} />
                    <span>{user.name}</span>
                  </Avatar.Root>
                </HStack>
              </Button>
            </Menu.Trigger>
            <Menu.Content>
              <Menu.Item onSelect={logout} value="logout">
                Logout
              </Menu.Item>
            </Menu.Content>
          </Menu.Root>
        ) : (
          <Button variant="ghost" onClick={() => navigate("/login")}>
            <HStack gap={2}>
              <FaSignInAlt />
              <span>Login</span>
            </HStack>
          </Button>
        )}

        <Button variant="ghost" onClick={toggleColorMode}>
          {colorMode === "light" ? <FaMoon /> : <FaSun />}
        </Button>
      </HStack>
    </Flex>
  );
};

export default Header;
