import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import "./tutorialMarkdown.css";
import { Button } from "@chakra-ui/react";
import { RiAiGenerate } from "react-icons/ri";
import CodeBlock from "./CodeBlock.tsx";



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

    useEffect(() => {
        setContent(initialContent ?? null);
    }, [initialContent]);

    const startStreaming = useCallback(async () => {
        if (initialContent) setContent(null);

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!response.body) throw new Error("Stream response has no body.");
            if (!response.ok)
                throw new Error(`Streaming failed with status: ${response.status}`);

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
            setError("Failed to stream content.");
        }
    }, [apiUrl, body]);

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
            <Button variant="ghost" onClick={startStreaming}>
                <RiAiGenerate />
                {content ? "Regenerate" : "Generate"}
            </Button>

            <div className="tutorial-md">
                {error && <p className="error-message">{error}</p>}

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
