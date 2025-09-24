"use client";
import { getPotentialMatches, updateLikeProfiles } from "@/lib/actions/matches";

import { useEffect, useState } from "react";
import { UserProfile } from "../profile/page";
import { useRouter } from "next/navigation";
import MatchCard from "@/components/MatchCard";
import MatchButton from "@/components/MatchButtons";
import MatchNotification from "@/components/MatchNotification";

export default function MatchPage() {
  const [potentialMatch, setpotentialMatch] = useState<UserProfile[]>([]);
  const [loading, setloading] = useState<boolean>(true);
  const [currentIndex, setcurrentIndex] = useState(0);
  const [showMatchNotification, setshowMatchNotification] = useState(false);
  const [matchedUser, setmatchedUser] = useState<UserProfile | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const potentialMatchData = await getPotentialMatches();
        setpotentialMatch(potentialMatchData);
      } catch (error) {
        console.log("error in match profile fetching:", error);
      } finally {
        setloading(false);
      }
    }
    loadUser();
  }, []);

  async function handleLike() {
    if (currentIndex < potentialMatch.length) {
      const likedUser = potentialMatch[currentIndex];
      try {
        const result = await updateLikeProfiles(likedUser.id);
        if (result.isMatch) {
          setmatchedUser(result.matchedUser!);
          setshowMatchNotification(true);
        }
        setcurrentIndex((prev) => prev + 1);
      } catch (error) {
        console.error("faced error in handle like:", error);
      }
    }
  }

  function handlePass() {
    if (currentIndex < potentialMatch.length - 1) {
      setcurrentIndex((prev) => prev + 1);
    }
  }

  function handleOnCloseNotification() {}
  function handleStartChat() {}

  if (loading) {
    return (
      <div className="h-full bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Finding your matches...
          </p>
        </div>
      </div>
    );
  }

  if (currentIndex >= potentialMatch.length) {
    return (
      <div className="h-full bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">💕</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            No more profiles to show
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Check back later for new matches, or try adjusting your preferences!
          </p>
          <button
            onClick={() => setcurrentIndex(0)}
            className="bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold py-3 px-6 rounded-full hover:from-pink-600 hover:to-red-600 transition-all duration-200"
          >
            Refresh
          </button>
        </div>
        {showMatchNotification && matchedUser && (
          <MatchNotification
            match={matchedUser}
            onClose={handleOnCloseNotification}
            onStartChat={handleStartChat}
          />
        )}
      </div>
    );
  }
  const currentPotentialMatches = potentialMatch[currentIndex];
  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-white/20 dark:hover:bg-gray-700/50 transition-colors duration-200"
              title="Go back"
            >
              <svg
                className="w-6 h-6 text-gray-700 dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="flex-1" />
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Discover Matches
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentIndex + 1} of {potentialMatch.length} profiles
            </p>
          </div>
        </header>
        <div className="max-w-md mx-auto">
          <MatchCard user={currentPotentialMatches} />
          <div className="mt-8">
            <MatchButton onLike={handleLike} onPass={handlePass} />
          </div>
        </div>
        {showMatchNotification && matchedUser && (
          <MatchNotification
            match={matchedUser}
            onClose={handleOnCloseNotification}
            onStartChat={handleStartChat}
          />
        )}
      </div>
    </div>
  );
}
