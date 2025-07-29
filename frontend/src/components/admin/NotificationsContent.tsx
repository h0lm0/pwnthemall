import Head from "next/head";
import { useState } from "react";
import { useNotificationContext } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteConfig } from "@/context/SiteConfigContext";
import { SentNotification, NotificationInput } from "@/models/Notification";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Trash2, Send, Users, User } from "lucide-react";
import axios from "@/lib/axios";

interface NotificationsContentProps {
  notifications: SentNotification[];
  onRefresh: () => void;
}

export default function NotificationsContent({ 
  notifications, 
  onRefresh 
}: NotificationsContentProps) {
  const { t } = useLanguage();
  const { getSiteName } = useSiteConfig();
  const { sendNotification } = useNotificationContext();
  
  const [formData, setFormData] = useState<NotificationInput>({
    title: "",
    message: "",
    type: "info",
  });
  const [isSending, setIsSending] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSending(true);
    try {
      await sendNotification(formData);
      toast.success("Notification sent successfully!");
      setFormData({ title: "", message: "", type: "info" });
      onRefresh();
    } catch (error) {
      toast.error("Failed to send notification");
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    try {
      await axios.delete(`/api/admin/notifications/${id}`);
      toast.success("Notification deleted successfully!");
      onRefresh();
    } catch (error) {
      toast.error("Failed to delete notification");
    } finally {
      setIsDeleting(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <Head>
        <title>{getSiteName()} - Admin Notifications</title>
      </Head>
      
      <div className="bg-muted min-h-screen p-4 overflow-x-auto">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("notifications")}</h1>
            <p className="text-muted-foreground">
              {t("notifications_description")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Notification Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Notification
              </CardTitle>
              <CardDescription>
                Send a notification to all users or a specific user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Notification title"
                    maxLength={255}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <textarea
                    id="message"
                    value={formData.message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Notification message"
                    rows={4}
                    required
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'info' | 'warning' | 'error') => 
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userId">Target User (Optional)</Label>
                  <Input
                    id="userId"
                    type="number"
                    value={formData.userId || ""}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      userId: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    placeholder="Leave empty to send to all users"
                  />
                  <p className="text-sm text-muted-foreground">
                    {formData.userId ? (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Send to specific user (ID: {formData.userId})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Send to all users
                      </span>
                    )}
                  </p>
                </div>

                <Button type="submit" disabled={isSending} className="w-full">
                  {isSending ? "Sending..." : "Send Notification"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Sent Notifications List */}
          <Card>
            <CardHeader>
              <CardTitle>Sent Notifications</CardTitle>
              <CardDescription>
                Recent notifications sent to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {!notifications || notifications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No notifications sent yet
                  </p>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{notification.title}</h4>
                            <Badge variant={getTypeColor(notification.type)}>
                              {notification.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{formatDate(notification.createdAt)}</span>
                            {notification.username ? (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {notification.username}
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                All users
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                          disabled={isDeleting === notification.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Separator />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
} 