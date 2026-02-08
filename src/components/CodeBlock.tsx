import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@chakra-ui/react";
import { MdContentCopy } from "react-icons/md";
import { IoMdCheckmark } from "react-icons/io";

const CodeBlock: React.FC<{ lang: string; code: string }> = ({
  lang,
  code,
}) => {
  const prismStyle: { [key: string]: React.CSSProperties } = oneDark;
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: "relative", marginBottom: "1.5em", marginTop: "1.5em" }}>
      <Button
        size="xs"
        position="absolute"
        top="8px"
        right="8px"
        zIndex={1}
        onClick={copyToClipboard}
        color="gray.300"
        style={{ background: "transparent" }}
      >
        {copied ? <IoMdCheckmark /> : <MdContentCopy />}
        {copied ? "Copied!" : "Copy"}
      </Button>

      <SyntaxHighlighter
        style={prismStyle}
        language={lang}
        PreTag="div"
        customStyle={{
          margin: 0,
          padding: "16px",
          borderRadius: "8px",
          border: "none",
          outline: "none",
          boxShadow: "none",
        }}
        codeTagProps={{
          style: {
            border: "none",
            outline: "none",
            boxShadow: "none",
            background: "transparent",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;