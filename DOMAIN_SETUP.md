# Connect tankmusicdistribution.site to GitHub Pages

The repository includes a `CNAME` for `tankmusicdistribution.site` and a build that works when Pages publishes either the repository root or `/docs`. These files do **not** change DNS or repository settings by themselves. The current Pages source is `main` / `/`; publish the changes to that branch before expecting the updated site there.

1. **Verify the domain first.** In [your GitHub account Pages settings](https://github.com/settings/pages), add `tankmusicdistribution.site` and follow GitHub's instructions to add the unique TXT record at your DNS provider. Keep that record after verification. This protects the domain from takeover.
2. **Publish the application changes.** Merge the open pull request into `main` when ready. GitHub Pages currently serves `main` / `/`.
3. **Add the custom domain to the site before changing the web DNS records.** In [repository Settings → Pages](https://github.com/kampalanalf-sudo/iuea/settings/pages), enter `tankmusicdistribution.site` under **Custom domain** and save. If GitHub creates its own `CNAME` commit on `main`, incorporate that change into future work.
4. At your DNS provider (the domain currently uses Namecheap nameservers), replace the parking/URL redirect record for `@` and the parking CNAME for `www` with the following records. Preserve unrelated MX, TXT, and other email/service records. Use an automatic/default TTL.

   | Type | Host | Value |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | CNAME | www | kampalanalf-sudo.github.io |

   Do not add a wildcard record. Remove conflicting A, AAAA, ALIAS/ANAME, CNAME or URL-redirect records for the same web hosts. The `www` CNAME points to the account hostname, **without** `/iuea`.
5. Wait for DNS and certificate provisioning. In repository **Settings → Pages**, verify that the domain check passes and select **Enforce HTTPS** when available. GitHub can redirect `www` to the apex domain when both are configured correctly. DNS and the certificate can take up to 24 hours.

`npm run build` writes `dist/`, mirrors it to `docs/`, and copies `public/CNAME` and `public/404.html` to the repository root. Run `npm run test:pages` after the build to validate both publishing roots. If the domain changes, update `public/CNAME` and rebuild.

GitHub Pages serves public static files. **Do not place real account data, financial information, or API secrets in this prototype**: sign-in currently does not verify email ownership, and the example Supabase migration has open read/write policies. A separate secure authentication, authorization and secret-storage implementation is needed before production use.

References: [GitHub Pages domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages) and [custom domain DNS settings](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
