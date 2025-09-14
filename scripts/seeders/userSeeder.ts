import { connectToDatabase, disconnectFromDatabase } from '../migrations/migrationUtils'
import User from '../../models/User'

export interface IUserSeed {
  name: string
  email: string
  password: string
  role: 'admin' | 'manager' | 'user'
  department?: string
  phone?: string
  isActive: boolean
}

export const userSeeds: IUserSeed[] = [
  {
    name: 'Admin User',
    email: 'admin@gmail.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Administration',
    phone: '+1234567890',
    isActive: true
  },
  {
    name: 'Manager User',
    email: 'manager@gmail.com',
    password: 'Manager@123',
    role: 'manager',
    department: 'Operations',
    phone: '+1234567891',
    isActive: true
  },
  {
    name: 'Customer User',
    email: 'customer@gmail.com',
    password: 'Customer@123',
    role: 'user',
    department: 'Customer',
    phone: '+1234567892',
    isActive: true
  }
]

async function seedUsers() {
  try {
    await connectToDatabase()
    console.log('🌱 Starting user seeding...')

    // Clear existing users
    await User.deleteMany({})
    console.log('✅ Cleared existing users')

    // Create new users
    for (const userData of userSeeds) {
      await User.create(userData)
      console.log(`✅ Created user: ${userData.email}`)
    }

    console.log('✨ User seeding completed successfully')
    await disconnectFromDatabase()
  } catch (error) {
    console.error('❌ Error seeding users:', error)
    await disconnectFromDatabase()
    process.exit(1)
  }
}

export default seedUsers