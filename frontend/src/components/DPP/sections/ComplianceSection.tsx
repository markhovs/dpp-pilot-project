import React from 'react';
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Image,
  Icon,
  Card,
  CardBody,
  Stack,
  useColorModeValue,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Divider,
} from '@chakra-ui/react';
import {
  MdVerified,
  MdDescription,
  MdCalendarToday,
  MdOutlineWarning,
} from 'react-icons/md';
import { DPPSection } from '../../../types/dpp';
import AdditionalDataSection from '../AdditionalDataSection';
import DynamicFieldsRenderer from '../renderers/DynamicFieldsRenderer';

// Define interfaces for compliance data structures
interface ComplianceMarking {
  name: string;
  designation?: string;
  issueDate?: string;
  expiryDate?: string;
  file?: string;
  additionalText?: string;
  properties?: Record<string, any>;
  [key: string]: any;
}

interface ComplianceStandard {
  name: string;
  value?: string;
  [key: string]: any;
}

interface ComplianceCertification {
  name: string;
  value?: string;
  [key: string]: any;
}

interface ComplianceSectionData {
  markings?: ComplianceMarking[];
  certifications?: ComplianceCertification[];
  standards?: ComplianceStandard[];
  [key: string]: any;
}

interface ComplianceSectionProps {
  section: DPPSection & { data?: { data?: ComplianceSectionData; additionalData?: any } };
  developerMode: boolean;
  setSelectedImage: (url: string | null) => void;
  setSelectedPdf?: (url: string | null) => void;
  setSelectedDocument?: (doc: any | null) => void;
}

const ComplianceSection: React.FC<ComplianceSectionProps> = ({
  section,
  developerMode,
  setSelectedImage,
}) => {
  const data = section?.data?.data || {} as ComplianceSectionData;
  const { markings = [], certifications = [], standards = [] } = data;

  const cardBg = useColorModeValue('white', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  // Check if we have any data to display
  const hasData = markings.length > 0 || certifications.length > 0 || standards.length > 0;

  if (!hasData) {
    return (
      <Box p={5} shadow="md" borderRadius="lg" bg={cardBg}>
        <Text color={labelColor}>No compliance information available.</Text>
      </Box>
    );
  }

  const renderMarkingCard = (marking: ComplianceMarking, index: number): React.ReactNode => {
    const isExpired = marking.expiryDate && new Date(marking.expiryDate) < new Date();
    const expiryStatus = isExpired ? "error" : "success";

    return (
      <Card key={index} variant="outline" bg={cardBg}>
        <CardBody>
          <Stack spacing={4}>
            {/* Certificate Image */}
            {marking.file && (
              <Box
                position="relative"
                height="120px"
                overflow="hidden"
                borderRadius="md"
                onClick={() => setSelectedImage(marking.file || null)}
                cursor="pointer"
                bg={useColorModeValue("gray.50", "gray.800")}
              >
                <Image
                  src={marking.file}
                  alt={marking.name || "Certificate marking"}
                  objectFit="contain"
                  width="100%"
                  height="100%"
                />
              </Box>
            )}

            {/* Certificate Details */}
            <Stack spacing={2}>
              <HStack justify="space-between" align="start">
                <HStack>
                  <Icon as={MdVerified} color="green.500" />
                  <Text fontWeight="bold">{marking.name}</Text>
                </HStack>
                {marking.expiryDate && (
                  <Badge colorScheme={expiryStatus}>
                    {isExpired ? "Expired" : "Valid"}
                  </Badge>
                )}
              </HStack>

              {marking.designation && (
                <Text fontSize="sm" color={labelColor}>
                  {marking.designation}
                </Text>
              )}

              {(marking.issueDate || marking.expiryDate) && (
                <HStack spacing={4} fontSize="sm">
                  {marking.issueDate && (
                    <HStack>
                      <Icon as={MdCalendarToday} color="blue.500" />
                      <Text>Issued: {marking.issueDate}</Text>
                    </HStack>
                  )}
                  {marking.expiryDate && (
                    <HStack>
                      <Icon as={isExpired ? MdOutlineWarning : MdCalendarToday}
                            color={isExpired ? "red.500" : "green.500"} />
                      <Text>Expires: {marking.expiryDate}</Text>
                    </HStack>
                  )}
                </HStack>
              )}

              {marking.additionalText && (
                <Text fontSize="sm" color={labelColor}>
                  {marking.additionalText}
                </Text>
              )}
            </Stack>

            {/* Developer Mode - Show Raw Properties */}
            {developerMode && marking.properties && (
              <Accordion allowToggle mt={2}>
                <AccordionItem border="0">
                  <AccordionButton px={0}>
                    <Badge colorScheme="purple">Technical Details</Badge>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <DynamicFieldsRenderer
                      data={marking.properties}
                      developerMode={true}
                    />
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            )}
          </Stack>
        </CardBody>
      </Card>
    );
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box p={6}>
        {/* Markings Section */}
        {markings.length > 0 && (
          <Box mb={6}>
            <Heading size="md" mb={4}>Product Markings</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {markings.map((marking: ComplianceMarking, index: number) =>
                renderMarkingCard(marking, index)
              )}
            </SimpleGrid>
          </Box>
        )}

        {/* Standards Section */}
        {standards.length > 0 && (
          <Box mt={6}>
            <Divider mb={6} />
            <Heading size="md" mb={4}>Standards</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {standards.map((standard: ComplianceStandard, index: number) => (
                <Card key={index} variant="outline" bg={cardBg}>
                  <CardBody>
                    <HStack alignItems="flex-start">
                      <Icon as={MdDescription} boxSize={5} color="blue.500" mt={1} />
                      <Stack>
                        <Text fontWeight="medium">{standard.name}</Text>
                        {standard.value && <Text fontSize="sm">{standard.value}</Text>}
                      </Stack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}

        {/* Certifications Section */}
        {certifications.length > 0 && (
          <Box mt={6}>
            <Divider mb={6} />
            <Heading size="md" mb={4}>Certifications</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              {certifications.map((cert: ComplianceCertification, index: number) => (
                <Card key={index} variant="outline" bg={cardBg}>
                  <CardBody>
                    <HStack alignItems="flex-start">
                      <Icon as={MdVerified} boxSize={5} color="green.500" mt={1} />
                      <Stack>
                        <Text fontWeight="medium">{cert.name}</Text>
                        {cert.value && <Text fontSize="sm">{cert.value}</Text>}
                      </Stack>
                    </HStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Box>

      {/* Developer Mode - Additional Data */}
      {developerMode && section.data?.additionalData && (
        <AdditionalDataSection additionalData={section.data.additionalData} />
      )}
    </VStack>
  );
};

export default ComplianceSection;
