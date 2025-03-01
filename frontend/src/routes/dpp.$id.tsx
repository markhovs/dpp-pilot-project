import { createFileRoute, useParams } from '@tanstack/react-router';
import {
  Box,
  Container,
  Heading,
  VStack,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Flex,
  Image,
  Link,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { DppService } from '../client';
import DPPViewer from '../components/DPP/DPPViewer';
import { CompleteDPP, DPPSection } from '../types/dpp';

export const Route = createFileRoute('/dpp/$id')({
  component: PublicDPPExplorer,
  meta: ({ params }) => [
    { title: `Digital Product Passport - ${params.id}` },
    {
      name: 'description',
      content: 'Digital Product Passport with sustainability and technical information',
    },
  ],
});

function PublicDPPExplorer() {
  const { id } = useParams({ from: '/dpp/$id' });
  const bgColor = useColorModeValue('white', 'gray.800');

  // Step 1: Fetch the sections list
  const {
    data: sectionsList,
    isLoading: isLoadingSections,
    error: sectionsError,
  } = useQuery({
    queryKey: ['dpp-sections', id],
    queryFn: async () => {
      return await DppService.listDppSections({ aasId: id });
    },
    enabled: !!id,
    retry: 1,
  });

  // Step 2: Only if we have sections, create the DPP structure with basic metadata
  const hasMetadata = sectionsList && sectionsList.length > 0;

  // Prepare a skeleton DPP object with just the structure
  const dppSkeleton = hasMetadata
    ? ({
        id: id,
        format: 'DPP',
        generated_at: new Date().toISOString(),
        sections: sectionsList.reduce<Record<string, DPPSection>>(
          (acc, section) => {
            acc[section.id] = {
              id: section.id,
              title: section.title,
              data: {}, // Initially empty, will be loaded on demand
            };
            return acc;
          },
          {} as Record<string, DPPSection>
        ),
      } as CompleteDPP)
    : null;

  const isLoading = isLoadingSections;
  const error = sectionsError;

  return (
    <Container maxW='1200px' py={8}>
      <VStack spacing={6} align='stretch'>
        <Flex justify='space-between' align='center'>
          {/* Logo */}
          <Link href='/' _hover={{ opacity: 0.8 }}>
            <Box
              p={3}
              borderRadius='md'
              bg={useColorModeValue('white', 'gray.800')}
              boxShadow='sm'
              transition='all 0.3s'
              _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
            >
              <Image
                src='/assets/images/logo.svg'
                alt='Application Logo'
                height='80px'
                objectFit='contain'
              />
            </Box>
          </Link>

          <Box>
            <Heading as='h1' size='md' mb={2} color='gray.600'>
              Digital Product Passport
            </Heading>
          </Box>
        </Flex>

        {isLoading ? (
          <Box textAlign='center' py={10}>
            <Spinner size='xl' thickness='4px' speed='0.65s' color='blue.500' mb={4} />
            <Text>Loading Digital Product Passport...</Text>
          </Box>
        ) : error ? (
          <Alert
            status='error'
            variant='subtle'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            textAlign='center'
            height='200px'
            borderRadius='md'
          >
            <AlertIcon boxSize='40px' mr={0} />
            <AlertTitle mt={4} mb={1} fontSize='lg'>
              Error Loading DPP
            </AlertTitle>
            <AlertDescription maxWidth='sm'>
              Failed to load the Digital Product Passport sections. It may not exist or the data may
              be incomplete.
              <Text mt={2}>Error details: {(error as Error).message}</Text>
            </AlertDescription>
          </Alert>
        ) : dppSkeleton ? (
          <Box borderWidth='1px' borderRadius='lg' overflow='hidden' bg={bgColor} boxShadow='sm'>
            <DPPViewer dpp={dppSkeleton} aasId={id} />
          </Box>
        ) : null}

        <Box mt={6} textAlign='center' fontSize='sm' color='gray.500'>
          <Text>© 2025 Mark Hovsepyan</Text>
        </Box>
      </VStack>
    </Container>
  );
}
