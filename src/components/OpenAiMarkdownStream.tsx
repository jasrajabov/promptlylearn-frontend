import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import "./tutorialMarkdown.css";
import { Alert, Button, Link, Spinner } from "@chakra-ui/react";
import { RiAiGenerate } from "react-icons/ri";
import CodeBlock from "./CodeBlock.tsx";
import { useColorModeValue } from "../components/ui/color-mode";
import "./LessonCard.css";
import { useUser } from "../contexts/UserContext.tsx";



interface StreamingProps {
    apiUrl: string;
    body: {
        lesson_id: string;
        module_id?: string;
        course_id?: string;
        token?: string;
    };
    content?: string;
}


const OpenAIStreamingMarkdown: React.FC<StreamingProps> = ({
    apiUrl,
    body,
    content: initialContent,
}) => {
    const [content, setContent] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [creditInfo, setCreditInfo] = useState<string | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const { user, refreshUser } = useUser();

    const tealTextColor = useColorModeValue("teal.700", "teal.300");

    console.log("User in OpenAIStreamingMarkdown:", user);

    console.log("Initial content:", initialContent);
    useEffect(() => {
        setContent(initialContent ?? null);
    }, [initialContent]);

    const startStreaming = useCallback(async () => {
        if (initialContent) setContent(null);
        setIsStreaming(true);

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.body) throw new Error("Stream response has no body.");

            // Check for error status codes BEFORE consuming the body
            if (!response.ok) {
                // Now it's safe to parse as JSON since we know it's an error
                const respJson = await response.json();
                console.log("Error response:", respJson);

                if (response.status === 402) {
                    console.error("Not enough credits to generate content.");
                    setCreditInfo(respJson.detail || "Not enough credits");
                    return;
                }

                // Handle other errors
                throw new Error(respJson.detail || `Request failed with status: ${response.status}`);
            }

            // Only read stream if response is OK
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;

            while (!done) {
                const { value, done: readerDone } = await reader.read();
                done = readerDone;

                if (value) {
                    const chunk = decoder.decode(value);
                    setContent((prev) => (prev || "") + chunk);
                }
            }
        } catch (err) {
            console.error("Error during streaming:", err);
            setError(err instanceof Error ? err.message : "Failed to stream content.");
        } finally {
            setIsStreaming(false);
        }
    }, [apiUrl, body, initialContent]);

    const components: Components = {
        code: ({ inline, className, children, ...props }: any) => {
            const lang = className?.replace("language-", "");
            const codeText = String(children).replace(/\n$/, "");

            if (!inline && lang) {
                return <CodeBlock lang={lang} code={codeText} />;
            }

            // Inline code
            return (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
    };
    return (
        <>
            <Button
                variant="outline"
                onClick={startStreaming}
                disabled={isStreaming}
                // className={"glow"}
                // boxShadow={isStreaming ? "0 0 16px rgba(9, 154, 132, 0.45)" : undefined}
                _hover={{ boxShadow: isStreaming ? "0 0 26px rgba(19, 179, 144, 0.6)" : undefined }}
            >
                <Spinner color="teal" size="sm" mr={2} hidden={!isStreaming} />
                <RiAiGenerate />
                {content && !isStreaming ? "Regenerate" : "Generate"}
            </Button>

            <div className="tutorial-md">
                {error && (
                    <Alert.Root status="error">
                        <Alert.Indicator />
                        <Alert.Title>{error}</Alert.Title>
                    </Alert.Root>
                )}
                {creditInfo && (
                    <Alert.Root status="info" width="fit-content" mb={4}>
                        <Alert.Indicator />
                        <Alert.Title>{creditInfo}</Alert.Title>
                        <Link alignSelf="center" fontWeight="medium" href="/upgrade" ml={2} color={tealTextColor}>
                            Upgrade
                        </Link>
                    </Alert.Root>
                )}

                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={components}
                >
                    {content || ""}
                </ReactMarkdown>
            </div>
        </>
    );
};

export default OpenAIStreamingMarkdown;
