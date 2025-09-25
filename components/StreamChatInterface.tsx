"use client";

import { UserProfile } from "@/app/profile/page";
import { createOrGetChannel, getStreamUserToken } from "@/lib/actions/stream";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Channel, Event, StreamChat } from "stream-chat";

interface StreamChatProps {
  otherUser: UserProfile;
}
interface Message {
  id: string;
  text: string;
  sender: "me" | "other";
  timeStamp: Date;
  user_id: string;
}
export default function StreamChatInterface({ otherUser }: StreamChatProps) {
  const [loading, setloading] = useState(true);
  const [error, seterror] = useState<string | null>(null);
  const [currentUserId, setcurrentUserId] = useState<string>("");
  const [messages, setmessages] = useState<Message[]>([]);
  const [newMessage, setnewMessage] = useState<string>("");
  const [client, setclient] = useState<StreamChat | null>(null);
  const [channel, setchannel] = useState<Channel | null>(null);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const MessageEndRef = useRef<HTMLDivElement>(null);
  const MessageContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  function scrollToBottom() {
    MessageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  }
  const handleScroll = () => {
    if (MessageContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        MessageContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom);
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const container = MessageContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);
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
        const { channelType, channelIds } = await createOrGetChannel(
          otherUser.id
        );
        // channel list krrha
        const chatChannel = chatClient.channel(channelType, channelIds);
        await chatChannel.watch();
        // loading the chats
        const state = await chatChannel.query({ messages: { limit: 50 } });
        // convert stream messages to out format
        const convertedMessages: Message[] = state.messages.map((msg) => ({
          id: msg.id,
          text: msg.text || "",
          sender: msg.user?.id === userId ? "me" : "other",
          timeStamp: new Date(msg.created_at || new Date()),
          user_id: msg.user?.id || "",
        }));
        setmessages(convertedMessages);

        chatChannel.on("message.new", (event: Event) => {
          if (event.message) {
            if (event.message.user?.id !== userId) {
              const newMsg: Message = {
                id: event.message.id,
                text: event.message.text || "",
                sender: "other",
                timeStamp: new Date(event.message.created_at || new Date()),
                user_id: event.message.user?.id || "",
              };
              setmessages((prev) => {
                const messageExists = prev.some((msg) => msg.id === newMsg.id);
                if (!messageExists) {
                  return [...prev, newMsg];
                }
                return prev;
              });
            }
          }
        });

        chatChannel.on("typing.start", (event: Event) => {
          if (event.user?.id !== userId) {
            setIsTyping(true);
          }
        });

        chatChannel.on("typing.stop", (event: Event) => {
          if (event.user?.id !== userId) {
            setIsTyping(false);
          }
        });

        setclient(chatClient);
        setchannel(chatChannel);
      } catch (error) {
        router.push("/chat");
      } finally {
        setloading(false);
      }
    }
    if (otherUser) {
      initializeChat();
    }
    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [otherUser, router, client]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (newMessage.trim() && channel) {
      try {
        const response = await channel.sendMessage({
          text: newMessage.trim(),
        });
        const message: Message = {
          id: response.message.id,
          text: newMessage.trim(),
          sender: "me",
          timeStamp: new Date(),
          user_id: currentUserId,
        };
        setmessages((prev) => {
          const messageExists = prev.some((msg) => msg.id === message.id);
          if (!messageExists) {
            return [...prev, message];
          }
          return prev;
        });
        setnewMessage("");
      } catch (error) {
        console.error("error in sending message:", error);
      }
    }
  }
  function formatTime(date: Date) {
    return date.toLocaleDateString([], { hour: "2-digit", minute: "2-digit" });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Setting up chats...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      <div
        ref={MessageContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth chat-scrollbar relative"
        style={{ scrollBehavior: "smooth" }}
      >
        {messages.map((message, key) => (
          <div
            key={key}
            className={`flex ${
              message.sender === "me" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                message.sender === "me"
                  ? "bg-gradient-to-r from-pink-500 to-red-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === "me"
                    ? "text-pink-100"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {formatTime(message.timeStamp)}
              </p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={MessageEndRef} />
      </div>
      {showScrollButton && (
        <div className="absolute bottom-20 right-6 z-10">
          <button
            onClick={scrollToBottom}
            className="bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            title="Scroll to bottom"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </button>
        </div>
      )}
      {/* message input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <form className="flex space-x-2" onSubmit={handleSendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setnewMessage(e.target.value);

              if (channel && e.target.value.length > 0) {
                channel.keystroke();
              }
            }}
            onFocus={(e) => {
              if (channel) {
                channel.keystroke();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            disabled={!channel}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || !channel}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-full hover:from-pink-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 12h14m-7-7l7 7-7 7"
              />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
