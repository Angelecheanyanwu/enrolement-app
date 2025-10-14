import HomeLayout from "@/components/Form";
import React, { FC, ReactNode } from "react";

const layout: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div>
      <HomeLayout children={children} />
    </div>
  );
};

export default layout;
