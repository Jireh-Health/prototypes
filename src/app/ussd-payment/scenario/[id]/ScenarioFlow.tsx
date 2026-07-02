"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type StepKind = "dial" | "ussd" | "input" | "auto" | "mpesa" | "sms" | "divider" | "done";

type Step = {
  screen: string;
  kind: StepKind;
  expect?: string;
  value?: string;
  delay?: number;
  narrative?: string;
};

type ScenarioData = {
  title: string;
  subtitle: string;
  specRef: string;
  steps: Step[];
};

const KEYS = [
  { n: "1", l: "" },
  { n: "2", l: "ABC" },
  { n: "3", l: "DEF" },
  { n: "4", l: "GHI" },
  { n: "5", l: "JKL" },
  { n: "6", l: "MNO" },
  { n: "7", l: "PQRS" },
  { n: "8", l: "TUV" },
  { n: "9", l: "WXYZ" },
  { n: "*", l: "" },
  { n: "0", l: "+" },
  { n: "#", l: "" },
];

function dial(code: string, narrative?: string): Step {
  return { screen: `Dialing ${code}\n\nConnecting...`, kind: "dial", delay: 1500, narrative };
}

function facility(name: string, narrative?: string): Step {
  return { screen: `${name}\n\nIs this correct?\n1. Yes\n2. No, re-enter`, kind: "ussd", expect: "1", narrative };
}

function invoice(value: string, narrative?: string): Step {
  return { screen: "Enter invoice number\n(ask the cashier if\nyou do not have it):", kind: "input", value, narrative };
}

function amount(value: string, narrative?: string): Step {
  return { screen: "Enter amount (KES):", kind: "input", value, narrative };
}

function confirm(amt: string, fac: string, narrative?: string): Step {
  return { screen: `Pay KES ${amt} at\n${fac}\nvia M-Pesa?\n\n1. Confirm\n2. Cancel`, kind: "ussd", expect: "1", narrative };
}

function stk(): Step {
  return { screen: "Requesting M-Pesa\npayment...\n\nPlease enter your\nM-Pesa PIN when\nprompted.", kind: "auto", delay: 2000, narrative: "The system initiates an M-Pesa STK push to the user's phone." };
}

function mpesa(amt: string): Step {
  return { screen: `M-PESA\n\nPay KES ${amt} to\nJIREH HEALTH LTD\n\nEnter PIN: ****`, kind: "mpesa", delay: 2500, narrative: "M-Pesa PIN entry dialog appears on the phone." };
}

function done(amt: string, fac: string, cb: string, narrative?: string): Step {
  return { screen: `Payment successful!\n\nKES ${amt} paid at\n${fac}\n\nCashback earned:\nKES ${cb}`, kind: "done", narrative };
}

function kyc(first: string, surname: string, dob: string, id: string, narrative?: string): Step[] {
  return [
    { screen: "To continue using\nJireh, we need a few\ndetails.\n\nEnter your first name:", kind: "input", value: first, narrative: narrative || "Second payment triggers the one-time KYC gate." },
    { screen: "Enter your surname:", kind: "input", value: surname },
    { screen: "Enter your date of\nbirth (DD/MM/YYYY):", kind: "input", value: dob },
    { screen: "Enter your national\nID number:", kind: "input", value: id },
    { screen: "Verifying your\nidentity...", kind: "auto", delay: 1500, narrative: "IPRS verification runs against the national registry." },
  ];
}

const SCENARIOS: Record<string, ScenarioData> = {
  "first-time-payment": {
    title: "First-Time USSD Payment at Jumuia",
    subtitle: "Feature phone user makes first Jireh payment via direct entry. No account, no app, no data connection needed.",
    specRef: "Scenario 7.3.1",
    steps: [
      dial("*654*384201#", "David dials the shortcode from the poster at Jumuia's pharmacy counter."),
      facility("Jumuia Hospital -\nPharmacy", "The payment number resolves to the pharmacy payment point."),
      invoice("INV-44821", "David enters the invoice number from the receipt the cashier handed him."),
      amount("1800", "The bill is KES 1,800 for his mother's hypertension medication."),
      confirm("1,800", "Jumuia Hospital", "David reviews the payment details and confirms."),
      stk(),
      mpesa("1,800"),
      done("1,800", "Jumuia Hospital", "90", "A Tier 1 account is created silently. David earns KES 90 cashback."),
      { screen: "SMS from JIREH HEALTH\n\nYou paid KES 1,800\nat Jumuia Hospital\nvia Jireh.\n\nYou earned KES 90\ncashback.\n\nTo claim cashback,\nregister by downloading\nthe Jireh app or dial\n*654# and choose\n'Register'.", kind: "sms", narrative: "David receives a confirmation SMS with his cashback balance and a registration prompt." },
    ],
  },

  "returning-cashback": {
    title: "Returning User with Cashback + KYC Gate",
    subtitle: "David's second payment triggers KYC collection, then his KES 90 cashback is applied to reduce the M-Pesa amount.",
    specRef: "Scenario 7.3.2",
    steps: [
      dial("*654*384201#", "Two weeks later, David returns to Jumuia for his mother's follow-up."),
      ...kyc("David", "Omondi", "15/03/1985", "28456789", "This is David's second payment. The KYC gate triggers before payment."),
      invoice("INV-45102", "KYC complete. David enters the invoice for this visit."),
      amount("500", "The follow-up consultation costs KES 500."),
      { screen: "You have KES 90\ncashback. Apply to\nthis payment?\n\n1. Yes, apply KES 90\n2. No, pay full amount", kind: "ussd", expect: "1", narrative: "Cashback from his first payment is available. David applies it." },
      confirm("410", "Jumuia Hospital", "After KES 90 cashback, only KES 410 goes through M-Pesa."),
      stk(),
      mpesa("410"),
      done("500", "Jumuia Hospital", "25", "KES 500 paid (KES 90 cashback + KES 410 M-Pesa). New cashback: KES 25."),
    ],
  },

  "name-mismatch": {
    title: "IPRS Name Mismatch with Re-entry",
    subtitle: "Amina's surname doesn't match IPRS. She must correct her details before payment can proceed.",
    specRef: "Scenario 7.3.3",
    steps: [
      dial("*654*271045#", "Amina dials for Kisima Diagnostic Centre on her second USSD payment."),
      ...kyc("Amina", "Abdi", "22/08/1990", "31245678", "KYC gate triggers on Amina's second payment."),
      { screen: "The name on your ID\ndoes not match what\nyou entered.\n\n1. Re-enter your\n   details\n2. Go back", kind: "ussd", expect: "1", narrative: "IPRS returned 'Aamina Abdikadir'. 'Abdi' vs 'Abdikadir' fails the fuzzy match threshold." },
      { screen: "Enter your first name:", kind: "input", value: "Aamina", narrative: "Amina re-enters her name as it appears on her national ID." },
      { screen: "Enter your surname:", kind: "input", value: "Abdikadir" },
      { screen: "Enter your date of\nbirth (DD/MM/YYYY):", kind: "input", value: "22/08/1990" },
      { screen: "Enter your national\nID number:", kind: "input", value: "31245678" },
      { screen: "Verifying your\nidentity...", kind: "auto", delay: 1500, narrative: "Second IPRS check. This time 'Aamina Abdikadir' matches." },
      invoice("INV-52310", "Verification passed. Amina proceeds to payment."),
      amount("1500", "The lab fee is KES 1,500."),
      confirm("1,500", "Kisima Diagnostic\nCentre"),
      stk(),
      mpesa("1,500"),
      done("1,500", "Kisima", "75", "Amina's account now carries the IPRS-verified canonical name."),
    ],
  },

  "iprs-downtime": {
    title: "IPRS Downtime During KYC",
    subtitle: "IPRS is unavailable. Payment proceeds anyway. Verification runs automatically on Samuel's next visit.",
    specRef: "Scenario 7.3.4",
    steps: [
      dial("*654*509832#", "Samuel dials from a clinic in Eldoret for his second payment."),
      ...kyc("Samuel", "Kiprotich", "03/11/1978", "19876543", "Second payment triggers the KYC gate."),
      { screen: "ID verification is\ntemporarily unavailable.\n\nYour payment will\nproceed.", kind: "auto", delay: 2500, narrative: "Pata Score API returned a 503 timeout. Samuel's details are stored for retry." },
      invoice("INV-60112", "Samuel continues to the payment flow uninterrupted."),
      amount("800", "Medication costs KES 800."),
      confirm("800", "Afya Clinic Eldoret"),
      stk(),
      mpesa("800"),
      done("800", "Afya Clinic", "40", "Payment succeeds despite IPRS being down. KYC data is stored for retry."),
      { screen: "", kind: "divider", narrative: "One week later, Samuel returns for another payment at the same clinic." },
      dial("*654*509832#", "Samuel dials the same shortcode."),
      { screen: "Verifying stored\nidentity details...", kind: "auto", delay: 1500, narrative: "Before the payment flow, the system retries IPRS with Samuel's stored details." },
      { screen: "Identity verified.\n\nWelcome, Samuel.", kind: "auto", delay: 1500, narrative: "IPRS is back online. Names match. Account is silently verified." },
      facility("Afya Clinic -\nEldoret", "Payment number resolves. Samuel confirms the facility."),
      invoice("INV-61503", "Samuel notices no interruption. Straight to payment."),
      amount("600"),
      confirm("600", "Afya Clinic Eldoret"),
      stk(),
      mpesa("600"),
      done("600", "Afya Clinic", "30", "Seamless second visit. IPRS verified in the background."),
    ],
  },

  "full-cashback": {
    title: "Full Cashback Coverage",
    subtitle: "Gladys's KES 320 cashback exceeds the KES 200 bill. Payment completes entirely from cashback, no M-Pesa needed.",
    specRef: "Scenario 7.3.5",
    steps: [
      dial("*654*271045#", "Gladys has KES 320 in cashback from previous payments. She dials for Kisima."),
      facility("Kisima Diagnostic\nCentre", "Payment number resolves."),
      invoice("INV-67234", "Gladys enters the invoice for her lab fee."),
      amount("200", "The lab fee is KES 200, less than her cashback balance."),
      { screen: "You have KES 320\ncashback. Apply to\nthis payment?\n\n1. Yes, apply KES 320\n2. No, pay full amount", kind: "ussd", expect: "1", narrative: "Her KES 320 cashback exceeds the KES 200 bill." },
      { screen: "Your cashback of\nKES 320 covers this\npayment.\n\nKES 120 remaining.\n\n1. Confirm\n2. Cancel", kind: "ussd", expect: "1", narrative: "No M-Pesa STK push needed. Payment completes entirely from cashback." },
      { screen: "Payment successful!\n\nKES 200 paid at\nKisima Diagnostic Ctr\n\nPaid from cashback.\nNo M-Pesa needed.\n\nNew cashback: KES 10\nBalance: KES 130", kind: "done", narrative: "Gladys paid without touching M-Pesa. KES 10 new cashback on the KES 200 transaction." },
    ],
  },

  "session-timeout": {
    title: "Session Timeout and Resume",
    subtitle: "John's USSD session times out while he searches for his invoice. He redials and resumes without re-entering data.",
    specRef: "Scenario 7.3.6",
    steps: [
      dial("*654#", "John dials *654# at a pharmacy counter."),
      { screen: "Welcome to Jireh\n\n1. Register\n2. Pay a bill", kind: "ussd", expect: "2", narrative: "John is a new user. He selects 'Pay a bill'." },
      { screen: "Enter the 6 digits\nafter JH- on the\npayment number at\nthe counter:", kind: "input", value: "384201", narrative: "John enters the payment number from the poster." },
      facility("Jumuia Hospital -\nPharmacy", "The payment number resolves. John confirms."),
      { screen: "Enter invoice number\n(ask the cashier if\nyou do not have it):\n\n> _", kind: "auto", delay: 3000, narrative: "John pauses to find the invoice in his bag. The clock is ticking..." },
      { screen: "\n\n   Session expired.\n\n   Please dial again\n   to continue.", kind: "auto", delay: 2500, narrative: "120 seconds of inactivity. The MNO drops the USSD session." },
      { screen: "", kind: "divider", narrative: "John finds the invoice and redials *654# within 2 minutes." },
      dial("*654#", "John redials the shortcode."),
      { screen: "Resume your previous\npayment at Jumuia\nHospital?\n\n1. Yes\n2. Start new payment", kind: "ussd", expect: "1", narrative: "The server recognises his MSISDN and offers to resume the previous session." },
      invoice("INV-44821", "Picks up where he left off. Payment number is already stored."),
      amount("1200", "The prescription costs KES 1,200."),
      confirm("1,200", "Jumuia Hospital"),
      stk(),
      mpesa("1,200"),
      done("1,200", "Jumuia Hospital", "60", "Payment completes. No data was lost despite the session timeout."),
    ],
  },

  "smartphone-ussd": {
    title: "Smartphone User Preferring USSD",
    subtitle: "Mercy has the Jireh app but data is too slow at the facility. She uses USSD and her cashback carries over.",
    specRef: "Scenario 7.3.7",
    steps: [
      dial("*654*271045#", "Mercy's app won't load. Cellular data is flaky. She dials the shortcode instead."),
      { screen: "Hi Mercy\n\nKisima Diagnostic\nCentre\n\nIs this correct?\n1. Yes\n2. No, re-enter", kind: "ussd", expect: "1", narrative: "System recognises her MSISDN and Tier 2 account. Personalised greeting." },
      invoice("INV-78901", "No KYC gate. Mercy is already verified. Straight to payment."),
      amount("3000", "The consultation costs KES 3,000."),
      { screen: "You have KES 1,200\ncashback. Apply to\nthis payment?\n\n1. Yes, apply\n   KES 1,200\n2. No, pay full amount", kind: "ussd", expect: "1", narrative: "Her app cashback balance is available through USSD too." },
      confirm("1,800", "Kisima Diagnostic\nCentre", "After KES 1,200 cashback, only KES 1,800 goes through M-Pesa."),
      stk(),
      mpesa("1,800"),
      done("3,000", "Kisima", "150", "Payment done via USSD. It will appear in the app when data returns."),
    ],
  },

  "invalid-payment-number": {
    title: "Invalid Payment Number",
    subtitle: "Peter misreads the poster and enters a wrong payment number. The system catches it and lets him retry.",
    specRef: "Scenario 7.3.8",
    steps: [
      dial("*654#", "Peter dials *654# at a facility counter."),
      { screen: "Welcome to Jireh\n\n1. Register\n2. Pay a bill", kind: "ussd", expect: "2", narrative: "Peter selects 'Pay a bill'." },
      { screen: "Enter the 6 digits\nafter JH- on the\npayment number at\nthe counter:", kind: "input", value: "384210", narrative: "Peter misreads the poster, transposing the last two digits." },
      { screen: "Payment number not\nfound.\n\nPlease check the\nnumber displayed at\nthe counter and try\nagain.\n\nEnter the 6 digits\nafter JH-:", kind: "input", value: "384201", narrative: "Error caught. Peter looks at the poster again and enters the correct number." },
      facility("Jumuia Hospital -\nPharmacy", "This time it resolves. Peter confirms the facility."),
      invoice("INV-44821"),
      amount("1800"),
      confirm("1,800", "Jumuia Hospital"),
      stk(),
      mpesa("1,800"),
      done("1,800", "Jumuia Hospital", "90", "Payment completes. The invalid number was a recoverable error."),
    ],
  },

  "menu-new-register": {
    title: "Menu: New User Registers",
    subtitle: "Grace dials *654# and registers before her first payment. Name, DOB, and national ID are collected upfront via USSD.",
    specRef: "Solution 4.1 — Register path",
    steps: [
      dial("*654#", "Grace arrives at a clinic. She dials *654# to set up her account first."),
      { screen: "Welcome to Jireh\n\n1. Register\n2. Pay a bill", kind: "ussd", expect: "1", narrative: "New user menu. Grace selects Register." },
      { screen: "Enter your first name:", kind: "input", value: "Grace", narrative: "The registration flow collects identity details upfront." },
      { screen: "Enter your surname:", kind: "input", value: "Akinyi" },
      { screen: "Enter your date of\nbirth (DD/MM/YYYY):", kind: "input", value: "14/06/1992" },
      { screen: "Enter your national\nID number:", kind: "input", value: "34567890" },
      { screen: "Verifying your\nidentity...", kind: "auto", delay: 1500, narrative: "IPRS verification runs against the national registry." },
      { screen: "Registration complete!\n\nWelcome, Grace Akinyi.\n\nYou can now pay at any\nJireh partner facility.\n\nDial *654# or\n*654*XXXXXX# to pay\n(6 digits after JH-).", kind: "done", narrative: "Grace is registered. Her next payment skips the KYC gate entirely." },
      { screen: "SMS from JIREH HEALTH\n\nWelcome to Jireh,\nGrace! Your account\nis set up.\n\nPay at any Jireh\npartner by dialing\n*654# or\n*654*{6 digits after JH-}#\n\nDownload the app for\nloans and more:\njireh.health/app", kind: "sms", narrative: "Grace receives a welcome SMS with payment instructions and app download link." },
    ],
  },

  "menu-new-pay": {
    title: "Menu: New User Pays a Bill",
    subtitle: "James dials *654# and pays his first bill via the menu. A Tier 1 account is created silently on payment.",
    specRef: "Solution 4.1 — Pay path (new user)",
    steps: [
      dial("*654#", "James is at Jumuia Hospital. He dials *654# after seeing the poster."),
      { screen: "Welcome to Jireh\n\n1. Register\n2. Pay a bill", kind: "ussd", expect: "2", narrative: "New user menu. James selects Pay a bill." },
      { screen: "Enter the 6 digits\nafter JH- on the\npayment number at\nthe counter:", kind: "input", value: "384201", narrative: "James reads the payment number from the poster." },
      facility("Jumuia Hospital -\nPharmacy", "The payment number resolves. James confirms the facility."),
      invoice("INV-55102", "James enters the invoice from his receipt."),
      amount("2500", "The prescription costs KES 2,500."),
      confirm("2,500", "Jumuia Hospital", "James confirms the payment details."),
      stk(),
      mpesa("2,500"),
      done("2,500", "Jumuia Hospital", "125", "A Tier 1 account is created silently. KES 125 cashback earned."),
      { screen: "SMS from JIREH HEALTH\n\nYou paid KES 2,500\nat Jumuia Hospital\nvia Jireh.\n\nYou earned KES 125\ncashback.\n\nTo claim cashback,\nregister by downloading\nthe Jireh app or dial\n*654# and choose\n'Register'.", kind: "sms", narrative: "James receives the first-payment SMS with cashback and registration prompt." },
    ],
  },

  "menu-returning-pay": {
    title: "Menu: Returning User Pays (KYC Gate)",
    subtitle: "Nancy's second payment via *654# triggers the one-time KYC gate. After identity collection, she pays with cashback applied.",
    specRef: "Solution 4.1 + 4.4 — Menu KYC gate",
    steps: [
      dial("*654#", "Nancy returns to Kisima for a follow-up. She dials *654#."),
      { screen: "Welcome to Jireh\n\n1. Pay a bill\n2. View cashback\n   balance", kind: "ussd", expect: "1", narrative: "Returning Tier 1 user. Menu shows Pay first, View cashback second." },
      ...kyc("Nancy", "Wanjiku", "20/09/1988", "27654321", "Second payment. KYC gate triggers after selecting Pay."),
      { screen: "Enter the 6 digits\nafter JH- on the\npayment number at\nthe counter:", kind: "input", value: "271045", narrative: "KYC complete. Nancy enters the payment number." },
      facility("Kisima Diagnostic\nCentre", "Payment number resolves. Nancy confirms."),
      invoice("INV-72001", "Nancy enters the invoice for her follow-up visit."),
      amount("3500", "The consultation and lab work cost KES 3,500."),
      { screen: "You have KES 150\ncashback. Apply to\nthis payment?\n\n1. Yes, apply KES 150\n2. No, pay full amount", kind: "ussd", expect: "1", narrative: "Cashback from her first payment. Nancy applies it." },
      confirm("3,350", "Kisima Diagnostic\nCentre", "KES 150 cashback applied. KES 3,350 via M-Pesa."),
      stk(),
      mpesa("3,350"),
      done("3,500", "Kisima", "175", "KES 3,500 paid (KES 150 cashback + KES 3,350 M-Pesa). New cashback: KES 175."),
    ],
  },

  "menu-returning-balance": {
    title: "Menu: View Cashback Balance (Tier 1)",
    subtitle: "Vitalis dials *654# to check his cashback balance without making a payment. No app needed.",
    specRef: "Solution 4.1 — View cashback balance",
    steps: [
      dial("*654#", "Vitalis wants to check how much cashback he has earned from previous payments."),
      { screen: "Welcome to Jireh\n\n1. Pay a bill\n2. View cashback\n   balance", kind: "ussd", expect: "2", narrative: "Returning Tier 1 user. Vitalis selects View cashback balance." },
      { screen: "Your cashback balance:\n\nKES 215\n\nEarned from 3 payments\nat Jireh partners.", kind: "done", narrative: "Vitalis can check his cashback anytime via *654#. No app needed." },
    ],
  },

  "menu-verified-pay": {
    title: "Menu: Verified User Pays (Personalised)",
    subtitle: "Gladys dials *654# and sees 'Hi Gladys'. No KYC gate. Straight to payment with cashback.",
    specRef: "Solution 4.1 — Personalised menu",
    steps: [
      dial("*654#", "Gladys dials *654# at Kisima. She has a Tier 2 account with completed KYC."),
      { screen: "Hi Gladys\n\n1. Pay a bill\n2. View cashback\n   balance", kind: "ussd", expect: "1", narrative: "Personalised greeting for a verified user. Gladys selects Pay a bill." },
      { screen: "Enter the 6 digits\nafter JH- on the\npayment number at\nthe counter:", kind: "input", value: "271045", narrative: "No KYC gate. Gladys enters the payment number directly." },
      facility("Kisima Diagnostic\nCentre", "Payment number resolves."),
      invoice("INV-89012", "Gladys enters the invoice."),
      amount("1200", "The consultation costs KES 1,200."),
      { screen: "You have KES 320\ncashback. Apply to\nthis payment?\n\n1. Yes, apply KES 320\n2. No, pay full amount", kind: "ussd", expect: "1", narrative: "Gladys applies her cashback balance." },
      confirm("880", "Kisima Diagnostic\nCentre", "KES 320 cashback applied. KES 880 via M-Pesa."),
      stk(),
      mpesa("880"),
      done("1,200", "Kisima", "60", "KES 1,200 paid (KES 320 cashback + KES 880 M-Pesa). New cashback: KES 60."),
    ],
  },

  "menu-verified-balance": {
    title: "Menu: View Cashback Balance (Verified)",
    subtitle: "Ruth dials *654# and sees her personalised greeting. She checks her cashback balance.",
    specRef: "Solution 4.1 — View cashback (verified)",
    steps: [
      dial("*654#", "Ruth wants to check her cashback before deciding whether to pay via Jireh today."),
      { screen: "Hi Ruth\n\n1. Pay a bill\n2. View cashback\n   balance", kind: "ussd", expect: "2", narrative: "Personalised greeting. Ruth selects View cashback balance." },
      { screen: "Your cashback balance:\n\nKES 450\n\nEarned from 6 payments\nat Jireh partners.", kind: "done", narrative: "Ruth sees her accumulated cashback. She can dial again to pay." },
    ],
  },
};

const CSS = `
@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes pulseKey {
  0%, 100% { box-shadow: 0 0 4px rgba(160,32,240,0.3); }
  50% { box-shadow: 0 0 14px rgba(160,32,240,0.6); }
}
@keyframes loadDots {
  0% { opacity: 0.3; }
  50% { opacity: 1; }
  100% { opacity: 0.3; }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
`;

function PhoneScreen({ step, inputFilled }: { step: Step | null; inputFilled: boolean }) {
  if (!step || step.kind === "divider") {
    return (
      <div style={{ width: "100%", height: 190, background: "#b8c48a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#6b7a4a", fontSize: 11, fontFamily: "'Courier New', monospace" }}>USSD</span>
      </div>
    );
  }

  const isMpesa = step.kind === "mpesa";
  const isSms = step.kind === "sms";
  const isTimeout = step.screen.includes("Session expired");
  const isLoading = step.kind === "dial" || step.kind === "auto";
  const isDone = step.kind === "done";

  const bg = isMpesa ? "#f5f5f5" : isSms ? "#edf2f7" : isTimeout ? "#8a8a7a" : "#b8c48a";
  const color = isMpesa ? "#1a1a1a" : isSms ? "#1a1a1a" : isTimeout ? "#444" : "#2d3314";

  return (
    <div style={{
      width: "100%",
      minHeight: 190,
      maxHeight: 210,
      overflowY: "auto",
      background: bg,
      borderRadius: 4,
      padding: 10,
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: 12,
      lineHeight: 1.55,
      color,
      position: "relative",
      animation: "fadeIn 0.2s ease",
    }}>
      {isMpesa && (
        <div style={{ background: "#4CAF50", color: "#fff", padding: "3px 8px", margin: "-10px -10px 8px", fontSize: 11, fontWeight: 700, letterSpacing: 1, borderRadius: "4px 4px 0 0" }}>
          M-PESA
        </div>
      )}
      {isSms && (
        <div style={{ background: "#3B82F6", color: "#fff", padding: "3px 8px", margin: "-10px -10px 8px", fontSize: 11, fontWeight: 700, borderRadius: "4px 4px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 13 }}>&#9993;</span> SMS
        </div>
      )}
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit" }}>
        {step.screen}
      </pre>
      {step.kind === "input" && (
        <div style={{ marginTop: 8, borderTop: `1px solid ${isMpesa ? "#ddd" : "rgba(45,51,20,0.2)"}`, paddingTop: 6 }}>
          {inputFilled ? (
            <span>{`> ${step.value}`}</span>
          ) : (
            <span>{">"} <span style={{ animation: "cursorBlink 1s step-end infinite" }}>&#9646;</span></span>
          )}
        </div>
      )}
      {isLoading && !isTimeout && (
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 18, letterSpacing: 6 }}>
          <span style={{ animation: "loadDots 1.4s infinite 0s" }}>&#8226;</span>
          <span style={{ animation: "loadDots 1.4s infinite 0.2s" }}>&#8226;</span>
          <span style={{ animation: "loadDots 1.4s infinite 0.4s" }}>&#8226;</span>
        </div>
      )}
      {isDone && (
        <div style={{ textAlign: "center", marginTop: 6, fontSize: 20, color: isMpesa ? "#4CAF50" : "#4a6b2a" }}>&#10003;</div>
      )}
    </div>
  );
}

function FeaturePhone({
  step,
  inputFilled,
  onKey,
  onOk,
  highlightKey,
  highlightOk,
}: {
  step: Step | null;
  inputFilled: boolean;
  onKey: (key: string) => void;
  onOk: () => void;
  highlightKey: string | null;
  highlightOk: boolean;
}) {
  const bodyStyle: React.CSSProperties = {
    width: 270,
    background: "linear-gradient(165deg, #3a3a3e 0%, #2d2d30 35%, #252528 100%)",
    borderRadius: 30,
    padding: "20px 18px 18px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 0,
    userSelect: "none",
  };

  const bezelStyle: React.CSSProperties = {
    width: "100%",
    background: "#1a1a1e",
    borderRadius: 8,
    padding: 8,
    boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)",
  };

  const softKeyStyle: React.CSSProperties = {
    flex: 1,
    height: 24,
    background: "#444448",
    border: "none",
    borderRadius: 4,
    color: "#ccc",
    fontSize: 10,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'Courier New', monospace",
    transition: "background 0.15s",
  };

  const keyBaseStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    background: "#3e3e42",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    transition: "background 0.1s, box-shadow 0.3s",
    padding: 0,
  };

  const okBtnStyle: React.CSSProperties = {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: highlightOk ? "#5a5a5e" : "#3e3e42",
    border: highlightOk ? "2px solid rgba(160,32,240,0.5)" : "2px solid #555",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    cursor: "pointer",
    transition: "background 0.15s",
    animation: highlightOk ? "pulseKey 1.5s infinite" : "none",
    fontFamily: "'Courier New', monospace",
  };

  const softLeftLabel = step?.kind === "input" ? "Send" : step?.kind === "sms" || step?.kind === "done" ? "OK" : "Select";
  const softRightLabel = "Back";

  return (
    <div style={bodyStyle}>
      <div style={{ color: "#666", fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>
        Jireh
      </div>

      <div style={bezelStyle}>
        <PhoneScreen step={step} inputFilled={inputFilled} />
      </div>

      <div style={{ display: "flex", gap: 12, width: "100%", marginTop: 10 }}>
        <button
          style={softKeyStyle}
          onClick={onOk}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#555"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#444448"; }}
        >
          {softLeftLabel}
        </button>
        <button
          style={softKeyStyle}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#555"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#444448"; }}
        >
          {softRightLabel}
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 12 }}>
        <button style={{ width: 38, height: 24, borderRadius: 12, background: "#22c55e", border: "none", cursor: "pointer", fontSize: 12, color: "#fff" }}>
          &#9742;
        </button>
        <button style={okBtnStyle} onClick={onOk}>
          OK
        </button>
        <button style={{ width: 38, height: 24, borderRadius: 12, background: "#ef4444", border: "none", cursor: "pointer", fontSize: 12, color: "#fff" }}>
          &#9742;
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, width: "100%", marginTop: 12 }}>
        {KEYS.map((k) => {
          const isHl = highlightKey === k.n;
          return (
            <button
              key={k.n}
              style={{
                ...keyBaseStyle,
                ...(isHl ? { background: "#5a5a5e", animation: "pulseKey 1.5s infinite" } : {}),
              }}
              onClick={() => onKey(k.n)}
              onMouseEnter={(e) => { if (!isHl) e.currentTarget.style.background = "#4e4e52"; }}
              onMouseLeave={(e) => { if (!isHl) e.currentTarget.style.background = "#3e3e42"; }}
            >
              <span style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{k.n}</span>
              {k.l && <span style={{ color: "#777", fontSize: 7, lineHeight: 1, marginTop: 1 }}>{k.l}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ScenarioFlow() {
  const params = useParams();
  const id = params.id as string;
  const scenario = SCENARIOS[id];

  const [stepIndex, setStepIndex] = useState(0);
  const [inputFilled, setInputFilled] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const currentStep = scenario?.steps[stepIndex] ?? null;
  const isLastStep = scenario ? stepIndex >= scenario.steps.length - 1 : false;

  const advance = useCallback(() => {
    if (isLastStep) return;
    setTransitioning(true);
    setTimeout(() => {
      setStepIndex((i) => i + 1);
      setInputFilled(false);
      setTransitioning(false);
    }, 200);
  }, [isLastStep]);

  useEffect(() => {
    if (!currentStep) return;
    if (currentStep.kind === "dial" || currentStep.kind === "auto" || currentStep.kind === "mpesa") {
      const timer = setTimeout(advance, currentStep.delay || 1500);
      return () => clearTimeout(timer);
    }
  }, [stepIndex, currentStep, advance]);

  const handleKey = useCallback(
    (key: string) => {
      if (!currentStep || currentStep.kind !== "ussd") return;
      if (currentStep.expect && key === currentStep.expect) {
        advance();
      }
    },
    [currentStep, advance],
  );

  const handleOk = useCallback(() => {
    if (!currentStep) return;
    if (currentStep.kind === "input" && !inputFilled) {
      setInputFilled(true);
      setTimeout(advance, 500);
    } else if (currentStep.kind === "sms" || currentStep.kind === "done") {
      advance();
    }
  }, [currentStep, inputFilled, advance]);

  const handleDividerContinue = useCallback(() => {
    if (currentStep?.kind === "divider") advance();
  }, [currentStep, advance]);

  const restart = () => {
    setStepIndex(0);
    setInputFilled(false);
    setTransitioning(false);
  };

  if (!scenario) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--fg-muted)" }}>Scenario not found.</p>
        <Link href="/ussd-payment" style={{ color: "#A020F0", textDecoration: "none", fontSize: "0.875rem" }}>
          ← Back to scenarios
        </Link>
      </div>
    );
  }

  const highlightKey = currentStep?.kind === "ussd" ? (currentStep.expect ?? null) : null;
  const highlightOk = currentStep?.kind === "input" && !inputFilled;

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px 64px" }}>
      <style>{CSS}</style>

      <Link href="/ussd-payment" style={{ fontSize: "0.8125rem", color: "#A020F0", textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
        All scenarios
      </Link>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: "0.6875rem", color: "#A020F0", fontWeight: 500, background: "#FBF0FF", padding: "2px 8px", borderRadius: 99 }}>
            {scenario.specRef}
          </span>
        </div>
        <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "var(--fg-heading)", lineHeight: 1.3, marginBottom: 6 }}>
          {scenario.title}
        </h1>
        <p style={{ fontSize: "0.8125rem", color: "var(--fg-muted)", lineHeight: 1.5 }}>
          {scenario.subtitle}
        </p>
      </div>

      {currentStep?.kind === "divider" ? (
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div style={{ width: 60, height: 1, background: "#ddd", margin: "0 auto 20px" }} />
          <p style={{ fontSize: "0.875rem", color: "#666", fontStyle: "italic", marginBottom: 24, maxWidth: 300, margin: "0 auto 24px", lineHeight: 1.6 }}>
            {currentStep.narrative}
          </p>
          <button
            onClick={handleDividerContinue}
            style={{
              padding: "10px 28px",
              borderRadius: 8,
              border: "1px solid #A020F0",
              background: "#FBF0FF",
              color: "#A020F0",
              fontSize: "0.8125rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}
          >
            Continue &rarr;
          </button>
          <div style={{ width: 60, height: 1, background: "#ddd", margin: "20px auto 0" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ opacity: transitioning ? 0.5 : 1, transition: "opacity 0.15s" }}>
            <FeaturePhone
              step={currentStep}
              inputFilled={inputFilled}
              onKey={handleKey}
              onOk={handleOk}
              highlightKey={highlightKey}
              highlightOk={highlightOk}
            />
          </div>

          <div style={{ width: "100%", maxWidth: 320, marginTop: 20 }}>
            <div style={{ width: "100%", height: 3, background: "#eee", borderRadius: 2 }}>
              <div
                style={{
                  width: `${((stepIndex + 1) / scenario.steps.length) * 100}%`,
                  height: "100%",
                  background: "#A020F0",
                  borderRadius: 2,
                  transition: "width 0.3s",
                }}
              />
            </div>
            <p style={{ fontSize: "0.6875rem", color: "#999", textAlign: "center", marginTop: 6 }}>
              Step {stepIndex + 1} of {scenario.steps.length}
            </p>
          </div>

          {currentStep?.narrative && (
            <p style={{ fontSize: "0.8125rem", color: "#666", textAlign: "center", maxWidth: 320, margin: "8px auto 0", lineHeight: 1.55 }}>
              {currentStep.narrative}
            </p>
          )}

          {currentStep?.kind === "ussd" && currentStep.expect && (
            <p style={{ fontSize: "0.6875rem", color: "#A020F0", textAlign: "center", marginTop: 8 }}>
              Press <strong>{currentStep.expect}</strong> on the keypad
            </p>
          )}
          {currentStep?.kind === "input" && !inputFilled && (
            <p style={{ fontSize: "0.6875rem", color: "#A020F0", textAlign: "center", marginTop: 8 }}>
              Tap <strong>Send</strong> or <strong>OK</strong> to enter: {currentStep.value}
            </p>
          )}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
        <button
          onClick={restart}
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "1px solid var(--border-default)",
            background: "var(--bg-surface)",
            color: "var(--fg-muted)",
            fontSize: "0.75rem",
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          Restart
        </button>
        <Link
          href="/ussd-payment"
          style={{
            padding: "8px 18px",
            borderRadius: 8,
            border: "1px solid var(--border-default)",
            background: "var(--bg-surface)",
            color: "var(--fg-muted)",
            fontSize: "0.75rem",
            fontWeight: 500,
            textDecoration: "none",
            fontFamily: "var(--font-sans)",
          }}
        >
          All scenarios
        </Link>
      </div>

      {isLastStep && (
        <div style={{ textAlign: "center", marginTop: 24, padding: "16px 20px", borderRadius: 10, background: "#DCFCE7", border: "1px solid rgba(22,163,74,0.15)" }}>
          <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#16A34A", marginBottom: 4 }}>Scenario complete</p>
          <p style={{ fontSize: "0.75rem", color: "#15803d" }}>{scenario.title}</p>
        </div>
      )}
    </div>
  );
}
