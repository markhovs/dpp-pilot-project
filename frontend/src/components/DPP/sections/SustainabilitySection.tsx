import {
  Box,
  Heading,
  VStack,
  useColorModeValue,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from '@chakra-ui/react';
import { DPPSection } from '../../../types/dpp';
import DynamicFieldsRenderer from '../renderers/DynamicFieldsRenderer';
import AdditionalDataSection from '../AdditionalDataSection';

interface SustainabilitySectionProps {
  section: DPPSection;
  developerMode: boolean;
}

const SustainabilitySection: React.FC<SustainabilitySectionProps> = ({
  section,
  developerMode,
}) => {
  // Fix data access to match API response structure
  const sectionData = section?.data || {};
  const data = sectionData.data || {};
  const {
    carbonFootprint = {},
    energyEfficiency = {},
    materialEfficiency = {},
    additionalData,
  } = data;

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const statBg = useColorModeValue('blue.50', 'blue.900');
  const secondaryStatBg = useColorModeValue('green.50', 'green.900');

  return (
    <VStack spacing={6} align='stretch'>
      {/* Carbon Footprint */}
      {Object.keys(carbonFootprint).length > 0 && (
        <Box
          p={5}
          shadow='md'
          borderWidth='1px'
          borderColor={borderColor}
          borderRadius='lg'
          bg={cardBg}
        >
          <Heading size='md' mb={4}>
            Carbon Footprint
          </Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
            {/* Product Carbon Footprint */}
            {carbonFootprint.product && (
              <Box p={4} borderRadius='md' bg={statBg}>
                <Heading size='sm' mb={3}>
                  Product Carbon Footprint
                </Heading>
                <Stat>
                  <StatLabel>CO₂ Equivalent</StatLabel>
                  <StatNumber>
                    {carbonFootprint.product.value} {carbonFootprint.product.unit}
                  </StatNumber>
                  {carbonFootprint.product.calculationMethod && (
                    <StatHelpText>Method: {carbonFootprint.product.calculationMethod}</StatHelpText>
                  )}
                </Stat>

                {/* Additional details in table */}
                <TableContainer mt={4}>
                  <Table variant='simple' size='sm'>
                    <Tbody>
                      {carbonFootprint.product.lifecycle &&
                        carbonFootprint.product.lifecycle.phases && (
                          <Tr>
                            <Th width='40%'>Lifecycle Phases</Th>
                            <Td>{carbonFootprint.product.lifecycle.phases}</Td>
                          </Tr>
                        )}
                      {carbonFootprint.product.validFrom && (
                        <Tr>
                          <Th>Valid From</Th>
                          <Td>{carbonFootprint.product.validFrom}</Td>
                        </Tr>
                      )}
                      {carbonFootprint.product.validUntil && (
                        <Tr>
                          <Th>Valid Until</Th>
                          <Td>{carbonFootprint.product.validUntil}</Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Transport Carbon Footprint */}
            {carbonFootprint.transport && (
              <Box p={4} borderRadius='md' bg={secondaryStatBg}>
                <Heading size='sm' mb={3}>
                  Transport Carbon Footprint
                </Heading>
                <Stat>
                  <StatLabel>CO₂ Equivalent</StatLabel>
                  <StatNumber>
                    {carbonFootprint.transport.value} {carbonFootprint.transport.unit}
                  </StatNumber>
                  {carbonFootprint.transport.calculationMethod && (
                    <StatHelpText>
                      Method: {carbonFootprint.transport.calculationMethod}
                    </StatHelpText>
                  )}
                </Stat>

                {/* Additional details in table */}
                <TableContainer mt={4}>
                  <Table variant='simple' size='sm'>
                    <Tbody>
                      {carbonFootprint.transport.processes && (
                        <Tr>
                          <Th width='40%'>Processes</Th>
                          <Td>{carbonFootprint.transport.processes}</Td>
                        </Tr>
                      )}
                      {carbonFootprint.transport.validFrom && (
                        <Tr>
                          <Th>Valid From</Th>
                          <Td>{carbonFootprint.transport.validFrom}</Td>
                        </Tr>
                      )}
                      {carbonFootprint.transport.validUntil && (
                        <Tr>
                          <Th>Valid Until</Th>
                          <Td>{carbonFootprint.transport.validUntil}</Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </SimpleGrid>
        </Box>
      )}

      {/* Energy Efficiency - Only render if we have data */}
      {Object.keys(energyEfficiency).length > 0 && (
        <Box
          p={5}
          shadow='md'
          borderWidth='1px'
          borderColor={borderColor}
          borderRadius='lg'
          bg={cardBg}
        >
          <Heading size='md' mb={4}>
            Energy Efficiency
          </Heading>
          <DynamicFieldsRenderer data={energyEfficiency} />
        </Box>
      )}

      {/* Material Efficiency - Only render if we have data */}
      {Object.keys(materialEfficiency).length > 0 && (
        <Box
          p={5}
          shadow='md'
          borderWidth='1px'
          borderColor={borderColor}
          borderRadius='lg'
          bg={cardBg}
        >
          <Heading size='md' mb={4}>
            Material Efficiency
          </Heading>
          <DynamicFieldsRenderer data={materialEfficiency} />
        </Box>
      )}

      {/* Developer Mode - Additional Data */}
      {developerMode && additionalData && <AdditionalDataSection additionalData={additionalData} />}
    </VStack>
  );
};

export default SustainabilitySection;
