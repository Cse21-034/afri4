import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  senderId: number;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Chat {
  id: number;
  jobId: number;
  participants: number[];
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface OtherParticipant {
  id: number;
  name?: string;
  companyName?: string;
  phoneNumber?: string;
  email?: string | null;
}

interface ChatInterfaceProps {
  chatId: number;
  otherParticipant?: OtherParticipant | null;
}

export function ChatInterface({ chatId, otherParticipant }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { sendMessage, joinChat, leaveChat, onNewMessage, isConnected } = useWebSocket();
  
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat data
  const { data: chatData, isLoading } = useQuery({
    queryKey: ['/api/chats', chatId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/chats/${chatId}`);
      return response.json();
    },
    enabled: !!chatId
  });

  // Send message mutation (fallback for when WebSocket fails)
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', `/api/chats/${chatId}/messages`, {
        content
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
      setMessageText("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const chat: Chat = chatData?.chat;

  // Join chat room on mount
  useEffect(() => {
    if (chatId && isConnected) {
      console.log('Joining chat:', chatId);
      joinChat(String(chatId));
      
      return () => {
        console.log('Leaving chat:', chatId);
        leaveChat(String(chatId));
      };
    }
  }, [chatId, isConnected, joinChat, leaveChat]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      console.log('New message received:', data);
      if (data.chatId === chatId) {
        queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
      }
    };

    onNewMessage(handleNewMessage);
  }, [chatId, onNewMessage, queryClient]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    const content = messageText.trim();
    if (!content) {
      toast({
        title: "Error",
        description: "Message cannot be empty",
        variant: "destructive",
      });
      return;
    }

    console.log('Sending message:', { chatId, content, isConnected });

    // Try WebSocket first, fallback to HTTP
    if (isConnected) {
      try {
        sendMessage(String(chatId), content);
        setMessageText("");
        // Optimistically update the UI
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/chats', chatId] });
        }, 100);
      } catch (error) {
        console.error('WebSocket send failed, using HTTP fallback:', error);
        sendMessageMutation.mutate(content);
      }
    } else {
      // Use HTTP fallback when WebSocket is disconnected
      console.log('WebSocket disconnected, using HTTP');
      sendMessageMutation.mutate(content);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherParticipantName = () => {
    return otherParticipant?.name || otherParticipant?.companyName || "Chat Partner";
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.trim().split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase();
  };

  const getUserInitials = (userId: number) => {
    if (userId === user?.id) {
      return getInitials(user.contactPersonName) || "ME";
    }
    return getInitials(getOtherParticipantName());
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateDivider = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const isSameDay = (a: string, b: string) => {
    const da = new Date(a);
    const db = new Date(b);
    return da.toDateString() === db.toDateString();
  };

  if (isLoading) {
    return (
      <CardContent className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </CardContent>
    );
  }

  if (!chat) {
    return (
      <CardContent className="h-full flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chat Not Found</h3>
          <p className="text-muted-foreground">This conversation could not be loaded.</p>
        </div>
      </CardContent>
    );
  }

  return (
    <>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                {getInitials(getOtherParticipantName())}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm">{getOtherParticipantName()}</CardTitle>
              {otherParticipant?.companyName && otherParticipant.companyName !== getOtherParticipantName() && (
                <p className="text-xs text-muted-foreground">{otherParticipant.companyName}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4" data-testid="chat-messages">
          <div className="space-y-4">
            {chat.messages && chat.messages.length > 0 ? (
              chat.messages.map((message, index) => {
                const isOwn = message.senderId === user?.id;
                const prevMessage = index > 0 ? chat.messages[index - 1] : null;
                const showDateDivider = !prevMessage || !isSameDay(prevMessage.timestamp, message.timestamp);

                return (
                  <div key={index}>
                    {showDateDivider && (
                      <div className="flex justify-center my-4">
                        <span className="text-xs font-medium bg-muted text-muted-foreground rounded-full px-3 py-1">
                          {formatDateDivider(message.timestamp)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${index}`}
                    >
                      <div className="flex items-start space-x-2 max-w-xs lg:max-w-md">
                        {!isOwn && (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(message.senderId)}
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div className={`rounded-lg px-4 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwn
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}>
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>

                        {isOwn && (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getUserInitials(message.senderId)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-border flex-shrink-0">
          {!isConnected && (
            <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-center">
              <span className="text-amber-700 text-sm">
                Reconnecting... Messages will be sent via HTTP
              </span>
            </div>
          )}
          
          <div className="flex space-x-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sendMessageMutation.isPending}
              data-testid="message-input"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              data-testid="send-message-button"
            >
              {sendMessageMutation.isPending ? (
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </>
  );
}
