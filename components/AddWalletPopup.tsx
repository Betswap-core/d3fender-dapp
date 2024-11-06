import { useToast } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { useAccount } from "wagmi";

export default function AddWallet({
    setPopupOpen,
    isPopupOpen,
    action,
    wallet,
    userInfo,
    setUserInfo
}: any) {
    const toast = useToast();

    const {address, connector} = useAccount();
    const [totpCode, setTotpCode] = useState("");
    const [newAddress, setNewAddress] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [newPhone, setNewPhone] = useState("");
    const [newWallet, setNewWallet] = useState("");

    useEffect(() => {
        if (isPopupOpen) {
            setTotpCode("");
            setNewAddress("");
            setNewEmail("");
            setNewPhone("");
        }
    }, [isPopupOpen]);
    const handleTotpChange = (event: any) => {
        //const value = parseInt(event.target.value, 10) || 0; 
        setTotpCode(event.target.value);
    };
    
    const handleAddressSet = (event: any) => {
        setNewAddress(event.target.value);
    };

    const handleEmailSet = (event: any) => {
        setNewEmail(event.target.value);
    };

    const handlePhoneSet = (event: any) => {
        setNewPhone(event.target.value);
    };

    const handleWalletSet = (event: any) => {
        setNewWallet(event.target.value);
    }
    const togglePopup = () => {
        console.log("togglePopup", isPopupOpen);
        setPopupOpen(!isPopupOpen);
    };

    const addAccount = async () => {
        let fetchTheAcceptTradeTx = null;
        try {
            fetchTheAcceptTradeTx = await fetch(
              // @ts-ignore: Object is possibly 'null'.
              `/api/defendersHandler/${wallet.toString()}`,
              {
                method: "POST", // or 'PUT' or 'PATCH' depending on your API
                headers: {
                  "Content-Type": "application/json",
                  // Add any other headers if needed
                },
                body: JSON.stringify({
                  endpoint: "add-account",
                  code: totpCode,
                  wallet: wallet,
                  newAddress: newAddress
                }),
              }
            );
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
      
        let txRes = fetchTheAcceptTradeTx ? await fetchTheAcceptTradeTx.json() : null;

        console.log("txRes: ", txRes.data);

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

        let newUserInfo = { ...userInfo };
        newUserInfo.wallets.push({
            address: wallet.toLowerCase(),
            chain: newUserInfo.wallets[0].chain,
            chainURI: newUserInfo.wallets[0].chainURI,
            lockedNFTs: 0,
            lockedTokens: 0,
        });
        setUserInfo(newUserInfo);
        setPopupOpen(false);
    };

    const updateEmail = async () => {
        let fetchTheAcceptTradeTx = null;
        try {
            fetchTheAcceptTradeTx = await fetch(
              // @ts-ignore: Object is possibly 'null'.
              `/api/defendersHandler/${wallet.toString()}`,
              {
                method: "POST", // or 'PUT' or 'PATCH' depending on your API
                headers: {
                  "Content-Type": "application/json",
                  // Add any other headers if needed
                },
                body: JSON.stringify({
                  endpoint: "update-email",
                  code: totpCode,
                  wallet: wallet,
                  newEmail: newEmail
                }),
              }
            );
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
      
        let txRes = fetchTheAcceptTradeTx ? await fetchTheAcceptTradeTx.json() : null;

        console.log("txRes: ", txRes.data);

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

        setUserInfo(txRes.data.data);
        setPopupOpen(false);
    };

    const updatePhone = async () => {
        let fetchTheAcceptTradeTx = null;
        try {
            fetchTheAcceptTradeTx = await fetch(
              // @ts-ignore: Object is possibly 'null'.
              `/api/defendersHandler/${wallet.toString()}`,
              {
                method: "POST", // or 'PUT' or 'PATCH' depending on your API
                headers: {
                  "Content-Type": "application/json",
                  // Add any other headers if needed
                },
                body: JSON.stringify({
                  endpoint: "update-phone",
                  code: totpCode,
                  wallet: wallet,
                  newPhone: newPhone
                }),
              }
            );
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
      
        let txRes = fetchTheAcceptTradeTx ? await fetchTheAcceptTradeTx.json() : null;

        console.log("txRes: ", txRes.data);

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

        setUserInfo(txRes.data.data);
        setPopupOpen(false);
    };

    const updateMainWallet = async () => {
        let fetchTheAcceptTradeTx = null;
        try {
            fetchTheAcceptTradeTx = await fetch(
              // @ts-ignore: Object is possibly 'null'.
              `/api/defendersHandler/${wallet.toString()}`,
              {
                method: "POST", // or 'PUT' or 'PATCH' depending on your API
                headers: {
                  "Content-Type": "application/json",
                  // Add any other headers if needed
                },
                body: JSON.stringify({
                  endpoint: "update-mainwallet",
                  code: totpCode,
                  wallet: wallet,
                  newWallet: newWallet
                }),
              }
            );
        } catch (e) {
            console.log(e);
            toast({
              title: `Something went wrong.`,
              description: `aaaaaaaaa`,
              status: "error",
              duration: 5000,
              isClosable: true,
            });
            return;
        }
      
        let txRes = fetchTheAcceptTradeTx ? await fetchTheAcceptTradeTx.json() : null;

        console.log("txRes: ", txRes.data);

        if (txRes && txRes.data.errorCode === 500) {
            toast({
                title: txRes.data.errorMessage? txRes.data.errorMessage: `Something went wrong.`,
                description: ``,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
            return;
        }

        setUserInfo(txRes.data.data);
        setPopupOpen(false);
    };

    const confirmHandler = async () => {
        if (action == "addAccount") {
            addAccount();
        } else if (action == "updateEmail") {
            updateEmail();
        } else if (action == 'updatePhone') {
            updatePhone();
        } else if (action == 'updateMainWallet') {
            updateMainWallet();
        }
    };

    return(
        <>
        {
            isPopupOpen && action == "addAccount"? 
                <div className="popup-overlay">
                    <div className="flex items-center justify-center flex-col ">
                        <>
                        <div className="text-[35px] sm:text-[57px] flex flex-row gap-[10px] items-center justify-center text-white font-bold my-5">
                            <svg className="w-[50px] h-[50px] sm:w-[82px] sm:h-[82px]" width="82" height="78" viewBox="0 0 82 78" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M62.1256 14.75H8.45898C5.28335 14.75 2.70898 17.3244 2.70898 20.5V55C2.70898 58.1756 5.28335 60.75 8.45898 60.75H62.1256C65.3013 60.75 67.8756 58.1756 67.8756 55V20.5C67.8756 17.3244 65.3013 14.75 62.1256 14.75Z" stroke="white" strokeWidth="10"/>
                                <path fillRule="evenodd" clipRule="evenodd" d="M2.70898 14.7499C2.70898 18.5833 2.70898 19.2221 2.70898 16.6666C2.70898 14.111 2.70898 12.8333 2.70898 12.8333C2.70898 9.65761 5.28335 7.08325 8.45898 7.08325H42.959C46.1346 7.08325 48.709 9.65761 48.709 12.8333V14.7499H2.70898Z" fill="#E8F7FF" stroke="white" strokeWidth="10"/>
                                <path fillRule="evenodd" clipRule="evenodd" d="M67.8768 45.4166V30.0833H48.3268C44.0926 30.0833 40.6602 33.5157 40.6602 37.7499C40.6602 41.9841 44.0926 45.4166 48.3268 45.4166H67.8768Z" fill="#E8F7FF" stroke="white" strokeWidth="10"/>
                            </svg>
                            Add Wallet
                        </div>
                        <div className="px-4 sm:px-0 text-2xl text-center text-white font-semibold">
                            Protect assets from multiple wallets.
                        </div>
                        <div className="w-[350px] sm:w-[550px] mt-5 border border-[#17D58C] rounded-xl px-[20px] sm:px-[60px] pb-[20px] flex flex-col items-center">
                            <div className="text-xl text-white font-semibold mt-[40px]">
                            Please add the address of new account.
                            </div>
                            <div className="bg-[#1A202C] mt-5 rounded-xl border p-2 border-[#17D58C] flex flex-row   w-[300px] sm:w-[400px] mx-auto ">
                            <input
                                className="text-white outline-none text-md p-3 bg-transparent font-regular w-full"
                                type="text"
                                onChange={handleAddressSet}
                                placeholder="ENTER WALLET ADDRESS"
                            />
                            </div>
                            <div className="text-xl text-white font-semibold mt-[40px]">
                                Please add the verification code
                            </div>
                            <div className="bg-[#1A202C] mt-5 rounded-xl border p-2 border-[#17D58C] flex flex-row   w-[300px] sm:w-[400px] mx-auto ">
                            <input
                                className="text-white outline-none text-md p-3 bg-transparent font-regular w-full "
                                type="text"
                                onChange={handleTotpChange}
                                placeholder="ENTER AUTH CODE"
                            />
                            <button
                                onClick={confirmHandler}
                                className="font-bold bg-white px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-5 py-3 text-sm  rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out"
                            >
                                CONFIRM
                                <MdOutlineKeyboardArrowRight
                                className="text-[#17D58C]"
                                size={20}
                                />
                            </button>
                            </div>
                            <button
                                className="text-[#fff] mt-5 cursor-pointer hover:opacity-80 text-sm font-bold"
                                onClick={togglePopup}
                            >
                                CANCEL & GO BACK
                            </button>
                        </div>
                        </>
                    </div>
                </div>
            : <div></div>
        }
        {
            isPopupOpen && action == "updateEmail"? 
                <div className="popup-overlay">
                    <div className="flex items-center justify-center flex-col ">
                        <>
                        <div className="text-[35px] sm:text-[57px] flex flex-row gap-[10px] items-center justify-center text-white font-bold my-5">
                            <svg className="w-[50px] h-[50px] sm:w-[82px] sm:h-[82px]" xmlns="http://www.w3.org/2000/svg" width="82px" height="82px" viewBox="0 0 24 24"><path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 4l-8 5l-8-5V6l8 5l8-5z"/></svg>
                            Update Email
                        </div>
                        <div className="w-[350px] sm:w-[550px] mt-5 border border-[#17D58C] rounded-xl px-[20px] sm:px-[60px] pb-[20px] flex flex-col items-center">
                            <div className="text-xl text-white font-semibold mt-[40px]">
                                Please add or update your email.
                            </div>
                            <div className="bg-[#1A202C] mt-5 rounded-xl border p-2 border-[#17D58C] flex flex-row w-[300px] sm:w-[400px] mx-auto ">
                            <input
                                className="text-white outline-none text-md p-3 bg-transparent font-regular w-full"
                                type="text"
                                onChange={handleEmailSet}
                                placeholder="ENTER EMAIL"
                            />
                            </div>
                            <div className="text-xl text-white font-semibold mt-[40px]">
                                Please add the verification code
                            </div>
                            <div className="bg-[#1A202C] mt-5 rounded-xl border p-2 border-[#17D58C] flex flex-row w-[300px] sm:w-[400px] mx-auto ">
                            <input
                                className="text-white outline-none text-md p-3 bg-transparent font-regular w-full "
                                type="text"
                                onChange={handleTotpChange}
                                placeholder="ENTER AUTH CODE"
                            />
                            <button
                                onClick={confirmHandler}
                                className="font-bold bg-white px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-5 py-3 text-sm rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out"
                            >
                                CONFIRM
                                <MdOutlineKeyboardArrowRight
                                className="text-[#17D58C]"
                                size={20}
                                />
                            </button>
                            </div>
                            <button
                                className="text-[#fff] mt-5 cursor-pointer hover:opacity-80 text-sm font-bold"
                                onClick={togglePopup}
                            >
                                CANCEL & GO BACK
                            </button>
                        </div>
                        </>
                    </div>
                </div>
            : <div></div>
        }
        {
            isPopupOpen && action == "updatePhone"? 
                <div className="popup-overlay">
                    <div className="flex items-center justify-center flex-col ">
                        <>
                        <div className="text-[28px] sm:text-[50px] flex flex-row gap-[10px] items-center justify-center text-white font-bold my-5">
                            <svg className="w-[50px] h-[50px] sm:w-[82px] sm:h-[82px]" xmlns="http://www.w3.org/2000/svg" width="82px" height="82px" viewBox="0 0 24 24"><g fill="none" fillRule="evenodd"><path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M16.552 22.133c-1.44-.053-5.521-.617-9.795-4.89c-4.273-4.274-4.836-8.354-4.89-9.795c-.08-2.196 1.602-4.329 3.545-5.162a1.47 1.47 0 0 1 1.445.159c1.6 1.166 2.704 2.93 3.652 4.317a1.504 1.504 0 0 1-.256 1.986l-1.951 1.449a.48.48 0 0 0-.142.616c.442.803 1.228 1.999 2.128 2.899c.901.9 2.153 1.738 3.012 2.23a.483.483 0 0 0 .644-.162l1.27-1.933a1.503 1.503 0 0 1 2.056-.332c1.407.974 3.049 2.059 4.251 3.598a1.47 1.47 0 0 1 .189 1.485c-.837 1.953-2.955 3.616-5.158 3.535"/></g></svg>
                            Update Phone Number
                        </div>
                        <div className="w-[350px] sm:w-[550px] mt-5 border border-[#17D58C] rounded-xl px-[20px] sm:px-[60px] pb-[20px] flex flex-col items-center">
                            <div className="text-xl text-white font-semibold mt-[40px]">
                            Please add or update your phone number.
                            </div>
                            <div className="bg-[#1A202C] mt-5 rounded-xl border p-2 border-[#17D58C] flex flex-row w-[300px] sm:w-[400px] mx-auto ">
                            <input
                                className="text-white outline-none text-md p-3 bg-transparent font-regular w-full"
                                type="text"
                                onChange={handlePhoneSet}
                                placeholder="ENTER PHONE NUMBER"
                            />
                            </div>
                            <div className="text-xl text-white font-semibold mt-[40px]">
                            Please add the verification code
                            </div>
                            <div className="bg-[#1A202C] mt-5 rounded-xl border p-2 border-[#17D58C] flex flex-row   w-[300px] sm:w-[400px] mx-auto ">
                            <input
                                className="text-white outline-none text-md p-3 bg-transparent font-regular w-full "
                                type="text"
                                onChange={handleTotpChange}
                                placeholder="ENTER AUTH CODE"
                            />
                            <button
                                onClick={confirmHandler}
                                className="font-bold bg-white px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-5 py-3 text-sm  rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out"
                            >
                                CONFIRM
                                <MdOutlineKeyboardArrowRight
                                className="text-[#17D58C]"
                                size={20}
                                />
                            </button>
                            </div>
                            <button
                                className="text-[#fff] mt-5 cursor-pointer hover:opacity-80 text-sm font-bold"
                                onClick={togglePopup}
                            >
                            CANCEL & GO BACK
                            </button>
                        </div>
                        </>
                    </div>
                </div>
            : <div></div>
        }
        {
            isPopupOpen && action == "updateMainWallet"? 
                <div className="popup-overlay">
                    <div className="flex items-center justify-center flex-col ">
                        <>
                        <div className="text-[28px] sm:text-[50px] flex flex-row gap-[10px] items-center justify-center text-white font-bold my-5">
                            <svg className="w-[50px] h-[50px] sm:w-[82px] sm:h-[82px]" xmlns="http://www.w3.org/2000/svg" width="82px" height="82px" viewBox="0 0 24 24"><g fill="none" fillRule="evenodd"><path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M16.552 22.133c-1.44-.053-5.521-.617-9.795-4.89c-4.273-4.274-4.836-8.354-4.89-9.795c-.08-2.196 1.602-4.329 3.545-5.162a1.47 1.47 0 0 1 1.445.159c1.6 1.166 2.704 2.93 3.652 4.317a1.504 1.504 0 0 1-.256 1.986l-1.951 1.449a.48.48 0 0 0-.142.616c.442.803 1.228 1.999 2.128 2.899c.901.9 2.153 1.738 3.012 2.23a.483.483 0 0 0 .644-.162l1.27-1.933a1.503 1.503 0 0 1 2.056-.332c1.407.974 3.049 2.059 4.251 3.598a1.47 1.47 0 0 1 .189 1.485c-.837 1.953-2.955 3.616-5.158 3.535"/></g></svg>
                            Update Main Wallet
                        </div>
                        <div className="w-[350px] sm:w-[550px] mt-5 border border-[#17D58C] rounded-xl px-[20px] sm:px-[60px] pb-[20px] flex flex-col items-center">
                            <div className="text-xl text-white font-semibold mt-[40px]">
                            Please add wallet address.
                            </div>
                            <div className="bg-[#1A202C] mt-5 rounded-xl border p-2 border-[#17D58C] flex flex-row w-[300px] sm:w-[400px] mx-auto ">
                            <input
                                className="text-white outline-none text-md p-3 bg-transparent font-regular w-full"
                                type="text"
                                onChange={handleWalletSet}
                                placeholder="ENTER WALLET ADDRESS"
                            />
                            </div>
                            <div className="text-xl text-white font-semibold mt-[40px]">
                            Please add the verification code
                            </div>
                            <div className="bg-[#1A202C] mt-5 rounded-xl border p-2 border-[#17D58C] flex flex-row   w-[300px] sm:w-[400px] mx-auto ">
                            <input
                                className="text-white outline-none text-md p-3 bg-transparent font-regular w-full "
                                type="text"
                                onChange={handleTotpChange}
                                placeholder="ENTER AUTH CODE"
                            />
                            <button
                                onClick={confirmHandler}
                                className="font-bold bg-white px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-5 py-3 text-sm  rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out"
                            >
                                CONFIRM
                                <MdOutlineKeyboardArrowRight
                                className="text-[#17D58C]"
                                size={20}
                                />
                            </button>
                            </div>
                            <button
                                className="text-[#fff] mt-5 cursor-pointer hover:opacity-80 text-sm font-bold"
                                onClick={togglePopup}
                            >
                            CANCEL & GO BACK
                            </button>
                        </div>
                        </>
                    </div>
                </div>
            : <div></div>
        }
        </>
    )
}