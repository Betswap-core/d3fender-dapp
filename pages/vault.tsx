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
import { Nft } from "../types/nft";
import { Token } from "@/types/token";
import { signMessage, writeContract } from '@wagmi/core';
import { useAccount, useWalletClient, useSendTransaction } from "wagmi";
import { ethers } from "ethers";
import ConnectWalletBody from "@/components/ConnectWalletBody";
import { useToast } from "@chakra-ui/react";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { address } = useAccount();
  const toast = useToast();
  const [walletNfts, setWalletNfts] = useState<Nft[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [enabledNFTs, setEnabledNFTs] = useState<NFT[]>([]);
  const [disabledNFTs, setDisabledNFTs] = useState<NFT[]>([]);
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [tabOpened, setTabOpened] = useState(0);
  const [base64ImageString, setBase64ImageString] = useState("");
  const [encodedTOTP, setEncodedTOTP] = useState("");
  const [allTokens, setAllTokens] = useState<Token[] | []>([]);

  const [exploitTransferWallet, setExploitTransferWallet] = useState("");

  const lockTokens = async () => {
    setTokenLockPopupOpen(!isTokenLockPopupOpen);
  };

  const [totpCode, setTotpCode] = useState("");

  const [defendersLockedCount, setDefendersLockedCount] = useState(0);
  const [lockedNftsCount, setLockedNftsCount] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [timeStaked, setTimeStaked] = useState(0);

  const [refreshHandle, forceRefresh] = React.useReducer((x) => x + 1, 0);
  const [isTokenLockPopupOpen, setTokenLockPopupOpen] = useState(false);

  const [selected, setSelected] = useState<NFT[]>([]);
  const [isPopupOpenSelection, setPopupOpenSelection] = useState(false);
  const [isTransferOpenSelection, setIsTransferOpenSelection] = useState(false);

  const openAuthCode = async () => {
    setPopupOpenSelection(!isPopupOpenSelection);
  };

  const transferOwnerShip = async () => {
    setIsTransferOpenSelection(!isTransferOpenSelection);
  };

  const handleTotpChange = (event: any) => {
    //const value = parseInt(event.target.value, 10) || 0;
    setTotpCode(event.target.value);
  };

  const setNFTs = async () => {
    let lockedNfts: any[] = [];
    let unlockedNfts: any[] = [];

    console.log("setNFTs: ", walletNfts);

    if (!walletNfts) {
      return;
    }

    let myWalletNfts: any = walletNfts;
    for (const nft of myWalletNfts) {
      let collection = nft.collection?.address.toBase58();

      let name = "";
      let parsedName = nft.content.metadata.name;

      if(parsedName === "" || parsedName === null || parsedName === undefined){
        name = "Unable to load...";
      }
      else{
        name = parsedName;
      }

      try {
        if (!nft.locked) {
          unlockedNfts.push({
            locked: nft.locked,
            nftType: nft.nftType,
            image: nft.content.links.image ?? "/assets/nft.png",
            name: name,
            id: nft.id,
            //@ts-ignore
            mint: nft.address ?? "",
          });
        } else {
          lockedNfts.push({
            locked: nft.locked,
            nftType: nft.nftType,
            image: nft.content.links.image ?? "/assets/nft.png",
            name: name,
            //@ts-ignore
            mint: nft.address ?? "",
            id: nft.id,
            index: nft.index
          });
        }
      } catch (e) {}
    }

    console.log("1: ", unlockedNfts);
    console.log("2: ", lockedNfts);

    setDisabledNFTs(unlockedNfts);
    setLockedNftsCount(lockedNfts.length);
    setEnabledNFTs(lockedNfts);
  };

  useEffect(() => {
    if (!address) return;
    (async () => {
      const userStats: any = await getUserStats(address!);
      console.log("userStats: ", userStats);
      setWalletNfts(userStats.walletNfts);

      let tokens = [];

      for (let i = 0; i < userStats.lockedTokens.length; i++) {
        tokens.push({
          name: userStats.lockedTokens[i].name,
          symbol: userStats.lockedTokens[i].symbol,
          address: userStats.lockedTokens[i].address,
          balance: "0",
          lockedBalance: userStats.lockedTokens[i].balance,
          decimals: userStats.lockedTokens[i].decimals,
          logo: userStats.lockedTokens[i].logo,
        });
      }

      for (let i = 0; i < userStats.unlockedTokens.length; i++) {
        let isExist = false;
        for (let j = 0; j < tokens.length; j++) {
          if (tokens[j].address == userStats.unlockedTokens[i].address) {
            tokens[j].balance = userStats.unlockedTokens[i].balance;
            isExist = true;
            break;
          }
        }

        if (!isExist) {
          tokens.push({
            name: userStats.unlockedTokens[i].name,
            symbol: userStats.unlockedTokens[i].symbol,
            address: userStats.unlockedTokens[i].address,
            balance: userStats.unlockedTokens[i].balance,
            lockedBalance: "0",
            decimals: userStats.unlockedTokens[i].decimals,
            logo: userStats.unlockedTokens[i].logo,
            type: userStats.unlockedTokens[i].type
          });  
        }
      }
  
      // @ts-ignore
      setAllTokens(tokens.reverse());

  //     setDefendersLockedCount(userStats.userStats.data.defendersLocked);
  //     setLockedNftsCount(userStats.userStats.data.lockedNfts.length);
  //     setPointsEarned(Number(userStats.userStats.data.points));
  //     setTimeStaked(Number(userStats.userStats.data.timeStaked));
  //     setExploitTransferWallet(userStats.userStats.data.totp.toString());

  //     const umi = createUmi(
  //       "https://rpc.hellomoon.io/2aac76c6-9590-400a-bfbb-1411c9716810"
  //     ).use(mplTokenMetadata());

  //     const connection = new Connection(
  //       "https://rpc.hellomoon.io/2aac76c6-9590-400a-bfbb-1411c9716810"
  //       // "https://rpc-devnet.hellomoon.io/f75a3996-5807-43ce-b49f-adb72e05217e"
  //     );

  //     console.log("getting all token balances");

  //     let tokenbalanceInWalletMap : any = {};
  //     let tokenbalanceInEscrowMap : any = {};
  //     const [userState, userStateBump] = await userPDA(new PublicKey(address ?? ""));
  //     for (let token of TOKEN_ADDRESSES) {
  //       if (token.address !== "SOLANA") {
  //         let tokenAta = findAssociatedTokenPda(umi, {
  //           mint: publicKey(token.address),
  //           owner: publicKey(address ?? ""),
  //         })[0];

  //         let tokenAtaEscrow = findAssociatedTokenPda(umi, {
  //           mint: publicKey(token.address),
  //           owner: publicKey(userState),
  //         })[0];


  //         let splBalance = 0;
  //         let info;
  //         try {
  //           info = await connection.getTokenAccountBalance(
  //             new PublicKey(tokenAta)
  //           );
  //           try {
  //             splBalance = Number(info?.value.uiAmount);
  //           } catch (e) {
  //             splBalance = 0;
  //           }
  //         } catch (e) {
  //           splBalance = 0;
  //         }

  //         tokenbalanceInWalletMap[token.name] = splBalance;

  //         let splBalanceEscrow = 0;
  //         let infoEscrow;
  //         try {
  //           infoEscrow = await connection.getTokenAccountBalance(
  //             new PublicKey(tokenAtaEscrow)
  //           );
  //           try {
  //             splBalanceEscrow = Number(infoEscrow?.value.uiAmount);
  //           } catch (e) {
  //             splBalanceEscrow = 0;
  //           }
  //         } catch (e) {
  //           splBalanceEscrow = 0;
  //         }

  //         tokenbalanceInEscrowMap[token.name] = splBalanceEscrow;

  //       }
  //       else{

  //         let solanaBalanceInWallet = 0;
  //         try {
  //           const solBalance = await connection.getBalance(
  //             new PublicKey(address ?? "")
  //           );
  //           solanaBalanceInWallet = solBalance / LAMPORTS_PER_SOL;
  //         } catch (e) {
  //           solanaBalanceInWallet = 0;
  //         }

  //         let solanaBalanceInEscrow = 0;
  //         try {
  //           const solBalanceInEscrow = await connection.getBalance(
  //             new PublicKey(userState)
  //           );
  //           solanaBalanceInEscrow = solBalanceInEscrow / LAMPORTS_PER_SOL;
  //         } catch (e) {
  //           solanaBalanceInEscrow = 0;
  //         }
    
  //         tokenbalanceInWalletMap[token.name] = solanaBalanceInWallet;
  //         tokenbalanceInEscrowMap[token.name] = solanaBalanceInEscrow;
  //       }
  //     }

  //     setBalanceInWalletMap(tokenbalanceInWalletMap);
  //     setBalanceInEscrowMap(tokenbalanceInEscrowMap);
    })();
  }, [address, refreshHandle]);

  useEffect(() => {
    (async () => {
      await setNFTs();
    })();
  }, [walletNfts, refreshHandle]);

  const createAccount = async () => {
    if (!address) return;

    let fetchTheAcceptTradeTx = null;
    try {
        const message = `sign in at: ${Math.floor(Date.now() / 1000)}`;
        const serializedSignature = await signMessage!({ message });

        console.log(message, serializedSignature);

        setAccountCreated(true);

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
              ledgerTransaction: ""
            }),
          }
        );
      
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

      <div>
        <AuthCodePopup
          selected={null}
          setSelected={setSelected}
          tokens={allTokens}
          setPopupOpen={setTokenLockPopupOpen}
          isPopupOpen={isTokenLockPopupOpen}
          action={"token-lock"}
          wallet={address}
          forceRefresh={forceRefresh}
          walletToFund={""}
        />
      </div>

      <div className="flex-1 w-full mt-0 lg:mt-5 bg-[#0F101E] p-5 lg:p-0">
        {address ? (
          <>
            <div className="w-full mx-auto container ">
              <div className="w-full bg-transparent flex items-center border-b border-[#17D58C] ">
                <div
                  onClick={() => setTabOpened(0)}
                  className={
                    tabOpened === 1
                      ? "border-b-0 cursor-pointer hover:opacity-80 border w-[150px] rounded-xl p-2 rounded-b-none text-white font-medium text-center  border-[#23EB9E] bg-[#0F101E]"
                      : "border-b-0  cursor-pointer hover:opacity-80 border w-[150px] bg-[#17d58c51] rounded-xl p-2 rounded-b-none text-white font-medium text-center  border-[#23EB9E] "
                  }
                >
                  NFTS
                </div>
                <div
                  onClick={() => setTabOpened(1)}
                  className={
                    tabOpened === 0
                      ? "border-b-0  cursor-pointer hover:opacity-80 border w-[150px] rounded-xl p-2 rounded-b-none text-white font-medium text-center  border-[#23EB9E] bg-[#0F101E]"
                      : "border-b-0  cursor-pointer hover:opacity-80 border w-[150px] bg-[#17d58c51] rounded-xl p-2 rounded-b-none text-white font-medium text-center  border-[#23EB9E] "
                  }
                >
                  Tokens
                </div>
              </div>
              <div className="bg-[#0F101E] border-[#17D58C] border-t-0  border p-5 rounded-xl rounded-t-none">
                {tabOpened === 0 ? (
                  <>
                    <div className="w-full flex flex-col lg:flex-row items-center justify-between">
                      <div className="text-white w-full flex-1 ">
                        <div className="text-2xl  mb-2 font-semibold">
                          Protect Your NFTs
                        </div>
                        <div className="text-[#92939E] text-sm">
                          Select NFTs to lock in the D3Fenders Asset Vault.
                        </div>
                      </div>
                      <div className="w-full flex items-center justify-center lg:justify-end flex-1 gap-4 mt-5 lg:mt-0">
                        <div className="text-white font-bold flex items-center gap-2 mb-4">
                          <div className="text-[#17D58C] font-black">
                            {selected.length}
                          </div>
                          NFTs SELECTED
                        </div>
                        <div>
                          {selected.length > 0 ? (
                            <>
                              <button
                                className="font-bold bg-white px-6 text-xs  flex items-center justify-between gap-5 py-3 lg:text-sm  rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out"
                                onClick={openAuthCode}
                              >
                                {selected[0].locked
                                  ? "UNLOCK ASSETS"
                                  : "PROTECT ASSETS"}
                                <MdOutlineKeyboardArrowRight
                                  className="text-[#17D58C]"
                                  size={20}
                                />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="font-bold bg-white px-6  flex items-center justify-between gap-5 py-3 text-sm  opacity-50 rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out">
                                SELECT ASSETS
                                <MdOutlineKeyboardArrowRight
                                  className="text-[#17D58C]"
                                  size={20}
                                />
                              </button>
                            </>
                          )}
                          <div className="text-white text-center text-xs mt-2 font-bold">
                            {lockedNftsCount + defendersLockedCount} ASSETS IN
                            VAULT
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-full flex items-center justify-between">
                      <div className="text-white w-full flex-1 ">
                        <div className="text-2xl  mb-2 font-semibold">
                          Protect Your Tokens
                        </div>
                        <div className="text-[#92939E] text-sm">
                          Select Tokens to secure in your D3Fenders Asset Vault.
                        </div>
                      </div>
                      <div className="w-full flex items-center justify-end flex-1 gap-4"></div>
                    </div>
                  </>
                )}
              </div>

              {tabOpened === 0 && (
                <>
                  <div className="w-full  items-center py-20 hidden">
                    {/* your wallet */}
                    <div className="w-[50%] flex flex-col gap-5 xl:flex-row items-start xl:items-center justify-between">
                      <div className="bg-black w-[11.5rem] h-[6.3rem] relative">
                        <div className="bg-[#FFF6E0] flex items-center justify-center w-[11.5rem] h-[6.3rem] absolute left-1.5 bottom-1.5 font-hitchcut tracking-wider text-xl font-black">
                          <div className="flex items-center justify-center w-full h-full">
                            Your NFTs
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-6 pr-11">
                        <span className="text-xl font-hitchcut font-bold tracking-wide">
                          ASSETS LOCKED: {lockedNftsCount}
                        </span>
                        <span className="text-xl font-hitchcut font-bold tracking-wide">
                          D3FENDERS LOCKED: {defendersLockedCount}
                        </span>
                      </div>
                    </div>

                    {/* claim pts  */}
                    <div className="w-[50%] flex flex-col-reverse gap-5 xl:flex-row items-end xl:items-center justify-between">
                      <div className="flex flex-col items-start gap-6">
                        <span className="text-xl font-hitchcut font-bold tracking-wide">
                          POINTS:{" "}
                          {pointsEarned +
                            Math.floor(
                              ((Date.now() / 1000 - timeStaked) / 86400) *
                                defendersLockedCount
                            )}
                        </span>
                        <span className="text-xl font-hitchcut font-bold tracking-wide">
                          POINTS/ DAY: {defendersLockedCount}
                        </span>
                      </div>

                      <div className="bg-black w-[10.1rem] h-[4rem] relative">
                        <button
                          onClick={lockTokens}
                          className="bg-[#FFF6E0] flex items-center justify-center w-[10.1rem] h-[4rem] absolute transition-all hover:left-1 hover:bottom-1 left-1.5 bottom-1.5 font-hitchcut tracking-wider underline text-xl font-black text-black"
                        >
                          TOKEN LOCK
                        </button>
                      </div>

                      <div className="bg-black w-[10.1rem] h-[4rem] relative">
                        <button
                          onClick={createAccount}
                          className="bg-[#FFF6E0] flex items-center justify-center w-[15.1rem] h-[4rem] absolute transition-all hover:left-1 hover:bottom-1 left-1.5 bottom-1.5 font-hitchcut tracking-wider underline text-xl font-black text-black"
                        >
                          Login/Create Account
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="w-full">
                    <SelectionBox
                      allTokens={allTokens}
                      wallet={address}
                      totpCode={totpCode}
                      enabled={false}
                      nfts={disabledNFTs}
                      setNfts={setDisabledNFTs}
                      opp={enabledNFTs}
                      setOpp={setEnabledNFTs}
                      exploitTransferWallet={exploitTransferWallet}
                      forceRefresh={forceRefresh}
                      selected={selected}
                      isTransferOpen={isTransferOpenSelection}
                      openAuthCode={openAuthCode}
                      transferOwnerShip={transferOwnerShip}
                      setPopupOpen={setPopupOpenSelection}
                      setSelected={setSelected}
                      isPopupOpen={isPopupOpenSelection}
                      setIsTransferOpen={setIsTransferOpenSelection}
                    />

                    <SelectionBox
                      allTokens={allTokens}
                      wallet={address}
                      totpCode={totpCode}
                      enabled={true}
                      nfts={enabledNFTs}
                      setNfts={setEnabledNFTs}
                      opp={disabledNFTs}
                      setOpp={setDisabledNFTs}
                      exploitTransferWallet={exploitTransferWallet}
                      forceRefresh={forceRefresh}
                      selected={selected}
                      isTransferOpen={isTransferOpenSelection}
                      openAuthCode={openAuthCode}
                      transferOwnerShip={transferOwnerShip}
                      setSelected={setSelected}
                      setPopupOpen={setPopupOpenSelection}
                      isPopupOpen={isPopupOpenSelection}
                      setIsTransferOpen={setIsTransferOpenSelection}
                    />
                  </div>
                </>
              )}

              {tabOpened === 1 && (
                <>
                  <div className="w-full">
                    <div className="mt-5 border border-[#17D58C] rounded-xl">
                      <div className="">
                        <div className="w-full rounded-t-xl p-3 mb-0 border-b border-[#17D58C] bg-[#1A202C] flex px-5 items-center justify-between">
                          <p className="text-[#92939E] text-sm">
                            FILTER BY TOKEN NAME OR SYMBOL
                          </p>
                        </div>

                        <div className="w-full max-h-[500px] flex justify-center bg-[#0F101E]  overflow-auto">
                          <table className="w-full text-white">
                            <thead className="bg-[#17D58C]/10 border-b h-[50px] border-[#17D58C] border-t w-full -mt-5 relative">
                              <tr className="text-[14px] sm:text-[16px]">
                                <th className="text-left px-2">TOKEN</th>
                                <th className="text-left px-2">AMOUNT</th>
                                <th className="text-left px-2">IN VAULT</th>
                                <th className="text-left px-2">ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {allTokens.map((token) => (
                                <tr
                                  key={token.address}
                                  className="border-b border-[#17D58C]"
                                >
                                  <td className="text-[14px] sm:text-[16px] pl-2 py-2"><div className="flex flex-row items-center justify-start"><span className="hidden md:block">{`${token.name}(`}</span>{`${token.symbol}`}<span className="hidden md:block">{')'}</span></div></td>
                                  <td className="text-[14px] sm:text-[16px] pl-2 py-2 max-w-[100px] sm:max-w-[200px]">{ethers.utils.formatUnits(token.balance, token.decimals).toString()}</td>
                                  <td className="text-[14px] sm:text-[16px] pl-2 py-2 max-w-[100px] sm:max-w-[200px]">{ethers.utils.formatUnits(token.lockedBalance, token.decimals).toString()}</td>
                                  <td className="text-[14px] sm:text-[16px] pl-2 py-2 flex items-center gap-4">
                                    {/* Actions like edit or delete could go here. Example: bump */}
                                    <button
                                      onClick={lockTokens}
                                      className="border-[#17D58C] cursor-pointer hover:opacity-80 text-sm flex items-center gap-2  border font-semibold px-3 py-2"
                                    >
                                      <span className="hidden sm:block">MANAGE</span>
                                      <MdOutlineKeyboardArrowRight
                                        className="text-[#17D58C]"
                                        size={20}
                                      />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
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
  selected: NFT[];
  setSelected: React.Dispatch<React.SetStateAction<NFT[]>>;
  isTransferOpen: boolean;
  openAuthCode: () => void;
  transferOwnerShip: () => void;
  setIsTransferOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPopupOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isPopupOpen: boolean;
  nfts: NFT[];
  opp: NFT[];
  setNfts: React.Dispatch<React.SetStateAction<NFT[]>>;
  setOpp: React.Dispatch<React.SetStateAction<NFT[]>>;
  exploitTransferWallet: string;
  forceRefresh: any;
  allTokens: any;
}

function SelectionBox({
  wallet,
  totpCode,
  enabled,
  nfts,
  opp,
  setIsTransferOpen,
  setSelected,
  setNfts,
  setOpp,
  exploitTransferWallet,
  forceRefresh,
  selected,
  isTransferOpen,
  openAuthCode,
  transferOwnerShip,
  setPopupOpen,
  allTokens,
  isPopupOpen,
}: SelectionProps) {
  return (
    <div className="mt-5 border border-[#17D58C] rounded-xl">
      <div>
        <AuthCodePopup
          selected={selected}
          setSelected={setSelected}
          tokens={allTokens}
          setPopupOpen={setPopupOpen}
          isPopupOpen={isPopupOpen}
          action={enabled ? "unlock" : "lock"}
          wallet={wallet}
          forceRefresh={forceRefresh}
          walletToFund={exploitTransferWallet}
        />
      </div>

      <div>
        <AuthCodePopup
          selected={selected}
          setSelected={setSelected}
          tokens={allTokens}
          setPopupOpen={setIsTransferOpen}
          isPopupOpen={isTransferOpen}
          action={"transfer-ownership"}
          wallet={wallet}
          forceRefresh={forceRefresh}
          walletToFund={exploitTransferWallet}
        />
      </div>

      <div className="">
        {/* top bar  */}
        <div className="w-full rounded-t-xl p-3 mb-4 border-b border-[#17D58C] bg-[#1A202C] flex px-5 items-center justify-between">
          {/* status */}
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`  ${
                enabled ? "text-[#00D100]" : "text-[#EC0000]"
              } font-hitchcut`}
            >
              {enabled ? "LOCKED" : "UNLOCKED"}
            </span>
          </div>

          {enabled && (
            <span
              onClick={transferOwnerShip}
              className="font-bold bg-transparent cursor-pointer hover:opacity-80 flex items-center gap-5 border border-[#fff] px-6 py-3 text-sm  rounded-full text-white transition-all duration-300 ease-in-out"
            >
              EMERGENCY MIGRATION
            </span>
          )}

          {/* select all */}
          <span
            onClick={() => {
              if (selected.length === nfts.length) {
                setSelected([]);
              } else {
                setSelected(nfts);
              }
            }}
            className="font-bold bg-transparent cursor-pointer hover:opacity-80 flex items-center gap-5 border border-[#17D58C] px-6 py-3 text-sm rounded-full text-white transition-all duration-300 ease-in-out"
          >
            {selected.length === nfts.length
              ? "UNSELECT ALL NFTs"
              : "SELECT ALL NFTs"}
            {selected.length === nfts.length ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-6 h-6 text-red-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </>
            ) : (
              <MdOutlineKeyboardArrowRight className="text-[#fff]" size={20} />
            )}
          </span>
        </div>

        {/* nfts  */}
        <div className="w-full max-h-[500px] flex justify-center bg-[#0F101E] p-8 pt-0 pr-0 overflow-scroll">
          <div className="flex flex-1 justify-center h-full overflow-y-auto pr-8 scrollbar">
            <div className="flex-1 h-fit grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {nfts.map(
                (nft, index) =>
                  nft.image && (
                    <div
                      key={nft.mint + nft.id}
                      onClick={() => {
                        // if selected locked nfts and switch to unlocked, reset state (and vice versa)
                        if (
                          selected.length > 0 &&
                          ((selected[0].locked && !nft.locked) ||
                            (!selected[0].locked && nft.locked))
                        ) {
                          setSelected([nft]);
                        } else {
                          if (selected.some((obj) => obj.mint === nft.mint && obj.id === nft.id)) {
                            setSelected(
                              [...selected].filter(
                                (obj) => obj.mint !== nft.mint || obj.id !== nft.id 
                              )
                            );
                          } else {
                            setSelected([...selected].concat([nft]));
                          }
                        }
                      }}
                      className={`cursor-pointer border rounded-xl p-2  ${
                        selected.some((obj) => obj.mint === nft.mint && obj.id === nft.id)
                          ? "border-0 bg-white "
                          : "border-1 border-[#23EB9E] bg-[#1A202C]"
                      } transition-all`}
                    >
                      <NFT
                        name={nft.name}
                        id = {nft.id}
                        key={nft.mint + nft.id}
                        locked={!enabled}
                        image={nft.image}
                        mint={nft.mint}
                        selected={selected.some((obj) => obj.mint === nft.mint && obj.id === nft.id)}
                      />
                    </div>
                  )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NFT {
  id: any;
  locked: boolean;
  image: string;
  mint: string;
  name: string;
  selected: boolean;
}

function NFT({ locked, image, selected, name, id }: NFT) {
  return (
    <div className="w-full relative overflow-hidden rounded-lg">
      <Image
      className={"text-red-500"}
        src={image}
        alt={name}
        width={100}
        height={100}
        unoptimized={true}
        quality={100}
        layout="responsive"
        priority
      />
      {selected && (
        <>
          {locked && (
            <div className="absolute left-0 w-[3rem] h-[3rem] -bottom-2 right-0 bg-white rounded-t-lg rounded-l-none flex items-center justify-center">
              <UnlockIcon
                className={!locked ? "text-[#82FF7F]" : "text-[#000]"}
              />
            </div>
          )}
          {!locked && (
            <div className="absolute w-[2rem] h-[3rem] -bottom-2 right-0">
              <LockIcon
                className={!locked ? "text-[#82FF7F]" : "text-[#EC0000]"}
              />
            </div>
          )}
        </>
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
