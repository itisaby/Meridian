import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { userId } = req.query;

    if (req.method === 'GET') {
        try {
            const response = await fetch(`http://localhost:8000/api/learning-paths/user/${userId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch learning paths');
            }

            const data = await response.json();
            res.status(200).json(data);
        } catch (error) {
            console.error('Error fetching learning paths:', error);
            res.status(500).json({ error: 'Failed to fetch learning paths' });
        }
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
}
