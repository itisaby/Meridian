// API route for repository operations
import { NextApiRequest, NextApiResponse } from 'next'

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { method } = req
    const { slug } = req.query
    
    try {
        let url = `${BACKEND_URL}/repositories/`
        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization || '',
            } as HeadersInit,
        }

        // Handle different repository endpoints
        console.log('API Debug:', { slug, isArray: Array.isArray(slug), type: typeof slug })
        
        if (slug && Array.isArray(slug)) {
            if (slug[0] === 'github' && slug[1] === 'repos') {
                url = `${BACKEND_URL}/repositories/github/repos`
            } else if (slug[0] === 'github' && !slug[1]) {
                // Handle /api/repositories/github -> /repositories/github/repos
                url = `${BACKEND_URL}/repositories/github/repos`
            } else if (slug[0] === 'sync') {
                url = `${BACKEND_URL}/repositories/github/sync`
            } else if (slug[1] === 'analyze') {
                url = `${BACKEND_URL}/repositories/${slug[0]}/analyze`
            } else {
                url = `${BACKEND_URL}/repositories/${slug[0]}`
            }
        } else if (slug && typeof slug === 'string') {
            if (slug === 'github') {
                // Handle /api/repositories/github -> /repositories/github/repos
                url = `${BACKEND_URL}/repositories/github/repos`
            } else {
                url = `${BACKEND_URL}/repositories/${slug}`
            }
        }
        
        console.log('Final URL:', url)

        if (method !== 'GET') {
            options.body = JSON.stringify(req.body)
        }

        const response = await fetch(url, options)
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
