// API route for repositories
import { NextApiRequest, NextApiResponse } from 'next'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        const response = await fetch(`${BACKEND_URL}/repositories/`, {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization || '',
            },
            ...(req.method !== 'GET' && { body: JSON.stringify(req.body) })
        })

        const data = await response.json()

        if (response.ok) {
            res.status(200).json(data)
        } else {
            res.status(response.status).json(data)
        }
    } catch (error) {
        console.error('API route error:', error)
        res.status(500).json({ error: 'Internal server error' })
    }
}
