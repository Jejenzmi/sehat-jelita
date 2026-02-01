import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Send, Search, Users, Plus, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { 
  useChatRooms, 
  useChatMessages, 
  useSendMessage, 
  useMarkRoomAsRead,
  ChatRoom,
  ChatMessage 
} from "@/hooks/useChatData";

export function StaffChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: rooms = [], isLoading: roomsLoading } = useChatRooms();
  const { data: messages = [] } = useChatMessages(selectedRoom?.id || null);
  const sendMessage = useSendMessage();
  const markAsRead = useMarkRoomAsRead();

  // Calculate total unread
  const unreadTotal = rooms.reduce((sum, room) => sum + room.unread_count, 0);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
    markAsRead.mutate(room.id);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    sendMessage.mutate({
      roomId: selectedRoom.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
  };

  const filteredRooms = rooms.filter(room =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase())
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
                    {roomsLoading ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Memuat chat...
                      </div>
                    ) : filteredRooms.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Belum ada percakapan
                      </div>
                    ) : (
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
                                  {room.type === "group" ? <Users className="h-5 w-5" /> : (room.name?.charAt(0) || "?")}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium truncate">{room.name || "Chat"}</p>
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
                    )}
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="staff" className="flex-1 m-0">
                  <ScrollArea className="h-[calc(100vh-220px)]">
                    <div className="p-4 text-center text-muted-foreground">
                      Fitur daftar staff akan segera tersedia
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
                    {selectedRoom.type === "group" ? <Users className="h-5 w-5" /> : (selectedRoom.name?.charAt(0) || "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{selectedRoom.name || "Chat"}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedRoom.type === "direct" ? "Online" : "Grup"}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      Belum ada pesan. Mulai percakapan!
                    </div>
                  ) : (
                    messages.map((msg) => (
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
                    ))
                  )}
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
                    disabled={sendMessage.isPending}
                  />
                  <Button onClick={handleSendMessage} disabled={sendMessage.isPending}>
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
