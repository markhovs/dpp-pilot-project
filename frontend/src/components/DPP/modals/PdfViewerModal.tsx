import {
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
  Text,
  Center,
  Spinner
} from "@chakra-ui/react";
import { useState } from "react";
import { MdFileDownload, MdOpenInNew } from "react-icons/md";

interface PdfViewerModalProps {
  selectedPdf: string | null;
  onClose: () => void;
  title?: string;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  selectedPdf,
  onClose,
  title
}) => {
  const [isLoading, setIsLoading] = useState(true);

  if (!selectedPdf) return null;

  // Extract filename from URL for display
  const filename = selectedPdf.split('/').pop() || 'document.pdf';
  const displayTitle = title || filename;

  return (
    <Modal isOpen={!!selectedPdf} onClose={onClose} size="5xl" isCentered>
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />
      <ModalContent h="90vh" bg={useColorModeValue("white", "gray.800")}>
        <ModalHeader>{displayTitle}</ModalHeader>
        <ModalCloseButton />
        <ModalBody p={0} display="flex" flexDirection="column">
          {/* PDF Viewer */}
          <Box flex="1" position="relative">
            {isLoading && (
              <Center position="absolute" top="0" left="0" right="0" bottom="0" zIndex="1">
                <Spinner size="xl" />
              </Center>
            )}
            <iframe
              src={`${selectedPdf}#view=FitH`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none'
              }}
              onLoad={() => setIsLoading(false)}
            />
          </Box>

          {/* Actions footer */}
          <Box p={4} bg={useColorModeValue("gray.50", "gray.700")}>
            <HStack justifyContent="space-between">
              <Text fontSize="sm" color={useColorModeValue("gray.600", "gray.400")}>
                Document may take a few moments to load
              </Text>

              <HStack spacing={2}>
                <Button
                  as={Link}
                  href={selectedPdf}
                  download
                  leftIcon={<MdFileDownload />}
                  colorScheme="blue"
                  size="sm"
                >
                  Download
                </Button>
                <Button
                  as={Link}
                  href={selectedPdf}
                  isExternal
                  leftIcon={<MdOpenInNew />}
                  variant="outline"
                  size="sm"
                >
                  Open in New Tab
                </Button>
              </HStack>
            </HStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PdfViewerModal;
