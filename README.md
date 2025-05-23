# 🚀 Launchpad

Your personal assistant with weather, news, and task management.

## Setup

1. Create a `.env` file in the root directory with the following content:

   ```
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_MODEL=gpt-4o-mini
   VISUAL_CROSSING_API_KEY=your_visual_crossing_api_key_here
   NEWS_API_KEY=your_news_api_key_here
   ```

2. Replace `your_openai_api_key_here` with your actual OpenAI API key.

3. Replace `your_visual_crossing_api_key_here` with your actual Visual Crossing API key. You can get a free API key at [https://www.visualcrossing.com/weather-api](https://www.visualcrossing.com/weather-api).

4. Replace `your_news_api_key_here` with your actual NewsAPI key. You can get a free API key at [https://newsapi.org](https://newsapi.org).

5. Install dependencies:

   ```
   npm install
   ```

6. Run the development server with Netlify CLI:
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
   - VISUAL_CROSSING_API_KEY
   - NEWS_API_KEY

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

#### Weather API

Send a GET request to `/.netlify/functions/weather` with latitude and longitude as query parameters:

```
/.netlify/functions/weather?lat=40.7128&lon=-74.0060
```

The service will return current weather data including temperature, description, humidity, and wind speed using the Visual Crossing Weather API.

#### News API

Send a GET request to `/.netlify/functions/news` with optional country and category query parameters:

```
/.netlify/functions/news?country=us&category=technology
```

The service will return the latest news articles from NewsAPI including title, description, URL, and publication details.

## Project Structure

- `/netlify/functions`: Serverless functions deployed to Netlify
- `index.html`: Main entry point for the Vite application
- `netlify.toml`: Netlify configuration file
- `vite.config.js`: Vite configuration
