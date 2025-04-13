import React, { useEffect, useState } from "react";
import CommentInput from "./CommentInput";
import CommentItem from "./CommentItem";
import "../../styles/pages/communityCommentSection.css";

const CommentSection = ({ communityId, user, onCommentChange }) => {
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");

  // 댓글 데이터를 트리 구조로 변환하는 함수
  const nestComments = (comments) => {
    const map = {};
    const roots = [];

    // 각 댓글을 map에 추가하고 replies 배열을 초기화
    comments.forEach((comment) => {
      map[comment.id] = { ...comment, replies: [] };
    });

    // 댓글과 답글을 parent_id를 기준으로 트리 구조로 연결
    comments.forEach((comment) => {
      if (comment.parent_id) {
        // 부모 댓글에 답글을 추가
        map[comment.parent_id].replies.push(map[comment.id]);
      } else {
        // 최상위 댓글이라면 roots에 추가
        roots.push(map[comment.id]);
      }
    });

    return roots; // 최상위 댓글들만 반환
  };

  const fetchComments = async () => {
    try {
      const res = await fetch(
        `http://localhost:8088/api/communities/${communityId}/comments`
      );
      const data = await res.json();

      const formattedComments = nestComments(data);

      setComments(formattedComments);
      onCommentChange(data.length);
    } catch (err) {
      console.error("댓글 불러오기 실패:", err);
    }
  };

  // 날짜를 "yyyy-MM-dd HH:mm:ss" 형식으로 변환하는 함수
  const formatDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`; // 초까지 포함된 형식
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    if (!user) {
      alert("로그인 후 댓글을 작성할 수 있습니다.");
      return;
    }

    const comment = {
      content,
      users_id: user.id,
      communities_id: communityId,
      parent_id: null,
      update_date: formatDate(new Date()),
    };

    console.log("보낼 댓글 데이터:", comment); // 이거 추가!!

    try {
      const res = await fetch(
        `http://localhost:8088/api/communities/${communityId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(comment),
        }
      );
      if (!res.ok) throw new Error("댓글 등록 실패");

      setContent("");
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [communityId]);

  return (
    <div className="community-comments">
      {comments.length === 0 && (
        <div className="community-no-comments">첫 댓글을 남겨보세요</div>
      )}
      <ul>
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            user={user}
            onCommentUpdate={fetchComments}
            communityId={communityId}
          />
        ))}
      </ul>
      <CommentInput
        content={content}
        setContent={setContent}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default CommentSection;
