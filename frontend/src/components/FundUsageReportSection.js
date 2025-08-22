import React, { useEffect, useState } from 'react';
import { useSuiClientQuery } from '@mysten/dapp-kit';

const FundUsageReportSection = ({
  campaign,
  PACKAGE_ID,
  formatSui,
}) => {
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

  const [groupedMessages, setGroupedMessages] = useState({});

  useEffect(() => {
    if (!fundUsageReportData || !fundUsageReportData.data) {
      setGroupedMessages({});
      return;
    }

    const filteredEvents = fundUsageReportData.data.filter(event => event.parsedJson.campaign_id === campaign.data.objectId);

    const newMessages = [];
    filteredEvents.forEach(event => {
      const sender = event.sender;
      const timestamp = new Date(parseInt(event.timestampMs)).toLocaleString();
      const reportTitle = event.parsedJson.report_title; // Use report_title
      const reportDescription = event.parsedJson.report_description; // Use report_description
      const proofUrl = event.parsedJson.proof_url; // Use proof_url
      newMessages.push({ sender, timestamp, reportTitle, reportDescription, proofUrl }); // Updated fields
    });

    newMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by most recent

    setGroupedMessages(newMessages.reduce((acc, msg) => {
        if (!acc[msg.sender]) {
            acc[msg.sender] = { sender: msg.sender, messages: [] };
        }
        acc[msg.sender].messages.push(msg);
        return acc;
    }, {}));
  }, [fundUsageReportData, campaign.data.objectId]);


  return (
    <div className="fund-usage-reports-list card"> {/* Changed class and added card */}
      <h4>Fund Usage Reports</h4>
      {isLoadingFundUsageReports && <p>Loading fund usage reports...</p>}
      {isErrorFundUsageReports && <p>Error loading fund usage reports.</p>}
      {fundUsageReportData && fundUsageReportData.data.length > 0 ? (
          fundUsageReportData.data.filter(event => event.parsedJson.campaign_id === campaign.data.objectId).map((report, index) => (
            <div key={index} className="report-item card">
              <h5>{report.reportTitle}</h5> {/* Use reportTitle */}
              <p><strong>Reporter:</strong> {report.sender.slice(0, 6)}...{report.sender.slice(-4)}</p>
              <p><strong>Description:</strong> {report.reportDescription}</p> {/* Use reportDescription */}
              {report.proofUrl && <p><strong>Proof:</strong> <a href={report.proofUrl} target="_blank" rel="noopener noreferrer">{report.proofUrl}</a></p>} {/* Use proofUrl */}
              <p className="timestamp">{report.timestamp}</p>
            </div>
          ))
        ) : (
          !isLoadingFundUsageReports && <p>No fund usage reports yet.</p>
        )}
    </div>
  );
};

export default FundUsageReportSection;
