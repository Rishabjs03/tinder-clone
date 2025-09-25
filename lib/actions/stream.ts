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

export async function createOrGetChannel(otherUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("User not authenticated")
    }
    const { data: matches, error: matchError } = await supabase
        .from("matches")
        .select("*")
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${otherUserId}),and(user1_id.eq.${otherUserId},user2_id.eq.${user.id})`)
        .eq("is_active", true)
        .single()
    if (matchError || !matches) {
        throw new Error("users are not matched.cannot create chat channel")
    }
    const sortedIds = [user.id, otherUserId].sort()
    const combineIds = sortedIds.join("-")

    let hash = 0;
    for (let i = 0; i < combineIds.length; i++) {
        const char = combineIds.charCodeAt(i)
        hash = (hash << 5) - hash + char;
        hash = hash & hash;

    }

    const channelIds = `match_${Math.abs(hash).toString(36)}`

    const serverClient = StreamChat.getInstance(
        process.env.NEXT_PUBLIC_STREAM_API_KEY!,
        process.env.STREAM_API_SECRET!,
    )
    const { data: otherUserData, error: otheruserError } = await supabase
        .from("users")
        .select("full_name,avatar_url")
        .eq("id", otherUserId)
        .single()
    if (otheruserError) {
        console.error("error fetching user data in stream:", otheruserError);
        throw new Error("Failed to fetch user data")
    }
    const channel = serverClient.channel("messaging", channelIds, {
        members: [user.id, otherUserId],
        created_by_id: user.id,
    });

    await serverClient.upsertUser({
        id: user.id,
        name: user.email ?? "Anonymous",
    });

    await serverClient.upsertUser({
        id: otherUserId,
        name: otherUserData.full_name,
        image: otherUserData.avatar_url || undefined,
    });
    try {
        await channel.create()
        console.log("channel was created successfully:", channelIds)
    } catch (error) {
        console.log("channel already exist", channelIds)
        if (error instanceof Error && !error.message.includes("already exists")) {
            throw error
        }
    }
    return {
        channelType: "messaging",
        channelIds,
    }
}