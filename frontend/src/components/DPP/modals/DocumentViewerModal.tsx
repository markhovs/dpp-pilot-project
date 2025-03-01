import {
  Heading,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
  Button,
  HStack,
  Link,
  useColorModeValue,
  VStack,
  Text,
  Divider,
  Badge
} from "@chakra-ui/react";
import { MdFileDownload, MdOpenInNew } from "react-icons/md";
import { getFileType } from "../../../utils/dpp";

interface DocumentViewerModalProps {
  selectedDocument: any | null;
  onClose: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  selectedDocument,
  onClose
}) => {
  if (!selectedDocument) return null;

  const { file, title, contentType, description, metadata, ...otherProps } = selectedDocument;

  if (!file) return null;

  // Extract filename from URL for display
  const filename = file.split('/').pop() || 'document';
  const displayTitle = title || filename;

  // Determine file type for specialized display
  const fileType = getFileType(file, contentType);

  // Get content component based on file type
  const getContentComponent = () => {
    switch (fileType) {
      case 'pdf':
        return (
          <Box height="500px" borderWidth="1px" borderColor="gray.200" borderRadius="md">
            <iframe
              src={`${file}#view=FitH`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
            />
          </Box>
        );

      case 'image':
        return (
          <Box
            p={4}
            display="flex"
            justifyContent="center"
            alignItems="center"
            borderWidth="1px"
            borderColor="gray.200"
            borderRadius="md"
          >
            <img
              src={file}
              alt={displayTitle}
              style={{
                maxWidth: '100%',
                maxHeight: '500px',
                objectFit: 'contain'
              }}
            />
          </Box>
        );

      case 'video':
        return (
          <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" overflow="hidden">
            <video
              src={file}
              controls
              style={{ width: '100%', maxHeight: '500px' }}
            />
          </Box>
        );

      default:
        return (
          <VStack spacing={4} p={4} borderWidth="1px" borderColor="gray.200" borderRadius="md">
            <Text>This document requires an external viewer.</Text>
            <Button
              as={Link}
              href={file}
              isExternal
              leftIcon={<MdOpenInNew />}
              colorScheme="blue"
            >
              Open Document
            </Button>
          </VStack>
        );
    }
  };

  return (
    <Modal isOpen={!!selectedDocument} onClose={onClose} size="4xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent bg={useColorModeValue("white", "gray.800")}>
        <ModalHeader>
          <HStack>
            <Text>{displayTitle}</Text>
            <Badge colorScheme="blue">{fileType.toUpperCase()}</Badge>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} pt={0}>
          {description && (
            <Box mb={4}>
              <Text color={useColorModeValue("gray.600", "gray.400")}>{description}</Text>
            </Box>
          )}

          {/* Document Content */}
          {getContentComponent()}

          {/* Document Metadata */}
          {metadata && Object.keys(metadata).length > 0 && (
            <Box mt={4} pt={4} borderTopWidth="1px" borderColor={useColorModeValue("gray.200", "gray.600")}>
              <Heading size="sm" mb={2}>Document Metadata</Heading>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                {Object.entries(metadata).map(([key, value]) => (
                  <HStack key={key} justify="space-between" p={2} _hover={{ bg: useColorModeValue("gray.50", "gray.700") }}>
                    <Text fontWeight="medium">{key}</Text>
                    <Text>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</Text>
                  </HStack>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* Action buttons */}
          <Divider my={4} />

          <HStack spacing={2} justify="flex-end">
            <Button
              as={Link}
              href={file}
              download
              leftIcon={<MdFileDownload />}
              colorScheme="blue"
            >
              Download
            </Button>
            <Button
              as={Link}
              href={file}
              isExternal
              leftIcon={<MdOpenInNew />}
              variant="outline"
            >
              Open in New Tab
            </Button>
          </HStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default DocumentViewerModal;
