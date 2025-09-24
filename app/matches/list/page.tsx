"use client";

import { UserProfile } from "@/app/profile/page";

import { useEffect, useState } from "react";

export default function MatchedList() {
  const [matches, setmatches] = useState<UserProfile[]>([]);
  const [loading, setloading] = useState(true);
  const [error, seterror] = useState<string | null>(null);
  useEffect(() => {
    async function loadMatchedList() {
      try {
      } catch (error) {
      } finally {
        setloading(false);
      }
    }

    loadMatchedList();
  }, []);
  return <div></div>;
}
