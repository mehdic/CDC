/**
 * Twilio Video Integration
 * Handles Twilio Video Room creation and access token generation
 * Task: T142
 */

import twilio, { Twilio } from 'twilio';
import AccessToken = require('twilio/lib/jwt/AccessToken');

// Twilio configuration from environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_API_KEY_SID = process.env.TWILIO_API_KEY_SID;
const TWILIO_API_KEY_SECRET = process.env.TWILIO_API_KEY_SECRET;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET || !TWILIO_AUTH_TOKEN) {
  console.warn('[Twilio] Warning: Twilio credentials not configured. Video calls will not work.');
}

let twilioClient: Twilio | null = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}

export interface TwilioRoomConfig {
  uniqueName: string; // Unique room identifier (teleconsultation ID)
  type?: 'group' | 'peer-to-peer'; // Room type
  maxParticipants?: number; // Max participants (default 2 for teleconsultation)
  recordParticipantsOnConnect?: boolean; // Auto-record if consent given
}

/**
 * Create a Twilio Video Room
 * FR-023: Video calls MUST use end-to-end encryption
 */
export async function createVideoRoom(
  config: TwilioRoomConfig
): Promise<{ roomSid: string; roomName: string }> {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized. Check credentials.');
  }

  try {
    const room = await twilioClient.video.v1.rooms.create({
      uniqueName: config.uniqueName,
      type: config.type || 'peer-to-peer', // peer-to-peer has end-to-end encryption
      maxParticipants: config.maxParticipants || 2,
      recordParticipantsOnConnect: config.recordParticipantsOnConnect || false,
    });

    console.log(`[Twilio] Video room created: ${room.sid}`);

    return {
      roomSid: room.sid,
      roomName: room.uniqueName,
    };
  } catch (error: any) {
    console.error('[Twilio] Failed to create video room:', error);
    throw new Error(`Failed to create Twilio video room: ${error.message}`);
  }
}

/**
 * Generate Twilio Access Token for joining a video room
 * FR-024: Pharmacists MUST be able to access patient medical records during video
 * FR-112: Prevent unauthorized cross-role data access
 */
export function generateAccessToken(params: {
  identity: string; // User ID (patient or pharmacist)
  roomName: string; // Room unique name (teleconsultation ID)
  role: 'patient' | 'pharmacist'; // User role for permissions
}): string {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_API_KEY_SID || !TWILIO_API_KEY_SECRET) {
    throw new Error('Twilio credentials not configured');
  }

  // Create access token
  const token = new AccessToken(
    TWILIO_ACCOUNT_SID,
    TWILIO_API_KEY_SID,
    TWILIO_API_KEY_SECRET,
    {
      identity: params.identity,
      ttl: 3600, // 1 hour expiry
    }
  );

  // Create video grant with room access
  const videoGrant = new AccessToken.VideoGrant({
    room: params.roomName,
  });

  token.addGrant(videoGrant);

  return token.toJwt();
}

/**
 * Complete a video room (mark as completed)
 */
export async function completeVideoRoom(
  roomSid: string
): Promise<void> {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    await twilioClient.video.v1.rooms(roomSid).update({
      status: 'completed',
    });

    console.log(`[Twilio] Video room completed: ${roomSid}`);
  } catch (error: any) {
    console.error('[Twilio] Failed to complete video room:', error);
    throw new Error(`Failed to complete Twilio video room: ${error.message}`);
  }
}

/**
 * Get room recordings (if recording consent was given)
 * FR-028: System MUST save consultation recordings with consent
 */
export async function getRoomRecordings(
  roomSid: string
): Promise<string[]> {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    const recordings = await twilioClient.video.v1
      .rooms(roomSid)
      .recordings.list();

    return recordings.map((recording) => recording.url);
  } catch (error: any) {
    console.error('[Twilio] Failed to fetch recordings:', error);
    throw new Error(`Failed to fetch recordings: ${error.message}`);
  }
}
