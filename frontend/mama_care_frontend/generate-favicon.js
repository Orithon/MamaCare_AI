const fs = require('fs');

const svgContent = `
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="256" height="256" rx="64" fill="url(#grad)" />
  <g transform="translate(56, 56) scale(6)">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  </g>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
      <stop stop-color="#C0392B" />
      <stop offset="1" stop-color="#E74C3C" />
    </linearGradient>
  </defs>
</svg>
`;

fs.writeFileSync('public/favicon.svg', svgContent.trim());
console.log('Saved public/favicon.svg');
