import React, { FC } from "react";

interface FormItemProps {
  label: string;
value: string | number;
}

const FormItem: FC<FormItemProps> = ({ label, value }) => {
  return (
    <div className="flex gap-3 items-center">
      <h6 className="text-gray-500 font-medium text-xs md:text-sm ">
        {label}:
      </h6>
      <p className="font-medium text-sm md:text-base">{value}</p>
    </div>
  );
};

export default FormItem;
