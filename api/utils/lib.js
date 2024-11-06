const ethers = require('ethers');
const dotenv = require('dotenv');
const BN = require('bn.js');
// const { Alchemy, Network, AssetTransfersCategory } = require('alchemy-sdk');
const Moralis = require('moralis');
const { unlock } = require('../route/api');
const { query } = require('express');
const { resolve } = require('url');
const axios = require('axios');

dotenv.config();

// const settings = {
//     apiKey: process.env.ALCHEMY_SEPOLIA, // Replace with your Alchemy API Key.
//     network: Network.ETH_SEPOLIA, // Replace with your desired network.
// };

// const alchemy = new Alchemy(settings);
Moralis.default.start({
    apiKey: process.env.MORALIS_API_KEY
});

let provider = new ethers.providers.JsonRpcProvider(process.env.Polygon_URL);
let wallet = process.env.PRIVATE_KEY_ADMIN;
let signer = new ethers.Wallet(wallet, provider);
let contract = new ethers.Contract(process.env.SmartContract, process.env.SmartContractABI, signer);

const emergency = async (param) => {
    console.log("emergency: ", param);

    try {            
        // Specify the function name and parameters

        let res = await axios.get(`https://api.polygonscan.com/api?module=gastracker&action=gasoracle&apikey=${process.env.POLYGONSCAN_API_KEY}`);
        let gasPrice = "50000000000";

        if (res.data.status == "1") {
            let price = parseFloat(res.data.result.FastGasPrice) + 5;
            gasPrice = ethers.utils.parseUnits(price.toString(), 9);
        }

        const result = await contract.emergencyByAdmin(...param, {
            gasLimit: "2000000",
            gasPrice
        });

        await result.wait();

        console.log("Transaction Confirmed!", result.hash);
        
        return result.hash;
    } catch (error) {
        console.error('Error:', error);
        return undefined;
    }
}


const getCurrentMaxPriorityFeePerGas = async () => {
    const data = await provider.getFeeData();

    console.log("getCurrentMaxPriorityFeePerGas: ", data);
    return {
        ...data
    }
}
  
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const stringToBytes32 = (str) => {
    let bytes32 = "0x";
    for (let i = 0; i < 32; i++) {
        let charCode = i < str.length ? str.charCodeAt(i) : 0;
        let hex = charCode.toString(16).padStart(2, "0");
        bytes32 += hex;
    }
    return bytes32;
}

const getAddrFromTxHash = async (txHash) => {
    try {
        const transaction = await provider.getTransaction(txHash);
        const sender = transaction.from;
        return sender;
    } catch (error) {
        console.error('An error occurred:', error);
        return undefined;
    }
}

const getTokenBalance = async (tokenContract, address) => {
    try {
        const res = await tokenContract.balanceOf(address);
        const formattedBalance = ethers.utils.formatEther(res);
       
        return parseInt(formattedBalance * Math.pow(10, 18 - config.Decimal));
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

// const getNFTsByOwner = async (ownerAddr) => {
//     console.log("fetching NFTs for address:", ownerAddr);

//     // Print total NFT count returned in the response:
//     const nftsForOwner = await alchemy.nft.getNftsForOwner(ownerAddr);
    
//     let nfts = [];

//     for (const nft of nftsForOwner.ownedNfts) {
//         if (nft.tokenType == "ERC721") {
//             nfts.push({
//                 locked: false,
//                 nftType: nft?.tokenType,
//                 content: {
//                     links: {
//                         image: nft?.tokenUri
//                     },
//                     metadata: {
//                         name: nft?.name,
//                         symbol: nft?.contract?.symbol
//                     }
//                 },
//                 address: nft?.address,
//                 id: nft?.tokenId
//             });
//         }
//     }

//     return nfts;
// }

// const getTokenBalances = async (ownerAddr) => {
//     const balances = await alchemy.core.getTokenBalances(ownerAddr);

//     const tokens = [];
//     for (const token of balances.tokenBalances) {
//         tokens.push({
//             address: token.contractAddress,
//             amount: token.tokenBalance
//         });
//     }

//     return tokens;
// }

const getTokenBalancesByMoralis = async (ownerAddr) => {
    try {
        const coinBalance = await provider.getBalance(ownerAddr);
        const response = await Moralis.default.EvmApi.token.getWalletTokenBalances({
            "chain": process.env.CHAINID_HEX_POLYGON,
            "address": ownerAddr
        });

        const data = response.raw;

        let tokens = [];

        for (let token of data) {
            tokens.push({
                name: token?.name,
                symbol: token?.symbol,
                address: token?.token_address,
                balance: token?.balance,
                decimals: token?.decimals,
                logo: token?.logo,
                type: "coin"
            });
        }

        let cursor = data.cursor;

        while (cursor != null) {
            const response = await Moralis.default.EvmApi.token.getWalletTokenBalances({
                "chain": process.env.CHAINID_HEX_POLYGON,
                "address": ownerAddr,
                cursor
            });
    
            const data = response.raw;
    
            for (let token of data) {
                tokens.push({
                    name: token?.name,
                    symbol: token?.symbol,
                    address: token?.token_address,
                    balance: token?.balance,
                    decimals: token?.decimals,
                    logo: token?.logo,
                    type: "type"
                });
            }

            cursor = data.cursor;
        }

        tokens.push({
            name: process.env.CURR_COIN_NAME,
            symbol: process.env.CURR_COIN_SYMBOL,
            address: "",
            balance: coinBalance,
            decimals: process.env.CURR_COIN_DECIMALS,
            logo: process.env.CURR_COIN_LOGO
        });

        return tokens;
    } catch (e) {
        console.log("getTokenBalances: ", e);
        return [];
    }
}

const getNFTsByMoralis = async (ownerAddr) => {
    try {      
        const response = await Moralis.default.EvmApi.nft.getWalletNFTs({
            "chain": process.env.CHAINID_HEX_POLYGON,
            "format": "decimal",
            "mediaItems": false,
            "address": ownerAddr
        });
        
        let nfts = [];

        for (let nft of response.raw.result) {
            if (nft?.contract_type == "ERC721") {
                const metadata = nft.metadata != null? JSON.parse(nft.metadata): null;
                nfts.push({
                    locked: false,
                    nftType: nft?.contract_type,
                    content: {
                        links: {
                            image: metadata?.image
                        },
                        metadata: {
                            name: nft?.name,
                            symbol: nft?.symbol
                        }
                    },
                    address: nft?.token_address,
                    id: nft?.token_id
                });
            }
        }

        let cursor = response.raw.cursor;

        while (cursor != null) {
            const response = await Moralis.default.EvmApi.nft.getWalletNFTs({
                "chain": process.env.CHAINID_HEX_POLYGON,
                "format": "decimal",
                "mediaItems": false,
                "address": ownerAddr,
                cursor
            });
        
            for (let nft of response.raw.result) {
                if (nft?.contract_type == "ERC721") {
                    const metadata = nft.metadata != null? JSON.parse(nft.metadata): null;
                    nfts.push({
                        locked: false,
                        nftType: nft?.contract_type,
                        content: {
                            links: {
                                image: metadata?.image
                            },
                            metadata: {
                                name: nft?.name,
                                symbol: nft?.symbol
                            }
                        },
                        address: nft?.token_address,
                        id: nft?.token_id,
                        lockedId: null
                    });
                }
            }
        
            cursor = response.raw.cursor;
        }

        return nfts;
    } catch (e) {
        console.error(e);

        return [];
    }
}

const getLockedNFTsByAddr = async (ownerAddr) => {
    const contract = new ethers.Contract(process.env.SmartContract, process.env.SmartContractABI, provider);
    const res = await contract.getUserlockedNFTs(ownerAddr);

    let lockedNFTs = [];

    if (res.length == 0) {
        return [];
    }

    for (let inft = 0; inft < res.length; inft++) {
        if (res[inft].isLocked == false) {
            continue;
        }
        lockedNFTs.push({
            tokenAddress: res[inft].nftCollection,
            tokenId: res[inft].tokenId.toString()
        });
    }

    if (lockedNFTs.length == 0) {
        return [];
    }

    let nfts = [];

    while(lockedNFTs.length > 0) {
        let index = (lockedNFTs.length > 25)? 25: lockedNFTs.length;
        let queryData = lockedNFTs.slice(0, index);

        const response = await Moralis.default.EvmApi.nft.getMultipleNFTs({
            "chain": process.env.CHAINID_HEX_POLYGON,
            "tokens": queryData
        });

        for (let nft of response.raw) {
            if (nft?.contract_type == "ERC721") {
                const metadata = nft.metadata != null? JSON.parse(nft.metadata): null;
                nfts.push({
                    locked: true,
                    nftType: nft?.contract_type,
                    content: {
                        links: {
                            image: metadata?.image
                        },
                        metadata: {
                            name: nft?.name,
                            symbol: nft?.symbol
                        }
                    },
                    address: nft?.token_address,
                    id: nft?.token_id
                });
            }
        }

        lockedNFTs = lockedNFTs.slice(25, lockedNFTs.length);
    }

    nfts = nfts.map((nft, index) => {
        for (let i = 0; i < res.length; i++) {
            if (nft.address.toLowerCase() == res[i].nftCollection.toLowerCase() && nft.id.toString() == res[i].tokenId.toString()) {
                return {
                    ...nft,
                    index: index
                }
            }
        }
    });

    return nfts;
}

const getLockedTokensByAddr = async (ownerAddr) => {
    const contract = new ethers.Contract(process.env.SmartContract, process.env.SmartContractABI, provider);
    const res = await contract.getUserlockedTokens(ownerAddr);
    const coinBalance = await contract.getUserlockedCoin(ownerAddr);

    let unlockedTokens = [];

    if (res.length == 0) {
        return [];
    }

    for (let token of res) {
        if (token[0].tokenAmount == 0) {
            continue;
        }
        unlockedTokens.push({
            tokenAddress: token[0],
            tokenBalance: token[1].toString()
        });
    }

    if (unlockedTokens.length == 0) {
        return [];
    }

    let tokens = [];

    while(unlockedTokens.length > 0) {
        let index = (unlockedTokens.length > 25)? 25: unlockedTokens.length;
        let basicData = unlockedTokens.slice(0, index);
        queryData = basicData.map((value) => {
            return value.tokenAddress;
        });        

        const response = await Moralis.default.EvmApi.token.getTokenMetadata({
            "chain": process.env.CHAINID_HEX_POLYGON,
            "addresses": queryData
        });

        let data = response.raw;

        for (let i = 0; i < data.length; i++) {
            tokens.push({
                name: data[i].name,
                symbol: data[i].symbol,
                address: data[i].address,
                balance: basicData[i].tokenBalance,
                decimals: data[i].decimals,
                logo: data[i].null,
                type: "token"
            });
        }

        unlockedTokens = unlockedTokens.slice(25, unlockedTokens.length);
    }

    tokens.push({
        name: process.env.CURR_COIN_NAME,
        symbol: process.env.CURR_COIN_SYMBOL,
        address: "",
        balance: coinBalance,
        decimals: process.env.CURR_COIN_DECIMALS,
        logo: process.env.CURR_COIN_LOGO,
        type: "coin"
    });
    
    return tokens;
}

module.exports = {
    getTokenBalance,
    getAddrFromTxHash,
    emergency,
    sleep,
    getCurrentMaxPriorityFeePerGas,
    // getNFTsByOwner,
    // getTokenBalances,
    getTokenBalancesByMoralis,
    getNFTsByMoralis,
    getLockedNFTsByAddr,
    getLockedTokensByAddr
};