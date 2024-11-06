import ConnectWallet from "@/components/ConnectWallet";

export default function ConnectWalletBody() {
    return (
        <div>
            <div className="w-full flex h-fit items-center flex-col justify-center text-white bg-[#0F101E]">
              <div className="flex-col flex items-center justify-between gap-5 py-10 w-full max-w-[500px] md:max-w-[600px] lg:max-w-[750px] 2xl:max-w-[1000px] mx-auto lg:mb-[20px]">
                <div className="font-semibold text-[20px] md:text-[30px] lg:text-[38px] 2xl:text-[50px] text-center">
                  Simple. Secure. Decentralized.
                </div>
                <div className="font-semibold text-[20px] mg:text-[30px] lg:text-[38px] 2xl:text-[50px] text-center text-gradient">
                  Safeguard digital assets with D3fenders & stop wallet drains
                  forever!
                </div>
              </div>

              <div className="max-w-[1260px] w-full sm:w-4/5 lg:w-3/4 flex flex-col gap-[40px] items-start justify-between lg:border-solid lg:border-[2px] border-none lg:border-[#17D58C] rounded-xl px-[20px] lg:p-[40px] mb-[60px]">
                <div className="w-full flex flex-col lg:flex-row gap-[40px] items-center justify-center">
                  <div className="p-[20px] lg:p-0 rounded-xl border-solid border-[2px] lg:border-none border-[#17D58C] w-full max-w-[630px] flex flex-row items-start justify-center gap-5 h-[230px] sm:h-[270px]">
                    <div className="max-w-[300px] flex flex-col flex-1 gap-[30px]">
                      <h1 className="font-semibold text-white text-[24px] xl:text-[28px] w-full flex-1 pr-10">
                        Wallet Drain Protection
                      </h1>
                      <p className="text-[#92939E] text-[16px] h-[70px]">
                        We offer protection from single instance drains and seed phrase compromise.
                      </p>
                    </div>
                    <div className="w-1/3 2xl:w-1/2 flex flex-row items-center justify-center h-full">
                      <img
                        src="/assets/drain-icon.png"
                        className="w-[150px]"
                        alt="drain"
                      />
                    </div>
                  </div>
                  <div className="p-[20px] lg:p-0 rounded-xl border-solid border-[2px] lg:border-none border-[#17D58C] max-w-[630px] flex flex-row items-start justify-center gap-5 w-full h-[230px] sm:h-[270px]">
                    <div className="max-w-[300px] flex flex-col flex-1 gap-[30px]">
                      <h1 className="font-semibold text-white text-[24px] xl:text-[28px] w-full flex-1 pr-10">
                        Empowering Everyone
                      </h1>
                      <p className="text-[#92939E] text-[16px] h-[70px]">
                        Affordable Web3 security for all that won't break the bank! Each locking event is only $4.
                      </p>
                      <p className="text-[#92939E] text-[16px] h-[70px]">
                        Holders of D3fenders Digital Collectibles have unlimited use access.
                      </p>
                    </div>
                    <div className="w-1/3 2xl:w-1/2 flex flex-row items-center justify-center h-full">
                      <img
                        src="/assets/empo-icon.png"
                        className="w-[150px]"
                        alt="drain"
                      />
                    </div>
                  </div>
                </div>
                <div className="w-full flex flex-col lg:flex-row gap-[40px] items-center justify-center">
                  <div className="p-[20px] lg:p-0 rounded-xl border-solid border-[2px] lg:border-none border-[#17D58C] w-full max-w-[630px] flex flex-row items-start justify-center gap-5 h-[230px] sm:h-[270px]">
                    <div className="max-w-[300px] flex flex-col flex-1 gap-[30px]">
                      <h1 className="font-semibold text-white text-[24px] xl:text-[28px] w-full flex-1 pr-10">
                        Emergency Migration
                      </h1>
                      <p className="text-[#92939E] text-[16px] h-[70px]">
                        Migrate your assets regardless of gas in your wallet. Our migration tool creates freedom and security in a dangerous web3 space.
                      </p>
                    </div>
                    <div className="w-1/3 2xl:w-1/2 flex flex-row items-center justify-center h-full">
                      <img
                        src="/assets/lock-icon.png"
                        className="w-[150px]"
                        alt="drain"
                      />
                    </div>
                  </div>
                  <div className="p-[20px] lg:p-0 rounded-xl border-solid border-[2px] lg:border-none border-[#17D58C] max-w-[630px] flex flex-row items-start justify-center gap-5 w-full h-[230px] sm:h-[270px]">
                    <div className="max-w-[300px] flex flex-col flex-1 gap-[30px]">
                      <h1 className="font-semibold text-white text-[24px] xl:text-[28px] w-full flex-1 pr-10">
                        Decentralized Vault System
                      </h1>
                      <p className="text-[#92939E] text-[16px] h-[70px]">
                        Multi-layered Authentication ensures ownership over your assets via our self-custodial 2fa security layer.
                      </p>
                    </div>
                    <div className="w-1/3 2xl:w-1/2 flex flex-row items-center justify-center h-full">
                      <img
                        src="/assets/vault-lock.png"
                        className="w-[150px]"
                        alt="drain"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mb-20 w-[200px]">
                <ConnectWallet />
              </div>
            </div>
          </div>
    )
}