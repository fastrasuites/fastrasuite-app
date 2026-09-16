// components/form/Form.tsx
"use client";

import React from "react";

interface FormProps {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  children: React.ReactNode;
  className?: string;
}

const Form = ({ onSubmit, children, className = "" }: FormProps) => {
  return (
    <form onSubmit={onSubmit} className={` w-full bg-white ${className}`}>
      {children}
    </form>
  );
};

export default Form;
