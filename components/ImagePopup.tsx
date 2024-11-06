import React, { useState } from "react";
import { useToast } from "@chakra-ui/react";
import { ChakraProvider } from "@chakra-ui/provider";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";

interface ImagePopupProps {
  base64ImageString: string;
  encodedTOTP: string;
  isPopupOpen: boolean;
  setPopupOpen: any;
  wallet: any;
  forceRefresh: any;
}

const ImagePopup: React.FC<ImagePopupProps> = ({
  base64ImageString,
  encodedTOTP,
  setPopupOpen,
  isPopupOpen,
  wallet,
  forceRefresh,
}) => {
  const toast = useToast();

  const [isCopied, setIsCopied] = useState(false);
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(encodedTOTP);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset the copied status after 2 seconds
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const togglePopup = () => {
    setPopupOpen(!isPopupOpen);
  };

  const linkAuthAccountToWallet = async () => {
    console.log("will be linking with code: ", totpCode);

    let txRes: any = null;

    try {
      let fetchIx = await fetch(
        // @ts-ignore: Object is possibly 'null'.
        `/api/defendersHandler/${wallet}`,
        {
          method: "POST", // or 'PUT' or 'PATCH' depending on your API
          headers: {
            "Content-Type": "application/json",
            // Add any other headers if needed
          },
          body: JSON.stringify({
            endpoint: "create-account",
            code: totpCode,
            wallet: wallet,
          }),
        }
      );

      txRes = await fetchIx.json();

      console.log("txRes: ", txRes);

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
    } catch (e) {
      console.log(e);
      toast({
        title: `Invalid authentication code provided.`,
        description: ``,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (txRes.data === null) {
      toast({
        title: `There was an unexpected error.`,
        description: ``,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    forceRefresh();
    togglePopup();

    toast({
      title: `Linking your authenticator on chain success.`,
      description: ``,
      status: "success",
      duration: 5000,
      isClosable: true,
    });
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
            <img src={base64ImageString} alt="Popup" />

            <button
              onClick={copyToClipboard}
              className={`px-4 mt-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 transition duration-300 ${
                isCopied ? "bg-green-500 hover:bg-green-700" : ""
              }`}
            >
              {isCopied ? "Copied!" : "Copy Code"}
            </button>

            <div className="text-3xl text-white font-bold my-5">
              CREATE ACCOUNT
            </div>
            <div className="text-md text-white font-semibold  mb-5">
              Scan the QR code with your authenticator app for the verification
              code
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
                onClick={linkAuthAccountToWallet}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePopup;
