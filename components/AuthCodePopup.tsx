import { useToast } from "@chakra-ui/react";
import React, { useState } from "react";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { writeContract, waitForTransaction } from '@wagmi/core';
import { ethers } from "ethers";
import axios from "axios";
import BN from "bn.js";

const provider = new ethers.providers.JsonRpcProvider(process.env.rpcNode);

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface ImagePopupProps {
  action: string;
  selected: any;
  setSelected: any;
  tokens: any,
  isPopupOpen: boolean;
  setPopupOpen: any;
  wallet: any;
  forceRefresh: any;
  walletToFund: string;
}

const AuthCodePopup: React.FC<ImagePopupProps> = ({
  action,
  selected,
  setSelected,
  tokens,
  setPopupOpen,
  isPopupOpen,
  wallet,
  forceRefresh,
  walletToFund,
}) => {
  const toast = useToast();

  const [theNewOwner, setTheNewOwner] = useState("");
  const [selectedToken, setSelectedToken] = useState("");
  const [selectedTokenAddr, setSelectedTokenAddr] = useState("");
  const [mode, setMode] = useState("DEPOSIT");
  const [isEmergencyOn, setIsEmergencyOn] = useState(false);
  const [amount, setAmountSelected] = useState("0");

  const getRealTimeETHPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const data = await response.json();

      if (data["ethereum"].usd) {
        return data["ethereum"].usd;
      }
      return 2000;
    } catch (error) {
      return 2000;
    }
  }

  const getRealTimeMATICPrice = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd');
      const data = await response.json();

      if (data["matic-network"].usd) {
        return data["matic-network"].usd;
      }
      return 2000;
    } catch (error) {
      return 2000;
    }
  }

  const checkCollectionLevel = async (collection: any) => {
    console.log("checkCollectionLevel!");
    try {
      const contractAddr: any = process.env.smartContract;
      const contractABI: any = process.env.smartContractABI;
      const contract = new ethers.Contract(contractAddr, contractABI, provider);
      let res = await contract.whitelist(collection);
      console.log("checkCollectionLevel", res.toString());
      
      return res;
    } catch (error) {
      console.log("checkCollectionLevel", error);
      return 0;
    }
  }

  const checkWhitelist = async () => {
    console.log("checkCollectionLevel!");
    try {
      const contractAddr: any = process.env.smartContract;
      const contractABI: any = process.env.smartContractABI;
      const contract = new ethers.Contract(contractAddr, contractABI, provider);
      let res = await contract.checkWhitelist(wallet);
      console.log("isWhitelist", res.toString());
      
      return res;
    } catch (error) {
      console.log("checkWhitelist", error);
      return 0;
    }
  }
  
  const getRevenueAmount = async () => {
    console.log("getRevenueAmount!");
    try {
      const contractAddr: any = process.env.smartContract;
      const contractABI: any = process.env.smartContractABI;
      const contract = new ethers.Contract(contractAddr, contractABI, provider);
      let res = await contract.getHealth(wallet);
      console.log("getHealth", res.toString());
      if (parseInt(res) > 0) return 0;
    } catch (error) {
      console.log(error);
    }
    const maticPrice = await getRealTimeMATICPrice();
    const revenue: any = process.env.revenue;
    return  parseFloat(revenue) / maticPrice + 0.0005;
  }
  
  const checkConfirmation = async (txHash: string) => {
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt && receipt.blockNumber) {
          console.log(`Transaction confirmed in block number: ${receipt.blockNumber}`);
          return true;
      } else {
          console.log('Transaction is still pending...');
          return false;
      }
  };

  const submitWriteTx = async (address: any, abi: any, func: string, params: any, revenue: any) => {
    console.log("submitWriteTx: ", func, params, revenue);

    let txHash = null;
    try {
      let writeParams: any;
      if (revenue == 0) {
        writeParams = {
          // @ts-ignore
          address: address,
          // @ts-ignore
          abi: abi,
          functionName: func,
          args: params 
        };
      } else {
        writeParams = {
          // @ts-ignore
          address: address,
          // @ts-ignore
          abi: abi,
          functionName: func,
          args: params,
          value: ethers.utils.parseEther(revenue.toString()), 
        };
      }

      const { hash } = await writeContract(writeParams)
    
      if (!hash) {
        return {
          result: false
        };
      }

      txHash = hash;

      try {
        const res = await waitForTransaction({
          hash,
          confirmations: 1
        });

        if (res.transactionHash != hash) {
          return {
            result: false
          };  
        }

        return {
          result: true,
          hash
        };
      } catch (error: any) {
        if (error.name == "TransactionNotFoundError") {
          return {
            result: true,
            hash: txHash
          };
        } else {
          return {
            result: false
          };  
        }
      }  
    } catch (error) {
      console.log("submitWriteTx", address, func, params, error);
      return {
        result: false
      };
    }
  }

  const togglePopup = () => {
    setPopupOpen(!isPopupOpen);
  };

  const addRevenue = async (params: any) => {
    console.log("addRevenue", wallet);

    try {      
      let fetchTheLockTx = await fetch(
        // @ts-ignore: Object is possibly 'null'.
        `/api/defendersHandler/${wallet}`,
        {
          method: "POST", // or 'PUT' or 'PATCH' depending on your API
          headers: {
            "Content-Type": "application/json",
            // Add any other headers if needed
          },
          body: JSON.stringify({
            ...params,
            endpoint: "add-revenue"
          }),
        }
      );

      const txRes = await fetchTheLockTx.json();
      // Lock/UnLock
      console.log("RESULT: ", action, txRes);

    } catch (e) {
      console.log("addRevenue", params, e);
    }
  };

  const lockUnlockNfts = async () => {
    console.log("=== lockUnlockNfts ===");

    if (!wallet) return;

    let txRes: any = null;

    if (!selected[0].locked) {
      action = "lock";
    }

    console.log(`=== lockUnlockNfts: ${action} action selected ===`);

    try {      
      let fetchTheLockTx = await fetch(
        // @ts-ignore: Object is possibly 'null'.
        `/api/defendersHandler/${wallet}`,
        {
          method: "POST", // or 'PUT' or 'PATCH' depending on your API
          headers: {
            "Content-Type": "application/json",
            // Add any other headers if needed
          },
          body: JSON.stringify({
            code: totpCode,
            mints: selected.map((x: { mint: any; nftType: any, id: any }) => ({
              address: x.mint,
              nftType: x.nftType,
              id: x.id
            })),
            endpoint: action, // wrong action is being passed here
          }),
        }
      );

      txRes = await fetchTheLockTx.json();

      console.log("lockUnlockNfts: ", txRes);

      if (txRes.data.errorCode === 500) {
        toast({
          title: `Something went wrong! Please try again..`,
          description: ``,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Lock/UnLock
      console.log("RESULT: ", action, txRes);

    } catch (e) {
      console.log(e);
      toast({
        title: `Something went wrong! Please try again..`,
        description: ``,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (action == "lock") {
      // Lock NFTs
      for (let nft of selected) {
        let whitelistLevel: any = await checkWhitelist();
        let revenueValue: any = 0;
        
        if (whitelistLevel < 3) {
          revenueValue = await getRevenueAmount();
        }

        if (whitelistLevel == 2) {
          let collecitonLevel: any = await checkCollectionLevel(nft.mint);
          if (collecitonLevel >= 2) {
            revenueValue = 0;
          }
        }

        console.log("Token Revenue: ", revenueValue);

        try {      
          console.log("=== Approve Tx ===");
          const approveABI = process.env.ERC721ABI;
          const resApprove = await submitWriteTx(nft.mint, approveABI, "approve", [process.env.smartContract, nft.id], 0);    
          if (!resApprove.result) {
            toast({
              title: `Transaction Failed...`,
              description: ``,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            return;
          }

          await sleep(10000);

          console.log("=== Lock Tx ===");
          
          const resLock = await submitWriteTx(process.env.smartContract, process.env.smartContractABI, "lockNFT", [nft.mint, nft.id], revenueValue);   
          if (!resLock.result) {
            toast({
              title: `Transaction Failed...`,
              description: ``,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            return;
          }

          console.log("resLock", resLock);
          if (revenueValue > 0) {
            console.log("=============== AddRevenue =========")
            // Revenue
            const params = {
              address: wallet,
              amountInUSDT: process.env.revenue + "000000",
              txHash: resLock.hash,
              tokenName: "Polygon",
              amountInToken: ethers.utils.parseEther(revenueValue.toString()).toString(),
              chainID: process.env.chainId,
              functionType: "lockNFT"
            };

            await addRevenue(params);
          }
        } catch (error) {
          console.log(error);
          toast({
            title: `Something went wrong! Please try again..`,
            description: ``,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return undefined;
        }

        // @ts-ignore
        await sleep(parseInt(process.env.delayUpdate));
      }
      setSelected([]);
      forceRefresh();
      togglePopup();
    } else {
      // UnLock NFTs
      console.log(ethers);
      const scAddr: any = process.env.smartContract;
      const scABI: any = process.env.smartContractABI;
      const contract = new ethers.Contract(scAddr, scABI, provider);
      const res = await contract.getUserlockedNFTs(wallet);

      console.log(res);

      for (let nft of selected) {
        let index = -1;
        console.log(nft);

        for (let i = 0; i < res.length; i++) {
          console.log(res[i], res[i][1]);
          if (res[i].nftCollection.toLowerCase() == nft.mint.toLowerCase() && res[i].tokenId.toString() == nft.id.toString()) {
            index = i;
            break;
          }
        }

        console.log(index);
        if (index == -1) continue;

        const resUnLock = await submitWriteTx(process.env.smartContract, process.env.smartContractABI, "unlockNFT", [index], 0); 
        if (!resUnLock.result) {
          toast({
            title: `Transaction Failed...`,
            description: ``,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        await sleep(10000);
      }

      // @ts-ignore
      await sleep(parseInt(process.env.delayUpdate));
      setSelected([]);
      forceRefresh();
      togglePopup();
    }
  };

  const setOwner = (event: any) => {
    //const value = parseInt(event.target.value, 10) || 0;
    setTheNewOwner(event.target.value);
  };

  const emergencyHandler = async (type: any, tokenIndex: number, decimals: number) => {
    if (theNewOwner == "" || totpCode == "" || !wallet) {
      return;
    }
    
    let txRes = null;
    let param: any = [];
    switch (type) {
      case 'nft':
        if (selected == null) {
          return;
        }
        if (selected.length == 0) {
          return;
        }
        if (!selected[0].locked) {
          return;
        } 

        let nfts = selected.map((value: any) => {
          return value.index;
        })

        param = [wallet, nfts, 0, [], [], theNewOwner];
        break;
      case 'token':
        param = [wallet, [], "0", [tokenIndex], [(Number(amount) * Math.pow(10, decimals)).toString()], theNewOwner];
        break;
      case 'coin':
        param = [wallet, [], (Number(amount) * Math.pow(10, decimals)).toString(), [], [], theNewOwner];
        break;
    }

    try {
      let fetchTheLockTx = await fetch(
        // @ts-ignore: Object is possibly 'null'.
        `/api/defendersHandler/${wallet}`,
        {
          method: "POST", // or 'PUT' or 'PATCH' depending on your API
          headers: {
            "Content-Type": "application/json",
            // Add any other headers if needed
          },
          body: JSON.stringify({
            code: totpCode,
            wallet: wallet.toString(),
            param: param,
            endpoint: "emergency",
          }),
        }
      );

      txRes = await fetchTheLockTx.json();

      console.log("emergencyHandler", txRes);

      if (txRes.data.errorCode === 500) {
        toast({
          title: `Something went wrong! Please try again.`,
          description: ``,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    } catch (e) {
      console.log(e);
      toast({
        title: `Unable to process transaction.`,
        description: ``,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }
  
    console.log("emergencyHandler", txRes.data);

    toast({
      title: `Transaction is confirmed!`,
      description: ``,
      status: "success",
      duration: 5000,
      isClosable: true,
    });

    setSelected([]);
    forceRefresh();
    togglePopup();
  };

  const lockUnlockToken = async () => {
    console.log("lockUnlockToken");

    let endpoint = "";

    if (mode === "WITHDRAW") {
      endpoint = "token-unlock";
    } else {
      endpoint = "token-lock";
    }

    let decimals = 18;
    let balance = 0;
    let lockedBalance = 0;

    console.log("lockUnlockToken: ", endpoint, selectedTokenAddr, decimals, amount);

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].address.toLowerCase() == selectedTokenAddr.toLocaleLowerCase()) {
        decimals = tokens[i].decimals;
        balance = parseFloat(ethers.utils.formatUnits(tokens[i].balance, tokens[i].decimals));
        lockedBalance = parseFloat(ethers.utils.formatUnits(tokens[i].lockedBalance, tokens[i].decimals));
        break;
      }
    }

    // Check Balance
    if (mode === "WITHDRAW") {
      if (lockedBalance < parseFloat(amount)) {
        toast({
          title: `Lock Balance is ${lockedBalance}.`,
          description: ``,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    } else {
      if (balance < parseFloat(amount)) {
        toast({
          title: `Inenough Balance.`,
          description: ``,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    }

    let txRes: any;

    try {
      let fetchTheLockTx = await fetch(
        // @ts-ignore: Object is possibly 'null'.
        `/api/defendersHandler/${wallet}`,
        {
          method: "POST", // or 'PUT' or 'PATCH' depending on your API
          headers: {
            "Content-Type": "application/json",
            // Add any other headers if needed
          },
          body: JSON.stringify({
            code: totpCode,
            wallet: wallet.toString(),
            token: selectedTokenAddr,
            amount: (Number(amount) * Math.pow(10, decimals)).toString(),
            endpoint: endpoint,
          }),
        }
      );

      txRes = await fetchTheLockTx.json();

      if (txRes.data.errorCode === 500) {
        toast({
          title: `Something went wrong! Please try again..`,
          description: ``,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
    } catch (e) {
      console.log(e);
      toast({
        title: `Unable to process transaction.`,
        description: ``,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    console.log("lockUnlockToken", txRes.data);

    console.log(mode);

    // UnLock/Lock Token
    if (mode === "WITHDRAW") {
      if (selectedTokenAddr == "") {
        if (isEmergencyOn && theNewOwner != "") {
          await emergencyHandler("coin", 0, decimals);
          return;
        }

        const resUnLock = await submitWriteTx(process.env.smartContract, process.env.smartContractABI, "unlockCoin", [(Number(amount) * Math.pow(10, decimals)).toString()], 0); 
        if (!resUnLock.result) {
          toast({
            title: `Transaction Failed...`,
            description: ``,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }
        // @ts-ignore
        await sleep(parseInt(process.env.delayUpdate));

        setSelected([]);
        forceRefresh();
        togglePopup();
        return;
      }

      const srAddr: any = process.env.smartContract;
      const scABI: any = process.env.smartContractABI;
      const contract = new ethers.Contract(srAddr, scABI, provider);
      const res = await contract.getUserlockedTokens(wallet);

      console.log(res);

      let index = -1;
      for (let i = 0; i < res.length; i++) {
        if (res[i][0].toLowerCase() == selectedTokenAddr.toLowerCase()) {
          index = i;
          break;
        }
      }

      console.log(index);

      if (index == -1) {
        toast({
          title: `Transaction Failed...`,
          description: ``,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      if (isEmergencyOn && theNewOwner != "") {
        await emergencyHandler("token", index, decimals);
        return;
      }

      const resUnLock = await submitWriteTx(process.env.smartContract, process.env.smartContractABI, "unlockToken", [index, (Number(amount) * Math.pow(10, decimals)).toString()], 0); 
      if (!resUnLock.result) {
        toast({
          title: `Transaction Failed...`,
          description: ``,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      // @ts-ignore
      await sleep(parseInt(process.env.delayUpdate));

      setSelected([]);
      forceRefresh();
      togglePopup();
    } else {
      try {      
        console.log("=== Approve Tx ===");
        const approveABI = process.env.ERC20ABI;

        let whitelistLevel: any = await checkWhitelist();
        let revenueValue: any = 0;
        
        if (whitelistLevel < 3) {
          revenueValue = await getRevenueAmount();
        }

        console.log("Token Revenue: ", revenueValue);

        if (selectedTokenAddr == "") {
          const resLock = await submitWriteTx(process.env.smartContract, process.env.smartContractABI, "lockCoin", [(revenueValue * Math.pow(10, decimals)).toString()], Number(amount) + revenueValue);   
          if (!resLock.result) {
            toast({
              title: `Transaction Failed...`,
              description: ``,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            return;
          }

          if (revenueValue > 0) {
            // Revenue
            const params = {
              address: wallet,
              amountInUSDT: process.env.revenue + "000000",
              txHash: resLock.hash,
              tokenName: "Polygon",
              amountInToken: ethers.utils.parseEther(revenueValue.toString()).toString(),
              chainID: process.env.chainId,
              functionType: "lockToken"
            };

            await addRevenue(params);
          }

          // @ts-ignore
          await sleep(parseInt(process.env.delayUpdate));

          setSelected([]);
          forceRefresh();
          togglePopup();          
          return;
        }
        const resApprove = await submitWriteTx(selectedTokenAddr, approveABI, "approve", [process.env.smartContract, (Number(amount) * Math.pow(10, decimals)).toString()], 0);    
        if (!resApprove.result) {
          toast({
            title: `Transaction Failed...`,
            description: ``,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        await sleep(10000);

        console.log("=== Lock Tx ===");

        const resLock = await submitWriteTx(process.env.smartContract, process.env.smartContractABI, "lockToken", [selectedTokenAddr, (Number(amount) * Math.pow(10, decimals)).toString()], revenueValue);   
        if (!resLock.result) {
          toast({
            title: `Transaction Failed...`,
            description: ``,
            status: "error",
            duration: 5000,
            isClosable: true,
          });
          return;
        }

        if (revenueValue > 0) {
          // Revenue
          const params = {
            address: wallet,
            amountInUSDT: process.env.revenue + "000000",
            txHash: resLock.hash,
            tokenName: "Polygon",
            amountInToken: ethers.utils.parseEther(revenueValue.toString()).toString(),
            chainID: process.env.chainId,
            functionType: "lockToken"
          };

          await addRevenue(params);
        }

        // @ts-ignore
        await sleep(parseInt(process.env.delayUpdate));

        setSelected([]);
        forceRefresh();
        togglePopup();
      } catch (error) {
        console.log(error);
        return undefined;
      }
    }
  };

  const [totpCode, setTotpCode] = useState("");

  const handleTotpChange = (event: any) => {
    //const value = parseInt(event.target.value, 10) || 0; 
    setTotpCode(event.target.value);
  };

  return (
    <div>
      {isPopupOpen && (
        <div className="popup-overlay">
          <div className="flex items-center justify-center flex-col ">
            {(action === "lock" || action === "unlock") && (
              <>
                <div className="text-3xl text-white font-bold my-5">
                  VERIFY YOUR IDENTITY
                </div>
                <div className="text-xl text-white font-semibold  mb-5">
                  Check your authenticator app for the verification code
                </div>

                <div className="bg-[#1A202C]  rounded-xl border p-2 border-[#17D58C] flex flex-row   w-[400px] mx-auto ">
                  <input
                    className="text-white outline-none text-md p-3 bg-transparent font-regular w-full "
                    type="text"
                    value={totpCode}
                    onChange={handleTotpChange}
                    placeholder="ENTER AUTH CODE"
                  />
                  <button
                    className="font-bold bg-white px-6  flex items-center justify-between gap-5 py-3 text-sm  rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out"
                    onClick={lockUnlockNfts}
                  >
                    CONFIRM
                    <MdOutlineKeyboardArrowRight
                      className="text-[#17D58C]"
                      size={20}
                    />
                  </button>
                </div>
                <button
                  onClick={togglePopup}
                  className="text-[#fff] mt-5 cursor-pointer hover:opacity-80 text-sm font-bold"
                >
                  CANCEL & GO BACK
                </button>
              </>
            )}

            {action === "transfer-ownership" && (
              <>
                <div className="text-3xl text-white font-bold my-5">
                  PLEASE FUND THE FOLLOWING WALLET WITH{" "}
                  {Number(
                    selected.length * 0.00203928 +
                      0.000005 * selected.length +
                      0.01
                  ).toFixed(7)}{" "}
                  MATIC
                  <br></br>
                  <p className="text-sm text-center  text-white px-3 py-2 rounded-full">
                    {" "}
                    {walletToFund}
                  </p>
                </div>

                <div className="bg-[#1A202C]  rounded-xl border p-2 border-[#17D58C] flex flex-row   w-[400px] mx-auto ">
                  <input
                    className="text-white outline-none text-md p-3 bg-transparent font-regular w-full "
                    type="text"
                    value={theNewOwner}
                    onChange={setOwner}
                    placeholder="ENTER WALLET ADDRESS"
                  />
                </div>

                <div className="bg-[#1A202C] mt-2 rounded-xl border p-2 border-[#17D58C] flex flex-row   w-[400px] mx-auto ">
                  <input
                    className="text-white outline-none text-md p-3 bg-transparent font-regular w-full "
                    type="text"
                    value={totpCode}
                    onChange={handleTotpChange}
                    placeholder="ENTER AUTH CODE"
                  />
                  <button
                    className="font-bold bg-white px-6  flex items-center justify-between gap-5 py-3 text-sm  rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out"
                    onClick={() => emergencyHandler("nft", 0, 0)}
                  >
                    CONFIRM
                    <MdOutlineKeyboardArrowRight
                      className="text-[#17D58C]"
                      size={20}
                    />
                  </button>
                </div>

                <button
                  onClick={togglePopup}
                  className="text-[#fff] mt-5 cursor-pointer hover:opacity-80 text-sm font-bold"
                >
                  CANCEL & GO BACK
                </button>
              </>
            )}

            {action === "token-lock" && (
              <>
                <div
                  onClick={(e) =>
                    setMode(mode === "WITHDRAW" ? "DEPOSIT" : "WITHDRAW")
                  }
                  //onClick={toggleOperation}
                  className="text-3xl text-white font-bold my-5 cursor-pointer hover:opacity-80"
                >
                  {mode === "WITHDRAW" ? "WITHDRAW" : "DEPOSIT"}
                  <p className="text-xs text-center">TAP TO CHANGE</p>
                </div>

                {
                  mode === "WITHDRAW"? 
                  <div className="bg-[#1A202C] font-bold rounded-xl border px-2 py-0 border-[#17D58C] flex flex-row w-[400px] mx-auto mb-5">
                    <div className="text-white outline-none text-xl p-3 bg-transparent font-regular w-full">
                        EMERGENCY MIGRATION
                    </div>
                    <button
                      className="font-bold bg-transparent pl-4 pr-2 flex items-center justify-between gap-5 py-3 text-xl rounded-full text-[#17D58C] transition-all duration-300 ease-in-out"
                      onClick={(e) => setIsEmergencyOn(!isEmergencyOn)}
                    >
                      { isEmergencyOn? "ON": "OFF" }
                      <MdOutlineKeyboardArrowRight
                        className="text-[#17D58C]"
                        size={20}
                      />
                    </button>
                  </div>
                  : <></>
                }

                <select
                  className="text-white text-xl outline-none font-black w-full mb-5 bg-[#1A202C] rounded-xl border p-2 border-[#17D58C]"
                  value={selectedToken}
                  onChange={(e) => {
                    setSelectedToken(e.target.value);
                    setSelectedTokenAddr(tokens[e.target.selectedIndex - 1].address)
                  }}
                >
                  <option value="" disabled>
                    Select Token
                  </option>
                  {tokens.map((token: any, index: any) => (
                    <option key={index} value={token.name}>
                      {token.name}
                    </option>
                  ))}
                </select>

                <div className="bg-[#1A202C] rounded-xl border p-2 border-[#17D58C] flex flex-row w-[400px] mx-auto mb-5">
                  <input
                    className="text-white outline-none text-md p-3 bg-transparent font-regular w-full "
                    type="text"
                    value={amount}
                    onChange={(e) => setAmountSelected(e.target.value)}
                    placeholder="ENTER AMOUNT"
                  />
                </div>

                {
                  isEmergencyOn && mode === "WITHDRAW"?
                  <div className="bg-[#1A202C] rounded-xl border p-2 border-[#17D58C] flex flex-row w-[400px] mx-auto mb-5">
                    <input
                      className="text-white outline-none text-md p-3 bg-transparent font-regular w-full "
                      type="text"
                      value={theNewOwner}
                      onChange={(e) => setTheNewOwner(e.target.value)}
                      placeholder="ENTER NEW OWNER ADDRESS"
                    />
                  </div>
                  : <></>
                }

                <div className="bg-[#1A202C]  rounded-xl border p-2 border-[#17D58C] flex flex-row   w-[400px] mx-auto ">
                  <input
                    className="text-white outline-none text-md p-3 bg-transparent font-regular w-full "
                    type="text"
                    value={totpCode}
                    onChange={handleTotpChange}
                    placeholder="ENTER AUTH CODE"
                  />
                  <button
                    className="font-bold bg-white px-6  flex items-center justify-between gap-5 py-3 text-sm  rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out"
                    onClick={lockUnlockToken}
                  >
                    CONFIRM
                    <MdOutlineKeyboardArrowRight
                      className="text-[#17D58C]"
                      size={20}
                    />
                  </button>
                </div>
                <button
                  onClick={togglePopup}
                  className="text-[#fff] mt-5 cursor-pointer hover:opacity-80 text-sm font-bold"
                >
                  CANCEL & GO BACK
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthCodePopup;
