import TemplateOutcome from "./Template/TemplateOutcome";
import Outcome from "./Outcome";

const Balancer = () => {
  const user_id = localStorage.getItem("user_id");
  return user_id == 2545 ? <TemplateOutcome /> : <Outcome />;
};

export default Balancer;
