# Prisma Handbook

This is a quick guide to help you set up and use Prisma in your project.

---

## 1. Setup Prisma

1. Install Prisma CLI:
   ```bash
   npm install prisma --save-dev
   npm install @prisma/client
   ```

2. Initialize Prisma:
   ```bash
   npx prisma init
   ```

   This will create a `prisma` directory with a `schema.prisma` file.

---

## 2. Create a new table

To add a new table in your database:
1. Open the `schema.prisma` file.
2. Add your new model. For example:
    ```prisma
    model User {
      id        Int     @id @default(autoincrement())
      name      String
      email     String  @unique
      createdAt DateTime @default(now())
    }
    ```

3. Save your changes.

---

## 3. Apply migrations

Run the following commands:
1. Generate a migration:
   ```bash
   npx prisma migrate dev --name init
   ```

   Replace `init` with a descriptive name for your migration, such as `add_user_table`.

2. Update your database schema:
   ```bash
   npx prisma db push
   ```

---

## 4. Useful Prisma Commands

Here’s a quick reference for commonly used Prisma commands:

- **Generate client**: Generates Prisma Client based on your schema.
  ```bash
  npx prisma generate
  ```

- **Open Prisma Studio**: Launch a web-based UI for your database.
  ```bash
  npx prisma studio
  ```

- **Check the database status**:
  ```bash
  npx prisma db pull
  ```

- **Seed your database** (optional):
  Add a seed script in `package.json` and run:
  ```bash
  npm run seed
  ```

---

## 5. Resources

For more help, visit the [Prisma Documentation](https://www.prisma.io/docs/).

Feel free to expand this file as you use Prisma in more complex scenarios!