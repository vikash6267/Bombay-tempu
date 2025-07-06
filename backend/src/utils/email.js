const nodemailer = require("nodemailer")

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email
    this.firstName = user.name.split(" ")[0]
    this.url = url
    this.from = `Transport Fleet Management <${process.env.EMAIL_FROM}>`
  }

  newTransport() {
    // if (process.env.NODE_ENV === "production") {
    //   // Production email service (e.g., SendGrid, Mailgun)
    //   return nodemailer.createTransport({
    //     service: "SendGrid",
    //     auth: {
    //       user: process.env.SENDGRID_USERNAME,
    //       pass: process.env.SENDGRID_PASSWORD,
    //     },
    //   })
    // }

    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    })
  }

  async send(template, subject) {
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: template,
    }

    await this.newTransport().sendMail(mailOptions)
  }

  async sendWelcome() {
    const template = `
      <h1>Welcome to Transport Fleet Management System!</h1>
      <p>Hi ${this.firstName},</p>
      <p>Welcome to Transport Fleet Management System! We're excited to have you on board.</p>
      <p>Please click the link below to verify your email address:</p>
      <a href="${this.url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If you didn't create an account, please ignore this email.</p>
      <p>Best regards,<br>Transport Fleet Management Team</p>
    `
    await this.send(template, "Welcome to Transport Fleet Management!")
  }

  async sendPasswordReset() {
    const template = `
      <h1>Password Reset Request</h1>
      <p>Hi ${this.firstName},</p>
      <p>You requested a password reset for your Transport Fleet Management account.</p>
      <p>Please click the link below to reset your password (valid for 10 minutes):</p>
      <a href="${this.url}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>Transport Fleet Management Team</p>
    `
    await this.send(template, "Your password reset token (valid for 10 min)")
  }

  async sendTripNotification(trip, type) {
    let template = ""
    let subject = ""

    switch (type) {
      case "trip_assigned":
        subject = `New Trip Assigned - ${trip.tripNumber}`
        template = `
          <h1>New Trip Assigned</h1>
          <p>Hi ${this.firstName},</p>
          <p>A new trip has been assigned to you:</p>
          <ul>
            <li><strong>Trip Number:</strong> ${trip.tripNumber}</li>
            <li><strong>Origin:</strong> ${trip.origin.city}, ${trip.origin.state}</li>
            <li><strong>Destination:</strong> ${trip.destination.city}, ${trip.destination.state}</li>
            <li><strong>Scheduled Date:</strong> ${new Date(trip.scheduledDate).toLocaleDateString()}</li>
          </ul>
          <p>Please log in to your dashboard for more details.</p>
        `
        break
      case "trip_completed":
        subject = `Trip Completed - ${trip.tripNumber}`
        template = `
          <h1>Trip Completed</h1>
          <p>Hi ${this.firstName},</p>
          <p>Trip ${trip.tripNumber} has been completed successfully.</p>
          <p>Thank you for your service!</p>
        `
        break
    }

    await this.send(template, subject)
  }
}



