import { useState, useEffect } from 'react'
import { apiClient } from '../../lib/api'

const SKILL_CATEGORIES = [
    'programming', 'devops', 'cloud', 'database', 'frontend',
    'backend', 'mobile', 'ai_ml', 'cybersecurity', 'testing', 'other'
]

const POPULAR_SKILLS = [
    // Programming Languages
    'JavaScript', 'Python', 'Java', 'C#', 'TypeScript', 'Go', 'Rust', 'C++', 'PHP', 'Ruby',
    'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB', 'C', 'Objective-C', 'Perl', 'Haskell', 'Dart',

    // Frontend Technologies  
    'React', 'Angular', 'Vue.js', 'HTML5', 'CSS3', 'SASS/SCSS', 'Bootstrap', 'Tailwind CSS',
    'jQuery', 'Redux', 'Next.js', 'Nuxt.js', 'Svelte', 'Webpack', 'Vite', 'Parcel',

    // Backend Technologies
    'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot', 'ASP.NET Core', 'Ruby on Rails',
    'Laravel', 'FastAPI', 'NestJS', 'Koa.js', 'Phoenix', 'Gin', 'Fiber',

    // Databases
    'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'Cassandra',
    'DynamoDB', 'Firebase', 'Elasticsearch', 'InfluxDB', 'Neo4j', 'CouchDB',

    // Cloud & DevOps
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Jenkins', 'GitLab CI/CD',
    'GitHub Actions', 'Terraform', 'Ansible', 'Chef', 'Puppet', 'Nagios', 'Prometheus',
    'Grafana', 'ELK Stack', 'Datadog', 'New Relic',

    // Mobile Development
    'React Native', 'Flutter', 'iOS Development', 'Android Development', 'Xamarin', 'Ionic',
    'Unity', 'Unreal Engine', 'ARKit', 'ARCore',

    // AI/ML & Data Science
    'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Matplotlib', 'Jupyter',
    'Apache Spark', 'Hadoop', 'Kafka', 'Airflow', 'MLflow', 'Kubeflow', 'OpenCV',

    // Tools & Others
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Jira', 'Confluence', 'Slack', 'VS Code',
    'IntelliJ IDEA', 'Eclipse', 'Vim', 'Emacs', 'Postman', 'Insomnia', 'Figma', 'Adobe XD'
]

const PROFICIENCY_LEVELS = [
    { value: 1, label: 'Beginner', description: 'Just starting out' },
    { value: 2, label: 'Basic', description: 'Some experience' },
    { value: 3, label: 'Intermediate', description: 'Comfortable with concepts' },
    { value: 4, label: 'Advanced', description: 'Highly skilled' },
    { value: 5, label: 'Expert', description: 'Master level' }
]

export default function ProfileForm({ onSuccess, onCancel, initialData = null, userType = 'student' }) {
    const [loading, setLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(1)
    const isEditMode = initialData !== null

    const [formData, setFormData] = useState({
        // Basic Info
        user_type: userType,
        first_name: initialData?.first_name || '',
        last_name: initialData?.last_name || '',
        bio: initialData?.bio || '',
        location: initialData?.location || '',
        github_username: initialData?.github_username || '',
        linkedin_url: initialData?.linkedin_url || '',
        portfolio_url: initialData?.portfolio_url || '',

        // Skills
        skills: initialData?.skills || [],

        // Learning Goals
        learning_goals: initialData?.learning_goals || []
    })

    const [newSkill, setNewSkill] = useState({
        name: '',
        category: 'programming',
        proficiency_level: 1,
        years_experience: '',
        is_learning: false
    })

    const [newGoal, setNewGoal] = useState({
        title: '',
        description: '',
        category: 'skill',
        priority: 'medium',
        target_date: ''
    })

    // Update form data when initialData changes
    useEffect(() => {
        if (initialData) {
            const newFormData = {
                user_type: userType,
                first_name: initialData.first_name || '',
                last_name: initialData.last_name || '',
                bio: initialData.bio || '',
                location: initialData.location || '',
                github_username: initialData.github_username || '',
                linkedin_url: initialData.linkedin_url || '',
                portfolio_url: initialData.portfolio_url || '',
                skills: initialData.skills || [],
                learning_goals: initialData.learning_goals || []
            }
            setFormData(newFormData)
        }
    }, [initialData, userType])

    const updateFormData = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const addSkill = () => {
        if (!newSkill.name.trim()) return

        const skill = {
            ...newSkill,
            years_experience: newSkill.years_experience ? parseFloat(newSkill.years_experience) : null,
            id: Date.now() // Temporary ID for frontend
        }

        setFormData(prev => ({
            ...prev,
            skills: [...prev.skills, skill]
        }))

        setNewSkill({
            name: '',
            category: 'programming',
            proficiency_level: 1,
            years_experience: '',
            is_learning: false
        })
    }

    const removeSkill = (index) => {
        setFormData(prev => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index)
        }))
    }

    const addLearningGoal = () => {
        if (!newGoal.title.trim()) return

        const goal = {
            ...newGoal,
            target_date: newGoal.target_date || null,
            id: Date.now() // Temporary ID for frontend
        }

        setFormData(prev => ({
            ...prev,
            learning_goals: [...prev.learning_goals, goal]
        }))

        setNewGoal({
            title: '',
            description: '',
            category: 'skill',
            priority: 'medium',
            target_date: ''
        })
    }

    const removeLearningGoal = (index) => {
        setFormData(prev => ({
            ...prev,
            learning_goals: prev.learning_goals.filter((_, i) => i !== index)
        }))
    }

    const handleSubmit = async () => {
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
            alert('Please fill in your first and last name')
            return
        }

        setLoading(true)
        try {
            // Create or update profile
            const profileData = {
                user_type: formData.user_type,
                first_name: formData.first_name,
                last_name: formData.last_name,
                bio: formData.bio,
                location: formData.location,
                github_username: formData.github_username,
                linkedin_url: formData.linkedin_url,
                portfolio_url: formData.portfolio_url
            }

            let profileResponse
            if (initialData) {
                profileResponse = await apiClient.updateProfile(profileData)
            } else {
                profileResponse = await apiClient.createProfile(profileData)
            }

            if (!profileResponse.success) {
                throw new Error(profileResponse.error || 'Failed to save profile')
            }

            // Add skills
            for (const skill of formData.skills) {
                if (!skill.id || skill.id > 1000000) { // New skill (temporary ID)
                    await apiClient.addSkill({
                        name: skill.name,
                        category: skill.category,
                        proficiency_level: skill.proficiency_level,
                        years_experience: skill.years_experience,
                        is_learning: skill.is_learning
                    })
                }
            }

            // Add learning goals
            for (const goal of formData.learning_goals) {
                if (!goal.id || goal.id > 1000000) { // New goal (temporary ID)
                    // Convert date to datetime format for API
                    let target_date = goal.target_date
                    if (target_date && !target_date.includes('T')) {
                        target_date = `${target_date}T23:59:59`
                    }

                    await apiClient.createLearningGoal({
                        title: goal.title,
                        description: goal.description,
                        category: goal.category,
                        priority: goal.priority,
                        target_date: target_date
                    })
                }
            }

            onSuccess && onSuccess()
        } catch (error) {
            console.error('Error saving profile:', error)
            alert(error.message || 'Failed to save profile')
        } finally {
            setLoading(false)
        }
    }

    const nextStep = () => {
        if (currentStep < 3) setCurrentStep(currentStep + 1)
    }

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    return (
        <div className="max-w-2xl mx-auto bg-dark-200 rounded-lg p-8">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
                {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors cursor-pointer ${currentStep >= step
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-dark-100 text-gray-400 hover:bg-dark-300'
                                } ${isEditMode ? 'hover:bg-primary-600' : ''}`}
                            onClick={() => isEditMode ? setCurrentStep(step) : null}
                            title={isEditMode ? `Jump to step ${step}` : ''}
                        >
                            {step}
                        </div>
                        {step < 3 && (
                            <div className={`w-16 h-1 mx-2 transition-colors ${currentStep > step
                                    ? 'bg-primary-500'
                                    : 'bg-dark-100'
                                }`}></div>
                        )}
                    </div>
                ))}
            </div>

            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                    {currentStep === 1 && (isEditMode ? 'Update Basic Information' : 'Basic Information')}
                    {currentStep === 2 && (isEditMode ? 'Manage Your Skills' : 'Your Skills')}
                    {currentStep === 3 && (isEditMode ? 'Update Learning Goals' : 'Learning Goals')}
                </h2>
                <p className="text-gray-400">
                    {currentStep === 1 && (isEditMode ? 'Update your profile information' : 'Tell us about yourself')}
                    {currentStep === 2 && (isEditMode ? 'Add, edit or remove your skills' : 'What technologies do you know?')}
                    {currentStep === 3 && (isEditMode ? 'Modify your learning objectives' : 'What do you want to learn?')}
                </p>
            </div>

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                First Name *
                            </label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => updateFormData('first_name', e.target.value)}
                                className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                                placeholder="John"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => updateFormData('last_name', e.target.value)}
                                className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                                placeholder="Doe"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Bio
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => updateFormData('bio', e.target.value)}
                            className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                            placeholder="Tell us about yourself..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Location
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => updateFormData('location', e.target.value)}
                            className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                            placeholder="San Francisco, CA"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                GitHub Username
                            </label>
                            <input
                                type="text"
                                value={formData.github_username}
                                onChange={(e) => updateFormData('github_username', e.target.value)}
                                className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                                placeholder="johndoe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                LinkedIn URL
                            </label>
                            <input
                                type="url"
                                value={formData.linkedin_url}
                                onChange={(e) => updateFormData('linkedin_url', e.target.value)}
                                className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                                placeholder="https://linkedin.com/in/johndoe"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Portfolio URL
                        </label>
                        <input
                            type="url"
                            value={formData.portfolio_url}
                            onChange={(e) => updateFormData('portfolio_url', e.target.value)}
                            className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                            placeholder="https://johndoe.dev"
                        />
                    </div>
                </div>
            )}

            {/* Step 2: Skills */}
            {currentStep === 2 && (
                <div className="space-y-6">
                    {/* Add New Skill */}
                    <div className="bg-dark-100/50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-4">Add a Skill</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Skill Name
                                </label>
                                <div className="space-y-2">
                                    <select
                                        value={newSkill.name}
                                        onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                                    >
                                        <option value="">Select a popular skill or type custom</option>
                                        {POPULAR_SKILLS.map(skill => (
                                            <option key={skill} value={skill}>{skill}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        value={newSkill.name}
                                        onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                                        placeholder="Or type your custom skill..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Category
                                </label>
                                <select
                                    value={newSkill.category}
                                    onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                                    className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                                >
                                    {SKILL_CATEGORIES.map(category => (
                                        <option key={category} value={category}>
                                            {category.replace('_', ' ').toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Proficiency Level
                                </label>
                                <select
                                    value={newSkill.proficiency_level}
                                    onChange={(e) => setNewSkill(prev => ({ ...prev, proficiency_level: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                                >
                                    {PROFICIENCY_LEVELS.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label} - {level.description}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Years Experience
                                </label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    value={newSkill.years_experience}
                                    onChange={(e) => setNewSkill(prev => ({ ...prev, years_experience: e.target.value }))}
                                    className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                                    placeholder="2.5"
                                />
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center text-sm text-gray-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={newSkill.is_learning}
                                        onChange={(e) => setNewSkill(prev => ({ ...prev, is_learning: e.target.checked }))}
                                        className="mr-2 rounded"
                                    />
                                    Currently Learning
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={addSkill}
                            className="btn-secondary w-full"
                            disabled={!newSkill.name.trim()}
                        >
                            Add Skill
                        </button>
                    </div>

                    {/* Skills List */}
                    {formData.skills.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Your Skills ({formData.skills.length})</h3>
                            <div className="space-y-3">
                                {formData.skills.map((skill, index) => (
                                    <div key={index} className="bg-dark-100/30 p-4 rounded-lg flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-4">
                                                <h4 className="font-semibold text-white">{skill.name}</h4>
                                                <span className="px-2 py-1 bg-primary-500/20 text-primary-300 text-xs rounded">
                                                    {skill.category.replace('_', ' ')}
                                                </span>
                                                <span className="px-2 py-1 bg-cyber-500/20 text-cyber-300 text-xs rounded">
                                                    {PROFICIENCY_LEVELS.find(l => l.value === skill.proficiency_level)?.label}
                                                </span>
                                                {skill.years_experience && (
                                                    <span className="text-gray-400 text-sm">
                                                        {skill.years_experience} years
                                                    </span>
                                                )}
                                                {skill.is_learning && (
                                                    <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                                                        Learning
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeSkill(index)}
                                            className="text-red-400 hover:text-red-300 p-2"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Learning Goals */}
            {currentStep === 3 && (
                <div className="space-y-6">
                    {/* Add New Learning Goal */}
                    <div className="bg-dark-100/50 p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-white mb-4">Add a Learning Goal</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Goal Title
                                </label>
                                <input
                                    type="text"
                                    value={newGoal.title}
                                    onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                                    placeholder="Learn React Hooks"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newGoal.description}
                                    onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary-500 transition-colors"
                                    placeholder="What specifically do you want to achieve?"
                                    rows={2}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={newGoal.category}
                                        onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                                    >
                                        <option value="skill">Skill</option>
                                        <option value="certification">Certification</option>
                                        <option value="project">Project</option>
                                        <option value="career">Career</option>
                                        <option value="education">Education</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={newGoal.priority}
                                        onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value }))}
                                        className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                                    >
                                        <option value="high">High</option>
                                        <option value="medium">Medium</option>
                                        <option value="low">Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Target Date
                                    </label>
                                    <input
                                        type="date"
                                        value={newGoal.target_date}
                                        onChange={(e) => setNewGoal(prev => ({ ...prev, target_date: e.target.value }))}
                                        className="w-full px-4 py-3 bg-dark-100 border border-cyber-500/20 rounded-lg text-white focus:outline-none focus:border-primary-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={addLearningGoal}
                            className="btn-secondary w-full mt-4"
                            disabled={!newGoal.title.trim()}
                        >
                            Add Goal
                        </button>
                    </div>

                    {/* Learning Goals List */}
                    {formData.learning_goals.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-4">Your Learning Goals ({formData.learning_goals.length})</h3>
                            <div className="space-y-3">
                                {formData.learning_goals.map((goal, index) => (
                                    <div key={index} className="bg-dark-100/30 p-4 rounded-lg">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <h4 className="font-semibold text-white">{goal.title}</h4>
                                                    <span className={`px-2 py-1 text-xs rounded ${goal.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                                                            goal.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                                                                'bg-green-500/20 text-green-300'
                                                        }`}>
                                                        {goal.priority}
                                                    </span>
                                                    <span className="px-2 py-1 bg-primary-500/20 text-primary-300 text-xs rounded">
                                                        {goal.category}
                                                    </span>
                                                </div>
                                                {goal.description && (
                                                    <p className="text-gray-400 text-sm mb-2">{goal.description}</p>
                                                )}
                                                {goal.target_date && (
                                                    <p className="text-gray-500 text-sm">Target: {new Date(goal.target_date).toLocaleDateString()}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeLearningGoal(index)}
                                                className="text-red-400 hover:text-red-300 p-2"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
                <div>
                    {currentStep > 1 && (
                        <button
                            onClick={prevStep}
                            className="btn-secondary px-6 py-2"
                        >
                            Previous
                        </button>
                    )}
                </div>

                <div className="flex space-x-4">
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    )}

                    {currentStep < 3 ? (
                        <button
                            onClick={nextStep}
                            className="btn-primary px-6 py-2"
                            disabled={currentStep === 1 && (!formData.first_name.trim() || !formData.last_name.trim())}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            className="btn-primary px-6 py-2"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : (initialData ? 'Update Profile' : 'Create Profile')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
