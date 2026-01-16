import { HStack, Tag } from "@chakra-ui/react";
import React from "react";
import { formatStatus } from "../utils/utils";

type TagHandlerProps = {
  status: string;
};

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
        return "red";
      default:
        return "gray";
    }
  };
  return (
    <Tag.Root size="sm" variant="subtle" colorPalette={getTagColor(status)}>
      <HStack>
        <Tag.Label>{formatStatus(status)}</Tag.Label>
      </HStack>
    </Tag.Root>
  );
};

export default TagHandler;
