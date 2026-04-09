// netlify/functions/create-booking.js
// Charges the 50% deposit via Square Payments API
// Creates a calendar event on Miriam's Google Calendar
// Returns confirmation details

var crypto = require("crypto");

var SQUARE_BASE = "https://connect.squareup.com/v2";
var CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "miriam@cltmakeup.com";
var TIMEZONE = "America/New_York";

var SERVICES = {
  bridal:     { name: "Bridal Package", price: 25000, duration: 120 },
  party:      { name: "Bridal Party (per person)", price: 10000, duration: 90 },
  trial:      { name: "Trial Session", price: 10000, duration: 120 },
  engagement: { name: "Engagement Session", price: 17500, duration: 90 },
};

exports.handler = async (event) => {
  var headers = {
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
    var service = body.service;
    var date = body.date;
    var time = body.time;
    var slotStart = body.slotStart;
    var firstName = body.firstName;
    var lastName = body.lastName;
    var email = body.email;
    var phone = body.phone;
    var weddingDate = body.weddingDate;
    var venue = body.venue;
    var notes = body.notes;
    var sourceId = body.sourceId;
    var partySize = body.partySize;

    if (!service || !date || !time || !firstName || !lastName || !email || !sourceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    var svc = SERVICES[service];
    if (!svc) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid service" }) };
    }

    var totalCents = svc.price;
    if (service === "party" && partySize) {
      totalCents = svc.price * parseInt(partySize);
    }
    var depositCents = Math.round(totalCents / 2);

    // ── Step 1: Charge deposit via Square ──
    var idempotencyKey = crypto.randomUUID();

    var paymentBody = {
      idempotency_key: idempotencyKey,
      source_id: sourceId,
      amount_money: {
        amount: depositCents,
        currency: "USD",
      },
      location_id: process.env.SQUARE_LOCATION_ID,
      note: "CLT Makeup — " + svc.name + " deposit for " + firstName + " " + lastName,
      buyer_email_address: email,
    };

    var payRes = await fetch(SQUARE_BASE + "/payments", {
      method: "POST",
      headers: {
        "Square-Version": "2024-01-18",
        Authorization: "Bearer " + process.env.SQUARE_ACCESS_TOKEN,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentBody),
    });

    var payData = await payRes.json();

    if (!payRes.ok || (payData.errors && payData.errors.length > 0)) {
      var errMsg = "Payment failed";
      if (payData.errors && payData.errors[0]) {
        errMsg = payData.errors[0].detail || payData.errors[0].code;
      }
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: errMsg }),
      };
    }

    var paymentId = payData.payment.id;
    var receiptUrl = payData.payment.receipt_url;

    // ── Step 2: Create Google Calendar event ──
    var accessToken = await getGoogleAccessToken();

    var eventStart = slotStart || buildEventStart(date, time);
    var eventStartDate = new Date(eventStart);
    var eventEndDate = new Date(eventStartDate);
    eventEndDate.setMinutes(eventEndDate.getMinutes() + svc.duration);

    var serviceName = svc.name;
    if (service === "party" && partySize) {
      serviceName = "Bridal Party (" + partySize + " people)";
    }

    var calEvent = {
      summary: "CLT Makeup — " + serviceName + " — " + firstName + " " + lastName,
      description: [
        "Service: " + serviceName,
        "Client: " + firstName + " " + lastName,
        "Email: " + email,
        "Phone: " + (phone || "Not provided"),
        "Wedding Date: " + (weddingDate || "Not provided"),
        "Venue: " + (venue || "Not provided"),
        "Notes: " + (notes || "None"),
        "",
        "Payment: $" + (depositCents / 100).toFixed(2) + " deposit collected",
        "Remaining balance: $" + ((totalCents - depositCents) / 100).toFixed(2),
        "Square Payment ID: " + paymentId,
        receiptUrl ? "Receipt: " + receiptUrl : "",
      ].join("\n"),
      start: {
        dateTime: eventStartDate.toISOString(),
        timeZone: TIMEZONE,
      },
      end: {
        dateTime: eventEndDate.toISOString(),
        timeZone: TIMEZONE,
      },
      attendees: [
        { email: email, displayName: firstName + " " + lastName },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 1440 },
          { method: "popup", minutes: 60 },
        ],
      },
    };

    var calRes = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/" +
        encodeURIComponent(CALENDAR_ID) +
        "/events?sendUpdates=all",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(calEvent),
      }
    );

    var calCreated = true;
    if (!calRes.ok) {
      calCreated = false;
      var calErr = await calRes.text();
      console.log("Calendar event creation failed:", calErr);
    }

    // ── Step 3: Return confirmation ──
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        confirmation: {
          service: serviceName,
          date: date,
          time: time,
          name: firstName + " " + lastName,
          email: email,
          totalPrice: "$" + (totalCents / 100).toFixed(2),
          depositCharged: "$" + (depositCents / 100).toFixed(2),
          remainingBalance: "$" + ((totalCents - depositCents) / 100).toFixed(2),
          paymentId: paymentId,
          receiptUrl: receiptUrl || null,
          calendarEventCreated: calCreated,
        },
      }),
    };
  } catch (err) {
    console.log("Booking error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Booking failed: " + err.message }),
    };
  }
};

function buildEventStart(date, timeStr) {
  var parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!parts) return date + "T10:00:00";
  var hour = parseInt(parts[1]);
  var min = parseInt(parts[2]);
  var ampm = parts[3].toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return date + "T" + String(hour).padStart(2, "0") + ":" + String(min).padStart(2, "0") + ":00";
}

async function getGoogleAccessToken() {
  var keyData = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  var header = { alg: "RS256", typ: "JWT" };
  var now = Math.floor(Date.now() / 1000);
  var claim = {
    iss: keyData.client_email,
    scope: "https://www.googleapis.com/auth/calendar",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  var headerB64 = base64url(JSON.stringify(header));
  var claimB64 = base64url(JSON.stringify(claim));
  var unsignedToken = headerB64 + "." + claimB64;
  var sign = crypto.createSign("RSA-SHA256");
  sign.update(unsignedToken);
  var signature = sign.sign(keyData.private_key, "base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  var jwt = unsignedToken + "." + signature;
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
  return Buffer.from(str).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
