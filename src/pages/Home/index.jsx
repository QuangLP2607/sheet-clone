import classNames from "classnames/bind";
import Sheet from "@/components/Sheet";
import styles from "./home.module.scss";

const cx = classNames.bind(styles);

export default function Home() {
  return (
    <div className={cx("wrapper")}>
      <Sheet />
    </div>
  );
}
