import React, { useState, useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID } from '../config';
import { getSuiMoveConfig } from '@mysten/sui/client';

const generateIdenticonSvg = (hash, size = 200) => {
  // Ensure hash is a string and long enough
  hash = String(hash || '').padEnd(15, '0'); // Pad with '0' if too short

  const colors = [];
  for (let i = 0; i < 3; i++) {
    colors.push(parseInt(hash.substring(i * 2, i * 2 + 2), 16));
  }
  const foregroundColor = `rgb(${colors[0]}, ${colors[1]}, ${colors[2]})`;
  const backgroundColor = `rgb(240, 240, 240)`; // Light gray

  const data = [];
  for (let i = 0; i < 5; i++) {
    data[i] = [];
    for (let j = 0; j < 5; j++) {
      data[i][j] = 0;
    }
  }

  // Center column
  for (let i = 0; i < 5; i++) {
    if (parseInt(hash.charAt(i), 16) % 2 === 0) {
      data[2][i] = 1;
    }
  }

  // Side columns (symmetric)
  for (let i = 0; i < 5; i++) {
    if (parseInt(hash.charAt(i + 5), 16) % 2 === 0) {
      data[1][i] = 1;
      data[3][i] = 1;
    }
  }

  // Outer columns (symmetric)
  for (let i = 0; i < 5; i++) {
    if (parseInt(hash.charAt(i + 10), 16) % 2 === 0) {
      data[0][i] = 1;
      data[4][i] = 1;
    }
  }

  const blockSize = size / 5;
  let svgRects = '';

  // Background
  svgRects += `<rect x="0" y="0" width="${size}" height="${size}" fill="${backgroundColor}" />`;

  // Grid
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      if (data[i][j]) {
        svgRects += `<rect x="${i * blockSize}" y="${j * blockSize}" width="${blockSize}" height="${blockSize}" fill="${foregroundColor}" />`;
      }
    }
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${svgRects}</svg>`;
};

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
                    nfts.map(nft => {
                        const identiconHash = nft.data.objectId || 'default_fallback_hash_for_identicon';
                        const svgString = generateIdenticonSvg(identiconHash, 100); // Smaller size for profile
                        const imageUrl = `data:image/svg+xml;base64,${btoa(svgString)}`;
                        const donationTime = new Date(Number(nft.data.content.fields.timestamp_ms)).toLocaleString();

                        return (
                            <div key={nft.data.objectId} className="nft-card-profile">
                                <img src={imageUrl} alt="NFT Identicon" className="nft-image-small" />
                                <h4>{nft.data.content.fields.campaign_name}</h4>
                                <p>Amount Funded: {(Number(nft.data.content.fields.amount_donated) / 1_000_000_000).toFixed(3)} SUI</p>
                                <p>Donation Time: {donationTime}</p>
                            </div>
                        );
                    })
                ) : (
                    <p>You don't own any NFTs yet.</p>
                )}
            </div>
        </div>
    );
};

export default Profile;