import React, { useEffect, useState } from 'react';
import { useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

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

  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [spentAmount, setSpentAmount] = useState('');
  const [remainingAmount, setRemainingAmount] = useState('');
  const [proofUrl, setProofUrl] = useState('');

  const submitReport = () => {
    if (!account || !reportTitle || !reportDescription || spentAmount === '' || remainingAmount === '') {
      alert('Please fill out all report fields.');
      return;
    }

    const txb = new Transaction();
    txb.moveCall({
      target: `${PACKAGE_ID}::donation::submit_fund_usage_report`,
      arguments: [
        txb.object(campaign.data.objectId),
        txb.pure.string(reportTitle),
        txb.pure.string(reportDescription),
        txb.pure.u64(parseFloat(spentAmount) * 1_000_000_000),
        txb.pure.u64(parseFloat(remainingAmount) * 1_000_000_000),
        txb.pure.string(proofUrl),
        txb.object('0x6') // Clock object
      ],
    });

    signAndExecute(
      { transaction: txb },
      {
        onSuccess: (result) => {
          alert('Fund usage report submitted successfully!');
          // Clear form
          setReportTitle('');
          setReportDescription('');
          setSpentAmount('');
          setRemainingAmount('');
          setProofUrl('');
          // Refetch reports
          refetchFundUsageReports();
        },
        onError: (error) => {
          console.error('Error submitting report:', error);
          alert(`Error submitting report: ${error.message}`);
        },
      }
    );
  };

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

  // Query FundUsageReported events for this specific campaign
  const { data: fundUsageReportData, isLoading: isLoadingFundUsageReports, isError: isErrorFundUsageReports, refetch: refetchFundUsageReports } = useSuiClientQuery(
    'queryEvents',
    {
      query: {
        MoveEventType: `${PACKAGE_ID}::donation::FundUsageReported`,
      },
      order: 'descending',
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

      {account.address === campaign.data.content.fields.beneficiary && (
        <div className="fund-usage-report-section">
          <h4>Submit Fund Usage Report</h4>
          <div className="button-group">
            <input
              type="text"
              placeholder="Report Title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
            />
            <textarea
              placeholder="Report Description (how funds were used)"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
            ></textarea>
            <input
              type="number"
              placeholder="Amount Spent (in SUI)"
              value={spentAmount}
              onChange={(e) => setSpentAmount(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount Remaining (in SUI)"
              value={remainingAmount}
              onChange={(e) => setRemainingAmount(e.target.value)}
            />
            <input
              type="text"
              placeholder="Proof URL (optional)"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
            />
            <button onClick={submitReport}>Submit Report</button>
          </div>
        </div>
      )}

      <div className="fund-usage-reports-list">
        <h4>Fund Usage Reports</h4>
        {isLoadingFundUsageReports && <p>Loading fund usage reports...</p>}
        {isErrorFundUsageReports && <p>Error loading fund usage reports.</p>}
        {fundUsageReportData && fundUsageReportData.data.length > 0 ? (
          fundUsageReportData.data.filter(event => event.parsedJson.campaign_id === campaign.data.objectId).map((report, index) => (
            <div key={index} className="report-item">
              <h5>{report.parsedJson.report_title}</h5>
              <p><strong>Reporter:</strong> {report.parsedJson.reporter.slice(0, 6)}...{report.parsedJson.reporter.slice(-4)}</p>
              <p><strong>Description:</strong> {report.parsedJson.report_description}</p>
              <p><strong>Spent:</strong> {formatSui(report.parsedJson.spent_amount)}</p>
              <p><strong>Remaining:</strong> {formatSui(report.parsedJson.remaining_amount)}</p>
              {report.parsedJson.proof_url && <p><strong>Proof:</strong> <a href={report.parsedJson.proof_url} target="_blank" rel="noopener noreferrer">{report.parsedJson.proof_url}</a></p>}
              <p className="timestamp">{new Date(parseInt(report.timestampMs)).toLocaleString()}</p>
            </div>
          ))
        ) : (
          !isLoadingFundUsageReports && <p>No fund usage reports yet.</p>
        )}
    {account.address === campaign.data.content.fields.beneficiary && (
        <div className="fund-usage-report-section">
          <h4>Submit Fund Usage Report</h4>
          <div className="button-group">
            <input
              type="text"
              placeholder="Report Title"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
            />
            <textarea
              placeholder="Report Description (how funds were used)"
              value={reportDescription}
              onChange={(e) => setReportDescription(e.target.value)}
            ></textarea>
            <input
              type="number"
              placeholder="Amount Spent (in SUI)"
              value={spentAmount}
              onChange={(e) => setSpentAmount(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount Remaining (in SUI)"
              value={remainingAmount}
              onChange={(e) => setRemainingAmount(e.target.value)}
            />
            <input
              type="text"
              placeholder="Proof URL (optional)"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
            />
            <button onClick={submitReport}>Submit Report</button>
          </div>
        </div>
      )}

      <div className="fund-usage-reports-list">
        <h4>Fund Usage Reports</h4>
        {isLoadingFundUsageReports && <p>Loading fund usage reports...</p>}
        {isErrorFundUsageReports && <p>Error loading fund usage reports.</p>}
        {fundUsageReportData && fundUsageReportData.data.length > 0 ? (
          fundUsageReportData.data.filter(event => event.parsedJson.campaign_id === campaign.data.objectId).map((report, index) => (
            <div key={index} className="report-item">
              <h5>{report.parsedJson.report_title}</h5>
              <p><strong>Reporter:</strong> {report.parsedJson.reporter.slice(0, 6)}...{report.parsedJson.reporter.slice(-4)}</p>
              <p><strong>Description:</strong> {report.parsedJson.report_description}</p>
              <p><strong>Spent:</strong> {formatSui(report.parsedJson.spent_amount)}</p>
              <p><strong>Remaining:</strong> {formatSui(report.parsedJson.remaining_amount)}</p>
              {report.parsedJson.proof_url && <p><strong>Proof:</strong> <a href={report.parsedJson.proof_url} target="_blank" rel="noopener noreferrer">{report.parsedJson.proof_url}</a></p>}
              <p className="timestamp">{new Date(parseInt(report.timestampMs)).toLocaleString()}</p>
            </div>
          ))
        ) : (
          !isLoadingFundUsageReports && <p>No fund usage reports yet.</p>
        )}
      </div>
    </div>
  );
};

export default CampaignDetail;
