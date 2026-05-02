# ReachOut - Deployment Checklist

## Pre-Deployment

- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript compilation successful (`pnpm type-check`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Build completes without errors (`pnpm build`)
- [ ] Environment variables configured locally
- [ ] All features tested in development

## Before Pushing to Production

### Code Quality
- [ ] Remove all console.log debug statements (except error logs)
- [ ] Remove/comment out any temporary test data
- [ ] Verify error handling on all API routes
- [ ] Check for any hardcoded URLs or API keys

### Performance
- [ ] Check Lighthouse score (target: 80+)
- [ ] Verify bundle size is reasonable
- [ ] Test on slow 3G network
- [ ] Check Core Web Vitals

### Security
- [ ] No sensitive data in frontend code
- [ ] API keys stored as environment variables
- [ ] CSRF protection enabled
- [ ] Input validation on all forms
- [ ] SQL injection prevention (if applicable)

### Testing
- [ ] Manual testing of all user flows:
  - [ ] Landing page loads
  - [ ] Search with demo data works
  - [ ] Email generation works
  - [ ] Settings page loads
- [ ] Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- [ ] Test on mobile devices
- [ ] Test with slow internet connection

## Vercel Deployment

### Setup
1. Push code to GitHub/GitLab/Bitbucket
2. Import project in Vercel dashboard
3. Configure environment variables:
   ```
   APOLLO_API_KEY = (leave blank for demo)
   HUNTER_API_KEY = (leave blank for demo)
   OPENAI_API_KEY = (leave blank for Gemini default)
   GOOGLE_GENERATIVE_AI_API_KEY = (optional)
   DEMO_MODE = false (when using real APIs)
   ```
4. Deploy

### Post-Deployment

- [ ] Preview deployment works
- [ ] All routes accessible
- [ ] API endpoints responding correctly
- [ ] Verify environment variables loaded (not showing placeholders)
- [ ] Check console for errors (DevTools)
- [ ] Test search functionality
- [ ] Test email generation
- [ ] Check performance metrics

## Rollback Plan

If issues occur after deployment:

1. **Immediate**: Revert to previous commit on Vercel
   - Vercel Dashboard > Deployments > Previous deployment > Redeploy

2. **If that doesn't work**:
   - Push hotfix to `main` branch
   - Vercel auto-deploys

3. **For critical issues**:
   - Disable production environment temporarily
   - Debug locally
   - Deploy with specific commit hash

## Monitoring

### Alerts to Set Up
- [ ] Build failures
- [ ] 500 errors in /api/* routes
- [ ] High response times (>3s)
- [ ] Memory usage spikes

### Metrics to Track
- Page load time
- Time to interactive (TTI)
- Largest contentful paint (LCP)
- API response times
- Error rate

### Debug Commands
```bash
# View deployment logs
vercel logs

# Check environment variables are set
vercel env list

# View analytics
# Vercel Dashboard > Analytics
```

## Post-Launch

### Monitor First 24 Hours
- [ ] Check error logs regularly
- [ ] Monitor performance metrics
- [ ] Verify all integrations working
- [ ] Check for unusual traffic patterns

### Monitor First Week
- [ ] Review user feedback
- [ ] Check for bottlenecks
- [ ] Verify backup/redundancy
- [ ] Monitor API rate limits

### Ongoing Maintenance
- [ ] Weekly: Check error logs
- [ ] Weekly: Review performance metrics
- [ ] Monthly: Review security logs
- [ ] Monthly: Update dependencies (pnpm update)
- [ ] Quarterly: Full security audit

## Rollback Checklist

If rolling back production:

1. **Identify issue** - Check logs in Vercel dashboard
2. **Revert code** - Go to previous working commit
3. **Test locally** - Verify fix on local dev server
4. **Test preview** - Deploy to preview environment first
5. **Communicate** - Notify team of rollback
6. **Re-deploy** - Once fixed, push to production
7. **Monitor** - Watch metrics after new deployment

## Common Issues & Solutions

### Issue: API keys not loading
**Solution**: 
1. Verify env vars in Vercel Settings > Environment Variables
2. Check var names exactly match code (`APOLLO_API_KEY`, etc.)
3. Redeploy to apply changes

### Issue: Search returns no results
**Solution**:
1. Check DEMO_MODE setting
2. If DEMO_MODE=false, verify API keys are valid
3. Check API rate limits on Apollo/Hunter dashboards

### Issue: Email generation fails
**Solution**:
1. Verify OpenAI or Gemini API key
2. Check API quota/credits
3. Check context length (max 500 chars)

### Issue: High latency on /api/generate-email
**Solution**:
1. This is normal - AI generation takes 2-5 seconds per email
2. Implement better loading UI if needed
3. Consider caching with OpenAI fine-tuning for common scenarios

## Version History

- **v1.0.0** (2026-05-02) - Initial launch
  - Prospect search (demo & API)
  - AI email generation (OpenAI/Gemini)
  - Bulk sending (mock Gmail MCP)
  - Settings & configuration
  - Mobile-responsive design
