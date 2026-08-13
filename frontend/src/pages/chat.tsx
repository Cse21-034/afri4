import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChatInterface } from "@/components/chat-interface";
import Navbar from "@/components/ui/navbar";
import { MessageSquare, ArrowLeft, Search, Package, Phone, Mail } from "lucide-react";

function getInitials(name?: string) {
  if (!name) return "?";
  return name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function formatCargoType(type?: string) {
  if (!type) return "N/A";
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function isChatUnread(chat: any, userId?: number) {
  return chat.messages?.some((m: any) => !m.read && m.senderId !== userId);
}

export default function Chat() {
  const { jobId } = useParams();
  const { user } = useAuth();
  const { isConnected } = useWebSocket();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  // Fetch user's chats
  const { data: chatsData, isLoading: chatsLoading } = useQuery({
    queryKey: ['/api/chats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/chats');
      return response.json();
    }
  });

  // Fetch specific chat if jobId is provided
  const { data: jobChatData } = useQuery({
    queryKey: ['/api/chats/job', jobId],
    queryFn: async () => {
      if (!jobId) return null;
      const response = await apiRequest('GET', `/api/chats/job/${jobId}`);
      return response.json();
    },
    enabled: !!jobId
  });

  useEffect(() => {
    if (jobChatData?.chat && !selectedChatId) {
      setSelectedChatId(jobChatData.chat.id);
    }
  }, [jobChatData, selectedChatId]);

  const chats = chatsData?.chats || [];
  const unreadCount = useMemo(() => chats.filter((c: any) => isChatUnread(c, user?.id)).length, [chats, user?.id]);

  const filteredChats = useMemo(() => {
    return chats.filter((chat: any) => {
      if (filter === "unread" && !isChatUnread(chat, user?.id)) return false;
      if (searchQuery) {
        const name = (chat.otherParticipant?.name || chat.otherParticipant?.companyName || "").toLowerCase();
        const lastMessage = chat.messages?.length ? chat.messages[chat.messages.length - 1].content.toLowerCase() : "";
        const q = searchQuery.toLowerCase();
        if (!name.includes(q) && !lastMessage.includes(q)) return false;
      }
      return true;
    });
  }, [chats, filter, searchQuery, user?.id]);

  const selectedChat = chats.find((c: any) => c.id === selectedChatId);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please log in to access chat.</div>;
  }

  return (
    <div className="min-h-screen bg-background" data-testid="chat-page">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" data-testid="back-to-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground" data-testid="chat-title">Messages</h1>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-card grid grid-cols-1 lg:grid-cols-[320px_1fr_300px] h-[calc(100vh-180px)] min-h-[520px]">
          {/* Inbox */}
          <div className={`border-r border-border flex-col ${selectedChatId ? 'hidden lg:flex' : 'flex'}`} data-testid="chat-list">
            <div className="p-4 border-b border-border">
              <h2 className="font-bold text-lg mb-3">Inbox</h2>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user or messages"
                  className="pl-9"
                  data-testid="chat-search"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={filter === "all" ? "default" : "outline"}
                  className="rounded-full h-7 text-xs px-3"
                  onClick={() => setFilter("all")}
                  data-testid="filter-all"
                >
                  All {chats.length}
                </Button>
                <Button
                  size="sm"
                  variant={filter === "unread" ? "default" : "outline"}
                  className="rounded-full h-7 text-xs px-3"
                  onClick={() => setFilter("unread")}
                  data-testid="filter-unread"
                >
                  Unread {unreadCount}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {chatsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : filteredChats.length > 0 ? (
                filteredChats.map((chat: any) => {
                  const name = chat.otherParticipant?.name || chat.otherParticipant?.companyName || "Unknown User";
                  const lastMessage = chat.messages?.length ? chat.messages[chat.messages.length - 1] : null;
                  const unread = isChatUnread(chat, user?.id);

                  return (
                    <div
                      key={chat.id}
                      className={`flex items-start gap-3 p-4 cursor-pointer border-l-2 transition-colors ${
                        selectedChatId === chat.id
                          ? 'bg-primary/5 border-l-primary'
                          : 'hover:bg-muted/50 border-l-transparent'
                      }`}
                      onClick={() => setSelectedChatId(chat.id)}
                      data-testid={`chat-item-${chat.id}`}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback>{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${unread ? 'font-semibold' : 'font-medium'}`}>{name}</p>
                          {lastMessage && (
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {new Date(lastMessage.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      {unread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">
                    {searchQuery || filter === "unread"
                      ? "No matching conversations."
                      : "No conversations yet. Start by applying to jobs or posting new ones."}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Thread */}
          <div className={`flex-col min-w-0 ${selectedChatId ? 'flex' : 'hidden lg:flex'}`} data-testid="chat-interface">
            {selectedChatId ? (
              <>
                <div className="lg:hidden p-2 border-b border-border">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedChatId(null)} data-testid="back-to-inbox">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Inbox
                  </Button>
                </div>
                <ChatInterface chatId={selectedChatId} otherParticipant={selectedChat?.otherParticipant} />
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Conversation</h3>
                  <p className="text-muted-foreground">
                    Choose a conversation from the list to start messaging.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Details Panel */}
          {selectedChat && (
            <div className="hidden lg:flex flex-col border-l border-border overflow-y-auto p-6" data-testid="chat-details-panel">
              <div className="text-center mb-6">
                <Avatar className="h-16 w-16 mx-auto mb-3">
                  <AvatarFallback className="text-lg">
                    {getInitials(selectedChat.otherParticipant?.name || selectedChat.otherParticipant?.companyName)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="font-bold">
                  {selectedChat.otherParticipant?.name || selectedChat.otherParticipant?.companyName || 'Unknown User'}
                </h3>
                {selectedChat.otherParticipant?.companyName &&
                  selectedChat.otherParticipant.companyName !== selectedChat.otherParticipant.name && (
                    <p className="text-sm text-muted-foreground">{selectedChat.otherParticipant.companyName}</p>
                  )}
              </div>

              {selectedChat.job && (
                <div className="mb-4 pb-4 border-b border-border">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Job Details
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Cargo</span>
                      <span className="font-medium">{formatCargoType(selectedChat.job.cargoType)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant="outline" className="capitalize">{selectedChat.job.status}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground block mb-1">Route</span>
                      <p className="font-medium truncate" title={selectedChat.job.pickupAddress}>
                        {selectedChat.job.pickupAddress}
                      </p>
                      <p className="text-muted-foreground text-xs my-0.5">to</p>
                      <p className="font-medium truncate" title={selectedChat.job.deliveryAddress}>
                        {selectedChat.job.deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-sm mb-3">Contact</h4>
                <div className="space-y-2 text-sm">
                  {selectedChat.otherParticipant?.phoneNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{selectedChat.otherParticipant.phoneNumber}</span>
                    </div>
                  )}
                  {selectedChat.otherParticipant?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{selectedChat.otherParticipant.email}</span>
                    </div>
                  )}
                  {!selectedChat.otherParticipant?.phoneNumber && !selectedChat.otherParticipant?.email && (
                    <p className="text-muted-foreground text-xs">No contact info available.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
