import React, { useState, useEffect, useRef } from "react";
import { FiMoreVertical } from "react-icons/fi";
import ReplyInput from "./ReplyInput";
import "../../css/CommentItem.css";

const CommentItem = ({ comment, user, onCommentUpdate, mReviewId }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [showOptions, setShowOptions] = useState(false);
  const [isContentTruncated, setIsContentTruncated] = useState(true);

  const textareaRef = useRef(null); // ref로 textarea를 다룬다.

  // 자동 높이 조정
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "18px"; // 최소 높이 설정
      textarea.style.height = `${textarea.scrollHeight}px`; // 내용에 맞게 높이 조정
    }
  }, [editContent]); // editContent가 변경될 때마다 실행

  const formatRelativeDate = (date) => {
    const now = new Date();
    const parsedDate = new Date(date.replace(" ", "T"));
    const diffMs = now - parsedDate;
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  };

  // 답글 입력 창 토글
  const handleToggleReplyInput = () => {
    setShowReplyInput((prev) => !prev);
  };

  // 답글 보이기/숨기기 토글
  const handleToggleReplies = () => {
    setShowReplies((prev) => !prev);
  };

  const handleReplySubmit = () => {
    setShowReplyInput(false); // 답장 전송 후 입력창 닫기
    onCommentUpdate(); // 댓글 업데이트 함수 호출
  };

  // 댓글 내용이 3줄 이상일 경우 '...' 표시
  const handleToggleContent = () => {
    setIsContentTruncated((prev) => !prev);
  };

  // 댓글 내용의 길이에 따라 잘라서 보여주기
  const getTruncatedContent = (content) => {
    const maxLength = 55; 
    if (content.length > maxLength && isContentTruncated) {
      return content.substring(0, maxLength) + "..."; // 내용 자르고 '...' 추가
    }
    return content; // 30자 이하일 경우 그대로 출력
  };

  // 수정 시작
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 수정 취소
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(comment.content);
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;

    try {
      await fetch(
        `http://localhost:8088/api/mountain-reviews/comments/${comment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: editContent,
          }),
        }
      );
      setIsEditing(false);
      onCommentUpdate();
    } catch (error) {
      console.error("댓글 수정 실패:", error);
    }
  };

  // 댓글 삭제
  const handleDelete = async () => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;

    try {
      await fetch(
        `http://localhost:8088/api/mountain-reviews/comments/${comment.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usersId: user.id }), // 본인 확인
        }
      );
      onCommentUpdate();
    } catch (error) {
      console.error("댓글 삭제 실패:", error);
    }
  };

  return (
    <div className="mr-comment-item">
      <div className="mr-comment-header">
        <strong>{comment.nickname}</strong>
        <span className="mr-comment-date">
          {formatRelativeDate(comment.update_date)}
        </span>

        {/* 댓글 작성자만 볼 수 있는 수정/삭제 버튼 */}
        {user?.id === comment.users_id && (
          <div className="mr-comment-owner-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions((prev) => !prev);
              }}
              className="mr-comment-more-button"
            >
              <FiMoreVertical />
            </button>

            {/* 수정/삭제 버튼들 */}
            {showOptions && (
              <div>
                {!isEditing ? (
                  <div className="mr-comment-edit-delete-button">
                    <button
                      onClick={handleEdit}
                      className="mr-comment-edit-button"
                    >
                      수정
                    </button>
                    <button
                      className="mr-comment-delete-button"
                      onClick={() => {
                        handleDelete();
                        setShowOptions(false);
                      }}
                    >
                      삭제
                    </button>
                  </div>
                ) : (
                  <div className="mr-comment-save-cancel-button">
                    <button
                      className="mr-comment-save-button"
                      onClick={() => {
                        handleSaveEdit();
                        setShowOptions(false);
                      }}
                    >
                      저장
                    </button>
                    <button
                      className="mr-comment-cancel-button"
                      onClick={() => {
                        handleCancelEdit();
                        setShowOptions(false);
                      }}
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mr-comment-content">
        {isEditing ? (
          <textarea
            ref={textareaRef} // ref 연결
            value={editContent}
            placeholder="수정할 내용을 입력하세요"
            onChange={(e) => setEditContent(e.target.value)}
            className="mr-comment-edit-textarea"
          />
        ) : (
          getTruncatedContent(comment.content)
        )}
      </div>

      {/* 더보기 버튼 */}
      <div className="mr-comment-more-text-box">
      {comment.content.length > 55 && !isEditing && (
        <button
          onClick={handleToggleContent}
          className="mr-comment-more-text-button"
        >
          {isContentTruncated ? "더보기" : "간략히 보기"}
        </button>
      )}
      </div>

      <div className="mr-comment-actions">
        {!comment.parent_id && (
          <button
            onClick={handleToggleReplyInput}
            className="mr-comment-input-button"
          >
            답장쓰기
          </button>
        )}

        {/* "답글 더보기" 버튼 */}
        {comment.replies.length > 0 && (
          <button
            onClick={handleToggleReplies}
            className="mr-comment-hidden-button"
          >
            {showReplies
              ? "답글 숨기기"
              : `답글 ${comment.replies.length}개 더보기`}
          </button>
        )}
      </div>

      {/* 답글 리스트 */}
      {showReplies && (
        <div className="mr-reply-list">
          {comment.replies.map((reply) => (
            <div key={reply.id}>
              <CommentItem
                comment={reply}
                user={user}
                onCommentUpdate={onCommentUpdate}
                mReviewId={mReviewId}
              />
            </div>
          ))}
        </div>
      )}

      {/* 답글 입력 폼 */}
      {showReplyInput && (
        <ReplyInput
          parentId={comment.id}
          mReviewId={mReviewId}
          user={user}
          onReplySubmit={onCommentUpdate}
          handleReplySubmit={handleReplySubmit}
        />
      )}
    </div>
  );
};

export default CommentItem;
