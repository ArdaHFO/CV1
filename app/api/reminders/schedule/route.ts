import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServerUserId } from '@/lib/auth/server-user';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Lazy-initialize Resend so a missing env var fails at request time, not at build time
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ success: false, error: 'Email service not configured' }, { status: 503 });
  }
  const resend = new Resend(resendKey);

  try {
    const userId = await getServerUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as {
      jobTitle: string;
      company: string;
      reminderAt: string; // ISO datetime string e.g. "2026-02-20T14:00"
    };

    const { jobTitle, company, reminderAt } = body;

    if (!jobTitle || !company || !reminderAt) {
      return NextResponse.json(
        { success: false, error: 'jobTitle, company and reminderAt are required' },
        { status: 400 }
      );
    }

    // Get user email from Supabase auth
    const supabase = await createSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Could not connect to database' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return NextResponse.json({ success: false, error: 'User email not found' }, { status: 400 });
    }

    const userEmail = user.email;

    // Parse reminder datetime
    const reminderDate = new Date(reminderAt);
    if (isNaN(reminderDate.getTime())) {
      return NextResponse.json({ success: false, error: 'Invalid reminderAt datetime' }, { status: 400 });
    }

    // Resend supports scheduledAt for future sending
    const scheduledAt = reminderDate.toISOString();

    const formattedDate = reminderDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = reminderDate.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const { data, error } = await resend.emails.send({
      from: 'CV Builder <reminders@cvbuilder.app>',
      to: [userEmail],
      subject: `⏰ Reminder: ${jobTitle} at ${company}`,
      scheduledAt,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Application Reminder</title>
          </head>
          <body style="margin:0;padding:0;background:#F2F2F2;font-family:'Inter',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F2F2F2;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border:4px solid #000;max-width:600px;width:100%;">
                    <!-- Header -->
                    <tr>
                      <td style="background:#000;padding:24px 32px;">
                        <p style="color:#fff;font-size:11px;font-weight:900;letter-spacing:4px;text-transform:uppercase;margin:0;">CV BUILDER</p>
                      </td>
                    </tr>
                    <!-- Red accent bar -->
                    <tr><td style="background:#FF3000;height:4px;"></td></tr>
                    <!-- Body -->
                    <tr>
                      <td style="padding:40px 32px;">
                        <p style="font-size:11px;font-weight:900;letter-spacing:4px;text-transform:uppercase;color:#000;margin:0 0 16px;">Application Reminder</p>
                        <h1 style="font-size:28px;font-weight:900;color:#000;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">${jobTitle}</h1>
                        <p style="font-size:16px;font-weight:700;color:#555;margin:0 0 32px;text-transform:uppercase;letter-spacing:2px;">${company}</p>

                        <table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #000;margin-bottom:32px;">
                          <tr>
                            <td style="padding:16px 20px;border-bottom:2px solid #000;">
                              <p style="font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#888;margin:0 0 4px;">Date</p>
                              <p style="font-size:14px;font-weight:700;color:#000;margin:0;">${formattedDate}</p>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:16px 20px;">
                              <p style="font-size:10px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#888;margin:0 0 4px;">Time</p>
                              <p style="font-size:14px;font-weight:700;color:#000;margin:0;">${formattedTime}</p>
                            </td>
                          </tr>
                        </table>

                        <p style="font-size:13px;color:#444;line-height:1.6;margin:0 0 32px;">
                          This is your scheduled reminder for the <strong>${jobTitle}</strong> application at <strong>${company}</strong>. 
                          Log in to your CV Builder dashboard to review your application status or follow up.
                        </p>

                        <a href="https://cvbuilder.app/applications" style="display:inline-block;background:#FF3000;color:#fff;font-size:11px;font-weight:900;letter-spacing:3px;text-transform:uppercase;padding:14px 28px;text-decoration:none;border:2px solid #FF3000;">
                          View Application →
                        </a>
                      </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                      <td style="padding:20px 32px;background:#F2F2F2;border-top:2px solid #000;">
                        <p style="font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin:0;">
                          CV Builder · Application Tracker · You requested this reminder
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[REMINDER_SCHEDULE] Resend error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(`[REMINDER_SCHEDULE] Scheduled email id=${data?.id} for ${userEmail} at ${scheduledAt}`);
    return NextResponse.json({ success: true, emailId: data?.id, scheduledAt });
  } catch (err) {
    console.error('[REMINDER_SCHEDULE] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
