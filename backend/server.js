const express = require('express');
const mqtt = require('mqtt');
const nodemailer = require('nodemailer');
const app = express();

// Kết nối MQTT
const mqttClient = mqtt.connect('mqtt://localhost'); // Địa chỉ broker MQTT
mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('HKT_greenhouse/#'); // Đăng ký theo dõi tất cả các topic của greenhouse
});

// Xử lý các thông điệp nhận được từ MQTT
mqttClient.on('message', (topic, message) => {
  console.log(`Received message from ${topic}: ${message.toString()}`);

  // Ví dụ: Xử lý các thông điệp và gửi email nếu cần
  if (topic === 'HKT_greenhouse/watering') {
    // Gửi email khi cần thiết
    sendEmail({
      to: 'your-email@example.com',
      subject: 'Watering Alert',
      text: 'Water level is low. Please refill the water tank.',
    });
  }

  // Cập nhật trạng thái thiết bị trong cơ sở dữ liệu (nếu cần)
});

// Hàm gửi email khi có thông báo
function sendEmail(emailData) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'your-email@gmail.com',
      pass: 'your-email-password',
    },
  });

  transporter.sendMail({
    from: 'your-email@gmail.com',
    to: emailData.to,
    subject: emailData.subject,
    text: emailData.text,
  }, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

// API để nhận thông tin từ frontend
app.get('/api/status', (req, res) => {
  res.json({
    humidity: 45, // Ví dụ: Trả về thông tin độ ẩm
    temperature: 23, // Trả về nhiệt độ
    rain: 50, // Trả về lượng mưa
    // Cung cấp thông tin trạng thái thiết bị
  });
});

// Lắng nghe API
app.listen(3001, () => {
  console.log('Backend server running on http://localhost:3001');
});
