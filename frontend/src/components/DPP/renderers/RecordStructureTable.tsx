
import React from "react";
import {
  Box, Table, Thead, Tbody, Tr, Th, Td, Badge, Text,
  useColorModeValue, Tooltip, Icon, HStack
} from "@chakra-ui/react";
import { MdInfo } from "react-icons/md";
import { formatFieldName } from "../../../utils/dpp";

interface RecordField {
  name: string;
  type: string;
  category?: string;
  description?: string;
  unit?: string;
  sample?: any;
}

interface RecordStructureTableProps {
  records: RecordField[];
  showSampleValues?: boolean;
}

/**
 * Professional component for displaying record structure data with formatting
 */
const RecordStructureTable: React.FC<RecordStructureTableProps> = ({
  records,
  showSampleValues = false
}) => {
  const headerBg = useColorModeValue("gray.50", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const typeColor = useColorModeValue("purple.600", "purple.300");

  // Format data type names for display
  const formatDataType = (type: string) => {
    if (!type) return 'Unknown';

    // Handle XML Schema data types (xs:long, xs:double, etc.)
    if (type.startsWith('xs:')) {
      const baseType = type.replace('xs:', '');

      // Map XML Schema types to more friendly names
      const typeMappings: Record<string, string> = {
        'string': 'Text',
        'integer': 'Integer',
        'int': 'Integer',
        'long': 'Integer (64-bit)',
        'decimal': 'Decimal',
        'float': 'Float',
        'double': 'Double',
        'boolean': 'Boolean',
        'date': 'Date',
        'dateTime': 'Date & Time',
        'time': 'Time'
      };

      return typeMappings[baseType] || baseType;
    }

    return type;
  };

  // Get badge color based on data type
  const getTypeColor = (type: string): string => {
    if (!type) return 'gray';

    const baseType = type.replace('xs:', '').toLowerCase();

    if (['string', 'text'].includes(baseType)) return 'green';
    if (['integer', 'int', 'long', 'short'].includes(baseType)) return 'blue';
    if (['decimal', 'float', 'double'].includes(baseType)) return 'purple';
    if (['boolean'].includes(baseType)) return 'orange';
    if (['date', 'datetime', 'time'].includes(baseType)) return 'pink';

    return 'gray';
  };

  // Format sample value for display
  const formatSampleValue = (value: any, type: string): string => {
    if (value === undefined || value === null) return '-';

    // Handle different data types
    const baseType = (type || '').replace('xs:', '').toLowerCase();

    if (['string', 'text'].includes(baseType)) {
      return String(value).length > 40 ? `${String(value).substring(0, 40)}...` : String(value);
    }

    if (['integer', 'int', 'long', 'short', 'decimal', 'float', 'double'].includes(baseType)) {
      return Number(value).toLocaleString();
    }

    if (['boolean'].includes(baseType)) {
      return value ? 'True' : 'False';
    }

    if (['date', 'datetime', 'time'].includes(baseType)) {
      try {
        return new Date(value).toLocaleString();
      } catch (e) {
        return String(value);
      }
    }

    return String(value);
  };

  return (
    <Box overflowX="auto" borderWidth="1px" borderRadius="md">
      <Table variant="simple" size="sm">
        <Thead bg={headerBg}>
          <Tr>
            <Th width="30%">Field Name</Th>
            <Th width="20%">Data Type</Th>
            <Th width="20%">Category</Th>
            {showSampleValues && <Th width="30%">Sample Value</Th>}
          </Tr>
        </Thead>
        <Tbody>
          {records.map((record, index) => (
            <Tr
              key={index}
              _hover={{ bg: hoverBg }}
            >
              <Td>
                {record.description ? (
                  <Tooltip
                    label={record.description}
                    hasArrow
                    placement="top"
                    openDelay={500}
                  >
                    <HStack spacing={1}>
                      <Text fontWeight="medium">{formatFieldName(record.name)}</Text>
                      <Icon as={MdInfo} color="blue.500" fontSize="xs" />
                    </HStack>
                  </Tooltip>
                ) : (
                  <Text fontWeight="medium">{formatFieldName(record.name)}</Text>
                )}
                {record.unit && (
                  <Text as="span" fontSize="xs" color={typeColor} ml={1}>
                    ({record.unit})
                  </Text>
                )}
              </Td>
              <Td>
                <Badge colorScheme={getTypeColor(record.type)}>
                  {formatDataType(record.type)}
                </Badge>
              </Td>
              <Td>{record.category || "-"}</Td>
              {showSampleValues && (
                <Td fontFamily="mono" fontSize="sm">
                  {record.sample !== undefined
                    ? formatSampleValue(record.sample, record.type)
                    : '-'
                  }
                </Td>
              )}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default RecordStructureTable;
