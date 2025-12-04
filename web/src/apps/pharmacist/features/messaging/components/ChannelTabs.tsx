/**
 * ChannelTabs Component
 * Tab navigation for different messaging channels
 */

import React from 'react';
import { Box, Tabs, Tab, Chip, Stack } from '@mui/material';
import {
  Chat as ChatIcon,
  Mail as MailIcon,
  Print as FaxIcon,
  Phone as WhatsAppIcon,
} from '@mui/icons-material';
import { MessageChannel } from '../types/messaging.types';

interface ChannelTabsProps {
  activeChannel: MessageChannel;
  onChannelChange: (channel: MessageChannel) => void;
  unreadCounts?: Record<MessageChannel, number>;
  disabled?: boolean;
}

interface ChannelInfo {
  label: string;
  icon: React.ReactNode;
  channel: MessageChannel;
}

const CHANNELS: ChannelInfo[] = [
  {
    label: 'In-App',
    icon: <ChatIcon />,
    channel: MessageChannel.IN_APP,
  },
  {
    label: 'WhatsApp',
    icon: <WhatsAppIcon />,
    channel: MessageChannel.WHATSAPP,
  },
  {
    label: 'Email',
    icon: <MailIcon />,
    channel: MessageChannel.EMAIL,
  },
  {
    label: 'Fax',
    icon: <FaxIcon />,
    channel: MessageChannel.FAX,
  },
];

export const ChannelTabs: React.FC<ChannelTabsProps> = ({
  activeChannel,
  onChannelChange,
  unreadCounts = {},
  disabled = false,
}) => {
  const handleChange = (event: React.SyntheticEvent, newValue: MessageChannel) => {
    onChannelChange(newValue);
  };

  const getTabIndex = (channel: MessageChannel): number => {
    return CHANNELS.findIndex((c) => c.channel === channel);
  };

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        backgroundColor: '#fafafa',
      }}
      data-testid="channel-tabs"
    >
      <Tabs
        value={getTabIndex(activeChannel)}
        onChange={handleChange}
        aria-label="messaging channels"
        variant="scrollable"
        scrollButtons="auto"
      >
        {CHANNELS.map((channelInfo) => {
          const unreadCount = unreadCounts[channelInfo.channel] || 0;

          return (
            <Tab
              key={channelInfo.channel}
              label={
                <Stack direction="row" alignItems="center" spacing={1}>
                  <span>{channelInfo.icon}</span>
                  <span>{channelInfo.label}</span>
                  {unreadCount > 0 && (
                    <Chip
                      label={unreadCount}
                      size="small"
                      color="primary"
                      variant="filled"
                      sx={{ height: 20, minWidth: 20 }}
                      data-testid={`unread-badge-${channelInfo.channel}`}
                    />
                  )}
                </Stack>
              }
              value={getTabIndex(channelInfo.channel)}
              data-testid={`channel-tab-${channelInfo.channel}`}
            />
          );
        })}
      </Tabs>
    </Box>
  );
};
