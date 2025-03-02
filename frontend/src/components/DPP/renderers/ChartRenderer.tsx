import React from 'react';
import { useEffect, useState } from 'react';
import {
  Box, useColorModeValue, Text, Button, HStack,
  Flex, Switch, FormControl, FormLabel, Badge,
  TableContainer, Table, Tbody, Tr, Th, Td, Divider
} from '@chakra-ui/react';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

interface ChartRendererProps {
  data: any[];
  title?: string;
  showRawData?: boolean;
  setShowRawData?: (show: boolean) => void;
}

const ChartRenderer: React.FC<ChartRendererProps> = ({
  data,
  showRawData = false,
  setShowRawData = () => {}
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [timeField, setTimeField] = useState<string | null>(null);
  const [numericFields, setNumericFields] = useState<string[]>([]);

  const borderColor = useColorModeValue("gray.200", "gray.600");
  const chartBg = useColorModeValue("white", "gray.800");

  // Automatically analyze data and prepare for visualization
  useEffect(() => {
    if (!data || data.length === 0 || !data[0]) return;

    try {
      const allFields = Object.keys(data[0]);

      // Find a time/date field for X-axis
      const possibleTimeFields = allFields.filter(field =>
        field.toLowerCase().includes('time') ||
        field.toLowerCase().includes('date') ||
        field.toLowerCase().includes('timestamp')
      );
      setTimeField(possibleTimeFields.length > 0 ? possibleTimeFields[0] : null);

      // Improved numeric field detection - more flexible to handle different data formats
      const foundNumericFields = allFields.filter(field => {
        // Skip the field we're using for time
        if (possibleTimeFields.includes(field)) return false;

        // Check all records (up to 10) to determine if this is a numeric field
        // This handles cases where the first record might have null/undefined values
        let hasNumericValues = false;

        for (let i = 0; i < Math.min(data.length, 10); i++) {
          const value = data[i][field];

          // Check if it's already a number
          if (typeof value === 'number' && !isNaN(value)) {
            hasNumericValues = true;
            break;
          }

          // Try to convert string to number
          if (typeof value === 'string') {
            const numericValue = parseFloat(value);
            if (!isNaN(numericValue)) {
              hasNumericValues = true;
              break;
            }
          }
        }

        return hasNumericValues;
      }).slice(0, 5);  // Limit to 5 numeric fields for better visualization

      setNumericFields(foundNumericFields);
    } catch (err) {
      console.error("Error processing chart data:", err);
    }
  }, [data]);

  // Prepare data for visualization (handle large datasets)
  const chartData = (() => {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // For large datasets, sample to improve performance
    if (data.length > 500) {
      const sampledData = [];
      const step = Math.ceil(data.length / 500);

      for (let i = 0; i < data.length; i += step) {
        sampledData.push(data[i]);
      }

      return sampledData;
    }

    return data;
  })();

  // Process data to handle string values that should be numbers
  const processDataForChart = () => {
    if (!chartData || chartData.length === 0) return [];

    // Convert string values to numbers for the numeric fields
    return chartData.map(record => {
      const processedRecord = { ...record };

      numericFields.forEach(field => {
        if (typeof record[field] === 'string') {
          processedRecord[field] = parseFloat(record[field]);
        }
      });

      return processedRecord;
    });
  };

  // Get processed chart data
  const processedChartData = processDataForChart();

  // Generate color for each line/bar
  const getColor = (index: number) => {
    const colors = [
      '#3182CE', // blue
      '#E53E3E', // red
      '#38A169', // green
      '#DD6B20', // orange
      '#805AD5'  // purple
    ];
    return colors[index % colors.length];
  };

  return (
    <Box>
      {/* Simple Controls */}
      <Flex justify="space-between" align="center" mb={2}>
        <HStack spacing={2}>
          <Button
            size="xs"
            colorScheme={chartType === 'line' ? 'blue' : 'gray'}
            onClick={() => setChartType('line')}
          >
            Line Chart
          </Button>
          <Button
            size="xs"
            colorScheme={chartType === 'bar' ? 'blue' : 'gray'}
            onClick={() => setChartType('bar')}
          >
            Bar Chart
          </Button>
        </HStack>

        <FormControl display="flex" alignItems="center" w="auto">
          <FormLabel htmlFor="show-raw-data" mb="0" fontSize="sm">
            Show Data Table
          </FormLabel>
          <Switch
            id="show-raw-data"
            size="sm"
            isChecked={showRawData}
            onChange={() => setShowRawData(!showRawData)}
          />
        </FormControl>
      </Flex>

      {/* Chart View - Auto-visualize without requiring field selection */}
      <Box
        height="300px"
        p={2}
        borderWidth="1px"
        borderColor={borderColor}
        borderRadius="md"
        bg={chartBg}
        position="relative"
      >
        {chartData && chartData.length > 0 && numericFields.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'line' ? (
              <LineChart data={processedChartData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                <XAxis
                  dataKey={timeField || undefined}
                  height={50}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: chartBg }} />
                <Legend />
                {numericFields.map((field, index) => (
                  <Line
                    key={field}
                    name={field}
                    type="monotone"
                    dataKey={field}
                    stroke={getColor(index)}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            ) : (
              <BarChart data={processedChartData}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                <XAxis
                  dataKey={timeField || undefined}
                  height={50}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: chartBg }} />
                <Legend />
                {numericFields.map((field, index) => (
                  <Bar
                    key={field}
                    name={field}
                    dataKey={field}
                    fill={getColor(index)}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <Flex
            height="100%"
            justify="center"
            align="center"
            color="gray.500"
            direction="column"
            gap={2}
          >
            <Text>
              {!chartData || chartData.length === 0
                ? "No chart data available"
                : numericFields.length === 0
                  ? "No numeric data found to visualize"
                  : "Unable to visualize data"
              }
            </Text>
            {chartData && chartData.length > 0 && numericFields.length === 0 && (
              <Box>
                <Badge colorScheme="orange" mb={2}>Data might be in non-numeric format</Badge>
                <Button size="xs" onClick={() => setShowRawData(true)}>View Data Table</Button>
              </Box>
            )}
          </Flex>
        )}
      </Box>

      {/* Raw Data Display - Vertical Format */}
      {showRawData && data && data.length > 0 && (
        <Box
          mt={4}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
          overflow="auto"
          maxHeight="300px"
        >
          <TableContainer>
            <Table size="sm" variant="simple">
              <Tbody>
                {data.slice(0, 5).map((record, idx) => (
                  <React.Fragment key={idx}>
                    {Object.entries(record).map(([key, value]) => (
                      <Tr key={`${idx}-${key}`}>
                        <Th width="30%">{key}</Th>
                        <Td>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</Td>
                      </Tr>
                    ))}
                    {idx < data.length - 1 && (
                      <Tr>
                        <Td colSpan={2}>
                          <Divider />
                        </Td>
                      </Tr>
                    )}
                  </React.Fragment>
                ))}
              </Tbody>
            </Table>
            {data.length > 5 && (
              <Box textAlign="center" p={2}>
                <Badge>Showing 5 of {data.length} records</Badge>
              </Box>
            )}
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default ChartRenderer;
