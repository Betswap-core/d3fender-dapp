import axios from "axios";
import { readContract, waitForTransaction } from '@wagmi/core';
import { ethers } from "ethers";
import https from 'https';

const provider = new ethers.providers.JsonRpcProvider(process.env.rpcNode);

export const getUserStats = async (address: string) => {
    console.log("getUserStats: ", address); 
    if (!address) return [];

    let walletData : any = {};

    try{
      let infoFetch = await fetch(
        // @ts-ignore: Object is possibly 'null'.
        `/api/defendersHandler/${address}`,
        {
          method: 'POST', // or 'PUT' or 'PATCH' depending on your API
          headers: {
            'Content-Type': 'application/json',
            // Add any other headers if needed
          },
          body: JSON.stringify({
            endpoint: 'user-stats',
            wallet: address
          }),
        }
      );

      walletData = await infoFetch.json();

      console.log("getUserStats: ", walletData);

      if(walletData.data.errorCode == 500){
        walletData = {
          data: {
              nfts: [],
              tokens: [],
              lockedNfts: [],
              defendersLocked: 0,
              points: 0,
              timeStaked: 0,
              totp: ""
          }
        };
      }

    } catch(e){
      walletData = {
        data: {
            nfts: [],
            tokens: [],
            lockedNfts: [],
            defendersLocked: 0,
            points: 0,
            timeStaked: 0,
            totp: ""
        }
      };
    }

  console.log("walletData: ", walletData);

  return {
    walletNfts: walletData.data.nfts != undefined? walletData.data.nfts: [],
    unlockedTokens: walletData.data.unlockedTokens != undefined? walletData.data.unlockedTokens: [],
    lockedTokens: walletData.data.lockedTokens != undefined? walletData.data.lockedTokens: [] 
  };
};