import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Note: We use the SERVICE_ROLE_KEY to securely bypass RLS in this backend cron job.
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Only allow GET or POST (Vercel cron sends GET/POST depending on config)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Fetch Today's Data
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: reports, error: reportsError } = await supabase
      .from('daily_reports')
      .select('*')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    const { data: expenses, error: expensesError } = await supabase
      .from('daily_expenses')
      .select('*')
      .gte('created_at', startOfDay.toISOString())
      .lte('created_at', endOfDay.toISOString());

    if (reportsError) console.error("Error fetching reports:", reportsError);
    if (expensesError) console.error("Error fetching expenses:", expensesError);

    // 2. Process Data for Summary
    const totalExpenses = (expenses || []).reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    
    // Process Production Run (Sum of quantities produced today)
    let totalProduction = 0;
    if (reports && reports.length > 0) {
      reports.forEach(report => {
        if (report.data && report.data['Box-up']) {
           totalProduction += report.data['Box-up'].totalProduced || 0;
        }
      });
    }

    // 3. Build HTML Email
    const currentDateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="background-color: #f8fafc; padding: 40px 20px; margin: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <div style="background-color: #1e1b4b; padding: 24px; text-align: center; border-bottom: 4px solid #6366f1;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px;">Volt<span style="color: #6366f1;">Forge</span></h1>
          <p style="color: #a5b4fc; margin: 8px 0 0 0; font-size: 14px;">Automated Daily Intelligence</p>
        </div>

        <div style="padding: 32px 24px;">
          <h2 style="margin-top: 0; color: #111827; font-size: 20px;">Daily Report & Summary</h2>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Hello Team,</p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Here is the automated End-of-Day Summary for <strong>${currentDateStr}</strong>.</p>
          
          <div style="margin: 32px 0; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
              <thead>
                <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                  <th style="padding: 12px 16px; color: #374151; font-weight: 600;">Metric</th>
                  <th style="padding: 12px 16px; color: #374151; font-weight: 600;">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 16px; color: #4b5563;">Total Production Run</td>
                  <td style="padding: 12px 16px; color: #111827; font-weight: 500;">${totalProduction} Units</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 16px; color: #4b5563;">Daily Reports Logged</td>
                  <td style="padding: 12px 16px; color: #111827; font-weight: 500;">${reports ? reports.length : 0} Reports</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px 16px; color: #4b5563;">Total Daily Expenses</td>
                  <td style="padding: 12px 16px; color: #111827; font-weight: 500;">&#8377;${totalExpenses.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="text-align: center; margin: 32px 0;">
            <a href="https://transformers.vercel.app/daily-reports" style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">View Full Details & Download PDF</a>
          </div>

        </div>

        <div style="background-color: #f3f4f6; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; margin: 0; font-size: 12px;">This is an automated message sent from the VoltForge ERP System.</p>
        </div>
      </div>
    </body>
    </html>
    `;

    // 4. Send Email via Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: `"VoltForge Automated System" <${process.env.EMAIL_USER}>`,
      to: "info@jrtransformer.com", // Recipient
      subject: `VoltForge Daily Summary - ${currentDateStr}`,
      html: htmlContent
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully: ", info.messageId);

    return res.status(200).json({ success: true, message: 'Cron job executed and email sent successfully!' });

  } catch (error) {
    console.error("Cron Job Error:", error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
