import { useEffect, useState } from 'react';
import { useSuiClientQuery } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '../config';

export const useCampaignEvents = (account, client) => {
  const [campaigns, setCampaigns] = useState([]);

  const { data: eventData, isLoading, isError, refetch } = useSuiClientQuery(
    'queryEvents',
    {
      query: { MoveEventType: `${PACKAGE_ID}::donation::CampaignCreated` },
      order: 'descending',
    },
    { enabled: !!account }
  );

  useEffect(() => {
    if (!eventData) return;

    const campaignIds = eventData.data.map(event => event.parsedJson.campaign_id);
    if (campaignIds.length === 0) {
        setCampaigns([]);
        return;
    };

    client.multiGetObjects({
      ids: campaignIds,
      options: { showContent: true },
    }).then(objects => {
      setCampaigns(objects.filter(obj => obj.data));
    });
  }, [eventData, client]);

  return {
    campaigns, isLoading, isError, refetchCampaigns: refetch, setCampaigns
  };
};
