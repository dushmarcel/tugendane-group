import { useState } from "react";

export default function TripChatModal({
  chatBooking,
  onClose,
  currentUser,
  syncOfflineBookingForChat,
  chatMessages,
  chatDraft,
  setChatDraft,
  sendChatMessage,
  onEditMessage,
  onDeleteMessage,
}) {
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [contextMenuId, setContextMenuId] = useState(null);

  if (!chatBooking) return null;

  function getFirstName(fullName) {
    if (!fullName) return "User";
    return fullName.split(" ")[0];
  }

  function startEdit(message) {
    setEditingId(message.id);
    setEditText(message.text);
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

  function handleDelete(messageId) {
    if (onDeleteMessage) {
      onDeleteMessage(messageId);
    }
    setContextMenuId(null);
  }

  function handleReply(message) {
    setReplyTo(message);
    setContextMenuId(null);
  }

  function cancelReply() {
    setReplyTo(null);
  }

  function handleSendWithReply(e) {
    e.preventDefault();
    sendChatMessage(e, replyTo);
    setReplyTo(null);
  }

  return (
    <div className="modal-backdrop">
      <section
        className="modal-window trip-chat"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trip-chat-title"
      >
        <button
          className="modal-close-btn"
          type="button"
          aria-label="Close chat"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 id="trip-chat-title">
          Trip chat · {chatBooking.from} → {chatBooking.to}
        </h2>
        {!chatBooking.firestoreId && (
          <div className="chat-sync-notice">
            <strong>This booking is saved on this phone.</strong>
            <span>
              Sync it to send the request to the driver. The driver must approve before messaging opens.
            </span>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={syncOfflineBookingForChat}
            >
              Sync booking &amp; request approval
            </button>
          </div>
        )}
        {chatBooking.firestoreId && chatBooking.status !== "Confirmed" && (
          <div className="chat-sync-notice">
            Waiting for the driver to approve this booking. You can write a draft now; sending and chat history open after approval.
          </div>
        )}
        <div className="trip-chat-messages" aria-live="polite" onClick={() => setContextMenuId(null)}>
          {chatMessages.map((message) => {
            const isMine = message.senderId === currentUser?.uid;
            const firstName = getFirstName(message.senderName);

            return (
              <div
                key={message.id}
                className={`trip-chat-message ${isMine ? "mine" : ""}`}
              >
                {/* Reply reference */}
                {message.replyTo && (
                  <div className="chat-reply-ref">
                    <span className="chat-reply-ref-name">↩ {getFirstName(message.replyTo.senderName)}</span>
                    <span className="chat-reply-ref-text">{message.replyTo.text?.substring(0, 60)}{message.replyTo.text?.length > 60 ? "…" : ""}</span>
                  </div>
                )}

                <strong>{firstName}</strong>

                {editingId === message.id ? (
                  <form onSubmit={submitEdit} className="chat-edit-form">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      autoFocus
                      maxLength={2000}
                    />
                    <div className="chat-edit-actions">
                      <button type="submit" className="btn btn-sm btn-primary">Save</button>
                      <button type="button" className="btn btn-sm btn-secondary" onClick={cancelEdit}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <div>{message.text}</div>
                )}

                {message.edited && <span className="chat-edited-label">(edited)</span>}

                {/* Long-press / context action buttons */}
                {isMine && editingId !== message.id && (
                  <button
                    type="button"
                    className="chat-msg-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setContextMenuId(contextMenuId === message.id ? null : message.id);
                    }}
                    aria-label="Message options"
                  >
                    ⋯
                  </button>
                )}

                {!isMine && editingId !== message.id && (
                  <button
                    type="button"
                    className="chat-msg-reply-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReply(message);
                    }}
                    aria-label="Reply"
                  >
                    ↩
                  </button>
                )}

                {contextMenuId === message.id && (
                  <div className="chat-context-menu" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleReply(message)}>Reply</button>
                    <button onClick={() => startEdit(message)}>Edit</button>
                    <button onClick={() => handleDelete(message.id)} className="chat-delete-btn">Delete</button>
                  </div>
                )}
              </div>
            );
          })}
          {chatMessages.length === 0 && (
            <p className="modal-subtitle">No messages yet. Say hello to coordinate this pickup.</p>
          )}
        </div>

        {/* Reply indicator */}
        {replyTo && (
          <div className="chat-reply-bar">
            <div className="chat-reply-bar-content">
              <span className="chat-reply-bar-name">Replying to {getFirstName(replyTo.senderName)}</span>
              <span className="chat-reply-bar-text">{replyTo.text?.substring(0, 50)}{replyTo.text?.length > 50 ? "…" : ""}</span>
            </div>
            <button type="button" className="chat-reply-bar-close" onClick={cancelReply}>&times;</button>
          </div>
        )}

        <form className="trip-chat-compose" onSubmit={handleSendWithReply}>
          <input
            type="text"
            value={chatDraft}
            onChange={(e) => setChatDraft(e.target.value)}
            placeholder="Write a message…"
            maxLength={2000}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={!chatBooking.firestoreId || chatBooking.status !== "Confirmed" || !chatDraft.trim()}
          >
            {chatBooking.status === "Confirmed" ? "Send" : "After approval"}
          </button>
        </form>
      </section>
    </div>
  );
}
