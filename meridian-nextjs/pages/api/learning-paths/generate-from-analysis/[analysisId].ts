import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { analysisId } = req.query;

    if (req.method === 'POST') {
        try {
            // For now, let's make this work without authentication
            // TODO: Add proper authentication later
            const response = await fetch(`http://localhost:8000/learning-paths/generate-from-analysis/${analysisId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    // TODO: Add Authorization header when auth is properly set up
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Backend error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            res.status(200).json(data);
        } catch (error) {
            console.error('Error generating learning paths from analysis:', error);
            res.status(500).json({
                error: 'Failed to generate learning paths',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
}
