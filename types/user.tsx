export type WALLET = {
    address: string;
    chain: string;
    chainURI: string | null;
    lockedNFTs: number;
    lockedTokens: number;
};

export type USER = {
    email: string | null;
    phone: string | null;
    mainWallet: string;
    paymentTokenLists: string;
    referralCode: string | null;
    referrerCode: string | null;
    referredNum: number;
    revenue: string;
    wallets: WALLET[] | [];
};

export type USER_INFO = {
    email: string | null;
    phone: string | null;
    mainWallet: string;
    referralCode: string | null;
    referrerCode: string | null;
};