import React, { useEffect, useState } from 'react';
import { useSuiClientQuery, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

const FundUsageReportSection = ({
  campaign,
  account,
  PACKAGE_ID,
  formatSui,
  signAndExecute,
  profilesId, // Added
}) => {
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [proofUrl, setProofUrl] = useState('');

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

  const submitReport = () => {
    if (!account || !reportTitle || !reportDescription) { // Removed spentAmount and remainingAmount check
      alert('Please fill out all required report fields (Title, Description).');
      return;
    }

    const txb = new Transaction();
    console.log("txb:", txb);
    console.log("txb.object:", txb.object);
    console.log("profilesId:", profilesId);
    txb.moveCall({
      target: `${PACKAGE_ID}::donation::submit_fund_usage_report`,
      arguments: [
        txb.object(profilesId),
        txb.object(campaign.data.objectId),
        txb.pure.string(reportTitle),
        txb.pure.string(reportDescription),
        txb.pure.u64(0), // spent_amount (placeholder)
        txb.pure.u64(0), // remaining_amount (placeholder)
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

  return (
    <div className="section-container">
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
              type="text" // Changed from number to text for URL
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
            <div key={index} className="report-item card">
              <h5>{report.parsedJson.report_title}</h5>
              <p><strong>Reporter:</strong> {report.parsedJson.reporter.slice(0, 6)}...{report.parsedJson.reporter.slice(-4)}</p>
              <p><strong>Description:</strong> {report.parsedJson.report_description}</p>
              {/* Removed Spent and Remaining display */}
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

export default FundUsageReportSection;