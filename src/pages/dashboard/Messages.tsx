import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import DashboardHeader from "@/components/DashboardHeader";
import apiClient from "@/lib/api-client";
import socketService from "@/services/socket.service";
import {
  Search, Send, Paperclip, MoreHorizontal,
  CheckCheck, Check, MessageSquare, Loader2,
} from "lucide-react";

/* ── Types ───────────────────────────────────────────────────── */
interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  userType: string;
}

interface MessageData {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: "text" | "file" | "system";
  fileUrl?: string;
  fileName?: string;
  readAt: string | null;
  createdAt: string;
  sender: { id: number; firstName: string; lastName: string; avatarUrl?: string };
}

interface ConversationData {
  id: number;
  otherUser: UserInfo;
  job: { id: number; title: string } | null;
  lastMessage: { id: number; content: string; messageType: string; senderId: number; createdAt: string; readAt: string | null } | null;
  unreadCount: number;
  lastMessageAt: string;
}

/* ── Helpers ─────────────────────────────────────────────────── */
const getInitials = (u: UserInfo) =>
  `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase() || "?";

const avatarColors = [
  "from-blue-500 to-blue-700",
  "from-indigo-500 to-indigo-700",
  "from-cyan-500 to-cyan-700",
  "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-500 to-rose-700",
];
const getAvatarColor = (id: number) => avatarColors[id % avatarColors.length];

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const formatMessageTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const getCurrentUserId = (): number => {
  const token = localStorage.getItem("token") || localStorage.getItem("candidateToken");
  if (!token) return 0;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  } catch { return 0; }
};

/* ── Status icon ─────────────────────────────────────────────── */
const StatusIcon = ({ readAt }: { readAt: string | null }) => {
  if (readAt) return <CheckCheck className="w-3 h-3 text-blue-400" />;
  return <Check className="w-3 h-3 text-zinc-400" />;
};

/* ── Component ───────────────────────────────────────────────── */
const Messages = () => {
  const queryClient = useQueryClient();
  const currentUserId = getCurrentUserId();
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [typingUsers, setTypingUsers] = useState<Record<number, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch conversations
  const { data: convData, isLoading: convsLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => apiClient.get("/conversations").then(r => r.data),
    staleTime: 30_000,
  });
  const conversations: ConversationData[] = convData?.conversations || [];

  // Fetch messages for selected conversation
  const { data: msgData, isLoading: msgsLoading } = useQuery({
    queryKey: ["messages", selectedChatId],
    queryFn: () => apiClient.get(`/conversations/${selectedChatId}/messages`).then(r => r.data),
    enabled: !!selectedChatId,
    staleTime: 10_000,
  });
  const messages: MessageData[] = msgData?.messages || [];

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (data: { content: string; messageType?: string }) =>
      apiClient.post(`/conversations/${selectedChatId}/messages`, data).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", selectedChatId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  // Socket.IO setup
  useEffect(() => {
    socketService.connect();

    const handleNewMessage = (data: { message: MessageData; conversationId: number }) => {
      // Update messages if we're viewing this conversation
      queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    const handleMessagesRead = (data: { conversationId: number }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", data.conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    const handleTyping = (data: { conversationId: number; userId: number; isTyping: boolean }) => {
      if (data.userId !== currentUserId) {
        setTypingUsers(prev => ({ ...prev, [data.conversationId]: data.isTyping }));
      }
    };

    socketService.on("new_message", handleNewMessage as (...args: unknown[]) => void);
    socketService.on("messages_read", handleMessagesRead as (...args: unknown[]) => void);
    socketService.on("user_typing", handleTyping as (...args: unknown[]) => void);

    return () => {
      socketService.off("new_message", handleNewMessage as (...args: unknown[]) => void);
      socketService.off("messages_read", handleMessagesRead as (...args: unknown[]) => void);
      socketService.off("user_typing", handleTyping as (...args: unknown[]) => void);
    };
  }, [queryClient, currentUserId]);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (selectedChatId) {
      socketService.emit("mark_read", { conversationId: selectedChatId });
    }
  }, [selectedChatId, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Typing indicator
  const handleTypingIndicator = useCallback(() => {
    if (!selectedChatId) return;
    socketService.emit("typing", { conversationId: selectedChatId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketService.emit("typing", { conversationId: selectedChatId, isTyping: false });
    }, 2000);
  }, [selectedChatId]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChatId) return;
    // Emit via socket for real-time delivery
    socketService.emit("send_message", {
      conversationId: selectedChatId,
      content: newMessage.trim(),
      messageType: "text",
    });
    // Also send via REST for persistence guarantee
    sendMutation.mutate({ content: newMessage.trim() });
    setNewMessage("");
    socketService.emit("typing", { conversationId: selectedChatId, isTyping: false });
  };

  const filtered = conversations.filter(c =>
    `${c.otherUser.firstName} ${c.otherUser.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    c.otherUser.email.toLowerCase().includes(search.toLowerCase()) ||
    c.job?.title?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = conversations.reduce((s, c) => s + c.unreadCount, 0);
  const activeConv = conversations.find(c => c.id === selectedChatId);

  return (
    <div className="h-full flex flex-col bg-background">
      <DashboardHeader
        title="Messages"
        subtitle="Communicate with candidates and team members"
      />

      <div className="flex-1 flex overflow-hidden">
        {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
        <div className="w-[290px] flex-shrink-0 border-r border-border flex flex-col">
          <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">Messages</span>
              </div>
              {totalUnread > 0 && (
                <span className="text-[10px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted/40 border-border/60 focus:bg-background"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {convsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              filtered.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedChatId(conv.id)}
                  className={`flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 border-b border-border/30 relative
                    ${selectedChatId === conv.id
                      ? "bg-blue-500/8 border-l-2 border-l-blue-500"
                      : "hover:bg-muted/30 border-l-2 border-l-transparent"
                    }`}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(conv.otherUser.id)} flex items-center justify-center text-[11px] font-black text-white shadow-sm`}>
                      {getInitials(conv.otherUser)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                        {conv.otherUser.firstName} {conv.otherUser.lastName}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0 ml-1">
                          {formatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {conv.job && (
                      <p className="text-[11px] text-muted-foreground truncate mb-0.5">{conv.job.title}</p>
                    )}
                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? "text-foreground/70 font-medium" : "text-muted-foreground"}`}>
                      {typingUsers[conv.id]
                        ? <span className="text-blue-500 italic">typing…</span>
                        : conv.lastMessage?.content || "No messages yet"}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ═══════════════ CHAT AREA ═══════════════ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selectedChatId || !activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Select a conversation to start messaging</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/30 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(activeConv.otherUser.id)} flex items-center justify-center text-[11px] font-black text-white shadow-sm`}>
                    {getInitials(activeConv.otherUser)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-none mb-0.5">
                      {activeConv.otherUser.firstName} {activeConv.otherUser.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {typingUsers[selectedChatId]
                        ? <span className="text-blue-500 italic">typing…</span>
                        : activeConv.job?.title || activeConv.otherUser.email}
                    </p>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
                {msgsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 py-1">
                      <div className="flex-1 h-px bg-border/60" />
                      <span className="text-[11px] text-muted-foreground px-2 bg-background border border-border/40 rounded-full py-0.5">
                        Conversation started
                      </span>
                      <div className="flex-1 h-px bg-border/60" />
                    </div>

                    {messages.map((msg) => {
                      const isMe = msg.senderId === currentUserId;
                      const isSystem = msg.messageType === "system";

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center py-1">
                            <span className="text-[11px] text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div key={msg.id} className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}>
                          {!isMe && (
                            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${getAvatarColor(activeConv.otherUser.id)} flex items-center justify-center text-[9px] font-black text-white flex-shrink-0`}>
                              {getInitials(activeConv.otherUser)}
                            </div>
                          )}
                          <div className={`flex flex-col gap-1 max-w-[62%] ${isMe ? "items-end" : "items-start"}`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isMe
                                ? "bg-blue-600 text-white rounded-br-sm shadow-[0_2px_12px_rgba(59,130,246,0.25)]"
                                : "bg-muted/70 border border-border/50 text-foreground rounded-bl-sm"
                            }`}>
                              {msg.messageType === "file" && msg.fileUrl ? (
                                <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
                                  <Paperclip className="w-3 h-3" />
                                  {msg.fileName || "Attachment"}
                                </a>
                              ) : (
                                msg.content
                              )}
                            </div>
                            <div className={`flex items-center gap-1 px-1 ${isMe ? "flex-row-reverse" : ""}`}>
                              <span className="text-[10px] text-muted-foreground">{formatMessageTime(msg.createdAt)}</span>
                              {isMe && <StatusIcon readAt={msg.readAt} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-4 border-t border-border flex-shrink-0">
                <div className="flex items-center gap-2 bg-muted/40 border border-border/60 rounded-2xl px-4 py-2 focus-within:border-blue-500/40 focus-within:bg-background focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.07)] transition-all duration-200">
                  <button className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message…"
                    value={newMessage}
                    onChange={e => {
                      setNewMessage(e.target.value);
                      handleTypingIndicator();
                    }}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none min-w-0 py-1"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendMutation.isPending}
                    className="flex-shrink-0 w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-[0_2px_10px_rgba(59,130,246,0.3)]"
                  >
                    {sendMutation.isPending
                      ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                      : <Send className="w-3.5 h-3.5 text-white" />}
                  </button>
                </div>
                <p className="text-center text-[10px] text-muted-foreground/40 mt-2">
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
