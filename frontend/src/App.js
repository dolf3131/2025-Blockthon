import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

import Home from './components/Home';
import NftModal from './components/NftModal'; // Import the modal component
import Profile from './components/Profile';

import { PROFILES_OBJECT_ID } from './config';
import { useCampaignManagement } from './hooks/useCampaignManagement';
import { useCampaignEvents } from './hooks/useCampaignEvents';

function App() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [profilesId, setProfilesId] = useState(PROFILES_OBJECT_ID);

  const campaignEvents = useCampaignEvents(account, client);
  const campaignManagement = useCampaignManagement(account, client, signAndExecute, campaignEvents.refetchCampaigns);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Sui Crowdfunding dApp</h1>
          <nav>
            <Link to="/">Home</Link>
            <Link to="/profile">My Profile</Link>
          </nav>
          <ConnectButton />
        </header>
        <main>
          {account ? (
            <Routes>
              <Route path="/" element={<Home 
                account={account}
                client={client}
                signAndExecute={signAndExecute}
                selectedCampaign={selectedCampaign}
                setSelectedCampaign={setSelectedCampaign}
                profilesId={profilesId}
                campaignEvents={campaignEvents}
                campaignManagement={campaignManagement}
              />} />
              <Route path="/profile" element={<Profile client={client} profilesId={profilesId} setSelectedCampaign={setSelectedCampaign} />} />
            </Routes>
          ) : (
            <p>Please connect your wallet to continue.</p>
          )}
        </main>

        {campaignManagement.isModalOpen && campaignManagement.modalNft && (
          <NftModal
            nft={campaignManagement.modalNft}
            onClose={() => campaignManagement.setIsModalOpen(false)}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
