import { InjectedConnector } from '@web3-react/injected-connector'
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";

export const injected = new InjectedConnector({ supportedChainIds: [process.env.chainId] })
export const walletConnect = new WalletConnectConnector({
  rpc: { [process.env.chainId]: process.env.rpcNode },
  qrcode: true,
});