# Equivalent Exchange Workspace

This is a pnpm workspace containing a [Next.js](https://nextjs.org/) application with Supabase integration.

## Workspace Structure

```
/
├── apps/
│   └── equivalent-exchange/    # Main Next.js application
├── packages/                   # Shared packages (future use)
├── supabase/                  # Database configuration and migrations
└── pnpm-workspace.yaml        # Workspace configuration
```

## Getting Started

First, install dependencies for the entire workspace:

```bash
pnpm install
```

Then, run the development server:

```bash
pnpm dev
# or run directly in the app
cd apps/equivalent-exchange && pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `apps/equivalent-exchange/src/app/page.tsx`. The page auto-updates as you edit the file.

## Workspace Commands

### Development
- `pnpm dev` - Run the Next.js development server
- `pnpm dev-turbo` - Run with Turbopack (faster)
- `pnpm dev-https` - Run with HTTPS enabled

### Building & Testing
- `pnpm build` - Build the application
- `pnpm start` - Start the production server
- `pnpm test` - Run tests
- `pnpm lint` - Run linting

### Workspace-wide Commands
- `pnpm build-all` - Build all packages in the workspace
- `pnpm test-all` - Run tests for all packages
- `pnpm lint-all` - Lint all packages

### Database (Supabase)
- `pnpm update-types-remote` - Update TypeScript types from remote Supabase
- `pnpm update-types-local` - Update TypeScript types from local Supabase
- `pnpm db-data-dump` - Dump database data to seed file
- `pnpm db-data-upload` - Upload seed data to database

## Adding New Packages

To add a new package to the workspace:

1. Create a new directory in `apps/` or `packages/`
2. Add a `package.json` file with appropriate dependencies
3. Run `pnpm install` from the workspace root

## Project Structure

- **`apps/equivalent-exchange/`** - Main Next.js application
- **`packages/`** - Shared packages (utilities, UI components, etc.)
- **`supabase/`** - Database configuration, migrations, and seed data

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
