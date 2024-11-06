export type Nft = {
    locked: boolean;
    nftType: string;
    content: {
        links: {
            image: string;
        };
        metadata: {
            name: string;
            symbol: string;
        };
    };
    address: string;
    id: string;
    index: number;
};