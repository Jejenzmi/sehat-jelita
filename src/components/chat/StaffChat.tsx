import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Send, Search, Users, Plus, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  created_at: string;
  is_own: boolean;
}

interface ChatRoom {
  id: string;
  name: string;
  type: "direct" | "group" | "department";
  last_message?: string;
  last_message_time?: string;
  unread_count: number;
  participants: string[];
}

// Sample staff for demo
const sampleStaff = [
  { id: "1", name: "Dr. Budi Santoso", role: "Dokter", online: true },
  { id: "2", name: "Dr. Ani Wijaya", role: "Dokter", online: true },
  { id: "3", name: "Suster Maria", role: "Perawat", online: false },
  { id: "4", name: "Apt. Dewi", role: "Farmasi", online: true },
  { id: "5", name: "Admin Rina", role: "Pendaftaran", online: true },
];

// Sample chat rooms
const sampleRooms: ChatRoom[] = [
  { id: "1", name: "Dr. Budi Santoso", type: "direct", last_message: "Baik dok, akan saya siapkan", last_message_time: "10:30", unread_count: 2, participants: ["1"] },
  { id: "2", name: "Grup IGD", type: "group", last_message: "Pasien baru masuk", last_message_time: "10:15", unread_count: 0, participants: ["1", "2", "3"] },
  { id: "3", name: "Farmasi", type: "department", last_message: "Stok paracetamol menipis", last_message_time: "09:45", unread_count: 1, participants: ["4"] },
];

// Sample messages
const sampleMessages: Message[] = [
  { id: "1", sender_id: "1", sender_name: "Dr. Budi Santoso", content: "Tolong siapkan hasil lab untuk pasien Ahmad Sulaiman", created_at: new Date(Date.now() - 3600000).toISOString(), is_own: false },
  { id: "2", sender_id: "me", sender_name: "Anda", content: "Baik dok, akan saya siapkan", created_at: new Date(Date.now() - 1800000).toISOString(), is_own: true },
  { id: "3", sender_id: "1", sender_name: "Dr. Budi Santoso", content: "Terima kasih, mohon segera ya karena pasien sudah menunggu", created_at: new Date(Date.now() - 900000).toISOString(), is_own: false },
];

export function StaffChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [rooms, setRooms] = useState<ChatRoom[]>(sampleRooms);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [unreadTotal, setUnreadTotal] = useState(3);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!selectedRoom) return;

    const channel = supabase
      .channel(`chat-${selectedRoom.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${selectedRoom.id}`,
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMsg.id,
            sender_id: newMsg.sender_id,
            sender_name: newMsg.sender_id === user?.id ? "Anda" : "Staff",
            content: newMsg.content,
            created_at: newMsg.created_at,
            is_own: newMsg.sender_id === user?.id,
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRoom, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    setMessages(sampleMessages); // In real app, fetch messages from DB
    // Mark as read
    setRooms(prev => prev.map(r => r.id === room.id ? { ...r, unread_count: 0 } : r));
    setUnreadTotal(prev => Math.max(0, prev - room.unread_count));
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    // Add message locally
    const msg: Message = {
      id: Date.now().toString(),
      sender_id: user?.id || "me",
      sender_name: "Anda",
      content: newMessage,
      created_at: new Date().toISOString(),
      is_own: true,
    };
    setMessages(prev => [...prev, msg]);
    setNewMessage("");

    // In real app, send to DB
    // await supabase.from("chat_messages").insert({ room_id: selectedRoom.id, sender_id: user?.id, content: newMessage });
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageCircle className="h-5 w-5" />
          {unreadTotal > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadTotal > 9 ? "9+" : unreadTotal}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Chat Internal</SheetTitle>
          </SheetHeader>

          {!selectedRoom ? (
            // Room List View
            <div className="flex flex-col h-full">
              <Tabs defaultValue="chats" className="flex-1 flex flex-col">
                <TabsList className="mx-4 mt-2">
                  <TabsTrigger value="chats" className="flex-1">Chat</TabsTrigger>
                  <TabsTrigger value="staff" className="flex-1">Staff</TabsTrigger>
                </TabsList>

                <div className="px-4 py-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input 
                      placeholder="Cari..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <TabsContent value="chats" className="flex-1 m-0">
                  <ScrollArea className="h-[calc(100vh-220px)]">
                    <div className="divide-y">
                      {filteredRooms.map((room) => (
                        <div
                          key={room.id}
                          className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleSelectRoom(room)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {room.type === "group" ? <Users className="h-5 w-5" /> : room.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{room.name}</p>
                                <span className="text-xs text-muted-foreground">{room.last_message_time}</span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-sm text-muted-foreground truncate">{room.last_message}</p>
                                {room.unread_count > 0 && (
                                  <Badge variant="destructive" className="h-5 w-5 flex items-center justify-center p-0 text-xs">
                                    {room.unread_count}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="staff" className="flex-1 m-0">
                  <ScrollArea className="h-[calc(100vh-220px)]">
                    <div className="divide-y">
                      {sampleStaff.map((staff) => (
                        <div
                          key={staff.id}
                          className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {staff.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${staff.online ? "bg-green-500" : "bg-gray-400"}`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{staff.name}</p>
                              <p className="text-sm text-muted-foreground">{staff.role}</p>
                            </div>
                            <Button size="sm" variant="ghost">
                              <MessageCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <div className="p-4 border-t">
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Grup Baru
                </Button>
              </div>
            </div>
          ) : (
            // Chat View
            <div className="flex flex-col h-full">
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setSelectedRoom(null)}>
                  <X className="h-4 w-4" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedRoom.type === "group" ? <Users className="h-5 w-5" /> : selectedRoom.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedRoom.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedRoom.type === "direct" ? "Online" : `${selectedRoom.participants.length} anggota`}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_own ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[80%] ${msg.is_own ? "order-2" : ""}`}>
                        {!msg.is_own && (
                          <p className="text-xs text-muted-foreground mb-1">{msg.sender_name}</p>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            msg.is_own
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: id })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Ketik pesan..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
