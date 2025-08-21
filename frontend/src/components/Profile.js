import React, { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID } from '../config';
import { getSuiMoveConfig } from '@mysten/sui/client';

const Profile = ({ client, profilesId }) => {
    const account = useCurrentAccount();
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(true);

    const getProfileNfts = async () => {
        if (!account || !client || !profilesId) return;
        setLoading(true);
        try {
            const tx = new Transaction();
            tx.moveCall({
                target: `${PACKAGE_ID}::donation::get_user_nfts`,
                arguments: [tx.object(profilesId), tx.pure.address(account.address)],
            });

            const res = await client.devInspectTransactionBlock({
                sender: account.address,
                transactionBlock: tx,
            });

            console.log('DevInspect Result:', JSON.stringify(res, null, 2));

            if (res.results && res.results[0]) {
                const rawBytes = res.results[0].returnValues[0][0];
                // Manually parse the vector<address> (ULEB128 length + 32-byte addresses)
                let offset = 0;
                let length = 0;
                let sh = 0;
                while (true) {
                    const byte = rawBytes[offset++];
                    length |= (byte & 0x7f) << sh;
                    if ((byte & 0x80) === 0) {
                        break;
                    }
                    sh += 7;
                }

                const nftIds = [];
                for (let i = 0; i < length; i++) {
                    const addressBytes = rawBytes.slice(offset, offset + 32);
                    nftIds.push('0x' + Array.from(addressBytes).map(b => b.toString(16).padStart(2, '0')).join(''));
                    offset += 32;
                }
                console.log('Deserialized NFT IDs:', nftIds);

                if (nftIds.length > 0) {
                    const nftObjects = [];
                    for (const nftId of nftIds) {
                        const nftObject = await client.getObject({
                            id: nftId,
                            options: {
                                showContent: true,
                            }
                        });
                        nftObjects.push(nftObject);
                    }
                    console.log('Fetched NFT Objects:', nftObjects);
                    setNfts(nftObjects);
                } else {
                    setNfts([]);
                }
            }
        } catch (error) {
            console.error('Error fetching profile nfts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getProfileNfts();
    }, [account, client, profilesId]);


    if (!account) {
        return <div>Please connect your wallet to view your profile.</div>;
    }

    if (loading) {
        return <div>Loading profile...</div>;
    }

    return (
        <div className="profile-page">
            <h2>User Profile</h2>
            <div className="card">
                <p><strong>Address:</strong> {account.address}</p>
            </div>

            <h3>My NFTs</h3>
            <div className="nft-list">
                {nfts.length > 0 ? (
                    nfts.map(nft => (
                        <div key={nft.data.objectId} className="nft-card-profile">
                            <h4>{nft.data.content.fields.campaign_name}</h4>
                            <p>Amount Funded: {nft.data.content.fields.amount_donated} SUI</p>
                        </div>
                    ))
                ) : (
                    <p>You don't own any NFTs yet.</p>
                )}
            </div>
        </div>
    );
};

export default Profile;