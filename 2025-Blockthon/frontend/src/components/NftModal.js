import React from 'react';

const NftModal = ({ nft, onClose }) => {
  if (!nft) return null;

  // Extract display properties, providing default values
  const name = nft.data?.display?.data?.name || 'Donation NFT';
  const imageUrl = nft.data?.display?.data?.image_url || 'https://via.placeholder.com/300'; // Placeholder image
  const description = nft.data?.display?.data?.description || 'Thank you for your generous donation!';

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h2>Thank You for Your Donation!</h2>
        <p>You have received a commemorative NFT.</p>
        <div className="nft-card">
          {imageUrl.startsWith('data:image/svg+xml;base64,') ? (
            <div
              className="nft-image"
              dangerouslySetInnerHTML={{
                __html: atob(imageUrl.substring(imageUrl.indexOf(',') + 1)),
              }}
              style={{ width: '200px', height: '200px' }} // Explicitly set size for SVG
            />
          ) : (
            <img src={imageUrl} alt={name} className="nft-image" />
          )}
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
