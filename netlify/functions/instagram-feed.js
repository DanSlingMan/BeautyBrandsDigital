// netlify/functions/instagram-feed.js
// Fetches the latest posts from Miriam's Instagram (@clt_makeup1) using the
// Instagram API with Instagram Login (graph.instagram.com).
//
// Setup required (see Reviews/../docs or INSTAGRAM-SETUP.md in repo root):
//   1. Instagram account must be a Professional account (Business or Creator)
//   2. Create a Meta app, generate a long-lived access token
//   3. In Netlify: Site settings → Environment variables → add INSTAGRAM_ACCESS_TOKEN
//
// The token stays server-side — it is never exposed to the browser.

const FEED_LIMIT = 6; // number of posts shown on the homepage strip

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
    // Let browsers/CDN cache the feed for 1 hour to stay far under rate limits
    "Cache-Control": "public, max-age=3600",
  };

  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({ error: "Instagram feed not configured yet" }),
    };
  }

  try {
    // Request the most recent media for the authenticated account
    const fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp";
    const url =
      "https://graph.instagram.com/me/media" +
      `?fields=${fields}&limit=${FEED_LIMIT * 2}&access_token=${token}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok || data.error) {
      console.error("Instagram API error:", JSON.stringify(data.error || data));
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "Could not load Instagram feed" }),
      };
    }

    // Keep images and videos (videos use their thumbnail), skip anything odd,
    // and only pass the browser what it needs — never the token.
    const posts = (data.data || [])
      .map((post) => ({
        id: post.id,
        // Videos/reels: media_url may not be an image, use thumbnail_url
        image: post.media_type === "VIDEO" ? post.thumbnail_url : post.media_url,
        permalink: post.permalink,
        caption: post.caption ? post.caption.slice(0, 120) : "Instagram post by @clt_makeup1",
      }))
      .filter((post) => Boolean(post.image))
      .slice(0, FEED_LIMIT);

    return { statusCode: 200, headers, body: JSON.stringify({ posts }) };
  } catch (err) {
    console.error("Instagram feed fetch failed:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Could not load Instagram feed" }),
    };
  }
};
