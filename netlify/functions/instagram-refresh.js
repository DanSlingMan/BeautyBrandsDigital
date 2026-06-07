// netlify/functions/instagram-refresh.js
// Instagram long-lived tokens expire after 60 days. This function refreshes
// the token and saves the new one back into Netlify's environment variables,
// so the feed never goes stale. It runs automatically twice a month
// (schedule is set in netlify.toml).
//
// Required environment variables (Site settings → Environment variables):
//   INSTAGRAM_ACCESS_TOKEN  — the Instagram long-lived token
//   NETLIFY_AUTH_TOKEN      — a Netlify personal access token (User settings
//                             → Applications → New access token), needed so
//                             this function can update the env var
//   NETLIFY_SITE_ID         — found under Site settings → Site details

const NETLIFY_API = "https://api.netlify.com/api/v1";

exports.handler = async () => {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const netlifyToken = process.env.NETLIFY_AUTH_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;

  if (!token) {
    console.error("INSTAGRAM_ACCESS_TOKEN is not set — nothing to refresh.");
    return { statusCode: 503, body: "Not configured" };
  }

  try {
    // Step 1: ask Instagram for a refreshed token (resets the 60-day clock)
    const refreshUrl =
      "https://graph.instagram.com/refresh_access_token" +
      `?grant_type=ig_refresh_token&access_token=${token}`;
    const refreshRes = await fetch(refreshUrl);
    const refreshed = await refreshRes.json();

    if (!refreshRes.ok || !refreshed.access_token) {
      console.error("Token refresh failed:", JSON.stringify(refreshed));
      return { statusCode: 502, body: "Refresh failed" };
    }

    console.log(`Token refreshed — expires in ${Math.round(refreshed.expires_in / 86400)} days.`);

    // Step 2: persist the new token in Netlify env vars (if API access is set up)
    if (!netlifyToken || !siteId) {
      console.warn(
        "NETLIFY_AUTH_TOKEN / NETLIFY_SITE_ID not set — " +
          "update INSTAGRAM_ACCESS_TOKEN manually in Netlify with the refreshed token."
      );
      return { statusCode: 200, body: "Refreshed (not persisted)" };
    }

    const authHeaders = {
      Authorization: `Bearer ${netlifyToken}`,
      "Content-Type": "application/json",
    };

    // Look up the account that owns this site (needed by the env var API)
    const siteRes = await fetch(`${NETLIFY_API}/sites/${siteId}`, { headers: authHeaders });
    const site = await siteRes.json();

    // Write the new token value for all deploy contexts
    const envRes = await fetch(
      `${NETLIFY_API}/accounts/${site.account_id}/env/INSTAGRAM_ACCESS_TOKEN?site_id=${siteId}`,
      {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ context: "all", value: refreshed.access_token }),
      }
    );

    if (!envRes.ok) {
      console.error("Could not save refreshed token to Netlify:", await envRes.text());
      return { statusCode: 502, body: "Refreshed but not saved" };
    }

    console.log("Refreshed token saved to Netlify environment.");
    return { statusCode: 200, body: "Refreshed and saved" };
  } catch (err) {
    console.error("Instagram token refresh error:", err);
    return { statusCode: 500, body: "Error" };
  }
};
