"use server"

import { StreamChat } from "stream-chat";
import { createClient } from "../supabase/server";

export async function getStreamUserToken() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated")
    }

    const { data: UserData, error: userError } = await supabase.from("users").select("full_name,avatar_url").eq("id", user.id).single()
    if (userError) {
        console.error("error fetching user data in stream:", userError);
        throw new Error("Failed to fetch user data")
    }
    const serverClient = StreamChat.getInstance(
        process.env.NEXT_PUBLIC_STREAM_API_KEY!,
        process.env.STREAM_API_SECRET!,
    )
    const token = serverClient.createToken(user.id)

    await serverClient.upsertUser({
        id: user.id,
        name: UserData.full_name,
        image: UserData.avatar_url || undefined
    })
    return {
        token,
        userId: user.id,
        userName: UserData.full_name,
        userImage: UserData.avatar_url || undefined
    }
}