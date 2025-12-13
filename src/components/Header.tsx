import React from "react";
import { Flex, HStack, Button, Avatar, Menu, Float, Circle, Portal } from "@chakra-ui/react";
import { FaHome, FaSignInAlt, FaSun, FaMoon } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { useColorMode } from "./ui/color-mode";
import { FaBook } from "react-icons/fa6";
import { PiPathBold } from "react-icons/pi";
import { Separator } from "@chakra-ui/react"



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
        <Separator size="md" orientation="vertical" height="4" />
        {user?.token && (
          <><Button size="sm" variant="ghost" onClick={() => navigate("/my-courses")}>
            <HStack gap={2}>
              <FaBook />
              <span>My Courses</span>
            </HStack>
          </Button>
            <Separator size="md" orientation="vertical" height="4" />
            <Button size="sm" variant="ghost" onClick={() => navigate("/my-roadmaps")}>
              <HStack gap={2}>
                <PiPathBold />
                <span>My Tracks</span>
              </HStack>
            </Button></>
        )}
      </HStack>

      <HStack gap={3}>
        {user ? (
          <Menu.Root positioning={{ placement: "right-end" }}>
            <Menu.Trigger rounded="full" focusRing="outside">
              <Avatar.Root>
                <Avatar.Fallback name={user.name} />
                <Avatar.Image src={user.avatarUrl || undefined} />
                <Float placement="bottom-end" offsetX="1" offsetY="1">
                  <Circle
                    bg="green.500"
                    size="8px"
                    outline="0.2em solid"
                    outlineColor="bg"
                  />
                </Float>
              </Avatar.Root>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item value="my-profile">
                    My Profile
                  </Menu.Item>
                  <Menu.Item onSelect={logout} value="logout">
                    Logout
                  </Menu.Item>

                </Menu.Content>
              </Menu.Positioner>
            </Portal>
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
