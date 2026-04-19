import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface ChatRoom {
  id: string;
  name: string | null;
  type: string;
  department_id: string | null;
  created_by: string | null;
  created_at: string;
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  file_url: string | null;
  is_edited: boolean;
  created_at: string;
  sender_name?: string;
  is_own: boolean;
}

export interface ChatParticipant {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  profiles?: {
    full_name: string;
  };
}

export function useChatRooms() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["chat-rooms", user?.id],
    queryFn: async (): Promise<ChatRoom[]> => {
      if (!user?.id) return [];

      // Get rooms the user is a participant in
      const { data: participantRooms } = await supabase
        .from("chat_participants")
        .select("room_id")
        .eq("user_id", user.id);

      if (!participantRooms || participantRooms.length === 0) return [];

      const roomIds = participantRooms.map((p) => p.room_id);

      // Get room details
      const { data: rooms, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .in("id", roomIds)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Get last messages for each room
      const roomsWithMessages = await Promise.all(
        (rooms || []).map(async (room) => {
          const { data: lastMessage } = await supabase
            .from("chat_messages")
            .select("content, created_at")
            .eq("room_id", room.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Get unread count
          const { data: participant } = await supabase
            .from("chat_participants")
            .select("last_read_at")
            .eq("room_id", room.id)
            .eq("user_id", user.id)
            .single();

          let unreadCount = 0;
          if (participant?.last_read_at) {
            const { count } = await supabase
              .from("chat_messages")
              .select("*", { count: "exact", head: true })
              .eq("room_id", room.id)
              .gt("created_at", participant.last_read_at)
              .neq("sender_id", user.id);
            unreadCount = count || 0;
          }

          return {
            ...room,
            last_message: lastMessage?.content,
            last_message_time: lastMessage?.created_at
              ? new Date(lastMessage.created_at).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : undefined,
            unread_count: unreadCount,
          };
        })
      );

      return roomsWithMessages;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });
}

export function useChatMessages(roomId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Subscribe to real-time messages with proper handling
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`chat-messages-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Immediately add the new message to the cache for instant UI update
          queryClient.setQueryData(
            ["chat-messages", roomId],
            (oldMessages: ChatMessage[] | undefined) => {
              if (!oldMessages) return oldMessages;
              const newMsg = payload.new as any;
              // Avoid duplicates
              if (oldMessages.some(m => m.id === newMsg.id)) return oldMessages;
              return [
                ...oldMessages,
                {
                  ...newMsg,
                  sender_name: newMsg.sender_id === user?.id ? "Anda" : "Staff",
                  is_own: newMsg.sender_id === user?.id,
                },
              ];
            }
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["chat-messages", roomId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient, user?.id]);

  return useQuery({
    queryKey: ["chat-messages", roomId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!roomId) return [];

      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;

      // Map sender names - for now just mark own messages
      return (data || []).map((msg) => ({
        ...msg,
        sender_name: msg.sender_id === user?.id ? "Anda" : "Staff",
        is_own: msg.sender_id === user?.id,
      }));
    },
    enabled: !!roomId,
  });
}

export function useSendMessage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      content,
      messageType = "text",
    }: {
      roomId: string;
      content: string;
      messageType?: string;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content,
          message_type: messageType,
        })
        .select()
        .single();

      if (error) throw error;

      // Update room's updated_at
      await supabase
        .from("chat_rooms")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", roomId);

      // Update participant's last_read_at
      await supabase
        .from("chat_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", user.id);

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMarkRoomAsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user?.id) return;

      await supabase
        .from("chat_participants")
        .update({ last_read_at: new Date().toISOString() })
        .eq("room_id", roomId)
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
    },
  });
}

export function useCreateChatRoom() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      type,
      participantIds,
    }: {
      name?: string;
      type: "direct" | "group" | "department";
      participantIds: string[];
    }) => {
      if (!user?.id) throw new Error("User not authenticated");

      // Create room
      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .insert({
          name,
          type,
          created_by: user.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add participants (including creator)
      const allParticipants = [...new Set([user.id, ...participantIds])];
      const participantRows = allParticipants.map((userId) => ({
        room_id: room.id,
        user_id: userId,
      }));

      const { error: participantError } = await supabase
        .from("chat_participants")
        .insert(participantRows);

      if (participantError) throw participantError;

      return room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-rooms"] });
      toast({
        title: "Berhasil",
        description: "Chat room berhasil dibuat",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
