/**
 * Notification Panel Component (T4-007)
 * Displays real-time delivery notifications with toast alerts
 * and sound notifications
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Badge,
  IconButton,
  Drawer,
  Typography,
  List,
  ListItemButton,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Notifications as NotificationIcon,
  Close as CloseIcon,
  CheckCircle as CheckIcon,
  LocalShipping as ShippingIcon,
  LocalPharmacy as PharmacyIcon,
} from '@mui/icons-material';
import { useNotifications } from '../hooks/useNotifications';

export const NotificationPanel: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);

  const { notifications, unreadCount, markAsRead } = useNotifications(soundEnabled);

  const handleToggleDrawer = () => {
    setOpen(!open);
  };

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);

    // Navigate based on notification type
    if (notification.orderId) {
      navigate(`/nurse/orders/${notification.orderId}`);
    } else if (notification.patientId) {
      navigate(`/nurse/patients/${notification.patientId}`);
    }

    setOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order_confirmed':
        return <CheckIcon color="success" />;
      case 'order_ready':
        return <PharmacyIcon color="primary" />;
      case 'delivery_assigned':
      case 'delivery_arriving':
        return <ShippingIcon color="info" />;
      case 'delivery_complete':
        return <CheckIcon color="success" />;
      default:
        return <NotificationIcon />;
    }
  };

  const getPriorityColor = (priority: string): 'default' | 'primary' | 'error' => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <>
      {/* Notification Bell Icon */}
      <IconButton color="inherit" onClick={handleToggleDrawer}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationIcon />
        </Badge>
      </IconButton>

      {/* Notification Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={handleToggleDrawer}
        PaperProps={{
          sx: { width: { xs: '100%', sm: 400 } },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6">Notifications</Typography>
          <IconButton onClick={handleToggleDrawer}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Sound Toggle */}
        <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <FormControlLabel
            control={
              <Switch checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
            }
            label="Alertes sonores"
          />
        </Box>

        {/* Notifications List */}
        <List sx={{ flex: 1, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">Aucune notification</Typography>
            </Box>
          ) : (
            notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                {index > 0 && <Divider />}
                <ListItemButton
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    bgcolor: notification.read ? 'transparent' : 'action.hover',
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getNotificationIcon(notification.type)}
                        <Typography variant="subtitle2">{notification.title}</Typography>
                      </Box>
                      <Chip
                        label={notification.priority}
                        size="small"
                        color={getPriorityColor(notification.priority)}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.timestamp).toLocaleString('fr-CH')}
                    </Typography>
                  </Box>
                </ListItemButton>
              </React.Fragment>
            ))
          )}
        </List>
      </Drawer>
    </>
  );
};

export default NotificationPanel;
