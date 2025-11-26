
import { HStack, Spinner, Tag } from "@chakra-ui/react";
import React from "react";
import { formatStatus } from "../utils/utils";

type TagHandlerProps = {
    status: string;
}

const TagHandler: React.FC<TagHandlerProps> = ({ status }) => {

    const getTagColor = (status: string) => {
        switch (status) {
            case "NOT_STARTED":
                return "yellow";
            case "IN_PROGRESS":
                return "blue";
            case "COMPLETED":
                return "green";
            case "GENERATING":
                return "purple";
            case "FAILED":
                return "red"
            default:
                return "gray";
        }
    };
    return (
        <Tag.Root size="sm" variant="solid" colorPalette={getTagColor(status)}>
            <HStack>
                <Tag.Label>{formatStatus(status)}</Tag.Label>
                <Spinner
                    ml={2}
                    display={status === "GENERATING" ? "inline-block" : "none"}
                    size="sm"
                />
            </HStack>

        </Tag.Root>
    );
}

export default TagHandler;