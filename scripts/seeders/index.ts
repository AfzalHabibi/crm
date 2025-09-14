import seedUsers from './userSeeder'

async function runSeeders() {
  try {
    console.log('🚀 Starting database seeding...')
    
    // Add all seeders here
    await seedUsers()

    console.log('✨ Database seeding completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    process.exit(1)
  }
}

runSeeders()