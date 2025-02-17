# **Lottery Smart Contract**

![App](./nextjs_lottery_client/img/readme-app.png)

## **Overview**

This project is a **decentralized lottery application** built using **Solidity, Hardhat, Chainlink VRF, and Chainlink Keepers**, with a **Next.js frontend**. The smart contract allows users to participate in a lottery, and a random winner is selected automatically using Chainlink's **Verifiable Random Function (VRF)**.

## **Features**

- 🎟️ **Enter the Lottery** by paying an entrance fee.
- 🎲 **Fair Random Winner Selection** powered by **Chainlink VRF v2**.
- ⏳ **Automated Execution** using **Chainlink Keepers**.
- 💰 **Secure Prize Distribution** to the winner.
- 🌐 **Frontend Integration** with **Next.js & Moralis**.

## **Technologies Used**

### **Backend (Smart Contract & Hardhat)**

- **Solidity 0.8.27**
- **Hardhat** for development & testing
- **Chainlink VRF v2** for randomness
- **Chainlink Keepers** for automation
- **Ethers.js** for contract interaction

### **Frontend**

- **Next.js** for UI
- **React-Moralis** for Web3 interactions
- **web3uikit** for notifications
- **Ethers.js** for smart contract interactions

## **Smart Contract Breakdown**

### **Lottery.sol** (Smart Contract)

The **Lottery contract**:

1. Allows users to enter the lottery by sending **ETH**.
2. Uses **Chainlink Keepers** to check if conditions for selecting a winner are met.
3. Calls **Chainlink VRF** to get a **verifiable random winner**.
4. Transfers the lottery funds to the winner and resets for the next round.

#### **Main Functions**

| Function               | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `enterRaffle()`        | Allows users to enter the lottery                                 |
| `checkUpkeep()`        | Chainlink Keepers function to check if winner selection is needed |
| `performUpkeep()`      | Triggers the winner selection process                             |
| `fulfillRandomWords()` | Chainlink VRF function to pick a random winner                    |

## Quickstart

```bash
git clone https://github.com/datokorgalidze/lottery-nextjs-hardhat.git

```

## **Frontend Usage**

Navigate to the `frontend/` directory and start the Next.js application:

```sh
cd nextjs_lottery_client
npm install
npm run dev
```

Visit `http://localhost:3000` to interact with the lottery.

## **Deployment & Setup**

### **1. Install Dependencies**

```sh
   cd hardhat_smartcontract_lottery
   npm install
```

### 2. Satart Local hardhat

```sh
   npx hardhat node
```

### **3. Compile & Deploy Contract**

```sh
npx hardhat compile
npx hardhat deploy --network localhost
```

### 4. Random Winner

```sh
   npx hardhat run scripts/mockOfChain.js --network localhost
```

## **Testing**

Run unit tests using:

```sh
npx hardhat test
```

# Deployment to a testnet or mainnet

### **1. Set Up Environment Variables**

Create a `.env` file and add:

```
PRIVATE_KEY=your_wallet_private_key
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY
```

2. Setup a Chainlink VRF Subscription ID

Head over to [vrf.chain.link](https://vrf.chain.link/) and setup a new subscription, and get a subscriptionId. You can reuse an old subscription if you already have one.

[You can follow the instructions](https://docs.chain.link/docs/get-a-random-number/) if you get lost. You should leave this step with:

1. A subscription ID
2. Your subscription should be funded with LINK
3. Deploy

In your `helper-hardhat-config.js` add your `subscriptionId` under the section of the chainId you're using (aka, if you're deploying to sepolia, add your `subscriptionId` in the `subscriptionId` field under the `11155111` section.)

Then run:

```sh
  npx hardhat deploy --network sepolia
```

And copy / remember the contract address.

3. Add your contract address as a Chainlink VRF Consumer

Go back to [vrf.chain.link](https://vrf.chain.link) and under your subscription add `Add consumer` and add your contract address. You should also fund the contract with a minimum of 1 LINK.

4. Register a Chainlink Keepers Upkeep

[You can follow the documentation if you get lost.](https://docs.chain.link/docs/chainlink-keepers/compatible-contracts/)

1. Enter your raffle!

Your contract is now setup to be a tamper proof autonomous verifiably random lottery. Enter the lottery by running:

```sh
  npx hardhat run scripts/enter.js --network sepolia
```

## **Future Enhancements**

✅ Add **multiple winners** per round  
✅ Implement **VRF v2 Direct Funding**  
✅ Introduce **NFT rewards** for participants

## **Contributors**

👨‍💻 **David Korgalidze**  
🔗 [LinkedIn](https://www.linkedin.com/in/dato-korgalidze/)  
📍 Blockchain & Smart Contract Developer

⭐ **If you find this project helpful, give it a star!** 🚀
