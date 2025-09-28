import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const response = await fetch(`http://localhost:8000/learning-paths/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header if available
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
        },
        body: JSON.stringify(req.body),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create learning goal');
      }
      
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error creating learning goal:', error);
      res.status(500).json({ error: 'Failed to create learning goal' });
    }
  } else if (req.method === 'GET') {
    try {
      const { userId } = req.query;
      const response = await fetch(`http://localhost:8000/learning-paths/goals?user_id=${userId}`, {
        headers: {
          'Content-Type': 'application/json',
          // Add authentication header if available
          ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch learning goals');
      }
      
      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('Error fetching learning goals:', error);
      res.status(500).json({ error: 'Failed to fetch learning goals' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}