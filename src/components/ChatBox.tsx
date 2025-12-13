import { Box, Button, CloseButton, Drawer, HStack, Input, Portal, VStack, Text, Avatar, Heading } from "@chakra-ui/react";
import React, { useState, useEffect, useRef } from "react";
import aiBuddy from "../assets/ai-buddy.png";
import ReactMarkdown, { type Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { type ChatMessage } from "../types";

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

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const TypingIndicator: React.FC = () => {
        const [dots, setDots] = useState(0);
        useEffect(() => {
            const id = window.setInterval(() => setDots(d => (d + 1) % 4), 400);
            return () => clearInterval(id);
        }, []);
        return <Text fontSize="sm" color="gray.500">AI is thinking{".".repeat(dots)}</Text>;
    };

    // Auto-scroll effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, chatReplying]);

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const sendMessage = async (input: string) => {
        const newUserMessage: ChatMessage = {
            role: "user",
            content: input,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, newUserMessage]);
        setInput("");

        // ... (Existing backend communication logic)
        const res = await fetch(`${BACKEND_URL}/api/chat/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: sessionId,
                message: input
            })
        });

        const { task_id } = await res.json();

        if (task_id) {
            setChatReplying(true);
            pollTask(task_id);
        } else {
            setChatReplying(false);
        }
    };

    const pollTask = (taskId: string) => {
        const interval = setInterval(async () => {
            const res = await fetch(`${BACKEND_URL}/task-status/chat_stream/${taskId}`);
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
        }, 1000);
    };

    const prismStyle: { [key: string]: React.CSSProperties } = oneDark;
    const components: Components = {
        code: ({ className, children, ...props }) => {
            const lang = className?.replace("language-", "");

            // Normal code blocks
            if (lang) {
                return (
                    <SyntaxHighlighter
                        style={prismStyle}
                        language={lang}
                        PreTag="div"
                    >
                        {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                );
            }

            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
    };

    return (
        <Drawer.Root open={open} size="lg" closeOnInteractOutside={true} onInteractOutside={() => setOpenChatBox && setOpenChatBox(false)}>
            <Drawer.Trigger asChild></Drawer.Trigger>
            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content>
                        {/* Custom Header emphasizing 'Course Clarification' */}
                        <Drawer.Header borderBottom="1px solid lightgray" p={4}>
                            <Heading size="md">Ask your AI Buddy</Heading>
                        </Drawer.Header>
                        <Drawer.CloseTrigger asChild>
                            <CloseButton
                                size="sm"
                                onClick={() => setOpenChatBox && setOpenChatBox(false)}
                                position="absolute"
                                right={4}
                                top={4}
                            />
                        </Drawer.CloseTrigger>

                        <Drawer.Body p={0} overflow="hidden">
                            <VStack
                                gap={5}
                                align="stretch"
                                p={4}
                                height="75vh"
                                overflowY="auto"
                            >
                                {chatMessages.map((m, i) => (
                                    <VStack
                                        key={i}
                                        align={m.role === "user" ? "flex-end" : "flex-start"}
                                        gap={1}
                                    >
                                        {/* Avatar and Time Row */}
                                        <HStack
                                            justifyContent={m.role === "user" ? "flex-end" : "flex-start"}
                                            width="full"
                                            px={1}
                                        >
                                            {m.role === "assistant" && (
                                                <>
                                                    <Avatar.Root>
                                                        <Avatar.Image src={aiBuddy} alt="AI Buddy" />
                                                        <Avatar.Fallback>AI</Avatar.Fallback>
                                                    </Avatar.Root>
                                                    <Text fontSize="xs" color="gray.500">AI Buddy</Text>
                                                </>
                                            )}
                                            {m.role === "user" && (
                                                <>
                                                    <Text fontSize="xs" color="gray.500">You</Text>
                                                    <Avatar.Root>
                                                        <Avatar.Image src="/user-avatar.png" alt="You" />
                                                        <Avatar.Fallback>You</Avatar.Fallback>
                                                    </Avatar.Root>
                                                </>
                                            )}
                                        </HStack>

                                        <Box
                                            maxW="90%"
                                            p={4}
                                        >
                                            <ReactMarkdown
                                                // remarkPlugins={[remarkGfm]}
                                                components={components}
                                            >
                                                {m.content || ""}
                                            </ReactMarkdown>
                                            <Text
                                                fontSize="xs"
                                                mt={2}
                                                textAlign={m.role === "user" ? "left" : "right"}
                                                color="gray.500"
                                            >
                                                {formatTime(m.timestamp)}
                                            </Text>
                                        </Box>
                                    </VStack>
                                ))}

                                {/* Typing Indicator Block */}
                                {chatReplying && (
                                    <VStack align="flex-start" gap={1}>
                                        <HStack px={1}>
                                            <Avatar.Root>
                                                <Avatar.Image src={aiBuddy} alt="AI Buddy" />
                                                <Avatar.Fallback>AI</Avatar.Fallback>
                                            </Avatar.Root>
                                            <Text fontSize="xs" color="gray.500">AI Buddy</Text>
                                        </HStack>
                                        <Box
                                            maxW="90%"
                                            // bg="gray.100"
                                            p={4}
                                            borderRadius="lg"
                                            boxShadow="sm"
                                        >
                                            <TypingIndicator />
                                        </Box>
                                    </VStack>
                                )}
                                {/* Scroll Anchor */}
                                <div ref={messagesEndRef} />
                            </VStack>

                            {/* Input Area */}
                            <Box borderTop="1px solid lightgray" p={4}>
                                <HStack>
                                    <Input
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        placeholder="Type your clarification question here..."
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && input.trim() && !chatReplying) {
                                                sendMessage(input);
                                            }
                                        }}
                                        disabled={chatReplying}
                                        borderColor="gray.300"
                                    // focusBorderColor="teal.500"
                                    />
                                    <Button
                                        onClick={() => sendMessage(input)}
                                        colorScheme="teal"
                                        disabled={!input.trim() || chatReplying}
                                    >
                                        Ask
                                    </Button>
                                </HStack>
                            </Box>

                        </Drawer.Body>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root >
    );
}

export default ChatBox;