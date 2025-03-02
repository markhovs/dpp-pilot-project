import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  useColorModeValue,
  Badge,
  Card,
  CardBody,
  Heading,
  SimpleGrid,
  TableContainer,
  Table,
  Tbody,
  Tr,
  Th,
  Td,
} from '@chakra-ui/react';
import {
  MdHistory,
  MdTimeline,
  MdOutlineInfo,
  MdEvent,
  MdOutlineBuild,
  MdOutlineUpdate,
  MdOutlineWarning,
  MdOutlineCheckCircle,
  MdDescription,
} from 'react-icons/md';
import { DPPSection } from '../../../types/dpp';
import { getFirstLangValue } from '../../../utils/dpp';
import AdditionalDataSection from '../AdditionalDataSection';
import ChartRenderer from '../renderers/ChartRenderer';
import FileRenderer from '../renderers/FileRenderer';

// Define interfaces for usage section data
interface UsageHistoryItem {
  event: string;
  date?: string;
  description?: string | Record<string, string>;
  status?: string;
  [key: string]: any;
}

interface MaintenanceRecord {
  type: string;
  date?: string;
  description?: string | Record<string, string>;
  status?: string;
  [key: string]: any;
}

interface OperationalStatus {
  status?: string;
  lastUpdated?: string;
  details?: string | Record<string, string>;
  [key: string]: any;
}

interface Segment {
  name: string | Record<string, string>;
  description?: string | Record<string, string>;
  recordCount?: number;
  startTime?: string;
  endTime?: string;
  duration?: string | number;
  samplingInterval?: string | number;
  samplingRate?: string | number;
  state?: string;
  lastUpdate?: string;
  fileUrl?: string;
  endpoint?: string;
  query?: string;
  records?: any[];
  [key: string]: any;
}

interface Segments {
  external?: Segment[];
  linked?: Segment[];
  internal?: Segment[];
  [key: string]: any;
}

interface UsageSectionData {
  usageHistory?: UsageHistoryItem[];
  maintenanceRecords?: MaintenanceRecord[];
  operationalStatus?: OperationalStatus;
  segments?: Segments;
  additionalData?: Record<string, any>;
}

interface UsageSectionProps {
  section: DPPSection & { data?: { data?: UsageSectionData } };
  developerMode: boolean;
  setSelectedImage?: (url: string | null) => void;
  setSelectedPdf?: (url: string | null) => void;
  setSelectedDocument?: (doc: any | null) => void;
}

const UsageSection: React.FC<UsageSectionProps> = ({
  section,
  developerMode,
  setSelectedImage,
  setSelectedPdf,
  setSelectedDocument,
}) => {
  const [showRawData, setShowRawData] = useState(false);

  // Extract data with better error handling
  const sectionData = section?.data || {};
  const data = sectionData.data || {} as UsageSectionData;
  const {
    usageHistory = [],
    maintenanceRecords = [],
    operationalStatus = {},
    segments = {},
    additionalData,
  } = data;

  // Theme variables
  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  // Helper function to render usage history card
  const renderUsageHistoryCard = (history: UsageHistoryItem, index: number): React.ReactNode => {
    const { event, date, description, status } = history;

    return (
      <Card key={index} variant='outline' bg={cardBg} overflow='hidden'>
        <CardBody>
          <VStack align='start' spacing={3}>
            <HStack>
              <Icon as={MdEvent} color='blue.500' />
              <Heading size='sm'>{event}</Heading>
              {status && (
                <Badge colorScheme={status === 'completed' ? 'green' : 'red'}>{status}</Badge>
              )}
            </HStack>

            {date && (
              <HStack>
                <Icon as={MdTimeline} color='gray.500' />
                <Text>{new Date(date).toLocaleDateString()}</Text>
              </HStack>
            )}

            {description && (
              <Text fontSize='sm' color={labelColor}>
                {getFirstLangValue(description)}
              </Text>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Helper function to render maintenance record card
  const renderMaintenanceRecordCard = (record: MaintenanceRecord, index: number): React.ReactNode => {
    const { type, date, description, status } = record;

    return (
      <Card key={index} variant='outline' bg={cardBg} overflow='hidden'>
        <CardBody>
          <VStack align='start' spacing={3}>
            <HStack>
              <Icon as={MdOutlineBuild} color='purple.500' />
              <Heading size='sm'>{type}</Heading>
              {status && (
                <Badge colorScheme={status === 'completed' ? 'green' : 'red'}>{status}</Badge>
              )}
            </HStack>

            {date && (
              <HStack>
                <Icon as={MdTimeline} color='gray.500' />
                <Text>{new Date(date).toLocaleDateString()}</Text>
              </HStack>
            )}

            {description && (
              <Text fontSize='sm' color={labelColor}>
                {getFirstLangValue(description)}
              </Text>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Helper function to render operational status
  const renderOperationalStatus = () => {
    if (!operationalStatus || Object.keys(operationalStatus).length === 0) return null;

    const { status, lastUpdated, details } = operationalStatus;

    return (
      <Box
        p={5}
        shadow='md'
        borderWidth='1px'
        borderColor={borderColor}
        borderRadius='lg'
        bg={cardBg}
      >
        <HStack mb={4} spacing={2} pb={2} borderBottom='1px solid' borderColor={borderColor}>
          <Icon as={MdOutlineInfo} color='blue.500' />
          <Heading size='md'>Operational Status</Heading>
        </HStack>

        <VStack align='start' spacing={4}>
          <HStack>
            <Icon
              as={status === 'operational' ? MdOutlineCheckCircle : MdOutlineWarning}
              color={status === 'operational' ? 'green.500' : 'red.500'}
            />
            <Text fontWeight='bold'>{status}</Text>
          </HStack>

          {lastUpdated && (
            <HStack>
              <Icon as={MdOutlineUpdate} color='gray.500' />
              <Text>Last Updated: {new Date(lastUpdated).toLocaleDateString()}</Text>
            </HStack>
          )}

          {details && (
            <Text fontSize='sm' color={labelColor}>
              {getFirstLangValue(details)}
            </Text>
          )}
        </VStack>
      </Box>
    );
  };

  // Helper function to render segment card
  const renderSegmentCard = (segment: Segment, index: number, type: string): React.ReactNode => {
    const {
      name,
      description,
      recordCount,
      startTime,
      endTime,
      duration,
      samplingInterval,
      samplingRate,
      state,
      lastUpdate,
      fileUrl,
      endpoint,
      query,
      records,
    } = segment;

    return (
      <Card key={index} variant='outline' bg={cardBg} overflow='hidden'>
        <CardBody>
          <VStack align='start' spacing={3}>
            <HStack>
              <Icon as={MdDescription} color='blue.500' />
              <Heading size='sm'>{getFirstLangValue(name)}</Heading>
              <Badge colorScheme='blue'>{type}</Badge>
            </HStack>

            {description && (
              <Text fontSize='sm' color={labelColor}>
                {getFirstLangValue(description)}
              </Text>
            )}

            <TableContainer width='100%'>
              <Table size='sm' variant='simple'>
                <Tbody>
                  <Tr>
                    <Th>Record Count</Th>
                    <Td>{recordCount}</Td>
                  </Tr>
                  <Tr>
                    <Th>Start Time</Th>
                    <Td>{startTime}</Td>
                  </Tr>
                  <Tr>
                    <Th>End Time</Th>
                    <Td>{endTime}</Td>
                  </Tr>
                  <Tr>
                    <Th>Duration</Th>
                    <Td>{duration}</Td>
                  </Tr>
                  <Tr>
                    <Th>Sampling Interval</Th>
                    <Td>{samplingInterval}</Td>
                  </Tr>
                  <Tr>
                    <Th>Sampling Rate</Th>
                    <Td>{samplingRate}</Td>
                  </Tr>
                  <Tr>
                    <Th>State</Th>
                    <Td>{state}</Td>
                  </Tr>
                  <Tr>
                    <Th>Last Update</Th>
                    <Td>{lastUpdate}</Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>

            {/* Fix FileRenderer props to match component interface */}
            {fileUrl && (
              <Box width='100%' mt={3}>
                <FileRenderer
                  fileUrl={fileUrl}
                  // Remove title prop as it's not in FileRenderer interface
                  onViewPdf={setSelectedPdf}
                  onViewImage={setSelectedImage}
                  onViewDocument={setSelectedDocument}
                />
              </Box>
            )}

            {endpoint && (
              <Box>
                <Text fontWeight='medium'>Endpoint</Text>
                <Text>{endpoint}</Text>
              </Box>
            )}

            {query && (
              <Box>
                <Text fontWeight='medium'>Query</Text>
                <Text>{query}</Text>
              </Box>
            )}

            {records && records.length > 0 && (
              <Box width='100%' mt={4}>
                <ChartRenderer
                  data={records}
                  showRawData={showRawData}
                  setShowRawData={setShowRawData}
                />
              </Box>
            )}
          </VStack>
        </CardBody>
      </Card>
    );
  };

  // Check if we have any usage data
  const hasUsageData =
    usageHistory.length > 0 ||
    maintenanceRecords.length > 0 ||
    Object.keys(operationalStatus).length > 0 ||
    Object.keys(segments).length > 0;

  if (!hasUsageData) {
    return (
      <Box p={5} shadow='md' borderRadius='lg' bg={cardBg}>
        <Text color={labelColor}>No usage information available.</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={8} align='stretch'>
      {/* Operational Status */}
      {renderOperationalStatus()}

      {/* Usage History */}
      {usageHistory.length > 0 && (
        <Box>
          <HStack mb={4} pb={2} borderBottomWidth='1px' borderColor={borderColor}>
            <Icon as={MdHistory} color='blue.500' boxSize={5} />
            <Heading size='md'>Usage History</Heading>
            <Badge colorScheme='blue'>{usageHistory.length}</Badge>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {usageHistory.map((history: UsageHistoryItem, index: number) =>
              renderUsageHistoryCard(history, index)
            )}
          </SimpleGrid>
        </Box>
      )}

      {/* Maintenance Records */}
      {maintenanceRecords.length > 0 && (
        <Box>
          <HStack mb={4} pb={2} borderBottomWidth='1px' borderColor={borderColor}>
            <Icon as={MdOutlineBuild} color='purple.500' boxSize={5} />
            <Heading size='md'>Maintenance Records</Heading>
            <Badge colorScheme='purple'>{maintenanceRecords.length}</Badge>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {maintenanceRecords.map((record: MaintenanceRecord, index: number) =>
              renderMaintenanceRecordCard(record, index)
            )}
          </SimpleGrid>
        </Box>
      )}

      {/* Segments */}
      {Object.keys(segments).length > 0 && (
        <Box>
          <HStack mb={4} pb={2} borderBottomWidth='1px' borderColor={borderColor}>
            <Icon as={MdTimeline} color='green.500' boxSize={5} />
            <Heading size='md'>Segments</Heading>
          </HStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {segments.external?.map((segment: Segment, index: number) =>
              renderSegmentCard(segment, index, 'External')
            )}
            {segments.linked?.map((segment: Segment, index: number) =>
              renderSegmentCard(segment, index, 'Linked')
            )}
            {segments.internal?.map((segment: Segment, index: number) =>
              renderSegmentCard(segment, index, 'Internal')
            )}
          </SimpleGrid>
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

export default UsageSection;
