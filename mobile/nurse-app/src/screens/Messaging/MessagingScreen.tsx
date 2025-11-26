/**
 * Messaging Screen
 * Secure messaging between nurses and pharmacists
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { nurseApiClient } from '../../services/nurseApiClient';
import { Message } from '../../types';

export const MessagingScreen: React.FC = () => {
  const { nurse } = useSelector((state: RootState) => state.auth);
  const [conversations, setConversations] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const data = await nurseApiClient.getMessages();
      setConversations(data);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !recipientId || !nurse) {return;}

    try {
      await nurseApiClient.sendMessage({
        senderId: nurse.id,
        senderName: `${nurse.firstName} ${nurse.lastName}`,
        senderType: 'nurse',
        recipientId,
        recipientName,
        recipientType: 'pharmacist',
        subject,
        content: newMessage,
        urgent: false,
      });

      setNewMessage('');
      setSubject('');
      setRecipientId('');
      setRecipientName('');
      setShowCompose(false);
      await loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isFromMe = nurse && item.senderId === nurse.id;

    return (
      <TouchableOpacity
        style={[styles.messageCard, !item.read && !isFromMe && styles.unreadMessage]}
        onPress={() => {
          if (!item.read && !isFromMe) {
            nurseApiClient.markMessageAsRead(item.id);
          }
        }}
      >
        <View style={styles.messageHeader}>
          <View>
            <Text style={styles.messageSender}>
              {isFromMe ? `To: ${item.recipientName}` : `From: ${item.senderName}`}
            </Text>
            {item.subject && <Text style={styles.messageSubject}>{item.subject}</Text>}
          </View>
          <View style={styles.messageRight}>
            {item.urgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
            <Text style={styles.messageTime}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </View>

        <Text style={styles.messageContent} numberOfLines={2}>
          {item.content}
        </Text>

        {!item.read && !isFromMe && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  if (showCompose) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.composeHeader}>
          <TouchableOpacity onPress={() => setShowCompose(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.composeTitle}>New Message</Text>
          <TouchableOpacity onPress={sendMessage}>
            <Text style={styles.sendButton}>Send</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.composeForm}>
          <TextInput
            style={styles.input}
            placeholder="Recipient ID"
            value={recipientId}
            onChangeText={setRecipientId}
          />
          <TextInput
            style={styles.input}
            placeholder="Recipient Name"
            value={recipientName}
            onChangeText={setRecipientName}
          />
          <TextInput
            style={styles.input}
            placeholder="Subject (optional)"
            value={subject}
            onChangeText={setSubject}
          />
          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Message"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity
          style={styles.composeButton}
          onPress={() => setShowCompose(true)}
        >
          <Text style={styles.composeButtonText}>+ Compose</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyText}>No messages</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setShowCompose(true)}
            >
              <Text style={styles.emptyButtonText}>Send your first message</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7F8C8D',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE2E8',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C3E50',
  },
  composeButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  composeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  messageCard: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DDE2E8',
    position: 'relative',
  },
  unreadMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  messageSender: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  messageSubject: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  messageRight: {
    alignItems: 'flex-end',
  },
  urgentBadge: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  urgentText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  messageTime: {
    fontSize: 12,
    color: '#95A5A6',
  },
  messageContent: {
    fontSize: 14,
    color: '#2C3E50',
    lineHeight: 20,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3498DB',
  },
  composeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#DDE2E8',
  },
  composeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
  },
  cancelButton: {
    fontSize: 16,
    color: '#95A5A6',
  },
  sendButton: {
    fontSize: 16,
    color: '#3498DB',
    fontWeight: '600',
  },
  composeForm: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDE2E8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  messageInput: {
    flex: 1,
    minHeight: 200,
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#3498DB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MessagingScreen;
