
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Table,
  Tbody,
  Tr,
  Td,
  Th,
  TableContainer,
  Image,
  Link,
  useColorModeValue,
  Divider,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import { MdCheckCircle } from "react-icons/md";
import { DPPSection, DPPSectionId, formatDate, formatValue, getFirstLangValue } from "../../types/dpp";

interface DPPSectionViewProps {
  sectionId: string;
  section: DPPSection;
}

const DPPSectionView: React.FC<DPPSectionViewProps> = ({ sectionId, section }) => {
  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const labelColor = useColorModeValue("gray.500", "gray.400");
  const valueBg = useColorModeValue("gray.50", "gray.700");

  // Helper to render rows in the tables
  const renderRow = (label: string, value: any) => {
    if (value === undefined || value === null || value === "") return null;
    return (
      <Tr>
        <Th width="30%">{label}</Th>
        <Td>{value}</Td>
      </Tr>
    );
  };

  // Helper to render multilingual values
  const renderMultiLangRow = (label: string, value: any) => {
    if (!value) return null;
    return renderRow(label, getFirstLangValue(value));
  };

  // Render section based on section ID
  const renderSectionContent = () => {
    switch (sectionId) {
      case DPPSectionId.IDENTIFICATION:
        return renderIdentificationSection();
      case DPPSectionId.SUSTAINABILITY:
        return renderSustainabilitySection();
      case DPPSectionId.TECHNICAL:
        return renderTechnicalSection();
      case DPPSectionId.MATERIALS:
        return renderMaterialsSection();
      case DPPSectionId.COMPLIANCE:
        return renderComplianceSection();
      case DPPSectionId.USAGE:
        return renderUsageSection();
      default:
        return renderGenericSection();
    }
  };

  const renderIdentificationSection = () => {
    const { product, manufacturer } = section.data;

    return (
      <VStack spacing={6} align="stretch">
        {product && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Product Information</Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Tbody>
                  {renderMultiLangRow("Name", product.name)}
                  {renderRow("Type", product.type)}
                  {renderRow("Serial Number", product.serial)}
                  {renderRow("Article Number", product.articleNumber)}
                  {renderRow("Year of Construction", product.yearOfConstruction)}
                  {renderRow("Country of Origin", product.countryOfOrigin)}
                  {renderRow("Manufacturing Date", formatDate(product.manufacturingDate))}
                </Tbody>
              </Table>
            </TableContainer>

            {product.image && (
              <Box mt={4}>
                <Image
                  src={product.image}
                  alt={getFirstLangValue(product.name) || "Product Image"}
                  maxH="200px"
                  mx="auto"
                />
              </Box>
            )}
          </Box>
        )}

        {manufacturer && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Manufacturer Information</Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Tbody>
                  {renderMultiLangRow("Name", manufacturer.name)}
                  {renderMultiLangRow("Product Family", manufacturer.productFamily)}
                  {manufacturer.website && (
                    <Tr>
                      <Th>Website</Th>
                      <Td>
                        <Link href={manufacturer.website} isExternal color="blue.500">
                          {manufacturer.website}
                        </Link>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>

            {manufacturer.logo && (
              <Box mt={4}>
                <Image
                  src={manufacturer.logo}
                  alt={getFirstLangValue(manufacturer.name) || "Manufacturer Logo"}
                  maxH="100px"
                />
              </Box>
            )}
          </Box>
        )}
      </VStack>
    );
  };

  const renderSustainabilitySection = () => {
    const { carbonFootprint, energyEfficiency, certifications } = section.data;

    return (
      <VStack spacing={6} align="stretch">
        {carbonFootprint && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Carbon Footprint</Heading>

            {carbonFootprint.product && (
              <>
                <Heading size="sm" mb={2}>Product Carbon Footprint</Heading>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Tbody>
                      {renderRow("CO₂ Equivalent", formatValue(
                        carbonFootprint.product.value,
                        carbonFootprint.product.unit
                      ))}
                      {renderRow("Calculation Method", carbonFootprint.product.calculationMethod)}
                      {renderRow("Valid From", formatDate(carbonFootprint.product.validFrom))}
                      {renderRow("Valid Until", formatDate(carbonFootprint.product.validUntil))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </>
            )}

            {carbonFootprint.transport && (
              <>
                <Divider my={4} />
                <Heading size="sm" mb={2}>Transport Carbon Footprint</Heading>
                <TableContainer>
                  <Table variant="simple" size="sm">
                    <Tbody>
                      {renderRow("CO₂ Equivalent", formatValue(
                        carbonFootprint.transport.value,
                        carbonFootprint.transport.unit
                      ))}
                      {renderRow("Calculation Method", carbonFootprint.transport.calculationMethod)}
                    </Tbody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}

        {energyEfficiency && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Energy Efficiency</Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Tbody>
                  {renderRow("Energy Class", energyEfficiency.energyClass)}
                  {renderRow("Annual Consumption", formatValue(
                    energyEfficiency.annualConsumption?.value,
                    energyEfficiency.annualConsumption?.unit
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {certifications && certifications.length > 0 && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Sustainability Certifications</Heading>

            <VStack spacing={3} align="stretch">
              {certifications.map((cert: any, index: number) => (
                <HStack key={index} p={2} bg={valueBg} borderRadius="md">
                  <Badge colorScheme="green">{cert.type}</Badge>
                  <Text fontWeight="medium">{cert.name}</Text>
                  {cert.validUntil && (
                    <Text fontSize="sm" color={labelColor} ml="auto">
                      Valid until: {formatDate(cert.validUntil)}
                    </Text>
                  )}
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    );
  };

  const renderTechnicalSection = () => {
    const { summary = {}, specifications = [], dimensions = {} } = section.data;

    return (
      <VStack spacing={6} align="stretch">
        {Object.keys(summary).length > 0 && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Technical Summary</Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Tbody>
                  {renderMultiLangRow("Product Name", summary.productName)}
                  {renderRow("Manufacturer", summary.manufacturer)}
                  {renderRow("Article Number", summary.articleNumber)}
                  {renderRow("Type", summary.type)}
                  {renderRow("Series", summary.series)}
                  {renderRow("Version", summary.version)}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {specifications && specifications.length > 0 && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Technical Specifications</Heading>
            <VStack spacing={3} align="stretch">
              {specifications.map((spec: any, index: number) => (
                <Box key={index} p={3} bg={valueBg} borderRadius="md">
                  <Heading size="sm">{spec.name}</Heading>
                  <Text mt={1}>{formatValue(spec.value, spec.unit)}</Text>
                  {spec.description && (
                    <Text fontSize="sm" color={labelColor} mt={1}>
                      {spec.description}
                    </Text>
                  )}
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        {Object.keys(dimensions).length > 0 && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Dimensions</Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Tbody>
                  {renderRow("Width", formatValue(dimensions.width, dimensions.widthUnit))}
                  {renderRow("Height", formatValue(dimensions.height, dimensions.heightUnit))}
                  {renderRow("Depth", formatValue(dimensions.depth, dimensions.depthUnit))}
                  {renderRow("Weight", formatValue(dimensions.weight, dimensions.weightUnit))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </VStack>
    );
  };

  const renderMaterialsSection = () => {
    const { materials = [], recycling = {} } = section.data;

    return (
      <VStack spacing={6} align="stretch">
        {materials && materials.length > 0 && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Material Composition</Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Th>
                  <Tr>
                    <Th>Material</Th>
                    <Th>Percentage</Th>
                    <Th>Recyclable</Th>
                  </Tr>
                </Th>
                <Tbody>
                  {materials.map((material: any, index: number) => (
                    <Tr key={index}>
                      <Td>{material.name}</Td>
                      <Td>{material.percentage}%</Td>
                      <Td>
                        {material.recyclable ? (
                          <Badge colorScheme="green">Yes</Badge>
                        ) : (
                          <Badge colorScheme="red">No</Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {recycling && Object.keys(recycling).length > 0 && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Recycling Information</Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Tbody>
                  {renderRow("Recyclability Rate", recycling.recyclabilityRate ? `${recycling.recyclabilityRate}%` : null)}
                  {renderRow("Disassembly Time", formatValue(recycling.disassemblyTime, "minutes"))}
                  {renderMultiLangRow("Recycling Instructions", recycling.instructions)}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </VStack>
    );
  };

  const renderComplianceSection = () => {
    const { standards = [], certifications = [] } = section.data;

    return (
      <VStack spacing={6} align="stretch">
        {standards && standards.length > 0 && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Compliance Standards</Heading>
            <List spacing={3}>
              {standards.map((standard: any, index: number) => (
                <ListItem key={index}>
                  <ListIcon as={MdCheckCircle} color="green.500" />
                  <Text as="span" fontWeight="medium">{standard.code}: </Text>
                  <Text as="span">{standard.name}</Text>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {certifications && certifications.length > 0 && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Certifications</Heading>
            <VStack spacing={3} align="stretch">
              {certifications.map((cert: any, index: number) => (
                <HStack key={index} p={3} bg={valueBg} borderRadius="md">
                  <VStack align="start" spacing={1}>
                    <HStack>
                      <Badge colorScheme="purple">{cert.type}</Badge>
                      <Text fontWeight="medium">{cert.name}</Text>
                    </HStack>
                    {cert.issuer && (
                      <Text fontSize="sm">Issued by: {cert.issuer}</Text>
                    )}
                    {cert.validUntil && (
                      <Text fontSize="sm" color={labelColor}>
                        Valid until: {formatDate(cert.validUntil)}
                      </Text>
                    )}
                  </VStack>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    );
  };

  const renderUsageSection = () => {
    const { usage = {}, performance = [] } = section.data;

    return (
      <VStack spacing={6} align="stretch">
        {usage && Object.keys(usage).length > 0 && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Usage Data</Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Tbody>
                  {renderRow("Operating Hours", formatValue(usage.operatingHours, "hours"))}
                  {renderRow("Start Time", usage.startTime ? formatDate(usage.startTime) : null)}
                  {renderRow("End Time", usage.endTime ? formatDate(usage.endTime) : null)}
                  {renderRow("Duration", usage.duration)}
                  {renderRow("Power Cycles", usage.powerCycles)}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {performance && performance.length > 0 && (
          <Box
            p={5}
            shadow="md"
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            bg={cardBg}
          >
            <Heading size="md" mb={4}>Performance Data</Heading>
            <VStack spacing={3} align="stretch">
              {performance.map((metric: any, index: number) => (
                <Box key={index} p={3} bg={valueBg} borderRadius="md">
                  <HStack justify="space-between">
                    <Text fontWeight="medium">{metric.name}</Text>
                    <Text>{formatValue(metric.value, metric.unit)}</Text>
                  </HStack>
                </Box>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    );
  };

  const renderGenericSection = () => {
    // For sections that don't have specific visualizations yet
    return (
      <Box
        p={5}
        shadow="md"
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        bg={cardBg}
      >
        <Heading size="md" mb={4}>{section.title}</Heading>
        <Box
          p={4}
          borderRadius="md"
          bg={valueBg}
          fontFamily="monospace"
          fontSize="sm"
        >
          <pre>{JSON.stringify(section.data, null, 2)}</pre>
        </Box>
      </Box>
    );
  };

  return renderSectionContent();
};

export default DPPSectionView;
