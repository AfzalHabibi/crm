# Database Migrations and Seeders

This document describes how to use the database migrations and seeders in the DEP LLC CRM project.

## Migrations

Migrations allow you to modify your database schema in a structured and organized way. They help track changes to your database structure over time.

### Running Migrations

To run all pending migrations:

```bash
npm run migrate
```

### Creating New Migrations

Migration files are stored in `scripts/migrations/` and are executed in alphabetical order. To create a new migration:

1. Create a new file in `scripts/migrations/` with a name like `XXX_description.ts`
2. The file should export `up()` and `down()` functions
3. The `up()` function should contain the changes you want to make
4. The `down()` function should contain the code to revert those changes

Example migration file structure:

```typescript
export async function up() {
  // Add your migration code here
}

export async function down() {
  // Add your rollback code here
}
```

## Seeders

Seeders help you populate your database with test/sample data.

### Running Seeders

To run all seeders:

```bash
npm run db:seed
```

### Available Seeds

1. **Users Seeder**
   - Creates default users with different roles:
     - Admin (admin@depllc.com)
     - Manager (manager@depllc.com)
     - Customer (customer@depllc.com)

### Notes

- Make sure your MongoDB server is running before executing migrations or seeders
- Always backup your database before running migrations in production
- The seeder will clear existing data before seeding new data
- Default passwords are for development only - change them in production

### Environment Variables

Make sure you have the following environment variables set in your `.env` file:

```env
MONGODB_URI=your_mongodb_connection_string
```