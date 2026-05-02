// frontend/components/ui/Card.tsx
interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 ${className}`}>
      {title && (
        <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
}