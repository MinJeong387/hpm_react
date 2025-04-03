import { useState } from "react";
import RestaurentPosts from "./RestaurantPosts";
import RestaurentComments from "./RestaurantComments";

const RestaurentTab = () => {
  const [subTab, setSubTab] = useState("posts");

  return (
    <div className="restaurent-tab">
      <div className="sub-tab-buttons">
        <button
          className={subTab === "posts" ? "active" : ""}
          onClick={() => setSubTab("posts")}
        >
          내가 쓴 글
        </button>
        <button
          className={subTab === "comments" ? "active" : ""}
          onClick={() => setSubTab("comments")}
        >
          내가 쓴 댓글
        </button>
      </div>

      <div className="sub-tab-content">
        {subTab === "posts" ? <RestaurentPosts /> : <RestaurentComments />}
      </div>
    </div>
  );
};

export default RestaurentTab;
