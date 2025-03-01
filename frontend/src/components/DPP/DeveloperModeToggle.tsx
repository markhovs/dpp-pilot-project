import {
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { MdDeveloperMode } from 'react-icons/md';

interface DeveloperModeToggleProps {
  isDeveloperMode: boolean;
  setDeveloperMode: (value: boolean) => void;
}

const DeveloperModeToggle: React.FC<DeveloperModeToggleProps> = ({
  isDeveloperMode,
  setDeveloperMode
}) => {
  const labelColor = useColorModeValue("gray.500", "gray.400");

  // Simple toggle without confirmation modal
  const handleToggle = () => {
    setDeveloperMode(!isDeveloperMode);
  };

  return (
    <Button
      size="xs"
      variant="ghost"
      leftIcon={<MdDeveloperMode />}
      onClick={handleToggle}
      color={isDeveloperMode ? "blue.500" : labelColor}
    >
      {isDeveloperMode ? "Developer Mode: On" : "Developer Mode"}
    </Button>
  );
};

export default DeveloperModeToggle;
