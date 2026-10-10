# IUEA

A Next.js web application with Vercel Web Analytics integration.

## Features

- ⚡ Next.js 14 with App Router
- 📊 Vercel Web Analytics integrated
- 🎨 TypeScript for type safety
- 🔍 ESLint for code quality

## Getting Started

First, install dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Build

To create a production build:

```bash
npm run build
npm start
```

## Vercel Web Analytics

This project includes Vercel Web Analytics for tracking page views and user interactions. The Analytics component is integrated in the root layout (`app/layout.tsx`).

To enable analytics in production:

1. Deploy this project to Vercel
2. Navigate to your project dashboard on Vercel
3. Go to the Analytics tab
4. Click "Enable" to activate Web Analytics
5. Analytics data will appear after users visit your deployed site

## Development

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deploy on Vercel

The easiest way to deploy this Next.js app is to use the [Vercel Platform](https://vercel.com).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
