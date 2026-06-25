"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function MembersTopBar() {
  const router = useRouter();
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const backBtn = document.getElementById("membersBackBtn");
    const addBtn = document.getElementById("addMemberBtn");

    const handleBack = () => {
      router.push("/admin");
    };

    const handleAdd = () => {
      document.getElementById("addModal")?.classList.add("active");
      document.body.style.overflow = "hidden";
    };

    backBtn?.addEventListener("click", handleBack);
    addBtn?.addEventListener("click", handleAdd);

    cleanupRef.current = () => {
      backBtn?.removeEventListener("click", handleBack);
      addBtn?.removeEventListener("click", handleAdd);
    };

    return () => cleanupRef.current?.();
  }, [router]);

  return (
    <header className="header">
      <button className="header-back" id="membersBackBtn"><i className="fas fa-arrow-left"></i></button>
      <h1 className="header-title">Members</h1>
      <div className="header-actions">
        <button className="header-btn add" id="addMemberBtn"><i className="fas fa-plus"></i></button>
      </div>
    </header>
  );
}
