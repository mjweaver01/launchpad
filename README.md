# Player Probability

Forecast the probability of a player appearing in their next game.

## Setup

1. Create a `.env` file in the root directory with the following content:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   ```

2. Replace `your_openai_api_key_here` with your actual OpenAI API key.

3. Install dependencies:
   ```
   npm install
   ```

4. Run the development server with Netlify CLI:
   ```
   npm run dev
   ```

## Deployment

This project is set up to be deployed on Netlify:

1. Install Netlify CLI globally (if not already installed):
   ```
   npm install -g netlify-cli
   ```

2. Log in to Netlify:
   ```
   netlify login
   ```

3. Link your repository to a Netlify site:
   ```
   netlify init
   ```

4. Deploy to Netlify:
   ```
   netlify deploy --prod
   ```

5. Set environment variables in the Netlify dashboard:
   - OPENAI_API_KEY
   - OPENAI_MODEL

## Usage

### Frontend

Visit the application in your browser at http://localhost:1234 when running locally, or at your Netlify URL after deployment.

### API

#### POST

Send a POST request to `/.netlify/functions/probability` with a JSON body containing the player name:

```json
{
  "playerName": "LeBron James"
}
```

#### GET

Send a GET request to `/.netlify/functions/probability` with the playerName as a query parameter:

```
/.netlify/functions/probability?playerName=LeBron%20James
```

The service will return a forecast with the probability of the player appearing in their next game, confidence, and an explanation.

## Project Structure

- `/netlify/functions`: Serverless functions deployed to Netlify
- `index.html`: Main entry point for the Vite application
- `netlify.toml`: Netlify configuration file
- `vite.config.js`: Vite configuration