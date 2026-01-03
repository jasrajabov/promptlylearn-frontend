import { Box, Button, CloseButton, Drawer, HStack, Input, Portal, VStack, Text, Avatar, Heading, Badge, Status } from "@chakra-ui/react";
import React, { useState, useEffect, useRef } from "react";
import aiBuddy from "../assets/ai-buddy.png";
import ReactMarkdown, { type Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { type ChatMessage } from "../types";
import { useUser } from "../contexts/UserContext";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface ChatBoxProps {
    open?: boolean;
    setOpenChatBox?: (open: boolean) => void;
    chatMessages: Array<ChatMessage>;
    setChatMessages: React.Dispatch<React.SetStateAction<Array<ChatMessage>>>;
}

const ChatBox: React.FC<ChatBoxProps> = ({ open, setOpenChatBox, chatMessages, setChatMessages }) => {
    const [input, setInput] = useState("");
    const [sessionId] = useState(() => crypto.randomUUID());
    const [chatReplying, setChatReplying] = useState(false);
    const { user } = useUser();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const TypingIndicator: React.FC = () => {
        const [dots, setDots] = useState(0);
        useEffect(() => {
            const id = window.setInterval(() => setDots(d => (d + 1) % 4), 400);
            return () => clearInterval(id);
        }, []);
        return (
            <HStack gap={1}>
                <Box
                    w="8px"
                    h="8px"
                    bg="gray.400"
                    borderRadius="full"
                    animation="pulse 1.4s ease-in-out infinite"
                />
                <Box
                    w="8px"
                    h="8px"
                    bg="gray.400"
                    borderRadius="full"
                    animation="pulse 1.4s ease-in-out 0.2s infinite"
                />
                <Box
                    w="8px"
                    h="8px"
                    bg="gray.400"
                    borderRadius="full"
                    animation="pulse 1.4s ease-in-out 0.4s infinite"
                />
            </HStack>
        );
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, chatReplying]);

    useEffect(() => {
        if (open && !chatReplying) {
            inputRef.current?.focus();
        }
    }, [open, chatReplying]);

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const sendMessage = async (input: string) => {
        const trimmedInput = input.trim();
        if (!trimmedInput || chatReplying) return;

        const newUserMessage: ChatMessage = {
            role: "user",
            content: trimmedInput,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, newUserMessage]);
        setInput("");

        try {
            const res = await fetch(`${BACKEND_URL}/chat/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: trimmedInput
                })
            });

            const { task_id } = await res.json();

            if (task_id) {
                setChatReplying(true);
                pollTask(task_id);
            } else {
                setChatReplying(false);
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setChatReplying(false);
        }
    };

    const pollTask = (taskId: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${BACKEND_URL}/tasks/status/chat_stream/${taskId}`);
                const data = await res.json();

                if (data.status === "ready") {
                    const newAssistantMessage: ChatMessage = {
                        role: "assistant",
                        content: data.reply,
                        timestamp: new Date()
                    };

                    setChatMessages(prev => [...prev, newAssistantMessage]);
                    setChatReplying(false);
                    clearInterval(interval);
                }
            } catch (error) {
                console.error("Error polling task:", error);
                setChatReplying(false);
                clearInterval(interval);
            }
        }, 1000);
    };

    const prismStyle: { [key: string]: React.CSSProperties } = oneDark;
    const components: Components = {
        code: ({ className, children, ...props }) => {
            const lang = className?.replace("language-", "");

            if (lang) {
                return (
                    <Box borderRadius="md" overflow="hidden" my={2}>
                        <SyntaxHighlighter
                            style={prismStyle}
                            language={lang}
                            PreTag="div"
                        >
                            {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                    </Box>
                );
            }

            return (
                <code
                    style={{
                        backgroundColor: "#f7fafc",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontSize: "0.9em",
                        color: "#d63384"
                    }}
                    {...props}
                >
                    {children}
                </code>
            );
        },
        p: ({ children }) => <Text mb={2}>{children}</Text>,
        ul: ({ children }) => <Box as="ul" pl={4} mb={2}>{children}</Box>,
        ol: ({ children }) => <Box as="ol" pl={4} mb={2}>{children}</Box>,
    };

    return (
        <Drawer.Root
            open={open}
            size="lg"
            closeOnInteractOutside={true}
            onInteractOutside={() => setOpenChatBox && setOpenChatBox(false)}
        >
            <Drawer.Trigger asChild></Drawer.Trigger>
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content boxShadow="2xl">
                        <Drawer.Header
                            borderBottom="1px solid"
                            borderColor="gray.200"
                            p={5}
                            bg="gradient-to-r from-teal.50 to-blue.50"
                        >
                            <VStack align="flex-start" gap={1}>
                                <HStack>
                                    <Heading size="lg" >AI Buddy</Heading>

                                </HStack>
                                <Text fontSize="sm">
                                    Ask questions and get instant clarification
                                </Text>
                            </VStack>
                        </Drawer.Header>

                        <Drawer.CloseTrigger asChild>
                            <CloseButton
                                size="md"
                                onClick={() => setOpenChatBox && setOpenChatBox(false)}
                                position="absolute"
                                right={5}
                                top={5}
                                _hover={{ bg: "gray.100" }}
                            />
                        </Drawer.CloseTrigger>

                        <Drawer.Body p={0} overflow="hidden">
                            <VStack
                                gap={4}
                                align="stretch"
                                p={5}
                                height="calc(75vh - 80px)"
                                overflowY="auto"
                                css={{
                                    '&::-webkit-scrollbar': {
                                        width: '8px',
                                    },
                                    '&::-webkit-scrollbar-track': {
                                        background: '#f1f1f1',
                                    },
                                    '&::-webkit-scrollbar-thumb': {
                                        background: '#cbd5e0',
                                        borderRadius: '4px',
                                    },
                                    '&::-webkit-scrollbar-thumb:hover': {
                                        background: '#a0aec0',
                                    },
                                }}
                            >
                                {chatMessages.map((m, i) => (
                                    <VStack
                                        key={i}
                                        align={m.role === "user" ? "flex-end" : "flex-start"}
                                        gap={2}
                                    >
                                        <HStack
                                            justifyContent={m.role === "user" ? "flex-end" : "flex-start"}
                                            width="full"
                                            gap={2}
                                        >
                                            {m.role === "assistant" && (
                                                <>
                                                    <Avatar.Root size="sm">
                                                        <Avatar.Image src={aiBuddy} alt="AI Buddy" />
                                                        <Avatar.Fallback>AI</Avatar.Fallback>
                                                    </Avatar.Root>

                                                    <VStack align="flex-start" gap={0}>
                                                        <HStack>
                                                            <Text fontSize="sm" fontWeight="600">
                                                                AI Buddy
                                                            </Text>
                                                            <Status.Root colorPalette="green">
                                                                <Status.Indicator />
                                                            </Status.Root>
                                                        </HStack>
                                                        <Text fontSize="xs">
                                                            {formatTime(m.timestamp)}
                                                        </Text>
                                                    </VStack>
                                                </>
                                            )}
                                            {m.role === "user" && (
                                                <>
                                                    <VStack align="flex-end" gap={0}>
                                                        <Text fontSize="xs" color="gray.400">
                                                            {formatTime(m.timestamp)}
                                                        </Text>
                                                    </VStack>
                                                    <Avatar.Root size="sm">
                                                        <Avatar.Image src="/user-avatar.png" alt="You" />
                                                        <Avatar.Fallback>{user?.name}</Avatar.Fallback>
                                                    </Avatar.Root>
                                                </>
                                            )}
                                        </HStack>

                                        <Box
                                            maxW="85%"
                                            bg={m.role === "user" ? "teal.500" : "gray.300"}
                                            color={m.role === "user" ? "white" : "gray.800"}
                                            px={4}
                                            py={3}
                                            borderRadius="xl"
                                            boxShadow="sm"
                                            border={m.role === "assistant" ? "1px solid" : "none"}
                                            borderColor={m.role === "assistant" ? "gray.200" : "transparent"}
                                        >
                                            <ReactMarkdown components={components}>
                                                {m.content || ""}
                                            </ReactMarkdown>
                                        </Box>
                                    </VStack>
                                ))}

                                {chatReplying && (
                                    <VStack align="flex-start" gap={2}>
                                        <HStack gap={2}>
                                            <Avatar.Root size="sm">
                                                <Avatar.Image src={aiBuddy} alt="AI Buddy" />
                                                <Avatar.Fallback>AI</Avatar.Fallback>
                                            </Avatar.Root>
                                            <VStack align="flex-start" gap={0}>
                                                <Text fontSize="sm" fontWeight="600">
                                                    AI Buddy
                                                </Text>
                                                <Text fontSize="xs">
                                                    typing...
                                                </Text>
                                            </VStack>
                                        </HStack>
                                        <Box
                                            maxW="85%"
                                            px={4}
                                            py={3}
                                            borderRadius="xl"
                                            boxShadow="sm"
                                            border="1px solid"
                                            borderColor="gray.200"
                                        >
                                            <TypingIndicator />
                                        </Box>
                                    </VStack>
                                )}
                                <div ref={messagesEndRef} />
                            </VStack>

                        </Drawer.Body>

                        <Box
                            borderTop="1px solid"
                            borderColor="gray.200"
                            p={5}
                            boxShadow="0 -2px 10px rgba(0,0,0,0.05)"
                        >
                            <HStack gap={3} align="flex-end">
                                <Box flex="1">
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Type your message here..."
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                sendMessage(input);
                                            }
                                        }}
                                        disabled={chatReplying}
                                        rows={1}
                                        style={{
                                            width: '100%',
                                            padding: '12px 16px',
                                            borderRadius: '8px',
                                            border: '1px solid #CBD5E0',
                                            fontSize: '16px',
                                            fontFamily: 'inherit',
                                            resize: 'none',
                                            minHeight: '48px',
                                            maxHeight: '120px',
                                            overflowY: 'auto',
                                            transition: 'border-color 0.2s, box-shadow 0.2s',
                                            background: "transparent",
                                        }}
                                        onFocus={(e) => {
                                            e.target.style.borderColor = '#319795';
                                            e.target.style.outline = 'none';
                                            e.target.style.boxShadow = '0 0 0 1px #319795';
                                        }}
                                        onBlur={(e) => {
                                            e.target.style.borderColor = '#CBD5E0';
                                            e.target.style.boxShadow = 'none';
                                        }}
                                        onInput={(e) => {
                                            const target = e.target as HTMLTextAreaElement;
                                            target.style.height = 'auto';
                                            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                                        }}
                                    />
                                </Box>
                                <Button
                                    size="lg"
                                    onClick={() => sendMessage(input)}
                                    variant={"solid"}
                                    disabled={!input.trim() || chatReplying}
                                    // height="55px"
                                    px={8}
                                    borderRadius="lg"
                                    flexShrink={0}
                                    _hover={{ transform: "translateY(-1px)", boxShadow: "md" }}
                                    transition="all 0.2s"
                                    mb="7px"
                                >
                                    {chatReplying ? "Sending..." : "Send"}
                                </Button>
                            </HStack>
                            <Text fontSize="xs" color="gray.400" mt={2} textAlign="center">
                                Press Enter to send • Shift + Enter for new line
                            </Text>
                        </Box>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root >
    );
}

export default ChatBox;