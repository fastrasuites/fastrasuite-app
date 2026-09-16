// components/form/FormSubmitButton.tsx
interface SubmitProps {
  label: string;
  className?: string;
}

const FormSubmitButton = ({ label, className = "" }: SubmitProps) => (
  <button
    type="submit"
    className={`bg-blue-600 text-white py-2 px-4 rounded font-semibold ${className}`}
  >
    {label}
  </button>
);

export default FormSubmitButton;
