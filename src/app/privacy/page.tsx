import Link from "next/link";
import { DeclareMark } from "@/components/brand/declare-mark";

export const metadata = {
  title: "Privacy Policy — Declare",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-chart-2">
              <DeclareMark className="size-4 text-primary-foreground" />
            </span>
            <span className="font-semibold tracking-tight">Declare</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated September 5, 2026.</p>

        <div className="mt-8 grid gap-8 text-sm leading-relaxed text-foreground [&_h2]:mt-2 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:grid [&_ul]:gap-1">
          <section>
            <h2>What Declare is</h2>
            <p>
              Declare is a scheduling tool for church teams — it helps schedulers assign
              volunteers to roles for services, and helps volunteers see and respond to those
              assignments. This policy covers the Declare web app and the Declare Android app,
              which is the same service in a native shell.
            </p>
          </section>

          <section>
            <h2>Information we collect</h2>
            <p>Declare collects only what it needs to run a volunteer schedule:</p>
            <ul>
              <li>Your name, email address, and phone number</li>
              <li>Your profile photo, if you sign in with Google</li>
              <li>Your organization (church), role, and permission level within it</li>
              <li>
                Scheduling data you or your scheduler create: role assignments, service dates,
                accept/decline responses, and blockout dates you enter
              </li>
              <li>Messages you send to other people or teams within the app</li>
            </ul>
            <p>
              We don&apos;t collect location data, contacts from your device, or any information
              beyond what you or your church&apos;s scheduler enter directly into the app.
            </p>
          </section>

          <section>
            <h2>How we use it</h2>
            <p>
              Your information is used to run the scheduling features you&apos;d expect: showing
              your upcoming commitments, checking for scheduling conflicts before you&apos;re
              assigned to a role, sending you invites and reminders, and letting your scheduler
              and teammates see your name, role, and response status within your own organization.
            </p>
            <p>We do not sell your information, and we do not use it for advertising.</p>
          </section>

          <section>
            <h2>Who we share it with</h2>
            <p>
              Your data is visible to schedulers and admins within your own church&apos;s
              organization in Declare — never to other organizations. A small number of service
              providers process data on our behalf to make the app work:
            </p>
            <ul>
              <li>
                <strong>Supabase</strong> hosts our database and handles authentication (including
                Google sign-in).
              </li>
              <li>
                <strong>Resend</strong> delivers the emails Declare sends (invites, reminders,
                confirmations).
              </li>
              <li>
                <strong>An SMS gateway we operate</strong> delivers the text-message reminders
                Declare sends, when your church has SMS reminders turned on and you have a phone
                number on file.
              </li>
            </ul>
            <p>
              None of these providers are permitted to use your data for their own purposes —
              they process it only to deliver the app&apos;s functionality.
            </p>
          </section>

          <section>
            <h2>Data retention and deletion</h2>
            <p>
              We keep your information for as long as your account is active with an
              organization. If you&apos;d like your account or data deleted, email us at{" "}
              <a href="mailto:markkevinalberto@gmail.com" className="text-primary underline underline-offset-2">
                markkevinalberto@gmail.com
              </a>{" "}
              and we&apos;ll remove it, aside from records we&apos;re required to keep for legal
              or accounting reasons.
            </p>
          </section>

          <section>
            <h2>Security</h2>
            <p>
              Data is encrypted in transit and at rest through our hosting provider. Access
              within an organization is limited by role — only schedulers and admins can see the
              full team roster and assignment history, and only admins can manage account
              permissions.
            </p>
          </section>

          <section>
            <h2>Children&apos;s privacy</h2>
            <p>
              Declare is intended for adult volunteers and church staff, not children. We don&apos;t
              knowingly collect information from children under 13.
            </p>
          </section>

          <section>
            <h2>Changes to this policy</h2>
            <p>
              If this policy changes in a meaningful way, we&apos;ll update the date at the top of
              this page.
            </p>
          </section>

          <section>
            <h2>Contact</h2>
            <p>
              Questions about this policy or your data can be sent to{" "}
              <a href="mailto:markkevinalberto@gmail.com" className="text-primary underline underline-offset-2">
                markkevinalberto@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-8 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            &larr; Back to Declare
          </Link>
          <p>&copy; {new Date().getFullYear()} Declare</p>
        </div>
      </footer>
    </div>
  );
}
