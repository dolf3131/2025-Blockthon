import React from 'react';
import CreateCampaignForm from './CreateCampaignForm';
import CampaignList from './CampaignList';
import CampaignDetail from './CampaignDetail';
import { PACKAGE_ID } from '../config';

const Home = ({ 
  account, 
  client, 
  signAndExecute, 
  selectedCampaign, 
  setSelectedCampaign, 
  profilesId, 
  campaignEvents, 
  campaignManagement 
}) => {
  const { campaigns, isLoading, isError } = campaignEvents;
  const {
    name, setName,
    description, setDescription,
    goal, setGoal,
    duration, setDuration,
    organizerName, setOrganizerName,
    donationAmounts, 
    donationMessages, setDonationMessages,
    createCampaign,
    donate,
    withdraw,
    handleAmountChange,
    formatSui,
    setModalNft,
    setIsModalOpen
  } = campaignManagement;

  return (
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
            donate={donate}
            account={account} 
            withdraw={withdraw}
            formatSui={formatSui}
            profilesId={profilesId}
          />
        </>
      ) : (
        <CampaignDetail 
          campaign={selectedCampaign} setSelectedCampaign={setSelectedCampaign}
          account={account} 
          donate={donate}
          withdraw={withdraw}
          donationAmounts={donationAmounts} handleAmountChange={handleAmountChange}
          donationMessages={donationMessages} setDonationMessages={setDonationMessages}
          PACKAGE_ID={PACKAGE_ID}
          formatSui={formatSui}
          signAndExecute={signAndExecute}
          profilesId={profilesId}
        />
      )}
    </div>
  );
}

export default Home;
