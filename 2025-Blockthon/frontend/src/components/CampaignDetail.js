import React, { useEffect, useState } from 'react';
import { useSuiClientQuery } from '@mysten/dapp-kit';

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
        MoveEventField: {
          path: 'campaign_id',
          value: campaign.data.objectId,
        },
      },
      order: 'ascending',
    },
    { enabled: !!campaign.data.objectId }
  );

  useEffect(() => {
    console.log("donatedEventData:", donatedEventData);

    if (!donatedEventData || !donatedEventData.data) {
      setGroupedMessages({});
      return;
    }

    console.log("All events for this event type:", donatedEventData.data);

    const filteredEvents = donatedEventData.data.filter(event => event.parsedJson.campaign_id === campaign.data.objectId);
    console.log("Filtered events for this campaign:", filteredEvents);
    console.log("Current campaign ID:", campaign.data.objectId);

    const newGroupedMessages = {};
    filteredEvents.forEach(event => {
      const sender = event.sender;
      const timestamp = new Date(parseInt(event.timestampMs)).toLocaleString();
      const message = event.parsedJson.message;
      const amount = event.parsedJson.amount;

      if (!newGroupedMessages[sender]) {
        newGroupedMessages[sender] = {
          sender: sender,
          messages: [],
        };
      }
      newGroupedMessages[sender].messages.push({ timestamp, message, amount });
    });

    for (const sender in newGroupedMessages) {
      newGroupedMessages[sender].messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    setGroupedMessages(newGroupedMessages);
  }, [donatedEventData, campaign.data.objectId]);

  return (
    <div className="campaign-detail card">
      <button className="back-button" onClick={() => setSelectedCampaign(null)}>Back to Campaigns</button>
      <h3>{campaign.data.content.fields.name} <span className={`status-indicator ${campaign.data.content.fields.active ? 'in-progress' : 'closed'}`}></span></h3>
      <p><b>Description:</b> {campaign.data.content.fields.description}</p>
      <p><b>Organizer:</b> {campaign.data.content.fields.organizer_name}</p>
      <p><b>Beneficiary:</b> {campaign.data.content.fields.beneficiary}</p>
      <p><b>Goal:</b> {formatSui(campaign.data.content.fields.goal)}</p>
      <p><b>Deadline:</b> {new Date(Number(campaign.data.content.fields.deadline)).toLocaleString()}</p>
      <p><b>Donated:</b> {formatSui(campaign.data.content.fields.donated_amount)}</p>
      <p><b>Platform Fee:</b> 5% on withdrawal</p>
      <p><b>Progress:</b> {progress.toFixed(2)}%</p>
      <p><b>Status:</b> {campaign.data.content.fields.active ? 'In Progress' : 'Closed'}</p>

      <hr />

      <h4>Donate to this Campaign</h4>
      <div className="button-group">
        <input 
          type="number" 
          placeholder="Amount to donate (in SUI)"
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
                disabled={!campaign.data.content.fields.active}>Donate</button>
      </div>

      {account.address === campaign.data.content.fields.beneficiary && campaign.data.content.fields.active && (
         <div className="button-group">
            <button className="withdraw-btn" onClick={() => withdraw(campaign.data.objectId)}>Withdraw</button>
         </div>
      )}

      <div className="message-list">
        <h4>Donor Messages</h4>
        {isLoadingDonatedEvents && <p>Loading messages...</p>}
        {isErrorDonatedEvents && <p>Error loading messages.</p>}
        {Object.keys(groupedMessages).length > 0 ? (
          Object.keys(groupedMessages).map((sender) => (
            <div key={sender} className="message-group">
              <p><span className="sender">From: {groupedMessages[sender].sender.slice(0, 6)}...{groupedMessages[sender].sender.slice(-4)}</span></p>
              {groupedMessages[sender].messages.map((msg, msgIndex) => (
                <div key={msgIndex} className="message-item">
                  <p>Amount: {formatSui(msg.amount)}</p>
                  <p>Message: {msg.message}</p>
                  <p className="timestamp">{msg.timestamp}</p>
                </div>
              ))}
            </div>
          ))
        ) : (
          !isLoadingDonatedEvents && <p>No messages yet.</p>
        )}
      </div>
    </div>
  );
};

export default CampaignDetail;
