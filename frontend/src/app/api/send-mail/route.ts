import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(req) {
  try {
    const { to, subject, text, html } = await req.json();

    const msg = {
      to,
      from: process.env.SENDGRID_SENDER_EMAIL,
      subject,
      text,
      html,
    };

    const response = await sgMail.send(msg);
    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('SendGrid error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}