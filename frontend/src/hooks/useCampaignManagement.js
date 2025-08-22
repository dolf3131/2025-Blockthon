import { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, PROFILES_OBJECT_ID } from '../config';

export const useCampaignManagement = (account, client, signAndExecute, refetchCampaigns) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [donationAmounts, setDonationAmounts] = useState({});
  const [donationMessages, setDonationMessages] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNft, setModalNft] = useState(null);

  const executeTransaction = (txb, onSuccessCallback) => {
    console.log("Executing signAndExecute...");
    signAndExecute(
      { transaction: txb },
      {
        onSuccess: (result) => {
          console.log('signAndExecute onSuccess triggered.', result);
          setTimeout(() => {
            client.getTransactionBlock({
              digest: result.digest,
              options: {
                showEffects: true,
              },
            }).then(txbResponse => {
              console.log('getTransactionBlock successful:', txbResponse);
              if (onSuccessCallback) {
                onSuccessCallback(txbResponse);
              } else {
                alert('Transaction successful!');
              }
            });
          }, 2000);

          setTimeout(() => {
            refetchCampaigns();
          }, 2000);
        },
        onError: (error) => {
          console.error('signAndExecute onError triggered:', error);
          alert(`Error: ${error.message}`);
        },
      }
    );
  };

  const createCampaign = () => {
    if (!account || !name || !description || !organizerName || !goal || !duration) {
      alert("Please fill out all fields.");
      return;
    }
    const txb = new Transaction();
    try {
      const goalAmount = parseFloat(goal) * 1_000_000_000;
      if (isNaN(goalAmount) || goalAmount <= 0) {
        alert("Please enter a valid goal amount.");
        return;
      }

      const now = new Date();
      const deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate() + parseInt(duration, 10), 23, 59, 59, 999);

      txb.moveCall({
        target: `${PACKAGE_ID}::donation::create_campaign`,
        arguments: [
            txb.object(PROFILES_OBJECT_ID),
            txb.pure.string(name),
            txb.pure.string(description),
            txb.pure.string(organizerName),
            txb.pure.address(account.address),
            txb.pure.u64(goalAmount),
            txb.pure.u64(deadline.getTime())
        ],
      });
      console.log("Calling executeTransaction from createCampaign...");
      executeTransaction(txb);
      setName("");
      setDescription("");
      setOrganizerName("");
      setDuration("");
      setGoal("");
    } catch (error) {
      console.error("Error during transaction building in createCampaign:", error);
      alert(`Error building transaction: ${error.message}`);
    }
  };

  const donate = (campaignId, amount, message) => {
    console.log("Donate function called.");
    if (!account || !amount) return;
    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }
    const txb = new Transaction();
    const [splitCoin] = txb.splitCoins(txb.gas, [txb.pure.u64(parsedAmount)]);

    txb.moveCall({
      target: `${PACKAGE_ID}::donation::donate`,
      arguments: [
          txb.object(PROFILES_OBJECT_ID),
          txb.object(campaignId),
          splitCoin,
          txb.pure.string(message),
          txb.object('0x6')
      ],
    });

    console.log("Calling executeTransaction from donate...");
    executeTransaction(txb, (txbResponse) => {
      console.log("txbResponse.effects?.created:", txbResponse.effects?.created);
      const createdNft = txbResponse.effects?.created?.find(e => {
        return e.owner.AddressOwner?.trim().toLowerCase() === account.address.trim().toLowerCase();
      });
      console.log("createdNft after find:", createdNft);

      if (createdNft) {
        client.getObject({
          id: createdNft.reference.objectId,
          options: { showContent: true, showDisplay: true },
        }).then(nftDetails => {
          console.log("nftDetails after fetch:", nftDetails);
          console.log("nftDetails.data?.type:", nftDetails.data?.content?.type);
          if (nftDetails.data?.content?.type === `${PACKAGE_ID}::donation::DonationNFT`) {
             setModalNft(nftDetails);
             setIsModalOpen(true);
          }
        });
      } else {
        // Fallback alert if NFT is not found in effects for any reason
        alert('Funding successful! A commemorative NFT has been sent to your wallet.');
      }

      // After successful donation, refetch the specific campaign object
      client.getObject({
        id: campaignId,
        options: { showContent: true },
      }).then(updatedCampaignObject => {
        if (updatedCampaignObject.data) {
          refetchCampaigns(prevCampaigns =>
            prevCampaigns.map(campaign =>
              campaign.data.objectId === campaignId
                ? updatedCampaignObject // Replace with the updated object
                : campaign
            )
          );
        }
      });
    });
  };

  const withdraw = (campaignId) => {
    if (!account) return;
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::donation::withdraw`,
      arguments: [txb.object(PROFILES_OBJECT_ID), txb.object(campaignId)],
    });
    console.log("Calling executeTransaction from withdraw...");
    executeTransaction(txb);
  };

  const handleAmountChange = (id, value) => {
    setDonationAmounts(prev => ({ ...prev, [id]: value }));
  }

  const formatSui = (mistAmount) => {
    const suiAmount = mistAmount / 1_000_000_000;
    return `${suiAmount.toFixed(3)} SUI`;
  };

  return {
    name, setName,
    description, setDescription,
    goal, setGoal,
    duration, setDuration,
    organizerName, setOrganizerName,
    donationAmounts, setDonationAmounts,
    donationMessages, setDonationMessages,
    isModalOpen, setIsModalOpen,
    modalNft, setModalNft,
    createCampaign,
    donate,
    withdraw,
    handleAmountChange,
    formatSui,
  };
};
