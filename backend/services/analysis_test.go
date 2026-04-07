package services

import (
	"testing"

	"github.com/vjauhari-work/jee/backend/models"
)

func TestWeakTopicDetection(t *testing.T) {
	breakdown := map[string]models.TopicScore{
		"Mechanics":      {Correct: 4, Total: 5}, // 80% — strong
		"Thermodynamics": {Correct: 1, Total: 5}, // 20% — weak
		"Optics":         {Correct: 2, Total: 4}, // 50% — borderline, not weak
	}

	var weakTopics []string
	for topic, ts := range breakdown {
		if ts.Total > 0 && float64(ts.Correct)/float64(ts.Total) < 0.5 {
			weakTopics = append(weakTopics, topic)
		}
	}

	if len(weakTopics) != 1 {
		t.Errorf("expected 1 weak topic, got %d: %v", len(weakTopics), weakTopics)
	}
	if len(weakTopics) == 1 && weakTopics[0] != "Thermodynamics" {
		t.Errorf("expected Thermodynamics as weak topic, got %s", weakTopics[0])
	}
}
