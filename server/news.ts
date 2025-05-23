export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  author: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
}

export const getTopNews = async (
  country: string = 'us',
  category?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<NewsResponse> => {
  const API_KEY = process.env.NEWS_API_KEY;

  if (!API_KEY) {
    throw new Error('News API key not found');
  }

  try {
    let url = `https://newsapi.org/v2/top-headlines?country=${country}&page=${page}&pageSize=${pageSize}&apiKey=${API_KEY}`;

    if (category) {
      url += `&category=${category}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`News API Error: ${response.status}`);
    }

    const data = await response.json();

    // Filter out articles with missing essential data
    const filteredArticles = data.articles.filter(
      (article: NewsArticle) =>
        article.title &&
        article.description &&
        article.url &&
        article.title !== '[Removed]' &&
        article.description !== '[Removed]'
    );

    return {
      articles: filteredArticles,
      totalResults: data.totalResults,
    };
  } catch (error) {
    console.error('News API Error:', error);
    throw error;
  }
};

export const searchNews = async (query: string, pageSize: number = 20): Promise<NewsResponse> => {
  const API_KEY = process.env.NEWS_API_KEY;

  if (!API_KEY) {
    throw new Error('News API key not found');
  }

  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${pageSize}&sortBy=publishedAt&apiKey=${API_KEY}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`News API Error: ${response.status}`);
    }

    const data = await response.json();

    // Filter out articles with missing essential data
    const filteredArticles = data.articles.filter(
      (article: NewsArticle) =>
        article.title &&
        article.description &&
        article.url &&
        article.title !== '[Removed]' &&
        article.description !== '[Removed]'
    );

    return {
      articles: filteredArticles,
      totalResults: data.totalResults,
    };
  } catch (error) {
    console.error('News API Error:', error);
    throw error;
  }
};
