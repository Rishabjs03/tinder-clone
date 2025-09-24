"use client";

import { UserProfile } from "@/app/profile/page";
import { getStreamUserToken } from "@/lib/actions/stream";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";

interface StreamChatProps {
  user: UserProfile;
}
export default function StreamChatInterface({ user }: StreamChatProps) {
  const [loading, setloading] = useState(true);
  const [error, seterror] = useState<string | null>(null);
  const [currentUserId, setcurrentUserId] = useState<string>("");
  const router = useRouter();
  useEffect(() => {
    async function initializeChat() {
      try {
        seterror(null);

        const { token, userId, userName, userImage } =
          await getStreamUserToken();
        setcurrentUserId(userId);

        const chatClient = StreamChat.getInstance(
          process.env.NEXT_PUBLIC_STREAM_API_KEY!
        );
        await chatClient.connectUser(
          {
            id: userId,
            name: userName,
            image: userImage,
          },
          token
        );
      } catch (error) {
        router.push("/chat");
      } finally {
        setloading(false);
      }
    }
    if (user) {
      initializeChat();
    }
  }, [user]);
  return <div></div>;
}
