import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        // Return sample learning paths data for demo
        const sampleData = [
            {
                id: 'lp-1',
                title: 'Master Docker & Containerization',
                description: 'Learn containerization from basics to advanced orchestration with practical hands-on projects.',
                category: 'DevOps',
                difficulty_level: 'intermediate',
                total_estimated_hours: 12,
                learning_goals: [
                    'Understand container fundamentals and benefits',
                    'Master Docker commands and image creation',
                    'Learn container orchestration basics',
                    'Deploy multi-container applications'
                ],
                success_criteria: [
                    'Build and deploy a multi-service application',
                    'Create custom Docker images with best practices',
                    'Set up container networking and volumes',
                    'Implement basic monitoring and logging'
                ],
                modules: [
                    {
                        id: 'mod-1',
                        title: 'Container Fundamentals',
                        type: 'conceptual',
                        description: 'Understanding what containers are and why they matter',
                        estimated_time_minutes: 120,
                        resources: [
                            {
                                id: 'res-1',
                                title: 'Introduction to Containers',
                                type: 'video',
                                url: 'https://example.com/video',
                                provider: 'Docker',
                                estimated_time_minutes: 30,
                                difficulty_level: 'beginner',
                                description: 'Basic introduction to containerization'
                            }
                        ],
                        learning_objectives: [
                            'Define what containers are',
                            'Explain container vs VM differences',
                            'Understand container use cases'
                        ]
                    },
                    {
                        id: 'mod-2',
                        title: 'Docker Basics Hands-on',
                        type: 'hands_on',
                        description: 'Practical Docker commands and operations',
                        estimated_time_minutes: 180,
                        resources: [
                            {
                                id: 'res-2',
                                title: 'Docker CLI Tutorial',
                                type: 'tutorial',
                                url: 'https://example.com/tutorial',
                                provider: 'Docker Docs',
                                estimated_time_minutes: 60,
                                difficulty_level: 'beginner',
                                description: 'Step-by-step Docker CLI guide'
                            }
                        ],
                        learning_objectives: [
                            'Run containers using Docker CLI',
                            'Build custom images',
                            'Manage container lifecycle'
                        ]
                    }
                ],
                prerequisites: ['Basic Linux knowledge', 'Command line familiarity'],
                tags: ['docker', 'containers', 'devops', 'infrastructure'],
                progress_percentage: 25,
                progress_status: 'in_progress'
            },
            {
                id: 'lp-2',
                title: 'CI/CD Pipeline Mastery',
                description: 'Build robust CI/CD pipelines using GitHub Actions and modern deployment strategies.',
                category: 'CI/CD',
                difficulty_level: 'advanced',
                total_estimated_hours: 16,
                learning_goals: [
                    'Design efficient CI/CD workflows',
                    'Implement automated testing strategies',
                    'Master deployment automation',
                    'Set up monitoring and rollback procedures'
                ],
                success_criteria: [
                    'Create a complete CI/CD pipeline',
                    'Implement automated testing and quality gates',
                    'Deploy to multiple environments',
                    'Set up monitoring and alerting'
                ],
                modules: [
                    {
                        id: 'mod-3',
                        title: 'CI/CD Principles',
                        type: 'conceptual',
                        description: 'Understanding continuous integration and deployment principles',
                        estimated_time_minutes: 90,
                        resources: [
                            {
                                id: 'res-3',
                                title: 'CI/CD Best Practices',
                                type: 'article',
                                url: 'https://example.com/article',
                                provider: 'GitHub',
                                estimated_time_minutes: 20,
                                difficulty_level: 'intermediate',
                                description: 'Best practices for CI/CD implementation'
                            }
                        ],
                        learning_objectives: [
                            'Understand CI/CD principles',
                            'Learn about different deployment strategies',
                            'Identify common CI/CD patterns'
                        ]
                    }
                ],
                prerequisites: ['Git knowledge', 'Basic DevOps understanding'],
                tags: ['ci-cd', 'github-actions', 'automation', 'deployment'],
                progress_percentage: 0,
                progress_status: 'not_started'
            }
        ];

        res.status(200).json(sampleData);
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
}
