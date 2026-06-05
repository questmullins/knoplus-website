"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { templates } from "@/data/templates";

type ContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplate?: string;
};

type FormStatus = {
  message: string;
  tone: "idle" | "success" | "error";
};

const initialStatus: FormStatus = {
  message: "",
  tone: "idle"
};

export function ContactModal({ isOpen, onClose, selectedTemplate = "" }: ContactModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const [projectKind, setProjectKind] = useState("Template");
  const [templateChoice, setTemplateChoice] = useState(selectedTemplate || templates[0]?.navTitle || "");
  const [status, setStatus] = useState<FormStatus>(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestClose = useCallback(() => {
    setIsVisible(false);
    window.setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setProjectKind("Template");
      setTemplateChoice(selectedTemplate || templates[0]?.navTitle || "");
      setShouldRender(true);
      const frame = window.requestAnimationFrame(() => setIsVisible(true));

      return () => window.cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => setShouldRender(false), 360);

    return () => window.clearTimeout(timeout);
  }, [isOpen, selectedTemplate]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        requestClose();
      }
    };

    document.body.classList.add("modal-open");
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [requestClose, shouldRender]);

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

  if (!shouldRender) {
    return null;
  }

  return (
    <div className={`contact-modal ${isVisible ? "open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
      <button className="contact-modal-backdrop" onClick={requestClose} type="button" aria-label="Close contact form" />

      <div className="contact-modal-panel">
        <div className="contact-modal-head">
          <div>
            <div className="eyebrow">Contact</div>
            <h2 id="contact-modal-title">Start the conversation.</h2>
          </div>
          <button className="modal-close" onClick={requestClose} type="button" aria-label="Close contact form">
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
              <select name="templateName" value={templateChoice} onChange={(event) => setTemplateChoice(event.target.value)}>
                {templates.map((template) => (
                  <option key={template.navTitle}>{template.navTitle}</option>
                ))}
              </select>
            </label>
          ) : null}

          <label className={projectKind === "Template" ? "contact-wide" : ""}>
            <span>Subject</span>
            <input
              name="subject"
              required
              type="text"
              defaultValue={selectedTemplate ? `Interested in ${selectedTemplate}` : ""}
            />
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
