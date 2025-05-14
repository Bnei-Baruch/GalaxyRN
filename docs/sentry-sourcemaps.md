# Sentry Sourcemaps Setup for GalaxyRN

This document explains how to use Sentry sourcemaps in the GalaxyRN project to properly debug and track errors in production.

## Overview

Sourcemaps allow Sentry to convert minified JavaScript code back to its original format, making stack traces readable and useful for debugging. This is crucial for React Native applications where the bundled JavaScript is minified in production.

## Setup

The project is configured with Sentry integration using environment variables:

1. **Environment Variables**: Set the required Sentry environment variables before running scripts.
2. **Bundle Generation**: Scripts for bundling Android and iOS apps with sourcemap generation.
3. **Sourcemap Upload**: Scripts for uploading the sourcemaps to Sentry for each platform.

## Security Considerations

To securely handle Sentry authentication:

1. **Never commit authentication tokens to version control**
2. **Never store auth tokens directly in package.json scripts**
3. Use environment variables for sensitive information

## Required Environment Variables

Before running any Sentry-related scripts, set these environment variables:

```bash
export SENTRY_AUTH_TOKEN=your_auth_token
export SENTRY_ORG=kbb
export SENTRY_PROJECT=arvut-mobile
```

## Available Scripts

The following npm scripts are available:

- `npm run bundle:android`: Generates the Android JavaScript bundle with sourcemaps
- `npm run bundle:ios`: Generates the iOS JavaScript bundle with sourcemaps
- `npm run sentry:android`: Uploads Android sourcemaps to Sentry
- `npm run sentry:ios`: Uploads iOS sourcemaps to Sentry
- `npm run sentry:upload`: Uploads both Android and iOS sourcemaps
- `npm run sentry:validate`: Validates and uploads sourcemaps using the helper script
- `npm run build:android:release`: Bundles and uploads Android sourcemaps
- `npm run build:ios:release`: Bundles and uploads iOS sourcemaps
- `npm run build:release`: Bundles and uploads sourcemaps for both platforms

## Step-by-Step Release Process

When creating a new release, follow these steps:

1. **Set Environment Variables**:
   ```bash
   export SENTRY_AUTH_TOKEN=your_auth_token
   export SENTRY_ORG=kbb
   export SENTRY_PROJECT=arvut-mobile
   ```

2. **Update Version**: Make sure the app version in `package.json` is updated if needed.

3. **Generate Bundles and Sourcemaps**:
   ```
   npm run build:release
   ```
   
   This command will:
   - Generate JavaScript bundles for both Android and iOS
   - Create sourcemap files
   - Upload the sourcemaps to Sentry

## Troubleshooting

If you encounter issues with the sourcemaps:

1. **Check Environment Variables**: Make sure all required Sentry environment variables are set correctly.

2. **Check File Paths**: Ensure the bundle and sourcemap files exist at the expected locations:
   - Android: 
     - Bundle: `android/app/src/main/assets/index.android.bundle`
     - Sourcemap: `android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map`
   - iOS:
     - Bundle: `ios/main.jsbundle`
     - Sourcemap: `ios/main.jsbundle.map`

## Notes on CI/CD Integration

When setting up CI/CD:

1. **Auth Token Handling**: Never store your auth token in files that get committed to version control:
   - Use environment variables in your CI/CD pipeline
   - Store the token in a secure vault or secrets manager
   - In GitHub Actions, use encrypted secrets

2. Example CI/CD environment variable setup:
   ```yaml
   # Example GitHub Actions workflow
   env:
     SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
     SENTRY_ORG: kbb
     SENTRY_PROJECT: arvut-mobile
   ```

## Additional Resources

- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [Sentry Sourcemaps Documentation](https://docs.sentry.io/platforms/javascript/sourcemaps/)
- [Sentry CLI Documentation](https://docs.sentry.io/product/cli/) 