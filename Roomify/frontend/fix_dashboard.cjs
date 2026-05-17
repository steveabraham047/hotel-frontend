const fs = require('fs');
const path = 'src/pages/Dashboard.tsx';
let c = fs.readFileSync(path, 'utf8');

c = c.replace(
  "fetch(`${API_BASE_URL}/api/analytics/charts`, { headers: { 'Authorization': `Bearer ${token}` } })",
  "fetch(`${API_BASE_URL}/api/analytics/charts`, { headers: { 'Authorization': `Bearer ${token}` } }),\n        fetch(`${API_BASE_URL}/api/analytics/insights`, { headers: { 'Authorization': `Bearer ${token}` } })"
);

c = c.replace(
  "if (chartsRes.ok) setChartData(await chartsRes.json());",
  "if (chartsRes.ok) setChartData(await chartsRes.json());\n      if (insightsRes?.ok) setInsights(await insightsRes.json());"
);

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed fetch!');
