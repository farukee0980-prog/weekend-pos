## POS Freedom (LIFF Enabled)

This is a Next.js POS demo with LINE LIFF login and a staff-only guard.

### Environment Variables

Copy `.env.example` to `.env.local` and set:

```
NEXT_PUBLIC_LINE_LIFF_ID=2008793367-BTVBxUCA
LINE_CHANNEL_ID=2008793367
NEXT_PUBLIC_STAFF_LINE_USER_IDS=Uxxxxxxxxx,Uyyyyyyyyy
```

`NEXT_PUBLIC_STAFF_LINE_USER_IDS` is a comma-separated list of allowed LINE userIds.

### LIFF Console Setup

- Create a LINE Login channel and a LIFF app
- Set LIFF Endpoint URL to your domain path: `https://YOUR-DOMAIN/pos`
- Add `https://YOUR-DOMAIN` to callback/redirect URLs as required
- Use the LIFF link: `https://liff.line.me/2008793367-BTVBxUCA`

### Local Development

Run dev server:

```bash
npm run dev
```

Expose HTTPS for LIFF testing (example with ngrok):

```bash
ngrok http 3000
```

Then set your LIFF Endpoint URL to `https://<NGROK_DOMAIN>/pos` and open the LIFF link.

### Routes

- `/pos` POS main page (protected by staff guard)
- `/orders` Orders list (demo)
- `/products` Products list (demo)

### Notes / TODO

- Persist orders to a database (currently marked TODO in `app/(dashboard)/pos/page.tsx`)
- Improve receipt printing (currently uses `window.print()`)

---
Original Next.js README follows.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
