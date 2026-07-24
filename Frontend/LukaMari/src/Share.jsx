import { useState } from 'react'
import { useWebRTC } from './hooks/useWebRTC'

export default function Share() {
  const [inputRoom, setInputRoom] = useState('')
  const [activeRoom, setActiveRoom] = useState(null)
  const { connected, status, receivedFile, sendFile } = useWebRTC(activeRoom)

  const generateRoom = () => {
    setInputRoom(Math.random().toString(36).slice(2, 8).toUpperCase())
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md space-y-5">
        <h2 className="text-2xl font-bold text-gray-800">Share Stego-Image</h2>

        {!activeRoom ? (
          <>
            <p className="text-sm text-gray-500">
              Generate a Room ID and share it with your peer, or enter theirs.
            </p>
            <button onClick={generateRoom}
              className="w-full bg-cyan-600 text-white py-2 rounded-lg hover:bg-cyan-700">
              Generate Room ID
            </button>
            <div className="flex gap-2">
              <input value={inputRoom}
                onChange={e => setInputRoom(e.target.value.toUpperCase())}
                placeholder="Enter Room ID"
                className="flex-1 border px-3 py-2 rounded-lg text-sm" />
              <button onClick={() => setActiveRoom(inputRoom.trim())}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Join
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-gray-100 rounded-lg p-3 text-center">
              <p className="text-xs text-gray-400">Room ID</p>
              <p className="text-2xl font-mono font-bold">{activeRoom}</p>
            </div>

            <div className={`text-sm px-3 py-2 rounded-lg ${
              connected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {status}
            </div>

            {connected && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Send stego-image to peer
                </label>
                <input type="file" accept="image/*"
                  onChange={e => sendFile(e.target.files[0])}
                  className="block w-full text-sm file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0 file:bg-cyan-600 file:text-white" />
              </div>
            )}

            {receivedFile && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                <p className="text-green-700 font-semibold">Stego-image received!</p>
                <a href={receivedFile} download="stego-received.png"
                  className="block text-center bg-green-600 text-white py-2 rounded-lg">
                  Download Image
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}