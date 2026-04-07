const REPO_OWNER = process.env.GITHUB_REPO_OWNER || "DanSlingMan";
const REPO_NAME = process.env.GITHUB_REPO_NAME || "BeautyBrandsDigital";
const BRANCH = "main";
const IMAGE_PATH = "images/hero";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { password, action, images, filename } = body;

    if (password !== process.env.UPLOAD_PASSWORD) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: "Invalid password" }),
      };
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Server misconfigured — missing GitHub token" }),
      };
    }

    const ghHeaders = {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    };

    const apiBase = "https://api.github.com/repos/" + REPO_OWNER + "/" + REPO_NAME;

    // LIST: Get current hero images
    if (action === "list") {
      const res = await fetch(apiBase + "/contents/" + IMAGE_PATH + "?ref=" + BRANCH, {
        headers: ghHeaders,
      });

      if (res.status === 404) {
        return { statusCode: 200, headers, body: JSON.stringify({ images: [] }) };
      }

      if (!res.ok) {
        const err = await res.text();
        return { statusCode: res.status, headers, body: JSON.stringify({ error: err }) };
      }

      const files = await res.json();
      const imageFiles = files
        .filter(function(f) { return f.type === "file" && /\.(jpg|jpeg|png|webp)$/i.test(f.name); })
        .map(function(f) {
          return {
            name: f.name,
            sha: f.sha,
            size: f.size,
            download_url: f.download_url,
          };
        });

      return { statusCode: 200, headers, body: JSON.stringify({ images: imageFiles }) };
    }

    // UPLOAD: Commit new images
    if (action === "upload") {
      if (!images || !Array.isArray(images) || images.length === 0) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "No images provided" }) };
      }

      const results = [];

      for (var i = 0; i < images.length; i++) {
        var img = images[i];
        var filePath = IMAGE_PATH + "/" + img.name;

        var existingSha = null;
        try {
          var checkRes = await fetch(apiBase + "/contents/" + filePath + "?ref=" + BRANCH, {
            headers: ghHeaders,
          });
          if (checkRes.ok) {
            var existing = await checkRes.json();
            existingSha = existing.sha;
          }
        } catch (e) {}

        var commitBody = {
          message: "feat: add hero image " + img.name,
          content: img.content,
          branch: BRANCH,
        };
        if (existingSha) {
          commitBody.sha = existingSha;
          commitBody.message = "feat: update hero image " + img.name;
        }

        var uploadRes = await fetch(apiBase + "/contents/" + filePath, {
          method: "PUT",
          headers: ghHeaders,
          body: JSON.stringify(commitBody),
        });

        if (!uploadRes.ok) {
          var err = await uploadRes.text();
          results.push({ name: img.name, success: false, error: err });
        } else {
          results.push({ name: img.name, success: true });
        }
      }

      return { statusCode: 200, headers, body: JSON.stringify({ results: results }) };
    }

    // DELETE: Remove an image
    if (action === "delete") {
      if (!filename) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: "No filename provided" }) };
      }

      var delPath = IMAGE_PATH + "/" + filename;

      var delCheck = await fetch(apiBase + "/contents/" + delPath + "?ref=" + BRANCH, {
        headers: ghHeaders,
      });

      if (!delCheck.ok) {
        return { statusCode: 404, headers, body: JSON.stringify({ error: "File not found" }) };
      }

      var delExisting = await delCheck.json();

      var deleteRes = await fetch(apiBase + "/contents/" + delPath, {
        method: "DELETE",
        headers: ghHeaders,
        body: JSON.stringify({
          message: "feat: remove hero image " + filename,
          sha: delExisting.sha,
          branch: BRANCH,
        }),
      });

      if (!deleteRes.ok) {
        var delErr = await deleteRes.text();
        return { statusCode: deleteRes.status, headers, body: JSON.stringify({ error: delErr }) };
      }

      return { statusCode: 200, headers, body: JSON.stringify({ deleted: filename }) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown action" }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
