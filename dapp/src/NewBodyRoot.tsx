import {
  Box,
  Center,
  Heading,
  Text,
  VStack,
  useColorModeValue,
} from "@chakra-ui/react";
import React, { useCallback, useEffect, useState } from "react";
import { ParamsWithValue } from "./components/ActionCard";
import { Executor } from "./genTxByWrapper";
import { Address } from "@ton/core";
import { WrappersConfig, WrappersData } from "./utils/wrappersConfigTypes";
import { loadWrappersFromJSON } from "./utils/loadWrappers";
import { useTonConnectUI, useTonWallet } from "@tonconnect/ui-react";
import RentalWorkflow from "./components/RentalWorkflow";

interface NewBodyRootProps {
  areGetMethods: boolean;
  setIsGetMethods: React.Dispatch<React.SetStateAction<boolean>>;
  wrapperFromUrl?: string;
  methodFromUrl?: string;
  addressFromUrl?: string;
}

function NewBodyRoot(props: NewBodyRootProps) {
  const [wrappers, setWrappers] = useState<WrappersData | null>(null);
  const [wrappersConfig, setWrappersConfig] = useState<WrappersConfig | null>(null);

  // Initialize configAddress with environment variable if available
  const [configAddress, setConfigAddress] = useState<Address | null>(() => {
    try {
      const envAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
      return envAddress ? Address.parse(envAddress) : null;
    } catch {
      return null;
    }
  });

  const [tcUI] = useTonConnectUI();
  const wallet = useTonWallet();
  const [executor, setExecutor] = useState<Executor | null>(null);

  const bg = useColorModeValue("#f7f9fb", "gray.900");

  useEffect(() => {
    const updateExecutor = async () => {
      setExecutor(await Executor.createFromUI(tcUI));
    };
    updateExecutor();
  }, [wallet]);

  const preloadWrappers = useCallback(async () => {
    const [parsedWrappers, parsedConfig] = await loadWrappersFromJSON();
    return { parsedWrappers, parsedConfig };
  }, []);

  useEffect(() => {
    async function loadWrappers() {
      const { parsedWrappers, parsedConfig } = await preloadWrappers();
      const _wrappers = { ...parsedWrappers };

      // Filter out wrappers with no methods
      for (const _wrapper in parsedWrappers) {
        const hasSendMethods = Object.keys(parsedWrappers[_wrapper]["sendFunctions"]).length > 0;
        const hasGetMethods = Object.keys(parsedWrappers[_wrapper]["getFunctions"]).length > 0;
        if (!hasSendMethods && !hasGetMethods) {
          delete _wrappers[_wrapper];
        }
      }

      setWrappers(_wrappers);
      setWrappersConfig(parsedConfig);
    }

    loadWrappers().catch((e) => console.error('Error when trying to call loadWrappers()', e));
  }, []);

  useEffect(() => {
    // Set config address from environment variable
    if (wrappers && wrappersConfig) {
      const envAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
      if (envAddress && envAddress.trim() !== "") {
        try {
          const parsedAddress = Address.parse(envAddress);
          console.log("Setting config address from environment:", parsedAddress.toString());
          setConfigAddress(parsedAddress);
          return;
        } catch (e) {
          console.error("Failed to parse environment contract address:", e);
        }
      }

      // Fallback to other methods if env var fails
      const wrapper = "EscrowRegistry"; // Default to EscrowRegistry
      const defaultAddress = wrappersConfig[wrapper]["defaultAddress"];
      if (defaultAddress && defaultAddress.trim() !== "") {
        try {
          setConfigAddress(Address.parse(defaultAddress));
          return;
        } catch (e) {
          console.error("Failed to parse default address from config:", e);
        }
      }

      setConfigAddress(null);
    }
  }, [wrappers]);

  const buildAndExecute = async (isGet: boolean, methodName: string, params: ParamsWithValue) => {
    console.log("buildAndExecute called with:", {
      configAddress: configAddress?.toString(),
      methodName
    });

    if (!wrappers) throw new Error("Wrappers are empty, not loaded?");
    if (!executor) throw new Error("No executor");

    if (!configAddress) {
      console.warn("no address available");
      return;
    }

    if (methodName === "sendDeploy") {
      const deployData = wrappers["EscrowRegistry"]["deploy"];
      if (deployData["codeHex"] && deployData["configType"]) {
        return await executor.deploy(
          wrappers["EscrowRegistry"]["path"],
          "EscrowRegistry",
          params,
          deployData["configType"],
          deployData["codeHex"]
        );
      } else throw new Error("Deploy data is missing");
    }

    const executeParams = [
      configAddress,
      wrappers["EscrowRegistry"]["path"],
      "EscrowRegistry",
      methodName,
      params,
    ] as const;

    console.log("Using contract address:", configAddress.toString());
    if (isGet) return await executor.get(...executeParams);

    await executor.send(...executeParams);
  };

  if (!wrappers || !wrappersConfig) {
    return (
      <Box bg={bg} minHeight="50vh">
        <Center>
          <VStack spacing={4} py={10}>
            <Heading size="md" color="gray.500">Loading Contract Interface...</Heading>
            <Text fontSize="sm" color="gray.400">
              TAAS
            </Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box bg={bg} minHeight="50vh" py={6}>
      <Center>
        <Box maxW="6xl" w="full" px={4}>
          <VStack spacing={8} align="stretch">
            {/* Header */}
            <VStack spacing={2} textAlign="center">
              <Heading size="lg" color="gray.700">
                TAAS 
              </Heading>
              <Text color="gray.500" maxW="md">
                Secure, transparent rental agreements on the TON blockchain.
                Choose an action below to get started.
              </Text>
              {configAddress && (
                <Text fontSize="xs" color="gray.400" fontFamily="mono">
                  Contract: {configAddress.toString()}
                </Text>
              )}
            </VStack>

            {/* Main Workflow */}
            <RentalWorkflow
              buildAndExecute={buildAndExecute}
              wrappers={wrappers}
              wrappersConfig={wrappersConfig}
            />
          </VStack>
        </Box>
      </Center>
    </Box>
  );
}

export default NewBodyRoot;