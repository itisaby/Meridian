import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    const { repo } = req.query

    if (!repo || typeof repo !== 'string') {
        return res.status(400).json({ error: 'Repository full name is required' })
    }

    try {
        // Forward the request to the backend
        const backendResponse = await fetch(`http://localhost:8000/ai/analysis-history/${encodeURIComponent(repo)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization || ''
            }
        })

        const data = await backendResponse.json()

        if (backendResponse.ok) {
            res.status(200).json(data)
        } else {
            res.status(backendResponse.status).json(data)
        }
    } catch (error) {
        console.error('Error fetching analysis history:', error)
        res.status(500).json({ error: 'Failed to fetch analysis history' })
    }
}
