"use client";

import { useState } from "react";

export default function NotificationBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm py-2 px-4 flex items-center justify-between">
      <span className="mx-auto">
        🚀 Now supporting <strong>Sinhala &amp; Tamil</strong> AI content generation —{" "}
        <a href="#features" className="underline font-semibold hover:text-yellow-300 transition-colors">
          Learn more
        </a>
      </span>
      <button
        onClick={() => setVisible(false)}
        className="text-white/70 hover:text-white ml-4 text-lg leading-none transition-colors"
      >
        ×
      </button>
    </div>
  );
}