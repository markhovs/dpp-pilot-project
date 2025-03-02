import React from 'react';
import {
  Box, VStack, HStack, Text, Icon, useColorModeValue,
  Badge, Card, CardBody, Heading, SimpleGrid, Divider,
  Link, Flex, Accordion, AccordionItem,
  AccordionButton, AccordionPanel, AccordionIcon,
  TableContainer, Table, Tbody, Tr, Th, Td, Button, Tooltip, Stat, StatLabel, StatNumber, StatGroup
} from '@chakra-ui/react';
import {
  MdLocationOn, MdPublic, MdRoom, MdMyLocation, MdPictureAsPdf,
  MdLocalShipping, MdMap, MdHistory, MdTimeline, MdOpenInNew,
  MdOutlineLocationSearching, MdExplore, MdDocumentScanner, MdLink, MdOutlinePlace, MdTerrain, MdInfo,
  MdCode // Use this instead of MdDeveloperMode which doesn't exist
} from 'react-icons/md';
import { DPPSection } from '../../../types/dpp';
import { getFirstLangValue } from '../../../utils/dpp';
import AdditionalDataSection from '../AdditionalDataSection';
import DynamicFieldsRenderer from '../renderers/DynamicFieldsRenderer';

// Define interfaces for location data types
interface Coordinates {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  [key: string]: any;
}

interface AddressDetails {
  street?: string;
  line2?: string;
  city?: string;
  postCode?: string;
  state?: string;
  country?: string;
  formattedAddress?: string;
  mapUrl?: string;
  staticMapUrl?: string | null;
  addressLines?: string[];
  remarks?: string;
  additionalLink?: string;
}

interface LocationDocument {
  file?: string;
  url?: string;
  title?: string;
  [key: string]: any;
}

interface LocationData {
  address?: any;
  coordinates?: Coordinates;
  description?: string | Record<string, string>;
  status?: string;
  notes?: string | Record<string, string>;
  documents?: LocationDocument[];
  properties?: Record<string, any>;
  [key: string]: any;
}

interface CoordinateSystem {
  properties?: {
    name?: string;
    id?: string;
    type?: string;
    elevationReference?: string;
    seaLevelBaseHeight?: string;
    [key: string]: any;
  };
  groundControlPoints?: Array<{
    geographic?: Coordinates;
    relative?: { x: number; y: number };
    [key: string]: any;
  }>;
  [key: string]: any;
}

interface VisitedArea {
  properties?: {
    areaname?: string;
    kindofarea?: string;
    areaid?: string;
    areadesciption?: string | string[] | Record<string, string>;
    arealayout?: string;
    [key: string]: any;
  };
  regionCoordinates?: Array<{ x: number; y: number; [key: string]: any }>;
  [key: string]: any;
}

interface TrackingCapability {
  displayName?: string | Record<string, string>;
  value?: any;
  description?: string | Record<string, string>;
  [key: string]: any;
}

interface TrackingCapabilities {
  localizable?: TrackingCapability;
  sourceType?: TrackingCapability;
  realTimeCapability?: TrackingCapability;
  source?: TrackingCapability;
  [key: string]: any;
}

interface TraceabilityRecord {
  area?: any[];
  location?: any[];
  [key: string]: any;
}

interface Traceability {
  displayName?: string | Record<string, string>;
  description?: string | Record<string, string>;
  references?: Record<string, any>;
  records?: TraceabilityRecord;
  [key: string]: any;
}

interface LocationSectionData {
  currentLocation?: LocationData;
  installationLocation?: LocationData;
  storageLocation?: LocationData;
  addresses?: any[];
  coordinateSystems?: CoordinateSystem[];
  visitedAreas?: VisitedArea[];
  trackingCapabilities?: TrackingCapabilities;
  traceability?: Traceability;
  additionalData?: Record<string, any>;
  [key: string]: any;
}

interface LocationSectionProps {
  section: DPPSection & { data?: { data?: LocationSectionData; additionalData?: any } };
  developerMode: boolean;
  setSelectedImage?: (url: string | null) => void;
  setSelectedPdf?: (url: string | null) => void;
  // Remove unused parameter or add eslint disable comment if needed for future use
  // setSelectedDocument?: (doc: any | null) => void;
}

const LocationSection: React.FC<LocationSectionProps> = ({
  section,
  developerMode,
  setSelectedPdf,
}) => {
  // Extract data with better error handling
  const sectionData = section?.data || {};
  const data = sectionData.data || {} as LocationSectionData;
  const {
    currentLocation = {},
    installationLocation = {},
    storageLocation = {},
    addresses = [],
    coordinateSystems = [],
    visitedAreas = [],
    trackingCapabilities = {},
    traceability = {},
    additionalData
  } = data;

  // Theme variables
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const accentBg = useColorModeValue('blue.50', 'blue.900');
  const mapBg = useColorModeValue('gray.100', 'gray.800');
  const secondaryBg = useColorModeValue('green.50', 'green.900');
  const tertiaryBg = useColorModeValue('purple.50', 'purple.900');
  const headerBg = useColorModeValue('gray.50', 'gray.700');

  // Function to handle PDF viewing
  const handleViewPdf = (pdfUrl: string) => {
    if (setSelectedPdf) {
      setSelectedPdf(pdfUrl);
    } else {
      window.open(pdfUrl, '_blank');
    }
  };

  // Enhanced function to format address data with better structure
  const formatAddress = (addressData: any): AddressDetails | null => {
    if (!addressData) return null;

    // Handle direct string address
    if (typeof addressData === 'string') return { formattedAddress: addressData };

    // Extract address data from various possible formats
    const addressObj = addressData.data || addressData;

    // Extract key address components with fallbacks for different naming patterns
    const extractValue = (keys: string[]) => {
      for (const key of keys) {
        if (addressObj[key] !== undefined) {
          return typeof addressObj[key] === 'object'
            ? getFirstLangValue(addressObj[key])
            : addressObj[key];
        }
      }
      return '';
    };

    // Build address components with multiple possible key names
    const street = extractValue(['street', 'addressLine1', 'streetAddress']);
    const line2 = extractValue(['addressLine2', 'suite', 'unit']);
    const city = extractValue(['city', 'town', 'locality']);
    const postCode = extractValue(['postCode', 'zip', 'zipCode', 'postalCode']);
    const state = extractValue(['state', 'stateCounty', 'province', 'region']);
    const country = extractValue(['country', 'countryCode']);

    // Create Google Maps search URL
    const searchQuery = encodeURIComponent(
      [street, line2, city, state, postCode, country]
        .filter(Boolean)
        .join(', ')
    );

    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;

    // Format display address
    const addressLines = [
      street,
      line2,
      [postCode, city].filter(Boolean).join(' '),
      state,
      country
    ].filter(Boolean);

    const formattedAddress = addressLines.join(', ');

    // Static map preview URL (from Google Maps Static API)
    // You would need to add your API key for production use
    const staticMapUrl = formattedAddress ?
      `https://maps.googleapis.com/maps/api/staticmap?center=${searchQuery}&zoom=14&size=400x200&markers=${searchQuery}&key=YOUR_API_KEY`
      : null;

    // Additional properties to extract - might be useful
    const remarks = extractValue(['remarks', 'additionalInformation', 'notes']);
    const additionalLink = extractValue(['additionalLink', 'website']);

    return {
      street,
      line2,
      city,
      postCode,
      state,
      country,
      formattedAddress,
      mapUrl,
      staticMapUrl,
      addressLines,
      remarks,
      additionalLink
    };
  };

  // Enhanced rendering for location cards with more visual appeal
  const renderPrimaryLocationCard = (location: LocationData, title: string, icon: React.ComponentType) => {
    if (!location || Object.keys(location).length === 0) return null;

    const address = formatAddress(location.address);

    // Extract coordinates if available
    const coords = location.coordinates || location;
    const latitude = coords.latitude || coords.lat;
    const longitude = coords.longitude || coords.lng;
    const hasCoordinates = latitude && longitude;

    // Create a Google Maps URL for coordinates
    const coordinatesMapUrl = hasCoordinates
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

    // Extract location documents or PDFs if available
    const locationDocs = location.documents || [];
    const hasPdfs = locationDocs.some((doc: LocationDocument) =>
      doc.file?.toLowerCase().endsWith('.pdf') ||
      doc.url?.toLowerCase().endsWith('.pdf')
    );

    return (
      <Card
        variant="outline"
        overflow="hidden"
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="lg"
        bg={cardBg}
        transition="all 0.2s"
        _hover={{ shadow: 'md' }}
      >
        {/* Improved header with more visual interest */}
        <Box
          bg={headerBg}
          px={5}
          py={4}
          borderBottomWidth="1px"
          borderColor={borderColor}
        >
          <HStack>
            <Flex
              w="40px"
              h="40px"
              borderRadius="full"
              bg="blue.500"
              color="white"
              align="center"
              justify="center"
              mr={2}
            >
              <Icon as={icon} boxSize={5} />
            </Flex>
            <Box>
              <Heading size="md">{title}</Heading>
              {location.status && (
                <Badge colorScheme="green" mt={1}>{location.status}</Badge>
              )}
            </Box>
          </HStack>

          {location.description && (
            <Text mt={3} color={labelColor} fontSize="sm">
              {getFirstLangValue(location.description)}
            </Text>
          )}
        </Box>

        <CardBody>
          <VStack spacing={5} align="stretch">
            {/* Enhanced Map Preview with better visual styling */}
            {(hasCoordinates || (address && address.formattedAddress)) && (
              <Box>
                <HStack mb={3}>
                  <Icon as={MdMap} color="blue.500" />
                  <Text fontWeight="medium">Location Map</Text>
                </HStack>

                <Box
                  borderRadius="md"
                  overflow="hidden"
                  position="relative"
                  height="180px"
                  bg={mapBg}
                  borderWidth="1px"
                  borderColor={borderColor}
                >
                  {/* Map placeholder with more professional styling */}
                  <Flex
                    height="100%"
                    align="center"
                    justify="center"
                    direction="column"
                    position="relative"
                    bg="gray.100"
                  >
                    {/* Decorative grid lines for map-like appearance */}
                    <Box
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      backgroundImage="linear-gradient(0deg, rgba(0,0,0,0.05) 1px, transparent 1px),
                                      linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)"
                      backgroundSize="20px 20px"
                      opacity={0.8}
                    />

                    <Box zIndex={1}>
                      <Icon as={MdOutlinePlace} boxSize={10} color="red.500" mb={1} />
                      <Text fontWeight="medium" mb={2}>
                        {hasCoordinates
                          ? `${latitude}, ${longitude}`
                          : address?.formattedAddress || "Location Map"}
                      </Text>

                      {/* Fix the type error here - convert null to undefined for href */}
                      <Button
                        as={Link}
                        href={hasCoordinates
                          ? coordinatesMapUrl || undefined
                          : address?.mapUrl}
                        isExternal
                        colorScheme="blue"
                        size="sm"
                        leftIcon={<Icon as={MdOpenInNew} />}
                      >
                        Open in Google Maps
                      </Button>
                    </Box>
                  </Flex>
                </Box>
              </Box>
            )}

            {/* Improved Coordinates Display - More Prominent */}
            {hasCoordinates && (
              <Box
                p={4}
                borderRadius="md"
                bg={accentBg}
              >
                <HStack mb={3}>
                  <Icon as={MdMyLocation} color="blue.600" />
                  <Text fontWeight="bold">GPS Coordinates</Text>
                </HStack>

                <StatGroup>
                  <Stat>
                    <StatLabel color={labelColor}>Latitude</StatLabel>
                    <Tooltip label="Copy to clipboard">
                      <StatNumber
                        fontSize="md"
                        cursor="pointer"
                        onClick={() => navigator.clipboard.writeText(String(latitude))}
                        _hover={{ textDecoration: "underline" }}
                      >
                        {Number(latitude).toFixed(6)}°
                      </StatNumber>
                    </Tooltip>
                  </Stat>

                  <Stat>
                    <StatLabel color={labelColor}>Longitude</StatLabel>
                    <Tooltip label="Copy to clipboard">
                      <StatNumber
                        fontSize="md"
                        cursor="pointer"
                        onClick={() => navigator.clipboard.writeText(String(longitude))}
                        _hover={{ textDecoration: "underline" }}
                      >
                        {Number(longitude).toFixed(6)}°
                      </StatNumber>
                    </Tooltip>
                  </Stat>
                </StatGroup>
              </Box>
            )}

            {/* Enhanced Address details with better styling */}
            {address && address.addressLines && address.addressLines.length > 0 && (
              <Box>
                <HStack mb={3}>
                  <Icon as={MdLocationOn} color="red.500" />
                  <Text fontWeight="medium">Address</Text>
                </HStack>

                <Card variant="outline">
                  <CardBody py={3}>
                    {/* Use non-null assertion to tell TypeScript that addressLines is defined */}
                    {address.addressLines!.map((line, i) => (
                      <Text key={i} mb={i < address.addressLines!.length - 1 ? 1 : 0}>
                        {line}
                      </Text>
                    ))}

                    {address.remarks && (
                      <>
                        <Divider my={2} />
                        <Text fontSize="sm" color={labelColor}>{address.remarks}</Text>
                      </>
                    )}
                  </CardBody>
                </Card>
              </Box>
            )}

            {/* Document previews - New section */}
            {hasPdfs && (
              <Box>
                <HStack mb={3}>
                  <Icon as={MdDocumentScanner} color="blue.500" />
                  <Text fontWeight="medium">Documents</Text>
                </HStack>

                <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={3}>
                  {locationDocs.map((doc: LocationDocument, idx: number) => {
                    const docFile = doc.file || doc.url;
                    const isPdf = docFile?.toLowerCase().endsWith('.pdf');

                    if (!isPdf) return null;

                    return (
                      <Card
                        key={idx}
                        variant="outline"
                        cursor="pointer"
                        onClick={() => docFile && handleViewPdf(docFile)}
                        _hover={{ shadow: 'md' }}
                      >
                        <CardBody p={3}>
                          <HStack>
                            <Icon as={MdPictureAsPdf} color="red.500" boxSize={5} />
                            <Text noOfLines={1} fontSize="sm">
                              {doc.title || `Document ${idx + 1}`}
                            </Text>
                          </HStack>
                        </CardBody>
                      </Card>
                    );
                  })}
                </SimpleGrid>
              </Box>
            )}

            {/* Show any additional information */}
            {location.notes && (
              <Box>
                <HStack mb={2}>
                  <Icon as={MdInfo} color="blue.500" />
                  <Text fontWeight="medium">Notes</Text>
                </HStack>
                <Text fontSize="sm">{getFirstLangValue(location.notes)}</Text>
              </Box>
            )}

            {/* Technical details with improved accordion styling */}
            {developerMode && Object.keys(location).length > 0 && (
              <Accordion allowToggle>
                <AccordionItem border="none">
                  <AccordionButton
                    bg={headerBg}
                    borderRadius="md"
                    _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                  >
                    <HStack flex="1" textAlign="left">
                      {/* Changed MdDeveloperMode to MdCode which exists in react-icons/md */}
                      <Icon as={MdCode} color="purple.500" />
                      <Text fontWeight="medium">Technical Details</Text>
                    </HStack>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pt={4}>
                    <DynamicFieldsRenderer
                      data={location}
                      developerMode={true}
                      excludeKeys={['address', 'coordinates', 'description', 'status', 'notes', 'documents']}
                    />
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Enhanced address card rendering
  const renderAddressCard = (address: any, index: number): React.ReactNode => {
    const formattedAddress = formatAddress(address);

    return (
      <Card
        key={index}
        variant="outline"
        bg={cardBg}
        transition="all 0.2s"
        _hover={{ shadow: 'md' }}
      >
        <CardBody>
          <VStack align="start" spacing={3}>
            <HStack>
              <Icon as={MdLocationOn} color="red.500" />
              <Heading size="sm">Address {index + 1}</Heading>
            </HStack>

            {formattedAddress?.addressLines?.map((line, i) => (
              <Text key={i}>{line}</Text>
            ))}

            {formattedAddress?.mapUrl && (
              <Button
                as={Link}
                href={formattedAddress.mapUrl}
                isExternal
                size="sm"
                colorScheme="blue"
                leftIcon={<Icon as={MdMap} />}
                variant="outline"
                mt={2}
              >
                View on Google Maps
              </Button>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Enhanced coordinate system card
  const renderCoordinateSystemCard = (system: CoordinateSystem, index: number): React.ReactNode => (
    <Card
      key={index}
      variant="outline"
      bg={cardBg}
      transition="all 0.2s"
      _hover={{ shadow: 'md' }}
    >
      <CardBody>
        <VStack align="start" spacing={4}>
          <HStack>
            <Icon as={MdTerrain} color="green.500" />
            <Heading size="sm">{system.properties?.name || `Coordinate System ${index + 1}`}</Heading>
          </HStack>

          <Box bg={secondaryBg} p={3} borderRadius="md" w="100%">
            <TableContainer>
              <Table variant="simple" size="sm">
                <Tbody>
                  <Tr>
                    <Th width="120px">ID</Th>
                    <Td>{system.properties?.id || "-"}</Td>
                  </Tr>
                  <Tr>
                    <Th>Type</Th>
                    <Td>{system.properties?.type || "-"}</Td>
                  </Tr>
                  {system.properties?.elevationReference && (
                    <Tr>
                      <Th>Elevation Ref.</Th>
                      <Td>{system.properties.elevationReference}</Td>
                    </Tr>
                  )}
                  {system.properties?.seaLevelBaseHeight && (
                    <Tr>
                      <Th>Sea Level Base</Th>
                      <Td>{system.properties.seaLevelBaseHeight}</Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {/* Ground Control Points */}
          {system.groundControlPoints && system.groundControlPoints.length > 0 && (
            <Box w="100%">
              <Text fontWeight="medium" mb={2}>Ground Control Points</Text>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                {system.groundControlPoints.map((point, idx) => (
                  <Card key={idx} variant="outline" size="sm" bg={tertiaryBg} p={2}>
                    <VStack align="start" spacing={1}>
                      <Badge colorScheme="purple">Point {idx + 1}</Badge>
                      {point.geographic && (
                        <HStack>
                          <Text fontSize="xs">Geo:</Text>
                          <Text fontSize="xs" fontWeight="medium">
                            {point.geographic.longitude}, {point.geographic.latitude}
                          </Text>
                        </HStack>
                      )}
                      {point.relative && (
                        <HStack>
                          <Text fontSize="xs">Rel:</Text>
                          <Text fontSize="xs" fontWeight="medium">
                            {point.relative.x}, {point.relative.y}
                          </Text>
                        </HStack>
                      )}
                    </VStack>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );

  // Enhanced visited area card
  const renderVisitedAreaCard = (area: VisitedArea, index: number): React.ReactNode => {
    const areaProps = area.properties || {};
    const areaName = areaProps.areaname || `Area ${index + 1}`;
    const areaKind = areaProps.kindofarea || "Unknown";
    const areaId = areaProps.areaid || "";
    const description = Array.isArray(areaProps.areadesciption)
      ? getFirstLangValue(areaProps.areadesciption)
      : areaProps.areadesciption || "";

    return (
      <Card
        key={index}
        variant="outline"
        bg={cardBg}
        transition="all 0.2s"
        _hover={{ shadow: 'md' }}
      >
        <CardBody>
          <VStack align="start" spacing={3}>
            <HStack>
              <Icon as={MdHistory} color="purple.500" />
              <Heading size="sm">{areaName}</Heading>
              <Badge colorScheme="purple">{areaKind}</Badge>
            </HStack>

            {areaId && <Text fontSize="sm" color={labelColor}>ID: {areaId}</Text>}

            {description && (
              <Box pt={2} pb={2}>
                <Text>{typeof description === 'string' ? description : getFirstLangValue(description)}</Text>
              </Box>
            )}

            {/* Area layout preview with PDF handling */}
            {areaProps.arealayout && (
              <Box w="100%">
                {areaProps.arealayout.toLowerCase().endsWith('.pdf') ? (
                  <Button
                    onClick={() => handleViewPdf(areaProps.arealayout || '')} // Add empty string fallback
                    colorScheme="blue"
                    size="sm"
                    leftIcon={<Icon as={MdPictureAsPdf} />}
                    width="100%"
                  >
                    View Area Layout
                  </Button>
                ) : (
                  <Link
                    href={areaProps.arealayout}
                    isExternal
                    color="blue.500"
                    display="block"
                  >
                    View Area Layout
                  </Link>
                )}
              </Box>
            )}

            {/* Region coordinates visualization */}
            {area.regionCoordinates && area.regionCoordinates.length > 0 && (
              <Box w="100%" pt={2}>
                <Text fontWeight="medium" fontSize="sm" mb={2}>Region Coordinates</Text>
                <Box
                  bg={tertiaryBg}
                  p={3}
                  borderRadius="md"
                  maxHeight="150px"
                  overflow="auto"
                >
                  {area.regionCoordinates.map((coord, idx) => (
                    <HStack key={idx} mb={1}>
                      <Badge size="sm">{idx + 1}</Badge>
                      <Text fontSize="sm">
                        x: {coord.x}, y: {coord.y}
                      </Text>
                    </HStack>
                  ))}
                </Box>
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Check if we have any location data
  const hasLocationData = Object.keys(currentLocation).length > 0 ||
                         Object.keys(installationLocation).length > 0 ||
                         Object.keys(storageLocation).length > 0 ||
                         addresses.length > 0 ||
                         coordinateSystems.length > 0 ||
                         visitedAreas.length > 0 ||
                         Object.keys(trackingCapabilities).length > 0 ||
                         Object.keys(traceability).length > 0;

  if (!hasLocationData) {
    return (
      <Box p={5} shadow="md" borderRadius="lg" bg={cardBg}>
        <Text color={labelColor}>No location information available.</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={8} align="stretch">
      {/* Primary locations */}
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
        {renderPrimaryLocationCard(currentLocation, "Current Location", MdLocationOn)}
        {renderPrimaryLocationCard(installationLocation, "Installation Location", MdRoom)}
        {renderPrimaryLocationCard(storageLocation, "Storage Location", MdLocalShipping)}
      </SimpleGrid>

      {/* Addresses */}
      {addresses.length > 0 && (
        <Box>
          <HStack mb={4} pb={2} borderBottomWidth="1px" borderColor={borderColor}>
            <Icon as={MdPublic} color="blue.500" boxSize={5} />
            <Heading size="md">Additional Addresses</Heading>
            <Badge colorScheme="blue">{addresses.length}</Badge>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {addresses.map((address, index) => renderAddressCard(address, index))}
          </SimpleGrid>
        </Box>
      )}

      {/* Visited Areas */}
      {visitedAreas.length > 0 && (
        <Box>
          <HStack mb={4} pb={2} borderBottomWidth="1px" borderColor={borderColor}>
            <Icon as={MdHistory} color="purple.500" boxSize={5} />
            <Heading size="md">Visited Areas</Heading>
            <Badge colorScheme="purple">{visitedAreas.length}</Badge>
          </HStack>

          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
            {visitedAreas.map((area, index) => renderVisitedAreaCard(area, index))}
          </SimpleGrid>
        </Box>
      )}

      {/* Coordinate Systems */}
      {coordinateSystems.length > 0 && (
        <Box>
          <HStack mb={4} pb={2} borderBottomWidth="1px" borderColor={borderColor}>
            <Icon as={MdTerrain} color="green.500" boxSize={5} />
            <Heading size="md">Coordinate Systems</Heading>
            <Badge colorScheme="green">{coordinateSystems.length}</Badge>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
            {coordinateSystems.map((system, index) => renderCoordinateSystemCard(system, index))}
          </SimpleGrid>
        </Box>
      )}

      {/* Tracking Capabilities */}
      {Object.keys(trackingCapabilities).length > 0 && (
        <Box>
          <HStack mb={4} pb={2} borderBottomWidth="1px" borderColor={borderColor}>
            <Icon as={MdOutlineLocationSearching} color="blue.500" boxSize={5} />
            <Heading size="md">Tracking Capabilities</Heading>
          </HStack>

          <Card variant="outline" bg={cardBg}>
            <CardBody>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={5}>
                {/* Localizable status */}
                {trackingCapabilities.localizable && (
                  <Box bg={accentBg} p={4} borderRadius="md">
                    <HStack mb={2}>
                      <Icon as={MdMyLocation} color="green.500" />
                      <Text fontWeight="bold">
                        {trackingCapabilities.localizable.displayName
                          ? getFirstLangValue(trackingCapabilities.localizable.displayName)
                          : "Localizable"}
                      </Text>
                      <Badge colorScheme={trackingCapabilities.localizable.value ? "green" : "red"}>
                        {trackingCapabilities.localizable.value ? "Yes" : "No"}
                      </Badge>
                    </HStack>
                  </Box>
                )}

                {/* Source type */}
                {trackingCapabilities.sourceType && (
                  <Box bg={accentBg} p={4} borderRadius="md">
                    <HStack mb={1}>
                      <Icon as={MdExplore} color="blue.500" />
                      <Text fontWeight="bold">
                        {trackingCapabilities.sourceType.displayName
                          ? getFirstLangValue(trackingCapabilities.sourceType.displayName)
                          : "Source Type"}
                      </Text>
                    </HStack>
                    <Text mt={1}>{trackingCapabilities.sourceType.value}</Text>
                  </Box>
                )}
              </SimpleGrid>

              {/* Real-time capability description */}
              {trackingCapabilities.realTimeCapability && (
                <Box mt={4} p={4} bg={secondaryBg} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>
                    {trackingCapabilities.realTimeCapability.displayName
                      ? getFirstLangValue(trackingCapabilities.realTimeCapability.displayName)
                      : "Real-time Capability"}
                  </Text>
                  <Text>
                    {typeof trackingCapabilities.realTimeCapability.value === 'object'
                      ? getFirstLangValue(trackingCapabilities.realTimeCapability.value)
                      : trackingCapabilities.realTimeCapability.value}
                  </Text>
                </Box>
              )}

              {/* Source information */}
              {trackingCapabilities.source && (
                <Box mt={4} p={4} bg={tertiaryBg} borderRadius="md">
                  <Text fontWeight="bold" mb={2}>
                    {trackingCapabilities.source.displayName
                      ? getFirstLangValue(trackingCapabilities.source.displayName)
                      : "Location Source"}
                  </Text>
                  <Text>
                    {typeof trackingCapabilities.source.value === 'object'
                      ? getFirstLangValue(trackingCapabilities.source.value)
                      : trackingCapabilities.source.value}
                  </Text>
                </Box>
              )}

              {/* Developer mode technical details */}
              {developerMode && (
                <Accordion allowToggle mt={4}>
                  <AccordionItem border="none">
                    <AccordionButton
                      bg={headerBg}
                      borderRadius="md"
                      _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                    >
                      <HStack flex="1" textAlign="left">
                        <Icon as={MdInfo} color="purple.500" />
                        <Text fontWeight="medium">Technical Details</Text>
                      </HStack>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pt={4}>
                      <DynamicFieldsRenderer
                        data={trackingCapabilities}
                        developerMode={true}
                      />
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              )}
            </CardBody>
          </Card>
        </Box>
      )}

      {/* Traceability Section */}
      {Object.keys(traceability).length > 0 && (
        <Box>
          <HStack mb={4} pb={2} borderBottomWidth="1px" borderColor={borderColor}>
            <Icon as={MdTimeline} color="green.500" boxSize={5} />
            <Heading size="md">
              {traceability.displayName
                ? getFirstLangValue(traceability.displayName)
                : "Asset Traceability"}
            </Heading>
          </HStack>

          <Card variant="outline" bg={cardBg}>
            <CardBody>
              {/* Description */}
              {traceability.description && (
                <Box mb={4}>
                  <Text>
                    {getFirstLangValue(traceability.description)}
                  </Text>
                </Box>
              )}

              {/* References to time series data */}
              {traceability.references && Object.keys(traceability.references).length > 0 && (
                <Box mb={5} p={4} bg={accentBg} borderRadius="md">
                  <HStack mb={3}>
                    <Icon as={MdLink} color="blue.500" />
                    <Text fontWeight="bold">Data References</Text>
                  </HStack>

                  <TableContainer>
                    <Table variant="simple" size="sm">
                      <Tbody>
                        {Object.entries(traceability.references).map(([key, refData]: [string, any]) => (
                          <Tr key={key}>
                            <Th width="30%">{key}</Th>
                            <Td>
                              {refData.description ? getFirstLangValue(refData.description) : "Reference data"}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Records */}
              {traceability.records && (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={4}>
                  {/* Area Records */}
                  {traceability.records?.area && traceability.records.area.length > 0 && (
                    <Card variant="outline">
                      <CardBody>
                        <VStack align="start" spacing={2}>
                          <HStack>
                            <Icon as={MdHistory} color="blue.500" />
                            <Text fontWeight="bold">Area Records</Text>
                            <Badge colorScheme="blue">{traceability.records.area.length}</Badge>
                          </HStack>

                          {/* Display a preview of area records */}
                          <Box width="100%" mt={2}>
                            <DynamicFieldsRenderer
                              data={traceability.records.area.slice(0, 3)}
                              developerMode={developerMode}
                            />

                            {traceability.records.area.length > 3 && (
                              <Text fontSize="sm" color="blue.500" mt={2}>
                                + {traceability.records.area.length - 3} more records
                              </Text>
                            )}
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  )}

                  {/* Location Records */}
                  {traceability.records?.location && traceability.records.location.length > 0 && (
                    <Card variant="outline">
                      <CardBody>
                        <VStack align="start" spacing={2}>
                          <HStack>
                            <Icon as={MdLocationOn} color="green.500" />
                            <Text fontWeight="bold">Location Records</Text>
                            <Badge colorScheme="green">{traceability.records.location.length}</Badge>
                          </HStack>

                          {/* Display a preview of location records */}
                          <Box width="100%" mt={2}>
                            <DynamicFieldsRenderer
                              data={traceability.records.location.slice(0, 3)}
                              developerMode={developerMode}
                            />

                            {traceability.records.location.length > 3 && (
                              <Text fontSize="sm" color="green.500" mt={2}>
                                + {traceability.records.location.length - 3} more records
                              </Text>
                            )}
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  )}
                </SimpleGrid>
              )}

              {/* Developer Mode - Full traceability data */}
              {developerMode && (
                <Accordion allowToggle mt={4}>
                  <AccordionItem border="none">
                    <AccordionButton
                      bg={headerBg}
                      borderRadius="md"
                      _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                    >
                      <HStack flex="1" textAlign="left">
                        <Icon as={MdInfo} color="purple.500" />
                        <Text fontWeight="medium">All Traceability Data</Text>
                      </HStack>
                      <AccordionIcon />
                    </AccordionButton>
                    <AccordionPanel pt={4}>
                      <DynamicFieldsRenderer
                        data={traceability}
                        developerMode={true}
                      />
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              )}
            </CardBody>
          </Card>
        </Box>
      )}

      {/* Developer Mode - Additional Data */}
      {developerMode && additionalData && (
        <Box mt={8}>
          <AdditionalDataSection additionalData={additionalData} />
        </Box>
      )}
    </VStack>
  );
};

export default LocationSection;
