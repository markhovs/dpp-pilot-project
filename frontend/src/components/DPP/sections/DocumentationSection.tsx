import React from 'react';
import {
  Box, Heading, Text, VStack, HStack, Icon, Badge,
  useColorModeValue, SimpleGrid, Card, CardBody, Button,
  Image, Tag
} from "@chakra-ui/react";
import {
  MdDescription, MdOpenInNew, MdFilePresent, MdLanguage,
  MdCalendarToday, MdOutlineInfo, MdBusinessCenter
} from "react-icons/md";
import { DPPSection } from "../../../types/dpp";
import { getFirstLangValue } from "../../../utils/dpp";
import AdditionalDataSection from "../AdditionalDataSection";

// Define interfaces for document data
interface DocumentItem {
  title?: string | Record<string, string>;
  subtitle?: string | Record<string, string>;
  description?: string | Record<string, string>;
  file?: string;
  previewFile?: string;
  isPrimary?: boolean;
  organization?: string;
  domain?: string;
  status?: string;
  statusDate?: string;
  language?: string;
  identifier?: string;
  classId?: string;
  classificationSystem?: string;
  [key: string]: any;
}

interface DocumentationSectionData {
  documents?: DocumentItem[];
  totalDocuments?: number;
  additionalData?: Record<string, unknown>;
}

interface DocumentationSectionProps {
  section: DPPSection & { data?: { data?: DocumentationSectionData } };
  developerMode: boolean;
  setSelectedImage?: (url: string | null) => void;
  setSelectedPdf?: (url: string | null) => void;
  setSelectedDocument?: (doc: any | null) => void;
}

const DocumentationSection: React.FC<DocumentationSectionProps> = ({
  section,
  developerMode,
  setSelectedImage,
  setSelectedPdf,
  setSelectedDocument
}) => {
  // Fix data access to match API response structure
  const sectionData = section?.data || {};
  const data = sectionData.data || {} as DocumentationSectionData;
  const { documents = [], totalDocuments = 0, additionalData } = data;

  // Theme colors
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const labelColor = useColorModeValue("gray.600", "gray.400");

  // Helper function to render multi-language values with proper typing
  const renderMultiLangValue = (value: any): React.ReactNode => {
    if (!value) return null;

    // If it's not an object or has no language keys, render directly as string
    if (typeof value !== 'object' || !Object.keys(value).length) {
      return <Text>{String(value)}</Text>;
    }

    // Render multi-language
    return (
      <VStack align="start" spacing={1}>
        {Object.entries(value).map(([lang, text]) => (
          <HStack key={lang}>
            <Tag size="sm" colorScheme="blue" variant="subtle">{lang}</Tag>
            <Text>{String(text)}</Text>
          </HStack>
        ))}
      </VStack>
    );
  };

  // Handle document selection
  const handleDocumentClick = (doc: DocumentItem) => {
    if (!doc) return;

    if (doc.file) {
      // Try to determine the file type
      const fileName = doc.file.toLowerCase();
      if (fileName.endsWith('.pdf')) {
        setSelectedPdf?.(doc.file);
      } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
                fileName.endsWith('.png') || fileName.endsWith('.gif') ||
                fileName.endsWith('.webp')) {
        setSelectedImage?.(doc.file);
      } else {
        // For other file types
        setSelectedDocument?.({
          file: doc.file,
          title: getFirstLangValue(doc.title) || "Document",
          type: "document"
        });
      }
    }
  };

  // Check if we have any documentation
  if (documents.length === 0) {
    return (
      <Box p={5} shadow="md" borderRadius="lg" bg={cardBg}>
        <Text color={labelColor}>No documentation available for this product.</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Header with document count */}
      <Box p={5} shadow="md" borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg}>
        <HStack mb={4} spacing={2} pb={2} borderBottom="1px solid" borderColor={borderColor}>
          <Icon as={MdDescription} color="blue.500" />
          <Heading size="md">Documentation</Heading>
          <Badge colorScheme="blue" ml={2}>
            {totalDocuments ? `${totalDocuments} total` : documents.length}
          </Badge>
        </HStack>

        {/* Documents Display Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
          {documents.map((doc: DocumentItem, index: number) => (
            <Card key={index} variant="outline" overflow="hidden">
              {/* Preview Image */}
              {doc.previewFile && (
                <Box
                  height="120px"
                  overflow="hidden"
                  position="relative"
                  cursor="pointer"
                  onClick={() => handleDocumentClick(doc)}
                >
                  <Image
                    src={doc.previewFile}
                    alt={getFirstLangValue(doc.title) || "Preview"}
                    width="100%"
                    height="100%"
                    objectFit="cover"
                  />
                </Box>
              )}

              <CardBody>
                <VStack align="start" spacing={3}>
                  {/* Document Title */}
                  <VStack align="start" spacing={1} width="100%">
                    {doc.isPrimary && (
                      <Badge colorScheme="green" mb={1}>Primary</Badge>
                    )}
                    <Heading size="sm">
                      {renderMultiLangValue(doc.title) || "Untitled Document"}
                    </Heading>
                    {doc.subtitle && (
                      <Text color={labelColor} fontSize="sm">
                        {getFirstLangValue(doc.subtitle)}
                      </Text>
                    )}
                  </VStack>

                  {/* Document Details */}
                  <Box width="100%">
                    {doc.description && (
                      <Box mb={3} fontSize="sm">
                        {renderMultiLangValue(doc.description)}
                      </Box>
                    )}

                    {/* Document Metadata */}
                    {(doc.organization || doc.domain || doc.statusDate) && (
                      <VStack align="start" spacing={1} fontSize="xs" mt={2}>
                        {doc.organization && (
                          <HStack>
                            <Icon as={MdBusinessCenter} color="blue.500" />
                            <Text>{doc.organization}</Text>
                          </HStack>
                        )}

                        {doc.domain && (
                          <HStack>
                            <Icon as={MdOutlineInfo} color="purple.500" />
                            <Text>{doc.domain}</Text>
                          </HStack>
                        )}

                        {doc.statusDate && (
                          <HStack>
                            <Icon as={MdCalendarToday} color="green.500" />
                            <Text>{doc.statusDate}</Text>
                            {doc.status && (
                              <Badge
                                size="sm"
                                colorScheme={doc.status === "FINAL" ? "green" : "yellow"}
                              >
                                {doc.status}
                              </Badge>
                            )}
                          </HStack>
                        )}

                        {doc.language && (
                          <HStack>
                            <Icon as={MdLanguage} color="blue.500" />
                            <Text>{doc.language}</Text>
                          </HStack>
                        )}
                      </VStack>
                    )}
                  </Box>

                  {/* Document Access Button */}
                  {doc.file && (
                    <Button
                      mt={2}
                      size="sm"
                      width="100%"
                      leftIcon={<Icon as={MdFilePresent} />}
                      rightIcon={<Icon as={MdOpenInNew} />}
                      onClick={() => handleDocumentClick(doc)}
                    >
                      Open Document
                    </Button>
                  )}

                  {/* Developer Mode Info */}
                  {developerMode && (
                    <Box
                      fontSize="xs"
                      width="100%"
                      mt={2}
                      p={2}
                      bg={headerBg}
                      borderRadius="md"
                    >
                      <VStack align="start" spacing={1}>
                        {doc.identifier && (
                          <HStack>
                            <Text fontWeight="bold">ID:</Text>
                            <Text>{doc.identifier}</Text>
                          </HStack>
                        )}

                        {doc.classId && (
                          <HStack>
                            <Text fontWeight="bold">Class ID:</Text>
                            <Text>{doc.classId}</Text>
                          </HStack>
                        )}

                        {doc.classificationSystem && (
                          <HStack>
                            <Text fontWeight="bold">Classification:</Text>
                            <Text>{doc.classificationSystem}</Text>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  )}
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      </Box>

      {/* Developer Mode - Additional Data */}
      {developerMode && additionalData && (
        <AdditionalDataSection additionalData={additionalData} />
      )}
    </VStack>
  );
};

export default DocumentationSection;
