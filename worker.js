import { EmailMessage } from "cloudflare:email";

const CONTACT_TO_FALLBACK = "info@kno.plus";
const CONTACT_FROM_FALLBACK = "Knoplus <info@kno.plus>";
const MAX_BODY_BYTES = 24 * 1024;

// The website service moved under /websites when kno.plus became the project hub; old links redirect permanently.
const MOVED_PAGES = new Map([
  ["/about", "/websites/about"],
  ["/process", "/websites/process"],
  ["/pricing", "/websites/pricing"],
  ["/small-business-websites", "/websites/small-business-websites"],
  ["/automotive-website-templates", "/websites/automotive-website-templates"],
  ["/home-services-website-templates", "/websites/home-services-website-templates"],
  ["/website-care-plans", "/websites/website-care-plans"]
]);

function movedLocation(url) {
  const path = url.pathname.replace(/\/+$/, "").replace(/\.html$/, "") || "/";
  const target = MOVED_PAGES.get(path);

  if (target) {
    return target + url.search;
  }

  if (url.pathname === "/instapost" || url.pathname.startsWith("/instapost/")) {
    return "/webtools" + url.pathname + url.search;
  }

  // The old homepage opened the contact form from template previews with ?contact=template.
  if (url.pathname === "/" && url.searchParams.has("contact")) {
    return "/websites" + url.search;
  }

  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const moved = movedLocation(url);

    if (moved) {
      return Response.redirect(new URL(moved, url).toString(), 301);
    }

    if (url.pathname === "/update-config" || url.pathname === "/update-config/") {
      if (request.method !== "GET" && request.method !== "HEAD") {
        return new Response("Method not allowed.", { status: 405 });
      }
      const assetUrl = new URL("/update-config/", url);
      const response = await env.ASSETS.fetch(new Request(assetUrl, request));
      const headers = new Headers(response.headers);
      headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
      headers.set("Cache-Control", "no-store");
      return new Response(response.body, { status: response.status, headers });
    }

    if (url.pathname === "/api/contact") {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders(request) });
      }

      if (request.method !== "POST") {
        return jsonResponse({ message: "Method not allowed." }, 405, request);
      }

      return handleContact(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function handleContact(request, env) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);

    if (contentLength > MAX_BODY_BYTES) {
      return jsonResponse({ message: "That message is a little too large." }, 413, request);
    }

    const payload = await request.json();
    const contact = normalizeContact(payload);

    if (contact.website) {
      return jsonResponse({ ok: true, message: "Message received." }, 202, request);
    }

    const validationError = validateContact(contact);

    if (validationError) {
      return jsonResponse({ message: validationError }, 400, request);
    }

    await sendContactEmail(contact, env);

    return jsonResponse({ ok: true, message: "Message received." }, 202, request);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "contact_form_error",
        message: error instanceof Error ? error.message : "Unknown contact form error"
      })
    );

    return jsonResponse(
      {
        message:
          "The contact form is not fully configured yet. You can still email info@kno.plus directly."
      },
      503,
      request
    );
  }
}

function normalizeContact(payload) {
  return {
    firstName: clean(payload?.firstName),
    lastName: clean(payload?.lastName),
    email: clean(payload?.email),
    projectKind: clean(payload?.projectKind),
    templateName: clean(payload?.templateName),
    subject: clean(payload?.subject),
    body: clean(payload?.body),
    website: clean(payload?.website)
  };
}

function validateContact(contact) {
  if (!contact.firstName) {
    return "Please add your first name.";
  }

  if (!contact.lastName) {
    return "Please add your last name.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) {
    return "Please add a valid email address.";
  }

  if (!["Template", "Custom"].includes(contact.projectKind)) {
    return "Please choose template or custom.";
  }

  if (contact.projectKind === "Template" && !contact.templateName) {
    return "Please choose a template.";
  }

  if (!contact.subject) {
    return "Please add a subject.";
  }

  if (!contact.body || contact.body.length < 12) {
    return "Please add a few more details to the body.";
  }

  return "";
}

function clean(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 4000);
}

async function sendContactEmail(contact, env) {
  if (env.RESEND_API_KEY) {
    await sendWithResend(contact, env);
    return;
  }

  if (env.EMAIL && typeof env.EMAIL.send === "function") {
    const to = env.CONTACT_TO || CONTACT_TO_FALLBACK;
    const from = env.CONTACT_FROM || CONTACT_FROM_FALLBACK;
    await env.EMAIL.send(new EmailMessage(from, to, buildMimeMessage(contact, from, to)));
    return;
  }

  throw new Error("No email provider configured.");
}

async function sendWithResend(contact, env) {
  const to = env.CONTACT_TO || CONTACT_TO_FALLBACK;
  const from = env.CONTACT_FROM || CONTACT_FROM_FALLBACK;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: contact.email,
      subject: `Knoplus contact: ${contact.subject}`,
      text: buildPlainTextMessage(contact)
    })
  });

  if (!response.ok) {
    throw new Error(`Email provider rejected the message with ${response.status}.`);
  }
}

function buildMimeMessage(contact, from, to) {
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Reply-To: ${contact.email}`,
    `Subject: Knoplus contact: ${contact.subject}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    buildPlainTextMessage(contact)
  ].join("\r\n");
}

function buildPlainTextMessage(contact) {
  return [
    "New Knoplus contact form submission",
    "",
    `Name: ${contact.firstName} ${contact.lastName}`,
    `Email: ${contact.email}`,
    `Build Type: ${contact.projectKind}`,
    `Template: ${contact.projectKind === "Template" ? contact.templateName || "Not provided" : "N/A"}`,
    `Subject: ${contact.subject}`,
    "",
    "Body:",
    contact.body
  ].join("\n");
}

function jsonResponse(body, status, request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request)
    }
  });
}

function corsHeaders(request) {
  const origin = request.headers.get("origin") || "";
  const requestUrl = new URL(request.url);
  const allowedOrigin = origin && new URL(origin).host === requestUrl.host ? origin : requestUrl.origin;

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin"
  };
}
