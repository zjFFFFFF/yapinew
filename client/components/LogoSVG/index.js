import React from 'react';
import PropTypes from 'prop-types';

const LogoSVG = props => {
  const length = props.length;
  return (
    <svg className="svg" width={length} height={length} viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{stopColor: '#9C27B0', stopOpacity: 1}} />
          <stop offset="100%" style={{stopColor: '#673AB7', stopOpacity: 1}} />
        </linearGradient>
      </defs>
      {/* Background Container */}
      <rect x="0" y="0" width="100" height="100" rx="24" ry="24" fill="url(#logoGrad)" />
      
      {/* The Y Shape (White) */}
      <path 
        d="M50 58 L50 82 M50 58 L28 28 M50 58 L72 28" 
        stroke="#FFFFFF" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />
      <circle cx="28" cy="28" r="6" fill="#FFFFFF" />
      <circle cx="72" cy="28" r="6" fill="#FFFFFF" />
      <circle cx="50" cy="58" r="6" fill="#FFFFFF" />
      <circle cx="50" cy="82" r="6" fill="#FFFFFF" />
    </svg>
  );
};

LogoSVG.propTypes = {
  length: PropTypes.any
};

export default LogoSVG;
