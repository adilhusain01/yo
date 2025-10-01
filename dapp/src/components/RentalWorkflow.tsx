import {
  Box,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Text,
  Button,
  Icon,
  useColorModeValue,
  SimpleGrid,
  Badge,
  Collapse,
  useDisclosure,
  Flex,
  Divider,
} from "@chakra-ui/react";
import React, { useState } from "react";
import {
  FiHome,
  FiPlusCircle,
  FiCheckCircle,
  FiDollarSign,
  FiAward,
  FiXCircle,
  FiEye,
  FiBarChart,
  FiInfo,
  FiFilter,
  FiSettings
} from "react-icons/fi";
import { ActionCard, ParamsWithValue } from "./ActionCard";

interface RentalWorkflowProps {
  buildAndExecute: (isGet: boolean, methodName: string, params: ParamsWithValue) => Promise<any>;
  wrappers: any;
  wrappersConfig: any;
}

const RentalWorkflow: React.FC<RentalWorkflowProps> = ({
  buildAndExecute,
  wrappers,
  wrappersConfig
}) => {
  const [selectedCategory, setSelectedCategory] = useState<number>(0);
  const [selectedAction, setSelectedAction] = useState<{
    type: 'send' | 'get';
    method: string;
    category: string;
  } | null>(null);

  const { isOpen: isActionOpen, onOpen: onActionOpen, onClose: onActionClose } = useDisclosure();

  const cardBg = useColorModeValue("white", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.600");
  const sidebarBg = useColorModeValue("gray.50", "gray.800");
  const activeBg = useColorModeValue("white", "gray.700");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Workflow-based organization
  const rentalWorkflow = [
    {
      title: "🏠 Rental Process",
      description: "Complete rental agreement workflow",
      color: "blue",
      actions: [
        {
          icon: FiPlusCircle,
          title: "Create Agreement",
          desc: "Start new rental agreement",
          method: "sendCreateAgreement",
          type: "send" as const,
          step: "1"
        },
        {
          icon: FiCheckCircle,
          title: "Accept Agreement",
          desc: "Tenant accepts terms",
          method: "sendAcceptAgreement",
          type: "send" as const,
          step: "2"
        },
        {
          icon: FiDollarSign,
          title: "Confirm Deposit",
          desc: "Landlord confirms deposit received",
          method: "sendDepositReceived",
          type: "send" as const,
          step: "3"
        },
        {
          icon: FiAward,
          title: "Claim at Term End",
          desc: "Complete rental and claim",
          method: "sendClaimAtTermEnd",
          type: "send" as const,
          step: "4"
        },
      ]
    },
    {
      title: "📊 View & Monitor",
      description: "Check agreements and contract status",
      color: "green",
      actions: [
        {
          icon: FiEye,
          title: "View Agreement",
          desc: "See agreement details",
          method: "getGetAgreement",
          type: "get" as const
        },
        {
          icon: FiBarChart,
          title: "Total Agreements",
          desc: "See total count",
          method: "getGetAgreementCounter",
          type: "get" as const
        },
        {
          icon: FiInfo,
          title: "Contract Info",
          desc: "View contract details",
          method: "getGetContractInfo",
          type: "get" as const
        },
        {
          icon: FiFilter,
          title: "Filter by Status",
          desc: "Find agreements by status",
          method: "getGetAgreementsByStatus",
          type: "get" as const
        },
      ]
    },
    {
      title: "⚠️ Management",
      description: "Administrative and emergency actions",
      color: "red",
      actions: [
        {
          icon: FiXCircle,
          title: "Cancel Agreement",
          desc: "Cancel existing agreement",
          method: "sendCancelAgreement",
          type: "send" as const
        },
        {
          icon: FiSettings,
          title: "Pause Contract",
          desc: "Admin: Pause operations",
          method: "sendSetPaused",
          type: "send" as const
        },
      ]
    }
  ];

  const handleActionSelect = (action: any, category: string) => {
    setSelectedAction({
      type: action.type,
      method: action.method,
      category
    });
    onActionOpen();
  };

  const handleActionClose = () => {
    onActionClose();
    setSelectedAction(null);
  };

  return (
    <Flex h="100vh" maxH="800px">
      {/* Left Sidebar - Categories */}
      <Box
        w="320px"
        bg={sidebarBg}
        borderRight="1px"
        borderColor={borderColor}
        p={4}
        overflowY="auto"
      >
        <VStack spacing={4} align="stretch">
          <Heading size="md" color="gray.700" mb={2}>
            🏠 Rental System
          </Heading>

          {rentalWorkflow.map((category, categoryIndex) => (
            <Card
              key={categoryIndex}
              bg={selectedCategory === categoryIndex ? activeBg : "transparent"}
              border={selectedCategory === categoryIndex ? "2px" : "1px"}
              borderColor={selectedCategory === categoryIndex ? `${category.color}.300` : borderColor}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{
                bg: activeBg,
                borderColor: `${category.color}.200`,
                transform: "translateX(2px)"
              }}
              onClick={() => {
                setSelectedCategory(categoryIndex);
                setSelectedAction(null);
                onActionClose();
              }}
            >
              <CardBody p={4}>
                <VStack align="start" spacing={2}>
                  <HStack justify="space-between" w="full">
                    <Text fontWeight="bold" fontSize="md">
                      {category.title}
                    </Text>
                    <Badge colorScheme={category.color} variant="subtle" size="sm">
                      {category.actions.length}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" noOfLines={2}>
                    {category.description}
                  </Text>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </VStack>
      </Box>

      {/* Right Content Area */}
      <Flex flex="1" direction="column">
        {/* Header */}
        <Box bg={cardBg} p={6} borderBottom="1px" borderColor={borderColor}>
          <VStack align="start" spacing={2}>
            <HStack align="center" spacing={3}>
              <Heading size="lg">{rentalWorkflow[selectedCategory].title}</Heading>
              <Badge
                colorScheme={rentalWorkflow[selectedCategory].color}
                variant="subtle"
                fontSize="sm"
              >
                {rentalWorkflow[selectedCategory].actions.length} actions
              </Badge>
            </HStack>
            <Text color="gray.600">
              {rentalWorkflow[selectedCategory].description}
            </Text>
          </VStack>
        </Box>

        {/* Actions Grid */}
        <Box flex="1" p={6} overflowY="auto">
          {!selectedAction ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6} h="fit-content">
              {rentalWorkflow[selectedCategory].actions.map((action: any, actionIndex: number) => (
                <Card
                  key={actionIndex}
                  variant="outline"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{
                    bg: hoverBg,
                    transform: "translateY(-2px)",
                    shadow: "lg",
                    borderColor: `${rentalWorkflow[selectedCategory].color}.300`
                  }}
                  onClick={() => handleActionSelect(action, rentalWorkflow[selectedCategory].title)}
                  borderWidth="2px"
                  h="fit-content"
                >
                  <CardBody p={6}>
                    <VStack spacing={4} align="center" textAlign="center">
                      <HStack>
                        <Icon
                          as={action.icon}
                          boxSize={6}
                          color={`${rentalWorkflow[selectedCategory].color}.500`}
                        />
                        {action.step && (
                          <Badge
                            size="md"
                            colorScheme={rentalWorkflow[selectedCategory].color}
                            variant="solid"
                          >
                            Step {action.step}
                          </Badge>
                        )}
                      </HStack>
                      <VStack spacing={2}>
                        <Text fontWeight="bold" fontSize="md">
                          {action.title}
                        </Text>
                        <Text fontSize="sm" color="gray.500" noOfLines={2}>
                          {action.desc}
                        </Text>
                      </VStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            /* Action Execution Area */
            <Box>
              <HStack mb={4} justify="space-between" align="center">
                <HStack spacing={3}>
                  <Icon
                    as={rentalWorkflow[selectedCategory].actions.find((a: any) => a.method === selectedAction.method)?.icon}
                    boxSize={5}
                    color={`${rentalWorkflow[selectedCategory].color}.500`}
                  />
                  <Heading size="md">
                    {rentalWorkflow[selectedCategory].actions.find((a: any) => a.method === selectedAction.method)?.title}
                  </Heading>
                </HStack>
                <Button size="sm" variant="ghost" onClick={handleActionClose}>
                  ← Back to Actions
                </Button>
              </HStack>

              {wrappers && wrappersConfig && (
                <ActionCard
                  visible={true}
                  methodName={selectedAction.method}
                  isGet={selectedAction.type === 'get'}
                  methodParams={wrappers["EscrowRegistry"][selectedAction.type === 'get' ? 'getFunctions' : 'sendFunctions'][selectedAction.method]}
                  buildAndExecute={buildAndExecute}
                  deploy={wrappers["EscrowRegistry"]["deploy"]}
                  methodConfig={wrappersConfig["EscrowRegistry"][selectedAction.type === 'get' ? 'getFunctions' : 'sendFunctions'][selectedAction.method]}
                  definedTypes={wrappers["EscrowRegistry"].definedTypes}
                  onClose={handleActionClose}
                />
              )}
            </Box>
          )}
        </Box>
      </Flex>
    </Flex>
  );
};

export default RentalWorkflow;