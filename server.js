const express = require('express');
const cors = require('cors');
const { XMLParser } = require('fast-xml-parser');

const app = express();
app.use(cors());
app.use(express.raw({ type: 'application/xml' }));
app.use(express.json());

app.get('/meteoalarm-webhook', (req, res) => {
  const challenge = req.query['hub.challenge'];
  res.send(challenge);
});

app.post('/meteoalarm-webhook', (req, res) => {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
  const xmlData = parser.parse(req.body);
  const warnings = parseMeteoalarmXML(xmlData);
  console.log('Parsed warnings:', warnings);
  res.status(200).send('OK');
});

app.get('/api/meteoalarm', async (req, res) => {
  // Return mock data or load from memory/db
  res.json(mockWarnings);
});

function parseMeteoalarmXML(xmlData) {
  const items = xmlData.rss?.channel?.item || [];
  return items.map(item => ({
    id: item.guid || item.title,
    title: item.title,
    description: item.description,
    severity: extractSeverity(item),
    type: extractType(item),
    startDate: item.pubDate,
    endDate: new Date(new Date(item.pubDate).getTime() + 6 * 3600000).toISOString(),
    regions: ['Unknown'],
    countryCode: 'EU',
    isActive: true
  }));
}

function extractSeverity(item) {
  const lower = item.title.toLowerCase();
  if (lower.includes('red')) return 'red';
  if (lower.includes('orange')) return 'orange';
  if (lower.includes('yellow')) return 'yellow';
  return 'general';
}

function extractType(item) {
  const lower = item.title.toLowerCase();
  if (lower.includes('thunder')) return 'thunderstorm';
  if (lower.includes('snow')) return 'snow';
  if (lower.includes('wind')) return 'wind';
  if (lower.includes('rain')) return 'rain';
  if (lower.includes('fog')) return 'fog';
  return 'general';
}

const mockWarnings = []; // You can use an array to store warnings temporarily

app.listen(process.env.PORT || 3000, () => console.log('Server running'));
