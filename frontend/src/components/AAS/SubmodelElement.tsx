import { Box, Text, VStack, HStack, Badge, Input, Collapse, IconButton, Link, useColorModeValue } from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";
import { useDisclosure } from "@chakra-ui/react";

const SubmodelElement = ({
  element,
  isEditing,
  onChange,
  editedValues,
  aasId,
  submodelId,
}: {
  element: any;
  isEditing: boolean;
  onChange: (idShort: string, newValue: string) => void;
  editedValues: Record<string, any>;
  aasId: string;
  submodelId: string;
}) => {
  if (!element || typeof element !== "object") return null;

  const { isOpen, onToggle } = useDisclosure();
  const elemData = element as Record<string, any>;
  const isMultiLang = elemData.modelType === "MultiLanguageProperty";
  const isFile = elemData.modelType === "File";
  const isCollection =
    elemData.modelType === "SubmodelElementCollection" ||
    elemData.modelType === "SubmodelElementList";

  // Extract actual value safely
  let displayValue: string = editedValues[elemData.idShort] ?? (elemData.value ?? "");

  // Extract Example Value
  const exampleValue = elemData.qualifiers?.find((q: any) => q.type === "ExampleValue")?.value || "";

  // Handle File Path & Content Type
  let fileUrl = typeof elemData.value === "string" ? elemData.value : "";
  let fileType = elemData.contentType ?? "Unknown file type";
  let fileName = fileUrl ? fileUrl.split("/").pop() : "No file path provided";

  // Match project color mode patterns
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const labelBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const mutedColor = useColorModeValue("gray.600", "gray.400");

  return (
    <Box
      p={3}
      borderWidth="1px"
      borderRadius="md"
      bg={bgColor}
      borderColor={borderColor}
      transition="all 0.2s"
      _hover={{ borderColor: useColorModeValue("gray.300", "gray.500") }}
    >
      <Box
        onClick={onToggle}
        cursor={isCollection ? "pointer" : "default"}
        _hover={isCollection ? { opacity: 0.8 } : undefined}
        transition="opacity 0.2s"
      >
        <HStack justify="space-between">
          <Text fontWeight="medium" color={textColor}>
            {elemData.idShort}
          </Text>

          {isCollection && (
            <IconButton
              icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              aria-label="Toggle Details"
              onClick={(e) => {
                e.stopPropagation(); // Prevent double-triggering
                onToggle();
              }}
              variant="ghost"
              size="sm"
            />
          )}
        </HStack>

        {/* Single description section */}
        {elemData.description && (
          <Text fontSize="sm" color={mutedColor} mt={1}>
            {elemData.description.find((d: any) => d.language === "en")?.text}
          </Text>
        )}
      </Box>

      {/* Display Multi-Language Property */}
      {isMultiLang && elemData.value && Array.isArray(elemData.value) && (
        <VStack align="stretch" mt={2} spacing={2}>
          {elemData.value.map((langObj: { language: string; text: string }) => (
            <Box
              key={langObj.language}
              borderWidth={1}
              borderRadius="md"
              borderColor={borderColor}
              bg={bgColor}
              overflow="hidden"
            >
              <HStack spacing={0}>
                <Box
                  bg={labelBg}
                  p={2}
                  minW="80px"
                  textAlign="center"
                >
                  <Badge
                    colorScheme="blue"
                    variant="solid"
                    px={2}
                  >
                    {langObj.language.toUpperCase()}
                  </Badge>
                </Box>
                <Box flex={1} px={3}>
                  {isEditing && langObj.language === "en" ? (
                    <Input
                      size="sm"
                      variant="unstyled"
                      value={editedValues[elemData.idShort] ?? (langObj.text || "")}
                      onChange={(e) => onChange(elemData.idShort, e.target.value)}
                      height="32px"
                    />
                  ) : (
                    <Text
                      fontSize="sm"
                      color={textColor}
                      py={1.5}
                    >
                      {langObj.text || "—"}
                    </Text>
                  )}
                </Box>
              </HStack>
            </Box>
          ))}
        </VStack>
      )}

      {/* Display File Information */}
      {isFile && (
        <VStack align="start" mt={2} spacing={2}>
          <Box
            borderWidth={1}
            borderRadius="md"
            borderColor={borderColor}
            bg={bgColor}
            overflow="hidden"
          >
            <HStack spacing={0}>
              <Box
                bg={labelBg}
                p={2}
                minW="80px"
                textAlign="center"
              >
                <Badge
                  colorScheme="blue"
                  variant="solid"
                  px={2}
                >
                  FILE
                </Badge>
              </Box>
              <Box flex={1} px={3}>
                {isEditing ? (
                  <Input
                    size="sm"
                    variant="unstyled"
                    value={editedValues[elemData.idShort] ?? fileUrl}
                    onChange={(e) => onChange(elemData.idShort, e.target.value)}
                    placeholder="Enter file URL"
                    height="32px"
                  />
                ) : (
                  fileUrl ? (
                    <Link href={fileUrl} isExternal color="blue.300">
                      {fileName}
                    </Link>
                  ) : (
                    <Text fontSize="sm" color={mutedColor} fontStyle="italic" py={1.5}>
                      No file path provided
                    </Text>
                  )
                )}
              </Box>
            </HStack>
          </Box>

          <Box
            borderWidth={1}
            borderRadius="md"
            borderColor={borderColor}
            bg={bgColor}
            opacity={0.8}
          >
            <HStack spacing={0}>
              <Box
                bg={labelBg}
                p={2}
                minW="80px"
                textAlign="center"
              >
                <Badge
                  colorScheme="gray"
                  variant="solid"
                  px={2}
                >
                  TYPE
                </Badge>
              </Box>
              <Box flex={1} px={3}>
                <Text fontSize="sm" color={mutedColor} py={1.5}>
                  {fileType}
                </Text>
              </Box>
            </HStack>
          </Box>
        </VStack>
      )}

      {/* Display Normal Value (Non-MultiLang, Non-File) */}
      {!isCollection && !isMultiLang && !isFile && (
        <VStack spacing={2} align="stretch" mt={2}>
          <Box
            borderWidth={1}
            borderRadius="md"
            borderColor={borderColor}
            bg={bgColor}
            overflow="hidden"
          >
            <HStack spacing={0}>
              <Box
                bg={labelBg}
                p={2}
                minW="80px"
                textAlign="center"
              >
                <Badge
                  colorScheme="blue"
                  variant="solid"
                  px={2}
                >
                  VALUE
                </Badge>
              </Box>
              <Box flex={1} px={3}>
                {isEditing ? (
                  <Input
                    size="sm"
                    variant="unstyled"
                    value={editedValues[elemData.idShort] ?? displayValue}
                    onChange={(e) => onChange(elemData.idShort, e.target.value)}
                    height="32px"
                  />
                ) : (
                  <Text
                    fontSize="sm"
                    color={textColor}
                    py={1.5}
                  >
                    {displayValue || "—"}
                  </Text>
                )}
              </Box>
            </HStack>
          </Box>

          {/* Example value with improved styling */}
          <Box
            borderWidth={1}
            borderRadius="md"
            borderColor={borderColor}
            bg={bgColor}
            opacity={0.8}
          >
            <HStack spacing={0}>
              <Box
                bg={labelBg}
                p={2}
                minW="80px"
                textAlign="center"
              >
                <Badge
                  colorScheme="gray"
                  variant="solid"
                  px={2}
                >
                  EXAMPLE
                </Badge>
              </Box>
              <Box flex={1} px={3}>
                <Text
                  fontSize="sm"
                  color={mutedColor}
                  py={1.5}
                >
                  {exampleValue || "—"}
                </Text>
              </Box>
            </HStack>
          </Box>
        </VStack>
      )}

      {/* Fully Dynamic Nested Collections */}
      {isCollection && (
        <Collapse in={isOpen} animateOpacity>
          <VStack spacing={3} align="stretch" mt={3} pl={4} borderLeft={`2px solid ${borderColor}`}>
            {Array.isArray(elemData.value) &&
              elemData.value.map((subElement: any) => (
                <SubmodelElement
                  key={subElement.idShort}
                  element={subElement}
                  isEditing={isEditing}
                  onChange={onChange}
                  editedValues={editedValues}
                  aasId={aasId}
                  submodelId={submodelId}
                />
              ))}
          </VStack>
        </Collapse>
      )}
    </Box>
  );
};

export default SubmodelElement;
