import React from 'react';

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

const NftModal = ({ nft, onClose }) => {
  if (!nft) return null;

  // Extract display properties, providing default values
  const name = nft.data?.display?.data?.name || 'Donation NFT';
  const identiconHash = nft.data.objectId || 'default_fallback_hash_for_identicon'; // Use objectId as hash, or a fallback
  const svgString = generateIdenticonSvg(identiconHash, 200); // Generate SVG string
  const imageUrl = `data:image/svg+xml;base64,${btoa(svgString)}`; // Base64 encode the SVG string
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
