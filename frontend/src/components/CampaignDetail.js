import React, { useEffect, useState } from 'react';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import FundUsageReportSection from './FundUsageReportSection';
import OrganizerTrustScore from './OrganizerTrustScore';

const CampaignDetail = ({
  campaign,
  setSelectedCampaign,
  account,
  donate,
  withdraw,
  donationAmounts,
  handleAmountChange,
  donationMessages,
  setDonationMessages,
  PACKAGE_ID,
  formatSui,
  signAndExecute,
  profilesId,
}) => {
  
  const [groupedMessages, setGroupedMessages] = useState({});

  const progress = campaign.data.content.fields.goal > 0
    ? (campaign.data.content.fields.donated_amount / campaign.data.content.fields.goal) * 100
    : 0;

  // Query Donated events for this specific campaign
  const { data: donatedEventData, isLoading: isLoadingDonatedEvents, isError: isErrorDonatedEvents } = useSuiClientQuery(
    'queryEvents',
    {
      query: {
        MoveEventType: `${PACKAGE_ID}::donation::Donated`,
      },
      order: 'ascending',
    },
    { enabled: !!campaign.data.objectId }
  );

  useEffect(() => {
    if (!donatedEventData || !donatedEventData.data) {
      setGroupedMessages({});
      return;
    }

    const filteredEvents = donatedEventData.data.filter(event => event.parsedJson.campaign_id === campaign.data.objectId);

    const newMessages = [];
    filteredEvents.forEach(event => {
      const sender = event.sender;
      const timestamp = new Date(parseInt(event.timestampMs)).toLocaleString();
      const message = event.parsedJson.message;
      const amount = event.parsedJson.amount;
      newMessages.push({ sender, timestamp, message, amount });
    });

    newMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by most recent

    setGroupedMessages(newMessages.reduce((acc, msg) => {
        if (!acc[msg.sender]) {
            acc[msg.sender] = { sender: msg.sender, messages: [] };
        }
        acc[msg.sender].messages.push(msg);
        return acc;
    }, {}));
  }, [donatedEventData, campaign.data.objectId]);

  return (
    <div className="campaign-detail card">
      <button className="back-button" onClick={() => setSelectedCampaign(null)}>Back to Campaigns</button>
      <h3>{campaign.data.content.fields.name} <span className={`status-indicator ${campaign.data.content.fields.active ? 'in-progress' : 'closed'}`}></span></h3>
      <p><b>Description:</b> {campaign.data.content.fields.description}</p>
      <p><b>Organizer:</b> {campaign.data.content.fields.organizer_name}</p>
      <p><b>Beneficiary:</b> {campaign.data.content.fields.beneficiary}</p>
      <OrganizerTrustScore organizerAddress={campaign.data.content.fields.beneficiary} profilesId={profilesId} />
      <p><b>Goal:</b> {formatSui(campaign.data.content.fields.goal)}</p>
      <p><b>Deadline:</b> {new Date(Number(campaign.data.content.fields.deadline)).toLocaleString()}</p>
      <p><b>Donated:</b> {formatSui(campaign.data.content.fields.donated_amount)}</p>
      <p><b>Platform Fee:</b> 5% on withdrawal</p>
      <p><b>Progress:</b> {progress.toFixed(2)}%</p>
      <p><b>Status:</b> {campaign.data.content.fields.active ? 'In Progress' : 'Closed'}</p>

      <hr />

      <h4>Fund this Campaign</h4>
      <div className="button-group">
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
         <div className="button-group">
            <button className="withdraw-btn" onClick={() => withdraw(campaign.data.objectId)}>Withdraw</button>
         </div>
      )}

      <div className="content-sections">
        <div className="section-container">
          <div className="message-list">
            <h4>Funder Messages</h4>
            {isLoadingDonatedEvents && <p>Loading messages...</p>}
            {isErrorDonatedEvents && <p>Error loading messages.</p>}
            {Object.values(groupedMessages).flatMap(group => group.messages).length > 0 ? (
              Object.values(groupedMessages).flatMap(group => group.messages).map((msg, msgIndex) => (
                <div key={msgIndex} className="message-item">
                  <p><strong>From:</strong> {msg.sender.slice(0, 6)}...{msg.sender.slice(-4)}</p>
                  <p><strong>Amount:</strong> {formatSui(msg.amount)}</p>
                  <p><strong>Message:</strong> {msg.message}</p>
                  <p className="timestamp">{msg.timestamp}</p>
                </div>
              ))
            ) : (
              !isLoadingDonatedEvents && <p>No messages yet.</p>
            )}
          </div>
        </div>

        <FundUsageReportSection
          campaign={campaign}
          account={account}
          PACKAGE_ID={PACKAGE_ID}
          formatSui={formatSui}
          signAndExecute={signAndExecute}
        />
      </div>
    </div>
  );
};

export default CampaignDetail;