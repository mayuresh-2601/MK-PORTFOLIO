import {
  addMessage,
  getMessages,
  deleteMessage,
} from "../models/messageModel.js";

import sendEmail from "../utils/sendEmail.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_SUBJECT = "Portfolio Contact Form";

/*
   Create Contact Message
 */

export const createMessage = async (req, res, next) => {
  try {
    let { name, email, subject, message } = req.body || {};

    // Reject malformed JSON types before calling `.trim()`. Without this a
    // payload like {"name":123,...} would throw a TypeError and return 500.
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      (subject !== undefined &&
        subject !== null &&
        typeof subject !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }

    name = name.trim();
    email = email.trim();
    subject = (subject || "").trim() || DEFAULT_SUBJECT;
    message = message.trim();

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required.",
      });
    }

    // Validate lengths before writing to the database
    if (name.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Name must be 100 characters or fewer.",
      });
    }

    if (email.length > 150 || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (subject.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Subject must be 200 characters or fewer.",
      });
    }

    if (message.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Message must be 5000 characters or fewer.",
      });
    }

    // Save message to database
    const result = await addMessage({
      name,
      email,
      subject,
      message,
    });

    // Send email notification. The message is already saved, so a mail
    // failure must not turn a successful contact submission into a 500.
    try {
      await sendEmail({
        name,
        email,
        subject,
        message,
        file: req.file,
      });
    } catch (emailError) {
      console.warn(
        "Email notification failed:",
        emailError.message
      );
    }

    return res.status(201).json({
      success: true,
      message: "Message sent successfully.",
      id: result.id,
    });
  } catch (error) {
    next(error);
  }
};

/*
   Get All Messages
 */

export const fetchMessages = async (req, res, next) => {
  try {
    const messages = await getMessages();

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/*
   Delete Message
 */

export const removeMessage = async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID.",
      });
    }

    const result = await deleteMessage(id);

    if (!result.affectedRows) {
      return res.status(404).json({
        success: false,
        message: "Message not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
