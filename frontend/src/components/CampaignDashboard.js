import React from 'react';
import CreateCampaignForm from './CreateCampaignForm';
import CampaignList from './CampaignList';
import CampaignDetail from './CampaignDetail';

const CampaignDashboard = ({
  account,
  client,
  signAndExecute,
  campaigns,
  selectedCampaign,
  setSelectedCampaign,
  donationAmounts,
  handleAmountChange,
  donationMessages,
  setDonationMessages,
  donate,
  withdraw,
  formatSui,
  name, setName,
  description, setDescription,
  organizerName, setOrganizerName,
  goal, setGoal,
  duration, setDuration,
  createCampaign,
  isLoading,
  isError,
  profilesId,
}) => {
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
            donate={donate} account={account} withdraw={withdraw}
            formatSui={formatSui}
            profilesId={profilesId}
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
          signAndExecute={signAndExecute}
          profilesId={profilesId}
        />
      )}
    </div>
  );
};

export default CampaignDashboard;
