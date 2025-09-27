import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        // Forward the request to the backend
        const backendResponse = await fetch('http://localhost:8000/ai/test-suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization || ''
            },
            body: JSON.stringify(req.body)
        })

        const data = await backendResponse.json()

        if (!backendResponse.ok) {
            return res.status(backendResponse.status).json(data)
        }

        res.status(200).json(data)
    } catch (error) {
        console.error('Error proxying AI request:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}
