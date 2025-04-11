import React, { useState, useRef, useEffect } from "react";
import { FiMoreVertical } from "react-icons/fi";
import { useAuth } from "../../contexts/AuthContext.jsx";
import CommentSection from "./CommentSection.jsx";
import "../../css/MountainReviewCard.css";
import MountainReviewLikeButton from "./MountainReviewLikeButton.jsx";
import PhotoUploader from "../../components/photoUploader/PhotoUploader";
import { ChevronLeft, ChevronRight } from "lucide-react";

const MountainReviewCard = ({ post, currentUser }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [isEditing, setIsEditing] = useState(false);
  const [editPost, setEditPost] = useState({
    content: post.content,
    mountainsId: post.mountainsId,
    mountainCoursesId: post.mountainCoursesId,
  });
  const { user, isLoggedIn } = useAuth();
  const isAuthor = user?.id === post.usersId;

  const [mountains, setMountains] = useState([]); // 산 목록
  const [courses, setCourses] = useState([]); // 선택된 산의 코스 목록
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMountain, setSelectedMountain] = useState(null); // 선택된 산
  const [selectedCourse, setSelectedCourse] = useState(null); // 선택된 코스
  const [searchMountain, setSearchMountain] = useState(""); // 산 검색
  const [searchCourse, setSearchCourse] = useState(""); // 코스 검색
  const [filteredMountains, setFilteredMountains] = useState([]); // 필터링된 산 목록
  const [filteredCourses, setFilteredCourses] = useState([]); // 필터링된 코스 목록

  // 산 목록 가져오기
  useEffect(() => {
    const fetchMountains = async () => {
      try {
        const response = await fetch("http://localhost:8088/api/mountains");
        if (!response.ok) {
          throw new Error("네트워크 응답이 정상적이지 않습니다.");
        }
        const data = await response.json();
        setMountains(data);
        setFilteredMountains(data);
      } catch (error) {
        console.error("산 목록을 가져오는 데 오류가 발생했습니다.", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMountains();
  }, []);

  // 산 검색 필터링
  useEffect(() => {
    setFilteredMountains(mountains.filter((m) => m.name));
  }, [searchMountain, mountains]);

  useEffect(() => {
    if (selectedMountain) {
      const fetchCourses = async () => {
        try {
          const response = await fetch(
            `http://localhost:8088/api/mountains/${selectedMountain.id}/courses`
          );
          if (!response.ok) {
            throw new Error("네트워크 응답이 정상적이지 않습니다.");
          }
          const data = await response.json();
          console.log("Fetched Courses:", data); // 받은 데이터 확인
          setCourses(data); // 코스 목록 설정
          setFilteredCourses(data); // 필터링된 코스 목록 설정
        } catch (error) {
          console.error("코스를 가져오는 데 오류가 발생했습니다.", error);
          setError(error.message);
        }
      };

      fetchCourses(); // 선택된 산에 맞는 코스 목록 가져오기
    }
  }, [selectedMountain]); // selectedMountain이 변경될 때마다 실행

  // 코스 검색 필터링
  useEffect(() => {
    setFilteredCourses(courses.filter((course) => course.courseName));
  }, [searchCourse, courses]);

  const [photos, setPhotos] = useState([]);

  const photoUploaderRef = useRef();

  const fetchPhotos = async () => {
    try {
      const res = await fetch(
        `http://localhost:8088/api/mountain-reviews/photos/by-review/${post.id}`
      );

      // ✅ 예외 없이 JSON 응답이면 계속 진행
      if (res.ok) {
        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();

          // ✅ 배열이면 그대로 set
          if (Array.isArray(data)) {
            setPhotos(data);
          } else {
            console.warn("예상치 못한 데이터 형식:", data);
            setPhotos([]); // fallback 처리
          }
        } else {
          const text = await res.text();
          console.warn("예상치 못한 응답 형식:", text);
          setPhotos([]); // fallback
        }
      } else {
        // ✅ 실패 응답이어도 사진만 없는 거니까 무시하고 빈 배열 처리
        const errorText = await res.text();
        console.warn("사진 없음 또는 조회 실패 (무시 가능):", errorText);
        setPhotos([]); // 사진이 없는 경우에도 정상 처리
      }
    } catch (error) {
      console.error("fetchPhotos 중 에러:", error);
      setPhotos([]); // 네트워크 오류 등도 안전하게 처리
    }
  };

  useEffect(() => {
    if (post?.id) {
      fetchPhotos();
    }
  }, [post?.id]);

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setShowOptions(false);
  };

  const handleEditChange = (e) => {
    setEditPost({ ...editPost, content: e.target.value });
  };

  //  게시물 수정
  const handleEditSubmit = async (e) => {
    e.preventDefault();

    const updatedPost = {
      id: post.id,
      mountains_id: selectedMountain?.id ?? editPost.mountainsId,
      mountain_courses_id: selectedCourse?.id ?? editPost.mountainCoursesId,
      content: editPost.content,
    };

    const files = photoUploaderRef.current.getFiles(); // 새로 추가된 파일들
    const existingServerPhotoNames = photoUploaderRef.current.getServerPhotos(); // 기존에 남긴 서버 사진들

    try {
      // 1. 게시글 내용 수정 (사진 제외)
      await fetch(`http://localhost:8088/api/mountain-reviews/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedPost),
      });

      //  2. 이미지 업로드 및 서버 사진 정보 같이 전송
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append("photos", file));
        existingServerPhotoNames.forEach((name) =>
          formData.append("existingPhotoNames", name)
        );
        formData.append("reviewsId", post.id);

        await fetch(
          `http://localhost:8088/api/mountain-reviews/photos/upload`,
          {
            method: "POST",
            body: formData,
          }
        );
      }

      alert("게시물이 수정되었습니다!");
      setIsEditing(false);
      fetchPhotos(); // 수정 후 사진 다시 로딩

      window.location.reload();
    } catch (error) {
      console.error("게시물 수정 실패:", error);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    try {
      await fetch(
        `http://localhost:8088/api/mountain-reviews/photos/by-photo/${photoId}`,
        {
          method: "DELETE",
        }
      );
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      console.error("사진 삭제 실패:", err);
    }
  };

  //  게시물 삭제
  const handleDelete = async () => {
    const confirmed = window.confirm("정말 삭제하시겠습니까?");
    if (!confirmed) return;

    try {
      await fetch(`http://localhost:8088/api/mountain-reviews/${post.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usersId: user.id }),
      });

      alert("게시물이 삭제되었습니다.");
      window.location.reload();
    } catch (error) {
      console.error("게시물 삭제 중 오류 발생:", error);
    }
  };

  //  상대적 시간 계산
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

  const [isExpanded, setIsExpanded] = useState(false);

  //  더보기
  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  //  사진 페이지네이션
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mReview-card-wrapper">
      <div className="mReview-post-card">
        {isAuthor && (
          <div className="mReview-card-options">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowOptions((prev) => !prev);
              }}
              className="mReview-card-options-button"
            >
              <FiMoreVertical />
            </button>

            {showOptions && (
              <div className="mReview-card-dropdown">
                <button onClick={handleEditClick}>수정</button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        )}

        {isEditing ? (
          <form className="mReview-edit-form" onSubmit={handleEditSubmit}>
            <input
              type="text"
              placeholder="산 이름 검색"
              value={searchMountain}
              onChange={(e) => {
                const keyword = e.target.value;
                setSearchMountain(keyword);
                setFilteredMountains(
                  mountains.filter((m) =>
                    m.name.toLowerCase().includes(keyword.toLowerCase())
                  )
                );
              }}
            />
            <ul>
              {filteredMountains.map((m) => (
                <li
                  key={m.id}
                  className={selectedMountain?.id === m.id ? "selected" : ""}
                  onClick={() => {
                    setSelectedMountain(m);
                    setSearchMountain(m.name);
                    setFilteredMountains([]);
                  }}
                >
                  {m.name} ({m.location})
                </li>
              ))}
            </ul>

            {selectedMountain && (
              <>
                <input
                  type="text"
                  placeholder="코스 검색"
                  value={searchCourse}
                  onChange={(e) => {
                    const keyword = e.target.value;
                    setSearchCourse(keyword);
                    setFilteredCourses(
                      courses.filter((c) =>
                        c.course_name
                          .toLowerCase()
                          .includes(keyword.toLowerCase())
                      )
                    );
                  }}
                />
                <ul>
                  {filteredCourses.map((c) => (
                    <li
                      key={c.id}
                      className={selectedCourse?.id === c.id ? "selected" : ""}
                      onClick={() => {
                        setSelectedCourse(c);
                        setSearchCourse(c.courseName);
                        setFilteredCourses([]);
                      }}
                    >
                      {c.courseName} ({c.difficultyLevel})
                    </li>
                  ))}
                </ul>
              </>
            )}

            <PhotoUploader
              ref={photoUploaderRef}
              initialPhotos={photos}
              onChange={() => {}}
              onDeleteServerPhoto={handleDeletePhoto}
              className="mReview-photo-column-layout"
            />

            <textarea
              value={editPost.content}
              onChange={handleEditChange}
              rows={5}
              required
            />

            <div>
              <button type="submit" className="mReview-submit-button">
                저장
              </button>
              <button
                type="button"
                className="mReview-cancel-button"
                onClick={() => setIsEditing(false)}
              >
                취소
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="mReview-post-header">
              <span className="mReview-post-nickname">{post.nickname}</span>
              <span className="mReview-post-meta">
                {post.name} · {post.courseName} ·{" "}
                {formatRelativeDate(post.updateDate)}
              </span>
            </div>
            <div className="mReview-photo-wrapper">
              <div className="mReview-photo-slider">
                {photos.length > 0 ? (
                  <div className="mReview-photo-slide">
                    <img
                      src={photos[currentIndex].file_path}
                      alt="후기 이미지"
                      className="mReview-photo-img"
                    />
                  </div>
                ) : (
                  <div className="mReview-photo-slide mReview-photo-empty">
                    <span className="mReview-photo-placeholder">사진 없음</span>
                  </div>
                )}

                {photos.length > 1 && (
                  <>
                    <button
                      className="mReview-photo-nav left"
                      onClick={handlePrev}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      className="mReview-photo-nav right"
                      onClick={handleNext}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
              <div className="mReview-photo-pagination">
                {photos.map((_, index) => (
                  <button
                    key={index}
                    className={`mReview-dot ${
                      index === currentIndex ? "active" : ""
                    }`}
                    onClick={() => setCurrentIndex(index)}
                    style={{
                      visibility: photos.length > 1 ? "visible" : "hidden",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className={isExpanded ? "" : "mr-content-preview"}>
              {post.content}
            </div>

            {post.content.length > 75 ? (
              <button onClick={toggleExpanded} className="mr-see-more-btn">
                {isExpanded ? "접기" : "더보기"}
              </button>
            ) : (
              <div className="mr-see-more-btn-placeholder" />
            )}

            <div className="mReview-post-reactions">
              <MountainReviewLikeButton
                reviewId={post.id}
                currentUserId={currentUser?.id}
              />

              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setShowComments((prev) => !prev);
                }}
              >
                <span>
                  💬{" "}
                  {commentCount !== null && commentCount !== undefined
                    ? commentCount
                    : 0}
                </span>
              </span>
            </div>
            {showComments && (
              <CommentSection
                mReviewId={post.id}
                user={user}
                onCommentChange={(newCount) => setCommentCount(newCount)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MountainReviewCard;
