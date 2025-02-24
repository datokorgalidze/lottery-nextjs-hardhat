import { useWeb3Contract } from "react-moralis";
import abi from "../constants/abi.json";
import contractAddress from "../constants/contractAddress.json";
import { useMoralis } from "react-moralis";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useNotification } from "web3uikit";

export default function LotteryEntrance() {
  const { chainId: chainIdHex, isWeb3Enabled } = useMoralis();
  const chainId = parseInt(chainIdHex);
  const lotteryAddress =
    chainId in contractAddress ? contractAddress[chainId][0] : null;
  const [entranceFee, setEntranceFee] = useState("0");
  const [numOfPlayers, setNumOfPlayers] = useState("0");
  const [recentWinner, setRecentWiner] = useState("0");
  const dispatch = useNotification();

  const {
    runContractFunction: enterRaffle,
    isLoading,
    isFetching,
  } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "enterRaffle",
    params: {},
    msgValue: entranceFee,
  });

  const { runContractFunction: getEntranceFee } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getEntranceFee",
    params: {},
  });

  const { runContractFunction: getNumberOfPlayers } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getNumberOfPlayers",
    params: {},
  });
  const { runContractFunction: getsRecentWinner } = useWeb3Contract({
    abi: abi,
    contractAddress: lotteryAddress,
    functionName: "getsRecentWinner",
    params: {},
  });

  async function updateUi() {
    const entranceFeeFromCall = (await getEntranceFee()).toString();
    const numOfPlayerszfromCall = (await getNumberOfPlayers()).toString();
    const recentWinnerfromCall = (await getsRecentWinner()).toString();
    setEntranceFee(entranceFeeFromCall);
    setNumOfPlayers(numOfPlayerszfromCall);
    setRecentWiner(recentWinnerfromCall);
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      updateUi();
    }
  }, [isWeb3Enabled]);

  const handleSuccess = async (tx) => {
    await tx.wait(1);
    handleNewNotification(tx);
    updateUi();
  };

  const handleNewNotification = () => {
    dispatch({
      type: "info",
      message: "Transaction Complete!",
      position: "topR",
      icon: "bell",
    });
  };

  return (
    <div className="px-5">
      <h5 className="py-4 px-4 font-bold text-2xl">Lottery</h5>
      {lotteryAddress ? (
        <div className="p-2">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-auto"
            onClick={async function () {
              await enterRaffle({
                onSuccess: handleSuccess,
                onError: (error) => console.log(error),
              });
            }}
            disabled={isLoading || isFetching}
          >
            {isLoading || isFetching ? (
              <div className="animate-spin spinner-border h-8 w-8 border-b-2 rounded-full"></div>
            ) : (
              "Enter Raffle"
            )}
          </button>
          <div>
            {" "}
            Entrance Fee: {ethers.utils.formatUnits(entranceFee, "ether")} ETH
          </div>
          <div>
            <h2>Number Of Players: {numOfPlayers}</h2>
          </div>
          <div> Recent Winner: {recentWinner}</div>
        </div>
      ) : (
        <div>Please connect to a supported chain</div>
      )}
    </div>
  );
}
