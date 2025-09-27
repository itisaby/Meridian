import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { pathId } = req.query;

    if (req.method === 'POST') {
        try {
            const response = await fetch(`http://localhost:8000/api/learning-paths/${pathId}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(req.body),
            });

            if (!response.ok) {
                throw new Error('Failed to start learning path');
            }

            const data = await response.json();
            res.status(200).json(data);
        } catch (error) {
            console.error('Error starting learning path:', error);
            res.status(500).json({ error: 'Failed to start learning path' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
}
