import { HStack, ButtonGroup } from "@chakra-ui/react";
import AttachSubmodel from "./AttachSubmodel";
import RemoveSubmodel from "./RemoveSubmodel";

interface SubmodelActionsProps {
  aasId: string;
  submodels: { keys: { value: string }[] }[];
}

const SubmodelActions = ({ aasId, submodels }: SubmodelActionsProps) => {
  return (
    <HStack justify="flex-end" mt={4} mb={2}>
      <ButtonGroup size="sm" spacing={4}>
        <AttachSubmodel aasId={aasId} />
        <RemoveSubmodel aasId={aasId} submodels={submodels} />
      </ButtonGroup>
    </HStack>
  );
};

export default SubmodelActions;
