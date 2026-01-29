# Playpals - Migration Guide (Replit to Local/Heroku)

This document outlines the steps to run the Playpals application locally and deploy it to Heroku, decoupling it from the original Replit environment.

## 1. Local Setup

### Prerequisites

- Node.js (version 18 or higher is recommended)
- npm or pnpm (The project uses `package-lock.json`, so npm is the default)
- PostgreSQL database (or a connection string to a service like Neon)
- Git

### Steps

1.  **Clone the repository and navigate to the directory:**
    \`\`\`bash
    git clone [YOUR_REPOSITORY_URL]
    cd playpals
    \`\`\`

2.  **Install dependencies:**
    \`\`\`bash
    npm install
    \`\`\`

3.  **Configure Environment Variables:**
    The application requires several environment variables for the database and authentication.
    - Copy the example file to create your local environment file:
      \`\`\`bash
      cp .env.example .env
      \`\`\`
    - **Edit the new `.env` file** and fill in the required values:
      - `DATABASE_URL`: Your PostgreSQL connection string.
      - `AUTH_SECRET`: A long, random string for session security.
      - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`: Credentials for OAuth providers.
      - `OPENAI_API_KEY`: Your OpenAI API key.

4.  **Run Database Migrations (Optional/As Needed):**
    If you need to set up the database schema, use the Drizzle command (consult your Drizzle configuration):
    \`\`\`bash
    npm run db:push
    \`\`\`

5.  **Run the application in development mode:**
    \`\`\`bash
    npm run dev
    \`\`\`
    The application should start on the port specified in your `.env` file (defaulting to 5000).

## 2. Heroku Deployment

The project has been configured with a `Procfile` and `heroku-postbuild` script for seamless deployment to Heroku.

### Prerequisites

- A Heroku account and the Heroku CLI installed.
- A Heroku application created.

### Steps

1.  **Log in to Heroku and create a new application (if you haven't already):**
    \`\`\`bash
    heroku login
    heroku create your-app-name
    \`\`\`

2.  **Add the necessary buildpacks:**
    Since this is a Node.js application that uses a build step, the standard Node.js buildpack is sufficient. However, if you encounter issues with the build process, you might need to specify the buildpack.
    \`\`\`bash
    heroku buildpacks:set heroku/nodejs
    \`\`\`

3.  **Configure Environment Variables on Heroku:**
    You must set the environment variables from your `.env.example` file in your Heroku app's settings (Config Vars).
    - **DATABASE_URL**: Heroku recommends using the **Heroku Postgres** add-on, which automatically sets this variable. If you use an external provider (like Neon), set the connection string here.
    - **AUTH_SECRET**
    - **GOOGLE_CLIENT_ID**, **GOOGLE_CLIENT_SECRET**
    - **APPLE_CLIENT_ID**, **APPLE_CLIENT_SECRET**
    - **OPENAI_API_KEY**
    - **NODE_ENV**: Set to `production`.

    You can set them via the CLI:
    \`\`\`bash
    heroku config:set AUTH_SECRET="your_strong_auth_secret"
    heroku config:set GOOGLE_CLIENT_ID="your_client_id"

    # ... and so on for all variables

    \`\`\`

4.  **Deploy to Heroku:**
    \`\`\`bash
    git init
    heroku git:remote -a your-app-name
    git add .
    git commit -m "Initial commit for Heroku deployment"
    git push heroku main
    \`\`\`

Heroku will automatically:

- Install dependencies (`npm install`).
- Run the `heroku-postbuild` script (`npm run build`) to build the frontend and server code.
- Start the application using the `web: npm run start` command from the `Procfile`.

Your application should now be running on Heroku!
\`\`\`
