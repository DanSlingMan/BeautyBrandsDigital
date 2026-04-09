// netlify/functions/check-availability.js
// Reads Miriam's Google Calendar and returns available time slots for a given date

const SCOPES = ["https://www.googleapis.com/auth/calendar.readonly"];
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "miriam@cltmakeup.com";

// Miriam's working hours and slot config
const WORK_START = 8;  // 8:00 AM
const WORK_END = 17;   // 5:00 PM (last slot starts at 4:30)
const SLOT_DURATION = 30; // minutes
const BLOCKED_DAYS = [0]; // Sunday = 0
const MIN_ADVANCE_DAYS = 7; // 7-day minimum booking buffer
const TIMEZONE = "America/New_York";

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
    var body = JSON.parse(event.body);
    var requestedDate = body.date; // format: "2026-05-15"

    if (!requestedDate) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Date is required" }) };
    }

    // Validate date
    var dateObj = new Date(requestedDate + "T12:00:00");
    var today = new Date();

    // Check minimum advance booking
    var minDate = new Date();
    minDate.setDate(minDate.getDate() + MIN_ADVANCE_DAYS);
    minDate.setHours(0, 0, 0, 0);

    if (dateObj < minDate) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ slots: [], message: "Bookings require at least 7 days advance notice" }),
      };
    }

    // Check blocked days
    if (BLOCKED_DAYS.includes(dateObj.getDay())) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ slots: [], message: "Not available on this day" }),
      };
    }

    // Get Google Calendar access token
    var accessToken = await getGoogleAccessToken();

    // Fetch events for the requested date
    var startOfDay = requestedDate + "T00:00:00-04:00";
    var endOfDay = requestedDate + "T23:59:59-04:00";

    var calUrl = "https://www.googleapis.com/calendar/v3/calendars/" +
      encodeURIComponent(CALENDAR_ID) +
      "/events?timeMin=" + encodeURIComponent(startOfDay) +
      "&timeMax=" + encodeURIComponent(endOfDay) +
      "&singleEvents=true&orderBy=startTime&timeZone=" + TIMEZONE;

    var calRes = await fetch(calUrl, {
      headers: { Authorization: "Bearer " + accessToken },
    });

    if (!calRes.ok) {
      var errText = await calRes.text();
      console.log("Calendar API error:", errText);
      return { statusCode: 500, headers, body: JSON.stringify({ error: "Failed to check calendar" }) };
    }

    var calData = await calRes.json();
    var events = calData.items || [];

    // Build busy periods from existing events
    var busyPeriods = [];
    for (var i = 0; i < events.length; i++) {
      var evt = events[i];
      if (evt.status === "cancelled") continue;

      var evtStart, evtEnd;
      if (evt.start.dateTime) {
        evtStart = new Date(evt.start.dateTime);
        evtEnd = new Date(evt.end.dateTime);
      } else {
        // All-day event — entire day is blocked
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ slots: [], message: "Fully booked on this date" }),
        };
      }
      busyPeriods.push({ start: evtStart.getTime(), end: evtEnd.getTime() });
    }

    // Generate available slots
    var slots = [];
    var slotDate = new Date(requestedDate + "T00:00:00");

    for (var hour = WORK_START; hour < WORK_END; hour++) {
      for (var min = 0; min < 60; min += SLOT_DURATION) {
        var slotStart = new Date(slotDate);
        slotStart.setHours(hour, min, 0, 0);

        var slotEnd = new Date(slotStart);
        slotEnd.setMinutes(slotEnd.getMinutes() + SLOT_DURATION);

        // Don't generate slots past work end
        if (slotEnd.getHours() > WORK_END || (slotEnd.getHours() === WORK_END && slotEnd.getMinutes() > 0)) {
          continue;
        }

        // Check if this slot overlaps any busy period
        var slotStartMs = slotStart.getTime();
        var slotEndMs = slotEnd.getTime();
        var isBusy = false;

        for (var b = 0; b < busyPeriods.length; b++) {
          if (slotStartMs < busyPeriods[b].end && slotEndMs > busyPeriods[b].start) {
            isBusy = true;
            break;
          }
        }

        // Format time for display
        var displayHour = hour > 12 ? hour - 12 : hour;
        var ampm = hour >= 12 ? "PM" : "AM";
        var displayMin = min === 0 ? "00" : String(min);
        var timeStr = displayHour + ":" + displayMin + " " + ampm;

        slots.push({
          time: timeStr,
          start: slotStart.toISOString(),
          available: !isBusy,
        });
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        date: requestedDate,
        slots: slots,
        timezone: TIMEZONE,
      }),
    };
  } catch (err) {
    console.log("Error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};

// ── Google Auth via Service Account ──
async function getGoogleAccessToken() {
  var keyData = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

  // Build JWT
  var header = { alg: "RS256", typ: "JWT" };
  var now = Math.floor(Date.now() / 1000);
  var claim = {
    iss: keyData.client_email,
    scope: SCOPES.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  var headerB64 = base64url(JSON.stringify(header));
  var claimB64 = base64url(JSON.stringify(claim));
  var unsignedToken = headerB64 + "." + claimB64;

  // Sign with RSA
  var crypto = require("crypto");
  var sign = crypto.createSign("RSA-SHA256");
  sign.update(unsignedToken);
  var signature = sign.sign(keyData.private_key, "base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  var jwt = unsignedToken + "." + signature;

  // Exchange JWT for access token
  var tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + jwt,
  });

  if (!tokenRes.ok) {
    var errText = await tokenRes.text();
    throw new Error("Google auth failed: " + errText);
  }

  var tokenData = await tokenRes.json();
  return tokenData.access_token;
}

function base64url(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
