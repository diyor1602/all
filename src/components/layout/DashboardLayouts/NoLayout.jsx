import BaseLayout from "./BaseLayout";

const navigation = [];

export default function NoLayout({ children }) {
  return <BaseLayout navigation={navigation}>{children}</BaseLayout>;
}
