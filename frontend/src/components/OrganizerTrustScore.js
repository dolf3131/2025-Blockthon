import React from 'react';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '../config';

const OrganizerTrustScore = ({
  organizerAddress,
  profilesId,
}) => {
  const { data, isLoading, isError } = useSuiClientQuery(
    'devInspectTransactionBlock',
    {
      sender: organizerAddress,
      transactionBlock: {
        kind: 'MoveCall',
        target: `${PACKAGE_ID}::donation::get_organizer_trust_score`,
        arguments: [
          { kind: 'Input', index: 0 }, // profiles_obj
          { kind: 'Input', index: 1 }, // organizer_address
        ],
        typeArguments: [],
      },
      inputs: [
        { kind: 'Object', value: profilesId },
        { kind: 'Pure', value: organizerAddress, type: 'address' },
      ],
    },
    { enabled: !!organizerAddress && !!profilesId }
  );

  if (isLoading) return <p>Loading trust score...</p>;
  if (isError) return <p>Error loading trust score.</p>;

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

  return (
    <p>Trust Score: {trustScore.toFixed(2)}% ({successfulCampaigns}/{totalCampaigns} successful)</p>
  );
};

export default OrganizerTrustScore;
