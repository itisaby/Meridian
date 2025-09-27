import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        // Forward the request to the backend
        const backendResponse = await fetch('http://localhost:8000/ai/user-analyses', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization || ''
            }
        })

        const data = await backendResponse.json()

        if (!backendResponse.ok) {
            return res.status(backendResponse.status).json(data)
        }

        res.status(200).json(data)
    } catch (error) {
        console.error('Error fetching user analyses:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}
