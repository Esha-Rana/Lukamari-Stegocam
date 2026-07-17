// JSDoc type definitions for the Lukamari app
// No imports needed — these are just JSDoc for IDE autocompletion

/**
 * @typedef {Object} Profile
 * @property {string} id - UUID matching auth.users
 * @property {string} username
 * @property {string} email
 * @property {string|null} avatar_url
 * @property {string} created_at - ISO timestamp
 * @property {string} last_seen - ISO timestamp
 */

/**
 * @typedef {'pending'|'connecting'|'transferred'|'opened'|'completed'} MessageStatus
 */

/**
 * @typedef {Object} MessageMetadata
 * @property {string} id - UUID
 * @property {string} sender_id
 * @property {string} receiver_id
 * @property {string} room_id
 * @property {MessageStatus} status
 * @property {string} created_at
 * @property {string|null} delivered_at
 * @property {string|null} opened_at
 * @property {Profile} [sender] - joined profile
 * @property {Profile} [receiver] - joined profile
 */

/**
 * @typedef {'connecting'|'ice-established'|'webrtc-established'|'sending'|'complete'|'error'} TransferStatus
 */

export {}; // make this a module
