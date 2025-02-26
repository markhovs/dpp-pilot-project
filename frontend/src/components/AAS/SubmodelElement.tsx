import {
  Box, Text, VStack, HStack, Badge, Input, Collapse, IconButton,
  Link, useColorModeValue, Select, Checkbox, FormControl,
  FormErrorMessage, useToast
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon, AddIcon, DeleteIcon } from "@chakra-ui/icons";
import { useDisclosure } from "@chakra-ui/react";
import { getInputType, validateValue, formatValue } from "../../utils/valueTypeUtils";
import { useState } from "react";

interface LangString {
  language: string;
  text: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'German' }
] as const;

const SubmodelElement = ({
  element,
  isEditing,
  onChange,
  editedValues,
  aasId,
  submodelId,
  parentPath = "",
}: {
  element: any;
  isEditing: boolean;
  onChange: (path: string, newValue: any) => void;
  editedValues: Record<string, any>;
  aasId: string;
  submodelId: string;
  parentPath?: string;
}) => {
  const { isOpen, onToggle } = useDisclosure();
  const [validationError, setValidationError] = useState<string | null>(null);
  const toast = useToast();

  if (!element || typeof element !== "object") return null;

  const elemData = element as Record<string, any>;

  // Skip rendering for reference elements
  if (elemData.type === "ModelReference" || elemData.modelType === "ReferenceElement") {
    return null;
  }

  const isMultiLang = elemData.modelType === "MultiLanguageProperty";
  const isFile = elemData.modelType === "File";
  const isCollection =
    elemData.modelType === "SubmodelElementCollection" ||
    elemData.modelType === "SubmodelElementList" ||
    elemData.typeValueListElement === "SubmodelElementCollection";

  const isOperation = elemData.modelType === "Operation";
  const isEntity = elemData.modelType === "Entity";
  const isReference = elemData.modelType === "ReferenceElement";

  // Enhanced collection elements handling
  const getCollectionElements = (elemData: any): any[] => {
    if (!elemData.value) return [];
    if (elemData.value.type === "ModelReference") return [];

    // Handle standard collections
    if (Array.isArray(elemData.value) && !elemData.typeValueListElement) {
      return elemData.value;
    }

    // Handle AssetLocation-style collections
    if (elemData.typeValueListElement === "SubmodelElementCollection") {
      return elemData.value
        .filter((item: any) => !item.type || item.type !== "ModelReference")
        .flatMap((item: any) => Array.isArray(item.value) ? item.value : []);
    }

    return [];
  };

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

  // Build the current element's full path
  const currentPath = parentPath ? `${parentPath}/${element.idShort}` : element.idShort;

  const handleValueChange = (path: string, newValue: any, valueType?: string) => {
    if (valueType) {
      // For empty values, store them as is without validation
      if (newValue === "" || newValue === null) {
        onChange(path, null);
        setValidationError(null);
        return;
      }

      const { isValid, message } = validateValue(newValue, valueType as any);
      setValidationError(isValid ? null : message || "Invalid value");
      if (isValid) {
        onChange(path, formatValue(newValue, valueType as any));
      }
    } else {
      onChange(path, newValue);
    }
  };

  const handleMultiLangChange = (path: string, langString: LangString, index: number) => {
    // Validate language code
    if (langString.language && !SUPPORTED_LANGUAGES.some(l => l.code === langString.language)) {
      return; // Ignore invalid language codes
    }

    const currentValue = editedValues[path] || element.value || [];
    const newValue = [...currentValue];
    newValue[index] = langString;
    onChange(path, newValue);
  };

  const addLanguage = (idShort: string) => {
    const currentValue = editedValues[idShort] || element.value || [];
    const usedLanguages = new Set(currentValue.map((item: LangString) => item.language));

    // Find first available language that's not used yet
    const availableLanguage = SUPPORTED_LANGUAGES.find(lang => !usedLanguages.has(lang.code));

    if (!availableLanguage) {
      toast({  // Use toast directly instead of showToast
        title: "Warning",
        description: "All supported languages are already added",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    onChange(idShort, [...currentValue, {
      language: availableLanguage.code,
      text: ""
    }]);
  };

  const removeLanguage = (idShort: string, index: number) => {
    const currentValue = editedValues[idShort] || element.value || [];
    onChange(idShort, currentValue.filter((_: any, i: number) => i !== index));
  };

  const renderValueInput = (valueType: string | undefined, currentValue: any) => {
    const inputType = getInputType(valueType as any);

    if (inputType === "checkbox") {
      return (
        <Checkbox
          isChecked={currentValue === true || currentValue === "true"}
          onChange={(e) => handleValueChange(currentPath, e.target.checked, valueType)}
          isDisabled={!isEditing}
        />
      );
    }

    return (
      <FormControl isInvalid={!!validationError}>
        <Input
          type={inputType}
          size="sm"
          variant="unstyled"
          value={currentValue ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            if (valueType) {
              const validation = validateValue(value, valueType as any);
              // Ensure we always set either string or null
              setValidationError(validation.isValid ? null : (validation.message || "Invalid value"));
            }
            onChange(currentPath, value);
          }}
          isDisabled={!isEditing}
          step={inputType === "number" ? "any" : undefined}
          placeholder={valueType && valueType.includes("date") ? "YYYY-MM-DD" : undefined}
        />
        {validationError && (
          <FormErrorMessage fontSize="xs">
            {validationError}
          </FormErrorMessage>
        )}
      </FormControl>
    );
  };

  // Multi-language property rendering
  const renderMultiLangProperty = () => (
    <VStack align="stretch" mt={2} spacing={2}>
      {(editedValues[currentPath] || element.value || []).map((langObj: LangString, index: number) => (
        <Box
          key={index}
          borderWidth={1}
          borderRadius="md"
          borderColor={borderColor}
          bg={bgColor}
        >
          <HStack spacing={2} p={2}>
            {isEditing ? (
              <>
                <Select
                  size="sm"
                  value={langObj.language}
                  onChange={(e) => handleMultiLangChange(
                    currentPath,
                    { ...langObj, language: e.target.value },
                    index
                  )}
                  width="100px"
                  isRequired
                >
                  <option value="" disabled>Select...</option>
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.code.toUpperCase()}
                    </option>
                  ))}
                </Select>
                <Input
                  size="sm"
                  value={langObj.text}
                  onChange={(e) => handleMultiLangChange(
                    currentPath,
                    { ...langObj, text: e.target.value },
                    index
                  )}
                  flex={1}
                />
                <IconButton
                  aria-label="Remove language"
                  icon={<DeleteIcon />}
                  size="sm"
                  onClick={() => removeLanguage(element.idShort, index)}
                />
              </>
            ) : (
              <>
                <Badge colorScheme="blue">{langObj.language.toUpperCase()}</Badge>
                <Text flex={1}>{langObj.text}</Text>
              </>
            )}
          </HStack>
        </Box>
      ))}
      {isEditing && (editedValues[currentPath]?.length || 0) < SUPPORTED_LANGUAGES.length && (
        <IconButton
          aria-label="Add language"
          icon={<AddIcon />}
          size="sm"
          onClick={() => addLanguage(currentPath)}
          alignSelf="flex-start"
        />
      )}
    </VStack>
  );

  const renderOperation = () => (
    <VStack spacing={2} align="stretch" mt={2}>
      {/* Input Variables Section */}
      {elemData.inputVariables?.length > 0 && (
        <Box borderWidth={1} borderRadius="md" p={3}>
          <Text fontWeight="medium" mb={2}>Input Variables</Text>
          <VStack align="stretch">
            {elemData.inputVariables.map((input: any, index: number) => (
              <Box key={index} p={2} bg={labelBg} borderRadius="md">
                <Text fontSize="sm" fontWeight="medium">{input.value.idShort}</Text>
                {input.value.description && (
                  <Text fontSize="xs" color={mutedColor}>
                    {input.value.description[0]?.text}
                  </Text>
                )}
                <Badge size="sm" mt={1}>
                  {input.value.valueType || input.value.modelType}
                </Badge>
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      {/* Output Variables Section */}
      {elemData.outputVariables?.length > 0 && (
        <Box borderWidth={1} borderRadius="md" p={3}>
          <Text fontWeight="medium" mb={2}>Output Variables</Text>
          <VStack align="stretch">
            {elemData.outputVariables.map((output: any, index: number) => (
              <Box key={index} p={2} bg={labelBg} borderRadius="md">
                <Text fontSize="sm" fontWeight="medium">{output.value.idShort}</Text>
                {output.value.description && (
                  <Text fontSize="xs" color={mutedColor}>
                    {output.value.description[0]?.text}
                  </Text>
                )}
                <Badge size="sm" mt={1}>
                  {output.value.valueType || output.value.modelType}
                </Badge>
              </Box>
            ))}
          </VStack>
        </Box>
      )}
    </VStack>
  );

  const renderEntity = () => (
    <Box p={3} borderWidth="1px" borderRadius="md" bg={bgColor} borderColor={borderColor}>
      <VStack align="stretch" spacing={3}>
        {/* Entity Type Badge */}
        <HStack>
          <Text fontSize="sm" color={mutedColor}>Entity Type:</Text>
          <Badge colorScheme="purple">{elemData.entityType || 'Unknown'}</Badge>
        </HStack>

        {/* Global Asset ID (if exists) */}
        {elemData.globalAssetId && (
          <HStack>
            <Text fontSize="sm" color={mutedColor}>Global Asset ID:</Text>
            <Badge colorScheme="blue" variant="outline">
              {elemData.globalAssetId}
            </Badge>
          </HStack>
        )}

        {/* Statements Section */}
        {elemData.statements?.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={2}>Statements:</Text>
            <VStack align="stretch" spacing={2} pl={4} borderLeft={`2px solid ${borderColor}`}>
              {elemData.statements.map((statement: any, index: number) => (
                <SubmodelElement
                  key={index}
                  element={statement}
                  isEditing={isEditing}
                  onChange={onChange}
                  editedValues={editedValues}
                  aasId={aasId}
                  submodelId={submodelId}
                />
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );

  const renderReference = () => (
    <VStack spacing={2} align="stretch" mt={2}>
      <Box borderWidth={1} borderRadius="md" p={3}>
        <Text fontSize="sm" fontWeight="medium">Reference</Text>
        {elemData.value && (
          <HStack mt={2} spacing={2}>
            <Badge colorScheme="blue">{elemData.value.type}</Badge>
            {elemData.value.keys?.map((key: any, index: number) => (
              <Badge key={index} colorScheme="gray">
                {key.type}: {key.value}
              </Badge>
            ))}
          </HStack>
        )}
      </Box>
    </VStack>
  );

  // Add helper to determine if element should show value input
  const shouldShowValueInput = (elemData: any) => {
    // Show input if it's a Property or MultiLanguageProperty
    if (elemData.modelType === "Property" || elemData.modelType === "MultiLanguageProperty") {
      return true;
    }
    // Show input if it has a valueType (even without value)
    if (elemData.valueType) {
      return true;
    }
    // Show input if it already has a value
    if ('value' in elemData) {
      return true;
    }
    return false;
  };

  if (isEntity) {
    return renderEntity();
  }

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
      {isMultiLang && renderMultiLangProperty()}

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
                    variant="filled"  // Changed from unstyled
                    value={editedValues[currentPath] ?? fileUrl}
                    onChange={(e) => {
                      // Directly update with the new value, even if empty
                      onChange(currentPath, e.target.value || null);
                    }}
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
      {!isCollection && !isMultiLang && !isFile && shouldShowValueInput(elemData) && (
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
                  {elemData.valueType || elemData.modelType || "VALUE"}
                </Badge>
              </Box>
              <Box flex={1} px={3}>
                {renderValueInput(
                  elemData.valueType ||
                  (elemData.modelType === "MultiLanguageProperty" ? "multilang" : "xs:string"),
                  editedValues[currentPath] ?? elemData.value ?? ""
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
            {getCollectionElements(elemData).map((subElement: any) => (
              <SubmodelElement
                key={subElement.idShort || Math.random().toString()}
                element={subElement}
                isEditing={isEditing}
                onChange={onChange}
                editedValues={editedValues}
                aasId={aasId}
                submodelId={submodelId}
                parentPath={currentPath} // Pass current full path
              />
            ))}
          </VStack>
        </Collapse>
      )}

      {isOperation && renderOperation()}
      {isReference && renderReference()}
    </Box>
  );
};

export default SubmodelElement;
