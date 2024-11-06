import { useToast } from "@chakra-ui/react";
import React, { useState, useEffect } from "react";
import { USER } from "../types/user";
import { useAccount } from "wagmi";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

export default function ChooseToken({
    setPopupOpen,
    isPopupOpen,
    userInfo,
    setUserInfo,
    forceRefresh
}: any) {
    const toast = useToast();

    const { address, connector } = useAccount();
    const [tokens, setTokens] = useState<any>([]);
    const [ currentTokenIndex, setCurrentTokenIndex ] = useState(0);

    const togglePopup = () => {
        setPopupOpen(!isPopupOpen);
    };

    const setPaymentToken = async () => {
        if (tokens.length == 0) {
            return;
        }

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
                  address, 
                  chainID: tokens[currentTokenIndex].chainID, 
                  tokenAddr: tokens[currentTokenIndex].address,
                  endpoint: "set-paymenttoken", // wrong action is being passed here
                }),
              }
            );
      
            let txRes = await fetchTheLockTx.json();
      
            if (txRes.data.errorCode === 500) {
              toast({
                title: `Something went wrong.`,
                description: ``,
                status: "error",
                duration: 5000,
                isClosable: true,
              });
              return;
            }
      
            setPopupOpen(false);

            let newUserInfo = {
                ...userInfo
            };

            newUserInfo.paymentTokenLists = JSON.stringify(
                {
                    address: tokens[currentTokenIndex].address,
                    chainID: tokens[currentTokenIndex].chainID
                }
            );

            setUserInfo(newUserInfo);
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
    };

    useEffect(() => {
        if (address == undefined || userInfo == undefined) {
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
                      endpoint: "get-alltokens", // wrong action is being passed here
                    }),
                  }
                );
          
                let txRes = await fetchTheLockTx.json();
          
                if (txRes.data.errorCode === 500) {
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
                console.log("RESULT: ", txRes.data);
                setTokens(txRes.data.data);
                
                let paymentTokenLists;

                try {
                    paymentTokenLists = JSON.parse(userInfo.paymentTokenLists);
                    if (paymentTokenLists.length > 0) {
                        paymentTokenLists = paymentTokenLists[paymentTokenLists.length - 1];
                    }    
                } catch (error) {
                    paymentTokenLists = {};
                }

                for (let i = 0; i < txRes.data.data.length; i++) {
                    if (paymentTokenLists.address == txRes.data.data[i].address && paymentTokenLists.chainID == txRes.data.data[i].chainID) {
                        setCurrentTokenIndex(i);
                        break;
                    }
                }
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
    },[userInfo]);

    return(
        <>
            {
                isPopupOpen? 
                    <div className="popup-overlay">
                        <div className="flex items-center justify-center flex-col ">
                            <>
                            <div className="text-[28px] sm:text-[50px] flex flex-row gap-[10px] items-center justify-center text-white font-bold my-5">
                                <svg className="w-[50px] h-[50px] sm:w-[82px] sm:h-[82px]" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 48 48"><rect width="48" height="48" fill="none"/><g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"><path d="M40 30V15L27.5 7.969m-7 0L8 15v15m3 4.688L24 42l8-4.5l5-2.812M21 18.75l-3 1.75v7l3 1.75L24 31l3-1.75l3-1.75v-7l-3-1.75L24 17zM24 17v-7m6 17l7 4m-19-4l-7 4"/><circle cx="24" cy="7" r="3"/><circle cx="8" cy="33" r="3"/><circle cx="40" cy="33" r="3"/></g></svg>
                                Set Payment Token
                            </div>
                            <div className="w-[350px] sm:w-[550px] mt-5 border border-[#17D58C] rounded-xl px-[20px] sm:px-[60px] pb-[20px] flex flex-col items-center">
                                <div className="text-xl text-white font-semibold mt-[40px]">
                                    Please choose token.
                                </div>
                                
                                <div className="bg-[#1A202C] mt-5 rounded-xl rounded-b-none border-b-0 border p-3 border-[#17D58C] flex flex-row   w-[300px] sm:w-[400px] mx-auto ">
                                <input
                                    className="text-white outline-none text-md p-3 bg-transparent font-regular w-full "
                                    type="text"
                                    value={tokens.length > 0? tokens[currentTokenIndex].name: ""}
                                    disabled
                                />
                                <button
                                    onClick={setPaymentToken}
                                    className="font-bold bg-white px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-5 py-3 text-sm  rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out"
                                >
                                    CONFIRM
                                    <MdOutlineKeyboardArrowRight
                                        className="text-[#17D58C]"
                                        size={20}
                                    />
                                </button>
                                </div>

                                <div className="text-white bg-[#1A202C] pb-[30px] rounded-xl rounded-t-none border-t-none border overflow-hidden border-[#17D58C] flex flex-col w-[300px] sm:w-[400px] mx-auto">
                                    {
                                        tokens.map((token: any, index: number)=> {
                                            return (
                                                <div
                                                    key={index}
                                                    onClick={() => setCurrentTokenIndex(index)} 
                                                    className="cursor-pointer hover:bg-gray-600 text-white bg-[#1A202C] border-b-[1px] border-x-0 border-t-0 border-[#17D58C] px-6 py-4 flex flex-row w-full mx-auto"
                                                >
                                                    {`${token?.name}(${token?.symbol})`}
                                                </div>        
                                            )
                                        })
                                    }
                                </div>

                                <button
                                    onClick={togglePopup}
                                    className="text-[#fff] mt-5 cursor-pointer hover:opacity-80 text-sm font-bold"
                                >
                                    CANCEL & GO BACK
                                </button>
                            </div>
                            </>
                        </div>
                    </div>
                : <></>
            }
        </>
    )
}