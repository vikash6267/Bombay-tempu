
import {DashboardLayout} from "components/layout/dashboard-layout";

const page = ({params}) => {
  const {id} = params;
  return (
    <DashboardLayout>
      <div>
        <p>{id}</p>
      </div>
    </DashboardLayout>
  );
};

export default page;
