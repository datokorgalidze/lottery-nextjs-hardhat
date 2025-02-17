const { network, getNamedAccounts, deployments, ethers } = require("hardhat");
const {
  developmentChains,
  networkConfig,
} = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Lottery Unit Tests", function () {
      let lottery, vrfCoordinatorV2Mock, deployer, raffleEntranceFee, interval;
      const chainId = network.config.chainId;

      beforeEach(async () => {
        // const namedAccounts = await getNamedAccounts();
        // deployer = await ethers.getSigner(namedAccounts.address);
        const accounts = await ethers.getSigners();
        deployer = accounts[0];
        await deployments.fixture(["mocks", "lottery"]);
        const lotteryDeployment = await deployments.get("Lottery");
        lottery = await ethers.getContractAt(
          lotteryDeployment.abi,
          lotteryDeployment.address,
          deployer
        );
        const VrfCoordinatorV2MockDeployment = await deployments.get(
          "VRFCoordinatorV2Mock"
        );

        vrfCoordinatorV2Mock = await ethers.getContractAt(
          VrfCoordinatorV2MockDeployment.abi,
          VrfCoordinatorV2MockDeployment.address,
          deployer
        );

        raffleEntranceFee = await lottery.getEntranceFee();
        interval = await lottery.getInterval();
      });
      describe("constractor", function () {
        it("initializes the lottery correctly", async () => {
          const raffleState = await lottery.getRaffleState();

          assert.equal(raffleState.toString(), "0");
          assert.equal(interval.toString(), networkConfig[chainId].interval);
        });
      });
      describe("entered Raffle", function () {
        it("reverts when you don't pay enough", async () => {
          await expect(lottery.enterRaffle()).to.be.revertedWith(
            "Lottery__SendMoreToEnterLottery"
          );
        });
        it("records players when they enter", async () => {
          await lottery.enterRaffle({ value: raffleEntranceFee });
          const playerFromContract = await lottery.getPlayer(0);
          assert.equal(playerFromContract, deployer.address);
        });
        it("emits event on entred", async () => {
          await expect(
            lottery.enterRaffle({ value: raffleEntranceFee })
          ).to.emit(lottery, "RaffleEnter");
        });
        it("doesn't allow entrance when lottery is calculating", async () => {
          await lottery.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await lottery.performUpkeep([]);
          await expect(
            lottery.enterRaffle({ value: raffleEntranceFee })
          ).to.be.revertedWith("Lottery__RaffleNotOpen");
        });
      });
      describe("checkUpkeep", function () {
        it("returns false if people haven't sent any ETH", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([]); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
          assert(!upkeepNeeded);
        });
        it("returns false if lottery isn't open", async () => {
          await lottery.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          await lottery.performUpkeep([]);
          const raffleState = await lottery.getRaffleState();
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x");
          assert.equal(raffleState.toString(), "1");
          assert.equal(upkeepNeeded, false);
        });
        it("returns false if enough time hasn't passed", async () => {
          await lottery.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() - 5,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x");
          assert(!upkeepNeeded);
        });
        it("returns true if enough time has passed, has players, eth, and is open", async () => {
          await lottery.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep("0x");
          assert(upkeepNeeded);
        });
      });

      describe("performUpkeep", function () {
        it("can only run if checkupkeep is true", async () => {
          await lottery.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const tx = await lottery.performUpkeep([]);
          assert(tx);
        });
        it("reverts if checkupkeep is false", async () => {
          await expect(lottery.performUpkeep([])).to.be.revertedWith(
            "Lottery__UpkeepNotNeeded"
          );
        });
        it("updates the lottery state and emits a requestId", async () => {
          await lottery.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
          const tx = await lottery.performUpkeep([]);
          const txReceipt = await tx.wait(1);
          const raffleState = await lottery.getRaffleState();
          const requestId = await txReceipt.events[1].args.requestId;
          assert(requestId.toNumber() > 0);
          assert(raffleState == 1);
        });
      });
      describe("fulfillRandomWord", function () {
        beforeEach(async () => {
          await lottery.enterRaffle({ value: raffleEntranceFee });
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ]);
          await network.provider.request({ method: "evm_mine", params: [] });
        });
        it("can only be called after performupkeep", async () => {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(0, lottery.address)
          ).to.be.revertedWith("nonexistent request");
        });
        it("can only be called after performupkeep", async () => {
          await expect(
            vrfCoordinatorV2Mock.fulfillRandomWords(1, lottery.address)
          ).to.be.revertedWith("nonexistent request");
        });

        it("picks a winner, resets, and sends money", async () => {
          const additionalEntrances = 3;
          const startingIndex = 1;
          let winnerStartingBalance;
          const accounts = await ethers.getSigners();

          for (
            i = startingIndex;
            i < startingIndex + additionalEntrances;
            i++
          ) {
            const accountConnected = lottery.connect(accounts[i]);
            await accountConnected.enterRaffle({ value: raffleEntranceFee });
          }

          const startingTimeStamp = await lottery.getLastTimestamp();

          await new Promise(async (resolve, reject) => {
            lottery.once("WinnerPicked", async () => {
              console.log("WinnerPicked event fired!");
              try {
                const recentWinner = await lottery.getsRecentWinner();
                console.log("winner is:", recentWinner);

                // console.log(accounts[1].address);
                // console.log(accounts[0].address);
                // console.log(accounts[2].address);
                // console.log(accounts[3].address);

                const raffleState = await lottery.getRaffleState();
                const numOfPlayers = await lottery.getNumberOfPlayers();
                const endingTimeStamp = await lottery.getLastTimestamp();
                const winnerEndingBalance = await accounts[1].getBalance();
                assert.equal(raffleState.toString(), "0");
                assert.equal(numOfPlayers.toString(), "0");
                assert.equal(recentWinner.toString(), accounts[1].address);
                assert.equal(
                  winnerEndingBalance.toString(),
                  winnerStartingBalance
                    .add(
                      raffleEntranceFee
                        .mul(additionalEntrances)
                        .add(raffleEntranceFee)
                    )
                    .toString()
                );
                assert(endingTimeStamp > startingTimeStamp);
              } catch (e) {
                reject(e);
              }
              resolve();
            });
            try {
              const tx = await lottery.performUpkeep([]);
              const txReceipt = await tx.wait(1);
              winnerStartingBalance = await accounts[1].getBalance();
              await vrfCoordinatorV2Mock.fulfillRandomWords(
                txReceipt.events[1].args.requestId,
                lottery.address
              );
            } catch (e) {
              reject(e);
            }
          });
        });
      });
    });
