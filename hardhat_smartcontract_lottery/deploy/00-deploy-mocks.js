const { deployments, network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

const BASE_FEE = ethers.utils.parseEther("0.25");
const GAS_PRICE_LINK = 1e9;

module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const args = [BASE_FEE, GAS_PRICE_LINK];
  // const chainId = network.config.chainId;
  // const chainId = 31337;

  if (developmentChains.includes(network.name)) {
    log("local network detedted, Deploying Mocks!");

    const deploymentResult = await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: args,
    });
    log("Mock deployed!");
    log("-------------------------------------");
  }
};

module.exports.tags = ["all", "mocks"];
