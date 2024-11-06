import "@/styles/globals.css";
import type { AppProps } from "next/app";
import React, { useMemo } from "react";
import localFont from "@next/font/local";

import Web3 from "web3";
import { Web3ReactProvider } from "@web3-react/core";
import { MetaMaskProvider } from "../wallet/hook";

import { EthereumClient, w3mConnectors, w3mProvider } from "@web3modal/ethereum";
import { Web3Modal } from "@web3modal/react";
import { configureChains, createConfig, WagmiConfig } from "wagmi";
import { polygon } from "wagmi/chains";

import {
  ChakraProvider,
  theme,
  // @ts-ignore
} from '@chakra-ui/react';

function getLibrary(provider: any, connector: any) {
  return new Web3(provider);
}

const hitchcut = localFont({
  src: "../public/assets/fonts/hitchcut.ttf",
  variable: "--font-hitchcut",
});

// Chains
const chains = [polygon];
// Infura Project ID.
const projectId: any = process.env.projectId || "";

const { publicClient } = configureChains(chains, [w3mProvider({ projectId })]);

const wagmiConfig = createConfig({
  autoConnect: false,
  connectors: w3mConnectors({ projectId, chains }),
  publicClient,
});

const ethereumClient = new EthereumClient(wagmiConfig, chains);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
        {/* <MetaMaskProvider> */}
          <div className={`w-[100vw] h-[100vh] overflow-y-auto nobar ${hitchcut.variable}`} >
              <ChakraProvider theme={theme}>
                <WagmiConfig config={wagmiConfig}>
                  <Component {...pageProps} />
                </WagmiConfig>
                <Web3Modal projectId={projectId} ethereumClient={ethereumClient} />
              </ChakraProvider>            
          </div>
      {/* </MetaMaskProvider> */}
    </Web3ReactProvider>
  );
}
