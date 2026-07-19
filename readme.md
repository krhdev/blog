# KRHDev Tech Blog

A full-stack blogging platform built with Node.js, Express, MySQL, and Sequelize. Users can register, log in, browse posts filtered by category, and manage their own posts — including featured images — through a simple front-end interface.

## Features

- **Authentication** — register, log in, and log out securely with JWT-based sessions and bcrypt password hashing
- **Post management** — create, edit, and delete your own blog posts (with ownership checks so you can't touch anyone else's)
- **Category filtering** — browse posts by category, and add new categories on the fly from the post form
- **Featured images** — upload an image per post, stored via Cloudinary
- **Dark / light mode** — toggle with a saved preference across visits
- **Responsive layout** — scales fluidly from mobile to desktop

## Tech Stack

- **Backend:** Node.js, Express, Sequelize
- **Database:** MySQL
- **Auth:** JWT, bcrypt
- **Image storage:** Cloudinary
- **Front-end:** Vanilla HTML/CSS/JavaScript

## Prerequisites

- [Node.js](https://nodejs.org/) installed
- [MySQL](https://dev.mysql.com/downloads/) installed and running
- A free [Cloudinary](https://cloudinary.com/) account (for image uploads)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/krhdev/blog.git
cd blog
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create the database

Log into MySQL:

```bash
mysql -u root -p
```

Then create the database:

```sql
CREATE DATABASE tech_blog;
```

### 4. Configure environment variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in the following values:

```dotenv
DB_DATABASE=tech_blog
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_DIALECT=mysql
DB_PORT=3306

JWT_SECRET=your_random_secret_string

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Note:** `JWT_SECRET` should be a long, random string — not something guessable. You can generate one with:
> ```bash
> node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
> ```

### 5. Seed the database (optional)

```bash
npm run seed
```

### 6. Start the app

```bash
npm start
```

### 7. Open it in your browser

```
http://localhost:3001
```

## Usage

1. **Register** an account, then **log in**.
2. Add a **category** (or pick an existing one) when creating a post.
3. Optionally attach a **featured image** to your post.
4. Use the **category filter** dropdown on the Posts section to browse by topic.
5. Only posts you created show **Edit** and **Delete** links.
6. Toggle **dark/light mode** using the button in the header — your choice is remembered on your next visit.

## Project Structure

```
blog/
├── config/          # Sequelize database connection
├── db/              # Database schema/setup
├── models/          # Sequelize models (User, Post, Category)
├── public/          # Front-end assets (HTML, CSS, JS)
├── routes/          # Express route handlers
├── seeds/           # Seed data
├── utils/           # Auth middleware, image upload config
└── server.js        # App entry point
```

## Security Notes

- JWT secret is stored in environment variables, never hardcoded
- Passwords are hashed with bcrypt before storage and never returned in API responses
- All post/category write operations require a valid auth token
- Users can only edit or delete their own posts

## Author

Kat — [KRHDev](https://github.com/krhdev)