import { TopicScore } from "../types";

interface Props {
  breakdown: Record<string, TopicScore>;
  weakTopics: string[];
}

export default function TopicBreakdown({ breakdown, weakTopics }: Props) {
  const topics = Object.entries(breakdown).sort(
    ([, a], [, b]) => {
      const pctA = a.total > 0 ? a.correct / a.total : 0;
      const pctB = b.total > 0 ? b.correct / b.total : 0;
      return pctB - pctA;
    }
  );

  return (
    <div>
      {topics.map(([topic, score]) => {
        const pct = score.total > 0 ? (score.correct / score.total) * 100 : 0;
        const isWeak = weakTopics.includes(topic);

        return (
          <div key={topic} style={styles.row}>
            <div style={styles.topicName}>
              {topic}
              {isWeak && <span style={styles.weakBadge}>Weak</span>}
            </div>
            <div style={styles.barContainer}>
              <div
                style={{
                  ...styles.bar,
                  width: `${pct}%`,
                  background: isWeak ? "#ff6b6b" : "#4a9a4a",
                }}
              />
            </div>
            <div style={styles.score}>
              {score.correct}/{score.total} ({Math.round(pct)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  row: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  topicName: {
    width: 160,
    color: "#e0e0e0",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  weakBadge: {
    background: "#3a1a1a",
    color: "#ff6b6b",
    padding: "2px 6px",
    borderRadius: 4,
    fontSize: 10,
    fontWeight: "bold",
  },
  barContainer: {
    flex: 1,
    height: 12,
    background: "#0d0d1a",
    borderRadius: 6,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 6,
    transition: "width 0.3s ease",
  },
  score: {
    width: 100,
    textAlign: "right",
    color: "#888",
    fontSize: 12,
  },
};
