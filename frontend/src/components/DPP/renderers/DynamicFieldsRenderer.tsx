import { useState } from "react";
import {
  Box,
  Text,
  Table,
  Tbody,
  Tr,
  Td,
  Th,
  Badge,
  Button,
  SimpleGrid,
  Code,
  VStack,
  Heading,
  HStack,
  Icon,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  useColorModeValue,
  Flex,
  Divider,
  Tooltip,
  Tag,
  Link,
  Kbd,
  TagLabel,
  TagLeftIcon,
  TagRightIcon,
} from "@chakra-ui/react";
import {
  MdExpandMore,
  MdExpandLess,
  MdCode,
  MdDescription,
  MdCalendarToday,
  MdEmail,
  MdPhone,
  MdLink,
  MdKeyboardArrowRight,
  MdFingerprint,
  MdKey,
  MdLabelImportant,
  MdCategory, // <-- replace MdType with MdCategory
} from "react-icons/md";
import { formatFieldName, renderValue, isDateString, isPhoneNumber, isEmail, isURL, isAasTechnicalField } from "../../../utils/dpp";

// Update interface with developerMode flag
interface DynamicFieldsRendererProps {
  data: any;
  level?: number;
  maxDepth?: number;
  showRawJson?: boolean;
  title?: string;
  excludeKeys?: string[];
  developerMode?: boolean; // Add this prop
}

// List of technical keys to hide when not in developer mode
const TECHNICAL_KEYS = [
  'semanticId',
  'modelType',
  'idShort',
  'id',
  'category',
  'kind',
  'embeddedDataSpecifications',
  'qualifiers',
  'constraints',
  'submodelElement',
  'parent',
  'valueId',
  'first',
  'second',
  'conceptDescription',
  'dataSpecification',
  'keys',
  'type',
  'references',
  'key'
];

// Helper to render semantic IDs in a clean, consistent way
const renderSemanticId = (semanticId: any) => {
  if (!semanticId) return null;

  // Extract the value from the semantic ID structure
  let semanticValue = "";
  if (semanticId.keys && semanticId.keys.length > 0) {
    semanticValue = semanticId.keys[0].value || "";
  } else if (typeof semanticId === 'string') {
    semanticValue = semanticId;
  }

  if (!semanticValue) return null;

  // Format the semantic ID for nicer display - shorter representation
  const shortValue = semanticValue.length > 40
    ? `...${semanticValue.substring(semanticValue.lastIndexOf('/') !== -1 ? semanticValue.lastIndexOf('/') : semanticValue.length - 20)}`
    : semanticValue;

  return (
    <Box mt={1}>
      <Tag size="sm" variant="subtle" colorScheme="gray" maxW="100%" wordBreak="break-all">
        <TagLeftIcon as={MdFingerprint} boxSize="12px" />
        <TagLabel fontSize="xs">{shortValue}</TagLabel>
      </Tag>
    </Box>
  );
};

const renderTechnicalMetadata = (data: any, devMode: boolean) => {
  if (!devMode) return null;

  const tags = [];

  // Add semantic ID
  if (data.semanticId) {
    tags.push(renderSemanticId(data.semanticId));
  }

  // Add model type
  if (data.modelType) {
    tags.push(
      <Tag key="modelType" size="sm" variant="subtle" colorScheme="gray">
        <TagLeftIcon as={MdCategory} boxSize="12px" />
        <TagLabel fontSize="xs">{data.modelType}</TagLabel>
      </Tag>
    );
  }

  // Add ID information
  if (data.idShort) {
    tags.push(
      <Tag key="idShort" size="sm" variant="subtle" colorScheme="gray">
        <TagLeftIcon as={MdKey} boxSize="12px" />
        <TagLabel fontSize="xs">{data.idShort}</TagLabel>
      </Tag>
    );
  }

  // Add value type if available
  if (data.valueType) {
    tags.push(
      <Tag key="valueType" size="sm" variant="outline" colorScheme="gray">
        <TagLeftIcon as={MdLabelImportant} boxSize="12px" />
        <TagLabel fontSize="xs">{data.valueType}</TagLabel>
      </Tag>
    );
  }

  if (tags.length === 0) return null;

  return (
    <Flex wrap="wrap" gap={2} mt={2} bg={useColorModeValue("gray.100", "gray.700")} p={2} borderRadius="md">
      {tags}
    </Flex>
  );
};

const DynamicFieldsRenderer: React.FC<DynamicFieldsRendererProps> = ({
  data,
  level = 0,
  maxDepth = 10,
  showRawJson = false,
  title,
  excludeKeys = [],
  developerMode = false // Default to false
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const [showJson, setShowJson] = useState(showRawJson);

  // Enhanced color scheme for a more professional look
  const tableBg = useColorModeValue("white", "gray.800");
  const headingBg = useColorModeValue("gray.50", "gray.700");
  const codeBg = useColorModeValue("gray.50", "gray.800");
  const nestedBg = useColorModeValue("gray.50", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const valueColor = useColorModeValue("black", "white");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  // Smart rendering of special value types
  const renderSmartValue = (key: string, value: any) => {
    if (value === null || value === undefined) {
      return <Text color="gray.400">-</Text>;
    }

    // For display - convert to string
    const stringValue = String(value);

    // Handle dates
    if (isDateString(stringValue) || key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return (
            <HStack spacing={1} color={valueColor}>
              <Icon as={MdCalendarToday} color="blue.500" />
              <Text>{date.toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric'
              })}</Text>
            </HStack>
          );
        }
      } catch (e) {
        // Fall back to default rendering
      }
    }

    // Handle emails
    if (isEmail(stringValue)) {
      return (
        <Link href={`mailto:${stringValue}`} isExternal color="blue.500">
          <HStack spacing={1}>
            <Icon as={MdEmail} />
            <Text>{stringValue}</Text>
          </HStack>
        </Link>
      );
    }

    // Handle phone numbers
    if (isPhoneNumber(stringValue)) {
      return (
        <Link href={`tel:${stringValue}`} color="blue.500">
          <HStack spacing={1}>
            <Icon as={MdPhone} />
            <Text>{stringValue}</Text>
          </HStack>
        </Link>
      );
    }

    // Handle URLs
    if (isURL(stringValue)) {
      return (
        <Link href={stringValue} isExternal color="blue.500" maxW="300px" isTruncated display="block">
          <HStack spacing={1}>
            <Icon as={MdLink} />
            <Text isTruncated>{stringValue}</Text>
          </HStack>
        </Link>
      );
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      return (
        <Badge colorScheme={value ? "green" : "red"}>
          {value ? "Yes" : "No"}
        </Badge>
      );
    }

    // Handle numbers
    if (typeof value === 'number') {
      return <Text color={valueColor} fontFamily="mono">{value}</Text>;
    }

    // Default rendering
    return <Text color={valueColor}>{renderValue(value)}</Text>;
  };

  // Handle undefined/null data
  if (data === undefined || data === null) {
    return <Text color="gray.400">No data available</Text>;
  }

  // Handle array data with improved styling
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <Text color="gray.400">Empty array</Text>;
    }

    return (
      <Accordion allowToggle defaultIndex={level < 1 ? [0] : []}>
        <AccordionItem border="none" borderRadius="md" overflow="hidden">
          <AccordionButton
            px={3}
            py={2}
            bg={headingBg}
            borderRadius="md"
            _hover={{ bg: hoverBg }}
          >
            <HStack flex="1" textAlign="left" spacing={2}>
              <Badge colorScheme="blue" variant="subtle">Array</Badge>
              <Text fontWeight="medium">{title || ''}</Text>
              <Badge variant="outline" fontSize="xs">{data.length} items</Badge>
            </HStack>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pt={3} px={3} pb={3} bg={tableBg} borderWidth="1px" borderColor={borderColor} mt={1} borderRadius="md">
            <VStack spacing={1} align="stretch" divider={<Divider />}>
              {data.slice(0, 20).map((item, index) => {
                // For simple scalar values, render in a single row
                if (typeof item !== 'object' || item === null) {
                  return (
                    <Box key={index} py={1}>
                      <HStack>
                        <Badge size="sm" variant="subtle">{index + 1}</Badge>
                        {renderSmartValue(`item${index}`, item)}
                      </HStack>
                    </Box>
                  );
                }

                // For objects in array, use card-style rendering - PASS developerMode TO ALL CHILD COMPONENTS
                return (
                  <Box
                    key={index}
                    p={2}
                    borderWidth="1px"
                    borderColor={borderColor}
                    borderRadius="md"
                    bg={nestedBg}
                    my={1}
                  >
                    <HStack mb={2}>
                      <Badge colorScheme="purple" variant="subtle">Item {index + 1}</Badge>
                    </HStack>
                    <Box pl={4}>
                      <DynamicFieldsRenderer
                        data={item}
                        level={level + 1}
                        maxDepth={maxDepth}
                        title={`Item ${index + 1}`}
                        developerMode={developerMode} // Critical: Pass down the developerMode prop
                      />
                    </Box>
                  </Box>
                );
              })}

              {data.length > 20 && (
                <Box textAlign="center" py={2}>
                  <Badge colorScheme="blue">{data.length - 20} more items</Badge>
                </Box>
              )}
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    );
  }

  // Handle object data with improved styling for a more professional look
  if (typeof data === 'object') {
    // Determine which keys to exclude based on developer mode
    const keysToExclude = [...excludeKeys];

    // Add visual indicator for better debugging
    const isDevMode = developerMode ? true : false;

    // Filter entries based on whether they are technical fields or not
    const entries = Object.entries(data).filter(([key]) => {
      // Always exclude specifically listed keys
      if (excludeKeys.includes(key)) return false;

      // If in developer mode, show all fields
      if (isDevMode) return true;

      // Otherwise hide technical fields
      const isTechnical = TECHNICAL_KEYS.includes(key) ||
                         key.toLowerCase().includes('aas') ||
                         key.toLowerCase().includes('semantic') ||
                         key.toLowerCase().includes('submodel') ||
                         isAasTechnicalField(key);

      return !isTechnical;
    });

    // Check if any technical fields were filtered out
    const hasFilteredTechnicalKeys = !isDevMode &&
      Object.keys(data).some(key =>
        TECHNICAL_KEYS.includes(key) ||
        key.toLowerCase().includes('aas') ||
        key.toLowerCase().includes('semantic') ||
        key.toLowerCase().includes('submodel') ||
        isAasTechnicalField(key)
      );

    // Display message when all fields are filtered out
    if (entries.length === 0) {
      if (hasFilteredTechnicalKeys) {
        return (
          <Box p={3} borderWidth="1px" borderRadius="md" borderColor="gray.300" bg="gray.50">
            <Text color="gray.500" fontSize="sm">
              Technical details are hidden. Toggle developer mode to view.
            </Text>
          </Box>
        );
      }
      return <Text color="gray.400">No data available</Text>;
    }

    // Show raw JSON option for complex objects
    const toggleJson = () => setShowJson(!showJson);

    // Don't nest too deep
    if (level >= maxDepth) {
      return (
        <Box p={2} bg={codeBg} borderRadius="md" fontSize="sm">
          <Text color="gray.500">Object (max depth reached)</Text>
        </Box>
      );
    }

    if (showJson) {
      return (
        <Box>
          <Button size="xs" onClick={toggleJson} mb={2} leftIcon={<Icon as={MdDescription} />}>
            Show Formatted
          </Button>
          <Box
            as="pre"
            p={3}
            bg={codeBg}
            borderRadius="md"
            fontSize="xs"
            overflow="auto"
            maxHeight="400px"
            borderWidth="1px"
            borderColor={borderColor}
          >
            <Code>{JSON.stringify(data, null, 2)}</Code>
          </Box>
        </Box>
      );
    }

    // Customize rendering based on level
    if (level === 0) {
      // Top level - use a clean card layout instead of tables
      return (
        <Box>
          {title && (
            <Heading size="sm" mb={3} px={2} py={1} bg={headingBg} borderRadius="md">
              {title}
            </Heading>
          )}

          {/* Add special handling for semantic data on top level when in developer mode */}
          {renderTechnicalMetadata(data, developerMode)}

          <VStack spacing={0} align="stretch" divider={<Divider />}>
            {entries.map(([key, value]) => {
              // Skip technical metadata keys at top level
              if (['metadata', 'type', 'elements'].includes(key)) return null;

              // Property name formatting
              const formattedKey = formatFieldName(key);

              // For object values, use a collapsible panel
              if (typeof value === 'object' && value !== null) {
                return (
                  <Box key={key} py={2} px={1}>
                    <Flex justify="space-between" align="center" mb={1}>
                      <Text fontWeight="medium" color={labelColor}>{formattedKey}</Text>
                      {Object.keys(value).length > 0 ? (
                        <Badge colorScheme="blue" variant="subtle">
                          {Array.isArray(value) ? `${value.length} items` : `${Object.keys(value).length} properties`}
                        </Badge>
                      ) : null}
                    </Flex>
                    {/* Show technical metadata in developer mode */}
                    {renderTechnicalMetadata(value, developerMode)}
                    <Box pl={4} pt={1}>
                      <DynamicFieldsRenderer
                        data={value}
                        level={level + 1}
                        maxDepth={maxDepth}
                        title={formattedKey}
                        developerMode={developerMode} // Make sure to pass this prop down
                      />
                    </Box>
                  </Box>
                );
              }

              // Otherwise, render properties in a clean two-column layout
              return (
                <Flex
                  key={key}
                  justify="space-between"
                  py={3}
                  px={2}
                  _hover={{ bg: hoverBg }}
                  align="center"
                >
                  <Text fontWeight="medium" color={labelColor} flex="0 0 40%">
                    {formattedKey}
                  </Text>
                  <Box flex="1">
                    {renderSmartValue(key, value)}
                  </Box>
                </Flex>
              );
            })}
          </VStack>

          {/* For top level only, add a JSON view toggle */}
          {level === 0 && Object.keys(data).length > 5 && (
            <Button
              size="xs"
              onClick={toggleJson}
              mt={3}
              leftIcon={<Icon as={MdCode} />}
              variant="outline"
            >
              View as JSON
            </Button>
          )}
        </Box>
      );
    } else {
      // Nested objects - use a cleaner expandable design
      return (
        <Box>
          {!isExpanded ? (
            <Button
              size="xs"
              onClick={() => setIsExpanded(true)}
              variant="ghost"
              leftIcon={<Icon as={MdExpandMore} />}
              width="100%"
              justifyContent="flex-start"
              borderRadius="md"
              mb={1}
              fontWeight="normal"
              color={labelColor}
              _hover={{ bg: hoverBg }}
              rightIcon={
                <Badge ml={2} colorScheme="blue" variant="subtle">
                  {Object.keys(data).length} fields
                </Badge>
              }
            >
              {title || "Object"}
            </Button>
          ) : (
            <VStack spacing={2} align="stretch">
              <Button
                size="xs"
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                leftIcon={<Icon as={MdExpandLess} />}
                width="100%"
                justifyContent="flex-start"
                borderRadius="md"
                mb={1}
                fontWeight="normal"
                color={labelColor}
                _hover={{ bg: hoverBg }}
              >
                {title || "Object"}
              </Button>

              {/* Show technical metadata when in developer mode */}
              {renderTechnicalMetadata(data, developerMode)}

              <Box
                pl={4}
                borderLeftWidth="1px"
                borderColor={borderColor}
              >
                <VStack spacing={0} align="stretch" divider={<Divider />}>
                  {entries.map(([key, value]) => {
                    const formattedKey = formatFieldName(key);

                    if (typeof value === 'object' && value !== null) {
                      return (
                        <Box key={key} pt={1} pb={2}>
                          <HStack mb={1} spacing={1}>
                            <Icon as={MdKeyboardArrowRight} color={labelColor} />
                            <Text fontWeight="medium" fontSize="sm" color={labelColor}>{formattedKey}</Text>
                          </HStack>
                          <Box pl={4}>
                            <DynamicFieldsRenderer
                              data={value}
                              level={level + 1}
                              maxDepth={maxDepth}
                              title={formattedKey}
                              developerMode={developerMode} // Make sure to pass this prop down
                            />
                          </Box>
                        </Box>
                      );
                    }

                    return (
                      <Flex key={key} py={2} align="center">
                        <Text fontSize="sm" fontWeight="medium" color={labelColor} flex="0 0 40%">
                          {formattedKey}
                        </Text>
                        <Box flex="1">
                          {renderSmartValue(key, value)}
                        </Box>
                      </Flex>
                    );
                  })}
                </VStack>
              </Box>
            </VStack>
          )}
        </Box>
      );
    }
  }

  // Handle scalar values
  return renderSmartValue("value", data);
};

export default DynamicFieldsRenderer;
