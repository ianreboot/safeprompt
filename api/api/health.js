export default function handler(req, res) {
  const { method } = req;

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.status(200).json({
    status: 'healthy',
    service: 'SafePrompt API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0'
  });
}// Deploy trigger Thu Sep 25 04:09:05 UTC 2025
