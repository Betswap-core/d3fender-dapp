import Image from "next/legacy/image";
import ConnectWallet from "./ConnectWallet";
import { FaLock } from "react-icons/fa";
import Link from "next/link";
import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setOpen}>
          <div className="fixed inset-0" />

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col divide-y divide-gray-200 bg-[#0F101E] shadow-xl border-l border-slate-500 z-40">
                      <div className="flex min-h-0 flex-1 flex-col overflow-y-scroll py-6">
                        <div className="px-4 sm:px-6">
                          <div className="flex items-start justify-between">
                            <Dialog.Title className="text-base font-semibold leading-6 text-white opacity-40">
                              MENU
                            </Dialog.Title>
                            <div className="ml-3 flex h-7 items-center">
                              <button
                                type="button"
                                className="relative rounded-md bg-[#23EB9E] text-black outline-none"
                                onClick={() => setOpen(false)}
                              >
                                <span className="absolute -inset-2.5" />
                                <span className="sr-only">Close panel</span>
                                <XMarkIcon
                                  className="h-8 w-8"
                                  aria-hidden="true"
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="relative mt-10 flex-1 px-5 flex-col flex gap-5 sm:px-6 text-white">
                          <Link
                            href={"/"}
                            className="text-xl cursor-pointer hover:opacity-80 font-semibold"
                          >
                            Home
                          </Link>
                          <Link
                            href={"/"}
                            className="text-xl cursor-pointer hover:opacity-80 font-semibold"
                          >
                            App
                          </Link>
                          <Link
                            href={"/vault"}
                            className="text-xl cursor-pointer hover:opacity-80 font-semibold"
                          >
                            Vault
                          </Link>
                          <Link
                            href={"#"}
                            className="text-xl cursor-pointer hover:opacity-80 font-semibold opacity-50"
                          >
                            Points
                          </Link>

                          <Link
                            href={"https://d3fenders.gitbook.io/d3fenders/"}
                            target="_blank"
                            className="text-xl cursor-pointer hover:opacity-80 font-semibold"
                          >
                            Docs
                          </Link>

                          <Link
                            href={"https://d3fenders.com/user-guide/"}
                            target="_blank"
                            className="text-xl cursor-pointer hover:opacity-80 font-semibold"
                          >
                            User guide
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="w-full  cursor-pointer  flex items-center justify-between py-5">
        <div className="w-full relative flex-col lg:flex-row mx-auto container  flex items-startp p-5 lg:p-0 lg:items-center justify-between">
          <Link
            href={"/"}
            className="flex flex-row gap-4 w-full flex-1 items-center cursor-pointer hover:opacity-80"
          >
            <img src="/assets/logo.png" alt="logo" className="w-22" />
            <div>
              <div className="text-[#fff] font-bold">WEB3</div>
              <div className="text-[#23EB9E] font-extrabold">SECURITY</div>
              <div className="text-[#23EB9E] font-extrabold">PROTOCOL</div>
            </div>
          </Link>
          <div className="text-white block lg:hidden line p-[0.5px] "></div>
          <div className="flex lg:hidden items-center gap-2 container mx-auto text-white font-bold mt-2">
            <FaLock className="text-[#fff]" />
            Secure your digital assets
          </div>
          <div className="w-full mt-2 lg:mt-0 lg:w-[200px]">
            <ConnectWallet />
          </div>
          <svg
            onClick={() => setOpen(true)}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-10 h-10 text-white absolute right-4 top-10 bottom-0 z-10 block lg:hidden"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5"
            />
          </svg>
        </div>
      </div>
      <div className="text-white hidden lg:block line p-[0.5px] "></div>
      <div className="hidden lg:flex items-center gap-2 container mx-auto text-white font-bold mt-2">
        <FaLock className="text-[#fff]" />
        Secure your digital assets
      </div>
    </>
  );
}

//
