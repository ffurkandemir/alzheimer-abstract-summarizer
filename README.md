# Alzheimer Abstract Summarizer

An AI-powered web application for summarizing Alzheimer's disease and neurodegenerative research abstracts using the `furkanyagiz/flan-t5-base-alzheimer-ultra-safe` model hosted on Hugging Face.

## Features

- 🧠 **Specialized AI Model**: Uses a fine-tuned FLAN-T5 model specifically trained for Alzheimer research
- 🚀 **Modern Stack**: Built with Next.js 14+, TypeScript, and Tailwind CSS
- 🔒 **Secure**: Server-side API calls keep your Hugging Face token safe
- ⚡ **Rate Limited**: Built-in protection with IP-based rate limiting (10 requests/minute)
- 📋 **Copy to Clipboard**: Easily copy generated summaries with one click
- 🎨 **Clean UI**: Modern, responsive design with dark theme

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Validation**: Zod
- **AI Model**: Hugging Face Inference API

## Prerequisites

- Node.js 18.x or higher
- npm, pnpm, or yarn package manager
- A Hugging Face API token ([Get one here](https://huggingface.co/settings/tokens))

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/ffurkandemir/alzheimer-abstract-summarizer.git
cd alzheimer-abstract-summarizer
```

2. **Install dependencies**

Using npm:
```bash
npm install
```

Using pnpm:
```bash
pnpm install
```

Using yarn:
```bash
yarn install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Hugging Face API token:

```
HF_API_TOKEN=hf_your_actual_token_here
```

To get your token:
- Visit [Hugging Face Settings - Tokens](https://huggingface.co/settings/tokens)
- Create a new token with "Read" permissions
- Copy and paste it into your `.env.local` file

## Running Locally

Start the development server:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Usage

1. Open the application in your browser
2. Paste a scientific abstract about Alzheimer's disease or neurodegenerative disorders into the text area
3. Click the "Summarize" button
4. Wait a few seconds for the AI to generate a summary
5. Read the summary and optionally copy it to your clipboard

## Project Structure

```
alzheimer-abstract-summarizer/
├── app/
│   ├── api/
│   │   └── summarize/
│   │       └── route.ts       # API endpoint for summarization
│   ├── globals.css            # Global styles and Tailwind imports
│   ├── layout.tsx             # Root layout component
│   └── page.tsx               # Main page with UI
├── lib/
│   └── rate-limit.ts          # In-memory rate limiter utility
├── .env.local.example         # Example environment variables
├── .gitignore                 # Git ignore file
├── next.config.js             # Next.js configuration
├── package.json               # Dependencies and scripts
├── postcss.config.js          # PostCSS configuration
├── tailwind.config.ts         # Tailwind CSS configuration
└── tsconfig.json              # TypeScript configuration
```

## API Endpoint

### POST `/api/summarize`

Summarizes a research abstract using the Hugging Face model.

**Request Body:**
```json
{
  "abstract": "Your research abstract text here..."
}
```

**Success Response (200):**
```json
{
  "summary": "Generated summary text..."
}
```

**Error Responses:**

- `400 Bad Request`: Missing or invalid abstract
  ```json
  { "error": "abstract is required" }
  ```

- `429 Too Many Requests`: Rate limit exceeded
  ```json
  { "error": "Too many requests. Please try again later." }
  ```

- `500 Internal Server Error`: API or server error
  ```json
  { "error": "Hugging Face API error" }
  ```

## Deployment

### Deploying to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Import your project to [Vercel](https://vercel.com/new)

3. Configure environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add `HF_API_TOKEN` with your Hugging Face token

4. Deploy!

Vercel will automatically:
- Detect the Next.js framework
- Install dependencies
- Build and deploy your application

### Other Deployment Platforms

The application can be deployed to any platform that supports Node.js and Next.js:
- Netlify
- Railway
- Render
- AWS Amplify
- Docker containers

Make sure to set the `HF_API_TOKEN` environment variable in your deployment platform.

## Rate Limiting

The application includes built-in rate limiting to prevent abuse:
- **Limit**: 10 requests per minute per IP address
- **Implementation**: In-memory storage (resets on server restart)
- **Cleanup**: Automatic cleanup of expired entries every 5 minutes

For production use with multiple server instances, consider using a distributed rate limiting solution like Redis.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

The project uses:
- **TypeScript** for type safety
- **ESLint** for code linting
- **Tailwind CSS** for consistent styling

## Security Considerations

- ✅ API token is stored server-side and never exposed to the client
- ✅ Rate limiting protects against abuse
- ✅ Input validation using Zod
- ✅ Proper error handling and logging
- ⚠️ Rate limiter uses in-memory storage (consider Redis for production)

## Troubleshooting

### "Service configuration error"

This means the `HF_API_TOKEN` environment variable is not set. Make sure:
1. You have created a `.env.local` file
2. The token is correctly set in the file
3. You have restarted the development server after adding the token

### "Hugging Face API error"

This could mean:
1. Invalid API token
2. Model is loading (wait a minute and try again)
3. API quota exceeded
4. Network connectivity issues

Check the server console logs for more detailed error information.

### Rate limit errors

If you're hitting rate limits during testing:
1. Wait for the rate limit window to reset (1 minute)
2. Restart the development server (clears in-memory rate limit storage)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Model: [furkanyagiz/flan-t5-base-alzheimer-ultra-safe](https://huggingface.co/furkanyagiz/flan-t5-base-alzheimer-ultra-safe)
- Built with [Next.js](https://nextjs.org/)
- Powered by [Hugging Face](https://huggingface.co/)
