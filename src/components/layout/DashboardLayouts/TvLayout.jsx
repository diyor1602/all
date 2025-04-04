import BaseLayout from "./BaseLayout";

const navigation = [];

export default function TvLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
