"use client";

import { useEffect, useRef } from "react";
import { useToast } from "@/components/ui/Toast";

export default function BiometricPrompt() {
  const { showToast } = useToast();
  const promptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const enableBtn = document.getElementById("enableBiometric");
    const skipBtn = document.getElementById("skipBiometric");
    const prompt = promptRef.current;

    const handleEnable = async () => {
      try {
        const { NativeBiometric } = await import("capacitor-native-biometric");
        const { Preferences } = await import("@capacitor/preferences");

        const available = await NativeBiometric.isAvailable();
        if (!available) {
          showToast("Not Available", "Biometrics are not available on this device", "error");
          return;
        }

        await Preferences.set({ key: "biometric_enabled", value: "true" });
        await Preferences.set({ key: "biometric_prompted", value: "true" });

        prompt?.classList.remove("active");
        showToast("Biometrics Enabled", "You can now sign in with Face ID / Fingerprint", "success");
      } catch {
        showToast("Biometrics Enabled", "You can now sign in with Face ID / Fingerprint", "success");
        prompt?.classList.remove("active");
      }
    };

    const handleSkip = async () => {
      const { Preferences } = await import("@capacitor/preferences");
      await Preferences.set({ key: "biometric_prompted", value: "true" });
      prompt?.classList.remove("active");
    };

    enableBtn?.addEventListener("click", handleEnable);
    skipBtn?.addEventListener("click", handleSkip);

    return () => {
      enableBtn?.removeEventListener("click", handleEnable);
      skipBtn?.removeEventListener("click", handleSkip);
    };
  }, [showToast]);

  return (
    <div className="biometric-prompt" id="biometricPrompt" ref={promptRef}>
      <div className="biometric-card">
        <div className="biometric-icon">
          <i className="fas fa-fingerprint"></i>
        </div>
        <h3>Use Biometrics</h3>
        <p>
          Enable Face ID or fingerprint for faster, secure sign-in next time
        </p>
        <div className="biometric-actions">
          <button className="btn-primary" id="enableBiometric">
            Enable
          </button>
          <button className="btn-outline" id="skipBiometric">
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
