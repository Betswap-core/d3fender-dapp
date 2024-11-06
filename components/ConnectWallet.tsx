import React, { useEffect, useState } from "react";
import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import { FaLock } from "react-icons/fa";
import { useWeb3Modal } from "@web3modal/react";
import { useAccount, useDisconnect } from "wagmi";
import { USER_INFO } from "@/types/user";
import { useRouter } from 'next/router';

export default function ConnectWallet() {
  const { open } = useWeb3Modal();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const { query } = router;
  let referrerCode = query.ref;

  useEffect(() => {
    if (address == undefined || !referrerCode) return;
    (async () => {
      // Verify referrerCode
      try {      
        let fetchTheLockTx = await fetch(
          // @ts-ignore: Object is possibly 'null'.
          `/api/defendersHandler/${referrerCode}`,
          {
            method: "POST", // or 'PUT' or 'PATCH' depending on your API
            headers: {
              "Content-Type": "application/json",
              // Add any other headers if needed
            },
            body: JSON.stringify({
              endpoint: "get-userbyreferral", // wrong action is being passed here
              referralCode: referrerCode
            }),
          }
        );
  
        let txRes = await fetchTheLockTx.json();
  
        if (txRes.data.errorCode === 500) {
          console.log(txRes.data.errorMessage);
          return;
        }
      } catch (e) {
          console.log(e);
          return;
      }

      // Referral Part.
      try {
        const data = localStorage.getItem('userInfo');

        if (data == null) {
          // New Profile
          if (referrerCode != undefined) {
            // Referred User
            localStorage.setItem('userInfo', JSON.stringify({
              email: null,
              phone: null,
              mainWallet: address,
              referralCode: null,
              referrerCode
            }));
            console.log("Save ReferrerCode!");
          }
        }
        console.log("Connect Wallet: ", data);
      } catch(error) {
        console.log("Connect Wallet Error: ", error);
      }
    })();
  }, [address]);

  return (
    <div className=" relative w-full">
      <button
        onClick={async () => {
          if (!address)
            await open();
          else disconnect();
        }}
        className={
          address
            ? "font-bold bg-[#0F101E] border w-full border-[#17D58C] px-2 items-center justify-center flex py-3 text-sm  rounded-full text-white transition-all duration-300 ease-in-out"
            : "font-bold bg-white px-2 items-center justify-center flex py-3 text-sm w-full  rounded-full text-black hover:bg-gray-200 transition-all duration-300 ease-in-out"
        }
      >
        {address ? (
          <div className="flex items-center gap-5">
            CONNECTED
            <FaLock className="text-[#fff]"  />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            CONNECT WALLET
            <MdOutlineKeyboardArrowRight className="text-[#17D58C]" size={20} />
          </div>
        )}
      </button>
    </div>
  );
}
