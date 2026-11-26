import { useEffect, useRef, useState } from "react";

export default function TripChatModal({
  chatBooking,
  onClose,
  currentUser,
  syncOfflineBookingForChat,
  chatMessages = [],
  chatDraft,
  setChatDraft,
  sendChatMessage,
  onEditMessage,
  onDeleteMessage,
  openCall,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [contextMenuId, setContextMenuId] = useState(null);

  // Photo sending state
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageCaption, setImageCaption] = useState("");
  const [previewModalImg, setPreviewModalImg] = useState(null);
  const fileInputRef = useRef(null);

  // Audio / Voice note recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioPlayerRef = useRef(new Audio());

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isRecording]);

  if (!chatBooking) return null;

  function getFirstName(fullName) {
    if (!fullName) return "User";
    return fullName.trim().split(/\s+/)[0];
  }

  const isAdmin = currentUser?.email?.toLowerCase() === "dushmarcel@gmail.com";
  const otherPersonName =
    chatBooking.chatTarget === "admin"
      ? (isAdmin ? (chatBooking.passengerName || chatBooking.driverName || "Member") : "Tugendane Support (Admin)")
      : isAdmin
      ? `${chatBooking.passengerName || "Passenger"} & ${chatBooking.driverName || "Driver"}`
      : chatBooking.role === "driver"
      ? chatBooking.passengerName || "Passenger"
      : chatBooking.driverName || "Driver";

  const otherPersonInitial = (otherPersonName.charAt(0) || "U").toUpperCase();

  // Format timestamp like WhatsApp (e.g. 14:35)
  function formatTime(createdAt) {
    if (!createdAt) return "";
    let date;
    if (typeof createdAt?.toDate === "function") {
      date = createdAt.toDate();
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else if (typeof createdAt === "string" || typeof createdAt === "number") {
      date = new Date(createdAt);
    }
    if (!date || Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  }

  // Edit message handlers
  function startEdit(message) {
    setEditingId(message.id);
    setEditText(message.text || "");
    setContextMenuId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editText.trim() || !editingId) return;
    if (onEditMessage) {
      await onEditMessage(editingId, editText.trim());
    }
    setEditingId(null);
    setEditText("");
  }

  // Delete message
  function handleDelete(messageId) {
    if (onDeleteMessage) {
      onDeleteMessage(messageId);
    }
    setContextMenuId(null);
  }

  // Reply handlers
  function handleReply(message) {
    setReplyTo(message);
    setContextMenuId(null);
  }

  function cancelReply() {
    setReplyTo(null);
  }

  // Send text message
  function handleSend(e) {
    if (e) e.preventDefault();
    const text = chatDraft.trim();
    if (!text) return;
    sendChatMessage({ text }, replyTo);
    setChatDraft("");
    setReplyTo(null);
  }

  // Handle Photo selection
  function handlePhotoPicked(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    // Limit to 4MB before compression
    if (file.size > 4 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      // Compress image slightly using canvas to keep document light (<300KB)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        setSelectedImage(dataUrl);
      };
      img.src = uploadEvent.target.result;
    };
    reader.readAsDataURL(file);
    // Reset file input
    e.target.value = "";
  }

  // Send photo
  function handleSendPhoto() {
    if (!selectedImage) return;
    sendChatMessage({
      text: imageCaption.trim() || "[Photo]",
      imageUrl: selectedImage,
    }, replyTo);
    setSelectedImage(null);
    setImageCaption("");
    setReplyTo(null);
  }

  // Voice Note Recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access error:", err);
      alert("Microphone permission is required to record voice notes.");
    }
  }

  function stopAndSendRecording() {
    if (!mediaRecorderRef.current || !isRecording) return;
    const duration = recordingSeconds;

    clearInterval(recordingTimerRef.current);

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        sendChatMessage({
          text: "[Voice note]",
          audioUrl: base64Audio,
          audioDuration: duration || 1,
        }, replyTo);
        setReplyTo(null);
      };
      reader.readAsDataURL(audioBlob);

      // Stop mic tracks
      try {
        mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      } catch { /* ignore */ }
    };

    mediaRecorderRef.current.stop();
    setIsRecording(false);
    setRecordingSeconds(0);
  }

  function cancelRecording() {
    if (!mediaRecorderRef.current || !isRecording) return;
    clearInterval(recordingTimerRef.current);
    try {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    } catch { /* ignore */ }
    setIsRecording(false);
    setRecordingSeconds(0);
    audioChunksRef.current = [];
  }

  // Play audio voice note
  function togglePlayAudio(messageId, audioUrl) {
    if (playingAudioId === messageId) {
      audioPlayerRef.current.pause();
      setPlayingAudioId(null);
    } else {
      audioPlayerRef.current.pause();
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.play();
      setPlayingAudioId(messageId);

      audioPlayerRef.current.onended = () => {
        setPlayingAudioId(null);
      };
      audioPlayerRef.current.onerror = () => {
        setPlayingAudioId(null);
      };
    }
  }

  return (
    <div className="wa-modal-backdrop" onClick={() => setContextMenuId(null)}>
      <section
        className="wa-chat-window"
        role="dialog"
        aria-modal="true"
        aria-label="Trip Chat"
        onClick={(e) => e.stopPropagation()}
      >
        {/* WhatsApp Chat Header */}
        <header className="wa-chat-header">
          <button
            type="button"
            className="wa-header-back-btn"
            onClick={onClose}
            aria-label="Back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>

          <div className="wa-header-avatar">
            <span>{otherPersonInitial}</span>
          </div>

          <div className="wa-header-info">
            <h3 className="wa-header-title">{otherPersonName}</h3>
            <span className="wa-header-status">
              {chatBooking.from} &rarr; {chatBooking.to}
            </span>
          </div>

          <div className="wa-header-actions">
            {openCall && (
              <button
                type="button"
                className="wa-header-icon-btn"
                title="Start Voice Call"
                onClick={() => openCall(chatBooking)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
                </svg>
              </button>
            )}

            <button
              type="button"
              className="wa-header-icon-btn"
              onClick={onClose}
              title="Close"
            >
              &times;
            </button>
          </div>
        </header>

        {/* Sync or Status Notices */}
        {!chatBooking.firestoreId && (
          <div className="wa-chat-notice">
            <span>This booking is saved locally. Sync to request approval from the driver.</span>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={syncOfflineBookingForChat}
            >
              Sync Booking
            </button>
          </div>
        )}
        {chatBooking.firestoreId && chatBooking.status !== "Confirmed" && !isAdmin && !chatBooking.isAdminChat && (
          <div className="wa-chat-notice">
            Waiting for admin/driver confirmation. Chat unlocks upon approval.
          </div>
        )}

        {/* WhatsApp Chat Body / Messages Area */}
        <div className="wa-chat-messages" onClick={() => setContextMenuId(null)}>
          <div className="wa-date-pill">TODAY</div>

          {chatMessages.map((msg) => {
            const isMine = msg.senderId === currentUser?.uid;
            const firstName = getFirstName(msg.senderName);
            const timeStr = formatTime(msg.createdAt);

            return (
              <div
                key={msg.id}
                className={`wa-msg-row ${isMine ? "wa-msg-row--mine" : "wa-msg-row--theirs"}`}
              >
                <div className={`wa-bubble ${isMine ? "wa-bubble--mine" : "wa-bubble--theirs"}`}>

                  {/* Quoted Reply Box */}
                  {msg.replyTo && (
                    <div className="wa-reply-quote">
                      <div className="wa-reply-quote-sender">
                        {getFirstName(msg.replyTo.senderName)}
                      </div>
                      <div className="wa-reply-quote-text">
                        {msg.replyTo.text?.substring(0, 70)}
                        {msg.replyTo.text?.length > 70 ? "…" : ""}
                      </div>
                    </div>
                  )}

                  {/* Sender Name for incoming group-style readability */}
                  {!isMine && (
                    <div className="wa-msg-author">{firstName}</div>
                  )}

                  {/* Photo content */}
                  {msg.imageUrl && (
                    <div className="wa-msg-image-wrap" onClick={() => setPreviewModalImg(msg.imageUrl)}>
                      <img src={msg.imageUrl} alt="Shared attachment" className="wa-msg-image" />
                    </div>
                  )}

                  {/* Audio Voice Note content */}
                  {msg.audioUrl && (
                    <div className="wa-voice-bubble">
                      <button
                        type="button"
                        className="wa-voice-play-btn"
                        onClick={() => togglePlayAudio(msg.id, msg.audioUrl)}
                        aria-label={playingAudioId === msg.id ? "Pause voice note" : "Play voice note"}
                      >
                        {playingAudioId === msg.id ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="4" width="4" height="16" />
                            <rect x="14" y="4" width="4" height="16" />
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        )}
                      </button>

                      <div className="wa-voice-waveform">
                        <div className="wa-voice-bars">
                          <span style={{ height: "14px" }}></span>
                          <span style={{ height: "22px" }}></span>
                          <span style={{ height: "10px" }}></span>
                          <span style={{ height: "18px" }}></span>
                          <span style={{ height: "26px" }}></span>
                          <span style={{ height: "12px" }}></span>
                          <span style={{ height: "19px" }}></span>
                          <span style={{ height: "8px" }}></span>
                        </div>
                        <span className="wa-voice-duration">
                          {msg.audioDuration ? `0:${String(msg.audioDuration).padStart(2, "0")}` : "0:05"}
                        </span>
                      </div>

                      <div className="wa-voice-mic-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Text content / Editing input */}
                  {editingId === msg.id ? (
                    <form onSubmit={submitEdit} className="wa-edit-inline-form">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        autoFocus
                      />
                      <div className="wa-edit-inline-actions">
                        <button type="submit" className="wa-edit-btn-save">Save</button>
                        <button type="button" className="wa-edit-btn-cancel" onClick={cancelEdit}>✕</button>
                      </div>
                    </form>
                  ) : (
                    msg.text && msg.text !== "[Photo]" && msg.text !== "[Voice note]" && (
                      <div className="wa-msg-text">{msg.text}</div>
                    )
                  )}

                  {/* Bubble Metadata: Timestamp, edited flag, double checkmarks */}
                  <div className="wa-bubble-meta">
                    {msg.edited && <span className="wa-edited-text">edited</span>}
                    <span className="wa-msg-time">{timeStr}</span>
                    {isMine && (
                      <span className="wa-checkmarks" title="Delivered">
                        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
                          <path d="M1 5.5L5 9.5L15 1.5" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M5 5.5L9 9.5" stroke="#53bdeb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </div>

                  {/* Options Menu Trigger */}
                  <button
                    type="button"
                    className="wa-msg-options-trigger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuId(contextMenuId === msg.id ? null : msg.id);
                    }}
                    aria-label="Message menu"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="2"/>
                      <circle cx="12" cy="5" r="2"/>
                      <circle cx="12" cy="19" r="2"/>
                    </svg>
                  </button>

                  {/* WhatsApp Context Menu Dropdown */}
                  {contextMenuId === msg.id && (
                    <div className="wa-context-dropdown" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => handleReply(msg)}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                        Reply
                      </button>
                      {isMine && msg.text && msg.text !== "[Photo]" && msg.text !== "[Voice note]" && (
                        <button type="button" onClick={() => startEdit(msg)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Edit
                        </button>
                      )}
                      {isMine && (
                        <button type="button" className="wa-delete-item" onClick={() => handleDelete(msg.id)}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          Delete
                        </button>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* WhatsApp Quoted Reply Bar */}
        {replyTo && (
          <div className="wa-reply-bar">
            <div className="wa-reply-bar-left">
              <span className="wa-reply-bar-sender">Replying to {getFirstName(replyTo.senderName)}</span>
              <span className="wa-reply-bar-text">{replyTo.text?.substring(0, 60)}{replyTo.text?.length > 60 ? "…" : ""}</span>
            </div>
            <button type="button" className="wa-reply-bar-close" onClick={cancelReply}>&times;</button>
          </div>
        )}

        {/* WhatsApp Photo Preview Modal (before sending) */}
        {selectedImage && (
          <div className="wa-image-preview-overlay">
            <div className="wa-image-preview-modal">
              <div className="wa-image-preview-header">
                <span>Send Photo</span>
                <button type="button" onClick={() => setSelectedImage(null)}>&times;</button>
              </div>
              <div className="wa-image-preview-content">
                <img src={selectedImage} alt="Preview" />
              </div>
              <div className="wa-image-preview-footer">
                <input
                  type="text"
                  placeholder="Add a caption…"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendPhoto()}
                  autoFocus
                />
                <button type="button" className="wa-image-send-btn" onClick={handleSendPhoto}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen Photo Lightbox Modal (for viewing in chat) */}
        {previewModalImg && (
          <div className="wa-lightbox-overlay" onClick={() => setPreviewModalImg(null)}>
            <button type="button" className="wa-lightbox-close">&times;</button>
            <img src={previewModalImg} alt="Enlarged view" className="wa-lightbox-img" />
          </div>
        )}

        {/* WhatsApp Bottom Compose Bar */}
        <div className="wa-compose-area">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={handlePhotoPicked}
          />

          {isRecording ? (
            /* Recording active bar */
            <div className="wa-recording-bar">
              <div className="wa-recording-dot"></div>
              <span className="wa-recording-timer">
                {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, "0")}
              </span>
              <span className="wa-recording-hint">Recording audio…</span>

              <button
                type="button"
                className="wa-recording-cancel-btn"
                onClick={cancelRecording}
                title="Cancel recording"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>

              <button
                type="button"
                className="wa-send-mic-btn"
                onClick={stopAndSendRecording}
                title="Send voice note"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              </button>
            </div>
          ) : (
            /* Normal typing bar */
            <form className="wa-compose-form" onSubmit={handleSend}>
              {/* Attachment / Camera button */}
              <button
                type="button"
                className="wa-attach-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Attach photo"
                disabled={chatBooking.status !== "Confirmed" && !isAdmin && !chatBooking.isAdminChat}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>

              {/* Text Input */}
              <input
                type="text"
                className="wa-compose-input"
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Message"
                maxLength={2000}
                disabled={chatBooking.status !== "Confirmed" && !isAdmin && !chatBooking.isAdminChat}
              />

              {/* Toggle: Microphone or Send Arrow */}
              {chatDraft.trim() ? (
                <button
                  type="submit"
                  className="wa-send-btn"
                  title="Send message"
                  disabled={chatBooking.status !== "Confirmed" && !isAdmin && !chatBooking.isAdminChat}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  className="wa-mic-btn"
                  onClick={startRecording}
                  title="Record voice note"
                  disabled={chatBooking.status !== "Confirmed"}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z"/>
                  </svg>
                </button>
              )}
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
