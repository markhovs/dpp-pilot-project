import { Box, ButtonGroup } from '@chakra-ui/react';
import AttachSubmodel from './AttachSubmodel';
import RemoveSubmodel from './RemoveSubmodel';

// Properly type the submodels
interface Submodel {
  id: string;
  idShort: string;
  description?: Array<{ language: string; text: string }>;
}

interface SubmodelActionsProps {
  aasId: string;
  submodels: Submodel[];
}

export default function SubmodelActions({ aasId, submodels }: SubmodelActionsProps) {
  return (
    <Box>
      <ButtonGroup spacing={2}>
        <AttachSubmodel aasId={aasId} />
        {submodels && submodels.length > 0 && (
          <RemoveSubmodel aasId={aasId} submodels={submodels} />
        )}
      </ButtonGroup>
    </Box>
  );
}
