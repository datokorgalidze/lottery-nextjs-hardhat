const fs = require("fs");
const { ethers, deployments, network } = require("hardhat");

const frontEndAddressFile =
  "../nextjs_lottery_client/constants/contractAddress.json";
const frontEndAbiFile = "../nextjs_lottery_client/constants/abi.json";

module.exports = async () => {
  if (process.env.UPDATE_FRONT_END) {
    console.log("Updating front end");
    await updateContractAddresses();
    await updateAbi();
    console.log("Front end written!");
  }
};

async function updateAbi() {
  const lottery = await ethers.getContractAt(
    "Lottery",
    (await deployments.get("Lottery")).address
  );
  fs.writeFileSync(
    frontEndAbiFile,
    lottery.interface.format(ethers.utils.FormatTypes.json)
  );
}

async function updateContractAddresses() {
  const lottery = await ethers.getContractAt(
    "Lottery",
    (await deployments.get("Lottery")).address
  );
  const contractAddresses = JSON.parse(
    fs.readFileSync(frontEndAddressFile, "utf8")
  );
  const chainId = network.config.chainId.toString();

  if (chainId in contractAddresses) {
    if (!contractAddresses[chainId].includes(lottery.address)) {
      contractAddresses[chainId].push(lottery.address);
    }
  } else {
    contractAddresses[chainId] = [lottery.address];
  }
  fs.writeFileSync(frontEndAddressFile, JSON.stringify(contractAddresses));
}
module.exports.tags = ["all", "frontend"];
