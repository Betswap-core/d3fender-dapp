import Image from "next/image";
import { useToast } from "@chakra-ui/react";
import { Inter } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import React, { useEffect, useState } from "react";
import { getUserStats } from "@/utils/transactions";
import ImagePopup from "@/components/ImagePopup";
import AuthCodePopup from "@/components/AuthCodePopup";
import UnlockIcon from "@/components/UnlockIcon";
import ConnectWallet from "@/components/ConnectWallet";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { Nft } from "../types/nft";
import { Token } from "@/types/token";
import { useAccount, useWalletClient, useSendTransaction } from "wagmi";
import { ethers } from "ethers";
import AddWalletPopup from "@/components/AddWalletPopup";
import ChooseToken from "@/components/ChooseToken";
import { USER } from "../types/user";
import { connect } from "http2";
import ConnectWalletBody from "@/components/ConnectWalletBody";
import { writeContract, waitForTransaction, signMessage } from '@wagmi/core';
import { parseEther } from 'viem';
import Router from 'next/router'

const provider = new ethers.providers.JsonRpcProvider(process.env.rpcNode);

export default function Setting() {
    const { address, connector } = useAccount();
    const toast = useToast();
    const [userInfo, setUserInfo] = useState<USER>({
        email: "",
        phone: "",
        mainWallet: "",
        referralCode: "",
        referrerCode: "",
        paymentTokenLists: "",
        referredNum: 0,
        revenue: "0",
        wallets: []
    });
    const [tabOpened, setTabOpened] = useState(0);
    const [base64ImageString, setBase64ImageString] = useState("");
    const [encodedTOTP, setEncodedTOTP] = useState("");

    const [totpCode, setTotpCode] = useState("");
    const [refreshHandle, forceRefresh] = React.useReducer((x) => x + 1, 0);
    const [isPopupAddWallet, setPopupAddWallet] = useState(false);
    const [isPopupToken, setPopupToken] = useState(false);
    const [isPopupResetSecret, setPopupResetSecret] = useState(false);
    const [action, setAction]: any = useState("");
    
    const openAddWallet = async () => {
        setAction("addAccount");
        setPopupAddWallet(!isPopupAddWallet);
    };

    const updateEmail = async () => {
        setAction("updateEmail");
        setPopupAddWallet(!isPopupAddWallet);
    };

    const updatePhone = async () => {
        setAction("updatePhone");
        setPopupAddWallet(!isPopupAddWallet);
    };

    const updateMainWallet = async () => {
        setAction("updateMainWallet");
        setPopupAddWallet(!isPopupAddWallet);
    };

    const chooseToken = async () => {
        setPopupToken(!isPopupToken);
    };

    const copyClipboard = async (addr: string) => {
        alert(addr);
        try {
            await navigator.clipboard.writeText(addr);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    }

    useEffect(() => {
        if (address == undefined) {
            return;
        }

        (async () => {
            try {      
                let fetchTheLockTx = await fetch(
                  // @ts-ignore: Object is possibly 'null'.
                  `/api/defendersHandler/${address}`,
                  {
                    method: "POST", // or 'PUT' or 'PATCH' depending on your API
                    headers: {
                      "Content-Type": "application/json",
                      // Add any other headers if needed
                    },
                    body: JSON.stringify({
                      endpoint: "get-userinfo", // wrong action is being passed here
                    }),
                  }
                );
          
                let txRes = await fetchTheLockTx.json();
          
                if (txRes.errorCode === 500) {
                  toast({
                    title: `Something went wrong.`,
                    description: ``,
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                  });
                  return;
                }
          
                // Lock/UnLock
                console.log("RESULT: ", action, txRes.data);

                setUserInfo(txRes.data);          
            } catch (e) {
                console.log(e);
                toast({
                  title: `Something went wrong.`,
                  description: ``,
                  status: "error",
                  duration: 5000,
                  isClosable: true,
                });
                return;
            }
        })();
    }, [address]);

    const buildAuthTx = async () => {
        try {      
          const date = new Date().getTime().toString();
    
          console.log("message: ", date);
    
          const { hash } = await writeContract({
            // @ts-ignore
            address: process.env.smartContract,
            // @ts-ignore
            abi: process.env.smartContractABI,
            functionName: "sign",
            args: [date],
          })
    
          return hash;
        } catch (error) {
          console.log(error);
          return undefined;
        }
    };

    const updateTotp = async (isLedger: boolean) => {
        if (!address) return;
    
        let fetchTheAcceptTradeTx = null;
        try {
          if(!isLedger){
            const message = `sign in at: ${Math.floor(Date.now() / 1000)}`;
            const serializedSignature = await signMessage!({ message });
    
            console.log(message, serializedSignature);
    
            fetchTheAcceptTradeTx = await fetch(
              // @ts-ignore: Object is possibly 'null'.
              `/api/defendersHandler/${address.toString()}`,
              {
                method: "POST", // or 'PUT' or 'PATCH' depending on your API
                headers: {
                  "Content-Type": "application/json",
                  // Add any other headers if needed
                },
                body: JSON.stringify({
                  endpoint: "update-totp-code",
                  encodedTransaction: serializedSignature,
                  message: message,
                  wallet: address, 
                  isLedger: false,
                  ledgerTransaction: ""
                }),
              }
            );
          } else {
            const authTx = await buildAuthTx();
    
            if (authTx == undefined) {
              return;
            }
    
          fetchTheAcceptTradeTx = await fetch(
            // @ts-ignore: Object is possibly 'null'.
            `/api/defendersHandler/${address.toString()}`,
            {
              method: "POST", // or 'PUT' or 'PATCH' depending on your API
              headers: {
                "Content-Type": "application/json",
                // Add any other headers if needed
              },
              body: JSON.stringify({
                endpoint: "create-totp-code",
                encodedTransaction: "",
                message: "",
                wallet: address,
                ledgerTransaction: authTx,
                isLedger: true,
              }),
            }
          );
    
            console.log("the ledger tx is")
            console.log(authTx)
          }
    
          let txRes = fetchTheAcceptTradeTx ? await fetchTheAcceptTradeTx.json() : null;
    
          console.log("txRes: ", txRes);
    
          if (txRes && txRes.data.errorCode === 500) {
            toast({
              title: `Something went wrong.`,
              description: ``,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            return;
          }
    
          let totpData = txRes.data;
    
          setBase64ImageString(totpData.qrCode);
    
          // Since otpauth URLs are not standard HTTP URLs, replace the schema for parsing
          const httpUrl = totpData.encodedTOTP.replace("otpauth://", "http://");
          const url = new URL(httpUrl);
          const secret = url.searchParams.get("secret");
    
          console.log(secret)
    
          setEncodedTOTP(secret ?? "");
          setPopupResetSecret(true);
        } catch (e) {
          console.log(e);
        }
    };

    const getShortHash = (str: string) => {
        if (str == null) str = "";
        if (str.length <= 20) {
            return str;
        }
        return str.slice(0, 8) + "..." + str.slice(str.length - 5, str.length);
    };

    const openVault = (walletAddr: string) => {
        if (address?.toLowerCase() != walletAddr.toLowerCase()) {
            toast({
                title: `This is not connected now.`,
                description: ``,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        Router.push('/vault');
    };

    const emergency = (walletAddr: string) => {
        if (address?.toLowerCase() != walletAddr.toLowerCase()) {
            toast({
                title: `This is not connected now.`,
                description: ``,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        Router.push('/vault');
    };
    
    return (
        <div className="w-full flex flex-col h-screen items-stretch flex-1 bg-[#0F101E]">
            <Header />

            <AddWalletPopup     
                setPopupOpen={setPopupAddWallet}
                isPopupOpen={isPopupAddWallet}
                action={action}
                wallet={address}
                setUserInfo={setUserInfo}
                userInfo={userInfo}
            />

            <ImagePopup
                setPopupOpen={setPopupResetSecret}
                isPopupOpen={isPopupResetSecret}
                base64ImageString={base64ImageString}
                encodedTOTP={encodedTOTP}
                wallet={address}
                forceRefresh={forceRefresh}
            />

            <ChooseToken 
                setPopupOpen={setPopupToken}
                isPopupOpen={isPopupToken}
                userInfo={userInfo}
                setUserInfo={setUserInfo}
                forceRefresh={forceRefresh}
            />

            <div className="flex-1 w-full mt-0 lg:mt-5 bg-[#0F101E] p-5 lg:p-0 lg:pb-5">
                {address ? (
                <>
                    <div className="w-full mx-auto container flex flex-col gap-[40px]">
                        <div className="bg-[#0F101E] border-[#17D58C] border p-5 rounded-xl">
                            <div className="">
                                <div className="w-full flex flex-col lg:flex-row items-center justify-between">
                                    <div className="text-white w-full flex-1 ">
                                        <div className="text-2xl  mb-2 font-semibold">
                                            Manage Authentication
                                        </div>
                                        <div className="text-white text-sm">
                                            Your account is protected with 2-Step Verification.
                                        </div>
                                        <div className="text-white text-sm mb-[20px]">
                                            Enter on email address or mobile phone number in order to reset your 2FA account.
                                        </div>
                                        <div className="text-[#92939E] text-[11px]">
                                            EMAIL
                                        </div>
                                        <div className="flex flex-row items-start gap-[40px]">
                                            <div className="text-white text-sm mb-2 py-1 w-[200px]">
                                                {userInfo && userInfo.email && userInfo.email != ""? userInfo.email : "NONE"}
                                            </div>
                                            <button
                                                onClick={updateEmail}
                                                className="border-[#17D58C] uppercase cursor-pointer hover:opacity-80 text-sm flex items-center gap-2  border font-semibold px-2 py-[2px]"
                                            >
                                                Manage
                                                <MdOutlineKeyboardArrowRight
                                                    className="text-[#17D58C]"
                                                    size={20}
                                                />
                                            </button>
                                        </div>
                                        <div className="text-[#92939E] text-[11px]">
                                            PHONE NUMBER
                                        </div>
                                        <div className="flex flex-row items-start gap-[40px] mb-[20px]">
                                            <div className="text-white text-sm mb-2 py-1 w-[200px]">
                                                {userInfo && userInfo.phone && userInfo.phone != ""? userInfo.phone : "NONE"}
                                            </div>
                                            <button
                                                onClick={updatePhone}
                                                className="border-[#17D58C] uppercase cursor-pointer hover:opacity-80 text-sm flex items-center gap-2  border font-semibold px-2 py-[2px]"
                                            >
                                                Manage
                                                <MdOutlineKeyboardArrowRight
                                                    className="text-[#17D58C]"
                                                    size={20}
                                                />
                                            </button>
                                        </div>
                                        <div className="text-white text-sm">
                                            Having Trouble?
                                        </div>
                                        <div className="text-white text-sm mb-[20px]">
                                            Use the button below to reset your 2FA account.
                                        </div>
                                        <button onClick={() => updateTotp(false)} className="font-bold uppercase px-4 py-3 text-sm flex items-sart justify-between w-[200px] rounded-full text-white bg-[rgba(23,213,140,0.35)] hover:bg-gray-200 transition-all duration-300 ease-in-out">
                                            RESET 2FA ACCOUNT
                                            <MdOutlineKeyboardArrowRight
                                                className="text-[#17D58C]"
                                                size={20}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0F101E] border-[#17D58C] border rounded-xl flex flex-col gap-[10px] pb-8">
                            <div className="flex flex-col p-5 gap-[5px]">
                                <div className="w-full flex flex-col lg:flex-row items-center justify-between">
                                    <div className="text-white w-full flex-1 flex items-center justify-between">
                                        <div className="text-2xl  mb-2 font-semibold">
                                            Manage Wallets
                                        </div>
                                        <button onClick={openAddWallet} className="font-bold uppercase px-4 py-3 text-sm flex items-sart justify-between w-[200px] rounded-full text-white bg-[rgba(23,213,140,0.35)] hover:bg-gray-200 transition-all duration-300 ease-in-out">
                                            ADD WALLET
                                            <MdOutlineKeyboardArrowRight
                                                className="text-[#17D58C]"
                                                size={20}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <table className="w-full text-white">
                            <thead className="bg-[#17D58C]/10 border-b h-[50px] border-[#17D58C] border-t w-full -mt-5 relative">
                              <tr className="text-[12px] md:text-[16px]">
                                <th className="text-left px-5 max-w-[200px]">WALLET</th>
                                <th className="text-left pr-2">NETWORK</th>
                                <th className="text-left">ASSETS PROTECTED</th>
                                <th className="text-left">ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody className="text-[12px] md:text-[14px]">
                                {
                                    (userInfo != null && userInfo?.wallets != null && userInfo?.wallets.length > 0)? 
                                        userInfo?.wallets.map((wallet: any) => {
                                            return (
                                                <tr
                                                    key={wallet.address + wallet.chain}
                                                    className="border-b border-[#17D58C]"
                                                >
                                                    <td className="p-2 max-w-[200px]">{getShortHash(wallet.address)}</td>
                                                    <td>{wallet.chain}</td>
                                                    <td>
                                                        <div className="flex flex-col sm:flex-row gap-[10px] md:gap-[20px] items-start sm:items-center justify-start">
                                                            <div className="flex flex-row gap-[10px] md:gap-[20px]">
                                                                <div>{wallet.lockedNFTs}</div>
                                                                <div className="text-[#17D58C]">NFTs</div>
                                                            </div>
                                                            <div className="flex flex-row gap-[10px] md:gap-[20px]">
                                                                <div>{wallet.lockedTokens}</div>
                                                                <div className="text-[#17D58C]">Tokens</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-0 lg:p-2 flex flex-col lg:flex-row items-start lg:items-center gap-0 lg:gap-4">
                                                        {/* Actions like edit or delete could go here. Example: bump */}
                                                        <button
                                                            onClick={() => {if (wallet.lockedNFTs > 0 || wallet.lockedTokens > 0) openVault(wallet.address)}}
                                                            className={
                                                                wallet.lockedNFTs > 0 || wallet.lockedTokens > 0? 
                                                                    "border-[#17D58C] border-0 lg:border-[1px] cursor-pointer hover:opacity-80 text-sm flex items-center gap-2 border font-semibold px-1 lg:px-3 py-1 lg:py-1.5"
                                                                :   "border-[#17D58C] border-0 lg:border-[1px] cursor-pointer hover:opacity-80 text-sm flex items-center gap-2 border font-semibold px-1 lg:px-3 py-1 lg:py-1.5 opacity-[60%] hover:opacity-[60%]"}
                                                        >
                                                            <span className="text-[12px] lg:text-[14px] text-left">OPEN VAULT</span>
                                                            <MdOutlineKeyboardArrowRight
                                                                className="text-[#17D58C]"
                                                                size={20}
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={() => {if (wallet.lockedNFTs > 0 || wallet.lockedTokens > 0) emergency(wallet.address)}}
                                                            className={
                                                                wallet.lockedNFTs > 0 || wallet.lockedTokens > 0? "border-[#EC0000] border-0 lg:border-[1px] cursor-pointer hover:opacity-80 text-sm flex items-start gap-2  border font-semibold px-1 lg:px-3 pb-1 lg:py-1.5"
                                                                : "border-[#EC0000] border-0 lg:border-[1px] cursor-pointer hover:opacity-80 text-sm flex items-center gap-2 border font-semibold px-1 lg:px-3 pb-1 lg:py-1.5 opacity-[60%] hover:opacity-[60%]"
                                                            }
                                                        >
                                                            <span className="text-[12px] lg:text-[14px] text-left">EMERGENCY MIGRATION</span>
                                                            <MdOutlineKeyboardArrowRight
                                                                className="text-[#EC0000]"
                                                                size={20}
                                                            />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    : <tr></tr>
                                }
                            </tbody>
                          </table>
                        </div>

                        <div className="bg-[#0F101E] border-[#17D58C] border p-5 rounded-xl">
                            <div className="">
                                <div className="w-full flex flex-col lg:flex-row items-center justify-between">
                                    <div className="text-white w-full flex-1 ">
                                        <div className="text-2xl  mb-2 font-semibold">
                                            Manage Payment Preferences
                                        </div>
                                        <div className="text-white text-sm">
                                            Pay for platform fees using supported partner tokens.
                                        </div>
                                        <div className="text-white text-sm mb-[20px]">
                                            Select a token to use for payment fees.
                                        </div>
                                        <div className="text-[#92939E] text-[11px]">
                                            DEFAULT PAYMENT TOKEN
                                        </div>
                                        <div className="flex flex-row items-start gap-[40px] mb-[40px]">
                                            <div className="text-white text-sm mb-2 py-1">
                                                {
                                                    (connector && connector.chains.length > 0)? connector.chains[0].name: ""
                                                }
                                            </div>
                                            <button
                                                onClick={chooseToken}
                                                className="border-[#17D58C] uppercase cursor-pointer hover:opacity-80 text-sm flex items-center gap-2  border font-semibold px-2 py-[2px]"
                                            >
                                                Manage
                                                <MdOutlineKeyboardArrowRight
                                                    className="text-[#17D58C]"
                                                    size={20}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0F101E] border-[#17D58C] border rounded-xl flex flex-col lg:flex-row gap-[10px] pb-8">
                            <div className="flex-1 flex flex-col p-5 gap-[5px]">
                                <div className="w-full flex flex-col lg:flex-row items-center justify-between">
                                    <div className="text-white w-full flex-1 ">
                                        <div className="text-2xl  mb-2 font-semibold">
                                            Manage Referrals
                                        </div>
                                        <div className="text-white text-sm">
                                            Share the platform with others and earn rewards.
                                        </div>
                                        <div className="text-white text-sm mb-3">
                                            Choose wallet for referral rewards and airdrops.
                                        </div>
                                        <div className="text-[#92939E] text-[11px]">
                                            REFERRAL WALLET
                                        </div>
                                        <div className="flex flex-row items-start gap-[40px] mb-[40px]">
                                            <div className="text-white text-sm mb-2 py-1">
                                                { getShortHash(userInfo.mainWallet) }
                                            </div>
                                            <button
                                                className="border-[#17D58C] uppercase cursor-pointer hover:opacity-80 text-sm flex items-center gap-2  border font-semibold px-2 py-[2px]"
                                                onClick={updateMainWallet}
                                            >
                                                Manage
                                                <MdOutlineKeyboardArrowRight
                                                    className="text-[#17D58C]"
                                                    size={20}
                                                />
                                            </button>
                                        </div>
                                        <div className="text-white text-sm">
                                            Referral Links
                                        </div>
                                        <div className="text-white text-sm mb-3">
                                            Use your referral link to share the platform with others and earn rewards.
                                        </div>
                                        <div className="text-white text-sm flex flex-row gap-0 items-start justify-start h-[50px]">
                                            <div className="flex flex-row max-h-[62px] px-4 py-2.5 border-solid border-[1px] border-[#17D58C] rounded-l-full">
                                                {process.env.baseURI}<span className="hidden sm:block">?ref={userInfo.referralCode}</span>
                                            </div>
                                            <div onClick={() => copyClipboard(`${process.env.baseURI}?ref=${userInfo.referralCode}`)} className="max-h-[62px] bg-[rgba(23,213,140,0.35)] hover:bg-gray-200 transition-all duration-300 ease-in-out cursor-pointer border-l-0 flex flex-row items-center justify-between px-4 py-2.5 border-solid border-[1px] border-[#17D58C] rounded-r-full">
                                                COPY <span className="hidden sm:block">REFERRAL LINK</span>
                                                <MdOutlineKeyboardArrowRight
                                                    className="text-[#17D58C]"
                                                    size={20}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col p-5 gap-[15px] max-w-[400px] lg:max-w-[500px]">
                                <div className="w-full flex flex-row gap-[25px] items-center justify-between lg:justify-start">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="text-[50px] font-extrabold text-gradient">{userInfo.referredNum}</div>
                                        <div className="text-[13px] font-extrabold text-gradient">USER REFERED</div>
                                    </div>
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="text-[50px] font-extrabold text-gradient">{ethers.utils.parseUnits(userInfo.revenue, 6).toString()}$</div>
                                        <div className="text-[13px] font-extrabold text-gradient">REVENUE GENERATED</div>
                                    </div>
                                </div>
                                <div className="w-full flex flex-row justify-end">
                                    <button
                                        className="border-[#17D58C] uppercase cursor-pointer hover:opacity-80 text-sm flex text-white items-center gap-2  border font-semibold px-2 py-[2px]"
                                    >
                                        CLAIM REWARDS
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
                ) : (
                    <ConnectWalletBody />
                )}
            </div>

            <Footer />
            </div>
    )
}

function toast(arg0: {
    title: string;
    description: string;
    status: string;
    duration: number;
    isClosable: boolean;
}) {
    throw new Error("Function not implemented.");
}
  