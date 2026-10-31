import { EmailMessage } from "cloudflare:email";
import { recordAnalytics } from './server/analytics.js';
import { handleClients } from "./server/clients.js";
import { handleAnnex, scheduledAnnex } from "./annex/src/index.js";
import offeringGroups from "./nextjs-elements/data/offerings.json";

const CONTACT_TO_FALLBACK = "info@kno.plus";
const CONTACT_FROM_FALLBACK = "Knoplus <info@kno.plus>";
const MAX_BODY_BYTES = 24 * 1024;
const OFFERINGS = offeringGroups.flatMap(group => group.options.map(option => option.label));
const TEMPLATE_OFFERING = "Website from a template";

// RoseWave has its own site now: its project page and the print store (and the older gallery addresses) go there.
const ROSEWAVE = "https://rosewave.art/";
const rosewavePage = /^\/(?:store(?:\/.*)?|work\/rosewave|revamp\/rosewave(?:\/horizontal|\/gallery(?:\/.*)?)?)$/;

// Pages that moved when the project showcase became the home page (assets under /revamp/ stay where they are).
function movedTo(path) {
  if (/\.[a-z0-9]+$/i.test(path)) return "";
  const p = path.replace(/\/+$/, "") || "/";
  if (rosewavePage.test(p)) return ROSEWAVE;
  if (p === "/revamp" || p === "/work") return "/";
  if (p === "/manage") return "/annex/";
  if (p === "/pricing") return "/websites";
  if (p === "/about" || p === "/process") return "/";
  const project = /^\/revamp\/([a-z0-9-]+)(?:\/horizontal)?$/.exec(p);
  return project ? "/work/" + project[1] : "";
}

export default {
  async scheduled(event, env, ctx) {
    await scheduledAnnex(env, ctx);
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === "manage.kno.plus") return Response.redirect("https://kno.plus/annex/", 301);
    const annexResponse = await handleAnnex(request, env, ctx);
    if (annexResponse) return annexResponse;
    const clientResponse = await handleClients(request, env);
    if (clientResponse) return clientResponse;
    const moved = movedTo(url.pathname);
    if (moved === ROSEWAVE) return Response.redirect(ROSEWAVE, 301);
    if (moved) return Response.redirect(url.origin + moved + url.search, 301);

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

      const response = await handleContact(request, env);
      if (response.status === 200) ctx.waitUntil(recordAnalytics(request, env, response, "contact").catch(() => console.error("analytics_write_failed")));
      return response;
    }

    const response = await env.ASSETS.fetch(request);
    ctx.waitUntil(recordAnalytics(request, env, response).catch(() => console.error("analytics_write_failed")));
    return response;
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
    topic: clean(payload?.topic),
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

  if (!OFFERINGS.includes(contact.topic)) {
    return "Please choose what your message is about.";
  }

  if (contact.topic === TEMPLATE_OFFERING && !contact.templateName) {
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
      subject: `Knoplus contact (${contact.topic}): ${contact.subject}`,
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
    `Subject: Knoplus contact (${contact.topic}): ${contact.subject}`,
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
    `About: ${contact.topic}`,
    ...(contact.topic === TEMPLATE_OFFERING ? [`Template: ${contact.templateName || "Not provided"}`] : []),
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
