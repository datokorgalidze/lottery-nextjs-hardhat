const { network, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../helper-hardhat-config");

const FUND_AMOUNT = ethers.utils.parseEther("30");

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;

  let VRFCoordinatorV2Address, subscriptionId, VRFCoordinatorV2Mock;

  if (developmentChains.includes(network.name)) {
    VRFCoordinatorV2Mock = await ethers.getContractAt(
      "VRFCoordinatorV2Mock",
      (await deployments.get("VRFCoordinatorV2Mock")).address
    );
    VRFCoordinatorV2Address = VRFCoordinatorV2Mock.address;
    console.log("VRFCoordinatorV2Address:", VRFCoordinatorV2Address);

    const txResponse = await VRFCoordinatorV2Mock.createSubscription();
    const txReceipt = await txResponse.wait(1);
    subscriptionId = txReceipt.events[0]?.args?.subId;
    VRFCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);

    if (!subscriptionId) {
      throw new Error(
        "Subscription ID not created. Check VRFCoordinatorV2Mock."
      );
    }
  } else {
    VRFCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
    subscriptionId = networkConfig[chainId].subscriptionId;
  }

  const entranceFee = networkConfig[chainId].entranceFee;
  const gasLane = networkConfig[chainId].gasLane;
  const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
  const interval = networkConfig[chainId].interval;

  const args = [
    VRFCoordinatorV2Address,
    entranceFee.toString(),
    gasLane,
    subscriptionId.toString(),
    callbackGasLimit,
    interval,
  ];

  const lottery = await deploy("Lottery", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmation || 1,
  });

  if (developmentChains.includes(network.name)) {
    const VRFCoordinatorV2Mock = await ethers.getContractAt(
      "VRFCoordinatorV2Mock",
      (await deployments.get("VRFCoordinatorV2Mock")).address
    );
    await VRFCoordinatorV2Mock.addConsumer(subscriptionId, lottery.address);
  }

  log(`Lottery deployed at ${lottery.address}`);
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    log("Verifying...");
    await verify(lottery.address, args);
  }
  log("-----------------------------------");
};

module.exports.tags = ["all", "lottery"];
