// CourseFilterControls.tsx

import {
  HStack,
  VStack,
  Text,
  Button,
  Input,
  Select,
  Portal,
  Icon,
  Badge,
  IconButton,
} from "@chakra-ui/react";
import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { MdFilterList, MdSearch, MdClose } from "react-icons/md";
import React, { useState, useEffect } from "react";

type SortKey = "created" | "modules" | "progress";

interface FilterProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortKey: SortKey;
  setSortKey: (key: SortKey) => void;
  sortAsc: boolean;
  setSortAsc: (asc: boolean) => void;
  sortKeysCollection?: any;
  totalResults?: number;
  filteredResults?: number;
}

const FilterControls: React.FC<FilterProps> = ({
  searchTerm,
  setSearchTerm,
  sortKey,
  setSortKey,
  sortAsc,
  setSortAsc,
  sortKeysCollection,
  totalResults,
  filteredResults,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const hasActiveFilters = searchTerm.length > 0;

  const handleClearAll = () => {
    setSearchTerm("");
  };

  const getCurrentSortLabel = () => {
    if (!sortKeysCollection) return sortKey;
    const item = sortKeysCollection.items.find(
      (item: any) => item.value === sortKey,
    );
    return item?.label || sortKey;
  };

  return (
    <VStack gap={2} align="stretch" w="100%">
      {/* Compact header bar */}
      <HStack gap={2} align="center" justify="space-between" w="100%">
        <HStack gap={2} flex={1}>
          {/* Filter toggle */}
          <IconButton
            size="sm"
            variant={showFilters ? "solid" : "outline"}
            colorScheme={showFilters ? "blue" : "gray"}
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
          >
            <Icon as={MdFilterList} />
          </IconButton>

          {/* Active filters indicator */}
          {hasActiveFilters && (
            <Badge colorScheme="blue" fontSize="xs" px={2}>
              {hasActiveFilters ? 1 : 0}
            </Badge>
          )}

          {/* Quick sort toggle */}
          {!showFilters && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSortAsc(!sortAsc)}
              fontSize="xs"
            >
              <Icon as={sortAsc ? FaSortAmountUp : FaSortAmountDown} />
              {getCurrentSortLabel()}
            </Button>
          )}
        </HStack>

        {/* Results count */}
        <HStack gap={2} fontSize="xs" color="gray.600">
          {filteredResults !== undefined && totalResults !== undefined && (
            <Text fontWeight="medium">
              {filteredResults}
              {filteredResults !== totalResults && ` / ${totalResults}`}
            </Text>
          )}
          {hasActiveFilters && (
            <IconButton
              size="xs"
              variant="ghost"
              colorScheme="red"
              onClick={handleClearAll}
              aria-label="Clear filters"
            >
              <Icon as={MdClose} />
            </IconButton>
          )}
        </HStack>
      </HStack>

      {/* Expanded filter panel */}
      {showFilters && (
        <HStack
          gap={2}
          p={3}
          borderWidth="1px"
          borderRadius="md"
          borderColor="gray.200"
          w="100%"
        >
          {/* Search */}
          <HStack flex={1} gap={2}>
            <Icon as={MdSearch} color="gray.500" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="sm"
              variant="flushed"
              border="none"
            />
          </HStack>

          {/* Sort direction */}
          <IconButton
            size="sm"
            variant="outline"
            onClick={() => setSortAsc(!sortAsc)}
            aria-label={`Sort ${sortAsc ? "ascending" : "descending"}`}
          >
            <Icon as={sortAsc ? FaSortAmountUp : FaSortAmountDown} />
          </IconButton>

          {/* Sort key selector */}
          <Select.Root
            collection={sortKeysCollection}
            onValueChange={(val: any) => setSortKey(val.value[0] as SortKey)}
            value={[sortKey]}
            size="sm"
            width="140px"
          >
            <Select.Trigger borderColor="gray.200">
              <Select.ValueText />
            </Select.Trigger>
            <Portal>
              <Select.Positioner>
                <Select.Content>
                  {sortKeysCollection.items.map((sk: any) => (
                    <Select.Item item={sk} key={sk.value}>
                      {sk.label}
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Portal>
          </Select.Root>
        </HStack>
      )}
    </VStack>
  );
};

export default FilterControls;
