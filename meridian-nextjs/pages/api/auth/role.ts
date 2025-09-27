// Next.js API route to proxy role updates to the backend
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ error: 'Method not allowed' })
    }

    try {
        // Get Authorization header from request
        const authHeader = req.headers.authorization

        if (!authHeader) {
            return res.status(401).json({ error: 'Authorization header required' })
        }

        const { role } = req.body

        if (!role) {
            return res.status(400).json({ error: 'Role is required' })
        }

        // Forward the request to the backend with the same authorization
        const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({ role })
        })

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json()
            return res.status(backendResponse.status).json(errorData)
        }

        const result = await backendResponse.json()
        return res.status(200).json(result)

    } catch (error) {
        console.error('Role update API error:', error)
        return res.status(500).json({ error: 'Internal server error' })
    }
}
