"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type StepKind = "dial" | "ussd" | "input" | "auto" | "mpesa" | "sms" | "divider" | "done"
  | "portal-form" | "portal-confirm" | "portal-status" | "portal-auto" | "portal-list" | "portal-dashboard"
  | "mobile-screen" | "mobile-input" | "mobile-auto" | "mobile-done"
  | "app-screen" | "app-auto" | "app-done";

type PortalField = { label: string; value: string; type?: "text" | "select"; options?: string[] };

type Step = {
  screen: string;
  kind: StepKind;
  expect?: string;
  value?: string;
  delay?: number;
  narrative?: string;
  fields?: PortalField[];
  badge?: { label: string; color: string; bg: string };
  rows?: DashboardRow[];
  highlightRow?: number;
  reminderRow?: number;
};

type DashboardRow = {
  student: string;
  amount: string;
  smsSent: string;
  smsDelivered: string;
  paidAt: string;
  status: "pending" | "delivered" | "paid";
};

type ScenarioData = {
  title: string;
  subtitle: string;
  specRef: string;
  mockType: "portal" | "mobile" | "ussd" | "app";
  steps: Step[];
};

/* ------------------------------------------------------------------ */
/*  USSD helpers (reused from ussd-payment prototype)                  */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  Scenario data                                                      */
/* ------------------------------------------------------------------ */

const SCENARIOS: Record<string, ScenarioData> = {
  /* ---- NURSE PORTAL SCENARIOS ---- */

  "nurse-generate-link": {
    title: "Nurse Generates Payment Link (New Student)",
    subtitle: "The nurse enters parent phone, student name, charge number, and amount. The system generates a unique link and sends SMS to the parent.",
    specRef: "Solution 4.2",
    mockType: "portal",
    steps: [
      {
        screen: "Payment Link Generator",
        kind: "portal-form",
        fields: [
          { label: "Parent phone number", value: "0722 XXX XXX", type: "text" },
          { label: "Student name", value: "Daniel Wanjiku", type: "text" },
          { label: "Charge number", value: "CN-4421", type: "text" },
          { label: "Amount (KES)", value: "2,500", type: "text" },
        ],
        narrative: "The nurse opens the link generator and enters Daniel's treatment details. His mother Grace will receive the payment link.",
      },
      {
        screen: "Confirm Payment Link",
        kind: "portal-confirm",
        fields: [
          { label: "Parent", value: "0722 XXX XXX" },
          { label: "Student", value: "Daniel Wanjiku" },
          { label: "Charge number", value: "CN-4421" },
          { label: "Amount", value: "KES 2,500" },
        ],
        narrative: "The nurse reviews the details before generating the link. One tap to confirm.",
      },
      {
        screen: "Sending SMS...",
        kind: "portal-auto",
        delay: 1500,
        narrative: "The system generates a unique payment token, creates the link, and sends an SMS to Grace's phone.",
      },
      {
        screen: "Payment link sent",
        kind: "portal-status",
        badge: { label: "SMS Sent", color: "#16A34A", bg: "#DCFCE7" },
        fields: [
          { label: "Student", value: "Daniel Wanjiku" },
          { label: "Amount", value: "KES 2,500" },
          { label: "Link", value: "pay.jireh.health/t/abc123" },
          { label: "SMS sent to", value: "0722 XXX XXX" },
        ],
        narrative: "SMS sent: \"Cana Hospital School Nurse: Daniel Wanjiku was treated today. Pay KES 2,500 via Jireh: https://pay.jireh.health/t/abc123. No smartphone? Dial *654# and select 'Payment requests'.\"",
      },
      {
        screen: "",
        kind: "done",
        narrative: "The link is generated and the SMS is on its way. The nurse moves to the next student. Total time: under 30 seconds.",
      },
    ],
  },

  "nurse-returning-parent": {
    title: "Returning Parent (Linked Children)",
    subtitle: "The nurse enters a returning parent's phone number. The system recognises Grace and shows Daniel as a linked child.",
    specRef: "Solution 4.2",
    mockType: "portal",
    steps: [
      {
        screen: "Payment Link Generator",
        kind: "portal-form",
        fields: [
          { label: "Parent phone number", value: "0722 XXX XXX", type: "text" },
        ],
        narrative: "The nurse enters Grace's phone number. The system checks for existing linked children.",
      },
      {
        screen: "Returning parent detected",
        kind: "portal-auto",
        delay: 1200,
        narrative: "The system recognises 0722 XXX XXX as a returning parent with one linked child.",
      },
      {
        screen: "Payment Link Generator",
        kind: "portal-form",
        fields: [
          { label: "Parent phone number", value: "0722 XXX XXX", type: "text" },
          { label: "Student name", value: "Daniel Wanjiku", type: "select", options: ["Daniel Wanjiku", "+ Add new child"] },
          { label: "Charge number", value: "CN-5587", type: "text" },
          { label: "Amount (KES)", value: "1,200", type: "text" },
        ],
        narrative: "Daniel appears in a dropdown. The nurse selects him, enters the new charge number and amount. No need to re-type the child's name.",
      },
      {
        screen: "Confirm Payment Link",
        kind: "portal-confirm",
        fields: [
          { label: "Parent", value: "0722 XXX XXX (Grace Wanjiku)" },
          { label: "Student", value: "Daniel Wanjiku" },
          { label: "Charge number", value: "CN-5587" },
          { label: "Amount", value: "KES 1,200" },
        ],
        narrative: "The system also resolved Grace's name from her Tier 1 account. The nurse confirms.",
      },
      {
        screen: "Sending SMS...",
        kind: "portal-auto",
        delay: 1500,
        narrative: "SMS sent to Grace with the new payment link for Daniel's second treatment.",
      },
      {
        screen: "Payment link sent",
        kind: "portal-status",
        badge: { label: "SMS Sent", color: "#16A34A", bg: "#DCFCE7" },
        fields: [
          { label: "Student", value: "Daniel Wanjiku" },
          { label: "Amount", value: "KES 1,200" },
          { label: "Link", value: "pay.jireh.health/t/def456" },
          { label: "SMS sent to", value: "0722 XXX XXX" },
        ],
        narrative: "Returning parent flow saved the nurse from re-entering Daniel's name. Time: under 20 seconds.",
      },
    ],
  },

  "nurse-offline-batch": {
    title: "Offline Batch (3 Links Queued)",
    subtitle: "The nurse generates 3 payment links while offline. When the internet reconnects, all 3 SMS messages are sent automatically.",
    specRef: "Solution 4.2 + Click-Stop 1",
    mockType: "portal",
    steps: [
      {
        screen: "Payment Link Generator",
        kind: "portal-status",
        badge: { label: "Offline", color: "#DC2626", bg: "#FEE2E2" },
        fields: [],
        narrative: "The internet is down at the school. The nurse opens the link generator anyway. The offline indicator shows at the top.",
      },
      {
        screen: "Payment Link Generator",
        kind: "portal-form",
        fields: [
          { label: "Parent phone number", value: "0722 XXX XXX", type: "text" },
          { label: "Student name", value: "Daniel Wanjiku", type: "text" },
          { label: "Charge number", value: "CN-6601", type: "text" },
          { label: "Amount (KES)", value: "800", type: "text" },
        ],
        badge: { label: "Offline", color: "#DC2626", bg: "#FEE2E2" },
        narrative: "First student: Daniel Wanjiku, KES 800. The nurse enters the details as normal.",
      },
      {
        screen: "Queued locally",
        kind: "portal-status",
        badge: { label: "Queued (1 pending)", color: "#EA580C", bg: "#FFF7ED" },
        fields: [
          { label: "Student", value: "Daniel Wanjiku" },
          { label: "Amount", value: "KES 800" },
          { label: "Status", value: "Waiting for internet" },
        ],
        narrative: "The link is saved to local storage. It will be sent when connectivity returns.",
      },
      {
        screen: "Payment Link Generator",
        kind: "portal-form",
        fields: [
          { label: "Parent phone number", value: "0711 XXX XXX", type: "text" },
          { label: "Student name", value: "Fatma Salim", type: "text" },
          { label: "Charge number", value: "CN-6602", type: "text" },
          { label: "Amount (KES)", value: "1,500", type: "text" },
        ],
        badge: { label: "Queued (1 pending)", color: "#EA580C", bg: "#FFF7ED" },
        narrative: "Second student: Fatma Salim, KES 1,500. Her mother Amina has a Kenyan M-Pesa SIM despite being Tanzanian.",
      },
      {
        screen: "Payment Link Generator",
        kind: "portal-form",
        fields: [
          { label: "Parent phone number", value: "0733 XXX XXX", type: "text" },
          { label: "Student name", value: "Brian Ochieng", type: "text" },
          { label: "Charge number", value: "CN-6603", type: "text" },
          { label: "Amount (KES)", value: "2,000", type: "text" },
        ],
        badge: { label: "Queued (2 pending)", color: "#EA580C", bg: "#FFF7ED" },
        narrative: "Third student: Brian Ochieng, KES 2,000. All three are now queued offline.",
      },
      {
        screen: "3 links queued",
        kind: "portal-status",
        badge: { label: "Queued (3 pending)", color: "#EA580C", bg: "#FFF7ED" },
        fields: [
          { label: "Daniel Wanjiku", value: "KES 800" },
          { label: "Fatma Salim", value: "KES 1,500" },
          { label: "Brian Ochieng", value: "KES 2,000" },
        ],
        narrative: "The nurse finishes entering all three. She can close the browser; the data persists in local storage.",
      },
      {
        screen: "",
        kind: "divider",
        narrative: "At 2pm, the internet comes back. The system detects connectivity and begins syncing.",
      },
      {
        screen: "Syncing 3 payment links...",
        kind: "portal-auto",
        delay: 2000,
        narrative: "The system submits all three queued entries, generates tokens, and sends SMS messages to each parent.",
      },
      {
        screen: "3 payment links sent",
        kind: "portal-status",
        badge: { label: "All Sent", color: "#16A34A", bg: "#DCFCE7" },
        fields: [
          { label: "Daniel Wanjiku", value: "KES 800 — SMS sent" },
          { label: "Fatma Salim", value: "KES 1,500 — SMS sent" },
          { label: "Brian Ochieng", value: "KES 2,000 — SMS sent" },
        ],
        narrative: "All 3 payment links sent successfully. The nurse sees the confirmation without re-entering anything.",
      },
    ],
  },

  "nurse-dashboard": {
    title: "Nurse Payment Status Dashboard",
    subtitle: "The nurse views payment status for all generated links. She sends a reminder for one unpaid link.",
    specRef: "Solution 4.10",
    mockType: "portal",
    steps: [
      {
        screen: "Payment Status",
        kind: "portal-dashboard",
        rows: [
          { student: "Daniel Wanjiku", amount: "KES 2,500", smsSent: "9:14 AM", smsDelivered: "9:14 AM", paidAt: "9:52 AM", status: "paid" },
          { student: "Fatma Salim", amount: "KES 1,500", smsSent: "9:15 AM", smsDelivered: "9:15 AM", paidAt: "-", status: "delivered" },
          { student: "Brian Ochieng", amount: "KES 2,000", smsSent: "9:16 AM", smsDelivered: "-", paidAt: "-", status: "pending" },
          { student: "Sarah Kamau", amount: "KES 3,200", smsSent: "9:17 AM", smsDelivered: "9:17 AM", paidAt: "10:30 AM", status: "paid" },
          { student: "James Mwangi", amount: "KES 1,800", smsSent: "9:18 AM", smsDelivered: "9:18 AM", paidAt: "-", status: "delivered" },
        ],
        narrative: "The nurse opens her dashboard. She can see which parents have paid and which haven't. Fatma's mother received the SMS but hasn't paid yet.",
      },
      {
        screen: "Payment Status",
        kind: "portal-dashboard",
        rows: [
          { student: "Daniel Wanjiku", amount: "KES 2,500", smsSent: "9:14 AM", smsDelivered: "9:14 AM", paidAt: "9:52 AM", status: "paid" },
          { student: "Fatma Salim", amount: "KES 1,500", smsSent: "9:15 AM", smsDelivered: "9:15 AM", paidAt: "-", status: "delivered" },
          { student: "Brian Ochieng", amount: "KES 2,000", smsSent: "9:16 AM", smsDelivered: "-", paidAt: "-", status: "pending" },
          { student: "Sarah Kamau", amount: "KES 3,200", smsSent: "9:17 AM", smsDelivered: "9:17 AM", paidAt: "10:30 AM", status: "paid" },
          { student: "James Mwangi", amount: "KES 1,800", smsSent: "9:18 AM", smsDelivered: "9:18 AM", paidAt: "-", status: "delivered" },
        ],
        highlightRow: 1,
        narrative: "The nurse selects Fatma Salim's row. She wants to send a reminder to Fatma's mother, Amina.",
      },
      {
        screen: "Send reminder to Amina Salim?",
        kind: "portal-confirm",
        fields: [
          { label: "Student", value: "Fatma Salim" },
          { label: "Parent phone", value: "0711 XXX XXX" },
          { label: "Amount", value: "KES 1,500" },
          { label: "Original SMS", value: "Delivered at 9:15 AM" },
        ],
        narrative: "The nurse confirms the reminder. The SMS reuses the same payment link.",
      },
      {
        screen: "Sending reminder...",
        kind: "portal-auto",
        delay: 1500,
        narrative: "Reminder SMS sent: \"Reminder: Fatma Salim's treatment at Cana Hospital School Nurse. Pay KES 1,500 via Jireh: https://pay.jireh.health/t/abc123. No smartphone? Dial *654# and select 'Payment requests'.\"",
      },
      {
        screen: "Reminder sent",
        kind: "portal-status",
        badge: { label: "Reminder Sent", color: "#16A34A", bg: "#DCFCE7" },
        fields: [
          { label: "Student", value: "Fatma Salim" },
          { label: "Reminder sent to", value: "0711 XXX XXX" },
          { label: "Time", value: "2:45 PM" },
        ],
        narrative: "One tap to remind. The nurse doesn't need to compose a new SMS or re-enter the payment details.",
      },
    ],
  },

  /* ---- PARENT WEB SCENARIOS ---- */

  "parent-first-payment-web": {
    title: "First Payment via Web Link",
    subtitle: "Grace receives SMS from the nurse, opens the link, and pays for Daniel's treatment. No account creation. Cashback earned.",
    specRef: "Scenario 7.3.1",
    mockType: "mobile",
    steps: [
      {
        screen: "SMS from Cana Hospital School Nurse:\n\nDaniel Wanjiku was treated today. Pay KES 2,500 via Jireh:\nhttps://pay.jireh.health/t/abc123\n\nNo smartphone? Dial *654# and select 'Payment requests'.",
        kind: "sms",
        narrative: "Grace receives the SMS from the school nurse. She recognises Daniel's name and the school's hospital.",
      },
      {
        screen: "loading",
        kind: "mobile-auto",
        delay: 1500,
        narrative: "Grace taps the link. Her phone browser opens the pre-filled payment page.",
      },
      {
        screen: "payment-details",
        kind: "mobile-screen",
        fields: [
          { label: "Facility", value: "Cana Hospital, School Nurse" },
          { label: "Payment Number", value: "JH-384201" },
          { label: "Patient", value: "Daniel Wanjiku" },
          { label: "Amount", value: "KES 2,500" },
        ],
        narrative: "All payment details are pre-filled from the link. Grace sees exactly who the payment is for and how much. No manual entry needed.",
      },
      {
        screen: "payment-phone",
        kind: "mobile-input",
        fields: [
          { label: "Your M-Pesa phone number", value: "0722 XXX XXX" },
        ],
        narrative: "Grace enters her phone number. On future payments, this will be pre-filled.",
      },
      {
        screen: "payment-confirm",
        kind: "mobile-screen",
        fields: [
          { label: "Pay", value: "KES 2,500" },
          { label: "Via", value: "M-Pesa" },
          { label: "To", value: "Cana Hospital, School Nurse" },
          { label: "For", value: "Daniel Wanjiku" },
        ],
        narrative: "Grace reviews and taps 'Pay with M-Pesa'. No cashback available yet (first payment).",
      },
      {
        screen: "M-PESA\n\nPay KES 2,500 to\nJIREH HEALTH LTD\n\nEnter PIN: ****",
        kind: "mpesa",
        delay: 2500,
        narrative: "M-Pesa STK push appears. Grace enters her PIN.",
      },
      {
        screen: "payment-success",
        kind: "mobile-done",
        fields: [
          { label: "Paid", value: "KES 2,500" },
          { label: "For", value: "Daniel Wanjiku" },
          { label: "At", value: "Cana Hospital, School Nurse" },
          { label: "Cashback earned", value: "KES 125" },
        ],
        narrative: "Payment complete. A Tier 1 account is created silently for Grace using her M-Pesa number. Daniel is linked as her dependant.",
      },
      {
        screen: "onboarding-prompt",
        kind: "mobile-screen",
        fields: [
          { label: "Cashback balance", value: "KES 125" },
        ],
        narrative: "\"You earned KES 125 on this payment. Complete your Jireh account to use your cashback on your next payment. It takes under 2 minutes.\" Grace can onboard now or later.",
      },
      {
        screen: "SMS from JIREH HEALTH:\n\nYou paid KES 2,500 for Daniel Wanjiku at Cana Hospital via Jireh.\n\nYou earned KES 125 cashback.\n\nComplete your account to use it on your next payment:\nhttps://app.jireh.health\n\nNo smartphone? Dial *654# and select 'Payment requests'.",
        kind: "sms",
        narrative: "Grace receives a confirmation SMS with her cashback balance and an onboarding link. Total time: 40 seconds.",
      },
    ],
  },

  "parent-second-payment-gate": {
    title: "Second Payment Onboarding Gate",
    subtitle: "Grace opens her second payment link but hasn't onboarded yet. She must complete setup before paying, then returns to the payment.",
    specRef: "Solution 4.6",
    mockType: "mobile",
    steps: [
      {
        screen: "SMS from Cana Hospital School Nurse:\n\nDaniel Wanjiku was treated today. Pay KES 1,200 via Jireh:\nhttps://pay.jireh.health/t/def456\n\nNo smartphone? Dial *654# and select 'Payment requests'.",
        kind: "sms",
        narrative: "Two weeks later, Daniel is treated again. Grace receives a new payment link.",
      },
      {
        screen: "loading",
        kind: "mobile-auto",
        delay: 1500,
        narrative: "Grace taps the link. The system recognises her MSISDN and detects this is her second payment without onboarding.",
      },
      {
        screen: "onboarding-gate",
        kind: "mobile-screen",
        fields: [
          { label: "Unclaimed cashback", value: "KES 125" },
        ],
        narrative: "\"To continue paying with Jireh, please complete your account setup first. This takes under 2 minutes and unlocks your KES 125 cashback.\" Grace taps 'Set up my account'.",
      },
      {
        screen: "onboarding-name",
        kind: "mobile-input",
        fields: [
          { label: "First name", value: "Grace" },
          { label: "Surname", value: "Wanjiku" },
        ],
        narrative: "Grace enters her name. The onboarding flow is short: name, DOB, ID.",
      },
      {
        screen: "onboarding-id",
        kind: "mobile-input",
        fields: [
          { label: "Date of birth", value: "14/06/1988" },
          { label: "National ID number", value: "27654321" },
        ],
        narrative: "Grace enters her DOB and national ID. IPRS verification runs.",
      },
      {
        screen: "Verifying identity...",
        kind: "mobile-auto",
        delay: 1500,
        narrative: "IPRS verification confirms Grace Wanjiku. Her Tier 1 account upgrades to Tier 2.",
      },
      {
        screen: "onboarding-complete",
        kind: "mobile-screen",
        fields: [
          { label: "Account", value: "Grace Wanjiku (Tier 2)" },
          { label: "Cashback unlocked", value: "KES 125" },
          { label: "Dependant", value: "Daniel Wanjiku" },
        ],
        narrative: "Onboarding complete. Daniel appears as a dependant. Her payment history and cashback are preserved. Now she returns to the payment.",
      },
      {
        screen: "payment-blended",
        kind: "mobile-screen",
        fields: [
          { label: "Amount", value: "KES 1,200" },
          { label: "Cashback (apply)", value: "KES 125" },
          { label: "M-Pesa", value: "KES 1,075" },
          { label: "For", value: "Daniel Wanjiku" },
          { label: "At", value: "Cana Hospital, School Nurse" },
        ],
        narrative: "The blended payment screen shows KES 125 cashback reducing the M-Pesa amount to KES 1,075.",
      },
      {
        screen: "M-PESA\n\nPay KES 1,075 to\nJIREH HEALTH LTD\n\nEnter PIN: ****",
        kind: "mpesa",
        delay: 2500,
        narrative: "M-Pesa STK push for the reduced amount. Grace enters her PIN.",
      },
      {
        screen: "payment-success",
        kind: "mobile-done",
        fields: [
          { label: "Paid", value: "KES 1,200" },
          { label: "Cashback used", value: "KES 125" },
          { label: "M-Pesa paid", value: "KES 1,075" },
          { label: "New cashback earned", value: "KES 60" },
        ],
        narrative: "Payment complete. Grace used her cashback and earned KES 60 more. Future payments go straight to the blended screen.",
      },
    ],
  },

  /* ---- PARENT USSD SCENARIOS ---- */

  "parent-ussd-payment": {
    title: "USSD Payment Request (First Payment)",
    subtitle: "A parent on a feature phone dials *654#, finds the pending payment request from the nurse, and pays via M-Pesa.",
    specRef: "Solution 4.8",
    mockType: "ussd",
    steps: [
      { screen: "Dialing *654#\n\nConnecting...", kind: "dial", delay: 1500, narrative: "Grace's neighbour Mary doesn't have a smartphone. She received an SMS with the payment link but can't open it. She dials *654# instead." },
      { screen: "Welcome to Jireh\n\n1. Pay a bill\n2. Payment requests\n3. View cashback\n   balance", kind: "ussd", expect: "2", narrative: "The updated USSD menu includes 'Payment requests'. Mary selects option 2." },
      { screen: "Pending payment\nrequests:\n\n1. Brian Ochieng\n   KES 2,000\n   Cana Hospital\n   School Nurse", kind: "ussd", expect: "1", narrative: "The system looks up Mary's MSISDN and finds one pending payment request from the nurse." },
      { screen: "Pay KES 2,000 at\nCana Hospital\nSchool Nurse\nfor Brian Ochieng?\n\n1. Confirm\n2. Cancel", kind: "ussd", expect: "1", narrative: "Mary confirms the payment. The details match what the nurse told her about Brian's treatment." },
      { screen: "Requesting M-Pesa\npayment...\n\nPlease enter your\nM-Pesa PIN when\nprompted.", kind: "auto", delay: 2000, narrative: "The system initiates an M-Pesa STK push to Mary's phone." },
      { screen: "M-PESA\n\nPay KES 2,000 to\nJIREH HEALTH LTD\n\nEnter PIN: ****", kind: "mpesa", delay: 2500, narrative: "M-Pesa PIN entry dialog appears. Mary enters her PIN." },
      { screen: "Payment successful!\n\nKES 2,000 paid at\nCana Hospital\nSchool Nurse\nfor Brian Ochieng\n\nCashback earned:\nKES 100", kind: "done", narrative: "A Tier 1 account is created for Mary. KES 100 cashback earned. Brian is linked as a dependant." },
      { screen: "SMS from JIREH HEALTH\n\nYou paid KES 2,000\nfor Brian Ochieng at\nCana Hospital via\nJireh.\n\nYou earned KES 100\ncashback.\n\nTo claim cashback,\nregister by downloading\nthe Jireh app or dial\n*654# and choose\n'Register'.", kind: "sms", narrative: "Mary receives a confirmation SMS. She can use her KES 100 cashback on the next payment." },
    ],
  },

  "parent-ussd-second-payment": {
    title: "USSD Second Payment (KYC Gate)",
    subtitle: "Mary dials *654# for her second payment. The KYC gate triggers. After providing her details, she selects the payment request and pays.",
    specRef: "Solution 4.8",
    mockType: "ussd",
    steps: [
      { screen: "Dialing *654#\n\nConnecting...", kind: "dial", delay: 1500, narrative: "A month later, Brian is treated again. Mary dials *654# to pay." },
      { screen: "Welcome to Jireh\n\n1. Pay a bill\n2. Payment requests\n3. View cashback\n   balance", kind: "ussd", expect: "2", narrative: "Mary selects 'Payment requests' again." },
      { screen: "To continue using\nJireh, we need a few\ndetails.\n\nEnter your first name:", kind: "input", value: "Mary", narrative: "This is Mary's second payment. The one-time KYC gate triggers before she can access her payment requests." },
      { screen: "Enter your surname:", kind: "input", value: "Ochieng" },
      { screen: "Enter your date of\nbirth (DD/MM/YYYY):", kind: "input", value: "08/12/1979" },
      { screen: "Enter your national\nID number:", kind: "input", value: "22345678" },
      { screen: "Verifying your\nidentity...", kind: "auto", delay: 1500, narrative: "IPRS verification runs against the national registry." },
      { screen: "Pending payment\nrequests:\n\n1. Brian Ochieng\n   KES 1,200\n   Cana Hospital\n   School Nurse", kind: "ussd", expect: "1", narrative: "KYC complete. Mary sees the pending payment request from the nurse." },
      { screen: "You have KES 100\ncashback. Apply to\nthis payment?\n\n1. Yes, apply KES 100\n2. No, pay full amount", kind: "ussd", expect: "1", narrative: "Mary's cashback from the first payment is available. She applies it." },
      { screen: "Pay KES 1,100 at\nCana Hospital\nSchool Nurse\nfor Brian Ochieng?\n\n(KES 100 cashback\napplied)\n\n1. Confirm\n2. Cancel", kind: "ussd", expect: "1", narrative: "After KES 100 cashback, only KES 1,100 goes through M-Pesa." },
      { screen: "Requesting M-Pesa\npayment...\n\nPlease enter your\nM-Pesa PIN when\nprompted.", kind: "auto", delay: 2000, narrative: "The system initiates an M-Pesa STK push for the reduced amount." },
      { screen: "M-PESA\n\nPay KES 1,100 to\nJIREH HEALTH LTD\n\nEnter PIN: ****", kind: "mpesa", delay: 2500, narrative: "Mary enters her M-Pesa PIN." },
      { screen: "Payment successful!\n\nKES 1,200 paid at\nCana Hospital\nSchool Nurse\nfor Brian Ochieng\n\nKES 100 from cashback\nKES 1,100 from M-Pesa\n\nNew cashback: KES 60", kind: "done", narrative: "Payment complete. KES 100 cashback + KES 1,100 M-Pesa. New cashback: KES 60." },
    ],
  },

  /* ---- PARENT APP SCENARIO ---- */

  "parent-app-payment-request": {
    title: "App Payment Request (Onboarded Parent)",
    subtitle: "Grace has onboarded and installed the Jireh app. A new payment request from the nurse appears on her dashboard. She pays with cashback + M-Pesa.",
    specRef: "Solution 4.7",
    mockType: "app",
    steps: [
      {
        screen: "app-dashboard",
        kind: "app-screen",
        fields: [
          { label: "user", value: "Grace Wanjiku" },
          { label: "cashback", value: "KES 185" },
          { label: "notification", value: "New payment request from Cana Hospital School Nurse" },
          { label: "notification-detail", value: "Daniel Wanjiku • KES 3,500" },
        ],
        narrative: "Grace opens the Jireh app. A new payment request from the school nurse appears at the top of her dashboard. She doesn't need the SMS link.",
      },
      {
        screen: "app-payment-detail",
        kind: "app-screen",
        fields: [
          { label: "Facility", value: "Cana Hospital, School Nurse" },
          { label: "Payment Number", value: "JH-384201" },
          { label: "Patient", value: "Daniel Wanjiku" },
          { label: "Amount", value: "KES 3,500" },
        ],
        narrative: "Grace taps the notification. The payment request opens with all details pre-filled from the nurse's entry.",
      },
      {
        screen: "app-blended-payment",
        kind: "app-screen",
        fields: [
          { label: "Total", value: "KES 3,500" },
          { label: "Cashback", value: "KES 185" },
          { label: "M-Pesa", value: "KES 3,315" },
        ],
        narrative: "The blended payment screen shows Grace's KES 185 cashback applied automatically. She can adjust the split or pay the full amount via M-Pesa.",
      },
      {
        screen: "Confirming payment...",
        kind: "app-auto",
        delay: 1500,
        narrative: "Grace taps 'Pay KES 3,315 via M-Pesa'. The system initiates the STK push.",
      },
      {
        screen: "M-PESA\n\nPay KES 3,315 to\nJIREH HEALTH LTD\n\nEnter PIN: ****",
        kind: "mpesa",
        delay: 2500,
        narrative: "M-Pesa STK push appears. Grace enters her PIN.",
      },
      {
        screen: "app-payment-success",
        kind: "app-done",
        fields: [
          { label: "Paid", value: "KES 3,500" },
          { label: "Cashback used", value: "KES 185" },
          { label: "M-Pesa", value: "KES 3,315" },
          { label: "New cashback", value: "KES 175" },
          { label: "For", value: "Daniel Wanjiku" },
        ],
        narrative: "Payment complete. Grace sees her impact receipt: KES 3,500 for Daniel's treatment. KES 175 new cashback earned. Her payment history now shows 3 transactions for Daniel.",
      },
    ],
  },
};

/* ------------------------------------------------------------------ */
/*  CSS animations                                                     */
/* ------------------------------------------------------------------ */

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
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
`;

/* ------------------------------------------------------------------ */
/*  USSD Phone (replicated from ussd-payment prototype)                */
/* ------------------------------------------------------------------ */

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
  const isLoading = step.kind === "dial" || step.kind === "auto";
  const isDone = step.kind === "done";

  const bg = isMpesa ? "#f5f5f5" : isSms ? "#edf2f7" : "#b8c48a";
  const color = isMpesa ? "#1a1a1a" : isSms ? "#1a1a1a" : "#2d3314";

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
        <div style={{ marginTop: 8, borderTop: "1px solid rgba(45,51,20,0.2)", paddingTop: 6 }}>
          {inputFilled ? (
            <span>{`> ${step.value}`}</span>
          ) : (
            <span>{">"} <span style={{ animation: "cursorBlink 1s step-end infinite" }}>&#9646;</span></span>
          )}
        </div>
      )}
      {isLoading && (
        <div style={{ textAlign: "center", marginTop: 10, fontSize: 18, letterSpacing: 6 }}>
          <span style={{ animation: "loadDots 1.4s infinite 0s" }}>&#8226;</span>
          <span style={{ animation: "loadDots 1.4s infinite 0.2s" }}>&#8226;</span>
          <span style={{ animation: "loadDots 1.4s infinite 0.4s" }}>&#8226;</span>
        </div>
      )}
      {isDone && (
        <div style={{ textAlign: "center", marginTop: 6, fontSize: 20, color: "#4a6b2a" }}>&#10003;</div>
      )}
    </div>
  );
}

function FeaturePhone({
  step, inputFilled, onKey, onOk, highlightKey, highlightOk,
}: {
  step: Step | null; inputFilled: boolean;
  onKey: (key: string) => void; onOk: () => void;
  highlightKey: string | null; highlightOk: boolean;
}) {
  const softLeftLabel = step?.kind === "input" ? "Send" : step?.kind === "sms" || step?.kind === "done" ? "OK" : "Select";

  return (
    <div style={{
      width: 270, background: "linear-gradient(165deg, #3a3a3e 0%, #2d2d30 35%, #252528 100%)",
      borderRadius: 30, padding: "20px 18px 18px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 0, userSelect: "none",
    }}>
      <div style={{ color: "#666", fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>Jireh</div>
      <div style={{ width: "100%", background: "#1a1a1e", borderRadius: 8, padding: 8, boxShadow: "inset 0 2px 6px rgba(0,0,0,0.5)" }}>
        <PhoneScreen step={step} inputFilled={inputFilled} />
      </div>
      <div style={{ display: "flex", gap: 12, width: "100%", marginTop: 10 }}>
        <button style={{ flex: 1, height: 24, background: "#444448", border: "none", borderRadius: 4, color: "#ccc", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Courier New', monospace" }} onClick={onOk}>{softLeftLabel}</button>
        <button style={{ flex: 1, height: 24, background: "#444448", border: "none", borderRadius: 4, color: "#ccc", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Courier New', monospace" }}>Back</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 12 }}>
        <button style={{ width: 38, height: 24, borderRadius: 12, background: "#22c55e", border: "none", cursor: "pointer", fontSize: 12, color: "#fff" }}>&#9742;</button>
        <button style={{
          width: 42, height: 42, borderRadius: "50%",
          background: highlightOk ? "#5a5a5e" : "#3e3e42",
          border: highlightOk ? "2px solid rgba(160,32,240,0.5)" : "2px solid #555",
          color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer",
          animation: highlightOk ? "pulseKey 1.5s infinite" : "none",
          fontFamily: "'Courier New', monospace",
        }} onClick={onOk}>OK</button>
        <button style={{ width: 38, height: 24, borderRadius: 12, background: "#ef4444", border: "none", cursor: "pointer", fontSize: 12, color: "#fff" }}>&#9742;</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, width: "100%", marginTop: 12 }}>
        {KEYS.map((k) => {
          const isHl = highlightKey === k.n;
          return (
            <button key={k.n} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              height: 40, background: isHl ? "#5a5a5e" : "#3e3e42", border: "none", borderRadius: 6, cursor: "pointer",
              padding: 0, animation: isHl ? "pulseKey 1.5s infinite" : "none",
            }} onClick={() => onKey(k.n)}>
              <span style={{ color: "#fff", fontSize: 15, fontWeight: 700, lineHeight: 1 }}>{k.n}</span>
              {k.l && <span style={{ color: "#777", fontSize: 7, lineHeight: 1, marginTop: 1 }}>{k.l}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Portal Mockup (Nurse screens)                                      */
/* ------------------------------------------------------------------ */

function PortalMockup({ step, onNext }: { step: Step; onNext: () => void }) {
  const isAuto = step.kind === "portal-auto";
  const isDashboard = step.kind === "portal-dashboard";

  return (
    <div style={{ width: "100%", maxWidth: 520, background: "#fff", borderRadius: 12, border: "1px solid var(--border-default)", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden", animation: "fadeIn 0.2s ease" }}>
      {/* Header */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-default)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: "#FBF0FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#A020F0" }}>J</span>
          </div>
          <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--fg-heading)" }}>Cana Hospital, School Nurse</span>
        </div>
        {step.badge && (
          <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: step.badge.color, background: step.badge.bg, padding: "2px 10px", borderRadius: 99 }}>
            {step.badge.label}
          </span>
        )}
      </div>

      {/* Title */}
      <div style={{ padding: "16px 20px 0" }}>
        <h3 style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--fg-heading)", marginBottom: 4 }}>{step.screen}</h3>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 20px 20px" }}>
        {isAuto && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "32px 0", gap: 10 }}>
            <div style={{ width: 20, height: 20, border: "2px solid #A020F0", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>{step.screen}</span>
          </div>
        )}

        {isDashboard && step.rows && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border-default)" }}>
                  <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--fg-muted)", fontWeight: 600 }}>Student</th>
                  <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--fg-muted)", fontWeight: 600 }}>Amount</th>
                  <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--fg-muted)", fontWeight: 600 }}>SMS Sent</th>
                  <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--fg-muted)", fontWeight: 600 }}>Delivered</th>
                  <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--fg-muted)", fontWeight: 600 }}>Paid</th>
                  <th style={{ textAlign: "left", padding: "8px 6px", color: "var(--fg-muted)", fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {step.rows.map((row, i) => {
                  const isHighlighted = step.highlightRow === i;
                  const statusColor = row.status === "paid" ? "#16A34A" : row.status === "delivered" ? "#EA580C" : "#6B7280";
                  const statusBg = row.status === "paid" ? "#DCFCE7" : row.status === "delivered" ? "#FFF7ED" : "#F3F4F6";
                  return (
                    <tr key={i} style={{
                      borderBottom: "1px solid var(--border-default)",
                      background: isHighlighted ? "#FBF0FF" : "transparent",
                      cursor: "pointer",
                    }}>
                      <td style={{ padding: "8px 6px", fontWeight: 500, color: "var(--fg-heading)" }}>{row.student}</td>
                      <td style={{ padding: "8px 6px", color: "var(--fg-default)" }}>{row.amount}</td>
                      <td style={{ padding: "8px 6px", color: "var(--fg-muted)" }}>{row.smsSent}</td>
                      <td style={{ padding: "8px 6px", color: "var(--fg-muted)" }}>{row.smsDelivered}</td>
                      <td style={{ padding: "8px 6px", color: "var(--fg-muted)" }}>{row.paidAt}</td>
                      <td style={{ padding: "8px 6px" }}>
                        <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: statusColor, background: statusBg, padding: "2px 8px", borderRadius: 99 }}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {step.kind === "portal-form" && step.fields && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {step.fields.map((f, i) => (
              <div key={i}>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--fg-muted)", marginBottom: 4 }}>{f.label}</label>
                {f.type === "select" ? (
                  <div style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-default)", background: "#fff", fontSize: "0.8125rem", color: "var(--fg-heading)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{f.value}</span>
                    <span style={{ color: "var(--fg-muted)", fontSize: "0.6875rem" }}>&#9662;</span>
                  </div>
                ) : (
                  <div style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-default)", background: "#fff", fontSize: "0.8125rem", color: "var(--fg-heading)" }}>
                    {f.value}
                  </div>
                )}
              </div>
            ))}
            <button onClick={onNext} style={{
              marginTop: 4, padding: "10px 0", borderRadius: 8, border: "none", background: "#A020F0", color: "#fff",
              fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
            }}>
              {step.screen === "Confirm Payment Link" ? "Generate Link" : "Continue"}
            </button>
          </div>
        )}

        {step.kind === "portal-confirm" && step.fields && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {step.fields.map((f, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-default)" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>{f.label}</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--fg-heading)" }}>{f.value}</span>
              </div>
            ))}
            <button onClick={onNext} style={{
              marginTop: 8, padding: "10px 0", borderRadius: 8, border: "none", background: "#A020F0", color: "#fff",
              fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
            }}>
              Confirm &amp; Send SMS
            </button>
          </div>
        )}

        {step.kind === "portal-status" && step.fields && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {step.fields.map((f, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-default)" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>{f.label}</span>
                <span style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--fg-heading)" }}>{f.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile Mockup (Parent web payment screens)                         */
/* ------------------------------------------------------------------ */

function MobileMockup({ step, onNext }: { step: Step; onNext: () => void }) {
  const isMpesa = step.kind === "mpesa";
  const isSms = step.kind === "sms";
  const isAuto = step.kind === "mobile-auto";
  const isDone = step.kind === "mobile-done";
  const isInput = step.kind === "mobile-input";
  const isScreen = step.kind === "mobile-screen";

  return (
    <div style={{
      width: 320, minHeight: 540,
      background: "#1a1a1e", borderRadius: 36, padding: "12px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", userSelect: "none",
    }}>
      {/* Notch */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <div style={{ width: 80, height: 6, borderRadius: 3, background: "#333" }} />
      </div>

      {/* Screen */}
      <div style={{
        flex: 1, borderRadius: 24, overflow: "hidden", background: "#fff",
        display: "flex", flexDirection: "column", animation: "fadeIn 0.2s ease",
      }}>
        {isMpesa ? (
          <div style={{ flex: 1, padding: 20, background: "#f5f5f5", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ background: "#4CAF50", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, letterSpacing: 1, textAlign: "center", marginBottom: 20 }}>M-PESA</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "'Courier New', monospace", fontSize: 14, lineHeight: 1.6, textAlign: "center", color: "#1a1a1a" }}>{step.screen}</pre>
          </div>
        ) : isSms ? (
          <div style={{ flex: 1, padding: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ background: "#3B82F6", color: "#fff", padding: "12px 16px", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 15 }}>&#9993;</span> SMS
            </div>
            <div style={{ flex: 1, padding: 16, background: "#edf2f7" }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.6, color: "#1a1a1a" }}>{step.screen}</pre>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Jireh header */}
            <div style={{ background: "#A020F0", padding: "16px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>J</span>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Cana Hospital</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>School Nurse (JH-384201)</div>
              </div>
            </div>

            {/* Body */}
            <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {isAuto && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                  <div style={{ width: 28, height: 28, border: "3px solid #A020F0", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>Loading...</span>
                </div>
              )}

              {(isScreen || isInput || isDone) && step.fields && (
                <>
                  {/* Payment details card */}
                  {step.screen === "payment-details" && (
                    <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 14, border: "1px solid var(--border-default)" }}>
                      <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Payment Details</div>
                      {step.fields.map((f, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < step.fields!.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{f.label}</span>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--fg-heading)", textAlign: "right" }}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.screen === "payment-phone" && step.fields.map((f, i) => (
                    <div key={i}>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--fg-muted)", marginBottom: 4 }}>{f.label}</label>
                      <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.8125rem", color: "var(--fg-heading)" }}>{f.value}</div>
                    </div>
                  ))}

                  {step.screen === "payment-confirm" && (
                    <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 14, border: "1px solid var(--border-default)" }}>
                      {step.fields.map((f, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < step.fields!.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{f.label}</span>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--fg-heading)" }}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.screen === "payment-success" && (
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24, color: "#16A34A" }}>&#10003;</div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: "#16A34A", marginBottom: 12 }}>Payment Successful</div>
                      {step.fields.map((f, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderBottom: i < step.fields!.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{f.label}</span>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--fg-heading)" }}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {step.screen === "onboarding-prompt" && (
                    <div style={{ textAlign: "center", padding: "12px 0" }}>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--fg-heading)", marginBottom: 8 }}>You earned cashback!</div>
                      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#16A34A", marginBottom: 12 }}>KES {step.fields[0]?.value.replace("KES ", "")}</div>
                      <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", lineHeight: 1.5, marginBottom: 16 }}>
                        Complete your Jireh account to use your cashback on your next payment. It takes under 2 minutes.
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <button onClick={onNext} style={{ padding: "10px", borderRadius: 8, border: "none", background: "#A020F0", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>Set up my account</button>
                        <button onClick={onNext} style={{ padding: "10px", borderRadius: 8, border: "1px solid var(--border-default)", background: "#fff", color: "var(--fg-muted)", fontSize: "0.8125rem", cursor: "pointer" }}>Maybe later</button>
                      </div>
                    </div>
                  )}

                  {step.screen === "onboarding-gate" && (
                    <div style={{ textAlign: "center", padding: "12px 0" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FBF0FF", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24, color: "#A020F0" }}>&#128274;</div>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--fg-heading)", marginBottom: 8 }}>Account setup required</div>
                      <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", lineHeight: 1.5, marginBottom: 8 }}>
                        To continue paying with Jireh, please complete your account setup first. This takes under 2 minutes.
                      </p>
                      <div style={{ background: "#DCFCE7", borderRadius: 8, padding: 10, marginBottom: 16 }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#16A34A" }}>Unlocks KES {step.fields[0]?.value.replace("KES ", "")} cashback</span>
                      </div>
                      <button onClick={onNext} style={{ width: "100%", padding: "10px", borderRadius: 8, border: "none", background: "#A020F0", color: "#fff", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer" }}>Set up my account</button>
                    </div>
                  )}

                  {(step.screen === "onboarding-name" || step.screen === "onboarding-id") && step.fields.map((f, i) => (
                    <div key={i}>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 500, color: "var(--fg-muted)", marginBottom: 4 }}>{f.label}</label>
                      <div style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border-default)", fontSize: "0.8125rem", color: "var(--fg-heading)" }}>{f.value}</div>
                    </div>
                  ))}

                  {step.screen === "onboarding-complete" && (
                    <div style={{ textAlign: "center", padding: "12px 0" }}>
                      <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24, color: "#16A34A" }}>&#10003;</div>
                      <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#16A34A", marginBottom: 12 }}>Account setup complete</div>
                      {step.fields.map((f, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderBottom: i < step.fields!.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                          <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{f.label}</span>
                          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--fg-heading)" }}>{f.value}</span>
                        </div>
                      ))}
                      <p style={{ fontSize: "0.75rem", color: "var(--fg-muted)", marginTop: 12, lineHeight: 1.5 }}>Returning to your payment...</p>
                    </div>
                  )}

                  {step.screen === "payment-blended" && (
                    <div>
                      <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Payment Breakdown</div>
                      {step.fields.map((f, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between", padding: "10px 0",
                          borderBottom: i < step.fields!.length - 1 ? "1px solid var(--border-default)" : "none",
                        }}>
                          <span style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>{f.label}</span>
                          <span style={{
                            fontSize: "0.8125rem", fontWeight: 600,
                            color: f.label === "Cashback (apply)" ? "#16A34A" : "var(--fg-heading)",
                          }}>{f.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Bottom action for input/screen steps */}
              {(isScreen || isInput) && !["onboarding-prompt", "onboarding-gate", "onboarding-complete"].includes(step.screen) && (
                <div style={{ marginTop: "auto", paddingTop: 8 }}>
                  <button onClick={onNext} style={{
                    width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#A020F0", color: "#fff",
                    fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
                  }}>
                    {step.screen === "payment-confirm" || step.screen === "payment-blended" ? "Pay with M-Pesa" :
                     step.screen === "payment-phone" || step.screen.startsWith("onboarding-") ? "Continue" : "Next"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Home indicator */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <div style={{ width: 100, height: 4, borderRadius: 2, background: "#444" }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  App Mockup (Onboarded parent in Jireh app)                         */
/* ------------------------------------------------------------------ */

function AppMockup({ step, onNext }: { step: Step; onNext: () => void }) {
  const isMpesa = step.kind === "mpesa";
  const isAuto = step.kind === "app-auto";
  const isDone = step.kind === "app-done";

  return (
    <div style={{
      width: 320, minHeight: 540,
      background: "#1a1a1e", borderRadius: 36, padding: "12px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      display: "flex", flexDirection: "column", userSelect: "none",
    }}>
      {/* Notch */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <div style={{ width: 80, height: 6, borderRadius: 3, background: "#333" }} />
      </div>

      <div style={{ flex: 1, borderRadius: 24, overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column", animation: "fadeIn 0.2s ease" }}>
        {isMpesa ? (
          <div style={{ flex: 1, padding: 20, background: "#f5f5f5", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <div style={{ background: "#4CAF50", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 700, letterSpacing: 1, textAlign: "center", marginBottom: 20 }}>M-PESA</div>
            <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "'Courier New', monospace", fontSize: 14, lineHeight: 1.6, textAlign: "center", color: "#1a1a1a" }}>{step.screen}</pre>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* App header */}
            <div style={{ background: "#A020F0", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>GW</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Hi Grace</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>Jireh Health</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.15)", padding: "3px 10px", borderRadius: 99, fontWeight: 600 }}>
                &#128276;
              </div>
            </div>

            <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" }}>
              {isAuto && (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                  <div style={{ width: 28, height: 28, border: "3px solid #A020F0", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <span style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>Processing payment...</span>
                </div>
              )}

              {step.screen === "app-dashboard" && step.fields && (
                <>
                  {/* Cashback card */}
                  <div style={{ background: "linear-gradient(135deg, #A020F0, #7B18B8)", borderRadius: 12, padding: 16, color: "#fff" }}>
                    <div style={{ fontSize: "0.6875rem", opacity: 0.8, marginBottom: 4 }}>Cashback balance</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{step.fields.find(f => f.label === "cashback")?.value}</div>
                  </div>

                  {/* Payment request notification */}
                  <div style={{ background: "#FBF0FF", borderRadius: 10, padding: 14, border: "1px solid rgba(160,32,240,0.2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#A020F0" }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#A020F0" }}>Payment Request</span>
                    </div>
                    <div style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--fg-heading)", marginBottom: 2 }}>
                      {step.fields.find(f => f.label === "notification")?.value}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>
                      {step.fields.find(f => f.label === "notification-detail")?.value}
                    </div>
                  </div>

                  {/* Recent activity placeholder */}
                  <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 }}>Recent Activity</div>
                  <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 12, fontSize: "0.75rem", color: "var(--fg-muted)" }}>
                    Paid KES 1,200 at Cana Hospital, School Nurse
                    <div style={{ fontSize: "0.6875rem", marginTop: 2 }}>2 weeks ago</div>
                  </div>
                  <div style={{ background: "#F9FAFB", borderRadius: 8, padding: 12, fontSize: "0.75rem", color: "var(--fg-muted)" }}>
                    Paid KES 2,500 at Cana Hospital, School Nurse
                    <div style={{ fontSize: "0.6875rem", marginTop: 2 }}>1 month ago</div>
                  </div>
                </>
              )}

              {step.screen === "app-payment-detail" && step.fields && (
                <div style={{ background: "#F9FAFB", borderRadius: 10, padding: 14, border: "1px solid var(--border-default)" }}>
                  <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Payment Request</div>
                  {step.fields.map((f, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: i < step.fields!.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{f.label}</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--fg-heading)", textAlign: "right" }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {step.screen === "app-blended-payment" && step.fields && (
                <div>
                  <div style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--fg-muted)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Payment Breakdown</div>
                  {step.fields.map((f, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", padding: "10px 0",
                      borderBottom: i < step.fields!.length - 1 ? "1px solid var(--border-default)" : "none",
                    }}>
                      <span style={{ fontSize: "0.8125rem", color: "var(--fg-muted)" }}>{f.label}</span>
                      <span style={{
                        fontSize: "0.8125rem", fontWeight: 600,
                        color: f.label === "Cashback" ? "#16A34A" : "var(--fg-heading)",
                      }}>{f.value}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, padding: 8, background: "#DCFCE7", borderRadius: 6, textAlign: "center" }}>
                    <span style={{ fontSize: "0.6875rem", color: "#16A34A" }}>KES 185 cashback applied automatically</span>
                  </div>
                </div>
              )}

              {isDone && step.fields && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24, color: "#16A34A" }}>&#10003;</div>
                  <div style={{ fontSize: "1rem", fontWeight: 700, color: "#16A34A", marginBottom: 12 }}>Payment Successful</div>
                  {step.fields.map((f, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 12px", borderBottom: i < step.fields!.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--fg-muted)" }}>{f.label}</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: f.label === "New cashback" ? "#16A34A" : "var(--fg-heading)" }}>{f.value}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action button for non-auto, non-done, non-mpesa */}
              {!isAuto && !isDone && !isMpesa && (
                <div style={{ marginTop: "auto", paddingTop: 8 }}>
                  <button onClick={onNext} style={{
                    width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "#A020F0", color: "#fff",
                    fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer",
                  }}>
                    {step.screen === "app-blended-payment" ? "Pay KES 3,315 via M-Pesa" :
                     step.screen === "app-dashboard" ? "View Payment Request" : "Continue"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
        <div style={{ width: 100, height: 4, borderRadius: 2, background: "#444" }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main ScenarioFlow component                                        */
/* ------------------------------------------------------------------ */

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

  // Auto-advance for timed steps
  useEffect(() => {
    if (!currentStep) return;
    const autoKinds: StepKind[] = ["dial", "auto", "mpesa", "portal-auto", "mobile-auto", "app-auto"];
    if (autoKinds.includes(currentStep.kind)) {
      const timer = setTimeout(advance, currentStep.delay || 1500);
      return () => clearTimeout(timer);
    }
  }, [stepIndex, currentStep, advance]);

  // USSD key handler
  const handleKey = useCallback((key: string) => {
    if (!currentStep || currentStep.kind !== "ussd") return;
    if (currentStep.expect && key === currentStep.expect) {
      advance();
    }
  }, [currentStep, advance]);

  // USSD OK handler
  const handleOk = useCallback(() => {
    if (!currentStep) return;
    if (currentStep.kind === "input" && !inputFilled) {
      setInputFilled(true);
      setTimeout(advance, 500);
    } else if (currentStep.kind === "sms" || currentStep.kind === "done") {
      advance();
    }
  }, [currentStep, inputFilled, advance]);

  // Divider continue
  const handleDividerContinue = useCallback(() => {
    if (currentStep?.kind === "divider") advance();
  }, [currentStep, advance]);

  // Portal/mobile/app next handler
  const handleMockupNext = useCallback(() => {
    advance();
  }, [advance]);

  const restart = () => {
    setStepIndex(0);
    setInputFilled(false);
    setTransitioning(false);
  };

  if (!scenario) {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "48px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--fg-muted)" }}>Scenario not found.</p>
        <Link href="/school-nurse-payment" style={{ color: "#A020F0", textDecoration: "none", fontSize: "0.875rem" }}>
          &larr; Back to scenarios
        </Link>
      </div>
    );
  }

  const highlightKey = currentStep?.kind === "ussd" ? (currentStep.expect ?? null) : null;
  const highlightOk = currentStep?.kind === "input" && !inputFilled;
  const mockType = scenario.mockType;

  // Determine if the current step should use the USSD phone within a non-ussd scenario
  const isUssdStep = currentStep && ["dial", "ussd", "input", "auto", "mpesa", "sms", "done"].includes(currentStep.kind);
  const isMobileStep = currentStep && ["mobile-screen", "mobile-input", "mobile-auto", "mobile-done"].includes(currentStep.kind);
  const isAppStep = currentStep && ["app-screen", "app-auto", "app-done"].includes(currentStep.kind);
  const isPortalStep = currentStep && ["portal-form", "portal-confirm", "portal-status", "portal-auto", "portal-list", "portal-dashboard"].includes(currentStep.kind);

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px 64px" }}>
      <style>{CSS}</style>

      <Link href="/school-nurse-payment" style={{ fontSize: "0.8125rem", color: "#A020F0", textDecoration: "none", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 20 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
        All scenarios
      </Link>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: "0.6875rem", color: "#A020F0", fontWeight: 500, background: "#FBF0FF", padding: "2px 8px", borderRadius: 99 }}>
            {scenario.specRef}
          </span>
          <span style={{ fontSize: "0.6875rem", color: "var(--fg-muted)", fontWeight: 500, background: "#F3F4F6", padding: "2px 8px", borderRadius: 99 }}>
            {mockType === "portal" ? "Nurse Portal" : mockType === "ussd" ? "USSD" : mockType === "app" ? "Jireh App" : "Web Payment"}
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
          <button onClick={handleDividerContinue} style={{
            padding: "10px 28px", borderRadius: 8, border: "1px solid #A020F0", background: "#FBF0FF", color: "#A020F0",
            fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
          }}>
            Continue &rarr;
          </button>
          <div style={{ width: 60, height: 1, background: "#ddd", margin: "20px auto 0" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ opacity: transitioning ? 0.5 : 1, transition: "opacity 0.15s" }}>
            {/* Render the appropriate mockup based on scenario type and step kind */}
            {(mockType === "ussd" || (isUssdStep && !isMobileStep && !isAppStep && !isPortalStep)) && currentStep && (
              <FeaturePhone
                step={currentStep}
                inputFilled={inputFilled}
                onKey={handleKey}
                onOk={handleOk}
                highlightKey={highlightKey}
                highlightOk={highlightOk}
              />
            )}

            {(mockType === "portal" && isPortalStep) && currentStep && (
              <PortalMockup step={currentStep} onNext={handleMockupNext} />
            )}

            {/* SMS and done steps within portal scenarios */}
            {mockType === "portal" && currentStep && currentStep.kind === "done" && !isPortalStep && (
              <div style={{ width: "100%", maxWidth: 520, background: "#fff", borderRadius: 12, border: "1px solid var(--border-default)", padding: 24, textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", fontSize: 24, color: "#16A34A" }}>&#10003;</div>
                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "#16A34A" }}>Complete</div>
              </div>
            )}

            {(mockType === "mobile" && (isMobileStep || isUssdStep)) && currentStep && (
              isMobileStep ? (
                <MobileMockup step={currentStep} onNext={handleMockupNext} />
              ) : (
                <MobileMockup step={currentStep} onNext={handleMockupNext} />
              )
            )}

            {(mockType === "app" && (isAppStep || isUssdStep)) && currentStep && (
              isAppStep ? (
                <AppMockup step={currentStep} onNext={handleMockupNext} />
              ) : (
                <AppMockup step={currentStep} onNext={handleMockupNext} />
              )
            )}
          </div>

          {/* Progress, narrative, hints, and controls below the mockup */}
          <div style={{ width: "100%", maxWidth: 320, marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
            {/* Progress bar */}
            <div style={{ width: "100%", maxWidth: 320 }}>
              <div style={{ width: "100%", height: 3, background: "#eee", borderRadius: 2 }}>
                <div style={{
                  width: `${((stepIndex + 1) / scenario.steps.length) * 100}%`,
                  height: "100%", background: "#A020F0", borderRadius: 2, transition: "width 0.3s",
                }} />
              </div>
              <p style={{ fontSize: "0.6875rem", color: "#999", textAlign: "center", marginTop: 6 }}>
                Step {stepIndex + 1} of {scenario.steps.length}
              </p>
            </div>

            {/* Narrative */}
            {currentStep?.narrative && (
              <p style={{ fontSize: "0.8125rem", color: "#666", textAlign: "center", maxWidth: 400, margin: "8px auto 0", lineHeight: 1.55 }}>
                {currentStep.narrative}
              </p>
            )}

            {/* USSD interaction hints */}
            {currentStep?.kind === "ussd" && currentStep.expect && (
              <p style={{ fontSize: "0.6875rem", color: "#A020F0", textAlign: "center", marginTop: 8 }}>
                Press <strong>{currentStep.expect}</strong> on the keypad
              </p>
            )}
            {currentStep?.kind === "input" && !inputFilled && mockType === "ussd" && (
              <p style={{ fontSize: "0.6875rem", color: "#A020F0", textAlign: "center", marginTop: 8 }}>
                Tap <strong>Send</strong> or <strong>OK</strong> to enter: {currentStep.value}
              </p>
            )}

            {/* Portal/mobile/app manual advance for status and non-interactive steps */}
            {currentStep && (
              (currentStep.kind === "portal-status" || currentStep.kind === "portal-dashboard") && (
                <button onClick={handleMockupNext} style={{
                  marginTop: 16, padding: "8px 24px", borderRadius: 8, border: "1px solid #A020F0", background: "#FBF0FF", color: "#A020F0",
                  fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
                }}>
                  {isLastStep ? "Done" : "Next →"}
                </button>
              )
            )}

            {/* SMS steps in mobile/app context need a next button */}
            {currentStep && currentStep.kind === "sms" && (mockType === "mobile" || mockType === "app") && (
              <button onClick={handleMockupNext} style={{
                marginTop: 16, padding: "8px 24px", borderRadius: 8, border: "1px solid #A020F0", background: "#FBF0FF", color: "#A020F0",
                fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
              }}>
                {isLastStep ? "Done" : "Next →"}
              </button>
            )}

            {/* Done steps in mobile/app context */}
            {currentStep && (currentStep.kind === "mobile-done" || currentStep.kind === "app-done") && (
              <button onClick={handleMockupNext} style={{
                marginTop: 16, padding: "8px 24px", borderRadius: 8, border: "1px solid #A020F0", background: "#FBF0FF", color: "#A020F0",
                fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
              }}>
                {isLastStep ? "Done" : "Next →"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom controls */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
        <button onClick={restart} style={{
          padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-surface)",
          color: "var(--fg-muted)", fontSize: "0.75rem", fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)",
        }}>Restart</button>
        <Link href="/school-nurse-payment" style={{
          padding: "8px 18px", borderRadius: 8, border: "1px solid var(--border-default)", background: "var(--bg-surface)",
          color: "var(--fg-muted)", fontSize: "0.75rem", fontWeight: 500, textDecoration: "none", fontFamily: "var(--font-sans)",
        }}>All scenarios</Link>
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
