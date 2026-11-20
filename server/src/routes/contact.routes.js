import express from "express";
import ContactInquiry from "../models/ContactInquiry.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9+\-\s]{10,15}$/;

router.post("/", async (req, res) => {
  try {
    const { name, email = "", phone = "", subject = "", message } = req.body;

    if (!name?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and message are required.",
      });
    }

    if (name.trim().length < 2 || name.trim().length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 80 characters.",
      });
    }

    if (message.trim().length < 10 || message.trim().length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Message must be between 10 and 3000 characters.",
      });
    }

    if (!email.trim() && !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide an email address or phone number.",
      });
    }

    if (email && !emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (phone && !phoneRegex.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid phone number.",
      });
    }

    if (subject.length > 120) {
      return res.status(400).json({
        success: false,
        message: "Subject cannot exceed 120 characters.",
      });
    }

    const inquiry = await ContactInquiry.create({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subject: subject.trim() || "General Enquiry",
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Thank you! Your enquiry has been submitted successfully.",
      inquiryId: inquiry._id,
    });
  } catch (error) {
    console.error("Contact API error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while submitting your enquiry.",
    });
  }
});

// GET /api/contact
router.get("/", protect, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "all" } = req.query;

    const currentPage = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(100, Math.max(1, Number(limit) || 10));

    const filter = {};

    // Filter by lead status
    if (status !== "all") {
      filter.status = status;
    }

    // Search by name, email, phone or subject
    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { phone: { $regex: search.trim(), $options: "i" } },
        { subject: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const [leads, total] = await Promise.all([
      ContactInquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageLimit)
        .limit(pageLimit)
        .lean(),

      ContactInquiry.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      message: "Leads fetched successfully",
      data: leads,
      pagination: {
        total,
        page: currentPage,
        limit: pageLimit,
        totalPages: Math.ceil(total / pageLimit),
      },
    });
  } catch (error) {
    console.error("Get contact leads error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
});

// GET /api/contact/stats
router.get("/stats", protect, async (req, res) => {
  try {
    const stats = await ContactInquiry.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const result = {
      total: 0,
      new: 0,
      contacted: 0,
      converted: 0,
      closed: 0,
    };

    stats.forEach((item) => {
      result[item._id] = item.count;
      result.total += item.count;
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lead stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch lead statistics",
    });
  }
});

export default router;
