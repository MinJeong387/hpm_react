import CommuTitle from "./CommuTitle";
import CommuContent from "./CommuContent";
import CommuAuthor from "./CommuAuthor";
import "../../../css/CommuCard.css";

const CommuCard = ({ title, content, author }) => {
  return (
    <div className="commu-card">
      <CommuTitle title={title} />
      <CommuContent content={content} />
      <CommuAuthor author={author} />
    </div>
  );
};

export default CommuCard;
