/* Logic map of the Miro board "[Jordi] Sign up and login", transcribed from
   the PDF export. Positions follow the board layout (board units).

   - screen   (yellow): a prototype screen, clickable. `screen` is its
                         data-screen id in prototype/index.html.
   - decision (blue):   a logic branch, not interactable.
   - backend  (orange / purple / green): consequence of the journey (account
                         linked, signup, login), not interactable. */

export type NodeKind = 'screen' | 'decision' | 'backend'
export type Tone = 'orange' | 'purple' | 'green'

export interface FlowNode {
  /** Internal id, referenced by edges. */
  id: string
  /** Stable design id shown on yellow nodes (S01, S02...). Never renumber; append new ones. */
  code?: string
  label: string
  kind: NodeKind
  tone?: Tone
  /** Prototype screen id (screen nodes only). */
  screen?: string
  x: number
  y: number
}

export interface FlowEdge {
  from: string
  to: string
  label?: string
  /** x (board units) of the vertical segment of the elbow. Defaults to the midpoint. */
  bendX?: number
  /** Leave from the bottom of the source node (down, then across) instead of its right side. */
  exit?: 'bottom'
}

export interface ScreenDef {
  id: string
  title: string
}

/* One entry per distinct screen. Several yellow nodes can share a screen. */
export const SCREENS: ScreenDef[] = [
  { id: 'landing', title: 'Sign-in landing' },
  { id: 'send-otp', title: 'Send one-time password (OTP)' },
  { id: 'input-otp', title: 'Input OTP' },
  { id: 'protect-account', title: 'Protect your account' },
  { id: 'welcome-methods', title: 'Welcome back! Screen with existing methods' },
  { id: 'welcome-no-methods', title: 'Welcome back! No linked methods' },
  { id: 'welcome-otp', title: 'Welcome back! Login methods + OTP' },
  { id: 'verify-otp', title: 'Verify OTP' },
  { id: 'verify-password', title: 'Verify password' },
  { id: 'email-entry', title: 'Introduce email' },
  { id: 'validate-email-otp', title: 'Validate email OTP page' },
  { id: 'social-3p', title: 'Select method and perform steps on 3rd party' },
  { id: 'send-otp-auto', title: 'Send OTP automatically (no user input)' },
]

const S = (code: string, id: string, label: string, screen: string, x: number, y: number): FlowNode => ({
  id, code, label, kind: 'screen', screen, x, y,
})
const D = (id: string, label: string, x: number, y: number): FlowNode => ({
  id, label, kind: 'decision', x, y,
})
const B = (id: string, label: string, tone: Tone, x: number, y: number): FlowNode => ({
  id, label, kind: 'backend', tone, x, y,
})
const LOGIN = (id: string, x: number, y: number, label = 'Login') => B(id, label, 'green', x, y)

export const NODES: FlowNode[] = [
  /* Landing + phone */
  S('S01', 'landing', 'Sign-in landing', 'landing', 497, 380),
  S('S02', 'phone-entry', 'Introduce phone number and choose OTP method', 'landing', 614, 346),
  S('S03', 'phone-send', 'Send One Time Password (OTP)', 'send-otp', 669, 346),
  S('S04', 'phone-input', 'Input OTP', 'input-otp', 717, 346),
  D('d-newphone', 'New phone number?', 817, 301),
  D('d-known', 'Known device?', 953, 301),
  LOGIN('l-known', 1110, 301),
  D('d-second', 'Has second method?', 953, 346),
  S('S05', 'welcome-methods', 'Welcome back! Screen with existing methods', 'welcome-methods', 1068, 346),
  S('S06', 'welcome-nolinked', 'Welcome back! No linked methods', 'welcome-no-methods', 1063, 429),

  /* Protect your account (new phone) */
  S('S07', 'protect-new', 'Protect your account', 'protect-account', 877, 262),
  D('d-emailexists', 'Email exists?', 902, 200),
  S('S08', 'verify-a', 'Verify OTP', 'verify-otp', 1012, 200),
  B('signup-a', 'Signup', 'purple', 1148, 200),
  LOGIN('l-a', 1199, 200),
  S('S09', 'welcome-top', 'Welcome back! Screen with existing methods', 'welcome-methods', 902, 155),
  D('d-top-social', 'Social', 1007, 90),
  B('be-top-social', 'New phone linked to existing account', 'orange', 1071, 90),
  LOGIN('l-top-social', 1121, 90),
  D('d-top-pw', 'Password', 1007, 123),
  B('be-top-pw', 'New phone linked to existing account', 'orange', 1071, 123),
  LOGIN('l-top-pw', 1121, 123),
  S('S10', 'verify-top', 'Verify OTP', 'verify-otp', 1012, 155),
  B('be-top-email', 'New phone linked to existing account', 'orange', 1129, 155),
  LOGIN('l-top-email', 1192, 155),
  D('d-socialother', 'Social linked to another account?', 999, 262),
  B('signup-s', 'Signup', 'purple', 1061, 228),
  LOGIN('l-s-no', 1110, 228),
  B('be-s', 'New phone linked to existing account', 'orange', 1061, 262),
  LOGIN('l-s-yes', 1110, 262),

  /* Welcome back (existing methods) outcomes */
  D('d-linkedA', 'Linked to Account A (of initial phone no.)?', 1163, 316),
  LOGIN('l-A', 1163, 250, 'Login to Account A'),
  D('d-existingacct', 'Existing account?', 1228, 316),
  B('be-linkedB', 'Phone linked to existing account', 'orange', 1228, 251),
  LOGIN('l-B', 1278, 251, 'Login to Account B'),
  B('signup-e', 'Signup', 'purple', 1283, 316),
  B('be-newacct', 'Phone linked to new account', 'orange', 1330, 276),
  LOGIN('l-newacct', 1374, 276),
  D('d-pw', 'Password', 1164, 346),
  LOGIN('l-pw', 1228, 346),
  D('d-emailotp', 'Email OTP', 1164, 377),
  LOGIN('l-emailotp', 1228, 377),

  /* Protect your account (existing account) */
  S('S11', 'protect-exist', 'Protect your account', 'protect-account', 1262, 406),
  D('d-selects', 'Selects existing method?', 1305, 355),
  LOGIN('l-selA', 1428, 355, 'Login to Account A'),
  B('be-selB', 'Phone linked to existing account', 'orange', 1375, 380),
  LOGIN('l-selB', 1440, 380, 'Login to Account B'),
  B('be-selNo', 'Phone linked to existing account', 'orange', 1360, 330),
  B('signup-sel', 'Signup', 'purple', 1425, 330),
  LOGIN('l-selNo', 1470, 330),
  D('d-existingemail', 'Existing email?', 1326, 436),
  S('S12', 'validate-email', 'Validate email OTP page', 'validate-email-otp', 1387, 418),
  D('d-verify-new', 'Verify OTP', 1458, 418),
  B('signup-new', 'Signup', 'purple', 1520, 380),
  B('be-new2', 'Phone linked to new account', 'orange', 1520, 342),
  LOGIN('l-new2', 1520, 304),
  D('d-verify-exist', 'Verify OTP', 1458, 451),
  LOGIN('l-verify-exist', 1546, 451),
  S('S13', 'welcome-right', 'Welcome back! Screen with existing methods', 'welcome-methods', 1400, 486),
  D('d-pw-r', 'Password', 1481, 486),
  LOGIN('l-pw-r', 1546, 486),
  D('d-emailotp-r', 'Email OTP', 1481, 519),
  LOGIN('l-emailotp-r', 1546, 519),
  LOGIN('l-social-r', 1482, 552),

  /* Social */
  S('S14', 'social-3p', 'Select methods and performs steps on 3rd party', 'social-3p', 614, 425),
  D('d-newaccount', 'New account?', 689, 425),
  LOGIN('l-social-exist', 871, 397),
  B('signup-f', 'Signup', 'purple', 818, 459),
  LOGIN('l-social-new', 871, 459),

  /* Email */
  S('S15', 'email-entry', 'Introduces email', 'email-entry', 601, 515),
  D('d-emailexists2', 'Email exists?', 690, 515),
  S('S16', 'verify-c', 'Verify OTP', 'verify-otp', 777, 515),
  B('signup-c', 'Signup', 'purple', 885, 515),
  LOGIN('l-c', 947, 515),
  D('d-haslogin', 'Has login methods?', 690, 565),
  S('S17', 'verify-d', 'Verify OTP', 'verify-otp', 777, 565),
  LOGIN('l-d', 855, 565),
  S('S18', 'welcome-otp', 'Welcome back!! login methods + OTP', 'welcome-otp', 690, 631),
  S('S19', 'verify-e', 'Verify OTP', 'verify-otp', 777, 631),
  LOGIN('l-e', 856, 631),
  S('S20', 'verify-pw', 'Verify Password', 'verify-password', 777, 668),
  D('d-known2', 'Known device?', 853, 668),
  LOGIN('l-known2', 941, 668),
  D('d-phone', 'Has phone associated?', 853, 711),
  LOGIN('l-phone', 941, 711),
  S('S21', 'send-auto', 'Send One Time Password (OTP) automatically', 'send-otp-auto', 941, 749),
  S('S22', 'input-auto', 'Input OTP', 'input-otp', 1015, 749),
  LOGIN('l-auto', 1081, 749),
  D('d-emailmatch', 'Email matches initial email?', 690, 706),
  LOGIN('l-match', 782, 706),
  LOGIN('l-matchB', 782, 737, 'Login to account B'),
  B('signup-b', 'Signup (creates Account B)', 'purple', 782, 768),
  LOGIN('l-signupB', 840, 768, 'Login to Account B'),
]

export const EDGES: FlowEdge[] = [
  { from: 'landing', to: 'phone-entry', label: 'Phone' },
  { from: 'landing', to: 'social-3p', label: 'Social' },
  { from: 'landing', to: 'email-entry', label: 'Email' },

  /* Phone */
  { from: 'phone-entry', to: 'phone-send' },
  { from: 'phone-send', to: 'phone-input' },
  { from: 'phone-input', to: 'd-newphone' },
  { from: 'd-newphone', to: 'protect-new', label: 'Yes' },
  { from: 'd-newphone', to: 'd-known', label: 'No' },
  { from: 'd-known', to: 'l-known', label: 'Yes' },
  { from: 'd-known', to: 'd-second', label: 'No' },
  { from: 'd-second', to: 'welcome-methods', label: 'Yes' },
  { from: 'd-second', to: 'welcome-nolinked', label: 'No' },
  { from: 'welcome-nolinked', to: 'protect-exist', bendX: 1235 },

  /* Protect your account (new phone) */
  { from: 'protect-new', to: 'd-emailexists', label: 'email' },
  { from: 'protect-new', to: 'd-socialother', label: 'social' },
  { from: 'd-emailexists', to: 'welcome-top', label: 'Yes' },
  { from: 'd-emailexists', to: 'verify-a', label: 'No' },
  { from: 'verify-a', to: 'signup-a' },
  { from: 'signup-a', to: 'l-a' },
  { from: 'welcome-top', to: 'd-top-social', label: 'social', bendX: 960 },
  { from: 'welcome-top', to: 'd-top-pw', label: 'password', bendX: 960 },
  { from: 'welcome-top', to: 'verify-top', label: 'email OTP' },
  { from: 'd-top-social', to: 'be-top-social' },
  { from: 'be-top-social', to: 'l-top-social' },
  { from: 'd-top-pw', to: 'be-top-pw' },
  { from: 'be-top-pw', to: 'l-top-pw' },
  { from: 'verify-top', to: 'be-top-email' },
  { from: 'be-top-email', to: 'l-top-email' },
  { from: 'd-socialother', to: 'signup-s', label: 'No' },
  { from: 'signup-s', to: 'l-s-no' },
  { from: 'd-socialother', to: 'be-s', label: 'Yes' },
  { from: 'be-s', to: 'l-s-yes' },

  /* Welcome back (existing methods) */
  { from: 'welcome-methods', to: 'd-linkedA', label: 'Socials' },
  { from: 'welcome-methods', to: 'd-pw', label: 'password' },
  { from: 'welcome-methods', to: 'd-emailotp', label: 'email OTP' },
  { from: 'welcome-methods', to: 'protect-exist', label: 'Not me', exit: 'bottom' },
  { from: 'd-linkedA', to: 'l-A', label: 'Yes' },
  { from: 'd-linkedA', to: 'd-existingacct', label: 'No' },
  { from: 'd-existingacct', to: 'be-linkedB', label: 'Yes (linked to B)' },
  { from: 'be-linkedB', to: 'l-B' },
  { from: 'd-existingacct', to: 'signup-e', label: 'No' },
  { from: 'signup-e', to: 'be-newacct' },
  { from: 'be-newacct', to: 'l-newacct' },
  { from: 'd-pw', to: 'l-pw' },
  { from: 'd-emailotp', to: 'l-emailotp' },

  /* Protect your account (existing account) */
  { from: 'protect-exist', to: 'd-selects', label: 'social' },
  { from: 'protect-exist', to: 'd-existingemail', label: 'email' },
  { from: 'd-selects', to: 'l-selA', label: 'Yes, same account A' },
  { from: 'd-selects', to: 'be-selB', label: 'Yes, different account B' },
  { from: 'be-selB', to: 'l-selB' },
  { from: 'd-selects', to: 'be-selNo', label: 'No' },
  { from: 'be-selNo', to: 'signup-sel' },
  { from: 'signup-sel', to: 'l-selNo' },
  { from: 'd-existingemail', to: 'validate-email', label: 'No' },
  { from: 'validate-email', to: 'd-verify-new' },
  { from: 'd-verify-new', to: 'signup-new' },
  { from: 'signup-new', to: 'be-new2' },
  { from: 'be-new2', to: 'l-new2' },
  { from: 'd-existingemail', to: 'd-verify-exist', label: 'Yes, no password' },
  { from: 'd-verify-exist', to: 'l-verify-exist' },
  { from: 'd-existingemail', to: 'welcome-right', label: 'Yes, has password' },
  { from: 'welcome-right', to: 'd-pw-r', label: 'password' },
  { from: 'welcome-right', to: 'd-emailotp-r', label: 'email OTP' },
  { from: 'welcome-right', to: 'l-social-r', label: 'social' },
  { from: 'd-pw-r', to: 'l-pw-r' },
  { from: 'd-emailotp-r', to: 'l-emailotp-r' },

  /* Social */
  { from: 'social-3p', to: 'd-newaccount' },
  { from: 'd-newaccount', to: 'l-social-exist', label: 'No' },
  { from: 'd-newaccount', to: 'signup-f', label: 'Yes' },
  { from: 'signup-f', to: 'l-social-new' },

  /* Email */
  { from: 'email-entry', to: 'd-emailexists2' },
  { from: 'd-emailexists2', to: 'verify-c', label: 'No' },
  { from: 'verify-c', to: 'signup-c' },
  { from: 'signup-c', to: 'l-c' },
  { from: 'd-emailexists2', to: 'd-haslogin', label: 'Yes, matches account A' },
  { from: 'd-haslogin', to: 'verify-d', label: 'No' },
  { from: 'verify-d', to: 'l-d' },
  { from: 'd-haslogin', to: 'welcome-otp', label: 'Yes' },
  { from: 'welcome-otp', to: 'verify-e', label: 'OTP' },
  { from: 'verify-e', to: 'l-e' },
  { from: 'welcome-otp', to: 'verify-pw', label: 'Password' },
  { from: 'verify-pw', to: 'd-known2' },
  { from: 'd-known2', to: 'l-known2', label: 'Yes' },
  { from: 'd-known2', to: 'd-phone', label: 'No' },
  { from: 'd-phone', to: 'l-phone', label: 'No' },
  { from: 'd-phone', to: 'send-auto', label: 'Yes' },
  { from: 'send-auto', to: 'input-auto' },
  { from: 'input-auto', to: 'l-auto' },
  { from: 'welcome-otp', to: 'd-emailmatch', label: 'Social' },
  { from: 'd-emailmatch', to: 'l-match', label: 'Yes' },
  { from: 'd-emailmatch', to: 'l-matchB', label: 'No, matches account B' },
  { from: 'd-emailmatch', to: 'signup-b', label: 'No, matches no Glovo account' },
  { from: 'signup-b', to: 'l-signupB' },
]
