require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const nodemailer = require("nodemailer");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { Buffer } = require("buffer"); // Required for handling base64 data
const fs = require('fs');


const app = express();
const PORT = process.env.PORT || 3000;

// Set the limit for the request body
app.use(express.json({ limit: "10mb" })); // Adjust the limit as needed
app.use(express.urlencoded({ limit: "10mb", extended: true })); // For URL-encoded data
app.use(express.static(__dirname));

// Set the limit for the request body

// CORS options
const corsOptions = {
  origin: "*", // Allow all origins for testing; change this in production
  methods: ["POST", "GET"],
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json()); // Allow parsing of JSON request bodies

// Set the absolute path to the front-end directory
const frontendPath = path.resolve(
  "/Users/kimdo/Documents/CreativeCode24/Rotats"
);
app.use(express.static(frontendPath));

// Route for the root URL to serve about.html
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "about.html"));
});

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

// Route for sending multiple emails
app.post("/send-emails", async (req, res) => {
  const emails = req.body; // Expecting an array of email details

  try {
    for (const { to, subject, text, image } of emails) {
      // Decode the base64 image data
      const base64Data = image.replace(/^data:image\/jpeg;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        attachments: [
          {
            filename: "sketch.jpeg",
            content: imageBuffer,
          },
        ],
      };

      await transporter.sendMail(mailOptions); // Send each email
    }

    res.status(200).send("Emails sent successfully."); // Send success response
  } catch (error) {
    console.error("Error sending emails:", error);
    res.status(500).send("Failed to send emails."); // Send error response
  }
});

// read songs in the audio folder
app.get('/audio-files', (req, res) => {
  const audioDir = path.join(__dirname, 'audio');
  fs.readdir(audioDir, (err, files) => {
    if (err) {
      return res.status(500).send('Unable to scan directory');
    }
    const audioFiles = files
      .filter(file => path.extname(file).toLowerCase() === '.mp3')
      .map(file => ({ name: path.basename(file, '.mp3'), src: `/audio/${file}` }));
    res.json(audioFiles);
  });
});

// Start your express server
app.listen(PORT, () => {
  console.log("Server is listening on port 3000");
});
