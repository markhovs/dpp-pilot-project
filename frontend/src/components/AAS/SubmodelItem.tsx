import { useState } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  IconButton,
  Collapse,
  Badge,
  useColorModeValue,
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  CheckIcon,
  CloseIcon,
} from "@chakra-ui/icons";
import { useDisclosure } from "@chakra-ui/react";
import { useQueryClient } from '@tanstack/react-query';
import SubmodelElement from "./SubmodelElement";
import { AasService } from "../../client";
import useCustomToast from "../../hooks/useCustomToast";
import { validateValue, findElementByPath, buildFullPath } from "../../utils/aas";

interface SubmodelItemProps {
  submodel: any;
  aasId: string;
  isSuperUser?: boolean;
}

const SubmodelItem = ({ submodel, aasId }: SubmodelItemProps) => {
  const showToast = useCustomToast();
  const queryClient = useQueryClient();
  const { isOpen, onToggle } = useDisclosure();
  const [isEditing, setIsEditing] = useState(false);
  const [editedValues, setEditedValues] = useState<Record<string, any>>({});

  // Color mode values
  const boxBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const metadataBg = useColorModeValue("gray.50", "gray.700");
  const textColor = useColorModeValue("gray.600", "gray.400");

  // Extract necessary submodel info
  const version = submodel.administration?.version || "Unknown";
  const revision = submodel.administration?.revision || "Unknown";
  const templateId = submodel.administration?.templateId || "N/A";

  // Modified to build paths
  const handleInputChange = (path: string, newValue: any) => {
    setEditedValues((prev) => ({ ...prev, [path]: newValue }));
  };

  const handleSave = async () => {
    // Validate all edited values before saving
    const invalidFields = Object.entries(editedValues).reduce((acc, [path, value]) => {
      // Find the corresponding element and its type using the full path
      const element = findElementByPath(submodel, path);
      if (element && element.valueType) {
        const validation = validateValue(value, element.valueType);
        if (!validation.isValid) {
          acc[path] = validation.message || `Invalid value for ${path}`;
        }
      }
      return acc;
    }, {} as Record<string, string>);

    if (Object.keys(invalidFields).length > 0) {
      showToast(
        "Validation Error",
        "Please correct the invalid values before saving",
        "error"
      );
      return;
    }

    try {
      await AasService.updateSubmodelData({
        aasId,
        submodelId: submodel.id,
        requestBody: { new_data: editedValues },
      });

      await queryClient.invalidateQueries({ queryKey: ['aas', aasId] });
      setIsEditing(false);
      setEditedValues({});
      showToast(
        "Success!",
        "Submodel values updated successfully.",
        "success"
      );
    } catch (error) {
      console.error("Failed to update submodel:", error);
      showToast(
        "Error",
        "Failed to update submodel values. Please try again.",
        "error"
      );
    }
  };

  if (!submodel) return null;

  return (
    <Box
      p={4}
      borderWidth={1}
      borderRadius="lg"
      boxShadow="sm"
      bg={boxBg}
      borderColor={borderColor}
      _hover={{ borderColor: useColorModeValue("gray.300", "gray.500") }}
    >
      <HStack justify="space-between" align="start" spacing={4}>
        <Box
          flex={1}
          cursor="pointer"
          onClick={onToggle}
          _hover={{ opacity: 0.8 }}
          transition="opacity 0.2s"
        >
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold" fontSize="lg">
              {submodel.idShort ?? "Unnamed Submodel"}
            </Text>
            <Text fontSize="sm" color={textColor}>
              {submodel.description?.find((d: any) => d.language === "en")?.text}
            </Text>
            <Text fontSize="xs" color={textColor} fontFamily="monospace">
              ID: {submodel.id}
            </Text>
          </VStack>
        </Box>

        <HStack spacing={2}>
          {isEditing ? (
            <>
              <IconButton
                icon={<CheckIcon />}
                aria-label="Save"
                onClick={handleSave}
                colorScheme="green"
                size="md"  // Changed from sm
              />
              <IconButton
                icon={<CloseIcon />}
                aria-label="Cancel"
                onClick={() => setIsEditing(false)}
                size="md"  // Changed from sm
              />
            </>
          ) : (
            <IconButton
              icon={<EditIcon />}
              aria-label="Edit"
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering collapse
                setIsEditing(true);
              }}
              size="md"
              variant="ghost"
              _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
            />
          )}
          <IconButton
            icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
            aria-label="Toggle Details"
            onClick={(e) => {
              e.stopPropagation(); // Prevent double-triggering
              onToggle();
            }}
            variant="ghost"
            size="md"  // Changed from sm
            _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
          />
        </HStack>
      </HStack>

      <Box
        mt={3}
        p={3}
        bg={metadataBg}
        borderRadius="md"
        display="flex"
        flexWrap="wrap"
        alignItems="center"
        gap={2}
      >
        <HStack spacing={4} flex={1}>
          <Badge colorScheme="purple">VERSION {version}</Badge>
          <Badge colorScheme="blue">REVISION {revision}</Badge>
        </HStack>
        <Box>
          <Text fontSize="sm" color={textColor}>
            <Badge variant="subtle" colorScheme="gray" mr={2}>Template</Badge>
            {templateId}
          </Text>
        </Box>
      </Box>

      <Collapse in={isOpen} animateOpacity>
        <VStack spacing={4} align="stretch" mt={4}>
          {submodel.submodelElements?.map((element: any) => (
            <SubmodelElement
              key={element.idShort}
              element={element}
              isEditing={isEditing}
              onChange={handleInputChange}
              editedValues={editedValues}
              aasId={aasId}
              submodelId={submodel.id}
              parentPath={submodel.idShort}
            />
          ))}
        </VStack>
      </Collapse>
    </Box>
  );
};

export default SubmodelItem;
