import React, { useEffect, useState, useCallback, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMermaid from "remark-mermaidjs";
import mermaid from "mermaid";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./tutorialMarkdown.css";
import { Button } from "@chakra-ui/react";
import { RiAiGenerate } from "react-icons/ri";

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

// Mermaid renderer component
function MermaidChart({ code }: { code: string }) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        mermaid.initialize({ startOnLoad: false, theme: "default" });

        if (ref.current) {
            const id = "m-" + Math.floor(Math.random() * 100000);

            mermaid
                .render(id, code)
                .then(({ svg }) => {
                    ref.current!.innerHTML = svg;
                })
                .catch((err) => {
                    ref.current!.innerHTML = `<pre style="color:red;">${String(err)}</pre>`;
                });
        }
    }, [code]);

    return <div ref={ref} className="mermaid" />;
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

    const prismStyle: { [key: string]: React.CSSProperties } = oneDark as any;

    const components: Components = {
        code: ({ inline, className, children, ...props }: any) => {
            const lang = className?.replace("language-", "");

            // MERMAID support
            if (lang === "mermaid") {
                return <MermaidChart code={String(children)} />;
            }

            // Normal code blocks
            if (!inline && lang) {
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
    console.log("Rendering content:", content);
    return (
        <>
            <Button variant="ghost" onClick={startStreaming}>
                <RiAiGenerate />
                {content ? "Regenerate" : "Generate"}
            </Button>

            <div className="tutorial-md">
                {error && <p className="error-message">{error}</p>}

                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMermaid]}
                    components={components}
                >
                    {content || ""}
                </ReactMarkdown>
            </div>
        </>
    );
};

export default OpenAIStreamingMarkdown;
