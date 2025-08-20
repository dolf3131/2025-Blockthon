import React from 'react';
import Identicon from '../utils/identicon';

const NftModal = ({ nft, onClose }) => {
  if (!nft) return null;

  // Extract display properties, providing default values
  const name = nft.data?.display?.data?.name || 'Donation NFT';
  // Generate Identicon based on NFT objectId
  const identiconHash = nft.data.objectId; // Use objectId as hash
  const identiconOptions = {
    size: 200, // Set a reasonable size for the identicon
    format: 'svg',
    margin: 0.1,
    background: [240, 240, 240, 255], // Light gray background
    saturation: 0.7,
    brightness: 0.5
  };
  const identiconSvgBase64 = new Identicon(identiconHash, identiconOptions).toString();
  const imageUrl = `data:image/svg+xml;base64,${identiconSvgBase64}`;
  const description = nft.data?.display?.data?.description || 'Thank you for your generous donation!';

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Thank You for Your Donation!</h2>
        <p>You have received a commemorative NFT.</p>
        <div className="nft-card">
          <img src={imageUrl} alt={name} className="nft-image" />
          <h3>{name}</h3>
          <p>{description}</p>
          <p><b>Campaign:</b> {nft.data.content.fields.campaign_name}</p>
          <p><b>Amount:</b> {nft.data.content.fields.amount_donated / 1_000_000_000} SUI</p>
        </div>
      </div>
    </div>
  );
};

export default NftModal;
