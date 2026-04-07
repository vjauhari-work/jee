import { useState, useEffect, useRef } from "react";

interface Props {
  initialSeconds: number;
  onTimeUp: () => void;
}

export default function Timer({ initialSeconds, onTimeUp }: Props) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUpRef.current();
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUpRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const isLow = seconds < 300; // less than 5 minutes

  return (
    <div
      style={{
        background: isLow ? "#3a1a1a" : "#1a1a2e",
        color: isLow ? "#ff6b6b" : "#e0e0e0",
        padding: "8px 16px",
        borderRadius: 8,
        fontWeight: "bold",
        fontSize: 16,
        fontFamily: "monospace",
        border: `1px solid ${isLow ? "#ff6b6b" : "#2a2a4a"}`,
      }}
    >
      {String(hours).padStart(2, "0")}:{String(mins).padStart(2, "0")}:
      {String(secs).padStart(2, "0")}
    </div>
  );
}
