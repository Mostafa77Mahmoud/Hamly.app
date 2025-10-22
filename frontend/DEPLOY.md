
# Netlify Deployment Checklist ✅

## Pre-Deployment Steps

1. **Environment Variables** (Set in Netlify Dashboard)
   - `EXPO_PUBLIC_SUPABASE_URL` = Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase anonymous key
   - `NODE_ENV` = production

2. **Build Command** (Already configured in netlify.toml)
   ```
   NODE_ENV=production EXPO_PUBLIC_SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY=$EXPO_PUBLIC_SUPABASE_ANON_KEY npx expo export --platform web --output-dir dist --clear --minify
   ```

3. **Publish Directory**
   ```
   dist
   ```

## Post-Deployment Verification

- [ ] Check homepage loads correctly
- [ ] Verify authentication works
- [ ] Test all routes/navigation
- [ ] Confirm Supabase connection
- [ ] Check browser console for errors

## Netlify Deploy Steps

1. Connect your GitHub repository to Netlify
2. Configure build settings (already in netlify.toml)
3. Add environment variables in Netlify dashboard
4. Click "Deploy site"
5. Wait for build to complete
6. Test deployed site

## Troubleshooting

**Build fails?**
- Check Netlify build logs
- Verify environment variables are set correctly
- Ensure Node version is 20

**Blank page?**
- Check browser console for errors
- Verify dist/index.html exists
- Check redirect rules in netlify.toml

**API errors?**
- Verify EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
- Check Supabase dashboard for CORS settings
