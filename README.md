# IUEA

This is a [Next.js](https://nextjs.org/) project with Vercel Web Analytics integration.

## Features

- ⚡ Next.js 14 with App Router
- 📊 Vercel Web Analytics integrated
- 🎨 TypeScript support
- 🔍 ESLint configured

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Vercel Web Analytics

This project includes Vercel Web Analytics for tracking page views and web vitals. The analytics component is integrated in `app/layout.tsx`.

To enable analytics in production:
1. Deploy your project to Vercel
2. Navigate to your project's Analytics section in the Vercel dashboard
3. Click the "Enable" button

Analytics data will start appearing in your dashboard after deployment and user visits.

## Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm start` - Start the production server
- `npm run lint` - Run ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)