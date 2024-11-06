import { NextApiRequest, NextApiResponse } from "next";

const fs = require("fs");

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { wallet }: any = req.query;
    const { endpoint }: any = req.body;

    const headers = {
      'Accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Content-Type': 'application/json',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'cross-site',
      'TE': 'trailers'  
    };


    let success = true;

    const url = `http://localhost:5000/api/${endpoint}`;

    let data = {};
    let hasDupOrEmpty = false;

    if (endpoint == "create-totp-code") {
      const { encodedTransaction, message, isLedger, ledgerTransaction, referrerCode }: any = req.body;
      data = {
        encodedTransaction: encodedTransaction,
        message: message,
        wallet: wallet,
        isLedger: isLedger,
        ledgerTransaction: ledgerTransaction,
        referrerCode
      };
    } else if (endpoint == "add-account") {
      const { code, newAddress }: any = req.body;
      data = {
        wallet: wallet,
        code: code,
        newAddress: newAddress,
      };
    } else if (endpoint == "add-revenue") {
      const { address, amountInUSDT, txHash, tokenName, amountInToken, chainID, functionType }: any = req.body;
      data = {
        address, 
        amountInUSDT, 
        txHash, 
        tokenName, 
        amountInToken, 
        chainID, 
        functionType
      };
      console.log("add-revenue", data);
    } else if (endpoint == "get-userbyreferral") {
      const { referralCode }: any = req.body;
      data = {
        referralCode
      };
    } else if (endpoint == "get-userinfo") {
      data = {
        wallet: wallet
      };
    } else if (endpoint == "set-paymenttoken") {
      const {  chainID, tokenAddr }: any = req.body;
      data = {
        address: wallet,
        chainID: chainID,
        tokenAddr: tokenAddr
      };
    } else if (endpoint == "get-alltokens") {
      data = {};
    } else if (endpoint == "update-mainwallet") {
      const { newWallet, code }: any = req.body;
      data = {
        code,
        wallet: wallet,
        newWallet
      };
    } else if (endpoint == "update-email") {
      const { code, newEmail }: any = req.body;
      data = {
        wallet: wallet,
        code: code,
        email: newEmail,
      };
    } else if (endpoint == "update-phone") {
      const { code, newPhone }: any = req.body;
      data = {
        wallet: wallet,
        code: code,
        phone: newPhone,
      };
    } else if (endpoint == "update-totp-code") {
      const { encodedTransaction, message, isLedger, ledgerTransaction }: any = req.body;
      data = {
        encodedTransaction: encodedTransaction,
        message: message,
        wallet: wallet,
        isLedger: isLedger,
        ledgerTransaction: ledgerTransaction,
      };
    } else if (endpoint == "create-account") {
      const { code, wallet }: any = req.body;
      data = {
        code: code,
        wallet: wallet,
      };
    } else if (endpoint == "lock") {
      const { code, mints }: any = req.body;
      hasDupOrEmpty = hasEmptyOrDuplicateStrings(mints);
      data = {
        code: code,
        wallet: wallet,
        mints: mints,
      };
    } else if (endpoint === "unlock") {
      const { code, mints }: any = req.body;
      hasDupOrEmpty = hasEmptyOrDuplicateStrings(mints);
      data = {
        code: code,
        wallet: wallet,
        mints: mints,
      };
    } else if (endpoint === "emergency") {
      const { code, param, newOwner }: any = req.body;
      data = {
        code: code,
        wallet: wallet,
        param: param,
        newOwner: newOwner,
      };
    } else if (endpoint === "user-stats") {
      data = {
        wallet: wallet,
      };
    } else if (endpoint === "token-lock") {
      const { code, token, amount }: any = req.body;
      data = {
        code: code,
        wallet: wallet,
        tokenAddress: token,
        amount: amount,
      };
    } else if (endpoint === "token-unlock") {
      console.log("token unlock");
      const { code, token, amount }: any = req.body;
      data = {
        code: code,
        wallet: wallet,
        tokenAddress: token,
        amount: amount,
      };
    }

    if(hasDupOrEmpty){
      return res.send({
        success: false,
        data: null,
      });
    }

    const options = {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    };

    let transactionToSignEncoded = "";

    console.log(url);
    console.log(options);


    try{
      let response = await fetch(url, options)
        .then((response) => response.json())
        .then(async (data) => {
          transactionToSignEncoded = data;
      });

      console.log(response);

      return res.send({
        success: true,
        data: transactionToSignEncoded,
      });

    }
    catch(e){
      return res.send({
        success: false,
        data: null,
      });
    }

  }
  catch (e) {
    return res.send({
      success: false,
      data: null,
    });
  }
};


function hasEmptyOrDuplicateStrings(arr: string[]) :boolean {
  const stringSet = new Set();
  
  for (const str of arr) {
      // Check for empty string
      if (str === '') {
          return true;
      }

      // Check for duplicate
      if (stringSet.has(str)) {
          return true;
      }

      stringSet.add(str);
  }

  return false;
}