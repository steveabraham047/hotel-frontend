const fs = require('fs');
const path = 'src/pages/RestaurantPOS.tsx';
let c = fs.readFileSync(path, 'utf8');
const lines = c.split('\n');

// Find ALL return ( lines and pick the LAST one (the main return)
const returnLines = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'return (' || lines[i].trim() === 'return (\\r') {
    returnLines.push(i);
  }
}
console.log('All return lines:', returnLines.map(i => i+1));

// The last return is the main return
const mainIdx = returnLines[returnLines.length - 1];
console.log('Main return at index:', mainIdx, '(line', mainIdx+1, ')');
console.log('That line raw:', JSON.stringify(lines[mainIdx]));
console.log('Next line:', JSON.stringify(lines[mainIdx+1]));
console.log('Line after:', JSON.stringify(lines[mainIdx+2]));
