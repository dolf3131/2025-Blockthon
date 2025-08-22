import React from 'react';
import OrganizerTrustScore from './OrganizerTrustScore';

const CampaignList = ({
  isLoading,
  isError,
  campaigns,
  setSelectedCampaign,
  donationAmounts,
  handleAmountChange,
  donationMessages,
  setDonationMessages,
  donate,
  account,
  withdraw,
  profilesId,
}) => {
  return (
    <div className="campaign-list">
      <h3>Active Campaigns</h3>
      {isLoading && <p>Loading campaigns...</p>}
      {isError && <p>Error loading campaigns.</p>}
      {campaigns.map((campaign) => (
        <div key={campaign.data.objectId} 
             className="campaign-card card"
             onClick={() => setSelectedCampaign(campaign)}>
          <h4>{campaign.data.content.fields.name} <span className={`status-indicator ${campaign.data.content.fields.active ? 'in-progress' : 'closed'}`}></span></h4>
          <p>{campaign.data.content.fields.description}</p>
          <p><b>Organizer:</b> {campaign.data.content.fields.organizer_name}</p>
          <OrganizerTrustScore organizerAddress={campaign.data.content.fields.beneficiary} profilesId={profilesId} />
          <hr />
          <p><b>Beneficiary:</b> {campaign.data.content.fields.beneficiary.slice(0, 6)}...{campaign.data.content.fields.beneficiary.slice(-4)}</p>
          <p><b>Goal:</b> {(campaign.data.content.fields.goal / 1_000_000_000).toFixed(3)} SUI</p>
          <p><b>Funded:</b> {(campaign.data.content.fields.donated_amount / 1_000_000_000).toFixed(3)} SUI</p>
          <p><b>Progress:</b> {((campaign.data.content.fields.donated_amount / campaign.data.content.fields.goal) * 100).toFixed(2)}%</p>
          <p><b>Status:</b> {campaign.data.content.fields.active ? 'In Progress' : 'Closed'}</p>
          
          <div className="button-group" onClick={(e) => e.stopPropagation()}> {/* Prevent card click when clicking buttons */}
            <input 
              type="number" 
              placeholder="Amount to fund (in SUI)"
              value={donationAmounts[campaign.data.objectId] || ''}
              onChange={(e) => handleAmountChange(campaign.data.objectId, e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Your message (optional)"
              value={donationMessages[campaign.data.objectId] || ''}
              onChange={(e) => setDonationMessages(prev => ({ ...prev, [campaign.data.objectId]: e.target.value }))}
            />
            <button onClick={() => donate(campaign.data.objectId, parseFloat(donationAmounts[campaign.data.objectId]) * 1_000_000_000, donationMessages[campaign.data.objectId] || '')}
                    disabled={!campaign.data.content.fields.active}>Fund</button>
          </div>

          {account.address === campaign.data.content.fields.beneficiary && campaign.data.content.fields.active && (
             <div className="button-group" onClick={(e) => e.stopPropagation()}> {/* Prevent card click */}
                <button className="withdraw-btn" onClick={() => withdraw(campaign.data.objectId)}>Withdraw</button>
             </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CampaignList;
