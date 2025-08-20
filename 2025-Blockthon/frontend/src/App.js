import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient, useSuiClientQuery } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useEffect, useState } from 'react';
import './App.css';

import CreateCampaignForm from './components/CreateCampaignForm';
import CampaignList from './components/CampaignList';
import CampaignDetail from './components/CampaignDetail';
import NftModal from './components/NftModal'; // Import the modal component

const PACKAGE_ID = "0x7b54f003f2e4aa84a0962346bc5a47ea05bf91dd7eb4f7f4394e2ca5707abb86";

function App() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [donationAmounts, setDonationAmounts] = useState({});
  const [donationMessages, setDonationMessages] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // State for the NFT modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalNft, setModalNft] = useState(null);

  const { data: eventData, isLoading, isError, refetch } = useSuiClientQuery(
    'queryEvents',
    {
      query: { MoveEventType: `${PACKAGE_ID}::donation::CampaignCreated` },
      order: 'descending',
    },
    { enabled: !!account }
  );

  useEffect(() => {
    if (!eventData) return;

    const campaignIds = eventData.data.map(event => event.parsedJson.campaign_id);
    if (campaignIds.length === 0) {
        setCampaigns([]);
        return;
    };

    client.multiGetObjects({
      ids: campaignIds,
      options: { showContent: true },
    }).then(objects => {
      setCampaigns(objects.filter(obj => obj.data));
    });
  }, [eventData, client]);

  const executeTransaction = (txb, onSuccessCallback) => {
    signAndExecute(
      {
        transaction: txb,
        options: {
          showEffects: true, // Request the effects object
        },
      },
      {
        onSuccess: (result) => {
          console.log('Transaction successful:', result);
          if (onSuccessCallback) {
            onSuccessCallback(result);
          } else {
            alert('Transaction successful!');
          }
          setTimeout(() => {
            refetch();
          }, 2000);
        },
        onError: (error) => {
          console.error('Transaction error:', error);
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
            txb.pure.string(name),
            txb.pure.string(description),
            txb.pure.string(organizerName),
            txb.pure.address(account.address),
            txb.pure.u64(goalAmount),
            txb.pure.u64(deadline.getTime())
        ],
      });
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
          txb.object(campaignId),
          splitCoin,
          txb.pure.string(message),
          txb.object('0x6')
      ],
    });

    executeTransaction(txb, (result) => {
      // Now result.effects should be a proper object
      const createdNft = result.effects?.created?.find(e => e.owner.AddressOwner === account.address);
      if (createdNft) {
        client.getObject({
          id: createdNft.reference.objectId,
          options: { showContent: true, showDisplay: true },
        }).then(nftDetails => {
          if (nftDetails.data?.type === `${PACKAGE_ID}::donation::DonationNFT`) {
             setModalNft(nftDetails);
             setIsModalOpen(true);
          }
        });
      } else {
        // Fallback alert if NFT is not found in effects for any reason
        alert('Donation successful! A commemorative NFT has been sent to your wallet.');
      }
    });
  };

  const withdraw = (campaignId) => {
    if (!account) return;
    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::donation::withdraw`,
      arguments: [txb.object(campaignId)],
    });
    executeTransaction(txb);
  };

  const handleAmountChange = (id, value) => {
    setDonationAmounts(prev => ({ ...prev, [id]: value }));
  }

  const formatSui = (mistAmount) => {
    const suiAmount = mistAmount / 1_000_000_000;
    return `${suiAmount.toFixed(3)} SUI`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Sui Donation dApp</h1>
        <ConnectButton />
      </header>
      <main>
        {account ? (
          <div>
            <h2>Welcome, {account.address.slice(0, 6)}...{account.address.slice(-4)}</h2>
            
            {!selectedCampaign ? (
              <>
                <CreateCampaignForm 
                  name={name} setName={setName}
                  description={description} setDescription={setDescription}
                  organizerName={organizerName} setOrganizerName={setOrganizerName}
                  goal={goal} setGoal={setGoal}
                  duration={duration} setDuration={setDuration}
                  createCampaign={createCampaign}
                />

                <CampaignList 
                  isLoading={isLoading} isError={isError} campaigns={campaigns}
                  setSelectedCampaign={setSelectedCampaign}
                  donationAmounts={donationAmounts} handleAmountChange={handleAmountChange}
                  donationMessages={donationMessages} setDonationMessages={setDonationMessages}
                  donate={donate} account={account} withdraw={withdraw}
                  formatSui={formatSui}
                />
              </>
            ) : (
              <CampaignDetail 
                campaign={selectedCampaign} setSelectedCampaign={setSelectedCampaign}
                account={account} donate={donate} withdraw={withdraw}
                donationAmounts={donationAmounts} handleAmountChange={handleAmountChange}
                donationMessages={donationMessages} setDonationMessages={setDonationMessages}
                PACKAGE_ID={PACKAGE_ID}
                formatSui={formatSui}
              />
            )}
          </div>
        ) : (
          <p>Please connect your wallet to continue.</p>
        )}
      </main>

      {isModalOpen && modalNft && (
        <NftModal
          nft={modalNft}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
