import { User } from './User';
export declare enum NotificationType {
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push",
    IN_APP = "in_app"
}
export declare enum NotificationStatus {
    PENDING = "pending",
    SENT = "sent",
    DELIVERED = "delivered",
    FAILED = "failed",
    READ = "read"
}
export declare class Notification {
    id: string;
    user_id: string;
    user: User;
    type: NotificationType;
    subject: string;
    message: string;
    status: NotificationStatus;
    metadata: Record<string, any> | null;
    sent_at: Date | null;
    delivered_at: Date | null;
    read_at: Date | null;
    error_message: string | null;
    created_at: Date;
    markAsSent(): void;
    markAsDelivered(): void;
    markAsRead(): void;
    markAsFailed(errorMessage: string): void;
    isPending(): boolean;
    isDelivered(): boolean;
    isFailed(): boolean;
}
//# sourceMappingURL=Notification.d.ts.map