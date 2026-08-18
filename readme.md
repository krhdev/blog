# KRHDev Tech Blog

A full-stack blogging platform built with Node.js, Express, MySQL (via TiDB Cloud), and Sequelize. Anyone can browse posts, filter by category, view author profiles, and read comments — registering and logging in unlocks creating, editing, and deleting your own posts and comments.

**Live demo:** _[Render URL here]_

## Features

- **Public browsing** — posts, categories, comments, and author profiles are visible to everyone, no account required
- **Authentication** — register and log in via a dropdown panel in the header; JWT-based sessions with bcrypt password hashing
- **Post management** — create, edit, and delete your own blog posts, each with an optional featured image and category
- **Comments** — add, edit, and delete comments on any post (only your own)
- **Author profiles** — click any author's name to see their bio info and a filtered feed of their posts
- **Category filtering** — browse posts by category, and add new categories on the fly from the post form
- **Featured images** — upload an image per post, stored via Cloudinary
- **Pagination** — posts load in pages with Prev/Next navigation
- **Dark / light mode** — toggle with a saved preference across visits
- **Responsive layout** — scales fluidly from mobile to desktop

## Tech Stack

- **Backend:** Node.js, Express, Sequelize
- **Database:** MySQL-compatible, hosted on [TiDB Cloud](https://tidbcloud.com/) (free tier)
- **Auth:** JWT, bcrypt
- **Image storage:** Cloudinary
- **Front-end:** Vanilla HTML/CSS/JavaScript
- **Hosting:** [Render](https://render.com/)

## Prerequisites

- [Node.js](https://nodejs.org/) installed
- A free [TiDB Cloud](https://tidbcloud.com/) account (or any MySQL-compatible database)
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

### 3. Set up your database

Create a free Serverless cluster on [TiDB Cloud](https://tidbcloud.com/) (or use a local/other MySQL instance), then create the database:

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
DB_USERNAME=your_db_username
DB_PASSWORD=your_db_password
DB_HOST=your_db_host
DB_DIALECT=mysql
DB_PORT=4000
DB_SSL=true

JWT_SECRET=your_random_secret_string

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> **Notes:**
> - `DB_PORT` is `4000` for TiDB Cloud (not the usual MySQL `3306`).
> - `DB_SSL=true` is required for TiDB Cloud connections (and most other cloud MySQL providers).
> - Generate a strong `JWT_SECRET` with:
>   ```bash
>   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
>   ```

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

> Note: open this directly in a browser tab. Viewing it through an editor's built-in preview/port-forwarding panel can cause connection errors.

## Usage

1. **Browse posts** freely — no account needed to read.
2. Click **Login / Register** (top-right) to create an account or sign in.
3. Once logged in, use **Create a Post** to publish — attach an image and/or category if you like.
4. Add a **new category** on the fly from the post form, or pick an existing one.
5. Use the **category filter** to browse by topic.
6. Click any **author's name** to view their profile and see all their posts.
7. **Comment** on any post; edit or delete your own comments any time.
8. Only posts/comments you created show **Edit** and **Delete** options.
9. Use **Prev / Next** at the bottom of the feed to page through posts.
10. Toggle **dark/light mode** using the button in the header — your choice is remembered on your next visit.

## Project Structure

```
blog/
├── config/          # Sequelize database connection
├── db/              # Database schema/setup
├── models/          # Sequelize models (User, Post, Category, Comment)
├── public/          # Front-end assets (HTML, CSS, JS)
├── routes/          # Express route handlers
├── seeds/           # Seed data
├── utils/           # Auth middleware, image upload config
└── server.js        # App entry point
```

## API Overview

| Method | Route | Auth required | Description |
|---|---|---|---|
| POST | `/api/users` | No | Register |
| POST | `/api/users/login` | No | Log in |
| POST | `/api/users/logout` | No | Log out |
| GET | `/api/users/:id` | No | Public profile info + post count |
| GET | `/api/posts` | No | List posts (paginated, filterable by `?categoryId=` or `?userId=`) |
| GET | `/api/posts/:id` | No | Single post |
| POST | `/api/posts` | Yes | Create a post |
| PUT | `/api/posts/:id` | Yes (owner only) | Update a post |
| DELETE | `/api/posts/:id` | Yes (owner only) | Delete a post |
| GET | `/api/categories` | No | List categories |
| POST | `/api/categories` | Yes | Create a category |
| GET | `/api/comments/post/:postId` | No | List comments on a post |
| POST | `/api/comments` | Yes | Add a comment |
| PUT | `/api/comments/:id` | Yes (owner only) | Edit a comment |
| DELETE | `/api/comments/:id` | Yes (owner only) | Delete a comment |

## Security Notes

- JWT secret is stored in environment variables, never hardcoded
- Passwords are hashed with bcrypt before storage and never returned in API responses
- All write operations (create/update/delete on posts, categories, comments, user accounts) require a valid auth token
- Users can only edit or delete their own posts, comments, and account
- Read access (browsing posts, categories, comments, profiles) is public by design

## Deployment

Deployed on [Render](https://render.com/) with a [TiDB Cloud](https://tidbcloud.com/) database (Render doesn't offer a free MySQL option; TiDB Cloud's free Serverless tier is MySQL-protocol compatible and works with this project's Sequelize setup with no code changes beyond enabling SSL).

All environment variables from `.env` need to be added manually in Render's dashboard under the service's Environment tab — Render does not read your local `.env` file.


## Author

Kat — [KRHDev](https://github.com/krhdev)