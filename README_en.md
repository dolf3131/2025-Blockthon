# Decentralized Donation Platform on Sui

## Overview

This project is a decentralized donation platform operating on the Sui blockchain. Anyone can create their own donation campaign, and users can donate SUI tokens to other campaigns. The entire process is handled transparently through smart contracts, and donors receive a commemorative NFT as proof of their contribution.

## Features

- **Create Campaigns**: Anyone can create their own donation campaign and start fundraising.
- **Campaign List**: View a list of all ongoing campaigns and track their progress.
- **Donate with SUI**: Users can connect their Sui wallet to donate SUI to any campaign.
- **Commemorative NFTs**: Participants who donate receive a unique NFT as a token of their contribution.
- **Withdraw Funds**: Campaign creators can securely withdraw the collected funds from the smart contract once the goal is met.

## Tech Stack

- **Backend**:
  - Blockchain: Sui
  - Smart Contract Language: Sui Move
- **Frontend**:
  - Library/Framework: React.js
  - Sui Wallet Integration: `@mysten/dapp-kit`

## Project Structure

```
/
├── backend/      # Code related to the Sui Move smart contract
│   ├── sources/  # Contract source code (donation_system.move)
│   └── tests/    # Contract test code
└── frontend/     # React-based frontend dApp
    ├── src/
    └── ...
```

## Getting Started

### Backend (Smart Contract)

1.  Navigate to the `backend` directory.
2.  If necessary, set up the `sui client` and verify your address.
3.  Run the tests:
    ```bash
    sui move test
    ```
4.  Publish the contract:
    ```bash
    sui client publish
    ```

### Frontend (dApp)

1.  Navigate to the `frontend` directory.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the application:
    ```bash
    npm start
    ```
