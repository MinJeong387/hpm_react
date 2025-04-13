import React, { useState } from "react";
import "../../styles/pages/communityReplyItem.css";

const ReplyItem = ({ reply, user, onReplyUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);

  // 답글 수정 저장
  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;

    try {
      await fetch(
        `http://localhost:8088/api/communities/comments/replies/${reply.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: editContent }),
        }
      );
      setIsEditing(false);
      onReplyUpdate();
    } catch (error) {
      console.error("답글 수정 실패:", error);
    }
  };

  // 답글 삭제
  const handleDelete = async () => {
    if (!window.confirm("답글을 삭제하시겠습니까?")) return;

    try {
      await fetch(
        `http://localhost:8088/api/communities/comments/replies/${reply.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ usersId: user.id }),
        }
      );
      onReplyUpdate();
    } catch (error) {
      console.error("답글 삭제 실패:", error);
    }
  };

  return (
    <div className="community-reply">
      {/* 닉네임 + 작성자 배지 */}
      <div className="community-reply-header">
        <span className="community-reply-nickname">{reply.nickname}</span>
        {user?.id === reply.users_id && (
          <span className="community-reply-author-badge">작성자</span>
        )}
      </div>

      {/* 답글 수정 중일 경우 */}
      {isEditing ? (
        <div className="community-reply-edit-wrapper">
          <textarea
            className="community-reply-textarea"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <div className="community-reply-edit-buttons">
            <button
              className="community-reply-edit-button"
              onClick={handleSaveEdit}
            >
              수정 완료
            </button>
            <button
              className="community-reply-edit-button"
              onClick={() => setIsEditing(false)}
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 답글 내용 */}
          <p className="community-reply-content">{reply.content}</p>

          {/* 답글 작성일 */}
          <span className="community-comment-updateDate">
            {new Date(reply.update_date).toLocaleString()}
          </span>

          {/* 수정/삭제 버튼 */}
          {user?.id === reply.users_id && (
            <div className="community-reply-buttons">
              <button
                className="community-replies-edit-delete-button"
                onClick={() => setIsEditing(true)}
              >
                수정
              </button>
              <button
                className="community-replies-edit-delete-button"
                onClick={handleDelete}
              >
                삭제
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReplyItem;
