import React, { useState, useEffect, useMemo, useCallback } from "react";
import { injected, walletConnect } from "../wallet/connectors";
import { useWeb3React } from "@web3-react/core";

export const MetaMaskContext = React.createContext(null);

export const MetaMaskProvider = ({ children }) => {
  const { activate, account, library, active, deactivate, chainId } = useWeb3React();

  const [isActive, setIsActive] = useState(false);
  const [walletModal, setWalletModal] = useState(false);
  const [shouldDisable, setShouldDisable] = useState(false); // Should disable connect button while connecting to MetaMask
  const [isLoading, setIsLoading] = useState(true);

  // Init Loading
  useEffect(() => {
    async function fetchData() {
      var providerType = await sessionStorage.getItem("providerType");
      var isConnected = await sessionStorage.getItem("isConnected");
      if (isConnected) {
        connect(providerType).then((val) => {
          setIsLoading(false);
        });
      }
    }
    fetchData();
  }, []);

  // Check when App is Connected or Disconnected to MetaMask
  const handleIsActive = useCallback(() => {
    setIsActive(active);
  }, [active]);

  const handleWalletModal = async (state) => {
    console.log("state ===>" + state);
    setWalletModal(state);
  };

  useEffect(() => {
    handleIsActive();
  }, [handleIsActive]);

  // Connect to MetaMask wallet
  const connect = async (providerType) => {
    setShouldDisable(true);
    try {
      if (providerType === "metaMask") {
        await activate(injected).then(() => {
          setShouldDisable(false);
          sessionStorage.setItem("providerType", "metaMask");
          sessionStorage.setItem("isConnected", true);
        });
      } else if (providerType === "walletConnect") {
        await activate(walletConnect).then(() => {
          setShouldDisable(false);
          sessionStorage.setItem("providerType", "walletConnect");
          sessionStorage.setItem("isConnected", true);
        });
      } else {
      }
      setWalletModal(false);
    } catch (error) {
      console.log("Error on connecting: ", error);
    }
  };

  // Disconnect from Metamask wallet
  const disconnect = async () => {
    try {
      await deactivate();
      sessionStorage.removeItem("isConnected");
      sessionStorage.removeItem("providerType");
    } catch (error) {
      console.log("Error on disconnnect: ", error);
    }
  };

  const values = useMemo(
    () => ({
      isActive,
      account,
      isLoading,
      walletModal,
      handleWalletModal,
      connect,
      disconnect,
      library,
      chainId,
      shouldDisable,
    }),
    [isActive, isLoading, shouldDisable, account, walletModal, chainId]
  );

  return <MetaMaskContext.Provider value={values}>{children}</MetaMaskContext.Provider>;
};

export default function useMetaMask() {
  const context = React.useContext(MetaMaskContext);

  if (context === undefined) {
    throw new Error("useMetaMask hook must be used with a MetaMaskProvider component");
  }

  return context;
}
