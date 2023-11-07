const express = require('express');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');
const app = express();

const otpCache = {}; // Store OTPs temporarily

app.use(bodyParser.json());

// Helper function to generate a random 6-digit OTP (for testing purposes)
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate QR code logic
async function generateQRCode(empId) {
  return new Promise((resolve, reject) => {
    const otp = generateOTP();
    otpCache[empId] = otp; // Store the OTP in the cache

    // Generate the QR code data with the OTP placeholder
    const qrCodeData = `Employee ID: ${empId}, OTP: ${otp}`;

    QRCode.toDataURL(qrCodeData, (err, url) => {
      if (err) {
        reject(err);
      } else {
        resolve({ qrCodeUrl: url, otp });
      }
    });
  });
}

// Verify OTP logic
function verifyOTP(empId, userEnteredOTP) {
  const storedOTP = otpCache[empId];

  if (!storedOTP) {
    return { error: 'OTP not generated' };
  }

  if (userEnteredOTP !== storedOTP) {
    return { error: 'Invalid OTP' };
  }

  return null; // OTP is valid
}

// Generate QR code route
app.post('/generate-qr-code/:empId', async (req, res) => {
  try {
    const empId = req.params.empId;
    const result = await generateQRCode(empId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Verify OTP route
app.post('/verify-otp/:empId', (req, res) => {
  try {
    const empId = req.params.empId;
    const { userEnteredOTP } = req.body;
    const otpResult = verifyOTP(empId, userEnteredOTP);

    if (otpResult) {
      res.status(401).json(otpResult);
    } else {
      // If OTP is valid, return success or employee data
      res.status(200).json({ message: 'OTP is valid' });
      // Replace with returning employee data
    }
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
