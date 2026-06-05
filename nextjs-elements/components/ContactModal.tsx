"use client";

import { FormEvent, useEffect, useState } from "react";
import { templates } from "@/data/templates";

type ContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type FormStatus = {
  message: string;
  tone: "idle" | "success" | "error";
};

const initialStatus: FormStatus = {
  message: "",
  tone: "idle"
};

export function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [projectKind, setProjectKind] = useState("Template");
  const [status, setStatus] = useState<FormStatus>(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, onClose]);

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus(initialStatus);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      firstName: String(formData.get("firstName") || "").trim(),
      lastName: String(formData.get("lastName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      projectKind: String(formData.get("projectKind") || "").trim(),
      templateName: String(formData.get("templateName") || "").trim(),
      subject: String(formData.get("subject") || "").trim(),
      body: String(formData.get("body") || "").trim(),
      website: String(formData.get("website") || "").trim()
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => ({ message: "" }));

      if (!response.ok) {
        throw new Error(result.message || "The message could not be sent yet.");
      }

      form.reset();
      setProjectKind("Template");
      setStatus({
        message: "Message received. We will get back to you soon.",
        tone: "success"
      });
    } catch (error) {
      setStatus({
        message:
          error instanceof Error
            ? error.message
            : "The message could not be sent yet. You can still email quest@kno.plus directly.",
        tone: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="contact-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
      <button className="contact-modal-backdrop" onClick={onClose} type="button" aria-label="Close contact form" />

      <div className="contact-modal-panel">
        <div className="contact-modal-head">
          <div>
            <div className="eyebrow">Contact</div>
            <h2 id="contact-modal-title">Start the conversation.</h2>
          </div>
          <button className="modal-close" onClick={onClose} type="button" aria-label="Close contact form">
            <span className="plus" />
          </button>
        </div>

        <form className="contact-form" onSubmit={submitContact}>
          <input aria-hidden="true" autoComplete="off" className="contact-honeypot" name="website" tabIndex={-1} />

          <label>
            <span>First Name</span>
            <input name="firstName" required type="text" />
          </label>

          <label>
            <span>Last Name</span>
            <input name="lastName" required type="text" />
          </label>

          <label className="contact-wide">
            <span>Email</span>
            <input name="email" required type="email" />
          </label>

          <label>
            <span>Build Type</span>
            <select
              name="projectKind"
              value={projectKind}
              onChange={(event) => setProjectKind(event.target.value)}
            >
              <option>Template</option>
              <option>Custom</option>
            </select>
          </label>

          {projectKind === "Template" ? (
            <label>
              <span>Template</span>
              <select name="templateName">
                {templates.map((template) => (
                  <option key={template.navTitle}>{template.navTitle}</option>
                ))}
              </select>
            </label>
          ) : null}

          <label className={projectKind === "Template" ? "contact-wide" : ""}>
            <span>Subject</span>
            <input name="subject" required type="text" />
          </label>

          <label className="contact-message">
            <span>Body</span>
            <textarea name="body" required rows={6} />
          </label>

          <div className="contact-submit-row">
            <button className="cta-button" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Sending" : "Send Message"}
            </button>
            {status.message ? <p className={`contact-status ${status.tone}`}>{status.message}</p> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
