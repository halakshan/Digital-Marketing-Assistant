"use client";

import { C }          from "@/components/freelancer/dashboard/dashboardData";
import SettingsField  from "../SettingsField";

export default function PaymentsTab() {
  return (
    <div>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4 }}>Payment Settings</p>
      <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Configure your payout preferences</p>

      <SettingsField label="Bank Account Name"   value="Kasun Bandara"            onChange={() => {}} />
      <SettingsField label="Bank Account Number" value="****8821"                  onChange={() => {}} />
      <SettingsField label="Bank Name"           value="Commercial Bank of Ceylon" onChange={() => {}} />
      <SettingsField label="PayPal Email"        value="kasundesigns@gmail.com"    onChange={() => {}} />

      <div style={{ padding: 14, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 12, marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>✅ Payout accounts verified</p>
        <p style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Your payment details are verified and ready for withdrawals</p>
      </div>
    </div>
  );
}