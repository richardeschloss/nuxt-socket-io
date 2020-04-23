/* Schemas */
export const ChatMsg = {
  timestamp: Date.now(),
  from: '',
  to: '',
  inputMsg: ''
}

export const User = {
  name: ''
}
export const Users = [User]

export const Channel = {
  name: '',
  chats: [ChatMsg],
  users: [User]
}

export const Channels = [Channel]

export const Room = {
  name: '',
  channels: [],
  users: Users
}

export const Rooms = [Room]

export const Schemas = {
  ChatMsg,
  Channel,
  Channels,
  Room,
  Rooms
}

