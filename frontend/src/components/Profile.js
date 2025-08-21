import React, { useState, useEffect } from 'react';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';

const Profile = ({ client }) => {
    const account = useCurrentAccount();
    const { mutate: signAndExecute } = useSignAndExecuteTransaction();
    const [nfts, setNfts] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const getProfile = async () => {
        if (!account || !client) return;
        setLoading(true);
        try {
            const ownedObjects = await client.getOwnedObjects({
                owner: account.address,
                filter: {
                    StructType: `0x58d13c3315659e0448a051d57dc5794e68f00c3c09a8092dad42dc8c9f5f6f84::donation_system::UserProfile`
                },
                options: {
                    showContent: true,
                }
            });

            if (ownedObjects.data.length > 0) {
                const profileObject = ownedObjects.data[0];
                setProfile(profileObject);
                const nftIds = profileObject.data.content.fields.nfts;
                if (nftIds.length > 0) {
                    const nftObjects = await client.multiGetObjects({
                        ids: nftIds.map(nft => nft.fields.nft_id),
                        options: {
                            showContent: true,
                        }
                    });
                    setNfts(nftObjects);
                }
            } else {
                setProfile(null);
                setNfts([]);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getProfile();
    }, [account, client]);

    const createProfile = () => {
        if (!account) return;
        const txb = new Transaction();
        txb.moveCall({
            target: `0x58d13c3315659e0448a051d57dc5794e68f00c3c09a8092dad42dc8c9f5f6f84::donation_system::create_user_profile`,
            arguments: [],
        });

        signAndExecute(
            {
                transaction: txb,
                options: {
                    showEffects: true,
                },
            },
            {
                onSuccess: (result) => {
                    console.log('Profile created successfully', result);
                    alert('Profile created successfully! Please refresh the page.');
                    getProfile();
                },
                onError: (error) => {
                    console.error('Error creating profile:', error);
                    alert('Error creating profile.');
                },
            }
        );
    };

    if (!account) {
        return <div>Please connect your wallet to view your profile.</div>;
    }

    if (loading) {
        return <div>Loading profile...</div>;
    }

    if (!profile) {
        return (
            <div>
                <p>No profile found for your address.</p>
                <button onClick={createProfile}>Create Profile</button>
            </div>
        );
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
                            <p>Amount Donated: {nft.data.content.fields.amount_donated} SUI</p>
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