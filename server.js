const express = require("express");
const cors = require("cors");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(express.json()); // Parses incoming JSON

// Twilio config
const accountSid = 'AC8a09456c2f6f25c36224653d387374de';
const authToken = 'd500173b519f437e665238e3aa29a026'; // Never hardcode secrets in production
const serviceSid = 'VA1648382e6b0e636f7f06f5d0795e79ff';
const client = twilio(accountSid, authToken);

// POST /send-otp

app.post("/send-otp", (req, res) => {
    const { phone } = req.body;
  
    client.verify.v2.services(serviceSid)
      .verifications.create({ to: phone, channel: "sms" })
      .then(verification => {
        res.status(200).json({ success: true, message: "OTP sent", sid: verification.sid });
      })
      .catch(err => {
        console.error("OTP send error:", err.message);
        res.status(500).json({ success: false, message: "Failed to send OTP", error: err.message });
      });
  });
  
  // POST /verify-otp
  app.post("/verify-otp", (req, res) => {
    const { phone, code } = req.body;
  
    client.verify.v2.services(serviceSid)
      .verificationChecks.create({ to: phone, code })
      .then(verification_check => {
        if (verification_check.status === "approved") {
          res.status(200).json({ success: true, message: "OTP verified successfully" });
        } else {
          res.status(400).json({ success: false, message: "Invalid OTP" });
        }
      })
      .catch(err => {
        console.error("OTP verify error:", err.message);
        res.status(500).json({ success: false, message: "Verification failed", error: err.message });
      });
  });
  
// Start server
app.listen(3000, () => {
  console.log("Twilio server running at http://localhost:3000");
});
