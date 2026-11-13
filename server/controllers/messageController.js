import {
  addMessage,
  getMessages,
  deleteMessage,
} from "../models/messageModel.js";

import sendEmail from "../utils/sendEmail.js";
import { validateMessagePayload } from "../utils/messageValidation.js";

/*
   Create Contact Message
 */

export const createMessage = async (req, res, next) => {
  try {
    const validation = validateMessagePayload(req.body);

    if (!validation.ok) {
      return res.status(validation.status).json({
        success: false,
        message: validation.message,
      });
    }

    const { name, email, subject, message } = validation.data;

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
