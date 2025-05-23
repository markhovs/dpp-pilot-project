import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Icon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Badge,
  useColorModeValue
} from '@chakra-ui/react';
import { MdCode } from 'react-icons/md';
import DynamicFieldsRenderer from './renderers/DynamicFieldsRenderer';

interface AdditionalDataSectionProps {
  additionalData: any;
}

const AdditionalDataSection: React.FC<AdditionalDataSectionProps> = ({ additionalData }) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  if (!additionalData) return null;

  const { metadata = {}, elements = {} } = additionalData;

  return (
    <Box p={5} shadow="md" borderWidth="1px" borderColor={borderColor} borderRadius="lg" bg={cardBg} mt={4}>
      <HStack mb={4}>
        <Icon as={MdCode} color="purple.500" />
        <Heading size="md">Technical Details</Heading>
      </HStack>

      {/* Metadata Information */}
      {Object.keys(metadata).length > 0 && (
        <Box mb={4}>
          <Heading size="sm" mb={2}>Metadata</Heading>
          <VStack align="stretch" spacing={2}>
            {Object.entries(metadata).map(([key, value]) => (
              <HStack key={key} justify="space-between">
                <Text fontWeight="medium">{key}:</Text>
                <Badge colorScheme={key === 'id' ? 'purple' : 'blue'}>
                  {value === null ? 'null' : String(value)}
                </Badge>
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {/* Elements - Using DynamicFieldsRenderer instead of raw JSON */}
      {Object.keys(elements).length > 0 && (
        <Box>
          <Heading size="sm" mb={2}>Elements</Heading>
          <Accordion allowToggle>
            {Object.entries(elements).map(([key, value]) => (
              <AccordionItem key={key} border="none" mb={2}>
                <AccordionButton
                  bg={useColorModeValue('gray.50', 'gray.700')}
                  borderRadius="md"
                  _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                >
                  <Box flex="1" textAlign="left">
                    <Text fontWeight="medium">{key}</Text>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pt={4}>
                  {/* Remove height constraint to allow full expansion */}
                  <Box>
                    <DynamicFieldsRenderer
                      data={value}
                      developerMode={true}
                    />
                  </Box>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        </Box>
      )}

      {/* Full data renderer when no structured data is provided */}
      {Object.keys(metadata).length === 0 && Object.keys(elements).length === 0 && (
        <Box>
          <DynamicFieldsRenderer
            data={additionalData}
            developerMode={true}
          />
        </Box>
      )}
    </Box>
  );
};

export default AdditionalDataSection;
