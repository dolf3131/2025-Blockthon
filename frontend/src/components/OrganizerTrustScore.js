import React from 'react';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '../config';
import { Transaction } from '@mysten/sui/transactions';

const OrganizerTrustScore = ({
  organizerAddress,
  profilesId,
}) => {
  console.log("OrganizerTrustScore: organizerAddress", organizerAddress);
  console.log("OrganizerTrustScore: profilesId", profilesId);

  const { data, isLoading, isError, error } = useSuiClientQuery(
    'devInspectTransactionBlock',
    {
      sender: organizerAddress,
      transactionBlock: new TransactionBlock().moveCall({
        target: `${PACKAGE_ID}::donation::get_organizer_trust_score`,
        arguments: [
          new TransactionBlock().object(profilesId),
          new TransactionBlock().pure.address(organizerAddress),
        ],
      }),
    },
    { enabled: !!organizerAddress && !!profilesId }
  );

  console.log("OrganizerTrustScore: isLoading", isLoading);
  console.log("OrganizerTrustScore: isError", isError);
  console.log("OrganizerTrustScore: error object", error);
  console.log("OrganizerTrustScore: data", data);

  if (isLoading) return <p>Loading trust score...</p>;
  if (isError) return <p>Error loading trust score. Details: {error?.message}</p>;

  let successfulCampaigns = 0;
  let totalCampaigns = 0;

  if (data && data.results && data.results[0] && data.results[0].returnValues) {
    // The result is a tuple (u64, u64)
    // successful_campaigns is the first u64
    // total_campaigns_created is the second u64
    successfulCampaigns = parseInt(data.results[0].returnValues[0][0]);
    totalCampaigns = parseInt(data.results[0].returnValues[1][0]);
  }

  const trustScore = totalCampaigns > 0 ? (successfulCampaigns / totalCampaigns) * 100 : 0;

  if (totalCampaigns === 0) {
    return <p>Trust Score: Unknown</p>;
  }

  return (
    <p>Trust Score: {trustScore.toFixed(2)}% ({successfulCampaigns}/{totalCampaigns} successful)</p>
  );
};

export default OrganizerTrustScore;
