import {
    Box,
    HStack,
    VStack,
    Text,
    Avatar,
    IconButton,
    Card,
    Link,
} from "@chakra-ui/react";
import React, {
    forwardRef,
    useState,
    useEffect,
    useRef,
    useImperativeHandle,
} from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { type ChatMessage } from "../types";
import { useUser } from "../contexts/UserContext";
import { useColorModeValue } from "./ui/color-mode";
import {
    X,
    Send,
    Minimize2,
    Maximize2,
    Sparkles,
    Minus,
    Maximize,
} from "lucide-react";

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

interface ChatBoxProps {
    open?: boolean;
    sessionId?: string | null;
    setOpenChatBox?: (open: boolean) => void;
    chatMessages: Array<ChatMessage>;
    setChatMessages: React.Dispatch<React.SetStateAction<Array<ChatMessage>>>;
}

export interface ChatBoxRef {
    sendMessage: (message: string) => Promise<void>;
}

const ChatBox = forwardRef<ChatBoxRef, ChatBoxProps>((props, ref) => {
    const { open, setOpenChatBox, chatMessages, setChatMessages, sessionId } =
        props;

    const [input, setInput] = useState("");
    const [chatReplying, setChatReplying] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const { user } = useUser();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Theme colors
    const borderColor = useColorModeValue("gray.200", "gray.700");
    const headerBg = useColorModeValue("teal.700", "teal.00");
    const userMessageBg = useColorModeValue("teal.500", "teal.600");
    const assistantMessageBg = useColorModeValue("gray.100", "gray.800");
    const inputBg = useColorModeValue("gray.50", "gray.800");
    const inputBorder = useColorModeValue("gray.300", "gray.600");
    const shadowColor = useColorModeValue(
        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
    );

    const TypingIndicator: React.FC = () => {
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
        if (open && !chatReplying && !isMinimized) {
            inputRef.current?.focus();
        }
    }, [open, chatReplying, isMinimized]);

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const sendMessage = async (messageText: string) => {
        const trimmedInput = messageText.trim();
        if (!trimmedInput || chatReplying) {
            return;
        }


        const newUserMessage: ChatMessage = {
            role: "user",
            content: trimmedInput,
            timestamp: new Date(),
        };

        setChatMessages((prev) => [...prev, newUserMessage]);
        setInput("");

        try {
            setChatReplying(true);

            const res = await fetch(`${BACKEND_URL}/chat/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    session_id: sessionId,
                    message: trimmedInput,
                }),
            });

            const { task_id } = await res.json();

            if (task_id) {
                pollTask(task_id);
            } else {
                setChatReplying(false);
            }
        } catch (error) {
            console.error("❌ Error sending message:", error);
            setChatReplying(false);
        }
    };

    const pollTask = (taskId: string) => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(
                    `${BACKEND_URL}/tasks/status/chat_stream/${taskId}`,
                );
                const data = await res.json();

                if (data.status === "ready") {
                    const newAssistantMessage: ChatMessage = {
                        role: "assistant",
                        content: data.reply,
                        timestamp: new Date(),
                    };

                    setChatMessages((prev) => [...prev, newAssistantMessage]);
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

    useImperativeHandle(
        ref,
        () => ({
            sendMessage: async (message: string) => {
                await sendMessage(message);
            },
        }),
        [chatReplying, sessionId],
    );

    const prismStyle: { [key: string]: React.CSSProperties } = oneDark;
    const components: Components = {
        code: ({ className, children, ...props }) => {
            const lang = className?.replace("language-", "");

            if (lang) {
                return (
                    <Box borderRadius="md" overflow="hidden" my={2} maxW="100%">
                        <Box
                            overflowX="auto"
                            css={{
                                "&::-webkit-scrollbar": {
                                    height: "6px",
                                },
                                "&::-webkit-scrollbar-track": {
                                    background: "#1e1e1e",
                                },
                                "&::-webkit-scrollbar-thumb": {
                                    background: "#4a5568",
                                    borderRadius: "3px",
                                },
                            }}
                        >
                            <SyntaxHighlighter
                                style={prismStyle}
                                language={lang}
                                PreTag="div"
                                customStyle={{
                                    margin: 0,
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                }}
                                wrapLongLines={false}
                            >
                                {String(children).replace(/\n$/, "")}
                            </SyntaxHighlighter>
                        </Box>
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
                        color: "#d63384",
                        wordBreak: "break-word",
                    }}
                    {...props}
                >
                    {children}
                </code>
            );
        },
        p: ({ children }) => (
            <Text
                mb={2}
                lineHeight="1.6"
                wordBreak="break-word"
                whiteSpace="pre-wrap"
            >
                {children}
            </Text>
        ),
        ul: ({ children }) => (
            <Box
                as="ul"
                pl={4}
                mb={2}
                css={{
                    "& li": {
                        wordBreak: "break-word",
                        marginBottom: "0.25rem",
                    },
                }}
            >
                {children}
            </Box>
        ),
        ol: ({ children }) => (
            <Box
                as="ol"
                pl={4}
                mb={2}
                css={{
                    "& li": {
                        wordBreak: "break-word",
                        marginBottom: "0.25rem",
                    },
                }}
            >
                {children}
            </Box>
        ),
        a: ({ href, children }) => (
            <Link
                href={href}
                color="teal.400"
                textDecoration="underline"
                wordBreak="break-all"
                _hover={{ color: "teal.300" }}
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
            </Link>
        ),
        pre: ({ children }) => (
            <Box as="pre" maxW="100%" overflowX="auto" my={2}>
                {children}
            </Box>
        ),
        table: ({ children }) => (
            <Box overflowX="auto" my={2} maxW="100%">
                <Box
                    as="table"
                    width="full"
                    fontSize="sm"
                    css={{
                        "& th, & td": {
                            padding: "8px",
                            borderWidth: "1px",
                            borderColor: "#e2e8f0",
                        },
                        "& th": {
                            backgroundColor: "#f7fafc",
                            fontWeight: "semibold",
                        },
                    }}
                >
                    {children}
                </Box>
            </Box>
        ),
        blockquote: ({ children }) => (
            <Box
                as="blockquote"
                borderLeftWidth="3px"
                borderLeftColor="teal.400"
                pl={3}
                py={1}
                my={2}
                fontStyle="italic"
                color="gray.600"
                _dark={{ color: "gray.400" }}
            >
                {children}
            </Box>
        ),
        h1: ({ children }) => (
            <Text as="h1" fontSize="xl" fontWeight="bold" mt={3} mb={2}>
                {children}
            </Text>
        ),
        h2: ({ children }) => (
            <Text as="h2" fontSize="lg" fontWeight="bold" mt={3} mb={2}>
                {children}
            </Text>
        ),
        h3: ({ children }) => (
            <Text as="h3" fontSize="md" fontWeight="semibold" mt={2} mb={1}>
                {children}
            </Text>
        ),
    };

    if (!open) return null;

    return (
        <Box
            position="fixed"
            bottom={4}
            right={4}
            zIndex={1000}
            w={
                isExpanded
                    ? { base: "95vw", md: "600px", lg: "700px" }
                    : { base: "95vw", md: "420px" }
            }
            h={
                isMinimized
                    ? "auto"
                    : isExpanded
                        ? "85vh"
                        : { base: "600px", md: "650px" }
            }
            transition="all 0.3s ease"
        >
            <Card.Root
                // bg={bgColor}
                borderRadius="xl"
                overflow="hidden"
                boxShadow={shadowColor}
                borderWidth="1px"
                borderColor={borderColor}
                h="full"
                display="flex"
                flexDirection="column"
            >
                {/* Header */}
                <Box
                    bg={headerBg}
                    color="white"
                    px={4}
                    py={3}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <HStack gap={3}>
                        <Box position="relative">
                            <Avatar.Root size="sm">
                                {/* <Avatar.Image src={aiBuddy} alt="AI Buddy" /> */}
                                <Avatar.Fallback>AI</Avatar.Fallback>
                            </Avatar.Root>
                        </Box>
                        <VStack align="start" gap={0}>
                            <Text fontWeight="semibold" fontSize="md">
                                AI Buddy
                            </Text>
                            <HStack gap={1}>
                                <Box w="6px" h="6px" bg="green.300" borderRadius="full" />
                                <Text fontSize="xs" opacity={0.9}>
                                    Online
                                </Text>
                            </HStack>
                        </VStack>
                    </HStack>

                    <HStack gap={1}>
                        <IconButton
                            aria-label="Toggle expand"
                            size="sm"
                            variant="ghost"
                            color="white"
                            _hover={{ bg: "whiteAlpha.200" }}
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                        </IconButton>
                        <IconButton
                            aria-label="Minimize"
                            size="sm"
                            variant="ghost"
                            color="white"
                            _hover={{ bg: "whiteAlpha.200" }}
                            onClick={() => setIsMinimized(!isMinimized)}
                        >
                            {!isMinimized ? <Minus size={16} /> : <Maximize size={16} />}
                        </IconButton>
                        <IconButton
                            aria-label="Close"
                            size="sm"
                            variant="ghost"
                            color="white"
                            _hover={{ bg: "whiteAlpha.200" }}
                            onClick={() => setOpenChatBox && setOpenChatBox(false)}
                        >
                            <X size={16} />
                        </IconButton>
                    </HStack>
                </Box>

                {/* Messages Area */}
                {!isMinimized && (
                    <>
                        <Box
                            flex="1"
                            overflowY="auto"
                            p={4}
                            css={{
                                "&::-webkit-scrollbar": {
                                    width: "6px",
                                },
                                "&::-webkit-scrollbar-track": {
                                    background: "transparent",
                                },
                                "&::-webkit-scrollbar-thumb": {
                                    background: "#cbd5e0",
                                    borderRadius: "3px",
                                },
                                "&::-webkit-scrollbar-thumb:hover": {
                                    background: "#a0aec0",
                                },
                            }}
                        >
                            <VStack gap={4} align="stretch">
                                {/* Welcome Message */}
                                {chatMessages.length <= 1 && (
                                    <Box
                                        p={4}
                                        bg={useColorModeValue("teal.50", "teal.900/20")}
                                        borderRadius="lg"
                                        borderWidth="1px"
                                        borderColor={useColorModeValue("teal.200", "teal.700")}
                                    >
                                        <HStack gap={2} mb={2}>
                                            <Sparkles size={18} color="#319795" />
                                            <Text
                                                fontWeight="semibold"
                                                color={useColorModeValue("teal.700", "teal.300")}
                                            >
                                                Welcome to AI Buddy!
                                            </Text>
                                        </HStack>
                                        <Text
                                            fontSize="sm"
                                            color={useColorModeValue("gray.600", "gray.400")}
                                        >
                                            I'm here to help you understand the course material
                                            better. Feel free to ask me anything!
                                        </Text>
                                    </Box>
                                )}

                                {chatMessages.map((m, i) => (
                                    <HStack
                                        key={i}
                                        align="start"
                                        justify={m.role === "user" ? "flex-end" : "flex-start"}
                                        gap={2}
                                    >
                                        {m.role === "assistant" && (
                                            <Avatar.Root size="xs" flexShrink={0} mt={1}>
                                                {/* <Avatar.Image src={aiBuddy} alt="AI" /> */}
                                                <Avatar.Fallback>AI</Avatar.Fallback>
                                            </Avatar.Root>
                                        )}

                                        <VStack
                                            align={m.role === "user" ? "flex-end" : "flex-start"}
                                            gap={1}
                                            maxW="80%"
                                        >
                                            <Box
                                                bg={
                                                    m.role === "user" ? userMessageBg : assistantMessageBg
                                                }
                                                color={m.role === "user" ? "white" : undefined}
                                                px={4}
                                                py={2.5}
                                                borderRadius="2xl"
                                                borderTopLeftRadius={
                                                    m.role === "assistant" ? "md" : "2xl"
                                                }
                                                borderTopRightRadius={m.role === "user" ? "md" : "2xl"}
                                                boxShadow="sm"
                                                wordBreak="break-word"
                                                overflowWrap="break-word"
                                                maxW="100%"
                                                css={{
                                                    "& *": {
                                                        maxWidth: "100%",
                                                    },
                                                }}
                                            >
                                                <ReactMarkdown components={components}>
                                                    {m.content || ""}
                                                </ReactMarkdown>
                                            </Box>
                                            <Text fontSize="2xs" color="gray.500" px={2}>
                                                {formatTime(m.timestamp)}
                                            </Text>
                                        </VStack>

                                        {m.role === "user" && (
                                            <Avatar.Root size="xs" flexShrink={0} mt={1}>
                                                <Avatar.Image src="/user-avatar.png" alt="You" />
                                                <Avatar.Fallback>
                                                    {user?.name?.[0] || "U"}
                                                </Avatar.Fallback>
                                            </Avatar.Root>
                                        )}
                                    </HStack>
                                ))}

                                {/* Typing Indicator */}
                                {chatReplying && (
                                    <HStack align="start" gap={2}>
                                        <Avatar.Root size="xs" flexShrink={0} mt={1}>
                                            {/* <Avatar.Image src={aiBuddy} alt="AI" /> */}
                                            <Avatar.Fallback>AI</Avatar.Fallback>
                                        </Avatar.Root>
                                        <Box
                                            bg={assistantMessageBg}
                                            px={4}
                                            py={2.5}
                                            borderRadius="2xl"
                                            borderTopLeftRadius="md"
                                            boxShadow="sm"
                                        >
                                            <TypingIndicator />
                                        </Box>
                                    </HStack>
                                )}

                                <div ref={messagesEndRef} />
                            </VStack>
                        </Box>

                        {/* Input Area */}
                        <Box
                            borderTop="1px solid"
                            borderColor={borderColor}
                            p={4}
                        >
                            <VStack gap={2}>
                                <HStack gap={2} w="full">
                                    <Box flex="1" position="relative">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Type your message..."
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    sendMessage(input);
                                                }
                                            }}
                                            disabled={chatReplying}
                                            rows={1}
                                            style={{
                                                width: "100%",
                                                padding: "12px 16px",
                                                paddingRight: "50px",
                                                borderRadius: "12px",
                                                border: `2px solid ${inputBorder}`,
                                                fontSize: "14px",
                                                fontFamily: "inherit",
                                                resize: "none",
                                                minHeight: "48px",
                                                maxHeight: "120px",
                                                overflowY: "auto",
                                                transition: "all 0.2s",
                                                background: inputBg,
                                            }}
                                            onFocus={(e) => {
                                                e.target.style.borderColor = "#319795";
                                                e.target.style.outline = "none";
                                            }}
                                            onBlur={(e) => {
                                                e.target.style.borderColor = inputBorder;
                                            }}
                                            onInput={(e) => {
                                                const target = e.target as HTMLTextAreaElement;
                                                target.style.height = "auto";
                                                target.style.height =
                                                    Math.min(target.scrollHeight, 120) + "px";
                                            }}
                                        />
                                        <IconButton
                                            aria-label="Send message"
                                            position="absolute"
                                            right={2}
                                            bottom={3}
                                            size="sm"
                                            colorPalette="teal"
                                            onClick={() => sendMessage(input)}
                                            disabled={!input.trim() || chatReplying}
                                            borderRadius="lg"
                                        >
                                            <Send size={16} />
                                        </IconButton>
                                    </Box>
                                </HStack>
                                <Text fontSize="2xs" color="gray.500" textAlign="center">
                                    Press Enter to send • Shift + Enter for new line
                                </Text>
                            </VStack>
                        </Box>
                    </>
                )}
            </Card.Root>
        </Box>
    );
});

ChatBox.displayName = "ChatBox";

export default ChatBox;
