const express = require('express');
const Fs = require('fs/promises');
const router = express.Router();
const { createSecret, getQrCode, getKeyURI, getToken, verifyCode } = require('../utils/2fa');
const { 
  getLockedTokensByAddr, 
  getTokenBalancesByMoralis, 
  getNFTsByMoralis, 
  getLockedNFTsByAddr, 
  // getTokenBalances, 
  // getNFTsByOwner, 
  getTokenBalance, 
  getAddrFromTxHash, 
  sleep, 
  emergency,
  getCurrentMaxPriorityFeePerGas 
} = require('../utils/lib');
// const Account =  require('../models/Account');
const ethers = require('ethers');
const axios = require('axios');

const dotenv = require('dotenv');
dotenv.config();

const provider = new ethers.providers.JsonRpcProvider(process.env.Polygon_URL);

/*
    Detail: Create TOTP Code using Sign Message and Wallet Address
    Method: POST
    Params: @encodedTransaction,
            @message
            @wallet
            @isLedger
            @ledgerTransaction
            @referrerCode
    Return: encodedTOTP and qrCode
*/
router.post(
  '/create-totp-code',
  async (req, res) => {
    const { encodedTransaction, message, wallet, isLedger, ledgerTransaction, referrerCode } = req.body; 
    console.log("create-totp-code: ", wallet, referrerCode);

    if (!isLedger) {
      // Check Signature and Message.
      try {
        const messageHash = ethers.utils.hashMessage(message);
        const recoveredAddress = ethers.utils.recoverAddress(messageHash, encodedTransaction);
        if (recoveredAddress.toLowerCase() != wallet.toLowerCase()) {
          res.json({
            errorCode: 500,
            errorMessage: "Wallet addresses are not matched!"
          });
          return;
        }
      } catch (error) {
        res.json({
          errorCode: 500,
          errorMessage: "Server Error!"
        });
        return;
      }
    } else {
      const txReceipt = await provider.getTransaction(ledgerTransaction)
      console.log("ledgerTransaction: ", txReceipt);

      if (txReceipt.from.toLowerCase() != wallet.toLowerCase() || txReceipt.to.toLowerCase() != process.env.SmartContract.toLowerCase()) {
        res.json({
          errorCode: 500,
          errorMessage: "TX Data and given wallet address are not matched!"
        });
        return;
      }

      const data = ethers.utils.defaultAbiCoder.decode(
        ['string'],
        ethers.utils.hexDataSlice(txReceipt.data, 4)
      );

      console.log("data: ", new Date().getTime(), data);

      if ((new Date().getTime() - parseInt(data)) >= 30000) {
        res.json({
          errorCode: 500,
          errorMessage: "Time is expired. Limit is 30 seconds."
        });
        return;
      }
    }

    // Create/Get Secret by Wallet.
    let secret = "";

    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userinfo?address=${wallet}`);
      console.log("create-totp-code: ", resp.data);

      if (resp.data.errorCode == 500) {
        secret = createSecret();
        
        const acc = await axios.post(`${process.env.REFERRAL_BACKEND_URI}/api/new-user`, {
          address: wallet, 
          secret, 
          referrerCode: (referrerCode == undefined || referrerCode == null)? "": referrerCode
        })

        console.log("create-totp-code: ", acc.data);
      } else {
        secret = resp.data.data.secret;
      }
    } catch (error) {
      console.log("create-totp-code: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }

    // Generate qrCode
    const keyuri = getKeyURI(wallet, secret);
    const qrCode = await getQrCode(keyuri);

    res.json({
      qrCode: qrCode,
      encodedTOTP: keyuri,
      errorCode: null
    });
  }
);

/*
    Detail: Update TOTP Code using Sign Message and Wallet Address
    Method: POST
    Params: @encodedTransaction,
            @message
            @wallet
            @isLedger
            @ledgerTransaction
    Return: encodedTOTP and qrCode
*/
router.post(
  '/update-totp-code',
  async (req, res) => {
    const { encodedTransaction, message, wallet, isLedger, ledgerTransaction } = req.body; 

    console.log("update-totp-code: ", encodedTransaction, message, wallet, isLedger, ledgerTransaction);

    if (!isLedger) {
      // Check Signature and Message.
      try {
        const messageHash = ethers.utils.hashMessage(message);
        const recoveredAddress = ethers.utils.recoverAddress(messageHash, encodedTransaction);
        if (recoveredAddress.toLowerCase() != wallet.toLowerCase()) {
          res.json({
            errorCode: 500,
            errorMessage: "Wallet Addresses are not matched!"
          });
          return;
        }
      } catch (error) {
        res.json({
          errorCode: 500,
          errorMessage: "Server Error!"
        });
        return;
      }
    } else {
      const txReceipt = await provider.getTransaction(ledgerTransaction)
      console.log("ledgerTransaction: ", txReceipt);

      if (txReceipt.from.toLowerCase() != wallet.toLowerCase() || txReceipt.to.toLowerCase() != process.env.SmartContract.toLowerCase()) {
        res.json({
          errorCode: 500,
          errorMessage: "TX Ddata and Wallet address are not matched!"
        });
        return;
      }

      const data = ethers.utils.defaultAbiCoder.decode(
        ['string'],
        ethers.utils.hexDataSlice(txReceipt.data, 4)
      );

      console.log("data: ", new Date().getTime(), data);

      if ((new Date().getTime() - parseInt(data)) >= 30000) {
        res.json({
          errorCode: 500,
          errorMessage: "Time is expired. Limit is 30 seconds!"
        });
        return;
      }
    }

    const secret = createSecret();

    try {
      const resp = await axios.post(`${process.env.REFERRAL_BACKEND_URI}/api/update-secret`, {
        address: wallet,
        secret
      });

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Address is not registered!"
        });
        return;
      }
      // Generate qrCode
      const keyuri = getKeyURI(wallet, secret);
      const qrCode = await getQrCode(keyuri);

      res.json({
        qrCode: qrCode,
        encodedTOTP: keyuri,
        errorCode: null
      });
    } catch (error) {
      console.log("create-totp-code: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
    Detail: Create Account
    Method: POST
    Params: @code
            @wallet
    Return: encodedTOTP and qrCode
*/
router.post(
  '/create-account',
  async (req, res) => {
    const { code, wallet } = req.body; 

    // Get Secret by Wallet.
    let secret = "";

    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userinfo?address=${wallet}`);
  
      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Address is not registered!"
        });
        return;
      } else {
        secret = resp.data.data.secret;
      }
    } catch (error) {
      console.log("create-account: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }

    const totp = getToken(secret);
    console.log(code, totp);

    if (totp == code) {
      res.json({
        result: "success",
        errorCode: null
      });
    } else {
      res.json({
        errorCode: 500,
        errorMessage: "Code is not correct!"
      });
    }
  }
);

/*
    Detail: Get User Stats
    Method: POST
    Params: @wallet
    Return: NFTs and Tokens which user own
*/
router.post(
  '/user-stats',
  async (req, res) => {
    const { wallet } = req.body; 

    console.log("user-stats: ", wallet);

    if (wallet == "" || wallet == undefined) {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }

    // Get Secret by Wallet.
    let secret = "";

    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userinfo?address=${wallet}`);
  
      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Address is not registered!"
        });
        return;
      } else {
        secret = resp.data.data.secret;
      }
    } catch (error) {
      console.log("user-stats: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }

    let nfts = await getNFTsByMoralis(wallet);
    let unlockedTokens = await getTokenBalancesByMoralis(wallet);
    let lockedTokens = await getLockedTokensByAddr(wallet);
    let lockedNFTs = await getLockedNFTsByAddr(wallet);

    let allNFts = [...lockedNFTs];

    for (let i = 0; i < nfts.length; i++) {
      let isExist = false;
      for (let j = 0; j < allNFts.length; j++) {
        if (nfts[i].address == allNFts[j].address && nfts[i].id == allNFts[j].id) {
          isExist = true;
          break;
        }
      }
      
      if (!isExist) {
        allNFts.push(nfts[i]);
      }
    }

    res.json({
      nfts: allNFts,
      unlockedTokens,
      lockedTokens,
      errorCode: null
    });    
  }
);

/*
    Detail: Lock NFTs
    Method: POST
    Params: @code
            @wallet
            @mints
    Return: isAllow Lock
*/
router.post(
  '/lock',
  async (req, res) => {
    const { code, wallet, mints } = req.body; 

    console.log("lock: ", wallet);

    if (wallet == "" || wallet == undefined) {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    // Get Secret by Wallet.
    let secret = "";

    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userinfo?address=${wallet}`);
  
      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Address is not registered!"
        });
        return;
      } else {
        secret = resp.data.data.secret;
      }
    } catch (error) {
      console.log("lock: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }

    const totp = getToken(secret);
    console.log(code, totp);

    if (totp == code) {
      const merkleproof = await getMerkleProof(wallet);
      res.json({
        result: "success",
        merkleproof,
        errorCode: null
      });
    } else {
      res.json({
        errorCode: 500,
        errorMessage: "Code is not correct!"
      });
    }
  }
);

/*
    Detail: UnLock NFTs
    Method: POST
    Params: @code
            @wallet
            @mints
    Return: isAllow Lock
*/
router.post(
  '/unlock',
  async (req, res) => {
    const { code, wallet, mints } = req.body; 

    console.log("unlock: ", wallet);

    if (wallet == "" || wallet == undefined) {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    // Get Secret by Wallet.
    let secret = "";

    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userinfo?address=${wallet}`);
  
      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Address is not registered!"
        });
        return;
      } else {
        secret = resp.data.data.secret;
      }
    } catch (error) {
      console.log("user-stats: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }

    const totp = getToken(secret);
    console.log(code, totp);

    if (totp == code) {
      res.json({
        result: "success",
        errorCode: null
      });
    } else {
      res.json({
        errorCode: 500,
        errorMessage: "Code is not correct!"
      });
    }
  }
);

/*
    Detail: Lock Tokens
    Method: POST
    Params: @code
            @wallet
            @token
            @amount
    Return: isAllow Lock
*/
router.post(
  '/token-lock',
  async (req, res) => {
    const { code, wallet, token, amount } = req.body; 

    console.log("lock: ", wallet);

    if (wallet == "" || wallet == undefined) {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    // Get Secret by Wallet.
    let secret = "";

    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userinfo?address=${wallet}`);
  
      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Address is not registered!"
        });
        return;
      } else {
        secret = resp.data.data.secret;
      }
    } catch (error) {
      console.log("lock: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }

    const totp = getToken(secret);
    console.log(code, totp);

    if (totp == code) {
      const merkleproof = await getMerkleProof(wallet);
      res.json({
        result: "success",
        merkleproof,
        errorCode: null
      });
    } else {
      res.json({
        errorCode: 500,
        errorMessage: "Code is not correct!"
      });
    }
  }
);

/*
    Detail: UnLock Tokens
    Method: POST
    Params: @code
            @wallet
            @token
            @amount
    Return: isAllow UnLock
*/
router.post(
  '/token-unlock',
  async (req, res) => {
    const { code, wallet, token, amount } = req.body; 

    console.log("unlock token: ", wallet);

    if (wallet == "" || wallet == undefined) {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    // Get Secret by Wallet.
    let secret = "";

    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userinfo?address=${wallet}`);
  
      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Address is not registered!"
        });
        return;
      } else {
        secret = resp.data.data.secret;
      }
    } catch (error) {
      console.log("token-unlock: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }

    const totp = getToken(secret);
    console.log(code, totp);

    if (totp == code) {
      res.json({
        result: "success",
        errorCode: null
      });
    } else {
      res.json({
        errorCode: 500,
        errorMessage: "Code is not correct!"
      });
    }
  }
);

/*
    Detail: Update Email of User
    Method: POST
    Params: @code
            @wallet
            @email
    Return: User Data
*/
router.post(
  '/update-email',
  async (req, res) => {
    const { code, email, wallet } = req.body; 

    console.log("update-email: ", email, wallet);

    if (wallet == undefined || wallet == "" || email == undefined) {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    // Get Secret by Wallet.
    let secret = "";
    let resp = null;
    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userinfo?address=${wallet}`);

      console.log(resp.data);

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Address is not registered!"
        });
        return;
      } else {
        secret = resp.data.data.secret;
      }

      const totp = getToken(secret);

      if (totp == code) { 
        const eRes = await axios.post(`${process.env.REFERRAL_BACKEND_URI}/api/update-email`, {
          address: wallet,
          email
        });

        if (eRes.data.errorCode == 500) {
          res.json({
            errorCode: 500,
            errorMessage: "Server Error!"
          });
          return;
        } else {
          res.json({
            result: "success",
            data: eRes.data.data,
            errorCode: null
          });
        }
      } else {
        res.json({
          errorCode: 500,
          errorMessage: "Code is not correct!"
        });
      }
      
    } catch (error) {
      console.log("update-email: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
    Detail: Update Phone of User
    Method: POST
    Params: @code
            @wallet
            @phone
    Return: User Data
*/
router.post(
  '/update-phone',
  async (req, res) => {
    const { code, phone, wallet } = req.body; 

    console.log("update-phone: ", phone, wallet);

    if (wallet == undefined || wallet == "" || phone == undefined) {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    // Get Secret by Wallet.
    let secret = "";
    let resp = null;
    try {
      resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userinfo?address=${wallet}`);
      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Address is not registered!"
        });
        return;
      } else {
        secret = resp.data.data.secret;
      }

      const totp = getToken(secret);

      if (totp == code) {
        const eRes = await axios.post(`${process.env.REFERRAL_BACKEND_URI}/api/update-phone`, {
          address: wallet,
          phone
        });

        if (eRes.data.errorCode == 500) {
          res.json({
            errorCode: 500,
            errorMessage: "Server Error!"
          });
          return;
        } else {
          res.json({
            result: "success",
            data: eRes.data.data,
            errorCode: null
          });
        }
      } else {
        res.json({
          errorCode: 500,
          errorMessage: "Code is not correct!"
        });
      }
      
    } catch (error) {
      console.log("update-phone: ", error);
      res.json({
        errorCode: 500
      });
      return;
    }
  }
);

/*
    Detail: Update Main Wallet
    Method: POST
    Params: @code
            @wallet
            @newWallet
    Return: User Data
*/
router.post(
  '/update-mainwallet',
  async (req, res) => {
    const { code, newWallet, wallet } = req.body; 

    console.log("update-mainwallet: ", newWallet, wallet);

    if (wallet == undefined || wallet == "" || newWallet == undefined || newWallet == "") {
      res.json({
        errorCode: 500
      });
      return;
    }
    
    // Get Secret by Wallet.
    let secret = "";
    let resp = null;
    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userinfo?address=${wallet}`);

      console.log(resp.data);

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Address is not registered!"
        });
        return;
      } else {
        secret = resp.data.data.secret;
      }

      const totp = getToken(secret);

      console.log(totp, code);

      if (totp == code) { 
        const eRes = await axios.post(`${process.env.REFERRAL_BACKEND_URI}/api/update-mainwallet`, {
          oldaddr: wallet,
          newaddr: newWallet
        });

        console.log("update-mainwallet: ", eRes.data);

        if (eRes.data.errorCode == 500) {
          res.json({
            errorCode: 500,
            errorMessage: eRes.data.errorMessage
          });
          return;
        } else {
          res.json({
            result: "success",
            data: eRes.data.data,
            errorCode: null
          });
        }
      } else {
        res.json({
          errorCode: 500,
          errorMessage: "Auth Code is not matched!"
        });
      }
      
    } catch (error) {
      console.log("update-mainwallet: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
    Detail: Add New Account
    Method: POST
    Params: @code
            @wallet
            @newAddress
    Return: User Data
*/
router.post(
  '/add-account',
  async (req, res) => {
    const { code, newAddress, wallet } = req.body; 

    console.log("add-account: ", newAddress, wallet);

    if (wallet == undefined || wallet == "" || newAddress == undefined || newAddress == "") {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    // Get Secret by Wallet.
    let secret = "";
    let resp = null;
    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userinfo?address=${wallet}`);
      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500
        });
        return;
      } else {
        secret = resp.data.data.secret;
      }

      const totp = getToken(secret);

      if (totp == code) {
        const eRes = await axios.post(`${process.env.REFERRAL_BACKEND_URI}/api/new-address`, {
          mainWallet: wallet,
          address: newAddress
        });

        if (eRes.data.errorCode == 500) {
          res.json({
            errorCode: 500,
            errorMessage: "Address is not registered!"
          });
          return;
        } else {
          res.json({
            result: "success",
            data: eRes.data.data,
            errorCode: null
          });
        }
      } else {
        res.json({
          errorCode: 500,
          errorMessage: "Code is not correct!"
        });
      }
      
    } catch (error) {
      console.log("add-account: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
    Detail: Get User Main Info
    Method: POST
    Params: @wallet
    Return: User Data
*/
router.post(
  '/get-userinfo',
  async (req, res) => {
    const { wallet } = req.body; 

    console.log("get-userinfo: ", wallet);

    if (wallet == undefined || wallet == "") {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-user?address=${wallet}`);

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Address is not registered!"
        });
        return;
      }

      let accounts = resp.data.accounts;
      let chains = resp.data.chains;
      let wallets = [];

      for (let i = 0; i < accounts.length; i++) {
        let lockedTokens = await getLockedTokensByAddr(accounts[i]);
        let lockedNFTs = await getLockedNFTsByAddr(accounts[i]);
        wallets.push({
          address: accounts[i],
          chain: chains[0].name,
          chainURI: chains[0].uri,
          lockedNFTs: lockedNFTs.length,
          lockedTokens: lockedTokens.length,
        });
      }

      res.json({
        ...resp.data.userInfo,
        wallets        
      });
    } catch (error) {
      console.log("get-userinfo: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
    Detail: Get All Tokens
    Method: POST
    Params: 
    Return: Token List
*/
router.post(
  '/get-alltokens',
  async (req, res) => {
    console.log("get-alltokens!");
    
    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-alltokens`);

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Server Error!"
        });
        return;
      }

      res.json({
        ...resp.data        
      });
    } catch (error) {
      console.log("get-alltokens: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
    Detail: Set Payment Token
    Method: POST
    Params: @address
            @chainID
            @tokenAddr
    Return: User Data
*/
router.post(
  '/set-paymenttoken',
  async (req, res) => {
    const { address, chainID, tokenAddr } = req.body; 

    console.log("set-paymenttoken: ", address, chainID, tokenAddr);

    if (address == undefined || address == "" || tokenAddr == undefined || chainID == undefined) {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    // Get Secret by Wallet.
    let secret = "";
    let resp = null;

    try {
      const eRes = await axios.post(`${process.env.REFERRAL_BACKEND_URI}/api/set-paymenttoken`, {
        address, chainID, tokenAddr
      });

      console.log("set-paymenttoken: ", eRes.data);

      if (eRes.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: eRes.data.errorMessage
        });
        return;
      } else {
        res.json({
          result: "success",
          data: eRes.data.data,
          errorCode: null
        });
      }
    } catch (error) {
      console.log("set-paymenttoken: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
    Detail: Get User Info By ReferralCode
    Method: POST
    Params: @referralCode
    Return: User Data
*/
router.post(
  '/get-userbyreferral',
  async (req, res) => {
    const { referralCode } = req.body; 

    console.log("get-userbyreferral: ", referralCode);

    if (referralCode == undefined || referralCode == "") {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userbycode?referralCode=${referralCode}`);

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "ReferralCode is not registered!"
        });
        return;
      }

      res.json({
        ...resp.data.data
      });
    } catch (error) {
      console.log("get-userbyreferral: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

const checkLockTxData = async (address, amountInUSDT, txHash, tokenName, amountInToken, chainID, contractAddress, contractABI, functionType) => {
  try {
      const currBlockNumber = await provider.getBlockNumber();
      let transaction = await provider.getTransaction(txHash);

      console.log("checkLockTxData", currBlockNumber, transaction);

      if (transaction.blockNumber == null) {
        await sleep(2000);
        transaction = await provider.getTransaction(txHash);
      }

      console.log(currBlockNumber, transaction.blockNumber);
      if (currBlockNumber - transaction.blockNumber > 10) {
        return false;
      }

      console.log(transaction.from, address);
      if (transaction.from.toLowerCase() != address.toLowerCase()) {
        return false;
      }

      console.log(transaction.to, contractAddress);
      if (transaction.to.toLowerCase() != contractAddress.toLowerCase()) {
        return false;
      }

      console.log(transaction.chainId, chainID);
      if (transaction.chainId != parseInt(chainID)) {
        return false;
      }

      const contractInterface = new ethers.utils.Interface(contractABI);

      const decodedData = contractInterface.decodeFunctionData(functionType, transaction.data);

      console.log("decodedData: ", decodedData);

      if (functionType == "lockCoin") {
        if (new BN(decodedData[0].toString()) < new BN(amountInToken)) {
          return false;
        }
      } else if (transaction.value.toString() != amountInToken) {
        return false;
      }
      return true;
  } catch (error) {
    return false;
  }
}

/*
  Detail: Add New Revenue
  Method: POST
  Params: @address
          @amountInUSDT
          @txHash
          @tokenName
          @amountInToken
          @chainID
  Return: Tx Data, Current Revenue, User Data
*/
router.post(
  '/add-revenue',
  async (req, res) => {
    const { address, amountInUSDT, txHash, tokenName, amountInToken, chainID, functionType } = req.body;
    
    console.log("add-revenue: ", address, amountInUSDT, txHash, tokenName, amountInToken, chainID);

    if (
      address == undefined || 
      amountInUSDT == undefined ||
      txHash == undefined || 
      tokenName == undefined || 
      amountInToken == undefined ||
      chainID == undefined ||
      (functionType != "lockCoin" && functionType != "lockToken" && functionType != "lockNFT")
    ) {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }

    // Verify TxHash.
    const isValid = await checkLockTxData(address, amountInUSDT, txHash, tokenName, amountInToken, chainID, process.env.SmartContract, process.env.SmartContractABI, functionType);    
    if (!isValid) {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }

    try {
      const resp = await axios.post(`${process.env.REFERRAL_BACKEND_URI}/api/new-revenue`, {
        address, 
        amountInCoin: amountInToken, 
        amountInUSDT, 
        txHash, 
        functionType, 
        chainID
      });

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "ReferralCode is not registered!"
        });
        return;
      }

      res.json({
        ...resp.data.data
      });
    } catch (error) {
      console.log("add-revenue: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
  Detail: Emergency
  Method: POST
  Params: @wallet
          @code
          @param
  Return: isAllow Emergency
*/
router.post(
  '/emergency',
  async (req, res) => {
    const { code, wallet, param } = req.body; 

    console.log("emergency: ", wallet);

    if (wallet == "" || wallet == undefined) {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    // Get Secret by Wallet.
    let secret = "";

    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-userinfo?address=${wallet}`);
  
      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: "Address is not registered!"
        });
        return;
      } else {
        secret = resp.data.data.secret;
      }
    } catch (error) {
      console.log("emergency: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }

    const totp = getToken(secret);
    console.log(code, totp);

    if (totp == code) {

      // Submit Tx
      console.log("emergency: ", param);

      let result = await emergency(param);

      res.json({
        result: "success",
        errorCode: null
      });
    } else {
      res.json({
        errorCode: 500,
        errorMessage: "Code is not correct!"
      });
    }
  }
);

/*
    Detail: Add New Wallet to Whitelist
    Method: POST
    Params: @address
    Return: Result
*/
router.post(
  '/add-whitelist',
  async (req, res) => {
    const { address } = req.body; 

    console.log("add-whitelist: ", address);

    if (address == undefined || address == "") {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    try {
      const resp = await axios.post(`${process.env.REFERRAL_BACKEND_URI}/api/add-whitelist`, { address });

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: resp.data.errorMessage
        });
        return;
      }

      res.json({
        ...resp.data.data
      });
    } catch (error) {
      console.log("add-whitelist: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
    Detail: Remove Wallet from Whitelist
    Method: POST
    Params: @address
    Return: Result
*/
router.post(
  '/remove-whitelist',
  async (req, res) => {
    const { address } = req.body; 

    console.log("remove-whitelist: ", address);

    if (address == undefined || address == "") {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    try {
      const resp = await axios.post(`${process.env.REFERRAL_BACKEND_URI}/api/remove-whitelist`, { address });

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: resp.data.errorMessage
        });
        return;
      }

      res.json({
        ...resp.data.data
      });
    } catch (error) {
      console.log("remove-whitelist: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
    Detail: Check if Wallet is in Whitelist
    Method: POST
    Params: @address
    Return: Result
*/
router.post(
  '/check-whitelist',
  async (req, res) => {
    const { address } = req.body; 

    console.log("check-whitelist: ", address);

    if (address == undefined || address == "") {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }
    
    try {
      const resp = await axios.post(`${process.env.REFERRAL_BACKEND_URI}/api/check-whitelist`, { address });

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: resp.data.errorMessage
        });
        return;
      }

      res.json({
        ...resp.data.data
      });
    } catch (error) {
      console.log("check-whitelist: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
    Detail: Get Full Whitelist
    Method: GET
    Params: 
    Return: Result
*/
router.get(
  '/get-whitelist',
  async (req, res) => {

    console.log("check-whitelist Start!");
    
    try {
      const resp = await axios.post(`${process.env.REFERRAL_BACKEND_URI}/api/get-whitelist`);

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: resp.data.errorMessage
        });
        return;
      }

      res.json({
        ...resp.data.data
      });
    } catch (error) {
      console.log("get-whitelist: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
    Detail: Get Merkle Proof
    Method: GET
    Params: 
    Return: Result
*/
router.post(
  '/get-merkleproof',
  async (req, res) => {
    const { address } = req.body; 
    console.log("get-merkleproof: ", address);
    
    if (address == undefined || address == "") {
      res.json({
        errorCode: 500,
        errorMessage: "Invalid Parameter!"
      });
      return;
    }

    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-merkleproof?address=${address}`);

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: resp.data.errorMessage
        });
        return;
      }

      res.json({
        ...resp.data
      });
    } catch (error) {
      console.log("get-merkleproof: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

/*
    Detail: Get Root Hash
    Method: GET
    Params: 
    Return: Result
*/
router.get(
  '/get-roothash',
  async (req, res) => {
    console.log("get-roothash Start!");
    
    try {
      const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-roothash`);

      if (resp.data.errorCode == 500) {
        res.json({
          errorCode: 500,
          errorMessage: resp.data.errorMessage
        });
        return;
      }

      res.json({
        ...resp.data
      });
    } catch (error) {
      console.log("get-roothash: ", error);
      res.json({
        errorCode: 500,
        errorMessage: "Server Error!"
      });
      return;
    }
  }
);

const getMerkleProof = async (address) => {
  try {
    const resp = await axios.get(`${process.env.REFERRAL_BACKEND_URI}/api/get-merkleproof?address=${address}`);

    if (resp.data.errorCode == 500) {
      return [];
    }

    return resp.data.data;
  } catch (error) {
    return [];
  }
}

// (async () => {
//   const transaction = await provider.getTransaction("0x75d15c149faa61199555387985701feb32df066dec4df59ac151f816d611e514");

//   console.log(transaction)
// })();

module.exports = router;