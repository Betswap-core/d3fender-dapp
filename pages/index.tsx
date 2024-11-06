import Image from "next/image";
import { Inter } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LockIcon from "@/components/LockIcon";
import React, { useEffect, useState } from "react";
import { getUserStats } from "@/utils/transactions";
import ImagePopup from "@/components/ImagePopup";
import AuthCodePopup from "@/components/AuthCodePopup";
import UnlockIcon from "@/components/UnlockIcon";
import ConnectWallet from "@/components/ConnectWallet";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import Link from "next/link";
import { useAccount, useWalletClient, useSendTransaction } from "wagmi";
import { Nft } from "../types/nft";
import { signMessage, writeContract } from '@wagmi/core';
import web3 from "web3";
import getBaseWebpackConfig from "next/dist/build/webpack-config";
import { parseEther, parseGwei } from 'viem'
import ConnectWalletBody from "@/components/ConnectWalletBody";

import * as wagmi from "wagmi";
console.log(wagmi);

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const addrSC: any = process.env.smartContract || "0x0000000000000000000000000000000000000000";
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { sendTransaction } = useSendTransaction();

  const [signingWithLedger, setSigningWithLedger] = useState(false);
  const [walletNfts, setWalletNfts] = useState<Nft[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [enabledNFTs, setEnabledNFTs] = useState<NFT[]>([]);
  const [disabledNFTs, setDisabledNFTs] = useState<NFT[]>([]);
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [encodedTOTP, setEncodedTOTP] = useState("");

  const [base64ImageString, setBase64ImageString] = useState("");

  const [exploitTransferWallet, setExploitTransferWallet] = useState("");

  const lockTokens = async () => {
    setTokenLockPopupOpen(!isTokenLockPopupOpen);
  };

  const [totpCode, setTotpCode] = useState("");

  const [defendersLockedCount, setDefendersLockedCount] = useState(0);
  const [lockedNftsCount, setLockedNftsCount] = useState(0);
  const [lockedTokensCount, setLockedTokensCount] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [timeStaked, setTimeStaked] = useState(0);

  const [refreshHandle, forceRefresh] = React.useReducer((x) => x + 1, 0);
  const [isTokenLockPopupOpen, setTokenLockPopupOpen] = useState(false);


  const handleTotpChange = (event: any) => {
    setTotpCode(event.target.value);
  };


  const setNFTs = async () => {
    let lockedNfts: any[] = [];
    let unlockedNfts: any[] = [];

    console.log(walletNfts);
    let myWalletNfts: any = walletNfts || [];
    for (const nft of myWalletNfts) {
      let collection = nft.collection?.address.toBase58();
      try {
        if (!nft.locked) {
          unlockedNfts.push({
            locked: nft.locked,
            nftType: nft.nftType,
            image: nft.content.links.image ?? "/assets/nft.png",
            name: nft.content.metadata.name ?? "Unable to load",
            //@ts-ignore
            mint: nft.id ?? "",
          });
        } else {
          lockedNfts.push({
            locked: nft.locked,
            nftType: nft.nftType,
            image: nft.content.links.image ?? "/assets/nft.png",
            name: nft.content.metadata.name ?? "Unable to load",
            //@ts-ignore
            mint: nft.id ?? "",
          });
        }
      } catch (e) {}
    }
    setDisabledNFTs(unlockedNfts);
    setEnabledNFTs(lockedNfts);
  };

  useEffect(() => {
    if (!address) return;
    (async () => {
      const userStats: any = await getUserStats(address!);
      setWalletNfts(userStats?.walletNfts);

      if (userStats.walletNfts) {
        let lockedNFTs = 0;
        for (let i = 0; i < userStats?.walletNfts.length; i++) {
          if (userStats?.walletNfts[i].locked) {
            lockedNFTs++;
          }
        }
  
        console.log("lockedNFTs: ", lockedNFTs);
        // setDefendersLockedCount(userStats?.userStats.data.defendersLocked);
        setLockedNftsCount(lockedNFTs);

        if (userStats?.lockedTokens) {
          setLockedTokensCount(userStats?.lockedTokens.length);
        }
        // if (userStats?.userStats.data.points)
        //   setPointsEarned(Number(userStats?.userStats.data.points));
        // setTimeStaked(Number(userStats?.userStats.data.timeStaked));
        // setExploitTransferWallet(userStats?.userStats.data.totp.toString());  
      }
    })();
  }, [address, refreshHandle]);

  useEffect(() => {
    (async () => {
      await setNFTs();     
    })();
  }, [walletNfts, refreshHandle]);

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

  const createAccount = async (isLedger: boolean) => {
    if (!address) return;

    let fetchTheAcceptTradeTx = null;
    try {
      if(!isLedger){
        const message = `sign in at: ${Math.floor(Date.now() / 1000)}`;
        const serializedSignature = await signMessage!({ message });

        console.log(message, serializedSignature);

        setAccountCreated(true);

        const data: any = localStorage.getItem('userInfo');
        let referrerCode = null;
        if (data != undefined) {
          referrerCode = JSON.parse(data).referrerCode;
        }
        console.log("create-totp-code", referrerCode);

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
              encodedTransaction: serializedSignature,
              message: message,
              wallet: address, 
              isLedger: false,
              ledgerTransaction: "",
              referrerCode
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
      setPopupOpen(true);
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="w-full  flex flex-col h-screen  items-stretch flex-1 bg-[#0F101E]">
      <Header />

      <div className="flex-1 w-full lg:p-0 p-5 pt-0 bg-[#0F101E] ">
        {address? (
          <div>
            <div className="w-full text-white container mx-auto my-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-4 gap-5 ">
                <div className="flex items-start justify-between border border-[#17D58C] rounded-xl p-5 h-[270px]">
                  <div className="flex flex-col gap-5 items-stretch w-full">
                    <div className="flex flex-col h-[160px]">
                      <div className="flex flex-row">
                        <div className="w-3/4 flex flex-col gap-5">
                          <h1 className="w-full h-[70px] font-semibold text-white text-2xl pr-15">
                            Setup Your Vault
                          </h1>
                          <p className="w-full text-[#92939E]">
                            Setting up your D3fenders security vault.
                          </p>
                        </div>
                        <div className="flex-1">
                          <svg width="72" height="71" viewBox="0 0 72 71" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <g opacity="0.9">
                                  <path d="M35.7381 2.84003C29.2786 2.84003 22.9641 4.7555 17.5932 8.34423C12.2223 11.933 8.03619 17.0337 5.56423 23.0016C3.09228 28.9694 2.4455 35.5363 3.70569 41.8717C4.96589 48.2071 8.07645 54.0265 12.644 58.5941C17.2116 63.1617 23.0311 66.2723 29.3665 67.5325C35.7019 68.7927 42.2687 68.1459 48.2366 65.6739C54.2044 63.202 59.3052 59.0159 62.8939 53.6449C66.4827 48.274 68.3981 41.9596 68.3981 35.5C68.3981 26.8381 64.9572 18.5309 58.8322 12.4059C52.7073 6.28098 44.4001 2.84003 35.7381 2.84003ZM35.7381 62.48C30.402 62.48 25.1857 60.8977 20.7489 57.9331C16.312 54.9685 12.8539 50.7548 10.8119 45.8248C8.76982 40.8949 8.23552 35.4701 9.27655 30.2365C10.3176 25.0029 12.8872 20.1955 16.6604 16.4223C20.4336 12.6491 25.241 10.0795 30.4746 9.03844C35.7082 7.99741 41.133 8.5317 46.0629 10.5738C50.9929 12.6158 55.2066 16.0739 58.1712 20.5107C61.1358 24.9476 62.7181 30.1639 62.7181 35.5C62.7181 39.0431 62.0203 42.5515 60.6644 45.8248C59.3085 49.0982 57.3212 52.0724 54.8159 54.5778C52.3106 57.0831 49.3363 59.0704 46.0629 60.4263C42.7896 61.7822 39.2812 62.48 35.7381 62.48Z" fill="#17D58C"/>
                                  <path d="M50.2215 17.324L28.6375 26.98L28.0695 27.406L27.7855 27.69L27.5015 27.974L27.2175 28.4L17.5615 49.984C17.3744 50.4126 17.296 50.8807 17.3333 51.3469C17.3706 51.813 17.5224 52.2627 17.7753 52.6561C18.0282 53.0495 18.3743 53.3743 18.7829 53.6018C19.1915 53.8292 19.6499 53.9523 20.1175 53.96L21.2535 53.676L42.8375 44.02L43.4055 43.736L43.8315 43.31L44.2575 42.6L53.9135 21.016C54.1201 20.4999 54.1706 19.9345 54.0589 19.3899C53.9472 18.8453 53.6781 18.3455 53.285 17.9524C52.8919 17.5593 52.3921 17.2902 51.8476 17.1785C51.303 17.0668 50.7376 17.1174 50.2215 17.324ZM25.7975 45.44L30.7675 34.506L36.7315 40.47L25.7975 45.44ZM40.7075 36.494L34.7435 30.53L45.6775 25.56L40.7075 36.494Z" fill="#17D58C"/>
                              </g>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => createAccount(signingWithLedger)}
                      className="font-bold bg-white outline-none px-6 py-3 text-sm flex items-start justify-between gap-4 w-[240px] rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out"
                    >
                      Login/Create Account
                      <MdOutlineKeyboardArrowRight
                        className="text-[#17D58C]"
                        size={20}
                      />
                    </button>
                    {/* <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={signingWithLedger}
                        onChange={(e) => setSigningWithLedger(e.target.checked)}
                      />
                      <span>Sign with Ledger</span>
                    </div> */}
                  </div>
                </div>

                <div
                  className={`flex items-start justify-between border border-[#17D58C] rounded-xl p-5 h-[270px] ${
                    !accountCreated || encodedTOTP == "" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col items-start gap-5 w-full">
                    <div className="flex flex-col h-[160px]">
                      <div className="flex flex-row">
                        <div className="w-3/4 flex flex-col gap-5">
                          <h1 className="w-full h-[70px] font-semibold text-white text-2xl pr-15">
                            Account Settings
                          </h1>
                          <p className="w-full text-[#92939E]">
                            Manage your connected wallets and 2FA settings.
                          </p>
                        </div>
                        <div className="flex-1">
                          <svg width="72" height="71" viewBox="0 0 72 71" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <g opacity="0.9">
                              <path d="M35.7383 66.5625L22.0357 59.2564C18.1291 57.1782 14.8621 54.0754 12.5854 50.281C10.3088 46.4866 9.10847 42.1438 9.1133 37.7188V8.875C9.11459 7.6985 9.58252 6.57055 10.4144 5.73864C11.2463 4.90673 12.3743 4.43879 13.5508 4.4375H57.9258C59.1023 4.43879 60.2302 4.90673 61.0622 5.73864C61.8941 6.57055 62.362 7.6985 62.3633 8.875V37.7188C62.368 42.1437 61.1677 46.4864 58.891 50.2807C56.6144 54.0751 53.3475 57.1778 49.4408 59.2559L35.7383 66.5625ZM13.5508 8.875V37.7188C13.547 41.3393 14.5292 44.8926 16.392 47.9972C18.2548 51.1018 20.928 53.6404 24.1245 55.3407L35.7383 61.5333L47.3521 55.3407C50.5486 53.6404 53.2217 51.1018 55.0846 47.9972C56.9474 44.8926 57.9296 41.3393 57.9258 37.7188V8.875H13.5508Z" fill="#17D58C"/>
                              <path d="M35.7383 56.0833V13.3125H53.4883V37.2857C53.4882 40.098 52.7245 42.8575 51.2786 45.2698C49.8328 47.682 47.7591 49.6564 45.2789 50.9822L35.7383 56.0833Z" fill="#17D58C"/>
                            </g>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <Link href="/setting">
                      <button className="font-bold uppercase bg-white px-4 py-3 text-sm flex items-sart justify-between w-[200px] rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out">
                        Manage Account
                        <MdOutlineKeyboardArrowRight
                          className="text-[#17D58C]"
                          size={20}
                        />
                      </button>
                    </Link>
                  </div>
                </div>

                <div
                  className={`flex items-start justify-between border border-[#17D58C] rounded-xl p-5 h-[270px] ${
                    !accountCreated || encodedTOTP == "" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col items-start gap-5  w-full">
                    <div className="w-full h-[160px] flex flex-col gap-5">
                      <div className="flex flex-row w-full">
                        <div className="w-3/4 flex flex-col gap-5">
                          <h1 className="font-semibold h-[70px] text-white text-2xl w-full flex-1 pr-10">
                            Asset Vault
                          </h1>
                          <p className="text-[#92939E] h-[70px]">
                            Manage assets locked in your D3Fenders vault.
                          </p>
                        </div>
                        <div className="flex-1 flex flex-col w-[70px] items-center justify-start">
                          <div className="flex flex-row gap-[10px] mt-[15px]">
                            <div className="flex flex-col items-center justify-center gap-[5px]">
                              <div className="font-extrabold text-gradient text-center leading-[14px] text-[14px]">
                                {lockedNftsCount}
                              </div>
                              <div className="text-[10px]">NFTs</div>
                            </div>
                            <div className="flex flex-col items-center justify-center gap-[5px]">
                              <div className="font-extrabold text-gradient text-center leading-[14px] text-[14px]">
                                {lockedTokensCount}
                              </div>
                              <div className="text-[10px]">Tokens</div>
                            </div>
                          </div>
                          <div className="text-[10px] font-bold uppercase w-full text-center text-[#17D58C]">
                            ASSETS PROTECTED
                          </div>
                        </div>
                      </div>
                    </div>
                    <Link href="/vault">
                      <button className="font-bold uppercase bg-white px-6 py-3 text-sm flex items-sart justify-between w-[200px] rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out">
                        ACCESS VAULT
                        <MdOutlineKeyboardArrowRight
                          className="text-[#17D58C]"
                          size={20}
                        />
                      </button>
                    </Link>
                  </div>
                </div>
                
                <div
                  className={`flex items-start justify-between border border-[#17D58C] rounded-xl p-5 h-[270px] ${
                    !accountCreated || encodedTOTP == "" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col items-start gap-5  w-full">
                    <div className="w-full h-[160px] flex flex-col gap-5">
                      <div className="flex flex-row w-full">
                        <div className="w-3/4 flex flex-col gap-5">
                          <h1 className="font-semibold h-[70px] text-white text-2xl w-full flex-1 pr-20">
                            Secure Staking
                          </h1>
                          <p className="text-[#92939E]  h-[70px]">
                            Earning 50 points per day 4 Assets Protected 2 D3FENDERs enabled
                          </p>
                        </div>  
                        <div className="flex-1 flex flex-col w-[70px]  items-center justify-start">
                          <div className="font-extrabold text-gradient text-right leading-[65px] text-[57px]">
                            {pointsEarned}
                          </div>
                          <div className="text-[10px] w-full text-center text-[#17D58C]">
                            POINTS AVAILABLE
                          </div>
                        </div>
                      </div>                    
                    </div>
                    <button className="font-bold bg-white px-6 py-3 text-sm flex items-sart justify-between w-[200px] rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out">
                      CLAIM POINTS
                      <MdOutlineKeyboardArrowRight
                        className="text-[#17D58C]"
                        size={20}
                      />
                    </button>
                  </div>
                </div>
                
                <div
                  className={`flex items-start justify-between border border-[#17D58C] rounded-xl p-5 h-[270px] ${
                    !accountCreated || encodedTOTP == "" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col items-start gap-5 w-full">
                    <div className="flex flex-col h-[160px]">
                      <div className="flex flex-row">
                        <div className="w-3/4 flex flex-col gap-5">
                          <div className="w-full h-[70px] flex flex-col gap-1">
                            <h1 className="w-full font-semibold text-white text-2xl pr-15">
                              Referral Program
                            </h1>
                            <div className="font-semibold text-[#92939E]">COMMING SOON</div>
                          </div>
                          <p className="w-full text-[#92939E]">
                            Share the platform with others to earn referral rewards.
                          </p>
                        </div>
                        <div className="flex-1">
                          <svg width="72" height="71" viewBox="0 0 72 71" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M55.707 42.1563C53.7476 42.1557 51.8441 42.8097 50.2988 44.0145L43.8922 39.0223C44.3726 37.9104 44.6181 36.7112 44.6133 35.5C44.6179 35.2962 44.6086 35.0924 44.5856 34.8898L48.2742 33.6695C49.4376 35.449 51.2028 36.75 53.2469 37.3345C55.291 37.919 57.4771 37.7479 59.4054 36.8525C61.3336 35.9571 62.875 34.3974 63.7474 32.4586C64.6198 30.5199 64.7649 28.3318 64.1561 26.2948C63.5474 24.2579 62.2255 22.5082 60.4324 21.3661C58.6392 20.2239 56.4948 19.7656 54.3914 20.0751C52.2881 20.3846 50.3665 21.4411 48.9784 23.0513C47.5902 24.6615 46.8283 26.7178 46.832 28.8438C46.8274 29.0475 46.8367 29.2514 46.8598 29.4539L43.1711 30.6742C42.3692 29.4319 41.2688 28.4104 39.9704 27.7031C38.6719 26.9957 37.2169 26.6251 35.7383 26.625C35.2466 26.6333 34.7558 26.6704 34.2684 26.7359L32.3824 22.4648C33.4314 21.6397 34.2787 20.5865 34.8601 19.3851C35.4416 18.1838 35.7419 16.8659 35.7383 15.5313C35.7383 13.7759 35.2178 12.0601 34.2426 10.6006C33.2674 9.14108 31.8813 8.00355 30.2596 7.33182C28.6379 6.6601 26.8534 6.48434 25.1319 6.82678C23.4103 7.16923 21.8289 8.01449 20.5877 9.25568C19.3465 10.4969 18.5013 12.0782 18.1588 13.7998C17.8164 15.5214 17.9921 17.3059 18.6639 18.9276C19.3356 20.5493 20.4731 21.9353 21.9326 22.9105C23.3921 23.8857 25.108 24.4063 26.8633 24.4063C27.355 24.3979 27.8458 24.3609 28.3332 24.2953L30.2192 28.5664C29.1702 29.3916 28.3229 30.4448 27.7414 31.6461C27.16 32.8474 26.8597 34.1654 26.8633 35.5C26.8654 36.9071 27.1979 38.2941 27.834 39.5492L20.7063 45.8727C19.0619 44.772 17.0968 44.2524 15.1233 44.3965C13.1497 44.5406 11.281 45.3401 9.81388 46.668C8.3468 47.9959 7.36558 49.7759 7.02612 51.7254C6.68665 53.6748 7.00842 55.6818 7.94029 57.4274C8.87217 59.1731 10.3607 60.5572 12.1693 61.3599C13.978 62.1626 16.0031 62.3378 17.9227 61.8578C19.8424 61.3777 21.5465 60.2698 22.7644 58.7103C23.9823 57.1507 24.6441 55.2288 24.6445 53.25C24.6425 51.8429 24.31 50.4559 23.6738 49.2008L30.8016 42.8773C32.3454 43.9111 34.1755 44.4326 36.0323 44.3679C37.8891 44.3032 39.6784 43.6555 41.1465 42.5168L47.5531 47.509C47.0727 48.6209 46.8272 49.82 46.832 51.0313C46.832 52.7866 47.3526 54.5025 48.3278 55.9619C49.3029 57.4214 50.689 58.559 52.3107 59.2307C53.9324 59.9024 55.7169 60.0782 57.4385 59.7357C59.1601 59.3933 60.7414 58.548 61.9826 57.3068C63.2238 56.0656 64.0691 54.4843 64.4115 52.7627C64.754 51.0411 64.5782 49.2566 63.9065 47.6349C63.2347 46.0132 62.0972 44.6272 60.6377 43.652C59.1782 42.6768 57.4624 42.1563 55.707 42.1563ZM55.707 24.4063C56.5847 24.4063 57.4426 24.6665 58.1724 25.1541C58.9021 25.6417 59.4709 26.3347 59.8068 27.1456C60.1426 27.9564 60.2305 28.8487 60.0593 29.7095C59.8881 30.5703 59.4654 31.3609 58.8448 31.9815C58.2242 32.6021 57.4335 33.0248 56.5728 33.196C55.712 33.3672 54.8197 33.2793 54.0089 32.9435C53.198 32.6076 52.505 32.0388 52.0174 31.3091C51.5298 30.5794 51.2695 29.7214 51.2695 28.8438C51.2695 27.6669 51.7371 26.5382 52.5693 25.706C53.4015 24.8738 54.5301 24.4063 55.707 24.4063ZM22.4258 15.5313C22.4258 14.6536 22.686 13.7957 23.1736 13.0659C23.6612 12.3362 24.3543 11.7674 25.1651 11.4315C25.976 11.0957 26.8682 11.0078 27.729 11.179C28.5898 11.3502 29.3805 11.7729 30.0011 12.3935C30.6217 13.0141 31.0443 13.8047 31.2155 14.6655C31.3868 15.5263 31.2989 16.4186 30.963 17.2294C30.6271 18.0403 30.0584 18.7333 29.3286 19.2209C28.5989 19.7085 27.7409 19.9688 26.8633 19.9688C25.6864 19.9688 24.5577 19.5012 23.7255 18.669C22.8933 17.8368 22.4258 16.7082 22.4258 15.5313ZM15.7695 57.6875C14.8919 57.6875 14.0339 57.4272 13.3042 56.9397C12.5745 56.4521 12.0057 55.759 11.6698 54.9482C11.334 54.1373 11.2461 53.2451 11.4173 52.3843C11.5885 51.5235 12.0112 50.7328 12.6318 50.1122C13.2524 49.4916 14.043 49.069 14.9038 48.8978C15.7646 48.7265 16.6569 48.8144 17.4677 49.1503C18.2785 49.4862 18.9716 50.0549 19.4592 50.7847C19.9468 51.5144 20.207 52.3723 20.207 53.25C20.207 54.4269 19.7395 55.5556 18.9073 56.3878C18.0751 57.22 16.9464 57.6875 15.7695 57.6875ZM55.707 55.4688C54.8294 55.4688 53.9714 55.2085 53.2417 54.7209C52.512 54.2333 51.9432 53.5403 51.6073 52.7294C51.2715 51.9186 51.1836 51.0263 51.3548 50.1655C51.526 49.3047 51.9487 48.5141 52.5693 47.8935C53.1899 47.2729 53.9805 46.8502 54.8413 46.679C55.7021 46.5078 56.5944 46.5957 57.4052 46.9315C58.216 47.2674 58.9091 47.8362 59.3967 48.5659C59.8843 49.2957 60.1445 50.1536 60.1445 51.0313C60.1445 52.2082 59.677 53.3368 58.8448 54.169C58.0126 55.0012 56.8839 55.4688 55.707 55.4688Z" fill="#17D58C" fillOpacity="0.9"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <Link href="/setting">
                      <button className="font-bold uppercase px-4 py-3 text-sm flex items-sart justify-between w-[200px] rounded-full text-white bg-[rgba(23,213,140,0.35)] hover:bg-gray-200 transition-all duration-300 ease-in-out">
                        MANAGE REFERRALS
                        <MdOutlineKeyboardArrowRight
                          className="text-[#17D58C]"
                          size={20}
                        />
                      </button>
                    </Link>
                  </div>
                </div>

                <div
                  className={`flex items-start justify-between border border-[#17D58C] rounded-xl p-5 h-[270px] ${
                    !accountCreated || encodedTOTP == "" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col items-start gap-5 w-full">
                    <div className="flex flex-col h-[160px]">
                      <div className="flex flex-row">
                        <div className="w-3/4 flex flex-col gap-[6px]">
                          <div className="w-full h-[70px] flex flex-col gap-1">
                            <h1 className="w-full font-semibold text-white text-2xl pr-15">
                              Governance
                            </h1>
                            <div className="font-semibold text-[#92939E]">COMMING SOON</div>
                          </div>
                          <p className="w-full text-[#92939E]">
                            Participate in decision-making processes regarding the development and direction of the D3fenders Protocol.
                          </p>
                        </div>
                        <div className="flex-1">
                          <svg width="70" height="59" viewBox="0 0 70 59" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M38.4088 7.81903L48.5186 17.9289C48.6535 18.0638 48.7749 18.2073 48.8827 18.3577C48.2754 18.6461 47.7156 19.0384 47.2294 19.5245L36.1242 30.6298C35.6381 31.1159 35.2459 31.6757 34.9574 32.283C34.807 32.1752 34.6636 32.0539 34.5287 31.919L24.4188 21.809C24.2838 21.6741 24.1625 21.5306 24.0547 21.3802C24.6619 21.0918 25.2217 20.6996 25.7079 20.2135L36.8131 9.10818C37.2993 8.622 37.6915 8.06225 37.98 7.45496C38.1303 7.56276 38.2738 7.68408 38.4088 7.81903Z" fill="#17D58C"/>
                            <path d="M18.028 19.4519C17.0758 18.4998 16.5996 17.2457 16.5996 15.9927C16.5996 14.7397 17.0757 13.4857 18.0279 12.5336L29.1331 1.42828C30.0853 0.476109 31.3392 0 32.5922 0C33.8453 0 35.0992 0.476169 36.0514 1.42834C37.0035 2.38051 37.4797 3.63448 37.4797 4.8875C37.4797 6.14051 37.0036 7.39443 36.0515 8.3466L24.9462 19.4519C23.994 20.404 22.7401 20.8801 21.4871 20.8801C20.2341 20.8801 18.9801 20.404 18.028 19.4519Z" fill="#17D58C"/>
                            <path d="M40.3445 39.7379C39.0964 39.7379 37.8475 39.2655 36.8968 38.3208L36.8853 38.3096C35.9331 37.3574 35.457 36.1034 35.457 34.8504C35.457 33.5974 35.9332 32.3435 36.8853 31.3914L47.9906 20.2861C48.9427 19.3339 50.1967 18.8578 51.4497 18.8578C52.6919 18.8578 53.9351 19.3259 54.8842 20.2617C54.9011 20.2777 54.9177 20.2942 54.9337 20.3114C55.8693 21.2604 56.3372 22.5032 56.3372 23.7453C56.3372 24.9982 55.8611 26.2522 54.909 27.2043L43.8036 38.3097C42.8516 39.2617 41.5976 39.7379 40.3445 39.7379Z" fill="#17D58C"/>
                            <path d="M31.3654 30.279L23.25 38.3945C22.8294 38.815 22.1475 38.8151 21.727 38.3945L17.8507 34.5182C17.4301 34.0976 17.43 33.4157 17.8506 32.9952L25.9661 24.8798L31.3654 30.279Z" fill="#17D58C"/>
                            <path d="M19.059 32.6808L23.564 37.1858C24.2352 37.8571 24.571 38.7407 24.571 39.6235C24.571 40.5062 24.2352 41.39 23.564 42.0612L10.6256 54.9995C9.9543 55.6709 9.07066 56.0066 8.18786 56.0066C7.30511 56.0066 6.42136 55.6708 5.75015 54.9996L1.24521 50.4947C0.576752 49.8262 0.242416 48.9423 0.242468 48.0569C0.242468 47.1742 0.574047 46.2904 1.24526 45.6192L14.1836 32.6808C14.8549 32.0095 15.7386 31.6739 16.6213 31.6739C17.5041 31.6739 18.3878 32.0096 19.059 32.6808Z" fill="#17D58C"/>
                            <path d="M36.1629 50.6046H68.0906C68.6854 50.6046 69.1676 51.0868 69.1676 51.6815V57.923C69.1676 58.5178 68.6854 59 68.0906 59H36.1629C35.5681 59 35.0859 58.5178 35.0859 57.923V51.6815C35.0859 51.0868 35.5681 50.6046 36.1629 50.6046Z" fill="#17D58C"/>
                            <path d="M40.6074 49.5275V45.44C40.6074 44.8452 41.0896 44.363 41.6844 44.363H62.5694C63.1642 44.363 63.6464 44.8452 63.6464 45.44V49.5275H40.6074Z" fill="#17D58C"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <Link href="#">
                      <button className="font-bold bg-[rgba(23,213,140,0.35)] uppercase px-4 py-3 text-sm flex items-sart justify-between w-[200px] rounded-full text-white hover:bg-gray-200 transition-all duration-300 ease-in-out">
                        LEARN MORE
                        <MdOutlineKeyboardArrowRight
                          className="text-[#17D58C]"
                          size={20}
                        />
                      </button>
                    </Link>
                  </div>
                </div>

                <div
                  className={`flex items-start justify-between border border-[#17D58C] rounded-xl p-5 h-[270px] ${
                    !accountCreated || encodedTOTP == "" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col items-start gap-5 w-full">
                    <div className="flex flex-col h-[160px]">
                      <div className="flex flex-row">
                        <div className="w-3/4 flex flex-col gap-5">
                          <div className="w-full h-[70px] flex flex-col gap-1">
                            <h1 className="w-full font-semibold text-white text-2xl pr-15">
                              Secure Swap
                            </h1>
                            <div className="font-semibold text-[#92939E]">COMMING SOON</div>
                          </div>
                          <p className="w-full text-[#92939E]">
                            A safe place to swap your tokens. Powered by Jupiter.
                          </p>
                        </div>
                        <div className="flex-1">
                          <svg width="72" height="71" viewBox="0 0 72 71" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M57.5568 44.6797C59.4763 40.1188 59.9182 35.0711 58.8202 30.2461C57.7223 25.4211 55.1398 21.0615 51.4358 17.7803C47.7318 14.4991 43.0926 12.4613 38.1704 11.9533C33.2482 11.4453 28.2905 12.4928 23.9945 14.9484L21.0598 9.80981C25.5495 7.2438 30.6336 5.89998 35.8048 5.91244C40.976 5.9249 46.0535 7.2932 50.5308 9.88081C63.8137 17.5488 68.902 33.9676 62.7102 47.6587L66.6803 49.9485L54.3588 56.4982L53.8707 42.5526L57.5568 44.6797ZM13.9214 26.3203C12.0018 30.8811 11.56 35.9289 12.6579 40.7539C13.7559 45.5789 16.3384 49.9384 20.0424 53.2196C23.7464 56.5009 28.3856 58.5387 33.3078 59.0466C38.23 59.5546 43.1876 58.5071 47.4837 56.0515L50.4183 61.1901C45.9287 63.7562 40.8446 65.1 35.6734 65.0875C30.5022 65.0751 25.4247 63.7068 20.9474 61.1191C7.66451 53.4511 2.57617 37.0324 8.76796 23.3412L4.79492 21.0544L17.1164 14.5047L17.6045 28.4503L13.9184 26.3232L13.9214 26.3203ZM39.9251 43.8661L31.5501 35.5L23.1839 43.8661L19.0008 39.6831L31.553 27.1338L39.9222 35.5L48.2913 27.1338L52.4744 31.3169L39.9222 43.8661H39.9251Z" fill="#17D58C"/>
                          </svg>
                        </div>
                      </div>
                    </div>

                    <Link href="#">
                      <button className="font-bold bg-[rgba(23,213,140,0.35)] uppercase px-4 py-3 text-sm flex items-sart justify-between w-[200px] rounded-full text-white hover:bg-gray-200 transition-all duration-300 ease-in-out">
                        SECURE SWAP
                        <MdOutlineKeyboardArrowRight
                          className="text-[#17D58C]"
                          size={20}
                        />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ConnectWalletBody />
        )}
      </div>

      <div>
        <ImagePopup
          setPopupOpen={setPopupOpen}
          isPopupOpen={isPopupOpen}
          base64ImageString={base64ImageString}
          encodedTOTP={encodedTOTP}
          wallet={address}
          forceRefresh={forceRefresh}
        />
      </div>

      <Footer />
    </div>
  );
}

interface SelectionProps {
  wallet: any;
  totpCode: string;
  enabled: boolean;
  nfts: NFT[];
  opp: NFT[];
  setNfts: React.Dispatch<React.SetStateAction<NFT[]>>;
  setOpp: React.Dispatch<React.SetStateAction<NFT[]>>;
  exploitTransferWallet: string;
  forceRefresh: any;
}

function SelectionBox({
  wallet,
  totpCode,
  enabled,
  nfts,
  opp,
  setNfts,
  setOpp,
  exploitTransferWallet,
  forceRefresh,
}: SelectionProps) {
  const [selected, setSelected] = useState<NFT[]>([]);
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const openAuthCode = async () => {
    setPopupOpen(!isPopupOpen);
  };

  const transferOwnerShip = async () => {
    setIsTransferOpen(!isTransferOpen);
  };

  return (
    <div className="flex flex-col w-full flex-1 h-[95vh] bg-black relative">
      <div>
        <AuthCodePopup
          selected={selected}
          setSelected={setSelected}
          setPopupOpen={setPopupOpen}
          isPopupOpen={isPopupOpen}
          action={enabled ? "unlock" : "lock"}
          wallet={wallet}
          tokens={[]}
          forceRefresh={forceRefresh}
          walletToFund={exploitTransferWallet}
        />
      </div>

      <div>
        <AuthCodePopup
          selected={selected}
          setSelected={setSelected}
          setPopupOpen={setIsTransferOpen}
          isPopupOpen={isTransferOpen}
          action={"transfer-ownership"}
          wallet={wallet}
          tokens={[]}
          forceRefresh={forceRefresh}
          walletToFund={exploitTransferWallet}
        />
      </div>

      <div className="flex flex-col items-center w-full flex-1 h-[95vh] bg-black absolute left-2.5 bottom-2.5">
        {/* top bar  */}
        <div className="w-full h-[4rem] flex px-5 items-center justify-between">
          {/* status */}
          <div className="flex items-center gap-2">
            <span className="text-xl tracking-widest text-white font-hitchcut">
              ASSETS
            </span>
            <span
              className={`text-xl tracking-widest ${
                enabled ? "text-[#00D100]" : "text-[#EC0000]"
              } font-hitchcut`}
            >
              {enabled ? "LOCKED" : "UNLOCKED"}
            </span>
          </div>

          {enabled && (
            <span
              onClick={transferOwnerShip}
              className="text-xl text-white cursor-pointer font-hitchcut"
            >
              EMERGENCY MIGRATION
            </span>
          )}

          {/* select all */}
          <span
            onClick={() => {
              setSelected(nfts);
            }}
            className="text-xl text-white cursor-pointer font-hitchcut"
          >
            SELECT ALL
          </span>
        </div>

        {/* nfts  */}
        <div className="w-full h-full flex justify-center bg-[#FFF6E0] p-8 overflow-hidden">
          <div className="flex flex-1 justify-center h-full overflow-y-auto pr-8 scrollbar">
            <div className="flex-1 h-fit grid grid-cols-3 gap-5">
              {nfts.map(
                (nft, index) =>
                  nft.image && (
                    <div
                      onClick={() => {

 
                        if (selected.some((obj) => obj.mint === nft.mint)) {
                          setSelected(
                            [...selected].filter((obj) => obj.mint !== nft.mint)
                          );
                        } else {
                          setSelected([...selected].concat([nft]));
                        }
                      }}
                      className={`cursor-pointer border ${
                        selected.some((obj) => obj.mint === nft.mint)
                          ? "border-4 border-black"
                          : "border-transparent"
                      } transition-all`}
                    >
                      <NFT
                        name={nft.name}
                        key={index}
                        locked={!enabled}
                        image={nft.image}
                        mint=""
                      />
                    </div>
                  )
              )}
            </div>
          </div>
        </div>

        {/* button  */}
        <div className="w-full h-[9.5rem] bg-[#FFF6E0] flex items-center justify-center">
          <div className="bg-black w-[18rem] h-[4rem] relative">
            <button
              onClick={openAuthCode} //lockUnlockNfts(selected, enabled)}
              className="bg-[#FFF6E0] cursor-pointer flex items-center justify-center w-[18rem] h-[4rem] border-4 border-black absolute transition-all hover:left-1 hover:bottom-1 left-1.5 bottom-1.5 font-hitchcut tracking-wider text-xl font-black text-black"
            >
              {enabled ? "DISABLE " : "ENABLE "}D3FENDER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NFT {
  locked: boolean;
  image: string;
  name: string;
  mint: string;
}

function NFT({ locked, image, name }: NFT) {
  return (
    <div className="w-full relative overflow-hidden">
      <Image
        src={image}
        alt={name}
        width={100}
        height={100}
        unoptimized={true}
        layout="responsive"
        priority
      />
      {locked && (
        <div className="absolute w-[2rem] h-[3rem] -bottom-2 right-0">
          <UnlockIcon
            className={!locked ? "text-[#82FF7F]" : "text-[#EC0000]"}
          />
        </div>
      )}
      {!locked && (
        <div className="absolute w-[2rem] h-[3rem] -bottom-2 right-0">
          <LockIcon className={!locked ? "text-[#82FF7F]" : "text-[#EC0000]"} />
        </div>
      )}
    </div>
  );
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
