// CourseFilterControls.tsx

import {
    HStack,
    VStack,
    Text,
    Button,
    Input,
    Select,
    Portal,
    Collapsible,
    Icon,
} from "@chakra-ui/react";
import { FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import { MdFilterList, MdFilterListOff } from "react-icons/md";
import React, { useState } from "react";

// Define the shape of the sort key
type SortKey = "created" | "modules" | "progress";

// Define the props for the new component
interface FilterProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    sortKey: SortKey;
    setSortKey: (key: SortKey) => void;
    sortAsc: boolean;
    setSortAsc: (asc: boolean) => void;
    sortKeysCollection?: any;
}



const FilterControls: React.FC<FilterProps> = ({
    searchTerm,
    setSearchTerm,
    sortKey,
    setSortKey,
    sortAsc,
    setSortAsc,
    sortKeysCollection
}) => {
    const [showFilters, setShowFilters] = useState(false);
    console.log("Show Filters:", showFilters);
    return (
        <>
            <HStack gap={2} align="center" justify="space-between" w="100%">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowFilters(!showFilters)}
                    aria-expanded={showFilters}
                    aria-controls="filter-controls"
                >
                    {showFilters ? "Hide Filters" : "Show Filters"}
                    <Icon as={showFilters ? MdFilterListOff : MdFilterList} ml={1} />
                </Button>
            </HStack>
            {showFilters && (<Collapsible.Root open={showFilters}>
                <Collapsible.Trigger paddingY="3">

                </Collapsible.Trigger>

                <Collapsible.Content id="filter-controls">
                    <VStack gap={4} align="stretch" py={2}>
                        {/* Sort Controls */}
                        <VStack align="start" gap={1}>
                            <Text fontSize="sm">Sort By</Text>
                            <HStack w="100%" gap={2}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSortAsc(!sortAsc)}
                                    w="80px"
                                    flexShrink={0}
                                    title={`Sort ${sortAsc ? 'Ascending' : 'Descending'}`}
                                >
                                    <Icon as={sortAsc ? FaSortAmountUp : FaSortAmountDown} mr={1} />
                                    {sortAsc ? 'Asc' : 'Desc'}
                                </Button>
                                <Select.Root
                                    collection={sortKeysCollection}
                                    onValueChange={(val: any) => setSortKey(val.value[0] as SortKey)}
                                    flexGrow={1}
                                    value={[sortKey]}
                                >
                                    <Select.Trigger>
                                        <Select.ValueText placeholder="Select sorting key..." />
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
                            {/* Search Input */}
                            <Input
                                placeholder="Search by title..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="sm"
                            />
                        </VStack>

                    </VStack>
                </Collapsible.Content>
            </Collapsible.Root>)}
        </>


    );
};

export default FilterControls;